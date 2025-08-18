/**
 * React Hook for Mobile Card Full-Height Expansion
 * Task 3: Create Mobile Card Full-Height Expansion
 * 
 * Provides React integration for the mobile card full-height expansion system
 * with automatic cleanup and state management.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import MobileCardFullHeightExpansion from '../utils/MobileCardFullHeightExpansion'

/**
 * Hook for managing mobile card full-height expansion
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Expansion methods and state
 */
const useMobileCardFullHeightExpansion = (options = {}) => {
  const expansionSystemRef = useRef(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [activeExpansions, setActiveExpansions] = useState(0)

  // Initialize expansion system
  useEffect(() => {
    if (!expansionSystemRef.current) {
      expansionSystemRef.current = new MobileCardFullHeightExpansion(options)
      setIsInitialized(true)
      
      console.log('MobileCardFullHeightExpansion hook initialized')
    }

    // Cleanup on unmount
    return () => {
      if (expansionSystemRef.current) {
        expansionSystemRef.current.cleanup()
        expansionSystemRef.current = null
        setIsInitialized(false)
      }
    }
  }, [])

  /**
   * Expand card to full viewport height
   * Requirements 2.1, 2.2: Card expansion to reach full viewport height
   */
  const expandCard = useCallback(async (cardElement, expansionOptions = {}) => {
    if (!expansionSystemRef.current || !cardElement) {
      console.warn('Expansion system not initialized or card element missing')
      return Promise.reject(new Error('Expansion system not ready'))
    }

    try {
      setActiveExpansions(prev => prev + 1)
      const result = await expansionSystemRef.current.expandCard(cardElement, expansionOptions)
      return result
    } catch (error) {
      console.error('Error expanding card:', error)
      setActiveExpansions(prev => Math.max(0, prev - 1))
      throw error
    }
  }, [])

  /**
   * Contract card from full height back to original size
   * Requirement 2.3: Smooth transitions between states
   */
  const contractCard = useCallback(async (cardElement, contractionOptions = {}) => {
    if (!expansionSystemRef.current || !cardElement) {
      console.warn('Expansion system not initialized or card element missing')
      return Promise.resolve()
    }

    try {
      await expansionSystemRef.current.contractCard(cardElement, contractionOptions)
      setActiveExpansions(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error contracting card:', error)
      setActiveExpansions(prev => Math.max(0, prev - 1))
      throw error
    }
  }, [])

  /**
   * Toggle card expansion state
   */
  const toggleCardExpansion = useCallback(async (cardElement, options = {}) => {
    if (!expansionSystemRef.current || !cardElement) {
      return Promise.reject(new Error('Expansion system not ready'))
    }

    const isExpanded = expansionSystemRef.current.isCardExpanded(cardElement)
    
    if (isExpanded) {
      return contractCard(cardElement, options)
    } else {
      return expandCard(cardElement, options)
    }
  }, [expandCard, contractCard])

  /**
   * Check if card is currently expanded
   */
  const isCardExpanded = useCallback((cardElement) => {
    if (!expansionSystemRef.current || !cardElement) {
      return false
    }
    
    return expansionSystemRef.current.isCardExpanded(cardElement)
  }, [])

  /**
   * Check if card is currently expanding
   */
  const isCardExpanding = useCallback((cardElement) => {
    if (!expansionSystemRef.current || !cardElement) {
      return false
    }
    
    return expansionSystemRef.current.isCardExpanding(cardElement)
  }, [])

  /**
   * Get expansion state for a card
   */
  const getExpansionState = useCallback((cardElement) => {
    if (!expansionSystemRef.current || !cardElement) {
      return { isExpanded: false, isExpanding: false, isContracting: false }
    }
    
    return expansionSystemRef.current.getExpansionState(cardElement)
  }, [])

  /**
   * Contract all expanded cards
   */
  const contractAllCards = useCallback(async () => {
    if (!expansionSystemRef.current) {
      return Promise.resolve()
    }

    try {
      await expansionSystemRef.current.contractAllCards()
      setActiveExpansions(0)
    } catch (error) {
      console.error('Error contracting all cards:', error)
      throw error
    }
  }, [])

  /**
   * Get current viewport height with mobile considerations
   */
  const getViewportHeight = useCallback(() => {
    if (!expansionSystemRef.current) {
      return window.innerHeight
    }
    
    return expansionSystemRef.current.getViewportHeight()
  }, [])

  /**
   * Get safe area insets for notched devices
   */
  const getSafeAreaInsets = useCallback(() => {
    if (!expansionSystemRef.current) {
      return { top: 0, right: 0, bottom: 0, left: 0 }
    }
    
    return expansionSystemRef.current.getSafeAreaInsets()
  }, [])

  /**
   * Get performance metrics
   */
  const getMetrics = useCallback(() => {
    if (!expansionSystemRef.current) {
      return {
        activeExpansions: 0,
        isTouch: false,
        viewportHeight: 0,
        safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
        useDynamicViewport: false
      }
    }
    
    return expansionSystemRef.current.getMetrics()
  }, [])

  /**
   * Get the expansion system instance (for advanced usage)
   */
  const getExpansionSystem = useCallback(() => {
    return expansionSystemRef.current
  }, [])

  /**
   * Handle card interaction (expand/contract based on current state)
   */
  const handleCardInteraction = useCallback(async (cardElement, interactionOptions = {}) => {
    if (!cardElement) {
      return Promise.reject(new Error('Card element is required'))
    }

    const state = getExpansionState(cardElement)
    
    // Prevent interaction during transitions
    if (state.isExpanding || state.isContracting) {
      console.log('Card is currently transitioning, ignoring interaction')
      return Promise.resolve()
    }

    // Toggle expansion state
    return toggleCardExpansion(cardElement, interactionOptions)
  }, [getExpansionState, toggleCardExpansion])

  /**
   * Initialize card for full-height expansion
   */
  const initializeCard = useCallback((cardElement, cardOptions = {}) => {
    if (!cardElement || !expansionSystemRef.current) {
      console.warn('Cannot initialize card: missing element or expansion system')
      return false
    }

    try {
      // Add data attributes for tracking
      const cardIndex = cardElement.dataset.cardIndex || 
                       cardOptions.cardIndex || 
                       Date.now().toString()
      
      cardElement.dataset.cardIndex = cardIndex
      cardElement.dataset.fullHeightExpansion = 'true'
      
      // Add CSS classes for styling
      cardElement.classList.add('mobile-card-full-height')
      
      console.log(`Initialized card ${cardIndex} for full-height expansion`)
      return true
    } catch (error) {
      console.error('Error initializing card for full-height expansion:', error)
      return false
    }
  }, [])

  /**
   * Cleanup card expansion state
   */
  const cleanupCard = useCallback(async (cardElement) => {
    if (!cardElement) {
      return
    }

    try {
      // Contract card if expanded
      const state = getExpansionState(cardElement)
      if (state.isExpanded || state.isExpanding) {
        await contractCard(cardElement)
      }

      // Remove data attributes and classes
      cardElement.removeAttribute('data-full-height-expansion')
      cardElement.classList.remove('mobile-card-full-height')
      
      console.log('Cleaned up card full-height expansion state')
    } catch (error) {
      console.error('Error cleaning up card:', error)
    }
  }, [getExpansionState, contractCard])

  return {
    // Core expansion methods
    expandCard,
    contractCard,
    toggleCardExpansion,
    handleCardInteraction,
    
    // State queries
    isCardExpanded,
    isCardExpanding,
    getExpansionState,
    
    // Batch operations
    contractAllCards,
    
    // Viewport utilities
    getViewportHeight,
    getSafeAreaInsets,
    
    // Card management
    initializeCard,
    cleanupCard,
    
    // System utilities
    getMetrics,
    getExpansionSystem,
    
    // State
    isInitialized,
    activeExpansions,
    
    // System info
    isTouch: expansionSystemRef.current?.isTouch || false,
    viewportHeight: expansionSystemRef.current?.viewportHeight || 0
  }
}

export default useMobileCardFullHeightExpansion