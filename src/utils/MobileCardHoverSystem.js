import { gsap } from 'gsap'

/**
 * Mobile Card Hover System
 * Implements touch-optimized card interactions with proper event handling
 * Requirements: 1.1, 1.2, 1.3, 5.2, 5.3
 */
class MobileCardHoverSystem {
  constructor(options = {}) {
    this.options = {
      touchDebounceTime: 50, // Prevent rapid touch events
      hapticFeedbackDuration: 0.15, // Quick haptic-like animation
      visualFeedbackDuration: 0.3, // Visual feedback duration
      touchActiveClass: 'card-touch-active',
      touchHoverClass: 'card-touch-hover',
      ...options
    }
    
    this.activeTouches = new Map() // Track active touches per card
    this.touchTimers = new Map() // Debounce timers
    this.lastTouchTime = 0
    this.isTouch = this.detectTouchDevice()
    
    // Bind methods to preserve context
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)
    this.handleTouchCancel = this.handleTouchCancel.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    
    console.log('MobileCardHoverSystem initialized:', {
      isTouch: this.isTouch,
      options: this.options
    })
  }

  /**
   * Enhanced touch device detection with multiple fallback methods
   * Requirement 5.1: Touch device detection with multiple fallback methods
   */
  detectTouchDevice() {
    try {
      // Primary touch detection methods
      const hasTouchStart = 'ontouchstart' in window
      const hasPointerCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
      const hasTouchPoints = navigator.maxTouchPoints > 0
      const hasTouch = navigator.msMaxTouchPoints > 0 // IE/Edge fallback
      
      // Mobile user agent detection as fallback
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      const isMobileUA = mobileRegex.test(navigator.userAgent)
      
      // Screen size heuristic (tablets and phones)
      const isSmallScreen = window.screen && (window.screen.width <= 1024 || window.screen.height <= 1024)
      
      // Combine detection methods - device is touch if any primary method returns true
      const isTouch = hasTouchStart || hasPointerCoarse || hasTouchPoints || hasTouch || 
                     (isSmallScreen && (hasTouchStart || isMobileUA))
      
      console.log('Enhanced touch detection:', {
        hasTouchStart,
        hasPointerCoarse,
        hasTouchPoints,
        hasTouch,
        isMobileUA,
        isSmallScreen,
        finalResult: isTouch
      })
      
      return isTouch
    } catch (error) {
      console.warn('Error in touch detection:', error)
      return false
    }
  }

  /**
   * Initialize mobile card hover system for a card element
   * Requirement 1.1: Only the touched card should expand, not all cards
   * @param {HTMLElement} cardElement - Card element to initialize
   * @param {number} cardIndex - Index of the card
   * @param {Function} onHoverChange - Callback for hover state changes
   */
  initializeCard(cardElement, cardIndex, onHoverChange = null) {
    if (!cardElement) {
      console.warn(`Cannot initialize card ${cardIndex}: element not found`)
      return
    }

    // Store card data
    cardElement.dataset.cardIndex = cardIndex
    cardElement.dataset.mobileHoverInitialized = 'true'
    
    // Remove existing event listeners to prevent duplicates
    this.removeCardListeners(cardElement)
    
    // Add touch event listeners for mobile devices
    if (this.isTouch) {
      cardElement.addEventListener('touchstart', this.handleTouchStart, { passive: false })
      cardElement.addEventListener('touchend', this.handleTouchEnd, { passive: false })
      cardElement.addEventListener('touchcancel', this.handleTouchCancel, { passive: false })
      cardElement.addEventListener('touchmove', this.handleTouchMove, { passive: false })
      
      // Disable mouse events on touch devices to prevent conflicts
      cardElement.style.pointerEvents = 'auto'
      cardElement.style.touchAction = 'manipulation' // Prevent double-tap zoom
    } else {
      // Keep mouse events for desktop devices
      cardElement.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, cardIndex, onHoverChange))
      cardElement.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, cardIndex, onHoverChange))
    }
    
    // Store callback for later use
    if (onHoverChange) {
      cardElement._mobileHoverCallback = onHoverChange
    }
    
    console.log(`Mobile card hover initialized for card ${cardIndex}`, {
      isTouch: this.isTouch,
      element: cardElement
    })
  }

  /**
   * Handle touch start event with debouncing and visual feedback
   * Requirement 5.2: Visual feedback for touch interactions
   * @param {TouchEvent} event - Touch start event
   */
  handleTouchStart(event) {
    // Prevent default to avoid mouse event simulation
    event.preventDefault()
    
    const cardElement = event.currentTarget
    const cardIndex = parseInt(cardElement.dataset.cardIndex)
    const touch = event.touches[0]
    
    if (!touch || isNaN(cardIndex)) return
    
    // Debounce rapid touches
    const now = Date.now()
    if (now - this.lastTouchTime < this.options.touchDebounceTime) {
      return
    }
    this.lastTouchTime = now
    
    // Store touch information
    this.activeTouches.set(cardIndex, {
      identifier: touch.identifier,
      startTime: now,
      startX: touch.clientX,
      startY: touch.clientY,
      element: cardElement
    })
    
    // Add touch active class immediately for instant feedback
    cardElement.classList.add(this.options.touchActiveClass)
    
    // Haptic-like visual feedback animation
    this.createHapticFeedback(cardElement)
    
    // Trigger hover state change after short delay to ensure it's a deliberate touch
    const timer = setTimeout(() => {
      if (this.activeTouches.has(cardIndex)) {
        this.triggerTouchHover(cardElement, cardIndex, true)
      }
    }, 100) // 100ms delay to distinguish from accidental touches
    
    this.touchTimers.set(cardIndex, timer)
    
    console.log(`Touch start on card ${cardIndex}`, {
      touchId: touch.identifier,
      position: { x: touch.clientX, y: touch.clientY }
    })
  }

  /**
   * Handle touch end event with proper cleanup
   * Requirement 5.3: Proper touch event handling with touchend
   * @param {TouchEvent} event - Touch end event
   */
  handleTouchEnd(event) {
    event.preventDefault()
    
    const cardElement = event.currentTarget
    const cardIndex = parseInt(cardElement.dataset.cardIndex)
    
    if (isNaN(cardIndex)) return
    
    const touchInfo = this.activeTouches.get(cardIndex)
    if (!touchInfo) return
    
    // Calculate touch duration for gesture recognition
    const touchDuration = Date.now() - touchInfo.startTime
    
    // Clear timers
    const timer = this.touchTimers.get(cardIndex)
    if (timer) {
      clearTimeout(timer)
      this.touchTimers.delete(cardIndex)
    }
    
    // Remove touch active class
    cardElement.classList.remove(this.options.touchActiveClass)
    
    // If touch was long enough, trigger hover end
    if (touchDuration > 100) {
      this.triggerTouchHover(cardElement, cardIndex, false)
    }
    
    // Clean up touch tracking
    this.activeTouches.delete(cardIndex)
    
    console.log(`Touch end on card ${cardIndex}`, {
      duration: touchDuration,
      wasLongEnough: touchDuration > 100
    })
  }

  /**
   * Handle touch cancel event (when touch is interrupted)
   * Requirement 5.3: Proper touch event handling with touchcancel
   * @param {TouchEvent} event - Touch cancel event
   */
  handleTouchCancel(event) {
    event.preventDefault()
    
    const cardElement = event.currentTarget
    const cardIndex = parseInt(cardElement.dataset.cardIndex)
    
    if (isNaN(cardIndex)) return
    
    // Clear timers
    const timer = this.touchTimers.get(cardIndex)
    if (timer) {
      clearTimeout(timer)
      this.touchTimers.delete(cardIndex)
    }
    
    // Remove touch classes
    cardElement.classList.remove(this.options.touchActiveClass, this.options.touchHoverClass)
    
    // Trigger hover end to clean up any active hover state
    this.triggerTouchHover(cardElement, cardIndex, false)
    
    // Clean up touch tracking
    this.activeTouches.delete(cardIndex)
    
    console.log(`Touch cancelled on card ${cardIndex}`)
  }

  /**
   * Handle touch move event to detect if user is scrolling vs hovering
   * @param {TouchEvent} event - Touch move event
   */
  handleTouchMove(event) {
    const cardElement = event.currentTarget
    const cardIndex = parseInt(cardElement.dataset.cardIndex)
    
    if (isNaN(cardIndex)) return
    
    const touchInfo = this.activeTouches.get(cardIndex)
    if (!touchInfo) return
    
    const touch = Array.from(event.touches).find(t => t.identifier === touchInfo.identifier)
    if (!touch) return
    
    // Calculate movement distance
    const deltaX = Math.abs(touch.clientX - touchInfo.startX)
    const deltaY = Math.abs(touch.clientY - touchInfo.startY)
    const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // If user moved too much, cancel the hover (they're probably scrolling)
    if (totalMovement > 20) {
      this.handleTouchCancel(event)
    }
  }

  /**
   * Handle mouse enter for desktop devices
   * @param {MouseEvent} event - Mouse enter event
   * @param {number} cardIndex - Card index
   * @param {Function} onHoverChange - Hover change callback
   */
  handleMouseEnter(event, cardIndex, onHoverChange) {
    const cardElement = event.currentTarget
    
    // Add hover class
    cardElement.classList.add(this.options.touchHoverClass)
    
    // Trigger callback
    if (onHoverChange) {
      onHoverChange(cardIndex, true, cardElement)
    }
    
    console.log(`Mouse enter on card ${cardIndex}`)
  }

  /**
   * Handle mouse leave for desktop devices
   * @param {MouseEvent} event - Mouse leave event
   * @param {number} cardIndex - Card index
   * @param {Function} onHoverChange - Hover change callback
   */
  handleMouseLeave(event, cardIndex, onHoverChange) {
    const cardElement = event.currentTarget
    
    // Remove hover class
    cardElement.classList.remove(this.options.touchHoverClass)
    
    // Trigger callback
    if (onHoverChange) {
      onHoverChange(cardIndex, false, cardElement)
    }
    
    console.log(`Mouse leave on card ${cardIndex}`)
  }

  /**
   * Create haptic-like visual feedback for touch interactions
   * Requirement 5.2: Add visual feedback for touch interactions with haptic-like animations
   * @param {HTMLElement} cardElement - Card element to animate
   */
  createHapticFeedback(cardElement) {
    // Quick scale animation to simulate haptic feedback
    const tl = gsap.timeline()
    
    tl.to(cardElement, {
      scale: 0.98,
      duration: this.options.hapticFeedbackDuration,
      ease: 'power2.out'
    })
    .to(cardElement, {
      scale: 1,
      duration: this.options.hapticFeedbackDuration,
      ease: 'back.out(1.7)'
    })
    
    // Add subtle glow effect
    const titleElement = cardElement.querySelector('h3, .card-title')
    if (titleElement) {
      gsap.to(titleElement, {
        textShadow: '0 0 20px rgba(255, 255, 255, 0.3)',
        duration: this.options.visualFeedbackDuration,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1
      })
    }
  }

  /**
   * Trigger touch hover state change
   * Requirement 1.2: Only the touched card should be affected
   * @param {HTMLElement} cardElement - Card element
   * @param {number} cardIndex - Card index
   * @param {boolean} isHovering - Whether card is being hovered
   */
  triggerTouchHover(cardElement, cardIndex, isHovering) {
    // Add/remove hover class
    if (isHovering) {
      cardElement.classList.add(this.options.touchHoverClass)
    } else {
      cardElement.classList.remove(this.options.touchHoverClass)
    }
    
    // Call the stored callback if available
    const callback = cardElement._mobileHoverCallback
    if (callback) {
      callback(cardIndex, isHovering, cardElement)
    }
    
    console.log(`Touch hover ${isHovering ? 'start' : 'end'} on card ${cardIndex}`)
  }

  /**
   * Remove event listeners from a card element
   * @param {HTMLElement} cardElement - Card element to clean up
   */
  removeCardListeners(cardElement) {
    if (!cardElement) return
    
    // Remove touch listeners
    cardElement.removeEventListener('touchstart', this.handleTouchStart)
    cardElement.removeEventListener('touchend', this.handleTouchEnd)
    cardElement.removeEventListener('touchcancel', this.handleTouchCancel)
    cardElement.removeEventListener('touchmove', this.handleTouchMove)
    
    // Remove mouse listeners (we can't remove specific handlers, so we clone the element)
    // This is a more reliable way to remove all event listeners
    const newElement = cardElement.cloneNode(true)
    cardElement.parentNode?.replaceChild(newElement, cardElement)
    
    return newElement
  }

  /**
   * Clean up all active touches and timers
   */
  cleanup() {
    // Clear all timers
    this.touchTimers.forEach(timer => clearTimeout(timer))
    this.touchTimers.clear()
    
    // Clear active touches
    this.activeTouches.clear()
    
    // Remove classes from all cards
    const allCards = document.querySelectorAll('[data-mobile-hover-initialized="true"]')
    allCards.forEach(card => {
      card.classList.remove(this.options.touchActiveClass, this.options.touchHoverClass)
      this.removeCardListeners(card)
    })
    
    console.log('MobileCardHoverSystem cleanup completed')
  }

  /**
   * Get current system status
   */
  getStatus() {
    return {
      isTouch: this.isTouch,
      activeTouches: this.activeTouches.size,
      activeTimers: this.touchTimers.size,
      options: this.options
    }
  }

  /**
   * Force end all active touches (for emergency cleanup)
   */
  forceEndAllTouches() {
    this.activeTouches.forEach((touchInfo, cardIndex) => {
      const cardElement = touchInfo.element
      if (cardElement) {
        cardElement.classList.remove(this.options.touchActiveClass, this.options.touchHoverClass)
        this.triggerTouchHover(cardElement, cardIndex, false)
      }
    })
    
    this.touchTimers.forEach(timer => clearTimeout(timer))
    this.touchTimers.clear()
    this.activeTouches.clear()
    
    console.log('Force ended all active touches')
  }

  /**
   * Update options at runtime
   * @param {Object} newOptions - New options to merge
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions }
    console.log('MobileCardHoverSystem options updated:', this.options)
  }
}

export default MobileCardHoverSystem