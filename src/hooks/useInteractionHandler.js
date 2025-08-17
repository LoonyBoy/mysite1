import { useEffect, useRef, useCallback } from 'react'
import InteractionHandler from '../utils/InteractionHandler'

/**
 * React hook for managing touch/mouse interaction detection and handling
 * Integrates with AnimationManager and ParticleController for unified interaction management
 * 
 * @param {Object} animationManager - Instance of AnimationManager
 * @param {Object} particleController - Instance of ParticleController (optional)
 * @returns {Object} Interaction handler methods and state
 */
const useInteractionHandler = (animationManager, particleController = null) => {
  const interactionHandlerRef = useRef(null)
  const isInitializedRef = useRef(false)

  // Initialize interaction handler
  useEffect(() => {
    if (!animationManager || isInitializedRef.current) return

    try {
      interactionHandlerRef.current = new InteractionHandler(animationManager, particleController)
      isInitializedRef.current = true
      
      console.log('useInteractionHandler: Initialized successfully')
    } catch (error) {
      console.error('useInteractionHandler: Failed to initialize:', error)
    }

    // Cleanup on unmount
    return () => {
      if (interactionHandlerRef.current) {
        interactionHandlerRef.current.cleanup()
        interactionHandlerRef.current = null
        isInitializedRef.current = false
      }
    }
  }, [animationManager, particleController])

  // Handle card interaction events
  const handleCardInteraction = useCallback((cardElement, cardIndex, interactionType, event = null) => {
    if (!interactionHandlerRef.current) {
      console.warn('InteractionHandler not initialized')
      return
    }

    try {
      interactionHandlerRef.current.handleInteraction(cardElement, cardIndex, interactionType, event)
    } catch (error) {
      console.error(`Error handling ${interactionType} for card ${cardIndex}:`, error)
    }
  }, [])

  // Handle mouse enter events
  const handleMouseEnter = useCallback((cardElement, cardIndex, event) => {
    handleCardInteraction(cardElement, cardIndex, 'enter', event)
  }, [handleCardInteraction])

  // Handle mouse leave events
  const handleMouseLeave = useCallback((cardElement, cardIndex, event) => {
    handleCardInteraction(cardElement, cardIndex, 'leave', event)
  }, [handleCardInteraction])

  // Handle touch start events
  const handleTouchStart = useCallback((cardElement, cardIndex, event) => {
    handleCardInteraction(cardElement, cardIndex, 'touchstart', event)
  }, [handleCardInteraction])

  // Handle touch end events
  const handleTouchEnd = useCallback((cardElement, cardIndex, event) => {
    handleCardInteraction(cardElement, cardIndex, 'touchend', event)
  }, [handleCardInteraction])

  // Handle tap/click events
  const handleTap = useCallback((cardElement, cardIndex, event) => {
    handleCardInteraction(cardElement, cardIndex, 'tap', event)
  }, [handleCardInteraction])

  // Get device type information
  const getDeviceInfo = useCallback(() => {
    if (!interactionHandlerRef.current) return { isTouch: false }
    
    return {
      isTouch: interactionHandlerRef.current.isTouch,
      config: interactionHandlerRef.current.config
    }
  }, [])

  // Get current interaction state (for debugging)
  const getInteractionState = useCallback(() => {
    if (!interactionHandlerRef.current) return null
    
    return interactionHandlerRef.current.getInteractionState()
  }, [])

  // Update interaction configuration
  const updateConfig = useCallback((newConfig) => {
    if (!interactionHandlerRef.current) {
      console.warn('InteractionHandler not initialized, cannot update config')
      return
    }

    interactionHandlerRef.current.updateConfig(newConfig)
  }, [])

  // Create event handlers for React components (mobile-only)
  const createEventHandlers = useCallback((cardIndex) => {
    if (!interactionHandlerRef.current) {
      return {}
    }

    const isTouch = interactionHandlerRef.current.isTouch

    // Only provide handlers for touch devices
    if (isTouch) {
      return {
        onTouchStart: (event) => {
          const cardElement = event.currentTarget
          handleTouchStart(cardElement, cardIndex, event)
        },
        onTouchEnd: (event) => {
          const cardElement = event.currentTarget
          handleTouchEnd(cardElement, cardIndex, event)
        },
        onClick: (event) => {
          const cardElement = event.currentTarget
          handleTap(cardElement, cardIndex, event)
        },
        // Disable mouse events on touch devices to prevent conflicts
        onMouseEnter: undefined,
        onMouseLeave: undefined
      }
    }

    // For desktop devices, return empty object (let existing handlers work)
    return {}
  }, [handleTouchStart, handleTouchEnd, handleTap])

  // Attach event listeners to a card element (alternative to React event handlers)
  const attachEventListeners = useCallback((cardElement, cardIndex) => {
    if (!interactionHandlerRef.current || !cardElement) {
      console.warn('Cannot attach event listeners: missing handler or element')
      return () => {} // Return empty cleanup function
    }

    const isTouch = interactionHandlerRef.current.isTouch
    const eventListeners = []

    try {
      if (isTouch) {
        // Touch device event listeners
        const touchStartHandler = (event) => handleTouchStart(cardElement, cardIndex, event)
        const touchEndHandler = (event) => handleTouchEnd(cardElement, cardIndex, event)
        const clickHandler = (event) => handleTap(cardElement, cardIndex, event)

        cardElement.addEventListener('touchstart', touchStartHandler, { passive: true })
        cardElement.addEventListener('touchend', touchEndHandler, { passive: true })
        cardElement.addEventListener('click', clickHandler)

        eventListeners.push(
          ['touchstart', touchStartHandler],
          ['touchend', touchEndHandler],
          ['click', clickHandler]
        )
      } else {
        // Mouse device event listeners
        const mouseEnterHandler = (event) => handleMouseEnter(cardElement, cardIndex, event)
        const mouseLeaveHandler = (event) => handleMouseLeave(cardElement, cardIndex, event)
        const clickHandler = (event) => handleTap(cardElement, cardIndex, event)

        cardElement.addEventListener('mouseenter', mouseEnterHandler)
        cardElement.addEventListener('mouseleave', mouseLeaveHandler)
        cardElement.addEventListener('click', clickHandler)

        eventListeners.push(
          ['mouseenter', mouseEnterHandler],
          ['mouseleave', mouseLeaveHandler],
          ['click', clickHandler]
        )
      }

      console.log(`Attached ${isTouch ? 'touch' : 'mouse'} event listeners to card ${cardIndex}`)

      // Return cleanup function
      return () => {
        eventListeners.forEach(([eventType, handler]) => {
          cardElement.removeEventListener(eventType, handler)
        })
        console.log(`Removed event listeners from card ${cardIndex}`)
      }

    } catch (error) {
      console.error(`Error attaching event listeners to card ${cardIndex}:`, error)
      return () => {} // Return empty cleanup function
    }
  }, [handleMouseEnter, handleMouseLeave, handleTouchStart, handleTouchEnd, handleTap])

  return {
    // Core interaction methods
    handleCardInteraction,
    handleMouseEnter,
    handleMouseLeave,
    handleTouchStart,
    handleTouchEnd,
    handleTap,
    
    // Device and state information
    getDeviceInfo,
    getInteractionState,
    
    // Configuration
    updateConfig,
    
    // React integration helpers
    createEventHandlers,
    attachEventListeners,
    
    // State
    isInitialized: isInitializedRef.current,
    interactionHandler: interactionHandlerRef.current
  }
}

export default useInteractionHandler