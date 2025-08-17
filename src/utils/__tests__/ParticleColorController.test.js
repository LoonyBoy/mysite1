import ParticleColorController from '../ParticleColorController'
import { gsap } from 'gsap'

// Mock GSAP
jest.mock('gsap', () => ({
  to: jest.fn(() => ({
    kill: jest.fn()
  }))
}))

// Mock Logger
jest.mock('../Logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}))

describe('ParticleColorController', () => {
  let mockParticleManager
  let controller

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock particle manager
    mockParticleManager = {
      setParticleProps: jest.fn()
    }
    
    // Create controller instance
    controller = new ParticleColorController(mockParticleManager)
  })

  afterEach(() => {
    if (controller) {
      controller.cleanup()
    }
  })

  describe('Constructor', () => {
    test('should initialize with correct default values', () => {
      expect(controller.particleManager).toBe(mockParticleManager)
      expect(controller.activeCards).toBeInstanceOf(Set)
      expect(controller.colorTransitions).toBeInstanceOf(Map)
      expect(controller.originalColor).toBe('#D14836')
      expect(controller.hoverColor).toBe('#000000')
    })

    test('should initialize with empty active cards and transitions', () => {
      expect(controller.activeCards.size).toBe(0)
      expect(controller.colorTransitions.size).toBe(0)
    })
  })

  describe('setParticleColorForCard', () => {
    test('should create color transition for card', () => {
      const cardIndex = 0
      const color = '#FF0000'
      const bounds = { x: 0, y: 0, width: 100, height: 100 }

      controller.setParticleColorForCard(cardIndex, color, bounds)

      expect(gsap.to).toHaveBeenCalledWith({}, expect.objectContaining({
        duration: 0.8,
        ease: 'power2.inOut',
        onUpdate: expect.any(Function),
        onComplete: expect.any(Function)
      }))

      expect(controller.activeCards.has(cardIndex)).toBe(true)
    })

    test('should use default hover color when no color provided', () => {
      const cardIndex = 1
      
      controller.setParticleColorForCard(cardIndex)
      
      expect(controller.activeCards.has(cardIndex)).toBe(true)
    })

    test('should kill previous transition for same card', () => {
      const cardIndex = 0
      const mockTransition = { kill: jest.fn() }
      
      // Set up existing transition
      controller.colorTransitions.set(`card-${cardIndex}`, mockTransition)
      
      controller.setParticleColorForCard(cardIndex)
      
      expect(mockTransition.kill).toHaveBeenCalled()
    })

    test('should handle particle manager errors gracefully', () => {
      // Mock particle manager to throw error
      mockParticleManager.setParticleProps = jest.fn(() => {
        throw new Error('Particle manager error')
      })
      
      expect(() => {
        controller.setParticleColorForCard(0)
      }).not.toThrow()
    })
  })

  describe('restoreParticleColor', () => {
    test('should restore original color for card', () => {
      const cardIndex = 0
      
      // First set a color
      controller.setParticleColorForCard(cardIndex)
      expect(controller.activeCards.has(cardIndex)).toBe(true)
      
      // Then restore
      controller.restoreParticleColor(cardIndex)
      
      expect(gsap.to).toHaveBeenCalledWith({}, expect.objectContaining({
        duration: 0.6,
        ease: 'power2.out',
        onUpdate: expect.any(Function),
        onComplete: expect.any(Function)
      }))
    })

    test('should remove card from active cards', () => {
      const cardIndex = 0
      
      controller.activeCards.add(cardIndex)
      controller.restoreParticleColor(cardIndex)
      
      expect(controller.activeCards.has(cardIndex)).toBe(false)
    })

    test('should kill existing transition before restoring', () => {
      const cardIndex = 0
      const mockTransition = { kill: jest.fn() }
      
      controller.colorTransitions.set(`card-${cardIndex}`, mockTransition)
      controller.restoreParticleColor(cardIndex)
      
      expect(mockTransition.kill).toHaveBeenCalled()
    })
  })

  describe('setMultipleCardColors', () => {
    test('should set colors for multiple cards', () => {
      const cardConfigs = [
        { cardIndex: 0, color: '#FF0000', bounds: { x: 0, y: 0 } },
        { cardIndex: 1, color: '#00FF00', bounds: { x: 100, y: 0 } }
      ]
      
      controller.setMultipleCardColors(cardConfigs)
      
      expect(controller.activeCards.has(0)).toBe(true)
      expect(controller.activeCards.has(1)).toBe(true)
      expect(gsap.to).toHaveBeenCalledTimes(2)
    })
  })

  describe('restoreAllColors', () => {
    test('should restore colors for all active cards', () => {
      // Add some active cards
      controller.activeCards.add(0)
      controller.activeCards.add(1)
      controller.activeCards.add(2)
      
      const originalSize = controller.activeCards.size
      controller.restoreAllColors()
      
      // Should call gsap.to for each active card
      expect(gsap.to).toHaveBeenCalledTimes(originalSize)
    })
  })

  describe('Utility Methods', () => {
    test('getActiveCards should return copy of active cards', () => {
      controller.activeCards.add(0)
      controller.activeCards.add(1)
      
      const activeCards = controller.getActiveCards()
      
      expect(activeCards).toBeInstanceOf(Set)
      expect(activeCards.size).toBe(2)
      expect(activeCards.has(0)).toBe(true)
      expect(activeCards.has(1)).toBe(true)
    })

    test('isCardActive should return correct status', () => {
      controller.activeCards.add(0)
      
      expect(controller.isCardActive(0)).toBe(true)
      expect(controller.isCardActive(1)).toBe(false)
    })

    test('setOriginalColor should update original color', () => {
      const newColor = '#FFFFFF'
      controller.setOriginalColor(newColor)
      
      expect(controller.originalColor).toBe(newColor)
    })

    test('setHoverColor should update hover color', () => {
      const newColor = '#FF00FF'
      controller.setHoverColor(newColor)
      
      expect(controller.hoverColor).toBe(newColor)
    })
  })

  describe('Error Handling', () => {
    test('handleColorTransitionError should clean up failed transition', () => {
      const cardIndex = 0
      const mockTransition = { kill: jest.fn() }
      
      controller.colorTransitions.set(`card-${cardIndex}`, mockTransition)
      controller.activeCards.add(cardIndex)
      
      controller.handleColorTransitionError(cardIndex)
      
      expect(controller.colorTransitions.has(`card-${cardIndex}`)).toBe(false)
      expect(controller.activeCards.has(cardIndex)).toBe(false)
      expect(mockParticleManager.setParticleProps).toHaveBeenCalledWith({
        color: controller.originalColor,
        bounds: null
      })
    })

    test('should handle particle manager being null', () => {
      const controllerWithoutManager = new ParticleColorController(null)
      
      expect(() => {
        controllerWithoutManager.setParticleColorForCard(0)
      }).not.toThrow()
    })
  })

  describe('Cleanup', () => {
    test('should kill all transitions and clear state', () => {
      const mockTransition1 = { kill: jest.fn() }
      const mockTransition2 = { kill: jest.fn() }
      
      controller.colorTransitions.set('card-0', mockTransition1)
      controller.colorTransitions.set('card-1', mockTransition2)
      controller.activeCards.add(0)
      controller.activeCards.add(1)
      
      controller.cleanup()
      
      expect(mockTransition1.kill).toHaveBeenCalled()
      expect(mockTransition2.kill).toHaveBeenCalled()
      expect(controller.colorTransitions.size).toBe(0)
      expect(controller.activeCards.size).toBe(0)
      expect(mockParticleManager.setParticleProps).toHaveBeenCalledWith({
        color: controller.originalColor,
        bounds: null
      })
    })

    test('should handle cleanup errors gracefully', () => {
      const mockTransition = { 
        kill: jest.fn(() => { throw new Error('Kill error') })
      }
      
      controller.colorTransitions.set('card-0', mockTransition)
      
      expect(() => {
        controller.cleanup()
      }).not.toThrow()
    })
  })
})