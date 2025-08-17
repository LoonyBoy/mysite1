/**
 * Device Detection Utilities
 * Provides reliable touch vs mouse device detection with multiple fallback methods
 */

/**
 * Detect if the current device supports touch interactions
 * Uses multiple detection methods for maximum reliability
 * 
 * @returns {boolean} True if device supports touch, false for mouse-only devices
 */
export const detectTouchDevice = () => {
  try {
    // Method 1: Check for touch events support
    const hasTouchStart = 'ontouchstart' in window
    
    // Method 2: Check pointer media query (most reliable for modern browsers)
    const hasPointerCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
    
    // Method 3: Check navigator touch points
    const hasTouchPoints = navigator.maxTouchPoints > 0
    
    // Method 4: IE/Edge fallback
    const hasTouch = navigator.msMaxTouchPoints > 0
    
    // Method 5: User agent detection (fallback for older devices)
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    const isMobileUA = mobileRegex.test(navigator.userAgent)
    
    // Method 6: Screen size heuristic (additional check)
    const isSmallScreen = window.screen && (window.screen.width <= 768 || window.screen.height <= 768)
    
    // Combine all detection methods
    const touchIndicators = [
      hasTouchStart,
      hasPointerCoarse,
      hasTouchPoints,
      hasTouch,
      isMobileUA
    ]
    
    // Device is considered touch if any primary method returns true
    const primaryTouch = touchIndicators.some(indicator => indicator)
    
    // Additional confidence boost for small screens with touch indicators
    const isTouch = primaryTouch || (isSmallScreen && (hasTouchStart || isMobileUA))
    
    // Log detection results for debugging
    if (typeof console !== 'undefined' && console.log) {
      console.log('Touch device detection:', {
        hasTouchStart,
        hasPointerCoarse,
        hasTouchPoints,
        hasTouch,
        isMobileUA,
        isSmallScreen,
        finalResult: isTouch,
        userAgent: navigator.userAgent
      })
    }
    
    return isTouch
    
  } catch (error) {
    // If detection fails, default to mouse device
    console.warn('Error in touch device detection:', error)
    return false
  }
}

/**
 * Detect device capabilities and performance characteristics
 * 
 * @returns {Object} Device information object
 */
export const getDeviceCapabilities = () => {
  try {
    const isTouch = detectTouchDevice()
    
    // Detect device memory (if available)
    const deviceMemory = navigator.deviceMemory || null
    
    // Detect connection type (if available)
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    const connectionType = connection ? connection.effectiveType : null
    
    // Detect hardware concurrency (CPU cores)
    const hardwareConcurrency = navigator.hardwareConcurrency || null
    
    // Screen information
    const screen = {
      width: window.screen ? window.screen.width : null,
      height: window.screen ? window.screen.height : null,
      pixelRatio: window.devicePixelRatio || 1
    }
    
    // Estimate performance level based on available information
    let performanceLevel = 'medium' // default
    
    if (deviceMemory) {
      if (deviceMemory >= 8) {
        performanceLevel = 'high'
      } else if (deviceMemory <= 2) {
        performanceLevel = 'low'
      }
    }
    
    // Adjust based on connection if available
    if (connectionType) {
      if (connectionType === 'slow-2g' || connectionType === '2g') {
        performanceLevel = 'low'
      }
    }
    
    return {
      isTouch,
      deviceMemory,
      connectionType,
      hardwareConcurrency,
      screen,
      performanceLevel,
      userAgent: navigator.userAgent
    }
    
  } catch (error) {
    console.warn('Error getting device capabilities:', error)
    return {
      isTouch: false,
      deviceMemory: null,
      connectionType: null,
      hardwareConcurrency: null,
      screen: { width: null, height: null, pixelRatio: 1 },
      performanceLevel: 'medium',
      userAgent: navigator.userAgent || 'unknown'
    }
  }
}

/**
 * Check if device prefers reduced motion
 * 
 * @returns {boolean} True if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  try {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch (error) {
    console.warn('Error checking reduced motion preference:', error)
    return false
  }
}

/**
 * Detect if device is in landscape or portrait orientation
 * 
 * @returns {'landscape'|'portrait'|'unknown'} Current orientation
 */
export const getOrientation = () => {
  try {
    if (window.screen && window.screen.orientation) {
      return window.screen.orientation.angle % 180 === 0 ? 'portrait' : 'landscape'
    }
    
    if (window.orientation !== undefined) {
      return Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait'
    }
    
    // Fallback to window dimensions
    if (window.innerWidth && window.innerHeight) {
      return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    }
    
    return 'unknown'
  } catch (error) {
    console.warn('Error detecting orientation:', error)
    return 'unknown'
  }
}

/**
 * Create a device detection hook for React components
 * 
 * @returns {Function} Hook function that returns device information
 */
export const createDeviceDetectionHook = () => {
  return () => {
    const [deviceInfo, setDeviceInfo] = useState(() => getDeviceCapabilities())
    
    useEffect(() => {
      // Update device info if orientation changes
      const handleOrientationChange = () => {
        setDeviceInfo(prev => ({
          ...prev,
          orientation: getOrientation()
        }))
      }
      
      // Listen for orientation changes
      window.addEventListener('orientationchange', handleOrientationChange)
      window.addEventListener('resize', handleOrientationChange)
      
      return () => {
        window.removeEventListener('orientationchange', handleOrientationChange)
        window.removeEventListener('resize', handleOrientationChange)
      }
    }, [])
    
    return deviceInfo
  }
}

/**
 * Debounce function for preventing rapid event firing
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Whether to execute immediately on first call
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }
    
    const callNow = immediate && !timeout
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func.apply(this, args)
  }
}

/**
 * Throttle function for limiting event frequency
 * 
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Export default object with all utilities
export default {
  detectTouchDevice,
  getDeviceCapabilities,
  prefersReducedMotion,
  getOrientation,
  createDeviceDetectionHook,
  debounce,
  throttle
}