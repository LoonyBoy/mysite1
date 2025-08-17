/**
 * Mobile Modal Animation Optimizer
 * 
 * Optimizes modal opening/closing animations specifically for mobile devices
 * with better easing functions, timing, and staggered animations.
 * 
 * Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3
 */

import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

class MobileModalAnimations {
  constructor() {
    this.isMobile = this.detectMobileDevice()
    this.performanceLevel = this.detectPerformanceLevel()
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    // Mobile-optimized timing and easing
    this.mobileTimings = {
      modalOpen: this.isMobile ? 0.4 : 0.6,
      modalClose: this.isMobile ? 0.3 : 0.5,
      contentStagger: this.isMobile ? 0.08 : 0.12,
      backgroundFade: this.isMobile ? 0.25 : 0.35
    }
    
    // Mobile-optimized easing functions
    this.mobileEasing = {
      modalOpen: this.isMobile ? 'power2.out' : 'power3.out',
      modalClose: this.isMobile ? 'power2.in' : 'power2.inOut',
      contentIn: this.isMobile ? 'back.out(1.2)' : 'back.out(1.7)',
      contentOut: this.isMobile ? 'power2.in' : 'power2.out'
    }
    
    // Performance-based settings
    this.animationSettings = this.getPerformanceSettings()
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
   * Detect device performance level for animation optimization
   */
  detectPerformanceLevel() {
    try {
      // Check hardware concurrency (CPU cores)
      const cores = navigator.hardwareConcurrency || 2
      
      // Check memory (if available)
      const memory = navigator.deviceMemory || 4
      
      // Check connection speed (if available)
      const connection = navigator.connection
      const effectiveType = connection?.effectiveType || '4g'
      
      // Performance scoring
      let score = 0
      if (cores >= 8) score += 3
      else if (cores >= 4) score += 2
      else if (cores >= 2) score += 1
      
      if (memory >= 8) score += 3
      else if (memory >= 4) score += 2
      else if (memory >= 2) score += 1
      
      if (effectiveType === '4g') score += 2
      else if (effectiveType === '3g') score += 1
      
      if (score >= 6) return 'high'
      if (score >= 3) return 'medium'
      return 'low'
    } catch (error) {
      console.warn('Error detecting performance level:', error)
      return 'medium'
    }
  }

  /**
   * Get performance-optimized animation settings
   */
  getPerformanceSettings() {
    const settings = {
      high: {
        enableBlur: true,
        enableShadows: true,
        enableParticles: true,
        maxStaggerItems: 20,
        complexEasing: true
      },
      medium: {
        enableBlur: true,
        enableShadows: false,
        enableParticles: true,
        maxStaggerItems: 10,
        complexEasing: true
      },
      low: {
        enableBlur: false,
        enableShadows: false,
        enableParticles: false,
        maxStaggerItems: 5,
        complexEasing: false
      }
    }
    
    return settings[this.performanceLevel] || settings.medium
  }

  /**
   * Optimized modal opening animation for mobile
   */
  animateModalOpen(cardElement, modalContent, options = {}) {
    const {
      onComplete = () => {},
      enableStagger = true,
      customDuration = null
    } = options

    if (this.prefersReducedMotion) {
      // Instant transition for reduced motion
      gsap.set(cardElement, { 
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1001
      })
      
      if (modalContent) {
        gsap.set(modalContent, { opacity: 1 })
      }
      
      onComplete()
      return Promise.resolve()
    }

    const duration = customDuration || this.mobileTimings.modalOpen
    const easing = this.mobileEasing.modalOpen
    
    // Create main timeline
    const tl = gsap.timeline({
      defaults: { 
        ease: easing,
        duration: duration
      },
      onComplete
    })

    // Store initial state for Flip animation
    const state = Flip.getState(cardElement)
    
    // Apply final state
    cardElement.classList.add('is-open')
    
    // Mobile-optimized Flip animation
    Flip.from(state, {
      duration: duration,
      ease: easing,
      scale: this.isMobile,
      simple: this.performanceLevel === 'low',
      onComplete: () => {
        // Animate modal content after card expansion
        if (modalContent && enableStagger) {
          this.animateModalContentIn(modalContent)
        }
      }
    })

    return tl
  }

  /**
   * Staggered animation for modal content on mobile
   */
  animateModalContentIn(modalContent) {
    if (!modalContent) return

    // Find animatable elements
    const elements = modalContent.querySelectorAll([
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'div', 'img', 'button', 'a',
      '.pricing-card', '.project-card', '.about-section'
    ].join(', '))

    if (elements.length === 0) return

    // Limit elements based on performance
    const maxElements = Math.min(elements.length, this.animationSettings.maxStaggerItems)
    const elementsToAnimate = Array.from(elements).slice(0, maxElements)

    // Set initial state
    gsap.set(elementsToAnimate, {
      opacity: 0,
      y: this.isMobile ? 20 : 30,
      scale: 0.95
    })

    // Staggered animation
    const staggerDelay = this.mobileTimings.contentStagger
    const easing = this.animationSettings.complexEasing ? 
      this.mobileEasing.contentIn : 'power2.out'

    gsap.to(elementsToAnimate, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: this.isMobile ? 0.4 : 0.6,
      ease: easing,
      stagger: {
        amount: staggerDelay * elementsToAnimate.length,
        from: 'start'
      },
      delay: 0.1
    })

    // Special animations for specific content types
    this.animateSpecialElements(modalContent)
  }

  /**
   * Special animations for specific modal content types
   */
  animateSpecialElements(modalContent) {
    // Animate pricing cards with special effects
    const pricingCards = modalContent.querySelectorAll('.pricing-card')
    if (pricingCards.length > 0) {
      gsap.fromTo(pricingCards, 
        {
          rotationY: this.isMobile ? 5 : 15,
          transformOrigin: 'center center'
        },
        {
          rotationY: 0,
          duration: this.isMobile ? 0.5 : 0.8,
          ease: 'back.out(1.2)',
          stagger: 0.1,
          delay: 0.2
        }
      )
    }

    // Animate project cards with 3D effects (if performance allows)
    const projectCards = modalContent.querySelectorAll('.project-card')
    if (projectCards.length > 0 && this.animationSettings.enableShadows) {
      gsap.fromTo(projectCards,
        {
          rotationX: this.isMobile ? 10 : 20,
          transformOrigin: 'center bottom'
        },
        {
          rotationX: 0,
          duration: this.isMobile ? 0.6 : 0.9,
          ease: 'power3.out',
          stagger: 0.08,
          delay: 0.15
        }
      )
    }

    // Animate images with scale and blur effects
    const images = modalContent.querySelectorAll('img')
    if (images.length > 0) {
      gsap.fromTo(images,
        {
          scale: 0.8,
          filter: this.animationSettings.enableBlur ? 'blur(10px)' : 'none'
        },
        {
          scale: 1,
          filter: 'blur(0px)',
          duration: this.isMobile ? 0.7 : 1.0,
          ease: 'power2.out',
          stagger: 0.1,
          delay: 0.3
        }
      )
    }
  }

  /**
   * Optimized modal closing animation for mobile
   */
  animateModalClose(cardElement, modalContent, options = {}) {
    const {
      onComplete = () => {},
      targetState = null
    } = options

    if (this.prefersReducedMotion) {
      // Instant transition for reduced motion
      cardElement.classList.remove('is-open')
      if (modalContent) {
        gsap.set(modalContent, { opacity: 0 })
      }
      onComplete()
      return Promise.resolve()
    }

    const duration = this.mobileTimings.modalClose
    const easing = this.mobileEasing.modalClose

    // Animate content out first
    if (modalContent) {
      this.animateModalContentOut(modalContent)
    }

    // Store current state and remove modal class
    const state = Flip.getState(cardElement)
    cardElement.classList.remove('is-open')

    // Mobile-optimized reverse Flip animation
    const flipAnimation = Flip.from(state, {
      duration: duration,
      ease: easing,
      scale: this.isMobile,
      simple: this.performanceLevel === 'low',
      onComplete
    })

    return flipAnimation
  }

  /**
   * Staggered animation for modal content exit on mobile
   */
  animateModalContentOut(modalContent) {
    if (!modalContent) return

    const elements = modalContent.querySelectorAll([
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'div', 'img', 'button', 'a',
      '.pricing-card', '.project-card', '.about-section'
    ].join(', '))

    if (elements.length === 0) return

    const maxElements = Math.min(elements.length, this.animationSettings.maxStaggerItems)
    const elementsToAnimate = Array.from(elements).slice(0, maxElements)

    const staggerDelay = this.mobileTimings.contentStagger * 0.5 // Faster exit
    const easing = this.mobileEasing.contentOut

    gsap.to(elementsToAnimate, {
      opacity: 0,
      y: this.isMobile ? -15 : -20,
      scale: 0.95,
      duration: this.isMobile ? 0.25 : 0.35,
      ease: easing,
      stagger: {
        amount: staggerDelay * elementsToAnimate.length,
        from: 'end' // Reverse order for exit
      }
    })
  }

  /**
   * Animate background/overlay elements
   */
  animateBackground(backgroundElement, isOpening = true, options = {}) {
    const { onComplete = () => {} } = options

    if (this.prefersReducedMotion) {
      gsap.set(backgroundElement, { opacity: isOpening ? 1 : 0 })
      onComplete()
      return Promise.resolve()
    }

    const duration = this.mobileTimings.backgroundFade
    const targetOpacity = isOpening ? 1 : 0
    
    return gsap.to(backgroundElement, {
      opacity: targetOpacity,
      duration: duration,
      ease: isOpening ? 'power2.out' : 'power2.in',
      onComplete
    })
  }

  /**
   * Performance monitoring and adaptive quality
   */
  startPerformanceMonitoring() {
    let frameCount = 0
    let lastTime = performance.now()
    let currentFPS = 60

    const monitor = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        currentFPS = frameCount
        frameCount = 0
        lastTime = currentTime
        
        this.adaptAnimationQuality(currentFPS)
      }
      
      requestAnimationFrame(monitor)
    }
    
    requestAnimationFrame(monitor)
  }

  /**
   * Adapt animation quality based on performance
   */
  adaptAnimationQuality(fps) {
    if (fps < 30 && this.performanceLevel !== 'low') {
      console.log('Low FPS detected, reducing animation quality')
      this.performanceLevel = 'low'
      this.animationSettings = this.getPerformanceSettings()
      
      // Reduce global animation speed
      gsap.globalTimeline.timeScale(0.7)
    } else if (fps > 50 && this.performanceLevel === 'low') {
      console.log('Performance improved, restoring animation quality')
      this.performanceLevel = 'medium'
      this.animationSettings = this.getPerformanceSettings()
      
      // Restore normal animation speed
      gsap.globalTimeline.timeScale(1)
    }
  }

  /**
   * Cleanup method for memory management
   */
  cleanup() {
    // Kill any running animations
    gsap.killTweensOf('*')
    
    // Reset global timeline
    gsap.globalTimeline.timeScale(1)
  }
}

export default MobileModalAnimations