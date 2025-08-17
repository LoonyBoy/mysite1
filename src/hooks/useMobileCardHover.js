import { useRef, useEffect, useCallback } from 'react'
import MobileCardHoverSystem from '../utils/MobileCardHoverSystem'

/**
 * React hook for mobile card hover system
 * Provides touch-optimized card interactions with proper event handling
 * Requirements: 1.1, 1.2, 1.3, 5.2, 5.3
 */
const useMobileCardHover = (options = {}) => {
  const mobileHoverSystemRef = useRef(null)
  const initializedCardsRef = useRef(new Set())

  // Initialize the mobile hover system
  useEffect(() => {
    mobileHoverSystemRef.current = new MobileCardHoverSystem(options)
    
    return () => {
      if (mobileHoverSystemRef.current) {
        mobileHoverSystemRef.current.cleanup()
      }
    }
  }, [])

  // Update options when they change
  useEffect(() => {
    if (mobileHoverSystemRef.current && Object.keys(options).length > 0) {
      mobileHoverSystemRef.current.updateOptions(options)
    }
  }, [options])

  /**
   * Initialize a card for mobile hover interactions
   * Requirement 1.1: Only the touched card should expand, not all cards
   * @param {HTMLElement} cardElement - Card element to initialize
   * @param {number} cardIndex - Index of the card
   * @param {Function} onHoverChange - Callback for hover state changes
   */
  const initializeCard = useCallback((cardElement, cardIndex, onHoverChange) => {
    if (!mobileHoverSystemRef.current || !cardElement) {
      console.warn('Cannot initialize card: system not ready or element missing')
      return
    }

    // Avoid double initialization
    const cardKey = `${cardIndex}-${cardElement.id || 'no-id'}`
    if (initializedCardsRef.current.has(cardKey)) {
      return
    }

    try {
      mobileHoverSystemRef.current.initializeCard(cardElement, cardIndex, onHoverChange)
      initializedCardsRef.current.add(cardKey)
      
      console.log(`Card ${cardIndex} initialized for mobile hover`)
    } catch (error) {
      console.error(`Failed to initialize card ${cardIndex}:`, error)
    }
  }, [])

  /**
   * Remove a card from mobile hover system
   * @param {number} cardIndex - Index of the card to remove
   * @param {HTMLElement} cardElement - Card element to remove (optional)
   */
  const removeCard = useCallback((cardIndex, cardElement = null) => {
    if (!mobileHoverSystemRef.current) return

    try {
      // Find and remove from initialized cards
      const cardKey = `${cardIndex}-${cardElement?.id || 'no-id'}`
      initializedCardsRef.current.delete(cardKey)
      
      // If element provided, remove its listeners
      if (cardElement && mobileHoverSystemRef.current.removeCardListeners) {
        mobileHoverSystemRef.current.removeCardListeners(cardElement)
      }
      
      console.log(`Card ${cardIndex} removed from mobile hover system`)
    } catch (error) {
      console.error(`Failed to remove card ${cardIndex}:`, error)
    }
  }, [])

  /**
   * Check if device supports touch
   */
  const isTouch = useCallback(() => {
    return mobileHoverSystemRef.current?.isTouch || false
  }, [])

  /**
   * Get current system status
   */
  const getStatus = useCallback(() => {
    return mobileHoverSystemRef.current?.getStatus() || {}
  }, [])

  /**
   * Force end all active touches (emergency cleanup)
   */
  const forceEndAllTouches = useCallback(() => {
    if (mobileHoverSystemRef.current) {
      mobileHoverSystemRef.current.forceEndAllTouches()
    }
  }, [])

  /**
   * Clean up all cards and system
   */
  const cleanup = useCallback(() => {
    if (mobileHoverSystemRef.current) {
      mobileHoverSystemRef.current.cleanup()
    }
    initializedCardsRef.current.clear()
  }, [])

  /**
   * Create a ref callback for easy card initialization
   * @param {number} cardIndex - Index of the card
   * @param {Function} onHoverChange - Callback for hover state changes
   * @returns {Function} Ref callback function
   */
  const createCardRef = useCallback((cardIndex, onHoverChange) => {
    return (element) => {
      if (element) {
        // Initialize when element is mounted
        initializeCard(element, cardIndex, onHoverChange)
      } else {
        // Clean up when element is unmounted
        removeCard(cardIndex)
      }
    }
  }, [initializeCard, removeCard])

  return {
    initializeCard,
    removeCard,
    createCardRef,
    isTouch,
    getStatus,
    forceEndAllTouches,
    cleanup,
    // Direct access to the system for advanced usage
    mobileHoverSystem: mobileHoverSystemRef.current
  }
}

export default useMobileCardHover