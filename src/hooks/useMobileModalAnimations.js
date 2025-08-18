/**
 * Enhanced React Hook for Mobile Modal Animations
 * 
 * Provides optimized modal animations for mobile devices with
 * performance monitoring, adaptive quality, and enhanced touch interactions.
 * 
 * Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3
 */

import { useRef, useEffect, useCallback, useState } from 'react'
import { gsap } from 'gsap'
import MobileModalAnimations from '../utils/MobileModalAnimations'
import MobileAnimationManager from '../utils/MobileAnimationManager'

export const useMobileModalAnimations = (options = {}) => {
  const animatorRef = useRef(null)
  const managerRef = useRef(null)
  const performanceRef = useRef({ fps: 60, quality: 'high' })
  const [isReady, setIsReady] = useState(false)
  
  const {
    enablePerformanceMonitoring = true,
    autoCleanup = true,
    adaptiveQuality = true,
    enableHapticFeedback = true
  } = options

  // Initialize the animation system
  useEffect(() => {
    try {
      // Initialize mobile GSAP manager with aggressive mobile optimizations
      managerRef.current = new MobileAnimationManager()

      // Initialize modal-specific animator (uses GSAP defaults from manager)
      animatorRef.current = new MobileModalAnimations()
      
      // Avoid double performance monitoring on animator when manager is present
      if (enablePerformanceMonitoring) {
        // Manager already starts its own FPS monitoring internally
        // Do NOT call animatorRef.current.startPerformanceMonitoring() to prevent conflicting timeScale adjustments
      }
      
      setIsReady(true)
      
      // Enhanced performance monitoring for adaptive quality presets (timings/easing only)
      if (adaptiveQuality) {
        startAdvancedPerformanceMonitoring()
      }
      
    } catch (error) {
      console.error('Failed to initialize MobileModalAnimations:', error)
      setIsReady(false)
    }

    return () => {
      if (autoCleanup) {
        try { managerRef.current?.cleanup() } catch {}
        try { animatorRef.current?.cleanup() } catch {}
      }
      managerRef.current = null
      animatorRef.current = null
      setIsReady(false)
    }
  }, [enablePerformanceMonitoring, autoCleanup, adaptiveQuality])

  // Advanced performance monitoring (only adjusts animator settings, not global timeScale)
  const startAdvancedPerformanceMonitoring = useCallback(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let isMonitoring = true

    const monitor = () => {
      if (!isMonitoring) return
      
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount
        frameCount = 0
        lastTime = currentTime
        
        performanceRef.current.fps = fps
        
        // Adaptive quality adjustment (only presets inside animator)
        if (fps < 30 && performanceRef.current.quality !== 'low') {
          performanceRef.current.quality = 'low'
          adaptAnimationQuality('low')
        } else if (fps > 50 && performanceRef.current.quality === 'low') {
          performanceRef.current.quality = 'medium'
          adaptAnimationQuality('medium')
        } else if (fps > 55 && performanceRef.current.quality === 'medium') {
          performanceRef.current.quality = 'high'
          adaptAnimationQuality('high')
        }
      }
      
      requestAnimationFrame(monitor)
    }
    
    requestAnimationFrame(monitor)
    
    return () => {
      isMonitoring = false
    }
  }, [])

  // Adapt animation quality based on performance (update animator runtime settings)
  const adaptAnimationQuality = useCallback((quality) => {
    if (!animatorRef.current) return
    
    const settings = {
      low: {
        duration: 0.2,
        ease: 'power1.out',
        enableBlur: false,
        enableShadows: false,
        staggerAmount: 0.05
      },
      medium: {
        duration: 0.3,
        ease: 'power2.out',
        enableBlur: true,
        enableShadows: false,
        staggerAmount: 0.08
      },
      high: {
        duration: 0.4,
        ease: 'power3.out',
        enableBlur: true,
        enableShadows: true,
        staggerAmount: 0.12
      }
    }
    
    const currentSettings = settings[quality] || settings.medium
    
    // Update animator settings if available
    if (typeof animatorRef.current.updateSettings === 'function') {
      animatorRef.current.updateSettings(currentSettings)
    }
    
    console.log(`Animation quality adapted to: ${quality}`, currentSettings)
  }, [])

  // Enhanced modal opening with haptic feedback
  const animateModalOpen = useCallback(async (cardElement, modalContent, options = {}) => {
    if (!animatorRef.current || !cardElement) {
      console.warn('MobileModalAnimations not initialized or cardElement missing')
      return Promise.resolve()
    }

    // Haptic feedback for mobile devices
    if (enableHapticFeedback && navigator.vibrate) {
      try {
        navigator.vibrate(10) // Short vibration
      } catch (error) {
        console.warn('Haptic feedback not available:', error)
      }
    }

    // Enhanced options with performance considerations
    const enhancedOptions = {
      ...options,
      performanceLevel: performanceRef.current.quality,
      enableStagger: performanceRef.current.quality !== 'low',
      customDuration: performanceRef.current.quality === 'low' ? 0.2 : null
    }

    try {
      return await animatorRef.current.animateModalOpen(cardElement, modalContent, enhancedOptions)
    } catch (error) {
      console.error('Error in modal open animation:', error)
      // Fallback to basic animation
      return fallbackOpenAnimation(cardElement, options.onComplete)
    }
  }, [enableHapticFeedback])

  // Enhanced modal closing
  const animateModalClose = useCallback(async (cardElement, modalContent, options = {}) => {
    if (!animatorRef.current || !cardElement) {
      console.warn('MobileModalAnimations not initialized or cardElement missing')
      return Promise.resolve()
    }

    // Enhanced options with performance considerations
    const enhancedOptions = {
      ...options,
      performanceLevel: performanceRef.current.quality,
      customDuration: performanceRef.current.quality === 'low' ? 0.15 : null
    }

    try {
      return await animatorRef.current.animateModalClose(cardElement, modalContent, enhancedOptions)
    } catch (error) {
      console.error('Error in modal close animation:', error)
      // Fallback to basic animation
      return fallbackCloseAnimation(cardElement, options.onComplete)
    }
  }, [])

  // Background animation helper
  const animateBackground = useCallback((backgroundEl, isEntering = true) => {
    if (!backgroundEl) return
    const opacity = isEntering ? 1 : 0
    const duration = isEntering ? 0.25 : 0.2
    gsap.to(backgroundEl, { opacity, duration, ease: 'power1.out' })
  }, [])

  // Staggered content animation helper
  const animateStaggeredContent = useCallback((containerEl, isIn = true) => {
    if (!containerEl) return
    const items = containerEl.querySelectorAll('[data-stagger]')
    if (!items || !items.length) return

    const y = isIn ? 0 : 10
    const opacity = isIn ? 1 : 0

    gsap.to(items, {
      y,
      opacity,
      duration: 0.28,
      ease: isIn ? 'back.out(1.2)' : 'power1.in',
      stagger: 0.06
    })
  }, [])

  // Fallback animations
  const fallbackOpenAnimation = useCallback((cardElement, onComplete) => {
    return new Promise(resolve => {
      gsap.to(cardElement, {
        scale: 1.02,
        duration: 0.18,
        ease: 'power1.out',
        onComplete: () => {
          onComplete && onComplete()
          resolve()
        }
      })
    })
  }, [])

  const fallbackCloseAnimation = useCallback((cardElement, onComplete) => {
    return new Promise(resolve => {
      gsap.to(cardElement, {
        scale: 1,
        duration: 0.14,
        ease: 'power1.in',
        onComplete: () => {
          onComplete && onComplete()
          resolve()
        }
      })
    })
  }, [])

  // Device and performance info
  const getDeviceInfo = useCallback(() => {
    return {
      isMobile: animatorRef.current?.isMobile ?? false,
      performanceLevel: animatorRef.current?.performanceLevel ?? performanceRef.current.quality,
      prefersReducedMotion: animatorRef.current?.prefersReducedMotion ?? false,
      animationSettings: animatorRef.current?.animationSettings ?? {},
      currentFPS: performanceRef.current.fps,
      currentQuality: performanceRef.current.quality,
      isReady,
      supportsHaptic: typeof navigator !== 'undefined' && !!navigator.vibrate,
      supportsTouch: typeof window !== 'undefined' && ('ontouchstart' in window || (navigator?.maxTouchPoints ?? 0) > 0)
    }
  }, [isReady])

  // Cleanup method
  const cleanup = useCallback(() => {
    try { managerRef.current?.cleanup() } catch {}
    try { animatorRef.current?.cleanup() } catch {}
  }, [])

  const setQuality = useCallback((quality) => {
    if (['low', 'medium', 'high'].includes(quality)) {
      performanceRef.current.quality = quality
      adaptAnimationQuality(quality)
    }
  }, [adaptAnimationQuality])

  return {
    animateModalOpen,
    animateModalClose,
    animateBackground,
    animateStaggeredContent,
    getDeviceInfo,
    cleanup,
    setQuality,
    isReady,
    currentPerformance: performanceRef.current
  }
}