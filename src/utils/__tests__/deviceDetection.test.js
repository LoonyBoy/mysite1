import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  detectTouchDevice,
  getDeviceCapabilities,
  prefersReducedMotion,
  getOrientation,
  debounce,
  throttle
} from '../deviceDetection'

// Mock window and navigator
const mockWindow = {
  matchMedia: vi.fn(() => ({ matches: false })),
  screen: {
    width: 1920,
    height: 1080
  },
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 1,
  orientation: undefined
}

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  maxTouchPoints: 0,
  msMaxTouchPoints: 0,
  deviceMemory: undefined,
  connection: undefined,
  hardwareConcurrency: 4
}

describe('deviceDetection', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup global objects
    global.window = mockWindow
    global.navigator = mockNavigator
    global.console = {
      log: vi.fn(),
      warn: vi.fn()
    }
  })

  describe('detectTouchDevice', () => {
    it('should return false for desktop devices by default', () => {
      expect(detectTouchDevice()).toBe(false)
    })

    it('should detect touch via ontouchstart', () => {
      global.window.ontouchstart = true
      expect(detectTouchDevice()).toBe(true)
      delete global.window.ontouchstart
    })

    it('should detect touch via pointer media query', () => {
      mockWindow.matchMedia.mockReturnValue({ matches: true })
      expect(detectTouchDevice()).toBe(true)
    })

    it('should detect touch via maxTouchPoints', () => {
      global.navigator.maxTouchPoints = 1
      expect(detectTouchDevice()).toBe(true)
      global.navigator.maxTouchPoints = 0
    })

    it('should detect touch via msMaxTouchPoints (IE/Edge)', () => {
      global.navigator.msMaxTouchPoints = 1
      expect(detectTouchDevice()).toBe(true)
      global.navigator.msMaxTouchPoints = 0
    })

    it('should detect mobile devices via user agent', () => {
      global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      expect(detectTouchDevice()).toBe(true)
    })

    it('should detect Android devices via user agent', () => {
      global.navigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G975F)'
      expect(detectTouchDevice()).toBe(true)
    })

    it('should handle detection errors gracefully', () => {
      // Mock error in matchMedia
      mockWindow.matchMedia.mockImplementation(() => {
        throw new Error('matchMedia error')
      })
      
      expect(detectTouchDevice()).toBe(false)
      expect(console.warn).toHaveBeenCalled()
    })

    it('should consider small screens with touch indicators', () => {
      // Small screen
      mockWindow.screen.width = 600
      mockWindow.screen.height = 800
      
      // With touch start support
      global.window.ontouchstart = true
      
      expect(detectTouchDevice()).toBe(true)
      
      // Reset
      delete global.window.ontouchstart
      mockWindow.screen.width = 1920
      mockWindow.screen.height = 1080
    })
  })

  describe('getDeviceCapabilities', () => {
    it('should return basic device information', () => {
      const capabilities = getDeviceCapabilities()
      
      expect(capabilities).toHaveProperty('isTouch')
      expect(capabilities).toHaveProperty('deviceMemory')
      expect(capabilities).toHaveProperty('connectionType')
      expect(capabilities).toHaveProperty('hardwareConcurrency')
      expect(capabilities).toHaveProperty('screen')
      expect(capabilities).toHaveProperty('performanceLevel')
      expect(capabilities).toHaveProperty('userAgent')
    })

    it('should detect high performance devices', () => {
      global.navigator.deviceMemory = 8
      
      const capabilities = getDeviceCapabilities()
      expect(capabilities.performanceLevel).toBe('high')
    })

    it('should detect low performance devices', () => {
      global.navigator.deviceMemory = 2
      
      const capabilities = getDeviceCapabilities()
      expect(capabilities.performanceLevel).toBe('low')
    })

    it('should adjust performance based on connection', () => {
      global.navigator.connection = { effectiveType: 'slow-2g' }
      
      const capabilities = getDeviceCapabilities()
      expect(capabilities.performanceLevel).toBe('low')
    })

    it('should handle missing navigator properties', () => {
      const originalNavigator = global.navigator
      global.navigator = { userAgent: 'test' }
      
      const capabilities = getDeviceCapabilities()
      expect(capabilities.deviceMemory).toBe(null)
      expect(capabilities.hardwareConcurrency).toBe(null)
      
      global.navigator = originalNavigator
    })

    it('should handle errors gracefully', () => {
      // Mock error in screen access
      Object.defineProperty(global.window, 'screen', {
        get: () => { throw new Error('Screen access error') }
      })
      
      const capabilities = getDeviceCapabilities()
      expect(capabilities.screen.width).toBe(null)
      expect(console.warn).toHaveBeenCalled()
    })
  })

  describe('prefersReducedMotion', () => {
    it('should return false by default', () => {
      expect(prefersReducedMotion()).toBe(false)
    })

    it('should detect reduced motion preference', () => {
      mockWindow.matchMedia.mockReturnValue({ matches: true })
      expect(prefersReducedMotion()).toBe(true)
    })

    it('should handle matchMedia errors', () => {
      mockWindow.matchMedia.mockImplementation(() => {
        throw new Error('matchMedia error')
      })
      
      expect(prefersReducedMotion()).toBe(false)
      expect(console.warn).toHaveBeenCalled()
    })
  })

  describe('getOrientation', () => {
    it('should detect landscape orientation via screen.orientation', () => {
      mockWindow.screen.orientation = { angle: 90 }
      expect(getOrientation()).toBe('landscape')
    })

    it('should detect portrait orientation via screen.orientation', () => {
      mockWindow.screen.orientation = { angle: 0 }
      expect(getOrientation()).toBe('portrait')
    })

    it('should detect orientation via window.orientation', () => {
      global.window.orientation = 90
      expect(getOrientation()).toBe('landscape')
      
      global.window.orientation = 0
      expect(getOrientation()).toBe('portrait')
    })

    it('should fallback to window dimensions', () => {
      // Remove orientation APIs
      delete mockWindow.screen.orientation
      delete global.window.orientation
      
      // Landscape dimensions
      mockWindow.innerWidth = 1920
      mockWindow.innerHeight = 1080
      expect(getOrientation()).toBe('landscape')
      
      // Portrait dimensions
      mockWindow.innerWidth = 800
      mockWindow.innerHeight = 1200
      expect(getOrientation()).toBe('portrait')
    })

    it('should return unknown on errors', () => {
      // Remove all orientation detection methods
      delete mockWindow.screen
      delete global.window.orientation
      delete mockWindow.innerWidth
      delete mockWindow.innerHeight
      
      expect(getOrientation()).toBe('unknown')
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)
      
      // Call multiple times rapidly
      debouncedFn()
      debouncedFn()
      debouncedFn()
      
      // Should not be called immediately
      expect(mockFn).not.toHaveBeenCalled()
      
      // Should be called once after delay
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1)
        done()
      }, 150)
    })

    it('should execute immediately when immediate flag is true', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100, true)
      
      debouncedFn()
      expect(mockFn).toHaveBeenCalledTimes(1)
      
      // Subsequent calls should be debounced
      debouncedFn()
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    it('should throttle function calls', (done) => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 100)
      
      // Call multiple times rapidly
      throttledFn()
      throttledFn()
      throttledFn()
      
      // Should be called immediately once
      expect(mockFn).toHaveBeenCalledTimes(1)
      
      // Should allow another call after limit
      setTimeout(() => {
        throttledFn()
        expect(mockFn).toHaveBeenCalledTimes(2)
        done()
      }, 150)
    })
  })
})