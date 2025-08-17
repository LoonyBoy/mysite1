import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import InteractionHandler from '../InteractionHandler'

// Mock GSAP
vi.mock('gsap', () => ({
  gsap: {
    to: vi.fn(),
    set: vi.fn()
  }
}))

// Mock AnimationManager
const mockAnimationManager = {
  timelines: new Map(),
  createCardTimeline: vi.fn(),
  stopOtherCardAnimations: vi.fn()
}

// Mock ParticleController
const mockParticleController = {
  setParticleColorForCard: vi.fn(),
  restoreParticleColor: vi.fn()
}

// Mock DOM elements
const createMockCardElement = (index) => ({
  getBoundingClientRect: () => ({
    top: 100,
    left: 100,
    width: 200,
    height: 300,
    right: 300,
    bottom: 400
  }),
  style: {},
  dataset: { cardIndex: index.toString() }
})

// Mock window and navigator
const mockWindow = {
  matchMedia: vi.fn(() => ({ matches: false })),
  navigator: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    maxTouchPoints: 0,
    msMaxTouchPoints: 0
  }
}

describe('InteractionHandler', () => {
  let interactionHandler
  let mockTimeline

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup mock timeline
    mockTimeline = {
      play: vi.fn(),
      reverse: vi.fn(),
      kill: vi.fn()
    }
    
    mockAnimationManager.timelines.set(0, mockTimeline)
    mockAnimationManager.createCardTimeline.mockReturnValue(mockTimeline)
    
    // Mock global objects
    global.window = mockWindow
    global.navigator = mockWindow.navigator
    global.Date = {
      now: vi.fn(() => 1000)
    }
    global.setTimeout = vi.fn((fn) => {
      fn() // Execute immediately for testing
      return 123
    })
    global.clearTimeout = vi.fn()
    
    // Create InteractionHandler instance
    interactionHandler = new InteractionHandler(mockAnimationManager, mockParticleController)
  })

  afterEach(() => {
    if (interactionHandler) {
      interactionHandler.cleanup()
    }
  })

  describe('Device Detection', () => {
    it('should detect mouse device by default', () => {
      expect(interactionHandler.isTouch).toBe(false)
    })

    it('should detect touch device when touch events are supported', () => {
      // Mock touch support
      global.window.ontouchstart = true
      
      const touchHandler = new InteractionHandler(mockAnimationManager, mockParticleController)
      expect(touchHandler.isTouch).toBe(true)
      
      touchHandler.cleanup()
    })

    it('should detect touch device via media query', () => {
      mockWindow.matchMedia.mockReturnValue({ matches: true })
      
      const touchHandler = new InteractionHandler(mockAnimationManager, mockParticleController)
      expect(touchHandler.isTouch).toBe(true)
      
      touchHandler.cleanup()
    })

    it('should detect touch device via maxTouchPoints', () => {
      global.navigator.maxTouchPoints = 1
      
      const touchHandler = new InteractionHandler(mockAnimationManager, mockParticleController)
      expect(touchHandler.isTouch).toBe(true)
      
      touchHandler.cleanup()
    })
  })

  describe('Mouse Interactions', () => {
    it('should handle mouse enter correctly', () => {
      const cardElement = createMockCardElement(0)
      const mockEvent = { type: 'mouseenter' }

      interactionHandler.handleInteraction(cardElement, 0, 'enter', mockEvent)

      expect(mockAnimationManager.stopOtherCardAnimations).toHaveBeenCalledWith(0)
      expect(mockTimeline.play).toHaveBeenCalled()
      expect(mockParticleController.setParticleColorForCard).toHaveBeenCalledWith(0, '#000000', expect.any(Object))
    })

    it('should handle mouse leave correctly', () => {
      const cardElement = createMockCardElement(0)
      const mockEvent = { type: 'mouseleave' }

      // First enter to set up state
      interactionHandler.handleInteraction(cardElement, 0, 'enter', mockEvent)
      
      // Then leave
      interactionHandler.handleInteraction(cardElement, 0, 'leave', mockEvent)

      expect(mockTimeline.reverse).toHaveBeenCalled()
      expect(mockParticleController.restoreParticleColor).toHaveBeenCalledWith(0)
    })

    it('should ignore rapid events to prevent flickering', () => {
      const cardElement = createMockCardElement(0)
      
      // Mock rapid events (within threshold)
      global.Date.now = vi.fn()
        .mockReturnValueOnce(1000)  // First event
        .mockReturnValueOnce(1020)  // Second event (20ms later, within 50ms threshold)

      interactionHandler.handleInteraction(cardElement, 0, 'enter')
      interactionHandler.handleInteraction(cardElement, 0, 'leave')

      // Second event should be ignored
      expect(mockTimeline.play).toHaveBeenCalledTimes(1)
      expect(mockTimeline.reverse).not.toHaveBeenCalled()
    })
  })

  describe('Touch Interactions', () => {
    beforeEach(() => {
      // Create touch-enabled handler
      global.window.ontouchstart = true
      interactionHandler = new InteractionHandler(mockAnimationManager, mockParticleController)
    })

    it('should handle touch start correctly', () => {
      const cardElement = createMockCardElement(0)
      const mockEvent = {
        type: 'touchstart',
        touches: [{ clientX: 100, clientY: 200 }]
      }

      interactionHandler.handleInteraction(cardElement, 0, 'touchstart', mockEvent)

      expect(interactionHandler.activeInteractions.has('0-touch')).toBe(true)
    })

    it('should handle touch end correctly', () => {
      const cardElement = createMockCardElement(0)
      const touchStartEvent = {
        type: 'touchstart',
        touches: [{ clientX: 100, clientY: 200 }]
      }
      const touchEndEvent = {
        type: 'touchend',
        changedTouches: [{ clientX: 105, clientY: 205 }]
      }

      // Start touch
      interactionHandler.handleInteraction(cardElement, 0, 'touchstart', touchStartEvent)
      
      // End touch (should be detected as tap due to short duration and small movement)
      global.Date.now = vi.fn(() => 1100) // 100ms later
      interactionHandler.handleInteraction(cardElement, 0, 'touchend', touchEndEvent)

      expect(interactionHandler.activeInteractions.has('0-touch')).toBe(false)
    })

    it('should ignore mouse events on touch devices', () => {
      const cardElement = createMockCardElement(0)
      const mouseEvent = { type: 'mouseenter' }

      interactionHandler.handleInteraction(cardElement, 0, 'enter', mouseEvent)

      // Should not trigger animation on touch device with mouse event
      expect(mockTimeline.play).not.toHaveBeenCalled()
    })
  })

  describe('Debouncing and Locking', () => {
    it('should debounce rapid enter/leave events', () => {
      const cardElement = createMockCardElement(0)
      
      // Mock setTimeout to not execute immediately
      global.setTimeout = vi.fn((fn, delay) => {
        return setTimeout(fn, delay)
      })

      interactionHandler.handleInteraction(cardElement, 0, 'enter')
      interactionHandler.handleInteraction(cardElement, 0, 'leave')

      expect(global.setTimeout).toHaveBeenCalledTimes(2)
      expect(mockTimeline.play).not.toHaveBeenCalled() // Should be debounced
    })

    it('should lock interactions to prevent conflicts', () => {
      const cardElement = createMockCardElement(0)
      
      // Set up interaction lock
      interactionHandler.lockInteraction(0, 'leave', 500)
      
      // Try to trigger leave event while locked
      interactionHandler.handleInteraction(cardElement, 0, 'leave')
      
      expect(mockTimeline.reverse).not.toHaveBeenCalled()
    })

    it('should clear expired locks', () => {
      const cardElement = createMockCardElement(0)
      
      // Set up interaction lock
      interactionHandler.lockInteraction(0, 'leave', 100)
      
      // Mock time passing beyond lock duration
      global.Date.now = vi.fn(() => 1200) // 200ms later
      
      // Should not be locked anymore
      expect(interactionHandler.isInteractionLocked(0, 'leave')).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle animation manager errors gracefully', () => {
      mockAnimationManager.stopOtherCardAnimations.mockImplementation(() => {
        throw new Error('Animation error')
      })

      const cardElement = createMockCardElement(0)
      
      // Should not throw error
      expect(() => {
        interactionHandler.handleInteraction(cardElement, 0, 'enter')
      }).not.toThrow()
    })

    it('should recover from interaction errors', () => {
      const cardElement = createMockCardElement(0)
      
      // Simulate error in interaction
      interactionHandler.handleInteractionError(new Error('Test error'), 0, 'enter')
      
      // Should clear problematic state
      expect(interactionHandler.activeInteractions.has(0)).toBe(false)
    })
  })

  describe('Configuration', () => {
    it('should allow configuration updates', () => {
      const newConfig = {
        debounceDelay: 200,
        lockDuration: 400
      }

      interactionHandler.updateConfig(newConfig)

      expect(interactionHandler.config.debounceDelay).toBe(200)
      expect(interactionHandler.config.lockDuration).toBe(400)
    })

    it('should provide interaction state for debugging', () => {
      const state = interactionHandler.getInteractionState()

      expect(state).toHaveProperty('isTouch')
      expect(state).toHaveProperty('activeInteractions')
      expect(state).toHaveProperty('config')
    })
  })

  describe('Cleanup', () => {
    it('should clean up all resources on cleanup', () => {
      const cardElement = createMockCardElement(0)
      
      // Set up some state
      interactionHandler.handleInteraction(cardElement, 0, 'enter')
      interactionHandler.lockInteraction(0, 'leave', 500)
      
      // Cleanup
      interactionHandler.cleanup()
      
      expect(interactionHandler.activeInteractions.size).toBe(0)
      expect(interactionHandler.interactionLocks.size).toBe(0)
      expect(interactionHandler.debounceTimers.size).toBe(0)
    })
  })
})