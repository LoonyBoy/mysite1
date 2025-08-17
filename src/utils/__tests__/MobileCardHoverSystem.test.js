import MobileCardHoverSystem from '../MobileCardHoverSystem'

// Mock GSAP
jest.mock('gsap', () => ({
  gsap: {
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    })),
    to: jest.fn(),
    set: jest.fn()
  }
}))

// Mock DOM methods
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query.includes('pointer: coarse'),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock navigator properties
Object.defineProperty(navigator, 'maxTouchPoints', {
  writable: true,
  value: 0,
})

Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
})

describe('MobileCardHoverSystem', () => {
  let system
  let mockCardElement

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Create mock card element
    mockCardElement = {
      dataset: {},
      style: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      cloneNode: jest.fn().mockReturnValue({
        dataset: {},
        style: {},
        classList: { add: jest.fn(), remove: jest.fn() }
      }),
      parentNode: {
        replaceChild: jest.fn()
      },
      querySelector: jest.fn(),
      _mobileHoverCallback: null
    }
    
    // Create system instance
    system = new MobileCardHoverSystem({
      touchDebounceTime: 50,
      hapticFeedbackDuration: 0.15,
      visualFeedbackDuration: 0.3
    })
  })

  afterEach(() => {
    if (system) {
      system.cleanup()
    }
  })

  describe('Touch Device Detection', () => {
    test('should detect touch device with ontouchstart', () => {
      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        value: true
      })
      
      const touchSystem = new MobileCardHoverSystem()
      expect(touchSystem.isTouch).toBe(true)
    })

    test('should detect touch device with pointer: coarse', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('pointer: coarse'),
        media: query
      }))
      
      const touchSystem = new MobileCardHoverSystem()
      expect(touchSystem.isTouch).toBe(true)
    })

    test('should detect touch device with maxTouchPoints', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 5
      })
      
      const touchSystem = new MobileCardHoverSystem()
      expect(touchSystem.isTouch).toBe(true)
    })

    test('should fallback to non-touch for desktop', () => {
      // Ensure no touch indicators
      delete window.ontouchstart
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 0 })
      window.matchMedia = jest.fn().mockReturnValue({ matches: false })
      
      const desktopSystem = new MobileCardHoverSystem()
      expect(desktopSystem.isTouch).toBe(false)
    })
  })

  describe('Card Initialization', () => {
    test('should initialize card with proper attributes', () => {
      const onHoverChange = jest.fn()
      
      system.initializeCard(mockCardElement, 0, onHoverChange)
      
      expect(mockCardElement.dataset.cardIndex).toBe('0')
      expect(mockCardElement.dataset.mobileHoverInitialized).toBe('true')
      expect(mockCardElement._mobileHoverCallback).toBe(onHoverChange)
    })

    test('should add touch event listeners for touch devices', () => {
      // Mock as touch device
      system.isTouch = true
      
      system.initializeCard(mockCardElement, 0)
      
      expect(mockCardElement.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: false })
      expect(mockCardElement.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function), { passive: false })
      expect(mockCardElement.addEventListener).toHaveBeenCalledWith('touchcancel', expect.any(Function), { passive: false })
      expect(mockCardElement.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false })
    })

    test('should add mouse event listeners for non-touch devices', () => {
      // Mock as non-touch device
      system.isTouch = false
      
      system.initializeCard(mockCardElement, 0)
      
      expect(mockCardElement.addEventListener).toHaveBeenCalledWith('mouseenter', expect.any(Function))
      expect(mockCardElement.addEventListener).toHaveBeenCalledWith('mouseleave', expect.any(Function))
    })

    test('should handle missing card element gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      system.initializeCard(null, 0)
      
      expect(consoleSpy).toHaveBeenCalledWith('Cannot initialize card 0: element not found')
      consoleSpy.mockRestore()
    })
  })

  describe('Touch Event Handling', () => {
    beforeEach(() => {
      system.isTouch = true
      system.initializeCard(mockCardElement, 0)
    })

    test('should handle touch start event', () => {
      const mockTouchEvent = {
        preventDefault: jest.fn(),
        currentTarget: mockCardElement,
        touches: [{
          identifier: 1,
          clientX: 100,
          clientY: 200
        }]
      }
      
      mockCardElement.dataset.cardIndex = '0'
      
      system.handleTouchStart(mockTouchEvent)
      
      expect(mockTouchEvent.preventDefault).toHaveBeenCalled()
      expect(mockCardElement.classList.add).toHaveBeenCalledWith('card-touch-active')
      expect(system.activeTouches.has(0)).toBe(true)
    })

    test('should handle touch end event', () => {
      // First start a touch
      const mockTouchStartEvent = {
        preventDefault: jest.fn(),
        currentTarget: mockCardElement,
        touches: [{ identifier: 1, clientX: 100, clientY: 200 }]
      }
      mockCardElement.dataset.cardIndex = '0'
      system.handleTouchStart(mockTouchStartEvent)
      
      // Then end the touch
      const mockTouchEndEvent = {
        preventDefault: jest.fn(),
        currentTarget: mockCardElement
      }
      
      system.handleTouchEnd(mockTouchEndEvent)
      
      expect(mockTouchEndEvent.preventDefault).toHaveBeenCalled()
      expect(mockCardElement.classList.remove).toHaveBeenCalledWith('card-touch-active')
    })

    test('should handle touch cancel event', () => {
      // First start a touch
      const mockTouchStartEvent = {
        preventDefault: jest.fn(),
        currentTarget: mockCardElement,
        touches: [{ identifier: 1, clientX: 100, clientY: 200 }]
      }
      mockCardElement.dataset.cardIndex = '0'
      system.handleTouchStart(mockTouchStartEvent)
      
      // Then cancel the touch
      const mockTouchCancelEvent = {
        preventDefault: jest.fn(),
        currentTarget: mockCardElement
      }
      
      system.handleTouchCancel(mockTouchCancelEvent)
      
      expect(mockTouchCancelEvent.preventDefault).toHaveBeenCalled()
      expect(mockCardElement.classList.remove).toHaveBeenCalledWith('card-touch-active')
      expect(mockCardElement.classList.remove).toHaveBeenCalledWith('card-touch-hover')
    })

    test('should debounce rapid touch events', () => {
      const mockTouchEvent = {
        preventDefault: jest.fn(),
        currentTarget: mockCardElement,
        touches: [{ identifier: 1, clientX: 100, clientY: 200 }]
      }
      mockCardElement.dataset.cardIndex = '0'
      
      // First touch
      system.handleTouchStart(mockTouchEvent)
      expect(system.activeTouches.has(0)).toBe(true)
      
      // Rapid second touch (should be ignored)
      system.handleTouchStart(mockTouchEvent)
      
      // Should still only have one active touch
      expect(system.activeTouches.size).toBe(1)
    })
  })

  describe('Mouse Event Handling', () => {
    beforeEach(() => {
      system.isTouch = false
      system.initializeCard(mockCardElement, 0, jest.fn())
    })

    test('should handle mouse enter event', () => {
      const mockMouseEvent = {
        currentTarget: mockCardElement
      }
      
      system.handleMouseEnter(mockMouseEvent, 0, jest.fn())
      
      expect(mockCardElement.classList.add).toHaveBeenCalledWith('card-touch-hover')
    })

    test('should handle mouse leave event', () => {
      const mockMouseEvent = {
        currentTarget: mockCardElement
      }
      
      system.handleMouseLeave(mockMouseEvent, 0, jest.fn())
      
      expect(mockCardElement.classList.remove).toHaveBeenCalledWith('card-touch-hover')
    })

    test('should call hover callback on mouse events', () => {
      const onHoverChange = jest.fn()
      const mockMouseEvent = {
        currentTarget: mockCardElement
      }
      
      system.handleMouseEnter(mockMouseEvent, 0, onHoverChange)
      expect(onHoverChange).toHaveBeenCalledWith(0, true, mockCardElement)
      
      system.handleMouseLeave(mockMouseEvent, 0, onHoverChange)
      expect(onHoverChange).toHaveBeenCalledWith(0, false, mockCardElement)
    })
  })

  describe('Haptic Feedback', () => {
    test('should create haptic feedback animation', () => {
      const { gsap } = require('gsap')
      
      system.createHapticFeedback(mockCardElement)
      
      expect(gsap.timeline).toHaveBeenCalled()
    })

    test('should handle missing title element gracefully', () => {
      mockCardElement.querySelector.mockReturnValue(null)
      
      expect(() => {
        system.createHapticFeedback(mockCardElement)
      }).not.toThrow()
    })
  })

  describe('Touch Hover Triggering', () => {
    test('should trigger touch hover with callback', () => {
      const onHoverChange = jest.fn()
      mockCardElement._mobileHoverCallback = onHoverChange
      
      system.triggerTouchHover(mockCardElement, 0, true)
      
      expect(mockCardElement.classList.add).toHaveBeenCalledWith('card-touch-hover')
      expect(onHoverChange).toHaveBeenCalledWith(0, true, mockCardElement)
    })

    test('should remove touch hover class when ending', () => {
      system.triggerTouchHover(mockCardElement, 0, false)
      
      expect(mockCardElement.classList.remove).toHaveBeenCalledWith('card-touch-hover')
    })
  })

  describe('Cleanup', () => {
    test('should clean up all active touches and timers', () => {
      // Add some active touches and timers
      system.activeTouches.set(0, { element: mockCardElement })
      system.touchTimers.set(0, setTimeout(() => {}, 1000))
      
      // Mock document.querySelectorAll
      document.querySelectorAll = jest.fn().mockReturnValue([mockCardElement])
      
      system.cleanup()
      
      expect(system.activeTouches.size).toBe(0)
      expect(system.touchTimers.size).toBe(0)
      expect(mockCardElement.classList.remove).toHaveBeenCalledWith('card-touch-active')
      expect(mockCardElement.classList.remove).toHaveBeenCalledWith('card-touch-hover')
    })
  })

  describe('Status and Configuration', () => {
    test('should return current status', () => {
      const status = system.getStatus()
      
      expect(status).toHaveProperty('isTouch')
      expect(status).toHaveProperty('activeTouches')
      expect(status).toHaveProperty('activeTimers')
      expect(status).toHaveProperty('options')
    })

    test('should update options at runtime', () => {
      const newOptions = { touchDebounceTime: 100 }
      
      system.updateOptions(newOptions)
      
      expect(system.options.touchDebounceTime).toBe(100)
    })

    test('should force end all active touches', () => {
      // Add active touch
      system.activeTouches.set(0, { element: mockCardElement })
      system.touchTimers.set(0, setTimeout(() => {}, 1000))
      
      system.forceEndAllTouches()
      
      expect(system.activeTouches.size).toBe(0)
      expect(system.touchTimers.size).toBe(0)
      expect(mockCardElement.classList.remove).toHaveBeenCalledWith('card-touch-active')
      expect(mockCardElement.classList.remove).toHaveBeenCalledWith('card-touch-hover')
    })
  })

  describe('Error Handling', () => {
    test('should handle invalid card index gracefully', () => {
      const mockTouchEvent = {
        preventDefault: jest.fn(),
        currentTarget: { dataset: { cardIndex: 'invalid' } },
        touches: [{ identifier: 1, clientX: 100, clientY: 200 }]
      }
      
      expect(() => {
        system.handleTouchStart(mockTouchEvent)
      }).not.toThrow()
    })

    test('should handle missing touch data gracefully', () => {
      const mockTouchEvent = {
        preventDefault: jest.fn(),
        currentTarget: mockCardElement,
        touches: []
      }
      mockCardElement.dataset.cardIndex = '0'
      
      expect(() => {
        system.handleTouchStart(mockTouchEvent)
      }).not.toThrow()
    })
  })
})