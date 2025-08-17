/**
 * Enhanced device detection utility for mobile web applications
 * Provides robust touch device detection with multiple fallback methods
 */

class DeviceDetection {
  constructor() {
    this.cache = new Map()
    this.listeners = new Set()
    this.currentCapabilities = null
    
    // Initialize detection on construction
    this.detectCapabilities()
    
    // Listen for orientation changes to re-detect capabilities
    this.setupOrientationListener()
  }

  /**
   * Comprehensive device capability detection
   * @returns {Object} Device capabilities object
   */
  detectCapabilities() {
    const cacheKey = 'device-capabilities'
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const capabilities = {
      // Primary touch detection methods
      hasTouch: this.detectTouch(),
      hasMouse: this.detectMouse(),
      hasKeyboard: this.detectKeyboard(),
      
      // Device characteristics
      screenSize: this.getScreenSize(),
      deviceType: this.getDeviceType(),
      orientation: this.getOrientation(),
      
      // Performance indicators
      deviceMemory: this.getDeviceMemory(),
      hardwareConcurrency: this.getHardwareConcurrency(),
      
      // Browser capabilities
      supportsPointerEvents: this.supportsPointerEvents(),
      supportsHover: this.supportsHover(),
      
      // Accessibility preferences
      prefersReducedMotion: this.prefersReducedMotion(),
      
      // Final determination
      isPrimaryTouch: false,
      isPrimaryMouse: false
    }

    // Determine primary interaction method
    this.determinePrimaryInteraction(capabilities)
    
    this.cache.set(cacheKey, capabilities)
    this.currentCapabilities = capabilities
    
    console.log('Device capabilities detected:', capabilities)
    
    return capabilities
  }

  /**
   * Detect touch capabilities using multiple methods
   * @returns {boolean} True if device has touch capabilities
   */
  detectTouch() {
    try {
      // Method 1: Touch events support
      const hasTouchEvents = 'ontouchstart' in window || 
                            'ontouchstart' in document.documentElement

      // Method 2: Navigator touch points
      const hasTouchPoints = navigator.maxTouchPoints > 0 || 
                            navigator.msMaxTouchPoints > 0

      // Method 3: Pointer media query
      const hasCoarsePointer = window.matchMedia && 
                              window.matchMedia('(pointer: coarse)').matches

      // Method 4: Touch media query
      const hasTouchHover = window.matchMedia && 
                           window.matchMedia('(hover: none)').matches

      // Method 5: DocumentTouch (legacy)
      const hasDocumentTouch = window.DocumentTouch && 
                              document instanceof window.DocumentTouch

      return hasTouchEvents || hasTouchPoints || hasCoarsePointer || 
             hasTouchHover || hasDocumentTouch
    } catch (error) {
      console.warn('Error detecting touch capabilities:', error)
      return false
    }
  }

  /**
   * Detect mouse capabilities
   * @returns {boolean} True if device has mouse capabilities
   */
  detectMouse() {
    try {
      // Method 1: Pointer media query
      const hasFinePointer = window.matchMedia && 
                            window.matchMedia('(pointer: fine)').matches

      // Method 2: Hover support
      const hasHoverSupport = window.matchMedia && 
                             window.matchMedia('(hover: hover)').matches

      // Method 3: Mouse events (less reliable on touch devices)
      const hasMouseEvents = 'onmouseenter' in window

      return hasFinePointer || hasHoverSupport || hasMouseEvents
    } catch (error) {
      console.warn('Error detecting mouse capabilities:', error)
      return false
    }
  }

  /**
   * Detect keyboard capabilities
   * @returns {boolean} True if device likely has keyboard
   */
  detectKeyboard() {
    try {
      // Physical keyboard detection is limited in browsers
      // We use screen size and device type as heuristics
      const screenSize = this.getScreenSize()
      const isLargeScreen = screenSize.width >= 1024 && screenSize.height >= 768
      
      // Assume desktop/laptop devices have keyboards
      return isLargeScreen || this.detectMouse()
    } catch (error) {
      console.warn('Error detecting keyboard capabilities:', error)
      return false
    }
  }

  /**
   * Get screen size information
   * @returns {Object} Screen size data
   */
  getScreenSize() {
    // Use viewport size for more accurate detection in web context
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      availWidth: window.screen ? window.screen.availWidth : window.innerWidth,
      availHeight: window.screen ? window.screen.availHeight : window.innerHeight,
      screenWidth: window.screen ? window.screen.width : window.innerWidth,
      screenHeight: window.screen ? window.screen.height : window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1
    }
  }

  /**
   * Determine device type based on screen size and capabilities
   * @returns {string} Device type: 'mobile', 'tablet', 'desktop'
   */
  getDeviceType() {
    const screenSize = this.getScreenSize()
    const { width, height } = screenSize
    const minDimension = Math.min(width, height)
    const maxDimension = Math.max(width, height)

    // Mobile: smaller screens
    if (maxDimension <= 768) {
      return 'mobile'
    }
    
    // Tablet: medium screens
    if (maxDimension <= 1024) {
      return 'tablet'
    }
    
    // Desktop: large screens
    return 'desktop'
  }

  /**
   * Get current orientation
   * @returns {string} 'portrait' or 'landscape'
   */
  getOrientation() {
    const screenSize = this.getScreenSize()
    
    // Always use viewport size for orientation detection in web context
    // This is more reliable than screen.orientation API
    return screenSize.width > screenSize.height ? 'landscape' : 'portrait'
  }

  /**
   * Get device memory if available
   * @returns {number|null} Device memory in GB or null if not available
   */
  getDeviceMemory() {
    return navigator.deviceMemory || null
  }

  /**
   * Get hardware concurrency (CPU cores)
   * @returns {number} Number of logical processors
   */
  getHardwareConcurrency() {
    return navigator.hardwareConcurrency || 4 // Default to 4 if not available
  }

  /**
   * Check if pointer events are supported
   * @returns {boolean} True if pointer events are supported
   */
  supportsPointerEvents() {
    return 'PointerEvent' in window
  }

  /**
   * Check if CSS hover is supported
   * @returns {boolean} True if hover is supported
   */
  supportsHover() {
    return window.matchMedia && window.matchMedia('(hover: hover)').matches
  }

  /**
   * Check if user prefers reduced motion
   * @returns {boolean} True if reduced motion is preferred
   */
  prefersReducedMotion() {
    return window.matchMedia && 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * Determine primary interaction method
   * @param {Object} capabilities - Device capabilities object
   */
  determinePrimaryInteraction(capabilities) {
    const { hasTouch, hasMouse, deviceType, screenSize } = capabilities

    // Mobile devices are primarily touch
    if (deviceType === 'mobile') {
      capabilities.isPrimaryTouch = true
      capabilities.isPrimaryMouse = false
      return
    }

    // Desktop devices are primarily mouse
    if (deviceType === 'desktop') {
      capabilities.isPrimaryTouch = false
      capabilities.isPrimaryMouse = true
      return
    }

    // Tablets: check for external mouse/keyboard
    if (deviceType === 'tablet') {
      // If both touch and mouse are available, prefer touch for tablets
      if (hasTouch && hasMouse) {
        capabilities.isPrimaryTouch = true
        capabilities.isPrimaryMouse = false
      } else if (hasTouch) {
        capabilities.isPrimaryTouch = true
        capabilities.isPrimaryMouse = false
      } else {
        capabilities.isPrimaryTouch = false
        capabilities.isPrimaryMouse = true
      }
      return
    }

    // Fallback: prefer touch if available, otherwise mouse
    capabilities.isPrimaryTouch = hasTouch
    capabilities.isPrimaryMouse = !hasTouch
  }

  /**
   * Setup orientation change listener to re-detect capabilities
   */
  setupOrientationListener() {
    const handleOrientationChange = () => {
      // Clear cache and re-detect
      this.cache.clear()
      const newCapabilities = this.detectCapabilities()
      
      // Notify listeners of capability changes
      this.notifyListeners(newCapabilities)
    }

    // Listen for orientation changes
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange)
    } else {
      window.addEventListener('orientationchange', handleOrientationChange)
    }

    // Also listen for resize events as a fallback
    window.addEventListener('resize', handleOrientationChange)
  }

  /**
   * Add listener for capability changes
   * @param {Function} listener - Callback function
   */
  addCapabilityListener(listener) {
    this.listeners.add(listener)
  }

  /**
   * Remove capability change listener
   * @param {Function} listener - Callback function to remove
   */
  removeCapabilityListener(listener) {
    this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of capability changes
   * @param {Object} capabilities - New capabilities object
   */
  notifyListeners(capabilities) {
    this.listeners.forEach(listener => {
      try {
        listener(capabilities)
      } catch (error) {
        console.warn('Error in capability change listener:', error)
      }
    })
  }

  /**
   * Get current capabilities (cached)
   * @returns {Object} Current device capabilities
   */
  getCapabilities() {
    return this.currentCapabilities || this.detectCapabilities()
  }

  /**
   * Check if device is primarily touch-based
   * @returns {boolean} True if primary interaction is touch
   */
  isPrimaryTouch() {
    const capabilities = this.getCapabilities()
    return capabilities.isPrimaryTouch
  }

  /**
   * Check if device is primarily mouse-based
   * @returns {boolean} True if primary interaction is mouse
   */
  isPrimaryMouse() {
    const capabilities = this.getCapabilities()
    return capabilities.isPrimaryMouse
  }

  /**
   * Get device performance level based on hardware
   * @returns {string} 'low', 'medium', or 'high'
   */
  getPerformanceLevel() {
    const capabilities = this.getCapabilities()
    const { deviceMemory, hardwareConcurrency, deviceType } = capabilities

    // High performance: desktop with good specs
    if (deviceType === 'desktop' && 
        (deviceMemory >= 8 || hardwareConcurrency >= 8)) {
      return 'high'
    }

    // Medium performance: tablets or decent mobile devices
    if (deviceType === 'tablet' || 
        (deviceMemory >= 4 || hardwareConcurrency >= 4)) {
      return 'medium'
    }

    // Low performance: older or budget mobile devices
    return 'low'
  }

  /**
   * Clean up listeners and resources
   */
  destroy() {
    this.listeners.clear()
    this.cache.clear()
    // Note: We don't remove window listeners as they might be needed by other instances
  }
}

// Create singleton instance
const deviceDetection = new DeviceDetection()

// Export both the class and singleton instance
export { DeviceDetection }
export default deviceDetection