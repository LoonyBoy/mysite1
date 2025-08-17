import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(ScrollTrigger, Flip)

/**
 * Enhanced Animation Manager for Menu Page Mobile Animations
 * Provides centralized GSAP timeline management with performance monitoring
 * and adaptive animation quality based on device capabilities
 */
class AnimationManager {
  constructor() {
    this.timelines = new Map()
    this.isTouch = this.detectTouchDevice()
    this.performanceLevel = 'high'
    this.performanceMonitor = null
    this.fps = 60
    this.frameCount = 0
    this.lastTime = performance.now()
    this.isMonitoring = false
    this.lastHoverTime = 0 // For debouncing rapid hover events
    
    // Initialize GSAP configuration for optimal performance
    this.initializeGSAP()
    
    // Start performance monitoring
    this.startPerformanceMonitoring()
  }

  /**
   * Initialize GSAP configuration for mobile optimization
   */
  initializeGSAP() {
    gsap.config({
      force3D: true,
      nullTargetWarn: false,
      autoSleep: this.isTouch ? 60 : 120,
      lag: this.isTouch ? 0.1 : 0.05
    })

    // Set default animation properties for better performance
    gsap.defaults({
      ease: 'power2.out',
      duration: this.isTouch ? 0.3 : 0.6
    })
  }

  /**
   * Detect if device supports touch interactions
   */
  detectTouchDevice() {
    try {
      return (
        typeof window !== 'undefined' && 
        (('ontouchstart' in window) || 
         (window.matchMedia && window.matchMedia('(pointer: coarse)').matches))
      )
    } catch {
      return false
    }
  }

  /**
   * Create timeline for mobile card full-height expansion animation
   * Task 2: Implement Mobile Card Full-Height Expansion
   * @param {number} cardIndex - Index of the card
   * @param {HTMLElement} cardElement - Card DOM element
   * @returns {gsap.core.Timeline} GSAP timeline instance
   */
  createCardTimeline(cardIndex, cardElement) {
    // Kill existing timeline if present
    if (this.timelines.has(cardIndex)) {
      this.timelines.get(cardIndex).kill()
    }

    const tl = gsap.timeline({ 
      paused: true,
      defaults: { 
        ease: this.getOptimalEasing(),
        duration: this.getOptimalDuration()
      }
    })

    try {
      // Store original card properties for restoration
      const originalRect = cardElement.getBoundingClientRect()
      const originalStyles = {
        position: getComputedStyle(cardElement).position,
        top: getComputedStyle(cardElement).top,
        left: getComputedStyle(cardElement).left,
        width: getComputedStyle(cardElement).width,
        height: getComputedStyle(cardElement).height,
        zIndex: getComputedStyle(cardElement).zIndex
      }
      
      // Get viewport dimensions for full-height expansion (Requirements 2.1, 2.2, 2.3)
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth
      
      // Use 100dvh for mobile viewport handling (Requirement 2.4)
      const mobileViewportHeight = this.isTouch ? 
        (window.visualViewport?.height || viewportHeight) : viewportHeight
      
      // Set initial properties for full-height expansion animation
      tl.set(cardElement, {
        willChange: 'transform, position, width, height, z-index, box-shadow, backdrop-filter',
        zIndex: 100, // Proper z-index management during card expansion
        transformOrigin: 'center top'
      })
      
      // Full-height expansion animation from top to bottom of screen (Requirements 2.1, 2.2)
      .to(cardElement, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: this.isTouch ? '100dvh' : `${mobileViewportHeight}px`, // Mobile viewport handling
        duration: this.getOptimalDuration(),
        ease: this.getEnterEasing(),
        onStart: () => {
          // Add mobile expansion class for CSS styling
          cardElement.classList.add('card-mobile-expanded')
        }
      })
      
      // Enhanced shadow and depth effects with proper layering
      .to(cardElement, {
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4), 0 10px 30px rgba(0, 0, 0, 0.2)',
        duration: this.getOptimalDuration() * 0.8,
        ease: 'power2.out'
      }, 0)

      // Animate card content elements with staggered timing and smooth easing
      const titleElement = cardElement.querySelector(`.title-${cardIndex}`)
      const arrowElement = cardElement.querySelector(`.arrow-${cardIndex}`)
      
      if (titleElement) {
        tl.to(titleElement, {
          scale: 1.15,
          y: -25,
          duration: this.getOptimalDuration() * 0.7,
          ease: this.getEnterEasing()
        }, 0.1)
      }
      
      if (arrowElement) {
        tl.to(arrowElement, {
          x: 20,
          rotation: 45,
          scale: 1.3,
          opacity: 0.9,
          yPercent: -50, // Maintain vertical centering
          duration: this.getOptimalDuration() * 0.8,
          ease: this.getEnterEasing()
        }, 0.15)
      }

      // Add subtle background blur effect for depth
      tl.to(cardElement, {
        backdropFilter: 'blur(1px)',
        duration: this.getOptimalDuration() * 0.5,
        ease: 'power2.out'
      }, 0.2)

      // Store original state for restoration and card properties
      tl.originalRect = originalRect
      tl.originalStyles = originalStyles
      tl.cardIndex = cardIndex
      tl.cardElement = cardElement

    } catch (error) {
      console.warn(`Failed to create mobile full-height timeline for card ${cardIndex}:`, error)
      // Return empty timeline as fallback
      return gsap.timeline({ paused: true })
    }

    this.timelines.set(cardIndex, tl)
    return tl
  }

  /**
   * Handle card hover/interaction based on device type with mobile hover disabled
   * Task 2: Mobile cards should not have hover effects - only touch interactions
   * @param {number} cardIndex - Index of the card
   * @param {boolean} isHovering - Whether card is being hovered
   * @param {HTMLElement} cardElement - Card DOM element
   */
  handleCardHover(cardIndex, isHovering, cardElement) {
    // Prevent rapid hover conflicts by debouncing
    const now = Date.now()
    const lastInteraction = this.lastHoverTime || 0
    
    if (now - lastInteraction < 50) {
      // Too rapid, ignore this interaction
      return
    }
    
    this.lastHoverTime = now
    
    // On mobile devices, disable hover effects completely
    if (this.isTouch) {
      // Mobile devices should not respond to hover events
      // Only touch interactions (tap/click) should trigger animations
      return
    }
    
    // Only handle mouse hover on desktop devices
    return this.handleMouseHover(cardIndex, isHovering, cardElement)
  }

  /**
   * Handle mouse hover interactions for desktop with mobile full-height expansion
   * Task 2: Implement Mobile Card Full-Height Expansion - Desktop hover support
   * @param {number} cardIndex - Index of the card
   * @param {boolean} isHovering - Whether card is being hovered
   * @param {HTMLElement} cardElement - Card DOM element
   */
  handleMouseHover(cardIndex, isHovering, cardElement) {
    let timeline = this.timelines.get(cardIndex)
    
    // Create timeline if it doesn't exist
    if (!timeline) {
      timeline = this.createCardTimeline(cardIndex, cardElement)
    }

    try {
      if (isHovering) {
        // Ensure only this card is affected - stop other animations immediately
        this.stopOtherCardAnimations(cardIndex)
        
        // Dim other cards for focus effect with enhanced opacity control
        this.dimOtherCards(cardIndex, true)
        
        // Proper z-index management during card expansion
        this.setCardZIndex(cardElement, 100)
        
        // Play full-height expansion animation with smooth enter easing curves
        timeline.timeScale(1)
        timeline.play()
        
        // Add mobile expansion classes for CSS styling
        cardElement.classList.add('card-hovered', 'card-mobile-expanded')
        
      } else {
        // Restore other cards visibility with smooth exit animations
        this.dimOtherCards(cardIndex, false)
        
        // Reset z-index with proper timing for mobile viewport
        setTimeout(() => {
          this.setCardZIndex(cardElement, 'auto')
        }, this.getOptimalDuration() * 1000)
        
        // Reverse full-height expansion with smooth exit animation and proper easing curves
        timeline.timeScale(1.2) // Slightly faster exit for responsive feel
        timeline.reverse()
        
        // Remove mobile expansion classes immediately when animation reverses
        cardElement.classList.remove('card-hovered', 'card-mobile-expanded')
        
        // Also remove any force-hover class that might be set by the original hover handler
        setTimeout(() => {
          cardElement.classList.remove('force-hover')
        }, this.getOptimalDuration() * 200)
      }
    } catch (error) {
      console.warn(`Error handling mobile full-height mouse hover for card ${cardIndex}:`, error)
      this.handleAnimationError(error, cardIndex)
    }
  }

  /**
   * Handle touch interactions for mobile devices with full-height expansion
   * Task 2: Implement Mobile Card Full-Height Expansion - Mobile touch optimization
   * @param {number} cardIndex - Index of the card
   * @param {boolean} isActive - Whether card is being touched
   * @param {HTMLElement} cardElement - Card DOM element
   */
  handleTouchInteraction(cardIndex, isActive, cardElement) {
    let timeline = this.timelines.get(cardIndex)
    
    // Create timeline if it doesn't exist
    if (!timeline) {
      timeline = this.createCardTimeline(cardIndex, cardElement)
    }

    try {
      if (isActive) {
        // Ensure only this card is affected - stop other animations immediately
        this.stopOtherCardAnimations(cardIndex)
        
        // Dim other cards for focus with enhanced mobile opacity
        this.dimOtherCards(cardIndex, true)
        
        // Proper z-index management for mobile full-height expansion layering
        this.setCardZIndex(cardElement, 100)
        
        // Play full-height expansion with touch-optimized settings and smooth easing
        timeline.timeScale(1.3) // Faster for responsive touch feel
        timeline.play()
        
        // Add mobile full-height expansion classes
        cardElement.classList.add('card-touched', 'card-mobile-expanded')
        
      } else {
        // Restore other cards with smooth mobile transitions
        this.dimOtherCards(cardIndex, false)
        
        // Reset z-index with proper mobile timing for viewport handling
        setTimeout(() => {
          this.setCardZIndex(cardElement, 'auto')
        }, (this.getOptimalDuration() * 1000) / 1.6)
        
        // Reverse full-height expansion with snappy touch timing and proper exit easing
        timeline.timeScale(1.6) // Faster reverse for responsive touch feel
        timeline.reverse()
        
        // Remove mobile expansion classes immediately when animation reverses
        cardElement.classList.remove('card-touched', 'card-mobile-expanded')
        
        // Also remove any force-hover class that might be set by the original touch handler
        setTimeout(() => {
          cardElement.classList.remove('force-hover')
        }, (this.getOptimalDuration() * 200) / 1.6)
      }
    } catch (error) {
      console.warn(`Error handling mobile full-height touch interaction for card ${cardIndex}:`, error)
      this.handleAnimationError(error, cardIndex)
    }
  }

  /**
   * Stop animations for all cards except the specified one
   * Task 4: Enhanced Card Hover Animations - Ensure only hovered card is affected
   * @param {number} excludeIndex - Index of card to exclude from stopping
   */
  stopOtherCardAnimations(excludeIndex) {
    this.timelines.forEach((timeline, index) => {
      if (index !== excludeIndex && timeline) {
        try {
          // Smoothly reverse other card animations with enhanced easing
          timeline.timeScale(2.0) // Even faster reverse for rapid hover handling
          timeline.reverse()
          
          // Immediately remove enhanced hover classes from other cards
          const otherCardElement = document.querySelector(`[data-card-index="${index}"]`)
          if (otherCardElement) {
            otherCardElement.classList.remove(
              'card-hovered', 
              'card-touched', 
              'card-enhanced-hover', 
              'force-hover'
            )
            // Reset z-index for proper layering
            this.setCardZIndex(otherCardElement, 'auto')
          }
        } catch (error) {
          console.warn(`Error stopping enhanced animation for card ${index}:`, error)
        }
      }
    })
  }

  /**
   * Dim other cards to focus attention on the hovered card
   * Task 4: Enhanced Card Hover Animations - Improved visual focus with proper easing
   * @param {number} activeIndex - Index of the active card
   * @param {boolean} shouldDim - Whether to dim or restore other cards
   */
  dimOtherCards(activeIndex, shouldDim) {
    try {
      // Find all card elements
      const allCards = document.querySelectorAll('[data-card-index]')
      
      allCards.forEach((card, index) => {
        if (index !== activeIndex) {
          if (shouldDim) {
            // Enhanced dimming for better focus on hovered card
            gsap.to(card, {
              opacity: 0.6,
              filter: 'saturate(0.7) brightness(0.8)',
              scale: 0.98, // Subtle scale reduction for depth
              duration: 0.3,
              ease: 'power2.out'
            })
            card.classList.add('card-dimmed')
            // Ensure dimmed cards have lower z-index
            this.setCardZIndex(card, 1)
          } else {
            // Enhanced restoration with smooth transitions
            gsap.to(card, {
              opacity: 1,
              filter: 'saturate(1) brightness(1)',
              scale: 1,
              duration: 0.4,
              ease: 'power2.out'
            })
            card.classList.remove('card-dimmed')
            // Reset z-index for restored cards
            this.setCardZIndex(card, 'auto')
          }
        } else if (!shouldDim) {
          // Ensure active card is also restored properly
          gsap.to(card, {
            opacity: 1,
            filter: 'saturate(1) brightness(1)',
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
          })
          card.classList.remove('card-dimmed')
        }
      })
    } catch (error) {
      console.warn('Error dimming other cards:', error)
    }
  }

  /**
   * Set z-index for proper layering during card expansion
   * @param {HTMLElement} cardElement - Card element to modify
   * @param {number|string} zIndex - Z-index value to set
   */
  setCardZIndex(cardElement, zIndex) {
    try {
      if (cardElement) {
        gsap.set(cardElement, { zIndex })
      }
    } catch (error) {
      console.warn('Error setting card z-index:', error)
    }
  }

  /**
   * Start performance monitoring to adapt animation quality
   */
  startPerformanceMonitoring() {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.frameCount = 0
    this.lastTime = performance.now()

    const monitor = () => {
      if (!this.isMonitoring) return

      this.frameCount++
      const currentTime = performance.now()
      
      if (currentTime - this.lastTime >= 1000) {
        this.fps = this.frameCount
        this.frameCount = 0
        this.lastTime = currentTime
        
        this.adjustPerformanceLevel()
      }
      
      requestAnimationFrame(monitor)
    }
    
    requestAnimationFrame(monitor)
  }

  /**
   * Stop performance monitoring
   */
  stopPerformanceMonitoring() {
    this.isMonitoring = false
  }

  /**
   * Adjust animation performance based on current FPS
   */
  adjustPerformanceLevel() {
    const previousLevel = this.performanceLevel

    if (this.fps < 30) {
      this.performanceLevel = 'low'
    } else if (this.fps < 45) {
      this.performanceLevel = 'medium'
    } else {
      this.performanceLevel = 'high'
    }

    // Only apply changes if performance level changed
    if (previousLevel !== this.performanceLevel) {
      this.applyPerformanceOptimizations()
    }
  }

  /**
   * Apply performance optimizations based on current performance level
   */
  applyPerformanceOptimizations() {
    switch (this.performanceLevel) {
      case 'low':
        this.reduceLowPerformance()
        break
      case 'medium':
        this.reduceMediumPerformance()
        break
      case 'high':
        this.enableHighPerformance()
        break
    }
  }

  /**
   * Reduce animation complexity for low performance devices
   */
  reduceLowPerformance() {
    // Slow down global timeline to reduce CPU load
    gsap.globalTimeline.timeScale(0.7)
    
    // Simplify easing functions
    gsap.defaults({ ease: 'none' })
    
    // Reduce animation duration
    this.timelines.forEach(timeline => {
      if (timeline) {
        timeline.timeScale(1.5) // Faster = shorter duration
      }
    })

    console.log('Animation Manager: Reduced to low performance mode')
  }

  /**
   * Apply medium performance optimizations
   */
  reduceMediumPerformance() {
    // Slightly reduce timeline speed
    gsap.globalTimeline.timeScale(0.85)
    
    // Use simpler easing
    gsap.defaults({ ease: 'power1.inOut' })
    
    // Moderate timeline speed adjustment
    this.timelines.forEach(timeline => {
      if (timeline) {
        timeline.timeScale(1.2)
      }
    })

    console.log('Animation Manager: Set to medium performance mode')
  }

  /**
   * Enable full performance animations
   */
  enableHighPerformance() {
    // Reset to normal speed
    gsap.globalTimeline.timeScale(1)
    
    // Use complex easing functions
    gsap.defaults({ ease: 'power2.inOut' })
    
    // Reset timeline speeds
    this.timelines.forEach(timeline => {
      if (timeline) {
        timeline.timeScale(1)
      }
    })

    console.log('Animation Manager: Enabled high performance mode')
  }

  /**
   * Get optimal easing function based on performance level with enhanced curves
   */
  getOptimalEasing() {
    switch (this.performanceLevel) {
      case 'low':
        return 'power1.out'
      case 'medium':
        return 'power2.inOut'
      case 'high':
      default:
        return 'power3.out' // Smoother, more natural easing for high performance
    }
  }

  /**
   * Get easing for enter animations (hover start)
   */
  getEnterEasing() {
    switch (this.performanceLevel) {
      case 'low':
        return 'power1.out'
      case 'medium':
        return 'back.out(1.2)'
      case 'high':
      default:
        return 'back.out(1.7)' // Bouncy, engaging enter animation
    }
  }

  /**
   * Get easing for exit animations (hover end)
   */
  getExitEasing() {
    switch (this.performanceLevel) {
      case 'low':
        return 'power1.in'
      case 'medium':
        return 'power2.in'
      case 'high':
      default:
        return 'power3.in' // Smooth, quick exit
    }
  }

  /**
   * Get optimal animation duration based on performance level and device type
   */
  getOptimalDuration() {
    const baseDuration = this.isTouch ? 0.4 : 0.6
    
    switch (this.performanceLevel) {
      case 'low':
        return baseDuration * 0.5
      case 'medium':
        return baseDuration * 0.75
      case 'high':
      default:
        return baseDuration
    }
  }

  /**
   * Restore card to original state with smooth transition for mobile full-height expansion
   * Task 2: Implement Mobile Card Full-Height Expansion - Smooth transitions (Requirement 2.3)
   * @param {number} cardIndex - Index of the card to restore
   */
  restoreCardState(cardIndex) {
    try {
      const timeline = this.timelines.get(cardIndex)
      const cardElement = document.querySelector(`[data-card-index="${cardIndex}"]`)
      
      if (timeline && cardElement && timeline.originalStyles) {
        // Smoothly restore original state with proper mobile viewport handling
        gsap.to(cardElement, {
          position: timeline.originalStyles.position,
          top: timeline.originalStyles.top,
          left: timeline.originalStyles.left,
          width: timeline.originalStyles.width,
          height: timeline.originalStyles.height,
          zIndex: timeline.originalStyles.zIndex,
          duration: this.getOptimalDuration() * 0.8,
          ease: this.getExitEasing(),
          onComplete: () => {
            // Clean up after restoration
            gsap.set(cardElement, {
              willChange: 'auto',
              clearProps: 'box-shadow,backdrop-filter,position,top,left,width,height'
            })
            // Remove mobile expansion class
            cardElement.classList.remove('card-mobile-expanded')
          }
        })
      }
    } catch (error) {
      console.warn(`Error restoring mobile full-height card ${cardIndex} state:`, error)
    }
  }

  /**
   * Handle animation errors with mobile full-height expansion fallback recovery
   * Task 2: Implement Mobile Card Full-Height Expansion - Error recovery with proper cleanup
   * @param {Error} error - The error that occurred
   * @param {number} cardIndex - Index of the card where error occurred
   */
  handleAnimationError(error, cardIndex) {
    console.warn(`Mobile full-height expansion animation error for card ${cardIndex}:`, error)
    
    try {
      // Kill problematic timeline
      const timeline = this.timelines.get(cardIndex)
      if (timeline) {
        timeline.kill()
        this.timelines.delete(cardIndex)
      }

      // Reset card element to safe state with mobile expansion cleanup
      const cardElement = document.querySelector(`[data-card-index="${cardIndex}"]`)
      if (cardElement) {
        gsap.set(cardElement, { 
          clearProps: 'all',
          willChange: 'auto',
          zIndex: 'auto',
          opacity: 1,
          filter: 'none',
          scale: 1,
          height: 'auto',
          top: 'auto',
          left: 'auto',
          width: 'auto',
          position: 'relative',
          boxShadow: 'none',
          backdropFilter: 'none'
        })
        
        // Remove all mobile expansion and hover/touch classes
        cardElement.classList.remove(
          'card-hovered', 
          'card-touched', 
          'card-dimmed', 
          'card-mobile-expanded'
        )
      }

      // Restore all other cards to normal state
      this.dimOtherCards(cardIndex, false)

      // Create new mobile full-height timeline as fallback
      if (cardElement) {
        this.createCardTimeline(cardIndex, cardElement)
      }

    } catch (recoveryError) {
      console.error(`Failed to recover from mobile full-height expansion animation error:`, recoveryError)
    }
  }

  /**
   * Clean up all timelines and restore card states
   * Task 2: Implement Mobile Card Full-Height Expansion - Comprehensive cleanup with mobile states
   */
  cleanup() {
    // Stop performance monitoring
    this.stopPerformanceMonitoring()
    
    // Restore all cards to normal state with mobile full-height expansion cleanup
    try {
      const allCards = document.querySelectorAll('[data-card-index]')
      allCards.forEach((card) => {
        gsap.set(card, {
          clearProps: 'all',
          willChange: 'auto',
          zIndex: 'auto',
          opacity: 1,
          filter: 'none',
          scale: 1,
          height: 'auto',
          top: 'auto',
          left: 'auto',
          width: 'auto',
          position: 'relative',
          boxShadow: 'none',
          backdropFilter: 'none'
        })
        // Remove all mobile expansion and hover/touch classes
        card.classList.remove(
          'card-hovered', 
          'card-touched', 
          'card-dimmed', 
          'card-mobile-expanded'
        )
      })
    } catch (error) {
      console.warn('Error restoring mobile full-height card states during cleanup:', error)
    }
    
    // Kill all timelines with mobile expansion error handling
    this.timelines.forEach((timeline, index) => {
      try {
        if (timeline) {
          timeline.kill()
        }
      } catch (error) {
        console.warn(`Error cleaning up mobile full-height timeline ${index}:`, error)
      }
    })
    
    // Clear timeline map
    this.timelines.clear()
    
    // Reset GSAP global timeline and mobile expansion defaults
    try {
      gsap.globalTimeline.timeScale(1)
      gsap.defaults({ ease: 'power2.out', duration: 0.6 })
    } catch (error) {
      console.warn('Error resetting global timeline:', error)
    }

    console.log('Animation Manager: Mobile full-height expansion cleanup completed')
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    return {
      fps: this.fps,
      performanceLevel: this.performanceLevel,
      isTouch: this.isTouch,
      activeTimelines: this.timelines.size,
      isMonitoring: this.isMonitoring
    }
  }

  /**
   * Force performance level (for testing or manual override)
   * @param {'low'|'medium'|'high'} level - Performance level to set
   */
  setPerformanceLevel(level) {
    if (['low', 'medium', 'high'].includes(level)) {
      this.performanceLevel = level
      this.applyPerformanceOptimizations()
      console.log(`Animation Manager: Performance level manually set to ${level}`)
    } else {
      console.warn(`Invalid performance level: ${level}`)
    }
  }

  /**
   * Force cleanup of all hover states (for testing and emergency cleanup)
   * Task 2: Implement Mobile Card Full-Height Expansion - Emergency cleanup with mobile states
   */
  forceCleanupAllHoverStates() {
    try {
      // Kill all timelines immediately
      this.timelines.forEach((timeline, index) => {
        if (timeline) {
          timeline.kill()
        }
      })
      
      // Remove all hover classes from all cards with mobile expansion cleanup
      const allCards = document.querySelectorAll('[data-card-index]')
      allCards.forEach((card) => {
        gsap.set(card, {
          clearProps: 'all',
          willChange: 'auto',
          zIndex: 'auto',
          opacity: 1,
          filter: 'none',
          scale: 1,
          height: 'auto',
          top: 'auto',
          left: 'auto',
          width: 'auto',
          position: 'relative',
          boxShadow: 'none',
          backdropFilter: 'none'
        })
        
        // Remove all possible hover and mobile expansion classes
        card.classList.remove(
          'card-hovered', 
          'card-touched', 
          'card-dimmed', 
          'card-mobile-expanded',
          'force-hover',
          'dimmed'
        )
      })
      
      console.log('Animation Manager: Force cleanup completed with mobile full-height expansion support')
    } catch (error) {
      console.warn('Error during mobile full-height force cleanup:', error)
    }
  }
}

export default AnimationManager