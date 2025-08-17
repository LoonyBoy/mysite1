/**
 * Enhanced Mobile Menu Card Component
 * 
 * Provides optimized mobile experience for MenuPage cards with
 * improved animations, touch interactions, and accessibility.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import styled from 'styled-components'
import { useMobileModalAnimations } from '../hooks/useMobileModalAnimations'
import { useMenuPageMobileModals } from '../hooks/useMenuPageMobileModals'

const CardContainer = styled.div`
  position: relative;
  width: 100%;
  height: 25vh;
  min-height: 120px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.2) 100%
  );
  backdrop-filter: blur(8px);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  touch-action: manipulation;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover,
  &.force-hover,
  &:active {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(255, 255, 255, 0.04) 100%
    );
    backdrop-filter: blur(12px);
    transform: scale(1.02);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  &.is-open {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    z-index: 1001 !important;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(20px);
    border: none;
    transform: none;
  }
  
  &.loading {
    opacity: 0.7;
    pointer-events: none;
    
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.1) 50%,
        transparent 100%
      );
      animation: shimmer 1.5s infinite;
    }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @media (max-width: 480px) {
    min-height: 100px;
  }
  
  @media (orientation: landscape) and (max-width: 768px) {
    width: 50% !important;
    height: 50vh;
  }
  
  @media (prefers-reduced-motion: reduce) {
    transition: none !important;
    animation: none !important;
    transform: none !important;
  }
  
  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
  }
`

const CardContent = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: 16px;
  
  ${CardContainer}.is-open & {
    padding: 24px 20px;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-top: max(24px, env(safe-area-inset-top));
    padding-left: max(20px, env(safe-area-inset-left));
    padding-right: max(20px, env(safe-area-inset-right));
    padding-bottom: max(24px, env(safe-area-inset-bottom));
  }
  
  @media (max-width: 480px) {
    padding: 12px 16px;
    
    ${CardContainer}.is-open & {
      padding: 20px 16px;
    }
  }
`

const CardTitle = styled.h3`
  font-size: clamp(20px, 5vw, 28px);
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  
  @media (max-width: 480px) {
    font-size: clamp(18px, 6vw, 24px);
  }
  
  @media (prefers-contrast: high) {
    color: #fff;
    text-shadow: none;
  }
`

const CardArrow = styled.div`
  font-size: 20px;
  opacity: 0.7;
  transition: all 0.3s ease;
  transform: translateX(0);
  color: rgba(255, 255, 255, 0.8);
  
  ${CardContainer}:hover &,
  ${CardContainer}.force-hover & {
    opacity: 1;
    transform: translateX(8px);
  }
  
  ${CardContainer}.is-open & {
    display: none;
  }
`

const TouchFeedback = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.05);
  opacity: 0;
  transition: opacity 0.1s ease;
  pointer-events: none;
  
  ${CardContainer}:active & {
    opacity: 1;
  }
  
  @media (hover: hover) {
    display: none;
  }
`

const CloseButton = styled.button`
  position: fixed;
  top: calc(16px + env(safe-area-inset-top, 0px));
  right: 16px;
  z-index: 1102;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  touch-action: manipulation;
  
  &:hover,
  &:active {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
  
  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
  }
  
  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    font-size: 16px;
  }
  
  @media (prefers-contrast: high) {
    border: 2px solid rgba(255, 255, 255, 0.5);
  }
`

const ModalContent = styled.div`
  width: 100%;
  height: 100%;
  opacity: 0;
  transform: translateY(20px);
  
  ${CardContainer}.is-open & {
    opacity: 1;
    transform: translateY(0);
  }
`

const MobileMenuCard = ({
  index,
  title,
  children,
  onClick,
  onOpen,
  onClose,
  isOpen = false,
  isLoading = false,
  className = '',
  'data-testid': testId = `menu-card-${index}`,
  ...props
}) => {
  const cardRef = useRef(null)
  const contentRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isTouched, setIsTouched] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const { animateModalOpen, animateModalClose, getDeviceInfo } = useMobileModalAnimations()
  const { openCardFullscreen, closeCardFullscreen } = useMenuPageMobileModals()
  
  // Device detection
  const deviceInfo = getDeviceInfo()
  const isMobile = deviceInfo?.isMobile || false
  const prefersReducedMotion = deviceInfo?.prefersReducedMotion || false
  
  // Enhanced touch detection
  const isTouchDevice = useCallback(() => {
    try {
      const hasTouchStart = 'ontouchstart' in window
      const hasPointerCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
      const hasTouchPoints = navigator.maxTouchPoints > 0
      return hasTouchStart || hasPointerCoarse || hasTouchPoints
    } catch {
      return false
    }
  }, [])
  
  // Handle card interaction
  const handleCardInteraction = useCallback(async (event) => {
    if (isAnimating || isLoading) return
    
    event.preventDefault()
    event.stopPropagation()
    
    setIsAnimating(true)
    
    try {
      if (isOpen) {
        // Close modal
        await handleClose()
      } else {
        // Open modal
        await handleOpen()
      }
    } catch (error) {
      console.error('Error in card interaction:', error)
    } finally {
      setIsAnimating(false)
    }
  }, [isOpen, isAnimating, isLoading])
  
  // Handle modal opening
  const handleOpen = useCallback(async () => {
    if (!cardRef.current) return
    
    try {
      // Use mobile-optimized animation
      if (isMobile) {
        await animateModalOpen(cardRef.current, contentRef.current, {
          enableStagger: true,
          onComplete: () => {
            if (onOpen) onOpen(index)
          }
        })
      } else {
        // Fallback to basic Flip animation
        const state = Flip.getState(cardRef.current)
        cardRef.current.classList.add('is-open')
        
        Flip.from(state, {
          duration: 0.6,
          ease: 'power2.out',
          onComplete: () => {
            if (onOpen) onOpen(index)
          }
        })
      }
      
      // Focus management
      const closeBtn = cardRef.current.querySelector('.close-button')
      if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 100)
      }
      
    } catch (error) {
      console.error('Error opening modal:', error)
      if (onOpen) onOpen(index)
    }
  }, [index, isMobile, onOpen, animateModalOpen])
  
  // Handle modal closing
  const handleClose = useCallback(async () => {
    if (!cardRef.current) return
    
    try {
      // Use mobile-optimized animation
      if (isMobile) {
        await animateModalClose(cardRef.current, contentRef.current, {
          onComplete: () => {
            if (onClose) onClose(index)
          }
        })
      } else {
        // Fallback to basic Flip animation
        const state = Flip.getState(cardRef.current)
        cardRef.current.classList.remove('is-open')
        
        Flip.from(state, {
          duration: 0.4,
          ease: 'power2.in',
          onComplete: () => {
            if (onClose) onClose(index)
          }
        })
      }
    } catch (error) {
      console.error('Error closing modal:', error)
      if (onClose) onClose(index)
    }
  }, [index, isMobile, onClose, animateModalClose])
  
  // Touch event handlers
  const handleTouchStart = useCallback((event) => {
    if (!isTouchDevice()) return
    
    setIsTouched(true)
    
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }, [isTouchDevice])
  
  const handleTouchEnd = useCallback((event) => {
    if (!isTouchDevice()) return
    
    setIsTouched(false)
    handleCardInteraction(event)
  }, [isTouchDevice, handleCardInteraction])
  
  // Mouse event handlers for desktop
  const handleMouseEnter = useCallback(() => {
    if (isTouchDevice() || isOpen) return
    setIsHovered(true)
  }, [isTouchDevice, isOpen])
  
  const handleMouseLeave = useCallback(() => {
    if (isTouchDevice() || isOpen) return
    setIsHovered(false)
  }, [isTouchDevice, isOpen])
  
  const handleClick = useCallback((event) => {
    if (isTouchDevice()) return // Touch handled separately
    handleCardInteraction(event)
  }, [isTouchDevice, handleCardInteraction])
  
  // Keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleCardInteraction(event)
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      handleClose()
    }
  }, [handleCardInteraction, isOpen, handleClose])
  
  // Update card classes based on state
  useEffect(() => {
    if (!cardRef.current) return
    
    const card = cardRef.current
    
    // Update classes
    card.classList.toggle('force-hover', isHovered)
    card.classList.toggle('is-touched', isTouched)
    card.classList.toggle('is-open', isOpen)
    card.classList.toggle('loading', isLoading)
    
    // Update data attributes for testing
    card.setAttribute('data-card-index', index)
    card.setAttribute('data-is-open', isOpen)
    card.setAttribute('data-is-mobile', isMobile)
  }, [isHovered, isTouched, isOpen, isLoading, index, isMobile])
  
  return (
    <CardContainer
      ref={cardRef}
      className={`menu-card ${className}`}
      data-testid={testId}
      data-card-index={index}
      tabIndex={0}
      role="button"
      aria-expanded={isOpen}
      aria-label={`${title} - ${isOpen ? 'Close' : 'Open'} menu section`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <TouchFeedback />
      
      <CardContent ref={contentRef}>
        {!isOpen ? (
          <>
            <CardTitle>{title}</CardTitle>
            <CardArrow>→</CardArrow>
          </>
        ) : (
          <ModalContent>
            {children}
          </ModalContent>
        )}
      </CardContent>
      
      {isOpen && (
        <CloseButton
          className="close-button"
          onClick={handleClose}
          aria-label="Close modal"
          data-testid="close-button"
        >
          ×
        </CloseButton>
      )}
    </CardContainer>
  )
}

export default MobileMenuCard