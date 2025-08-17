import { useRef, useEffect, useCallback } from 'react'
import ParticleColorController from '../utils/ParticleColorController'
import logger from '../utils/Logger'

/**
 * React hook for managing particle color controller
 * @param {Object} particleManager - Global particle manager instance
 * @returns {Object} Particle color controller methods and state
 */
export const useParticleColorController = (particleManager) => {
  const controllerRef = useRef(null)

  // Initialize controller
  useEffect(() => {
    if (particleManager && !controllerRef.current) {
      controllerRef.current = new ParticleColorController(particleManager)
      logger.particles('ParticleColorController hook initialized', { hasParticleManager: !!particleManager })
    }

    // Cleanup on unmount
    return () => {
      if (controllerRef.current) {
        controllerRef.current.cleanup()
        controllerRef.current = null
      }
    }
  }, [particleManager])

  // Set particle color for card
  const setCardColor = useCallback((cardIndex, color, bounds) => {
    if (controllerRef.current) {
      controllerRef.current.setParticleColorForCard(cardIndex, color, bounds)
    }
  }, [])

  // Restore particle color for card
  const restoreCardColor = useCallback((cardIndex) => {
    if (controllerRef.current) {
      controllerRef.current.restoreParticleColor(cardIndex)
    }
  }, [])

  // Set multiple card colors
  const setMultipleColors = useCallback((cardConfigs) => {
    if (controllerRef.current) {
      controllerRef.current.setMultipleCardColors(cardConfigs)
    }
  }, [])

  // Restore all colors
  const restoreAllColors = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.restoreAllColors()
    }
  }, [])

  // Get active cards
  const getActiveCards = useCallback(() => {
    return controllerRef.current ? controllerRef.current.getActiveCards() : new Set()
  }, [])

  // Check if card is active
  const isCardActive = useCallback((cardIndex) => {
    return controllerRef.current ? controllerRef.current.isCardActive(cardIndex) : false
  }, [])

  // Update colors
  const setOriginalColor = useCallback((color) => {
    if (controllerRef.current) {
      controllerRef.current.setOriginalColor(color)
    }
  }, [])

  const setHoverColor = useCallback((color) => {
    if (controllerRef.current) {
      controllerRef.current.setHoverColor(color)
    }
  }, [])

  return {
    setCardColor,
    restoreCardColor,
    setMultipleColors,
    restoreAllColors,
    getActiveCards,
    isCardActive,
    setOriginalColor,
    setHoverColor,
    controller: controllerRef.current
  }
}

export default useParticleColorController