/**
 * Enhanced Mobile Navigation Component
 * 
 * Provides improved mobile navigation with better animations,
 * touch interactions, and accessibility features.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import styled from 'styled-components'

const NavigationContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(60px + env(safe-area-inset-bottom, 0px));
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.hidden {
    transform: translateY(100%);
  }
  
  @media (min-width: 769px) {
    display: none;
  }
  
  @media (prefers-contrast: high) {
    background: rgba(0, 0, 0, 0.95);
    border-top: 2px solid rgba(255, 255, 255, 0.3);
  }
`

const NavItem = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  touch-action: manipulation;
  min-width: 44px;
  min-height: 44px;
  background: transparent;
  border: none;
  position: relative;
  overflow: hidden;
  
  &:hover,
  &:active {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0) scale(0.95);
  }
  
  &.active {
    background: rgba(255, 255, 255, 0.15);
    
    .nav-icon {
      color: #fff;
      transform: scale(1.1);
    }
    
    .nav-label {
      color: rgba(255, 255, 255, 0.9);
      font-weight: 600;
    }
  }
  
  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
  }
  
  /* Ripple effect */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    border-radius: inherit;
    opacity: 0;
    transform: scale(0);
    transition: all 0.3s ease;
  }
  
  &:active::before {
    opacity: 1;
    transform: scale(1);
    transition: all 0.1s ease;
  }
  
  @media (prefers-reduced-motion: reduce) {
    transition: none !important;
    transform: none !important;
    
    &::before {
      display: none;
    }
  }
`

const NavIcon = styled.div`
  font-size: 20px;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  line-height: 1;
  
  @media (max-width: 480px) {
    font-size: 18px;
  }
`

const NavLabel = styled.span`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  transition: all 0.2s ease;
  line-height: 1;
  
  @media (max-width: 480px) {
    font-size: 9px;
  }
`

const ActiveIndicator = styled.div`
  position: absolute;
  top: -2px;
  left: 50%;
  width: 20px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #fff, transparent);
  border-radius: 1px;
  transform: translateX(-50%) scaleX(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  ${NavItem}.active & {
    transform: translateX(-50%) scaleX(1);
  }
`

const navigationItems = [
  {
    id: 'home',
    label: 'Home',
    icon: '🏠',
    path: '/',
    ariaLabel: 'Navigate to home page'
  },
  {
    id: 'menu',
    label: 'Menu',
    icon: '📋',
    path: '/menu',
    ariaLabel: 'Navigate to menu page'
  },
  {
    id: 'about',
    label: 'About',
    icon: '👤',
    path: '/about',
    ariaLabel: 'Navigate to about page'
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: '📧',
    path: '/contact',
    ariaLabel: 'Navigate to contact page'
  }
]

const EnhancedMobileNavigation = ({ 
  className = '',
  onNavigate,
  hideOnScroll = true,
  autoHideDelay = 3000
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const navRef = useRef(null)
  const hideTimeoutRef = useRef(null)
  const lastScrollYRef = useRef(0)
  const [isVisible, setIsVisible] = useState(true)
  const [activeItem, setActiveItem] = useState('')

  // Determine active item based on current path
  useEffect(() => {
    const currentPath = location.pathname
    const activeNavItem = navigationItems.find(item => 
      item.path === currentPath || 
      (item.path !== '/' && currentPath.startsWith(item.path))
    )
    setActiveItem(activeNavItem?.id || '')
  }, [location.pathname])

  // Handle scroll-based hiding
  useEffect(() => {
    if (!hideOnScroll) return

    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          const scrollDifference = currentScrollY - lastScrollYRef.current

          // Hide on scroll down, show on scroll up
          if (scrollDifference > 10 && currentScrollY > 100) {
            setIsVisible(false)
          } else if (scrollDifference < -10 || currentScrollY < 50) {
            setIsVisible(true)
          }

          lastScrollYRef.current = currentScrollY
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hideOnScroll])

  // Auto-hide after inactivity
  useEffect(() => {
    if (!autoHideDelay) return

    const resetHideTimer = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
      
      setIsVisible(true)
      
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false)
      }, autoHideDelay)
    }

    const events = ['touchstart', 'touchmove', 'scroll', 'mousemove']
    events.forEach(event => {
      document.addEventListener(event, resetHideTimer, { passive: true })
    })

    resetHideTimer()

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetHideTimer)
      })
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [autoHideDelay])

  // Handle navigation with enhanced animations
  const handleNavigation = useCallback(async (item, event) => {
    event.preventDefault()
    
    // Haptic feedback
    if (navigator.vibrate) {
      try {
        navigator.vibrate(10)
      } catch (error) {
        console.warn('Haptic feedback not available:', error)
      }
    }

    // Visual feedback animation
    const button = event.currentTarget
    gsap.to(button, {
      scale: 0.9,
      duration: 0.1,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1
    })

    // Custom navigation callback
    if (onNavigate) {
      const shouldNavigate = await onNavigate(item)
      if (shouldNavigate === false) return
    }

    // Navigate with a small delay for visual feedback
    setTimeout(() => {
      navigate(item.path)
    }, 100)
  }, [navigate, onNavigate])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event, item) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleNavigation(item, event)
    }
  }, [handleNavigation])

  // Show/hide animation
  useEffect(() => {
    if (!navRef.current) return

    gsap.to(navRef.current, {
      y: isVisible ? 0 : '100%',
      duration: 0.3,
      ease: 'power2.out'
    })
  }, [isVisible])

  return (
    <NavigationContainer
      ref={navRef}
      className={`mobile-navigation ${className} ${!isVisible ? 'hidden' : ''}`}
      role="navigation"
      aria-label="Mobile navigation"
    >
      {navigationItems.map((item) => (
        <NavItem
          key={item.id}
          className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
          onClick={(event) => handleNavigation(item, event)}
          onKeyDown={(event) => handleKeyDown(event, item)}
          aria-label={item.ariaLabel}
          aria-current={activeItem === item.id ? 'page' : undefined}
          data-testid={`nav-item-${item.id}`}
        >
          <ActiveIndicator />
          
          <NavIcon className="nav-icon">
            {item.icon}
          </NavIcon>
          
          <NavLabel className="nav-label">
            {item.label}
          </NavLabel>
        </NavItem>
      ))}
    </NavigationContainer>
  )
}

export default EnhancedMobileNavigation