import { useEffect, useRef, useCallback } from 'react'
import AnimationManager from '../utils/AnimationManager'

/**
 * React hook for using the Enhanced Animation Manager
 * Provides centralized animation management with automatic cleanup
 */
const useAnimationManager = () => {
  const animationManagerRef = useRef(null)
  const isInitializedRef = useRef(false)

  // Initialize animation manager
  useEffect(() => {
    if (!isInitializedRef.current) {
      animationManagerRef.current = new AnimationManager()
      isInitializedRef.current = true
      
      console.log('Animation Manager initialized')
    }

    // Cleanup on unmount
    return () => {
      if (animationManagerRef.current) {
        animationManagerRef.current.cleanup()
        animationManagerRef.current = null
        isInitializedRef.current = false
      }
    }
  }, [])

  /**
   * Create timeline for card expansion animation
   */
  const createCardTimeline = useCallback((cardIndex, cardElement) => {
    if (!animationManagerRef.current) {
      console.warn('Animation Manager not initialized')
      return null
    }
    
    return animationManagerRef.current.createCardTimeline(cardIndex, cardElement)
  }, [])

  /**
   * Handle card hover/interaction
   */
  const handleCardHover = useCallback((cardIndex, isHovering, cardElement) => {
    if (!animationManagerRef.current) {
      console.warn('Animation Manager not initialized')
      return
    }
    
    animationManagerRef.current.handleCardHover(cardIndex, isHovering, cardElement)
  }, [])

  /**
   * Stop animations for other cards
   */
  const stopOtherCardAnimations = useCallback((excludeIndex) => {
    if (!animationManagerRef.current) {
      console.warn('Animation Manager not initialized')
      return
    }
    
    animationManagerRef.current.stopOtherCardAnimations(excludeIndex)
  }, [])

  /**
   * Get current performance metrics
   */
  const getPerformanceMetrics = useCallback(() => {
    if (!animationManagerRef.current) {
      return {
        fps: 0,
        performanceLevel: 'unknown',
        isTouch: false,
        activeTimelines: 0,
        isMonitoring: false
      }
    }
    
    return animationManagerRef.current.getPerformanceMetrics()
  }, [])

  /**
   * Manually set performance level
   */
  const setPerformanceLevel = useCallback((level) => {
    if (!animationManagerRef.current) {
      console.warn('Animation Manager not initialized')
      return
    }
    
    animationManagerRef.current.setPerformanceLevel(level)
  }, [])

  /**
   * Handle animation errors
   */
  const handleAnimationError = useCallback((error, cardIndex) => {
    if (!animationManagerRef.current) {
      console.warn('Animation Manager not initialized')
      return
    }
    
    animationManagerRef.current.handleAnimationError(error, cardIndex)
  }, [])

  /**
   * Get animation manager instance (for advanced usage)
   */
  const getAnimationManager = useCallback(() => {
    return animationManagerRef.current
  }, [])

  /**
   * Force cleanup of all hover states (for testing and emergency cleanup)
   */
  const forceCleanupAllHoverStates = useCallback(() => {
    if (!animationManagerRef.current) {
      console.warn('Animation Manager not initialized')
      return
    }
    
    animationManagerRef.current.forceCleanupAllHoverStates()
  }, [])

  return {
    createCardTimeline,
    handleCardHover,
    stopOtherCardAnimations,
    getPerformanceMetrics,
    setPerformanceLevel,
    handleAnimationError,
    getAnimationManager,
    forceCleanupAllHoverStates,
    isInitialized: isInitializedRef.current
  }
}

export default useAnimationManager