/**
 * Mobile Card Full-Height Expansion System
 * Task 3: Create Mobile Card Full-Height Expansion
 * 
 * Implements card expansion animations to reach full viewport height (100dvh)
 * with smooth GSAP animations and proper mobile viewport handling.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'

gsap.registerPlugin(Flip)

class MobileCardFullHeightExpansion {
  constructor(options = {}) {
    this.options = {
      // Animation durations
      expansionDuration: 0.8,
      contractionDuration: 0.6,
      
      // Easing functions
      expansionEase: 'power2.out',
      contractionEase: 'power2.in',
      
      // Mobile viewport handling
      useDynamicViewport: true,
      safeAreaSupport: true,
      
      // Performance options
      useGPUAcceleration: true,
      optimizeForMobile: true,
      
      // Z-index management
      expandedZIndex: 1000,
      normalZIndex: 'auto',
      
      // Classes
      expandedClass: 'card-full-height-expanded',
      expandingClass: 'card-expanding',
      contractingClass: 'card-contracting',
      
      ...options
    }
    
    this.activeExpansions = new Map()
    this.isTouch = this.detectTouchDevice()
    this.viewportHeight = this.getViewportHeight()
    this.safeAreaInsets = this.getSafeAreaInsets()
    
    // Bind methods
    this.expandCard = this.expandCard.bind(this)
    this.contractCard = this.contractCard.bind(this)
    this.handleViewportChange = this.handleViewportChange.bind(this)
    
    // Listen for viewport changes
    this.setupViewportListeners()
    
    console.log('MobileCardFullHeightExpansion initialized:', {
      isTouch: this.isTouch,
      viewportHeight: this.viewportHeight,
      safeAreaInsets: this.safeAreaInsets
    })
  }

  /**
   * Detect touch device capability
   */
  detectTouchDevice() {
    try {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
      )
    } catch {
      return false
    }
  }

  /**
   * Get current viewport height with mobile considerations
   * Requirement 2.4: Proper mobile viewport handling
   */
  getViewportHeight() {
    if (this.options.useDynamicViewport && window.visualViewport) {
      // Use Visual Viewport API for accurate mobile viewport
      return window.visualViewport.height
    }
    
    // Fallback to standard viewport height
    return window.innerHeight || document.documentElement.clientHeight
  }

  /**
   * Get safe area insets for notched devices
   * Requirement 2.4: Safe area support
   */
  getSafeAreaInsets() {
    if (!this.options.safeAreaSupport) {
      return { top: 0, right: 0, bottom: 0, left: 0 }
    }

    try {
      const computedStyle = getComputedStyle(document.documentElement)
      return {
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0,
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0
      }
    } catch {
      return { top: 0, right: 0, bottom: 0, left: 0 }
    }
  }

  /**
   * Setup viewport change listeners for responsive behavior
   */
  setupViewportListeners() {
    // Listen for viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.handleViewportChange)
    }
    
    window.addEventListener('resize', this.handleViewportChange)
    window.addEventListener('orientationchange', () => {
      // Delay to allow orientation change to complete
      setTimeout(this.handleViewportChange, 100)
    })
  }

  /**
   * Handle viewport changes and update active expansions
   */
  handleViewportChange() {
    this.viewportHeight = this.getViewportHeight()
    this.safeAreaInsets = this.getSafeAreaInsets()
    
    // Update any active expansions to new viewport size
    this.activeExpansions.forEach((expansion, cardElement) => {
      if (expansion.isExpanded) {
        this.updateExpansionToViewport(cardElement, expansion)
      }
    })
  }

  /**
   * Expand card to full viewport height
   * Requirements 2.1, 2.2: Card expansion to reach full viewport height
   * 
   * @param {HTMLElement} cardElement - Card element to expand
   * @param {Object} options - Expansion options
   * @returns {Promise} Promise that resolves when expansion is complete
   */
  async expandCard(cardElement, options = {}) {
    if (!cardElement) {
      throw new Error('Card element is required for expansion')
    }

    const cardIndex = cardElement.dataset.cardIndex || 'unknown'
    
    // Check if already expanding or expanded
    const existingExpansion = this.activeExpansions.get(cardElement)
    if (existingExpansion && (existingExpansion.isExpanding || existingExpansion.isExpanded)) {
      console.log(`Card ${cardIndex} is already expanding or expanded`)
      return existingExpansion.promise
    }

    console.log(`Starting full-height expansion for card ${cardIndex}`)

    // Store original state for restoration
    const originalState = this.captureOriginalState(cardElement)
    
    // Create expansion state
    const expansion = {
      cardElement,
      cardIndex,
      originalState,
      isExpanding: true,
      isExpanded: false,
      timeline: null,
      promise: null
    }

    // Create expansion promise
    expansion.promise = new Promise((resolve, reject) => {
      try {
        // Add expanding class
        cardElement.classList.add(this.options.expandingClass)
        
        // Create GSAP timeline for smooth expansion
        // Requirement 2.3: Smooth GSAP animations
        const timeline = gsap.timeline({
          defaults: {
            ease: this.options.expansionEase,
            duration: this.options.expansionDuration
          },
          onComplete: () => {
            expansion.isExpanding = false
            expansion.isExpanded = true
            cardElement.classList.remove(this.options.expandingClass)
            cardElement.classList.add(this.options.expandedClass)
            console.log(`Full-height expansion completed for card ${cardIndex}`)
            resolve(expansion)
          },
          onInterrupt: () => {
            console.log(`Full-height expansion interrupted for card ${cardIndex}`)
            reject(new Error('Expansion interrupted'))
          }
        })

        // Set initial properties for GPU acceleration
        if (this.options.useGPUAcceleration) {
          gsap.set(cardElement, {
            willChange: 'transform, position, width, height, z-index',
            force3D: true,
            transformOrigin: 'center top'
          })
        }

        // Calculate target dimensions and position
        const targetDimensions = this.calculateTargetDimensions()
        
        // Animate to full viewport height
        // Requirements 2.1, 2.2: Expansion to top and bottom of screen
        timeline.to(cardElement, {
          position: 'fixed',
          top: targetDimensions.top,
          left: targetDimensions.left,
          width: targetDimensions.width,
          height: targetDimensions.height,
          zIndex: this.options.expandedZIndex,
          duration: this.options.expansionDuration,
          ease: this.options.expansionEase
        })

        // Add enhanced visual effects
        .to(cardElement, {
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4), 0 10px 30px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(2px)',
          duration: this.options.expansionDuration * 0.8,
          ease: 'power2.out'
        }, 0)

        // Animate card content if present
        this.animateCardContent(timeline, cardElement, 'expand')

        expansion.timeline = timeline
        
      } catch (error) {
        console.error(`Error expanding card ${cardIndex}:`, error)
        reject(error)
      }
    })

    this.activeExpansions.set(cardElement, expansion)
    return expansion.promise
  }

  /**
   * Contract card from full height back to original size
   * Requirement 2.3: Smooth transitions between states
   * 
   * @param {HTMLElement} cardElement - Card element to contract
   * @param {Object} options - Contraction options
   * @returns {Promise} Promise that resolves when contraction is complete
   */
  async contractCard(cardElement, options = {}) {
    if (!cardElement) {
      throw new Error('Card element is required for contraction')
    }

    const expansion = this.activeExpansions.get(cardElement)
    if (!expansion || (!expansion.isExpanded && !expansion.isExpanding)) {
      console.log('Card is not expanded, skipping contraction')
      return Promise.resolve()
    }

    const cardIndex = expansion.cardIndex

    console.log(`Starting full-height contraction for card ${cardIndex}`)

    // Kill existing timeline if running
    if (expansion.timeline) {
      expansion.timeline.kill()
    }

    // Update expansion state
    expansion.isExpanding = false
    expansion.isExpanded = false
    expansion.isContracting = true

    // Add contracting class
    cardElement.classList.remove(this.options.expandedClass, this.options.expandingClass)
    cardElement.classList.add(this.options.contractingClass)

    return new Promise((resolve, reject) => {
      try {
        // Create contraction timeline
        const timeline = gsap.timeline({
          defaults: {
            ease: this.options.contractionEase,
            duration: this.options.contractionDuration
          },
          onComplete: () => {
            // Restore original state
            this.restoreOriginalState(cardElement, expansion.originalState)
            
            // Clean up classes
            cardElement.classList.remove(this.options.contractingClass)
            
            // Clean up expansion tracking
            this.activeExpansions.delete(cardElement)
            
            console.log(`Full-height contraction completed for card ${cardIndex}`)
            resolve()
          },
          onInterrupt: () => {
            console.log(`Full-height contraction interrupted for card ${cardIndex}`)
            reject(new Error('Contraction interrupted'))
          }
        })

        // Animate back to original state
        timeline.to(cardElement, {
          position: expansion.originalState.position,
          top: expansion.originalState.top,
          left: expansion.originalState.left,
          width: expansion.originalState.width,
          height: expansion.originalState.height,
          zIndex: expansion.originalState.zIndex,
          duration: this.options.contractionDuration,
          ease: this.options.contractionEase
        })

        // Remove visual effects
        .to(cardElement, {
          boxShadow: expansion.originalState.boxShadow || 'none',
          backdropFilter: expansion.originalState.backdropFilter || 'none',
          duration: this.options.contractionDuration * 0.6,
          ease: 'power2.in'
        }, 0)

        // Animate card content back
        this.animateCardContent(timeline, cardElement, 'contract')

        expansion.timeline = timeline
        
      } catch (error) {
        console.error(`Error contracting card ${cardIndex}:`, error)
        reject(error)
      }
    })
  }

  /**
   * Calculate target dimensions for full viewport expansion
   * Requirements 2.1, 2.2, 2.4: Full viewport with safe area support
   */
  calculateTargetDimensions() {
    const viewportWidth = window.innerWidth
    const viewportHeight = this.getViewportHeight()
    
    let dimensions = {
      top: 0,
      left: 0,
      width: `${viewportWidth}px`,
      height: `${viewportHeight}px`
    }

    // Apply safe area insets if supported
    if (this.options.safeAreaSupport) {
      dimensions = {
        top: this.safeAreaInsets.top,
        left: this.safeAreaInsets.left,
        width: `calc(100vw - ${this.safeAreaInsets.left + this.safeAreaInsets.right}px)`,
        height: this.options.useDynamicViewport ? 
          `calc(100dvh - ${this.safeAreaInsets.top + this.safeAreaInsets.bottom}px)` :
          `calc(100vh - ${this.safeAreaInsets.top + this.safeAreaInsets.bottom}px)`
      }
    } else {
      // Use viewport units for better mobile support
      dimensions.width = '100vw'
      dimensions.height = this.options.useDynamicViewport ? '100dvh' : '100vh'
    }

    return dimensions
  }

  /**
   * Capture original state of card element for restoration
   */
  captureOriginalState(cardElement) {
    const computedStyle = getComputedStyle(cardElement)
    const rect = cardElement.getBoundingClientRect()
    
    return {
      position: computedStyle.position,
      top: computedStyle.top,
      left: computedStyle.left,
      width: computedStyle.width,
      height: computedStyle.height,
      zIndex: computedStyle.zIndex,
      transform: computedStyle.transform,
      boxShadow: computedStyle.boxShadow,
      backdropFilter: computedStyle.backdropFilter,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      }
    }
  }

  /**
   * Restore original state of card element
   */
  restoreOriginalState(cardElement, originalState) {
    gsap.set(cardElement, {
      position: originalState.position,
      top: originalState.top,
      left: originalState.left,
      width: originalState.width,
      height: originalState.height,
      zIndex: originalState.zIndex,
      transform: originalState.transform,
      boxShadow: originalState.boxShadow,
      backdropFilter: originalState.backdropFilter,
      willChange: 'auto',
      clearProps: 'force3D'
    })
  }

  /**
   * Update active expansion to match current viewport
   */
  updateExpansionToViewport(cardElement, expansion) {
    if (!expansion.isExpanded) return

    const targetDimensions = this.calculateTargetDimensions()
    
    gsap.set(cardElement, {
      top: targetDimensions.top,
      left: targetDimensions.left,
      width: targetDimensions.width,
      height: targetDimensions.height
    })
  }

  /**
   * Animate card content during expansion/contraction
   */
  animateCardContent(timeline, cardElement, direction) {
    const cardIndex = cardElement.dataset.cardIndex
    
    // Find title and arrow elements
    const titleElement = cardElement.querySelector(`.title-${cardIndex}`) || 
                        cardElement.querySelector('.card-title')
    const arrowElement = cardElement.querySelector(`.arrow-${cardIndex}`) || 
                        cardElement.querySelector('.card-arrow')

    if (direction === 'expand') {
      // Animate content during expansion
      if (titleElement) {
        timeline.to(titleElement, {
          scale: 1.15,
          y: -25,
          duration: this.options.expansionDuration * 0.7,
          ease: this.options.expansionEase
        }, 0.1)
      }
      
      if (arrowElement) {
        timeline.to(arrowElement, {
          x: 20,
          rotation: 45,
          scale: 1.3,
          opacity: 0.9,
          yPercent: -50,
          duration: this.options.expansionDuration * 0.8,
          ease: this.options.expansionEase
        }, 0.15)
      }
    } else if (direction === 'contract') {
      // Animate content during contraction
      if (titleElement) {
        timeline.to(titleElement, {
          scale: 1,
          y: 0,
          duration: this.options.contractionDuration * 0.8,
          ease: this.options.contractionEase
        }, 0)
      }
      
      if (arrowElement) {
        timeline.to(arrowElement, {
          x: 0,
          rotation: 0,
          scale: 1,
          opacity: 0.7,
          yPercent: 0,
          duration: this.options.contractionDuration * 0.9,
          ease: this.options.contractionEase
        }, 0)
      }
    }
  }

  /**
   * Check if card is currently expanded
   */
  isCardExpanded(cardElement) {
    const expansion = this.activeExpansions.get(cardElement)
    return expansion && expansion.isExpanded
  }

  /**
   * Check if card is currently expanding
   */
  isCardExpanding(cardElement) {
    const expansion = this.activeExpansions.get(cardElement)
    return expansion && expansion.isExpanding
  }

  /**
   * Get expansion state for a card
   */
  getExpansionState(cardElement) {
    const expansion = this.activeExpansions.get(cardElement)
    if (!expansion) {
      return { isExpanded: false, isExpanding: false, isContracting: false }
    }
    
    return {
      isExpanded: expansion.isExpanded,
      isExpanding: expansion.isExpanding,
      isContracting: expansion.isContracting || false
    }
  }

  /**
   * Force contract all expanded cards
   */
  async contractAllCards() {
    const contractionPromises = []
    
    this.activeExpansions.forEach((expansion, cardElement) => {
      if (expansion.isExpanded || expansion.isExpanding) {
        contractionPromises.push(this.contractCard(cardElement))
      }
    })
    
    return Promise.all(contractionPromises)
  }

  /**
   * Clean up all expansions and event listeners
   */
  cleanup() {
    console.log('Cleaning up MobileCardFullHeightExpansion')
    
    // Contract all expanded cards
    this.contractAllCards()
    
    // Remove event listeners
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.handleViewportChange)
    }
    window.removeEventListener('resize', this.handleViewportChange)
    window.removeEventListener('orientationchange', this.handleViewportChange)
    
    // Clear active expansions
    this.activeExpansions.clear()
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      activeExpansions: this.activeExpansions.size,
      isTouch: this.isTouch,
      viewportHeight: this.viewportHeight,
      safeAreaInsets: this.safeAreaInsets,
      useDynamicViewport: this.options.useDynamicViewport
    }
  }
}

export default MobileCardFullHeightExpansion