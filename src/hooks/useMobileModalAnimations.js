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

export const useMobileModalAnimations = (options = {}) => {
  const animatorRef = useRef(null)
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
      animatorRef.current = new MobileModalAnimations()
      
      if (enablePerformanceMonitoring) {
        animatorRef.current.startPerformanceMonitoring()
      }
      
      setIsReady(true)
      
      // Enhanced performance monitoring
      if (adaptiveQuality) {
        startAdvancedPerformanceMonitoring()
      }
      
    } catch (error) {
      console.error('Failed to initialize MobileModalAnimations:', error)
      setIsReady(false)
    }

    return () => {
      if (autoCleanup && animatorRef.current) {
        animatorRef.current.cleanup()
      }
      setIsReady(false)
    }
  }, [enablePerformanceMonitoring, autoCleanup, adaptiveQuality])

  // Advanced performance monitoring
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
        
        // Adaptive quality adjustment
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

  // Adapt animation quality based on performance
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
    
    // Update animator settings
    if (animatorRef.current.updateSettings) {
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

  // Fallback animations for error cases
  const fallbackOpenAnimation = useCallback((cardElement, onComplete) => {
    console.log('Using fallback open animation')
    
    gsap.set(cardElement, {
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1001
    })
    
    gsap.fromTo(cardElement, 
      { opacity: 0, scale: 0.9 },
      { 
        opacity: 1, 
        scale: 1, 
        duration: 0.3, 
        ease: 'power2.out',
        onComplete: onComplete || (() => {})
      }
    )
    
    return Promise.resolve()
  }, [])

  const fallbackCloseAnimation = useCallback((cardElement, onComplete) => {
    console.log('Using fallback close animation')
    
    gsap.to(cardElement, {
      opacity: 0,
      scale: 0.9,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(cardElement, { clearProps: 'all' })
        if (onComplete) onComplete()
      }
    })
    
    return Promise.resolve()
  }, [])

  // Enhanced background animation with performance optimization
  const animateBackground = useCallback((backgroundElement, isOpening = true, options = {}) => {
    if (!animatorRef.current || !backgroundElement) {
      console.warn('MobileModalAnimations not initialized or backgroundElement missing')
      return Promise.resolve()
    }

    // Skip complex animations on low performance
    if (performanceRef.current.quality === 'low') {
      gsap.set(backgroundElement, { opacity: isOpening ? 1 : 0 })
      if (options.onComplete) options.onComplete()
      return Promise.resolve()
    }

    return animatorRef.current.animateBackground(backgroundElement, isOpening, options)
  }, [])

  // Enhanced stagger animation for modal content
  const animateStaggeredContent = useCallback((elements, options = {}) => {
    if (!elements || elements.length === 0) return Promise.resolve()
    
    const {
      direction = 'in',
      delay = 0,
      onComplete = () => {}
    } = options
    
    const quality = performanceRef.current.quality
    const maxElements = quality === 'low' ? 5 : quality === 'medium' ? 10 : 20
    const elementsToAnimate = Array.from(elements).slice(0, maxElements)
    
    if (direction === 'in') {
      gsap.fromTo(elementsToAnimate,
        {
          opacity: 0,
          y: quality === 'low' ? 10 : 20,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: quality === 'low' ? 0.2 : quality === 'medium' ? 0.3 : 0.4,
          ease: quality === 'low' ? 'power1.out' : 'power2.out',
          stagger: quality === 'low' ? 0.05 : quality === 'medium' ? 0.08 : 0.12,
          delay,
          onComplete
        }
      )
    } else {
      gsap.to(elementsToAnimate, {
        opacity: 0,
        y: quality === 'low' ? -5 : -10,
        scale: 0.95,
        duration: quality === 'low' ? 0.15 : 0.25,
        ease: 'power2.in',
        stagger: {
          amount: quality === 'low' ? 0.05 : 0.1,
          from: 'end'
        },
        delay,
        onComplete
      })
    }
    
    return Promise.resolve()
  }, [])

  // Get enhanced device and performance info
  const getDeviceInfo = useCallback(() => {
    if (!animatorRef.current) return null

    return {
      isMobile: animatorRef.current.isMobile,
      performanceLevel: animatorRef.current.performanceLevel,
      prefersReducedMotion: animatorRef.current.prefersReducedMotion,
      animationSettings: animatorRef.current.animationSettings,
      currentFPS: performanceRef.current.fps,
      currentQuality: performanceRef.current.quality,
      supportsHaptic: !!navigator.vibrate,
      supportsTouch: 'ontouchstart' in window
    }
  }, [])

  // Manual cleanup with enhanced cleanup
  const cleanup = useCallback(() => {
    try {
      if (animatorRef.current) {
        animatorRef.current.cleanup()
      }
      
      // Kill any remaining GSAP animations
      gsap.killTweensOf('*')
      
      setIsReady(false)
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }, [])

  // Force quality change for testing/debugging
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