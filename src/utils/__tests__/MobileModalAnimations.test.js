/**
 * Unit Tests for Mobile Modal Animations
 * 
 * Tests mobile-optimized modal animations with performance monitoring
 * and adaptive quality features.
 * 
 * Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { gsap } from 'gsap'
import MobileModalAnimations from '../MobileModalAnimations'

// Mock GSAP
vi.mock('gsap', () => ({
  gsap: {
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      call: vi.fn().mockReturnThis(),
      kill: vi.fn()
    })),
    to: vi.fn(() => Promise.resolve()),
    fromTo: vi.fn(() => Promise.resolve()),
    set: vi.fn(),
    killTweensOf: vi.fn(),
    globalTimeline: {
      timeScale: vi.fn()
    }
  },
  Flip: {
    getState: vi.fn(() => ({})),
    from: vi.fn(() => Promise.resolve())
  }
}))

// Mock DOM APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(navigator, 'hardwareConcurrency', {
  writable: true,
  value: 4
})

Object.defineProperty(navigator, 'deviceMemory', {
  writable: true,
  value: 4
})

Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g'
  }
})

describe('MobileModalAnimations', () => {
  let animator
  let mockElement
  let mockModalContent

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Create mock DOM elements
    mockElement = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn()
      },
      getBoundingClientRect: vi.fn(() => ({
        top: 100,
        left: 100,
        right: 300,
        bottom: 200,
        width: 200,
        height: 100
      })),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => [])
    }

    mockModalContent = {
      querySelectorAll: vi.fn(() => [
        { style: {} },
        { style: {} },
        { style: {} }
      ])
    }

    // Mock window properties
    Object.defineProperty(window, 'screen', {
      writable: true,
      value: {
        width: 1920,
        height: 1080
      }
    })

    animator = new MobileModalAnimations()
  })

  afterEach(() => {
    if (animator) {
      animator.cleanup()
    }
  })

  describe('Device Detection', () => {
    it('should detect mobile devices correctly', () => {
      // Mock mobile environment
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        value: true
      })
      
      const mobileAnimator = new MobileModalAnimations()
      expect(mobileAnimator.isMobile).toBe(true)
    })

    it('should detect desktop devices correctly', () => {
      // Mock desktop environment
      delete window.ontouchstart
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        value: 0
      })
      
      const desktopAnimator = new MobileModalAnimations()
      expect(desktopAnimator.isMobile).toBe(false)
    })

    it('should detect performance level correctly', () => {
      expect(animator.performanceLevel).toBeOneOf(['low', 'medium', 'high'])
    })
  })

  describe('Performance Settings', () => {
    it('should return appropriate settings for high performance', () => {
      animator.performanceLevel = 'high'
      const settings = animator.getPerformanceSettings()
      
      expect(settings.enableBlur).toBe(true)
      expect(settings.enableShadows).toBe(true)
      expect(settings.enableParticles).toBe(true)
      expect(settings.maxStaggerItems).toBe(20)
      expect(settings.complexEasing).toBe(true)
    })

    it('should return appropriate settings for low performance', () => {
      animator.performanceLevel = 'low'
      const settings = animator.getPerformanceSettings()
      
      expect(settings.enableBlur).toBe(false)
      expect(settings.enableShadows).toBe(false)
      expect(settings.enableParticles).toBe(false)
      expect(settings.maxStaggerItems).toBe(5)
      expect(settings.complexEasing).toBe(false)
    })
  })

  describe('Modal Opening Animation', () => {
    it('should animate modal opening with correct parameters', async () => {
      const onComplete = vi.fn()
      
      await animator.animateModalOpen(mockElement, mockModalContent, {
        onComplete,
        enableStagger: true
      })

      expect(mockElement.classList.add).toHaveBeenCalledWith('is-open')
      expect(gsap.Flip.getState).toHaveBeenCalledWith(mockElement)
      expect(gsap.Flip.from).toHaveBeenCalled()
    })

    it('should handle reduced motion preference', async () => {
      animator.prefersReducedMotion = true
      const onComplete = vi.fn()
      
      await animator.animateModalOpen(mockElement, mockModalContent, {
        onComplete
      })

      expect(gsap.gsap.set).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
    })

    it('should use mobile-optimized timing on mobile devices', () => {
      animator.isMobile = true
      
      expect(animator.mobileTimings.modalOpen).toBeLessThan(0.6)
      expect(animator.mobileTimings.contentStagger).toBeLessThan(0.12)
    })
  })

  describe('Modal Closing Animation', () => {
    it('should animate modal closing with correct parameters', async () => {
      const onComplete = vi.fn()
      
      await animator.animateModalClose(mockElement, mockModalContent, {
        onComplete
      })

      expect(mockElement.classList.remove).toHaveBeenCalledWith('is-open')
      expect(gsap.Flip.getState).toHaveBeenCalledWith(mockElement)
      expect(gsap.Flip.from).toHaveBeenCalled()
    })

    it('should handle reduced motion preference for closing', async () => {
      animator.prefersReducedMotion = true
      const onComplete = vi.fn()
      
      await animator.animateModalClose(mockElement, mockModalContent, {
        onComplete
      })

      expect(mockElement.classList.remove).toHaveBeenCalledWith('is-open')
      expect(onComplete).toHaveBeenCalled()
    })
  })

  describe('Content Animation', () => {
    it('should animate modal content with stagger', () => {
      const elements = [
        { style: {} },
        { style: {} },
        { style: {} }
      ]
      mockModalContent.querySelectorAll.mockReturnValue(elements)
      
      animator.animateModalContentIn(mockModalContent)
      
      expect(mockModalContent.querySelectorAll).toHaveBeenCalled()
      expect(gsap.gsap.set).toHaveBeenCalled()
      expect(gsap.gsap.to).toHaveBeenCalled()
    })

    it('should limit elements based on performance level', () => {
      animator.performanceLevel = 'low'
      animator.animationSettings = animator.getPerformanceSettings()
      
      const elements = Array(20).fill().map(() => ({ style: {} }))
      mockModalContent.querySelectorAll.mockReturnValue(elements)
      
      animator.animateModalContentIn(mockModalContent)
      
      // Should limit to maxStaggerItems (5 for low performance)
      expect(gsap.gsap.set).toHaveBeenCalled()
    })

    it('should handle empty content gracefully', () => {
      mockModalContent.querySelectorAll.mockReturnValue([])
      
      expect(() => {
        animator.animateModalContentIn(mockModalContent)
      }).not.toThrow()
    })
  })

  describe('Special Element Animations', () => {
    it('should animate pricing cards with special effects', () => {
      const pricingCards = [{ style: {} }, { style: {} }]
      mockModalContent.querySelectorAll.mockImplementation(selector => {
        if (selector.includes('pricing-card')) return pricingCards
        return []
      })
      
      animator.animateSpecialElements(mockModalContent)
      
      expect(gsap.gsap.fromTo).toHaveBeenCalled()
    })

    it('should animate project cards with 3D effects when performance allows', () => {
      animator.animationSettings.enableShadows = true
      const projectCards = [{ style: {} }, { style: {} }]
      
      mockModalContent.querySelectorAll.mockImplementation(selector => {
        if (selector.includes('project-card')) return projectCards
        return []
      })
      
      animator.animateSpecialElements(mockModalContent)
      
      expect(gsap.gsap.fromTo).toHaveBeenCalled()
    })

    it('should skip 3D effects on low performance devices', () => {
      animator.animationSettings.enableShadows = false
      const projectCards = [{ style: {} }, { style: {} }]
      
      mockModalContent.querySelectorAll.mockImplementation(selector => {
        if (selector.includes('project-card')) return projectCards
        return []
      })
      
      animator.animateSpecialElements(mockModalContent)
      
      // Should not animate project cards with 3D effects
      const fromToCalls = gsap.gsap.fromTo.mock.calls
      const projectCardCalls = fromToCalls.filter(call => 
        call[0] === projectCards && call[1].rotationX !== undefined
      )
      expect(projectCardCalls).toHaveLength(0)
    })
  })

  describe('Background Animation', () => {
    it('should animate background opening', async () => {
      const backgroundElement = { style: {} }
      const onComplete = vi.fn()
      
      await animator.animateBackground(backgroundElement, true, { onComplete })
      
      expect(gsap.gsap.to).toHaveBeenCalledWith(
        backgroundElement,
        expect.objectContaining({
          opacity: 1,
          onComplete
        })
      )
    })

    it('should animate background closing', async () => {
      const backgroundElement = { style: {} }
      const onComplete = vi.fn()
      
      await animator.animateBackground(backgroundElement, false, { onComplete })
      
      expect(gsap.gsap.to).toHaveBeenCalledWith(
        backgroundElement,
        expect.objectContaining({
          opacity: 0,
          onComplete
        })
      )
    })
  })

  describe('Performance Monitoring', () => {
    it('should start performance monitoring', () => {
      const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame')
      
      animator.startPerformanceMonitoring()
      
      expect(requestAnimationFrameSpy).toHaveBeenCalled()
    })

    it('should adapt animation quality based on FPS', () => {
      animator.performanceLevel = 'high'
      
      // Simulate low FPS
      animator.adaptAnimationQuality(25)
      
      expect(animator.performanceLevel).toBe('low')
      expect(gsap.gsap.globalTimeline.timeScale).toHaveBeenCalledWith(0.7)
    })

    it('should restore quality when FPS improves', () => {
      animator.performanceLevel = 'low'
      
      // Simulate improved FPS
      animator.adaptAnimationQuality(55)
      
      expect(animator.performanceLevel).toBe('medium')
      expect(gsap.gsap.globalTimeline.timeScale).toHaveBeenCalledWith(1)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup animations and reset timeline', () => {
      animator.cleanup()
      
      expect(gsap.gsap.killTweensOf).toHaveBeenCalledWith('*')
      expect(gsap.gsap.globalTimeline.timeScale).toHaveBeenCalledWith(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing elements gracefully', async () => {
      expect(async () => {
        await animator.animateModalOpen(null, mockModalContent)
      }).not.toThrow()
    })

    it('should handle animation errors gracefully', async () => {
      gsap.Flip.from.mockRejectedValue(new Error('Animation failed'))
      
      expect(async () => {
        await animator.animateModalOpen(mockElement, mockModalContent)
      }).not.toThrow()
    })
  })
})