/**
 * Touch Interaction Handler
 * Provides advanced touch event handling with gesture recognition and debouncing
 */

class TouchInteractionHandler {
  constructor(options = {}) {
    this.options = {
      // Debouncing settings
      tapDebounceMs: 150,
      holdThresholdMs: 500,
      swipeThresholdPx: 50,
      swipeVelocityThreshold: 0.5,
      
      // Touch target settings
      minTouchTargetSize: 44, // Minimum 44px for accessibility
      touchTargetPadding: 8,
      
      // Performance settings
      throttleMs: 16, // ~60fps
      maxConcurrentTouches: 10,
      
      // Gesture settings
      enableSwipeGestures: true,
      enablePinchGestures: false,
      enableRotationGestures: false,
      
      ...options
    }

    // Touch state tracking
    this.activeTouches = new Map()
    this.touchHistory = []
    this.gestureState = {
      isActive: false,
      type: null,
      startTime: null,
      startPosition: null,
      currentPosition: null,
      velocity: { x: 0, y: 0 },
      distance: 0,
      direction: null
    }

    // Event listeners registry
    this.listeners = new Map()
    this.throttledHandlers = new Map()

    // Bind methods
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)
    this.handleTouchCancel = this.handleTouchCancel.bind(this)
  }

  /**
   * Register touch event listeners on an element
   * @param {HTMLElement} element - Target element
   * @param {Object} callbacks - Event callbacks
   */
  registerElement(element, callbacks = {}) {
    if (!element) {
      console.warn('TouchInteractionHandler: Invalid element provided')
      return
    }

    // Ensure minimum touch target size
    this.ensureTouchTargetSize(element)

    // Store callbacks for this element
    const elementId = this.getElementId(element)
    this.listeners.set(elementId, {
      element,
      callbacks: {
        onTap: callbacks.onTap || null,
        onHold: callbacks.onHold || null,
        onSwipe: callbacks.onSwipe || null,
        onTouchStart: callbacks.onTouchStart || null,
        onTouchMove: callbacks.onTouchMove || null,
        onTouchEnd: callbacks.onTouchEnd || null,
        onGestureStart: callbacks.onGestureStart || null,
        onGestureEnd: callbacks.onGestureEnd || null
      }
    })

    // Add event listeners
    element.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    element.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    element.addEventListener('touchend', this.handleTouchEnd, { passive: false })
    element.addEventListener('touchcancel', this.handleTouchCancel, { passive: false })

    // Add mouse event fallbacks for testing
    if (process.env.NODE_ENV === 'development') {
      element.addEventListener('mousedown', this.handleMouseDown.bind(this))
      element.addEventListener('mousemove', this.handleMouseMove.bind(this))
      element.addEventListener('mouseup', this.handleMouseUp.bind(this))
    }

    return elementId
  }

  /**
   * Unregister touch event listeners from an element
   * @param {HTMLElement|string} elementOrId - Element or element ID
   */
  unregisterElement(elementOrId) {
    const elementId = typeof elementOrId === 'string' ? elementOrId : this.getElementId(elementOrId)
    const registration = this.listeners.get(elementId)

    if (!registration) return

    const { element } = registration

    // Remove event listeners
    element.removeEventListener('touchstart', this.handleTouchStart)
    element.removeEventListener('touchmove', this.handleTouchMove)
    element.removeEventListener('touchend', this.handleTouchEnd)
    element.removeEventListener('touchcancel', this.handleTouchCancel)

    // Remove mouse event fallbacks
    if (process.env.NODE_ENV === 'development') {
      element.removeEventListener('mousedown', this.handleMouseDown)
      element.removeEventListener('mousemove', this.handleMouseMove)
      element.removeEventListener('mouseup', this.handleMouseUp)
    }

    // Clean up
    this.listeners.delete(elementId)
    this.throttledHandlers.delete(elementId)
  }

  /**
   * Handle touch start events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchStart(event) {
    const elementId = this.getElementId(event.currentTarget)
    const registration = this.listeners.get(elementId)
    if (!registration) return

    const touch = event.touches[0]
    if (!touch) return

    const touchData = this.createTouchData(touch, event.currentTarget)
    this.activeTouches.set(touch.identifier, touchData)

    // Start gesture tracking
    this.startGesture(touchData)

    // Call callback
    if (registration.callbacks.onTouchStart) {
      registration.callbacks.onTouchStart(touchData, event)
    }

    // Prevent default to avoid unwanted behaviors
    if (this.shouldPreventDefault(event)) {
      event.preventDefault()
    }
  }

  /**
   * Handle touch move events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchMove(event) {
    const elementId = this.getElementId(event.currentTarget)
    const registration = this.listeners.get(elementId)
    if (!registration) return

    // Throttle move events for performance
    const throttledHandler = this.getThrottledHandler(elementId, () => {
      this.processTouchMove(event, registration)
    })

    throttledHandler()
  }

  /**
   * Process touch move (throttled)
   * @param {TouchEvent} event - Touch event
   * @param {Object} registration - Element registration
   */
  processTouchMove(event, registration) {
    const touch = event.touches[0]
    if (!touch) return

    const touchData = this.activeTouches.get(touch.identifier)
    if (!touchData) return

    // Update touch data
    this.updateTouchData(touchData, touch)

    // Update gesture state
    this.updateGesture(touchData)

    // Call callback
    if (registration.callbacks.onTouchMove) {
      registration.callbacks.onTouchMove(touchData, event)
    }

    // Prevent scrolling during gestures
    if (this.gestureState.isActive && this.shouldPreventDefault(event)) {
      event.preventDefault()
    }
  }

  /**
   * Handle touch end events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchEnd(event) {
    const elementId = this.getElementId(event.currentTarget)
    const registration = this.listeners.get(elementId)
    if (!registration) return

    // Process ended touches
    for (const touch of event.changedTouches) {
      const touchData = this.activeTouches.get(touch.identifier)
      if (!touchData) continue

      // Update final touch data
      this.updateTouchData(touchData, touch)

      // Determine gesture type and call appropriate callback
      this.processGestureEnd(touchData, registration)

      // Clean up
      this.activeTouches.delete(touch.identifier)
    }

    // End gesture if no more active touches
    if (this.activeTouches.size === 0) {
      this.endGesture(registration)
    }

    // Call callback
    if (registration.callbacks.onTouchEnd) {
      registration.callbacks.onTouchEnd(event)
    }
  }

  /**
   * Handle touch cancel events
   * @param {TouchEvent} event - Touch event
   */
  handleTouchCancel(event) {
    const elementId = this.getElementId(event.currentTarget)
    const registration = this.listeners.get(elementId)
    if (!registration) return

    // Clean up all touches for this element
    for (const touch of event.changedTouches) {
      this.activeTouches.delete(touch.identifier)
    }

    // End gesture
    this.endGesture(registration)
  }

  /**
   * Create touch data object
   * @param {Touch} touch - Touch object
   * @param {HTMLElement} element - Target element
   * @returns {Object} Touch data
   */
  createTouchData(touch, element) {
    const rect = element.getBoundingClientRect()
    const now = performance.now()

    return {
      identifier: touch.identifier,
      startTime: now,
      currentTime: now,
      startPosition: {
        x: touch.clientX,
        y: touch.clientY,
        pageX: touch.pageX,
        pageY: touch.pageY
      },
      currentPosition: {
        x: touch.clientX,
        y: touch.clientY,
        pageX: touch.pageX,
        pageY: touch.pageY
      },
      elementPosition: {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      },
      element,
      elementRect: rect,
      velocity: { x: 0, y: 0 },
      distance: 0,
      direction: null,
      isActive: true
    }
  }

  /**
   * Update touch data with new touch information
   * @param {Object} touchData - Existing touch data
   * @param {Touch} touch - New touch object
   */
  updateTouchData(touchData, touch) {
    const now = performance.now()
    const timeDelta = now - touchData.currentTime
    
    if (timeDelta === 0) return // Avoid division by zero

    // Calculate velocity
    const deltaX = touch.clientX - touchData.currentPosition.x
    const deltaY = touch.clientY - touchData.currentPosition.y
    
    touchData.velocity = {
      x: deltaX / timeDelta,
      y: deltaY / timeDelta
    }

    // Update positions
    touchData.currentPosition = {
      x: touch.clientX,
      y: touch.clientY,
      pageX: touch.pageX,
      pageY: touch.pageY
    }

    // Update element position
    const rect = touchData.element.getBoundingClientRect()
    touchData.elementPosition = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }

    // Calculate total distance
    const totalDeltaX = touchData.currentPosition.x - touchData.startPosition.x
    const totalDeltaY = touchData.currentPosition.y - touchData.startPosition.y
    touchData.distance = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY)

    // Calculate direction
    if (touchData.distance > 10) { // Minimum distance to determine direction
      const angle = Math.atan2(totalDeltaY, totalDeltaX) * 180 / Math.PI
      touchData.direction = this.getDirectionFromAngle(angle)
    }

    touchData.currentTime = now
  }

  /**
   * Start gesture tracking
   * @param {Object} touchData - Touch data
   */
  startGesture(touchData) {
    this.gestureState = {
      isActive: true,
      type: null,
      startTime: touchData.startTime,
      startPosition: { ...touchData.startPosition },
      currentPosition: { ...touchData.currentPosition },
      velocity: { x: 0, y: 0 },
      distance: 0,
      direction: null
    }
  }

  /**
   * Update gesture state
   * @param {Object} touchData - Touch data
   */
  updateGesture(touchData) {
    if (!this.gestureState.isActive) return

    this.gestureState.currentPosition = { ...touchData.currentPosition }
    this.gestureState.velocity = { ...touchData.velocity }
    this.gestureState.distance = touchData.distance
    this.gestureState.direction = touchData.direction

    // Determine gesture type based on movement
    const duration = touchData.currentTime - touchData.startTime
    
    if (duration > this.options.holdThresholdMs && touchData.distance < 10) {
      this.gestureState.type = 'hold'
    } else if (touchData.distance > this.options.swipeThresholdPx) {
      this.gestureState.type = 'swipe'
    }
  }

  /**
   * Process gesture end and call appropriate callbacks
   * @param {Object} touchData - Touch data
   * @param {Object} registration - Element registration
   */
  processGestureEnd(touchData, registration) {
    const duration = touchData.currentTime - touchData.startTime
    const { callbacks } = registration

    // Determine final gesture type
    let gestureType = 'tap' // Default

    if (duration > this.options.holdThresholdMs && touchData.distance < 10) {
      gestureType = 'hold'
    } else if (touchData.distance > this.options.swipeThresholdPx) {
      const velocityMagnitude = Math.sqrt(
        touchData.velocity.x * touchData.velocity.x + 
        touchData.velocity.y * touchData.velocity.y
      )
      
      if (velocityMagnitude > this.options.swipeVelocityThreshold) {
        gestureType = 'swipe'
      }
    }

    // Call appropriate callback
    switch (gestureType) {
      case 'tap':
        if (callbacks.onTap) {
          callbacks.onTap(touchData)
        }
        break
      
      case 'hold':
        if (callbacks.onHold) {
          callbacks.onHold(touchData)
        }
        break
      
      case 'swipe':
        if (callbacks.onSwipe && this.options.enableSwipeGestures) {
          callbacks.onSwipe({
            ...touchData,
            direction: touchData.direction,
            velocity: touchData.velocity
          })
        }
        break
    }
  }

  /**
   * End gesture tracking
   * @param {Object} registration - Element registration
   */
  endGesture(registration) {
    if (this.gestureState.isActive && registration.callbacks.onGestureEnd) {
      registration.callbacks.onGestureEnd(this.gestureState)
    }

    this.gestureState = {
      isActive: false,
      type: null,
      startTime: null,
      startPosition: null,
      currentPosition: null,
      velocity: { x: 0, y: 0 },
      distance: 0,
      direction: null
    }
  }

  /**
   * Get direction from angle
   * @param {number} angle - Angle in degrees
   * @returns {string} Direction: 'up', 'down', 'left', 'right'
   */
  getDirectionFromAngle(angle) {
    const absAngle = Math.abs(angle)
    
    if (absAngle <= 45) return 'right'
    if (absAngle >= 135) return 'left'
    if (angle > 0) return 'down'
    return 'up'
  }

  /**
   * Ensure element meets minimum touch target size
   * @param {HTMLElement} element - Target element
   */
  ensureTouchTargetSize(element) {
    const rect = element.getBoundingClientRect()
    const { minTouchTargetSize, touchTargetPadding } = this.options

    if (rect.width < minTouchTargetSize || rect.height < minTouchTargetSize) {
      console.warn(
        `TouchInteractionHandler: Element has small touch target (${rect.width}x${rect.height}px). ` +
        `Consider increasing to at least ${minTouchTargetSize}x${minTouchTargetSize}px for better accessibility.`
      )
    }
  }

  /**
   * Get throttled handler for an element
   * @param {string} elementId - Element ID
   * @param {Function} handler - Handler function
   * @returns {Function} Throttled handler
   */
  getThrottledHandler(elementId, handler) {
    if (!this.throttledHandlers.has(elementId)) {
      this.throttledHandlers.set(elementId, this.throttle(handler, this.options.throttleMs))
    }
    return this.throttledHandlers.get(elementId)
  }

  /**
   * Throttle function
   * @param {Function} func - Function to throttle
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, delay) {
    let timeoutId
    let lastExecTime = 0
    
    return (...args) => {
      const currentTime = Date.now()
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args)
        lastExecTime = currentTime
      } else {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          func.apply(this, args)
          lastExecTime = Date.now()
        }, delay - (currentTime - lastExecTime))
      }
    }
  }

  /**
   * Get unique element ID
   * @param {HTMLElement} element - Element
   * @returns {string} Element ID
   */
  getElementId(element) {
    if (!element._touchHandlerId) {
      element._touchHandlerId = `touch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    return element._touchHandlerId
  }

  /**
   * Determine if default behavior should be prevented
   * @param {Event} event - Event object
   * @returns {boolean} True if should prevent default
   */
  shouldPreventDefault(event) {
    // Prevent default for touch events to avoid scrolling/zooming during gestures
    return this.gestureState.isActive || event.touches.length > 1
  }

  // Mouse event fallbacks for development/testing
  handleMouseDown(event) {
    if (process.env.NODE_ENV !== 'development') return
    
    // Simulate touch start
    const fakeTouch = {
      identifier: 0,
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY
    }
    
    this.handleTouchStart({
      currentTarget: event.currentTarget,
      touches: [fakeTouch],
      preventDefault: () => event.preventDefault()
    })
  }

  handleMouseMove(event) {
    if (process.env.NODE_ENV !== 'development') return
    if (!this.activeTouches.has(0)) return
    
    const fakeTouch = {
      identifier: 0,
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY
    }
    
    this.handleTouchMove({
      currentTarget: event.currentTarget,
      touches: [fakeTouch],
      preventDefault: () => event.preventDefault()
    })
  }

  handleMouseUp(event) {
    if (process.env.NODE_ENV !== 'development') return
    if (!this.activeTouches.has(0)) return
    
    const fakeTouch = {
      identifier: 0,
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY
    }
    
    this.handleTouchEnd({
      currentTarget: event.currentTarget,
      changedTouches: [fakeTouch]
    })
  }

  /**
   * Clean up all resources
   */
  destroy() {
    // Unregister all elements
    for (const [elementId] of this.listeners) {
      this.unregisterElement(elementId)
    }
    
    // Clear all data
    this.activeTouches.clear()
    this.listeners.clear()
    this.throttledHandlers.clear()
    this.touchHistory = []
  }
}

export default TouchInteractionHandler