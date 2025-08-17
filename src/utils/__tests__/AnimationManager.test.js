import AnimationManager from '../AnimationManager'
import { gsap } from 'gsap'

// Mock GSAP for testing
jest.mock('gsap', () => ({
  gsap: {
    registerPlugin: jest.fn(),
    config: jest.fn(),
    defaults: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      play: jest.fn().mockReturnThis(),
      reverse: jest.fn().mockReturnThis(),
      kill: jest.fn(),
      timeScale: jest.fn().mockReturnThis(),
      paused: true
    })),
    set: jest.fn(),
    globalTimeline: {
      timeScale: jest.fn()
    }
  },
  ScrollTrigger: {},
  Flip: {}
}))

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now())
}

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16))

// Mock window and document
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('AnimationManager', () => {
  let animationManager
  let mockCardElement

  beforeEach(() => {
    jest.clearAllMocks()
    animationManager = new AnimationManager()
    
    // Mock card element
    mockCardElement = {
      getBoundingClientRect: jest.fn(() => ({
        top: 100,
        left: 100,
        width: 200,
        height: 200
      })),
      style: {}
    }

    // Mock getComputedStyle
    global.getComputedStyle = jest.fn(() => ({
      position: 'relative',
      top: 'auto',
      left: 'auto',
      width: '200px',
      height: '200px',
      zIndex: '1'
    }))
  })

  afterEach(() => {
    if (animationManager) {
      animationManager.cleanup()
    }
  })

  describe('Initialization', () => {
    test('should initialize with correct default values', () => {
      expect(animationManager.timelines).toBeInstanceOf(Map)
      expect(animationManager.performanceLevel).toBe('high')
      expect(animationManager.fps).toBe(60)
      expect(typeof animationManager.isTouch).toBe('boolean')
    })

    test('should configure GSAP correctly', () => {
      expect(gsap.config).toHaveBeenCalledWith({
        force3D: true,
        nullTargetWarn: false,
        autoSleep: expect.any(Number),
        lag: expect.any(Number)
      })
    })
  })

  describe('Touch Device Detection', () => {
    test('should detect touch device correctly', () => {
      const result = animationManager.detectTouchDevice()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('Timeline Management', () => {
    test('should create card timeline successfully', () => {
      const timeline = animationManager.createCardTimeline(0, mockCardElement)
      
      expect(timeline).toBeDefined()
      expect(animationManager.timelines.has(0)).toBe(true)
      expect(gsap.timeline).toHaveBeenCalled()
    })

    test('should kill existing timeline when creating new one', () => {
      const firstTimeline = animationManager.createCardTimeline(0, mockCardElement)
      const killSpy = jest.spyOn(firstTimeline, 'kill')
      
      animationManager.createCardTimeline(0, mockCardElement)
      
      expect(killSpy).toHaveBeenCalled()
    })

    test('should handle timeline creation errors gracefully', () => {
      // Mock getBoundingClientRect to throw error
      mockCardElement.getBoundingClientRect = jest.fn(() => {
        throw new Error('Test error')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const timeline = animationManager.createCardTimeline(0, mockCardElement)
      
      expect(consoleSpy).toHaveBeenCalled()
      expect(timeline).toBeDefined()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Card Hover Handling', () => {
    beforeEach(() => {
      animationManager.createCardTimeline(0, mockCardElement)
    })

    test('should handle mouse hover correctly', () => {
      animationManager.isTouch = false
      const timeline = animationManager.timelines.get(0)
      const playSpy = jest.spyOn(timeline, 'play')
      
      animationManager.handleCardHover(0, true, mockCardElement)
      
      expect(playSpy).toHaveBeenCalled()
    })

    test('should handle touch interaction correctly', () => {
      animationManager.isTouch = true
      const timeline = animationManager.timelines.get(0)
      const playSpy = jest.spyOn(timeline, 'play')
      const timeScaleSpy = jest.spyOn(timeline, 'timeScale')
      
      animationManager.handleCardHover(0, true, mockCardElement)
      
      expect(timeScaleSpy).toHaveBeenCalledWith(1.2)
      expect(playSpy).toHaveBeenCalled()
    })

    test('should reverse animation on hover end', () => {
      const timeline = animationManager.timelines.get(0)
      const reverseSpy = jest.spyOn(timeline, 'reverse')
      
      animationManager.handleCardHover(0, false, mockCardElement)
      
      expect(reverseSpy).toHaveBeenCalled()
    })
  })

  describe('Performance Monitoring', () => {
    test('should start performance monitoring', () => {
      expect(animationManager.isMonitoring).toBe(true)
      expect(requestAnimationFrame).toHaveBeenCalled()
    })

    test('should adjust performance level based on FPS', () => {
      animationManager.fps = 25
      animationManager.adjustPerformanceLevel()
      
      expect(animationManager.performanceLevel).toBe('low')
    })

    test('should apply performance optimizations', () => {
      animationManager.performanceLevel = 'low'
      animationManager.applyPerformanceOptimizations()
      
      expect(gsap.globalTimeline.timeScale).toHaveBeenCalledWith(0.7)
    })

    test('should stop performance monitoring', () => {
      animationManager.stopPerformanceMonitoring()
      
      expect(animationManager.isMonitoring).toBe(false)
    })
  })

  describe('Error Handling', () => {
    test('should handle animation errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const error = new Error('Test animation error')
      
      animationManager.handleAnimationError(error, 0)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Animation error for card 0:',
        error
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Cleanup', () => {
    test('should cleanup all resources', () => {
      animationManager.createCardTimeline(0, mockCardElement)
      animationManager.createCardTimeline(1, mockCardElement)
      
      const timeline0 = animationManager.timelines.get(0)
      const timeline1 = animationManager.timelines.get(1)
      const killSpy0 = jest.spyOn(timeline0, 'kill')
      const killSpy1 = jest.spyOn(timeline1, 'kill')
      
      animationManager.cleanup()
      
      expect(killSpy0).toHaveBeenCalled()
      expect(killSpy1).toHaveBeenCalled()
      expect(animationManager.timelines.size).toBe(0)
      expect(animationManager.isMonitoring).toBe(false)
    })
  })

  describe('Performance Metrics', () => {
    test('should return correct performance metrics', () => {
      const metrics = animationManager.getPerformanceMetrics()
      
      expect(metrics).toEqual({
        fps: expect.any(Number),
        performanceLevel: expect.any(String),
        isTouch: expect.any(Boolean),
        activeTimelines: expect.any(Number),
        isMonitoring: expect.any(Boolean)
      })
    })
  })

  describe('Manual Performance Level Setting', () => {
    test('should set performance level manually', () => {
      animationManager.setPerformanceLevel('low')
      
      expect(animationManager.performanceLevel).toBe('low')
    })

    test('should warn on invalid performance level', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      animationManager.setPerformanceLevel('invalid')
      
      expect(consoleSpy).toHaveBeenCalledWith('Invalid performance level: invalid')
      
      consoleSpy.mockRestore()
    })
  })
})