/**
 * React Hook for MenuPage Mobile Modal Integration
 * 
 * Provides enhanced modal animations for MenuPage specifically optimized
 * for mobile devices with performance monitoring.
 * 
 * Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3
 */

import { useEffect, useCallback, useRef } from 'react'
import menuPageMobileModalIntegration from '../utils/MenuPageMobileModalIntegration'

export const useMenuPageMobileModals = (options = {}) => {
  const {
    autoInitialize = true,
    enablePerformanceMonitoring = true
  } = options

  const isInitializedRef = useRef(false)

  // Initialize the mobile modal system
  useEffect(() => {
    if (autoInitialize && !isInitializedRef.current) {
      menuPageMobileModalIntegration.initialize()
      isInitializedRef.current = true
    }

    return () => {
      if (isInitializedRef.current) {
        menuPageMobileModalIntegration.cleanup()
        isInitializedRef.current = false
      }
    }
  }, [autoInitialize])

  // Enhanced openCardFullscreen with mobile optimizations
  const openCardFullscreen = useCallback(async (index, cardRefs, modalOptions = {}) => {
    if (!isInitializedRef.current) {
      console.warn('Mobile modal system not initialized')
      return
    }

    try {
      await menuPageMobileModalIntegration.openCardFullscreen(index, cardRefs, modalOptions)
    } catch (error) {
      console.error('Error opening mobile modal:', error)
    }
  }, [])

  // Enhanced closeCardFullscreen with mobile optimizations
  const closeCardFullscreen = useCallback(async (index, cardRefs, modalOptions = {}) => {
    if (!isInitializedRef.current) {
      console.warn('Mobile modal system not initialized')
      return
    }

    try {
      await menuPageMobileModalIntegration.closeCardFullscreen(index, cardRefs, modalOptions)
    } catch (error) {
      console.error('Error closing mobile modal:', error)
    }
  }, [])

  // Get device and performance information
  const getDeviceInfo = useCallback(() => {
    if (!isInitializedRef.current) {
      return null
    }

    return menuPageMobileModalIntegration.getDeviceInfo()
  }, [])

  // Manual initialization
  const initialize = useCallback(() => {
    if (!isInitializedRef.current) {
      menuPageMobileModalIntegration.initialize()
      isInitializedRef.current = true
    }
  }, [])

  // Manual cleanup
  const cleanup = useCallback(() => {
    if (isInitializedRef.current) {
      menuPageMobileModalIntegration.cleanup()
      isInitializedRef.current = false
    }
  }, [])

  return {
    openCardFullscreen,
    closeCardFullscreen,
    getDeviceInfo,
    initialize,
    cleanup,
    isInitialized: isInitializedRef.current
  }
}