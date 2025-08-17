import { gsap } from 'gsap'
import logger from './Logger'

/**
 * ParticleColorController - Manages particle color changes based on card hover states
 * Provides smooth color transitions and bounds-based particle color management
 */
class ParticleColorController {
    constructor(particleManager) {
        this.particleManager = particleManager
        this.activeCards = new Set()
        this.colorTransitions = new Map()
        this.originalColor = '#D14836' // Default particle color
        this.hoverColor = '#000000' // Black color for hover state

        logger.particles('ParticleColorController initialized', { originalColor: this.originalColor, hoverColor: this.hoverColor })
    }

    /**
     * Changes particle color for a specific card area
     * @param {number} cardIndex - Index of the card
     * @param {string} color - Target color (hex)
     * @param {DOMRect} bounds - Bounding rectangle for the card
     */
    setParticleColorForCard(cardIndex, color = this.hoverColor, bounds = null) {
        const transitionId = `card-${cardIndex}`

        try {
            // Cancel previous animation if exists
            if (this.colorTransitions.has(transitionId)) {
                this.colorTransitions.get(transitionId).kill()
            }

            // Create smooth color transition
            const transition = gsap.to({}, {
                duration: 0.8,
                ease: 'power2.inOut',
                onUpdate: () => {
                    if (this.particleManager && typeof this.particleManager.setParticleProps === 'function') {
                        this.particleManager.setParticleProps({
                            color: color,
                            bounds: bounds
                        })
                    }
                },
                onComplete: () => {
                    logger.particles(`Particle color transition completed for card ${cardIndex}`, { color, bounds })
                }
            })

            this.colorTransitions.set(transitionId, transition)
            this.activeCards.add(cardIndex)

            logger.particles(`Setting particle color for card ${cardIndex}`, { color, bounds })

        } catch (error) {
            logger.error('Error setting particle color:', error)
            this.handleColorTransitionError(cardIndex)
        }
    }

    /**
     * Restores original particle color for a specific card
     * @param {number} cardIndex - Index of the card
     */
    restoreParticleColor(cardIndex) {
        const transitionId = `card-${cardIndex}`

        try {
            // Cancel previous animation if exists
            if (this.colorTransitions.has(transitionId)) {
                this.colorTransitions.get(transitionId).kill()
            }

            // Create smooth transition back to original color
            const transition = gsap.to({}, {
                duration: 0.6,
                ease: 'power2.out',
                onUpdate: () => {
                    if (this.particleManager && typeof this.particleManager.setParticleProps === 'function') {
                        this.particleManager.setParticleProps({
                            color: this.originalColor,
                            bounds: null
                        })
                    }
                },
                onComplete: () => {
                    logger.particles(`Particle color restored for card ${cardIndex}`, { originalColor: this.originalColor })
                }
            })

            this.colorTransitions.set(transitionId, transition)
            this.activeCards.delete(cardIndex)

            logger.particles(`Restoring particle color for card ${cardIndex}`, { originalColor: this.originalColor })

        } catch (error) {
            logger.error('Error restoring particle color:', error)
            this.handleColorTransitionError(cardIndex)
        }
    }

    /**
     * Sets particle color for multiple cards simultaneously
     * @param {Array} cardConfigs - Array of {cardIndex, color, bounds} objects
     */
    setMultipleCardColors(cardConfigs) {
        cardConfigs.forEach(config => {
            const { cardIndex, color, bounds } = config
            this.setParticleColorForCard(cardIndex, color, bounds)
        })
    }

    /**
     * Restores all particle colors to original state
     */
    restoreAllColors() {
        this.activeCards.forEach(cardIndex => {
            this.restoreParticleColor(cardIndex)
        })
    }

    /**
     * Handles color transition errors with fallback
     * @param {number} cardIndex - Index of the card that failed
     */
    handleColorTransitionError(cardIndex) {
        try {
            // Fallback: directly set particle properties without animation
            if (this.particleManager && typeof this.particleManager.setParticleProps === 'function') {
                this.particleManager.setParticleProps({
                    color: this.originalColor,
                    bounds: null
                })
            }

            // Clean up failed transition
            const transitionId = `card-${cardIndex}`
            if (this.colorTransitions.has(transitionId)) {
                this.colorTransitions.delete(transitionId)
            }

            this.activeCards.delete(cardIndex)

            logger.error(`Fallback applied for card ${cardIndex} particle color`, { cardIndex, originalColor: this.originalColor })

        } catch (fallbackError) {
            logger.error('Critical error in particle color fallback:', fallbackError)
        }
    }

    /**
     * Gets current active cards
     * @returns {Set} Set of active card indices
     */
    getActiveCards() {
        return new Set(this.activeCards)
    }

    /**
     * Checks if a specific card is currently active
     * @param {number} cardIndex - Index of the card to check
     * @returns {boolean} True if card is active
     */
    isCardActive(cardIndex) {
        return this.activeCards.has(cardIndex)
    }

    /**
     * Updates the original particle color
     * @param {string} color - New original color (hex)
     */
    setOriginalColor(color) {
        this.originalColor = color
        logger.particles(`Original particle color updated`, { newColor: color, previousColor: this.originalColor })
    }

    /**
     * Updates the hover particle color
     * @param {string} color - New hover color (hex)
     */
    setHoverColor(color) {
        this.hoverColor = color
        logger.particles(`Hover particle color updated`, { newColor: color, previousColor: this.hoverColor })
    }

    /**
     * Cleanup method to kill all animations and reset state
     */
    cleanup() {
        try {
            // Kill all active transitions
            this.colorTransitions.forEach(transition => {
                if (transition && typeof transition.kill === 'function') {
                    transition.kill()
                }
            })

            // Clear all maps and sets
            this.colorTransitions.clear()
            this.activeCards.clear()

            // Restore original particle state
            if (this.particleManager && typeof this.particleManager.setParticleProps === 'function') {
                this.particleManager.setParticleProps({
                    color: this.originalColor,
                    bounds: null
                })
            }

            logger.particles('ParticleColorController cleanup completed', {
                clearedTransitions: this.colorTransitions.size,
                clearedActiveCards: this.activeCards.size
            })

        } catch (error) {
            logger.error('Error during ParticleColorController cleanup:', error)
        }
    }
}

export default ParticleColorController