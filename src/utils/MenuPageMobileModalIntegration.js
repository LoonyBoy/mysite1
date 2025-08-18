/**
 * Enhanced Mobile Modal Animation Integration for MenuPage
 * 
 * Provides enhanced modal animations specifically optimized for mobile devices
 * to be integrated with the existing MenuPage component with improved error handling,
 * performance monitoring, and accessibility features.
 * 
 * Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3
 */

import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import MobileModalAnimations from './MobileModalAnimations'
import MobileAnimationManager from './MobileAnimationManager'

class MenuPageMobileModalIntegration {
  constructor() {
    this.mobileAnimator = null
    this.manager = null
    this.isInitialized = false
    this.performanceMetrics = {
      fps: 60,
      quality: 'high',
      animationCount: 0,
      errorCount: 0
    }
    this._qualityMonitorCancel = null
    this.activeAnimations = new Map()
    this.errorHandlers = new Map()
  }

  /**
   * Enhanced initialization with error handling
   */
  initialize() {
    if (this.isInitialized) return
    
    try {
      // Initialize mobile GSAP manager (handles global defaults and FPS-based tuning)
      this.manager = new MobileAnimationManager()

      // Initialize modal-specific animator (uses GSAP defaults from manager)
      this.mobileAnimator = new MobileModalAnimations()
      
      // Avoid double performance monitoring on animator when manager is present
      // this.mobileAnimator.startPerformanceMonitoring() // DO NOT CALL to prevent conflicting timeScale adjustments
      
      // Setup error handling
      this.setupErrorHandling()
      
      // Setup accessibility features
      this.setupAccessibilityFeatures()
      
      this.isInitialized = true
      
      // Start adaptive quality monitor that only tweaks animator settings (no global timeScale)
      this._startAdaptiveQualityMonitor()
      
      console.log('Enhanced Mobile Modal Animations initialized:', {
        isMobile: this.mobileAnimator.isMobile,
        performanceLevel: this.mobileAnimator.performanceLevel,
        prefersReducedMotion: this.mobileAnimator.prefersReducedMotion,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Failed to initialize Mobile Modal Animations:', error)
      this.handleInitializationError(error)
    }
  }

  /**
   * Setup comprehensive error handling
   */
  setupErrorHandling() {
    // GSAP error handling
    gsap.config({
      nullTargetWarn: false,
      trialWarn: false
    })

    // Global error handler for animations
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message && event.error.message.includes('gsap')) {
        this.handleAnimationError(event.error)
      }
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('animation')) {
        this.handleAnimationError(event.reason)
        event.preventDefault()
      }
    })
  }

  /**
   * Setup accessibility features
   */
  setupAccessibilityFeatures() {
    // Respect reduced motion preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleReducedMotion = (e) => {
      if (this.mobileAnimator) {
        this.mobileAnimator.prefersReducedMotion = e.matches
        console.log('Reduced motion preference changed:', e.matches)
      }
    }
    
    mediaQuery.addListener(handleReducedMotion)
    handleReducedMotion(mediaQuery)

    // Focus management
    this.setupFocusManagement()
  }

  /**
   * Enhanced focus management for modals
   */
  setupFocusManagement() {
    this.focusableSelectors = [
      'button',
      '[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')
  }

  /**
   * Handle initialization errors with fallbacks
   */
  handleInitializationError(error) {
    console.error('Mobile Modal Integration initialization failed:', error)
    
    // Create minimal fallback animator
    this.mobileAnimator = {
      isMobile: this.detectMobileDevice(),
      performanceLevel: 'low',
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      animateModalOpen: this.fallbackOpenAnimation.bind(this),
      animateModalClose: this.fallbackCloseAnimation.bind(this),
      cleanup: () => {}
    }
    
    this.isInitialized = true
    this.performanceMetrics.quality = 'fallback'
  }

  /**
   * Enhanced mobile device detection
   */
  detectMobileDevice() {
    try {
      const hasTouchStart = 'ontouchstart' in window
      const hasPointerCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
      const hasTouchPoints = navigator.maxTouchPoints > 0
      const hasTouch = navigator.msMaxTouchPoints > 0
      
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      const isMobileUA = mobileRegex.test(navigator.userAgent)
      
      const isSmallScreen = window.screen && (window.screen.width <= 768 || window.screen.height <= 768)
      
      return hasTouchStart || hasPointerCoarse || hasTouchPoints || hasTouch || 
             (isSmallScreen && (hasTouchStart || isMobileUA))
    } catch (error) {
      console.warn('Error in mobile detection:', error)
      return false
    }
  }

  /**
   * Adaptive quality monitor (adjusts only animator settings, not global timeScale)
   */
  _startAdaptiveQualityMonitor() {
    if (this._qualityMonitorCancel) return

    let frameCount = 0
    let lastTime = performance.now()
    let isMonitoring = true

    const adaptAnimationQuality = (quality) => {
      if (!this.mobileAnimator) return
      const settings = {
        low: {
          duration: 0.2,
          ease: 'power1.out',
          enableBlur: false,
          enableShadows: false,
          staggerAmount: 0.05
        },
        medium: {
          duration: 0.26,
          ease: 'power2.out',
          enableBlur: true,
          enableShadows: false,
          staggerAmount: 0.06
        },
        high: {
          duration: 0.32,
          ease: 'back.out(1.2)',
          enableBlur: true,
          enableShadows: true,
          staggerAmount: 0.08
        }
      }
      const cfg = settings[quality] || settings.medium
      try { this.mobileAnimator.updateSettings(cfg) } catch {}
      this.performanceMetrics.quality = quality
    }

    const monitor = () => {
      if (!isMonitoring) return
      
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount
        frameCount = 0
        lastTime = currentTime
        
        this.performanceMetrics.fps = fps
        
        // Adaptive quality thresholds (aligned with hook)
        if (fps < 30 && this.performanceMetrics.quality !== 'low') {
          adaptAnimationQuality('low')
        } else if (fps > 50 && this.performanceMetrics.quality === 'low') {
          adaptAnimationQuality('medium')
        } else if (fps > 55 && this.performanceMetrics.quality === 'medium') {
          adaptAnimationQuality('high')
        }
      }
      
      requestAnimationFrame(monitor)
    }
    
    requestAnimationFrame(monitor)

    this._qualityMonitorCancel = () => {
      isMonitoring = false
      this._qualityMonitorCancel = null
    }
  }

  /**
   * Enhanced openCardFullscreen with mobile optimizations
   */
  async openCardFullscreen(index, cardRefs, options = {}) {
    const {
      setOpenedIndex,
      isModalOpenRef,
      lastOpenModalIndexRef,
      lastHoveredBeforeOpenRef,
      globalDitherRef,
      setParticleSpeed,
      onComplete = () => {}
    } = options

    if (!cardRefs.current || !cardRefs.current[index]) {
      console.warn('Card element not found for index:', index)
      return
    }

    const el = cardRefs.current[index]
    
    // Set modal state
    lastHoveredBeforeOpenRef.current = index
    lastOpenModalIndexRef.current = index
    isModalOpenRef.current = true

    try {
      // Slow down particles for better performance during animation
      if (setParticleSpeed) {
        setParticleSpeed(0.3)
      }
    } catch (error) {
      console.warn('Error setting particle speed:', error)
    }

    // Get modal content
    const modalContent = this.getModalContent(el, index)

    // Animate global dither background in
    this.animateGlobalDither(el, globalDitherRef, true)

    try {
      // Use mobile-optimized opening animation
      await this.mobileAnimator.animateModalOpen(el, modalContent, {
        onComplete: () => {
          setOpenedIndex(index)
          // Disable other cards to avoid accidental interactions
          if (cardRefs.current) {
            cardRefs.current.forEach((cardEl, i) => {
              if (i !== index && cardEl) {
                cardEl.style.pointerEvents = 'none'
                gsap.to(cardEl, { opacity: 0.5, duration: this.mobileAnimator.isMobile ? 0.2 : 0.3 })
              }
            })
          }
          onComplete()
        }
      })
    } catch (error) {
      console.error('Error in mobile modal open animation:', error)
      // Fallback to basic animation
      this.fallbackOpenAnimation(el, index, setOpenedIndex)
    }
  }

  /**
   * Close fullscreen modal with mobile optimizations
   */
  async closeCardFullscreen(index, cardRefs, options = {}) {
    const {
      setOpenedIndex,
      isModalOpenRef,
      lastOpenModalIndexRef,
      globalDitherRef,
      setParticleSpeed,
      onComplete = () => {}
    } = options

    if (!cardRefs.current || !cardRefs.current[index]) {
      console.warn('Card element not found for index:', index)
      return
    }

    const el = cardRefs.current[index]

    try {
      // Restore particle speed
      if (setParticleSpeed) {
        setParticleSpeed(1.0)
      }
    } catch (error) {
      console.warn('Error restoring particle speed:', error)
    }

    // Get modal content
    const modalContent = this.getModalContent(el, index)

    // Animate global dither background out
    this.animateGlobalDither(el, globalDitherRef, false)

    try {
      // Use mobile-optimized closing animation
      await this.mobileAnimator.animateModalClose(el, modalContent, {
        onComplete: () => {
          // Reset modal state
          setOpenedIndex(null)
          lastOpenModalIndexRef.current = null
          isModalOpenRef.current = false

          // Re-enable other cards
          this.enableAllCards(cardRefs)
          
          onComplete()
        }
      })
    } catch (error) {
      console.error('Error in mobile modal close animation:', error)
      
      // Fallback to basic animation
      this.fallbackCloseAnimation(el, index, setOpenedIndex, lastOpenModalIndexRef, isModalOpenRef)
      this.enableAllCards(cardRefs)
    }
  }

  /**
   * Get modal content for stagger animations
   */
  getModalContent(cardElement, index) {
    // Different modal content based on card index
    const modalSelectors = [
      '.about-modal-content, .modal-content', // About modal
      '.projects-modal-content, .modal-content', // Projects modal
      '.services-modal-content, .modal-content', // Services modal
      '.modal-content' // Generic fallback
    ]

    const selector = modalSelectors[index] || modalSelectors[3]
    return cardElement.querySelector(selector)
  }

  /**
   * Animate global dither background
   */
  animateGlobalDither(cardElement, globalDitherRef, isOpening) {
    if (!globalDitherRef?.current) return

    const gd = globalDitherRef.current

    if (isOpening) {
      const rect = cardElement.getBoundingClientRect()
      const clip = this.buildClipFromRect(rect)
      
      gsap.killTweensOf(gd)
      
      // Mobile-optimized dither animation
      const duration = this.mobileAnimator.isMobile ? 0.25 : 0.35
      
      gsap.to(gd, {
        opacity: 1,
        clipPath: clip,
        duration: duration,
        ease: 'power2.out'
      })
    } else {
      // Animate dither out
      const duration = this.mobileAnimator.isMobile ? 0.2 : 0.3
      
      gsap.to(gd, {
        opacity: 0,
        clipPath: 'inset(0 100% 100% 0 round 16px)',
        duration: duration,
        ease: 'power2.in'
      })
    }
  }

  /**
   * Build clip path from element rect
   */
  buildClipFromRect(rect) {
    const viewport = document.documentElement
    const vw = viewport.clientWidth
    const vh = viewport.clientHeight
    const top = Math.max(0, Math.round(rect.top))
    const left = Math.max(0, Math.round(rect.left))
    const right = Math.max(0, Math.round(vw - rect.right))
    const bottom = Math.max(0, Math.round(vh - rect.bottom))
    return `inset(${top}px ${right}px ${bottom}px ${left}px round 16px)`
  }

  /**
   * Re-enable all cards after modal closes
   */
  enableAllCards(cardRefs) {
    try {
      cardRefs.current.forEach((cardEl) => {
        if (cardEl) {
          cardEl.style.pointerEvents = 'auto'
          gsap.to(cardEl, {
            opacity: 1,
            duration: this.mobileAnimator.isMobile ? 0.2 : 0.3,
            ease: 'power2.out'
          })
        }
      })
    } catch (error) {
      console.warn('Error enabling cards:', error)
    }
  }

  /**
   * Fallback animation for when mobile animations fail
   */
  fallbackOpenAnimation(cardElement, index, setOpenedIndex) {
    console.log('Using fallback open animation')
    
    const state = Flip.getState(cardElement)
    cardElement.classList.add('is-open')
    
    Flip.from(state, {
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        setOpenedIndex(index)
      }
    })
  }

  /**
   * Fallback animation for when mobile close animations fail
   */
  fallbackCloseAnimation(cardElement, index, setOpenedIndex, lastOpenModalIndexRef, isModalOpenRef) {
    console.log('Using fallback close animation')
    
    const state = Flip.getState(cardElement)
    cardElement.classList.remove('is-open')
    
    Flip.from(state, {
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        setOpenedIndex(null)
        lastOpenModalIndexRef.current = null
        isModalOpenRef.current = false
      }
    })
  }

  /**
   * Get device and performance information
   */
  getDeviceInfo() {
    const managerMetrics = this.manager?.getPerformanceMetrics?.() || { fps: this.performanceMetrics.fps, performanceLevel: 'medium' }
    return {
      isMobile: this.mobileAnimator?.isMobile ?? false,
      performanceLevel: this.mobileAnimator?.performanceLevel ?? 'medium',
      prefersReducedMotion: this.mobileAnimator?.prefersReducedMotion ?? false,
      animationSettings: this.mobileAnimator?.animationSettings ?? {},
      currentFPS: managerMetrics.fps,
      currentQuality: this.performanceMetrics.quality,
      isReady: this.isInitialized,
      supportsHaptic: typeof navigator !== 'undefined' && !!navigator.vibrate,
      supportsTouch: typeof window !== 'undefined' && ('ontouchstart' in window || (navigator?.maxTouchPoints ?? 0) > 0)
    }
  }

  /**
   * Cleanup method
   */
  cleanup() {
    if (this._qualityMonitorCancel) {
      try { this._qualityMonitorCancel() } catch {}
    }
    if (this.mobileAnimator) {
      this.mobileAnimator.cleanup()
    }
    if (this.manager) {
      try { this.manager.cleanup() } catch {}
    }
    this.manager = null
    this.isInitialized = false
  }
}

// Create singleton instance
const menuPageMobileModalIntegration = new MenuPageMobileModalIntegration()

export default menuPageMobileModalIntegration