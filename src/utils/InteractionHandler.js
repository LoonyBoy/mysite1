import { gsap } from 'gsap'

/**
 * Touch/Mouse Interaction Handler for Menu Page Mobile Animations
 * Provides unified interaction handling with device-specific optimizations
 * and debouncing to prevent flickering and conflicts
 */
class InteractionHandler {
  constructor(animationManager, particleController) {
    this.animationManager = animationManager
    this.particleController = particleController
    this.isTouch = this.detectTouchDevice()
    this.activeInteractions = new Map()
    this.debounceTimers = new Map()
    this.interactionLocks = new Map()
    this.lastInteractionTime = 0
    
    // Configuration for different interaction types
    this.config = {
      debounceDelay: this.isTouch ? 150 : 100,
      lockDuration: this.isTouch ? 300 : 200,
      rapidEventThreshold: 50, // ms between events to consider "rapid"
      touchHoldThreshold: 500, // ms to consider a touch as "hold"
    }

    // Bind methods to preserve context
    this.handleEnter = this.handleEnter.bind(this)
    this.handleLeave = this.handleLeave.bind(this)
    this.handleTap = this.handleTap.bind(this)
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)

    console.log(`InteractionHandler initialized for ${this.isTouch ? 'touch' : 'mouse'} device`)
  }

  /**
   * Detect if device supports touch interactions
   * Enhanced detection with multiple fallbacks
   */
  detectTouchDevice() {
    try {
      // Primary detection methods
      const hasTouchStart = 'ontouchstart' in window
      const hasPointerCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
      const hasTouchPoints = navigator.maxTouchPoints > 0
      const hasTouch = navigator.msMaxTouchPoints > 0 // IE/Edge fallback
      
      // Secondary detection - check for mobile user agents
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      const isMobileUA = mobileRegex.test(navigator.userAgent)
      
      // Combine detection methods
      const isTouch = hasTouchStart || hasPointerCoarse || hasTouchPoints || hasTouch || isMobileUA
      
      console.log('Touch detection results:', {
        hasTouchStart,
        hasPointerCoarse,
        hasTouchPoints,
        hasTouch,
        isMobileUA,
        finalResult: isTouch
      })
      
      return isTouch
    } catch (error) {
      console.warn('Error detecting touch device:', error)
      return false // Default to mouse if detection fails
    }
  }

  /**
   * Universal interaction handler that routes to appropriate method
   * @param {HTMLElement} cardElement - Card DOM element
   * @param {number} cardIndex - Index of the card
   * @param {'enter'|'leave'|'tap'|'touchstart'|'touchend'} type - Interaction type
   * @param {Event} event - Original event object
   */
  handleInteraction(cardElement, cardIndex, type, event = null) {
    const currentTime = Date.now()
    
    // Prevent rapid-fire events that could cause flickering
    if (this.isRapidEvent(currentTime)) {
      console.log(`Ignoring rapid ${type} event for card ${cardIndex}`)
      return
    }

    // Check if interaction is locked (prevents conflicts)
    if (this.isInteractionLocked(cardIndex, type)) {
      console.log(`Interaction locked for card ${cardIndex}, type: ${type}`)
      return
    }

    this.lastInteractionTime = currentTime

    try {
      switch (type) {
        case 'enter':
          return this.handleEnter(cardElement, cardIndex, event)
        case 'leave':
          return this.handleLeave(cardElement, cardIndex, event)
        case 'tap':
          return this.handleTap(cardElement, cardIndex, event)
        case 'touchstart':
          return this.handleTouchStart(cardElement, cardIndex, event)
        case 'touchend':
          return this.handleTouchEnd(cardElement, cardIndex, event)
        default:
          console.warn(`Unknown interaction type: ${type}`)
      }
    } catch (error) {
      console.error(`Error handling ${type} interaction for card ${cardIndex}:`, error)
      this.handleInteractionError(error, cardIndex, type)
    }
  }

  /**
   * Handle mobile touch interactions (only for touch devices)
   * Task 4: Enhanced Card Hover Animations - Mobile touch-optimized interactions
   * @param {HTMLElement} cardElement - Card DOM element
   * @param {number} cardIndex - Index of the card
   * @param {Event} event - Original event object
   */
  handleEnter(cardElement, cardIndex, event) {
    // Only handle interactions on touch devices
    if (!this.isTouch) {
      console.log('InteractionHandler: Ignoring enter event on non-touch device')
      return
    }

    // Clear any existing debounce timer for this card
    this.clearDebounceTimer(cardIndex, 'enter')

    // Ignore mouse events on touch devices to prevent conflicts
    if (event && event.type === 'mouseenter') {
      return
    }

    // Enhanced debouncing for mobile touch interactions
    const debounceTimer = setTimeout(() => {
      this.executeEnhancedEnter(cardElement, cardIndex, event)
    }, this.config.debounceDelay)

    this.debounceTimers.set(`${cardIndex}-enter`, debounceTimer)
  }

  /**
   * Execute the actual enter interaction
   * @param {HTMLElement} cardElement - Card DOM element
   * @param {number} cardIndex - Index of the card
   * @param {Event} event - Original event object
   */
  executeEnter(cardElement, cardIndex, event) {
    console.log(`Executing enter for card ${cardIndex}`)

    // Stop animations for other cards
    this.stopOtherCardAnimations(cardIndex)
    
    // Create or get timeline for this card
    let timeline = this.animationManager.timelines.get(cardIndex)
    if (!timeline) {
      timeline = this.animationManager.createCardTimeline(cardIndex, cardElement)
    }
    
    // Play expansion animation
    if (timeline) {
      timeline.play()
    }
    
    // Change particle color if particle controller is available
    if (this.particleController) {
      const bounds = cardElement.getBoundingClientRect()
      this.particleController.setParticleColorForCard(cardIndex, '#000000', bounds)
    }
    
    // Record active interaction
    this.activeInteractions.set(cardIndex, {
      type: this.isTouch ? 'touch' : 'hover',
      timestamp: Date.now(),
      element: cardElement,
      event: event
    })

    // Lock interaction briefly to prevent conflicts
    this.lockInteraction(cardIndex, 'leave', this.config.lockDuration)
  }

  /**
   * Execute enhanced enter interaction for mobile devices
   * Task 4: Enhanced Card Hover Animations - Mobile-optimized with full-height expansion
   * @param {HTMLElement} cardElement - Card DOM element
   * @param {number} cardIndex - Index of the card
   * @param {Event} event - Original event object
   */
  executeEnhancedEnter(cardElement, cardIndex, event) {
    console.log(`Executing enhanced mobile enter for card ${cardIndex}`)

    // Ensure only this card is affected - stop other animations immediately
    this.stopOtherCardAnimations(cardIndex)
    
    // Enhanced mobile animation with full-height expansion using GSAP Flip
    if (this.animationManager && this.animationManager.handleCardHover) {
      try {
        // Use enhanced mobile hover handling
        this.animationManager.handleCardHover(cardIndex, true, cardElement)
        
        // Add enhanced mobile touch class for CSS styling
        cardElement.classList.add('card-enhanced-mobile-hover')
        
        // Proper z-index management during mobile card expansion
        cardElement.style.zIndex = '100'
        
      } catch (error) {
        console.warn('Enhanced mobile animation error:', error)
        // Fallback to standard behavior
        this.executeEnter(cardElement, cardIndex, event)
        return
      }
    }
    
    // Enhanced particle color integration for mobile
    if (this.particleController && this.particleController.setParticleProps) {
      const bounds = cardElement.getBoundingClientRect()
      this.particleController.setParticleProps({
        color: '#000000',
        bounds: bounds
      })
    }
    
    // Record enhanced mobile interaction
    this.activeInteractions.set(cardIndex, {
      type: 'enhanced-mobile-touch',
      timestamp: Date.now(),
      element: cardElement,
      event: event,
      bounds: cardElement.getBoundingClientRect()
    })

    // Enhanced mobile interaction locking
    this.lockInteraction(cardIndex, 'leave', this.config.lockDuration * 1.5)
  }

  /**
   * Handle mobile touch end events (only for touch devices)
   * @param {HTMLElement} cardElement - Card DOM element
   * @param {number} cardIndex - Index of the card
   * @param {Event} event - Original event object
   */
  handleLeave(cardElement, cardIndex, event) {
    // Only handle interactions on touch devices
    if (!this.isTouch) {
      console.log('InteractionHandler: Ignoring leave event on non-touch device')
      return
    }

    // Clear any existing debounce timer for this card
    this.clearDebounceTimer(cardIndex, 'leave')

    // Ignore mouse events on touch devices to prevent conflicts
    if (event && event.type === 'mouseleave') {
      return
    }

    // Check if we should ignore this leave event (too soon after enter)
    const interaction = this.activeInteractions.get(cardIndex)
    if (interaction && Date.now() - interaction.timestamp < this.config.lockDuration) {
      console.log(`Ignoring rapid leave event for card ${cardIndex}`)
      return
    }

    // Debounce the leave event
    const debounceTimer = setTimeout(() => {
      this.executeLeave(cardElement, cardIndex, event)
    }, this.config.debounceDelay)

    this.debounceTimers.set(`${cardIndex}-leave`, debounceTimer)
  }

  /**
   * Execute the actual leave interaction
   * @param {HTMLElement} cardElement - Card DOM element
   * @param {number} cardIndex - Index of the card
   * @param {Event} event - Original event object
   */
  executeLeave(cardElement, cardIndex, event) {
    console.log(`Executing leave for card ${cardIndex}`)

    // Get timeline for this card
    const timeline = this.animationManager.timelines.get(cardIndex)
    if (timeline) {
      timeline.reverse()
    }
    
    // Restore particle color if particle controller is available
    if (this.particleController) {
      this.particleController.restoreParticleColor(cardIndex)
    }
    
    // Remove active interaction
    this.activeInteractions.delete(cardIndex)

    // Lock interaction briefly to prevent conflicts
    this.lockInteraction(cardIndex, 'enter', this.config.lockDuration)
  }

  /**
   * Handle tap events for touch devices
   * @param {HTMLElement} cardElement - Card DOM element
   * @param {number} cardIndex - Index of the card
   * @param {Event} event - Original event object
   */
  handleTap(cardElement, cardIndex, event) {
    if (!this.isTouch) {
      // On non-touch devices, tap is handled as click
      console.log(`Tap converted to click for card ${cardIndex}`)
      return
    }

    console.log(`Handling tap for card ${cardIndex}`)

    // For touch devices, tap toggles the card state
    const isActive = this.activeInteractions.has(cardIndex)
    
    if (isActive) {
      this.executeLeave(cardElement, cardIndex, event)
    } else {
      this.executeEnter(cardElement, cardIndex, event)
    }
  }

  /**
   * Handle touch start events
   * @param {HTMLElement} cardElement - Card DOM element
   * @param {number} cardIndex - Index of the card
   * @param {TouchEvent} event - Touch event object
   */
  handleTouchStart(cardElement, cardIndex, event) {
    if (!this.isTouch) return

    console.log(`Touch start for card ${cardIndex}`)

    // Store touch start time for hold detection
    const touchData = {
      startTime: Date.now(),
      startX: event.touches[0].clientX,
      startY: event.touches[0].clientY,
      element: cardElement
    }

    this.activeInteractions.set(`${cardIndex}-touch`, touchData)

    // Provide immediate visual feedback for touch
    this.provideTouchFeedback(cardElement, true)
  }

  /**
   * Handle touch end events
   * @param {HTMLElement} cardElement - Card DOM element
   * @param {number} cardIndex - Index of the card
   * @param {TouchEvent} event - Touch event object
   */
  handleTouchEnd(cardElement, cardIndex, event) {
    if (!this.isTouch) return

    console.log(`Touch end for card ${cardIndex}`)

    const touchData = this.activeInteractions.get(`${cardIndex}-touch`)
    if (!touchData) return

    const touchDuration = Date.now() - touchData.startTime
    const endX = event.changedTouches[0].clientX
    const endY = event.changedTouches[0].clientY
    
    // Calculate touch movement
    const deltaX = Math.abs(endX - touchData.startX)
    const deltaY = Math.abs(endY - touchData.startY)
    const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Remove touch feedback
    this.provideTouchFeedback(cardElement, false)

    // Determine if this was a tap or hold
    const isTap = touchDuration < this.config.touchHoldThreshold && movement < 10
    
    if (isTap) {
      this.handleTap(cardElement, cardIndex, event)
    }

    // Clean up touch data
    this.activeInteractions.delete(`${cardIndex}-touch`)
  }

  /**
   * Provide visual feedback for touch interactions
   * @param {HTMLElement} cardElement - Card DOM element
   * @param {boolean} isActive - Whether touch is active
   */
  provideTouchFeedback(cardElement, isActive) {
    if (!cardElement) return

    try {
      if (isActive) {
        // Add subtle scale and opacity change for touch feedback
        gsap.to(cardElement, {
          scale: 0.98,
          opacity: 0.9,
          duration: 0.1,
          ease: 'power2.out'
        })
      } else {
        // Restore original state
        gsap.to(cardElement, {
          scale: 1,
          opacity: 1,
          duration: 0.2,
          ease: 'power2.out'
        })
      }
    } catch (error) {
      console.warn('Error providing touch feedback:', error)
    }
  }

  /**
   * Stop animations for all cards except the specified one
   * @param {number} excludeIndex - Index of card to exclude from stopping
   */
  stopOtherCardAnimations(excludeIndex) {
    if (this.animationManager && this.animationManager.stopOtherCardAnimations) {
      this.animationManager.stopOtherCardAnimations(excludeIndex)
    }
  }

  /**
   * Check if an event is happening too rapidly (potential flickering)
   * @param {number} currentTime - Current timestamp
   * @returns {boolean} True if event is too rapid
   */
  isRapidEvent(currentTime) {
    return currentTime - this.lastInteractionTime < this.config.rapidEventThreshold
  }

  /**
   * Check if interaction is currently locked for a card
   * @param {number} cardIndex - Index of the card
   * @param {string} interactionType - Type of interaction to check
   * @returns {boolean} True if interaction is locked
   */
  isInteractionLocked(cardIndex, interactionType) {
    const lockKey = `${cardIndex}-${interactionType}`
    const lockTime = this.interactionLocks.get(lockKey)
    
    if (!lockTime) return false
    
    if (Date.now() > lockTime) {
      // Lock has expired, remove it
      this.interactionLocks.delete(lockKey)
      return false
    }
    
    return true
  }

  /**
   * Lock an interaction type for a specific duration
   * @param {number} cardIndex - Index of the card
   * @param {string} interactionType - Type of interaction to lock
   * @param {number} duration - Duration in milliseconds
   */
  lockInteraction(cardIndex, interactionType, duration) {
    const lockKey = `${cardIndex}-${interactionType}`
    const unlockTime = Date.now() + duration
    this.interactionLocks.set(lockKey, unlockTime)
  }

  /**
   * Clear debounce timer for a specific card and interaction type
   * @param {number} cardIndex - Index of the card
   * @param {string} interactionType - Type of interaction
   */
  clearDebounceTimer(cardIndex, interactionType) {
    const timerKey = `${cardIndex}-${interactionType}`
    const timer = this.debounceTimers.get(timerKey)
    
    if (timer) {
      clearTimeout(timer)
      this.debounceTimers.delete(timerKey)
    }
  }

  /**
   * Handle interaction errors with fallback recovery
   * @param {Error} error - The error that occurred
   * @param {number} cardIndex - Index of the card where error occurred
   * @param {string} interactionType - Type of interaction that failed
   */
  handleInteractionError(error, cardIndex, interactionType) {
    console.error(`Interaction error for card ${cardIndex}, type ${interactionType}:`, error)
    
    try {
      // Clear any problematic state
      this.activeInteractions.delete(cardIndex)
      this.clearDebounceTimer(cardIndex, interactionType)
      
      // Remove any locks that might be preventing recovery
      this.interactionLocks.delete(`${cardIndex}-enter`)
      this.interactionLocks.delete(`${cardIndex}-leave`)
      
      // Reset card element to safe state if possible
      const cardElement = document.querySelector(`[data-card-index="${cardIndex}"]`)
      if (cardElement) {
        gsap.set(cardElement, { 
          scale: 1,
          opacity: 1,
          clearProps: 'transform'
        })
      }

    } catch (recoveryError) {
      console.error(`Failed to recover from interaction error:`, recoveryError)
    }
  }

  /**
   * Get current interaction state for debugging
   * @returns {Object} Current state information
   */
  getInteractionState() {
    return {
      isTouch: this.isTouch,
      activeInteractions: Array.from(this.activeInteractions.keys()),
      debounceTimers: Array.from(this.debounceTimers.keys()),
      interactionLocks: Array.from(this.interactionLocks.keys()),
      config: this.config
    }
  }

  /**
   * Update configuration settings
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    console.log('InteractionHandler config updated:', this.config)
  }

  /**
   * Clean up all timers, locks, and event listeners
   */
  cleanup() {
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()
    
    // Clear all interaction locks
    this.interactionLocks.clear()
    
    // Clear active interactions
    this.activeInteractions.clear()
    
    console.log('InteractionHandler: Cleanup completed')
  }
}

export default InteractionHandler