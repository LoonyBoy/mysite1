import { gsap } from 'gsap'
import deviceDetection from './deviceDetection'

/**
 * MobileAnimationManager
 *
 * Specialized GSAP manager for mobile with aggressive optimizations:
 * - Mobile-first GSAP config (force3D, autoSleep, reduced lag)
 * - Adaptive performance with FPS monitoring and global timeScale tuning
 * - IntersectionObserver-based offscreen pausing of timelines
 * - rAF batching for write operations to minimize layout thrash
 * - Prefer reduced motion when requested by the user/OS
 */
class MobileAnimationManager {
  constructor(options = {}) {
    // Device and preferences
    this.capabilities = deviceDetection.getCapabilities()
    this.isPrimaryTouch = deviceDetection.isPrimaryTouch()
    this.prefersReducedMotion = deviceDetection.prefersReducedMotion()
    this.performanceLevel = deviceDetection.getPerformanceLevel()

    // Options
    this.options = {
      rootMargin: options.rootMargin || '100px',
      threshold: options.threshold ?? 0.01,
      fpsSampleWindow: options.fpsSampleWindow || 500, // ms
      minFrameDelta: options.minFrameDelta || 16,      // ms, guard for background tabs
      // timeScale per level aligns with existing project patterns
      timeScaleLow: options.timeScaleLow ?? 0.7,
      timeScaleMedium: options.timeScaleMedium ?? 0.85,
      timeScaleHigh: options.timeScaleHigh ?? 1,
    }

    // State
    this.timelines = new Map() // key -> { tl, element, offscreen }
    this.observer = null
    this.rafId = null
    this.batchRAF = null
    this.batchQueue = []
    this.fps = 60
    this._frames = []
    this._lastTs = performance.now()
    this._monitoring = false

    // Bindings
    this._intersectionCb = this._intersectionCb.bind(this)
    this._tick = this._tick.bind(this)
    this._processBatch = this._processBatch.bind(this)

    // Init
    this._initializeGSAP()
    this._setupIntersectionObserver()
    this._startPerformanceMonitoring()

    // React to capability changes (orientation/resize)
    deviceDetection.addCapabilityListener(() => {
      this.capabilities = deviceDetection.getCapabilities()
      this.isPrimaryTouch = deviceDetection.isPrimaryTouch()
      this.prefersReducedMotion = deviceDetection.prefersReducedMotion()
      // Re-apply defaults for new context
      this._applyPerformanceOptimizations()
    })
  }

  // ---------- Initialization ----------
  _initializeGSAP() {
    gsap.config({
      force3D: true,
      nullTargetWarn: false,
      autoSleep: this.isPrimaryTouch ? 60 : 120,
      lag: this.isPrimaryTouch ? 0.1 : 0.05
    })

    const baseDuration = this.isPrimaryTouch ? 0.28 : 0.5
    gsap.defaults({
      ease: 'power2.out',
      duration: this.prefersReducedMotion ? Math.min(baseDuration, 0.22) : baseDuration
    })
  }

  _setupIntersectionObserver() {
    try {
      this.observer = new IntersectionObserver(this._intersectionCb, {
        root: null,
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold
      })
    } catch (e) {
      this.observer = null
    }
  }

  // ---------- Public API ----------
  /**
   * Create or replace a timeline associated with a key (DOM element or string)
   * @param {Element|string} key
   * @param {function(gsap.core.Timeline):void} buildFn - callback to populate the timeline
   * @param {object} tlOptions - GSAP timeline options
   * @param {Element|null} observeElement - element to observe for offscreen pausing
   * @returns {gsap.core.Timeline}
   */
  createTimeline(key, buildFn, tlOptions = {}, observeElement = null) {
    this.destroyTimeline(key)

    const tl = gsap.timeline({
      paused: true,
      defaults: {
        ease: this._getOptimalEasingEnter(),
        duration: this._getOptimalDuration()
      },
      ...tlOptions
    })

    if (typeof buildFn === 'function') {
      try { buildFn(tl) } catch (e) { console.warn('Failed to build timeline', e) }
    }

    const rec = { tl, element: observeElement || (key instanceof Element ? key : null), offscreen: false }
    this.timelines.set(key, rec)

    if (rec.element && this.observer) {
      this.observer.observe(rec.element)
    }

    return tl
  }

  /**
   * Play a registered timeline (guarding offscreen state)
   */
  play(key, opts = {}) {
    const rec = this.timelines.get(key)
    if (!rec || !rec.tl) return
    if (rec.offscreen && !opts.force) return
    rec.tl.timeScale(opts.timeScale ?? 1).play()
  }

  pause(key) {
    const rec = this.timelines.get(key)
    if (!rec || !rec.tl) return
    rec.tl.pause()
  }

  stop(key) {
    const rec = this.timelines.get(key)
    if (!rec || !rec.tl) return
    rec.tl.pause(0)
  }

  destroyTimeline(key) {
    const rec = this.timelines.get(key)
    if (!rec) return
    try {
      if (this.observer && rec.element instanceof Element) {
        this.observer.unobserve(rec.element)
      }
      rec.tl?.kill()
    } finally {
      this.timelines.delete(key)
    }
  }

  stopOtherTimelines(exceptKey) {
    this.timelines.forEach((rec, key) => {
      if (key !== exceptKey) {
        try { rec.tl?.pause(0) } catch {}
      }
    })
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    return {
      fps: this.fps,
      performanceLevel: this.performanceLevel,
      timelines: this.timelines.size,
      isPrimaryTouch: this.isPrimaryTouch,
      prefersReducedMotion: this.prefersReducedMotion
    }
  }

  /**
   * Manually override performance level
   */
  setPerformanceLevel(level) {
    if (!['low', 'medium', 'high'].includes(level)) return
    const prev = this.performanceLevel
    this.performanceLevel = level
    if (prev !== level) this._applyPerformanceOptimizations()
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    this._stopPerformanceMonitoring()
    if (this.observer) {
      try {
        this.timelines.forEach(rec => {
          if (rec.element instanceof Element) this.observer.unobserve(rec.element)
        })
      } catch {}
      this.observer.disconnect()
      this.observer = null
    }
    this.timelines.forEach(rec => rec.tl?.kill())
    this.timelines.clear()
    if (this.batchRAF) cancelAnimationFrame(this.batchRAF)
    this.batchRAF = null
    this.batchQueue = []
  }

  // ---------- Internal: Intersection ----------
  _intersectionCb(entries) {
    entries.forEach(entry => {
      // Find records by element
      this.timelines.forEach(rec => {
        if (rec.element === entry.target) {
          rec.offscreen = !entry.isIntersecting
          if (rec.offscreen) {
            try { rec.tl?.pause() } catch {}
          }
        }
      })
    })
  }

  // ---------- Internal: rAF batching ----------
  _schedule(fn) {
    this.batchQueue.push(fn)
    if (!this.batchRAF) {
      this.batchRAF = requestAnimationFrame(this._processBatch)
    }
  }

  _processBatch() {
    const queue = this.batchQueue
    this.batchQueue = []
    this.batchRAF = null
    for (let i = 0; i < queue.length; i++) {
      try { queue[i]() } catch (e) { console.warn('Batch op failed', e) }
    }
  }

  // ---------- Internal: Performance monitoring ----------
  _startPerformanceMonitoring() {
    if (this._monitoring) return
    this._monitoring = true
    this.rafId = requestAnimationFrame(this._tick)
  }

  _stopPerformanceMonitoring() {
    this._monitoring = false
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.rafId = null
    this._frames = []
  }

  _tick(ts) {
    if (!this._monitoring) return
    const delta = ts - this._lastTs
    this._lastTs = ts

    // Ignore large gaps (background tabs) to avoid false lows
    if (delta >= this.options.minFrameDelta) {
      this._frames.push(delta)

      // Remove frames outside the window
      let sum = 0
      for (let i = this._frames.length - 1; i >= 0; i--) {
        sum += this._frames[i]
        if (sum > this.options.fpsSampleWindow) {
          this._frames.splice(0, i)
          break
        }
      }

      // Compute FPS from average delta in sample
      const avgDelta = this._frames.length
        ? this._frames.reduce((a, b) => a + b, 0) / this._frames.length
        : 16.7
      this.fps = Math.max(1, Math.min(120, 1000 / avgDelta))

      this._adjustPerformanceLevel()
    }

    this.rafId = requestAnimationFrame(this._tick)
  }

  _adjustPerformanceLevel() {
    const prev = this.performanceLevel
    if (this.fps < 30) this.performanceLevel = 'low'
    else if (this.fps < 45) this.performanceLevel = 'medium'
    else this.performanceLevel = 'high'

    if (prev !== this.performanceLevel) {
      this._applyPerformanceOptimizations()
    }
  }

  _applyPerformanceOptimizations() {
    switch (this.performanceLevel) {
      case 'low':
        this._applyLow()
        break
      case 'medium':
        this._applyMedium()
        break
      case 'high':
      default:
        this._applyHigh()
        break
    }
  }

  _applyLow() {
    // Aggressive global slowdown for CPU relief (aligned with project baseline 0.7)
    gsap.globalTimeline.timeScale(this.options.timeScaleLow)

    // Simplify easing and shorten per-timeline durations by speeding timelines
    gsap.defaults({ ease: 'none' })
    this.timelines.forEach(rec => {
      try { rec.tl?.timeScale(1.5) } catch {}
    })
  }

  _applyMedium() {
    gsap.globalTimeline.timeScale(this.options.timeScaleMedium)
    gsap.defaults({ ease: 'power1.inOut' })
    this.timelines.forEach(rec => {
      try { rec.tl?.timeScale(1.2) } catch {}
    })
  }

  _applyHigh() {
    gsap.globalTimeline.timeScale(this.options.timeScaleHigh)
    gsap.defaults({ ease: 'power2.inOut' })
    this.timelines.forEach(rec => {
      try { rec.tl?.timeScale(1) } catch {}
    })
  }

  // ---------- Helpers for defaults ----------
  _getOptimalDuration() {
    if (this.prefersReducedMotion) return 0.2
    const base = this.isPrimaryTouch ? 0.28 : 0.5
    switch (this.performanceLevel) {
      case 'low': return Math.max(0.2, base * 0.7)
      case 'medium': return base
      case 'high':
      default: return base * 1.1
    }
  }

  _getOptimalEasingEnter() {
    if (this.prefersReducedMotion) return 'power1.out'
    switch (this.performanceLevel) {
      case 'low': return 'power1.out'
      case 'medium': return 'back.out(1.2)'
      case 'high':
      default: return 'back.out(1.7)'
    }
  }

  _getOptimalEasingExit() {
    if (this.prefersReducedMotion) return 'power1.in'
    switch (this.performanceLevel) {
      case 'low': return 'power1.in'
      case 'medium': return 'power2.in'
      case 'high':
      default: return 'power3.in'
    }
  }
}

export default MobileAnimationManager