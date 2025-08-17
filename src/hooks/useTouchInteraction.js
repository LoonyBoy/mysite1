import { useEffect, useRef, useCallback } from 'react'
import TouchInteractionHandler from '../utils/TouchInteractionHandler'
import { useDeviceDetection } from './useDeviceDetection'

/**
 * React hook for touch interaction handling
 * Provides easy-to-use touch event handling with gesture recognition
 */
export const useTouchInteraction = (callbacks = {}, options = {}) => {
  const handlerRef = useRef(null)
  const elementRef = useRef(null)
  const registrationIdRef = useRef(null)
  const { isPrimaryTouch } = useDeviceDetection()

  // Initialize touch handler
  useEffect(() => {
    if (!handlerRef.current) {
      handlerRef.current = new TouchInteractionHandler(options)
    }

    return () => {
      if (handlerRef.current) {
        handlerRef.current.destroy()
        handlerRef.current = null
      }
    }
  }, [])

  // Register element when ref changes
  const registerElement = useCallback((element) => {
    if (!element || !handlerRef.current) return

    // Unregister previous element if exists
    if (registrationIdRef.current) {
      handlerRef.current.unregisterElement(registrationIdRef.current)
      registrationIdRef.current = null
    }

    // Register new element
    elementRef.current = element
    registrationIdRef.current = handlerRef.current.registerElement(element, callbacks)
  }, [callbacks])

  // Unregister element
  const unregisterElement = useCallback(() => {
    if (registrationIdRef.current && handlerRef.current) {
      handlerRef.current.unregisterElement(registrationIdRef.current)
      registrationIdRef.current = null
      elementRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterElement()
    }
  }, [unregisterElement])

  return {
    registerElement,
    unregisterElement,
    isPrimaryTouch: isPrimaryTouch(),
    handler: handlerRef.current
  }
}

/**
 * Hook for simple tap handling (most common use case)
 */
export const useTapHandler = (onTap, options = {}) => {
  const { registerElement, unregisterElement, isPrimaryTouch } = useTouchInteraction({
    onTap
  }, options)

  return {
    registerElement,
    unregisterElement,
    isPrimaryTouch
  }
}

/**
 * Hook for card-specific touch interactions
 * Optimized for menu card interactions with hover fallbacks
 */
export const useCardTouchInteraction = (callbacks = {}) => {
  const { isPrimaryTouch } = useDeviceDetection()
  const touchHandlerRef = useRef(null)
  const elementRef = useRef(null)
  const hoverTimeoutRef = useRef(null)

  // Enhanced callbacks that handle both touch and mouse
  const enhancedCallbacks = {
    onTap: useCallback((touchData) => {
      if (callbacks.onTap) {
        callbacks.onTap(touchData)
      }
      // Also trigger hover-like behavior for touch
      if (callbacks.onHover) {
        callbacks.onHover(true, touchData)
      }
    }, [callbacks]),

    onHold: useCallback((touchData) => {
      if (callbacks.onHold) {
        callbacks.onHold(touchData)
      }
      // Trigger expanded state for hold
      if (callbacks.onExpand) {
        callbacks.onExpand(true, touchData)
      }
    }, [callbacks]),

    onTouchStart: useCallback((touchData) => {
      // Clear any existing hover timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }

      if (callbacks.onTouchStart) {
        callbacks.onTouchStart(touchData)
      }
    }, [callbacks]),

    onTouchEnd: useCallback((event) => {
      // Set timeout to end hover state after touch
      hoverTimeoutRef.current = setTimeout(() => {
        if (callbacks.onHover) {
          callbacks.onHover(false)
        }
        if (callbacks.onExpand) {
          callbacks.onExpand(false)
        }
      }, 300) // Brief delay to allow for visual feedback

      if (callbacks.onTouchEnd) {
        callbacks.onTouchEnd(event)
      }
    }, [callbacks])
  }

  const { registerElement, unregisterElement } = useTouchInteraction(
    enhancedCallbacks,
    {
      tapDebounceMs: 100,
      holdThresholdMs: 400,
      enableSwipeGestures: false // Disable swipe for cards
    }
  )

  // Enhanced register function that also handles mouse events for non-touch devices
  const registerCardElement = useCallback((element) => {
    if (!element) return

    elementRef.current = element

    // Register touch events if primary touch device
    if (isPrimaryTouch()) {
      registerElement(element)
    } else {
      // Add mouse event listeners for non-touch devices
      const handleMouseEnter = (event) => {
        if (callbacks.onHover) {
          callbacks.onHover(true, { element, event })
        }
      }

      const handleMouseLeave = (event) => {
        if (callbacks.onHover) {
          callbacks.onHover(false, { element, event })
        }
      }

      const handleClick = (event) => {
        if (callbacks.onTap) {
          callbacks.onTap({ element, event })
        }
      }

      element.addEventListener('mouseenter', handleMouseEnter)
      element.addEventListener('mouseleave', handleMouseLeave)
      element.addEventListener('click', handleClick)

      // Store cleanup function
      element._cardCleanup = () => {
        element.removeEventListener('mouseenter', handleMouseEnter)
        element.removeEventListener('mouseleave', handleMouseLeave)
        element.removeEventListener('click', handleClick)
      }
    }
  }, [isPrimaryTouch, registerElement, callbacks])

  // Enhanced unregister function
  const unregisterCardElement = useCallback(() => {
    if (elementRef.current) {
      // Clear any pending timeouts
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }

      // Unregister touch events
      unregisterElement()

      // Clean up mouse events if they exist
      if (elementRef.current._cardCleanup) {
        elementRef.current._cardCleanup()
        delete elementRef.current._cardCleanup
      }

      elementRef.current = null
    }
  }, [unregisterElement])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unregisterCardElement()
    }
  }, [unregisterCardElement])

  return {
    registerElement: registerCardElement,
    unregisterElement: unregisterCardElement,
    isPrimaryTouch: isPrimaryTouch(),
    isTouch: isPrimaryTouch()
  }
}

/**
 * Hook for swipe gesture handling
 */
export const useSwipeHandler = (callbacks = {}, options = {}) => {
  const swipeOptions = {
    enableSwipeGestures: true,
    swipeThresholdPx: 50,
    swipeVelocityThreshold: 0.3,
    ...options
  }

  const { registerElement, unregisterElement, isPrimaryTouch } = useTouchInteraction({
    onSwipe: callbacks.onSwipe,
    onTouchStart: callbacks.onTouchStart,
    onTouchEnd: callbacks.onTouchEnd
  }, swipeOptions)

  return {
    registerElement,
    unregisterElement,
    isPrimaryTouch
  }
}

/**
 * Hook for performance-aware touch interactions
 * Automatically adjusts behavior based on device performance
 */
export const usePerformanceTouchInteraction = (callbacks = {}, options = {}) => {
  const { getPerformanceLevel, prefersReducedMotion } = useDeviceDetection()
  
  const performanceLevel = getPerformanceLevel()
  const shouldOptimize = performanceLevel === 'low' || prefersReducedMotion()

  // Adjust options based on performance
  const optimizedOptions = {
    throttleMs: shouldOptimize ? 32 : 16, // Lower framerate for low-end devices
    tapDebounceMs: shouldOptimize ? 200 : 150,
    holdThresholdMs: shouldOptimize ? 600 : 500,
    enableSwipeGestures: !shouldOptimize, // Disable complex gestures on low-end devices
    ...options
  }

  const { registerElement, unregisterElement, isPrimaryTouch } = useTouchInteraction(
    callbacks,
    optimizedOptions
  )

  return {
    registerElement,
    unregisterElement,
    isPrimaryTouch,
    performanceLevel,
    shouldOptimize
  }
}

export default useTouchInteraction