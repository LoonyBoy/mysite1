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

class MenuPageMobileModalIntegration {
  constructor() {
    this.mobileAnimator = null
    this.isInitialized = false
    this.performanceMetrics = {
      fps: 60,
      quality: 'high',
      animationCount: 0,
      errorCount: 0
    }
    this.activeAnimations = new Map()
    this.errorHandlers = new Map()
  }

  /**
   * Enhanced initialization with error handling
   */
  initialize() {
    if (this.isInitialized) return
    
    try {
      this.mobileAnimator = new MobileModalAnimations()
      
      // Start performance monitoring
      this.mobileAnimator.startPerformanceMonitoring()
      
      // Setup error handling
      this.setupErrorHandling()
      
      // Setup accessibility features
      this.setupAccessibilityFeatures()
      
      this.isInitialized = true
      
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

    // Disable hover animations on other cards
    try {
      cardRefs.current.forEach((cardEl, i) => {
        if (i !== index && cardEl) {
          cardEl.style.pointerEvents = 'none'
          gsap.set(cardEl, { opacity: 0.3 })
        }
      })
    } catch (error) {
      console.warn('Error disabling other cards:', error)
    }

    // Get modal content for stagger animations
    const modalContent = this.getModalContent(el, index)

    // Use mobile-optimized animation
    try {
      await this.mobileAnimator.animateModalOpen(el, modalContent, {
        enableStagger: true,
        onComplete: () => {
          setOpenedIndex(index)
          
          // Animate global dither background
          this.animateGlobalDither(el, globalDitherRef, true)
          
          onComplete()
        }
      })
    } catch (error) {
      console.error('Error in mobile modal animation:', error)
      
      // Fallback to basic animation
      this.fallbackOpenAnimation(el, index, setOpenedIndex)
    }
  }

  /**
   * Enhanced closeCardFullscreen with mobile optimizations
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
    return {
      isMobile: this.mobileAnimator.isMobile,
      performanceLevel: this.mobileAnimator.performanceLevel,
      prefersReducedMotion: this.mobileAnimator.prefersReducedMotion,
      animationSettings: this.mobileAnimator.animationSettings
    }
  }

  /**
   * Cleanup method
   */
  cleanup() {
    if (this.mobileAnimator) {
      this.mobileAnimator.cleanup()
    }
    this.isInitialized = false
  }
}

// Create singleton instance
const menuPageMobileModalIntegration = new MenuPageMobileModalIntegration()

export default menuPageMobileModalIntegration