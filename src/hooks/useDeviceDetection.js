import { useState, useEffect, useCallback, useRef } from 'react'
import deviceDetection from '../utils/deviceDetection'

/**
 * React hook for device detection and capability monitoring
 * Provides reactive access to device capabilities with automatic updates
 */
export const useDeviceDetection = () => {
  const [capabilities, setCapabilities] = useState(() => deviceDetection.getCapabilities())
  const [isLoading, setIsLoading] = useState(false)
  const listenerRef = useRef(null)

  // Handle capability changes
  const handleCapabilityChange = useCallback((newCapabilities) => {
    setCapabilities(newCapabilities)
  }, [])

  // Setup capability listener on mount
  useEffect(() => {
    listenerRef.current = handleCapabilityChange
    deviceDetection.addCapabilityListener(handleCapabilityChange)

    return () => {
      if (listenerRef.current) {
        deviceDetection.removeCapabilityListener(listenerRef.current)
      }
    }
  }, [handleCapabilityChange])

  // Force re-detection of capabilities
  const refreshCapabilities = useCallback(async () => {
    setIsLoading(true)
    try {
      // Clear cache and re-detect
      deviceDetection.cache.clear()
      const newCapabilities = deviceDetection.detectCapabilities()
      setCapabilities(newCapabilities)
    } catch (error) {
      console.warn('Error refreshing device capabilities:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Convenience methods
  const isPrimaryTouch = useCallback(() => {
    return capabilities?.isPrimaryTouch || false
  }, [capabilities])

  const isPrimaryMouse = useCallback(() => {
    return capabilities?.isPrimaryMouse || false
  }, [capabilities])

  const isMobile = useCallback(() => {
    return capabilities?.deviceType === 'mobile'
  }, [capabilities])

  const isTablet = useCallback(() => {
    return capabilities?.deviceType === 'tablet'
  }, [capabilities])

  const isDesktop = useCallback(() => {
    return capabilities?.deviceType === 'desktop'
  }, [capabilities])

  const getPerformanceLevel = useCallback(() => {
    return deviceDetection.getPerformanceLevel()
  }, [])

  const supportsHover = useCallback(() => {
    return capabilities?.supportsHover || false
  }, [capabilities])

  const prefersReducedMotion = useCallback(() => {
    return capabilities?.prefersReducedMotion || false
  }, [capabilities])

  return {
    // Raw capabilities object
    capabilities,
    
    // Loading state
    isLoading,
    
    // Convenience methods
    isPrimaryTouch,
    isPrimaryMouse,
    isMobile,
    isTablet,
    isDesktop,
    getPerformanceLevel,
    supportsHover,
    prefersReducedMotion,
    
    // Actions
    refreshCapabilities
  }
}

/**
 * Hook for simple touch detection (most common use case)
 * Returns boolean indicating if device is primarily touch-based
 */
export const useIsTouchDevice = () => {
  const { isPrimaryTouch } = useDeviceDetection()
  return isPrimaryTouch()
}

/**
 * Hook for performance-aware features
 * Returns performance level and related utilities
 */
export const useDevicePerformance = () => {
  const { capabilities, getPerformanceLevel, prefersReducedMotion } = useDeviceDetection()
  
  const performanceLevel = getPerformanceLevel()
  const shouldReduceAnimations = prefersReducedMotion() || performanceLevel === 'low'
  const shouldOptimizeForMobile = capabilities?.deviceType === 'mobile'
  
  return {
    performanceLevel,
    shouldReduceAnimations,
    shouldOptimizeForMobile,
    deviceMemory: capabilities?.deviceMemory,
    hardwareConcurrency: capabilities?.hardwareConcurrency
  }
}

/**
 * Hook for responsive design based on device capabilities
 * Returns responsive breakpoints and device characteristics
 */
export const useResponsiveDevice = () => {
  const { capabilities, isMobile, isTablet, isDesktop } = useDeviceDetection()
  
  const screenSize = capabilities?.screenSize || {}
  const orientation = capabilities?.orientation || 'portrait'
  
  // Responsive breakpoints
  const breakpoints = {
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    isSmallScreen: screenSize.width < 768,
    isMediumScreen: screenSize.width >= 768 && screenSize.width < 1024,
    isLargeScreen: screenSize.width >= 1024
  }
  
  return {
    ...breakpoints,
    screenSize,
    orientation,
    pixelRatio: screenSize.pixelRatio || 1
  }
}

export default useDeviceDetection