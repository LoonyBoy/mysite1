import { renderHook, act } from '@testing-library/react'
import useMobileCardHover from '../useMobileCardHover'

// Mock the MobileCardHoverSystem
jest.mock('../../utils/MobileCardHoverSystem', () => {
  return jest.fn().mockImplementation(() => ({
    initializeCard: jest.fn(),
    removeCardListeners: jest.fn(),
    isTouch: true,
    getStatus: jest.fn(() => ({
      isTouch: true,
      activeTouches: 0,
      activeTimers: 0,
      options: {}
    })),
    forceEndAllTouches: jest.fn(),
    cleanup: jest.fn(),
    updateOptions: jest.fn()
  }))
})

describe('useMobileCardHover', () => {
  let mockCardElement

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockCardElement = {
      id: 'test-card',
      dataset: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn()
      }
    }
  })

  test('should initialize mobile hover system on mount', () => {
    const { result } = renderHook(() => useMobileCardHover())
    
    expect(result.current.mobileHoverSystem).toBeDefined()
  })

  test('should initialize card with proper parameters', () => {
    const { result } = renderHook(() => useMobileCardHover())
    const onHoverChange = jest.fn()
    
    act(() => {
      result.current.initializeCard(mockCardElement, 0, onHoverChange)
    })
    
    expect(result.current.mobileHoverSystem.initializeCard).toHaveBeenCalledWith(
      mockCardElement,
      0,
      onHoverChange
    )
  })

  test('should prevent double initialization of same card', () => {
    const { result } = renderHook(() => useMobileCardHover())
    const onHoverChange = jest.fn()
    
    act(() => {
      result.current.initializeCard(mockCardElement, 0, onHoverChange)
      result.current.initializeCard(mockCardElement, 0, onHoverChange)
    })
    
    // Should only be called once
    expect(result.current.mobileHoverSystem.initializeCard).toHaveBeenCalledTimes(1)
  })

  test('should handle missing card element gracefully', () => {
    const { result } = renderHook(() => useMobileCardHover())
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    
    act(() => {
      result.current.initializeCard(null, 0, jest.fn())
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Cannot initialize card: system not ready or element missing')
    consoleSpy.mockRestore()
  })

  test('should remove card from system', () => {
    const { result } = renderHook(() => useMobileCardHover())
    
    act(() => {
      result.current.removeCard(0, mockCardElement)
    })
    
    expect(result.current.mobileHoverSystem.removeCardListeners).toHaveBeenCalledWith(mockCardElement)
  })

  test('should return touch device status', () => {
    const { result } = renderHook(() => useMobileCardHover())
    
    const isTouch = result.current.isTouch()
    
    expect(isTouch).toBe(true)
  })

  test('should return system status', () => {
    const { result } = renderHook(() => useMobileCardHover())
    
    const status = result.current.getStatus()
    
    expect(status).toEqual({
      isTouch: true,
      activeTouches: 0,
      activeTimers: 0,
      options: {}
    })
  })

  test('should force end all touches', () => {
    const { result } = renderHook(() => useMobileCardHover())
    
    act(() => {
      result.current.forceEndAllTouches()
    })
    
    expect(result.current.mobileHoverSystem.forceEndAllTouches).toHaveBeenCalled()
  })

  test('should create card ref callback', () => {
    const { result } = renderHook(() => useMobileCardHover())
    const onHoverChange = jest.fn()
    
    const cardRef = result.current.createCardRef(0, onHoverChange)
    
    expect(typeof cardRef).toBe('function')
    
    // Test mounting
    act(() => {
      cardRef(mockCardElement)
    })
    
    expect(result.current.mobileHoverSystem.initializeCard).toHaveBeenCalledWith(
      mockCardElement,
      0,
      onHoverChange
    )
    
    // Test unmounting
    act(() => {
      cardRef(null)
    })
    
    expect(result.current.mobileHoverSystem.removeCardListeners).toHaveBeenCalled()
  })

  test('should update options when they change', () => {
    const initialOptions = { touchDebounceTime: 50 }
    const { result, rerender } = renderHook(
      ({ options }) => useMobileCardHover(options),
      { initialProps: { options: initialOptions } }
    )
    
    const newOptions = { touchDebounceTime: 100 }
    rerender({ options: newOptions })
    
    expect(result.current.mobileHoverSystem.updateOptions).toHaveBeenCalledWith(newOptions)
  })

  test('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useMobileCardHover())
    
    unmount()
    
    expect(result.current.mobileHoverSystem.cleanup).toHaveBeenCalled()
  })

  test('should handle initialization errors gracefully', () => {
    const { result } = renderHook(() => useMobileCardHover())
    
    // Mock initialization error
    result.current.mobileHoverSystem.initializeCard.mockImplementation(() => {
      throw new Error('Initialization failed')
    })
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    act(() => {
      result.current.initializeCard(mockCardElement, 0, jest.fn())
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize card 0:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  test('should handle removal errors gracefully', () => {
    const { result } = renderHook(() => useMobileCardHover())
    
    // Mock removal error
    result.current.mobileHoverSystem.removeCardListeners.mockImplementation(() => {
      throw new Error('Removal failed')
    })
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    act(() => {
      result.current.removeCard(0, mockCardElement)
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to remove card 0:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  test('should handle missing system gracefully', () => {
    const { result } = renderHook(() => useMobileCardHover())
    
    // Simulate system not ready
    result.current.mobileHoverSystem = null
    
    const status = result.current.getStatus()
    expect(status).toEqual({})
    
    const isTouch = result.current.isTouch()
    expect(isTouch).toBe(false)
    
    // These should not throw
    act(() => {
      result.current.forceEndAllTouches()
      result.current.cleanup()
    })
  })
})