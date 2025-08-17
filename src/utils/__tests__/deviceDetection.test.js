import { DeviceDetection } from '../deviceDetection'

// Mock window and navigator objects
const mockWindow = {
  screen: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    orientation: {
      angle: 0,
      addEventListener: jest.fn()
    }
  },
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 1,
  matchMedia: jest.fn(),
  addEventListener: jest.fn(),
  DocumentTouch: undefined
}

const mockNavigator = {
  maxTouchPoints: 0,
  msMaxTouchPoints: 0,
  deviceMemory: 8,
  hardwareConcurrency: 8
}

// Setup global mocks
global.window = mockWindow
global.navigator = mockNavigator
global.document = {
  documentElement: {},
  addEventListener: jest.fn()
}

describe('DeviceDetection', () => {
  let deviceDetection

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Reset window.matchMedia mock
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }))

    deviceDetection = new DeviceDetection()
  })

  afterEach(() => {
    if (deviceDetection) {
      deviceDetection.destroy()
    }
  })

  describe('Touch Detection', () => {
    test('should detect touch when ontouchstart is available', () => {
      window.ontouchstart = undefined
      
      const hasTouch = deviceDetection.detectTouch()
      expect(hasTouch).toBe(true)
    })

    test('should detect touch when maxTouchPoints > 0', () => {
      delete window.ontouchstart
      navigator.maxTouchPoints = 5
      
      const hasTouch = deviceDetection.detectTouch()
      expect(hasTouch).toBe(true)
    })

    test('should detect touch with coarse pointer', () => {
      delete window.ontouchstart
      navigator.maxTouchPoints = 0
      
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(pointer: coarse)',
        media: query
      }))
      
      const hasTouch = deviceDetection.detectTouch()
      expect(hasTouch).toBe(true)
    })

    test('should not detect touch on desktop', () => {
      delete window.ontouchstart
      navigator.maxTouchPoints = 0
      navigator.msMaxTouchPoints = 0
      
      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: false
      }))
      
      const hasTouch = deviceDetection.detectTouch()
      expect(hasTouch).toBe(false)
    })
  })

  describe('Mouse Detection', () => {
    test('should detect mouse with fine pointer', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(pointer: fine)',
        media: query
      }))
      
      const hasMouse = deviceDetection.detectMouse()
      expect(hasMouse).toBe(true)
    })

    test('should detect mouse with hover support', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(hover: hover)',
        media: query
      }))
      
      const hasMouse = deviceDetection.detectMouse()
      expect(hasMouse).toBe(true)
    })

    test('should detect mouse events', () => {
      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: false
      }))
      
      window.onmouseenter = undefined
      
      const hasMouse = deviceDetection.detectMouse()
      expect(hasMouse).toBe(true)
    })
  })

  describe('Device Type Detection', () => {
    test('should detect mobile device', () => {
      window.screen.width = 375
      window.screen.height = 667
      
      const deviceType = deviceDetection.getDeviceType()
      expect(deviceType).toBe('mobile')
    })

    test('should detect tablet device', () => {
      window.screen.width = 768
      window.screen.height = 1024
      
      const deviceType = deviceDetection.getDeviceType()
      expect(deviceType).toBe('tablet')
    })

    test('should detect desktop device', () => {
      window.screen.width = 1920
      window.screen.height = 1080
      
      const deviceType = deviceDetection.getDeviceType()
      expect(deviceType).toBe('desktop')
    })
  })

  describe('Orientation Detection', () => {
    test('should detect portrait orientation', () => {
      window.innerWidth = 375
      window.innerHeight = 667
      
      const orientation = deviceDetection.getOrientation()
      expect(orientation).toBe('portrait')
    })

    test('should detect landscape orientation', () => {
      window.innerWidth = 667
      window.innerHeight = 375
      
      const orientation = deviceDetection.getOrientation()
      expect(orientation).toBe('landscape')
    })

    test('should use screen.orientation if available', () => {
      window.screen.orientation = {
        angle: 90
      }
      
      const orientation = deviceDetection.getOrientation()
      expect(orientation).toBe('landscape')
    })
  })

  describe('Performance Detection', () => {
    test('should return high performance for desktop with good specs', () => {
      navigator.deviceMemory = 8
      navigator.hardwareConcurrency = 8
      window.screen.width = 1920
      window.screen.height = 1080
      
      deviceDetection.detectCapabilities()
      const performanceLevel = deviceDetection.getPerformanceLevel()
      expect(performanceLevel).toBe('high')
    })

    test('should return medium performance for tablets', () => {
      navigator.deviceMemory = 4
      navigator.hardwareConcurrency = 4
      window.screen.width = 768
      window.screen.height = 1024
      
      deviceDetection.detectCapabilities()
      const performanceLevel = deviceDetection.getPerformanceLevel()
      expect(performanceLevel).toBe('medium')
    })

    test('should return low performance for mobile devices', () => {
      navigator.deviceMemory = 2
      navigator.hardwareConcurrency = 2
      window.screen.width = 375
      window.screen.height = 667
      
      deviceDetection.detectCapabilities()
      const performanceLevel = deviceDetection.getPerformanceLevel()
      expect(performanceLevel).toBe('low')
    })
  })

  describe('Primary Interaction Detection', () => {
    test('should set mobile as primary touch', () => {
      window.screen.width = 375
      window.screen.height = 667
      window.ontouchstart = undefined
      
      const capabilities = deviceDetection.detectCapabilities()
      expect(capabilities.isPrimaryTouch).toBe(true)
      expect(capabilities.isPrimaryMouse).toBe(false)
    })

    test('should set desktop as primary mouse', () => {
      window.screen.width = 1920
      window.screen.height = 1080
      delete window.ontouchstart
      navigator.maxTouchPoints = 0
      
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(pointer: fine)' || query === '(hover: hover)',
        media: query
      }))
      
      const capabilities = deviceDetection.detectCapabilities()
      expect(capabilities.isPrimaryTouch).toBe(false)
      expect(capabilities.isPrimaryMouse).toBe(true)
    })

    test('should prefer touch for tablets with both capabilities', () => {
      window.screen.width = 768
      window.screen.height = 1024
      window.ontouchstart = undefined
      
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(pointer: fine)' || query === '(hover: hover)' || query === '(pointer: coarse)',
        media: query
      }))
      
      const capabilities = deviceDetection.detectCapabilities()
      expect(capabilities.isPrimaryTouch).toBe(true)
      expect(capabilities.isPrimaryMouse).toBe(false)
    })
  })

  describe('Accessibility Detection', () => {
    test('should detect reduced motion preference', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query
      }))
      
      const prefersReduced = deviceDetection.prefersReducedMotion()
      expect(prefersReduced).toBe(true)
    })

    test('should detect no reduced motion preference', () => {
      window.matchMedia = jest.fn().mockImplementation(() => ({
        matches: false
      }))
      
      const prefersReduced = deviceDetection.prefersReducedMotion()
      expect(prefersReduced).toBe(false)
    })
  })

  describe('Capability Listeners', () => {
    test('should add and remove capability listeners', () => {
      const listener = jest.fn()
      
      deviceDetection.addCapabilityListener(listener)
      expect(deviceDetection.listeners.has(listener)).toBe(true)
      
      deviceDetection.removeCapabilityListener(listener)
      expect(deviceDetection.listeners.has(listener)).toBe(false)
    })

    test('should notify listeners of capability changes', () => {
      const listener = jest.fn()
      deviceDetection.addCapabilityListener(listener)
      
      const newCapabilities = { test: true }
      deviceDetection.notifyListeners(newCapabilities)
      
      expect(listener).toHaveBeenCalledWith(newCapabilities)
    })

    test('should handle listener errors gracefully', () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      const goodListener = jest.fn()
      
      deviceDetection.addCapabilityListener(errorListener)
      deviceDetection.addCapabilityListener(goodListener)
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const newCapabilities = { test: true }
      deviceDetection.notifyListeners(newCapabilities)
      
      expect(consoleSpy).toHaveBeenCalledWith('Error in capability change listener:', expect.any(Error))
      expect(goodListener).toHaveBeenCalledWith(newCapabilities)
      
      consoleSpy.mockRestore()
    })
  })

  describe('Caching', () => {
    test('should cache capabilities', () => {
      const capabilities1 = deviceDetection.detectCapabilities()
      const capabilities2 = deviceDetection.detectCapabilities()
      
      expect(capabilities1).toBe(capabilities2) // Same object reference due to caching
    })

    test('should clear cache and re-detect', () => {
      const capabilities1 = deviceDetection.detectCapabilities()
      
      deviceDetection.cache.clear()
      const capabilities2 = deviceDetection.detectCapabilities()
      
      expect(capabilities1).not.toBe(capabilities2) // Different object references
      expect(capabilities1).toEqual(capabilities2) // But same content
    })
  })

  describe('Error Handling', () => {
    test('should handle touch detection errors', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // Mock an error in touch detection
      const originalMatchMedia = window.matchMedia
      window.matchMedia = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      
      const hasTouch = deviceDetection.detectTouch()
      expect(hasTouch).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Error detecting touch capabilities:', expect.any(Error))
      
      window.matchMedia = originalMatchMedia
      consoleSpy.mockRestore()
    })

    test('should handle mouse detection errors', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // Mock an error in mouse detection
      const originalMatchMedia = window.matchMedia
      window.matchMedia = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      
      const hasMouse = deviceDetection.detectMouse()
      expect(hasMouse).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Error detecting mouse capabilities:', expect.any(Error))
      
      window.matchMedia = originalMatchMedia
      consoleSpy.mockRestore()
    })
  })
})