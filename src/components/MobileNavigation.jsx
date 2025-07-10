import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { useParticles } from './GlobalParticleManager'
import logger from '../utils/Logger'

const SwipeHint = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  text-align: center;
  z-index: 99;
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`

const MobileNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setParticleSpeed, setTransitionContext } = useParticles()

  useEffect(() => {
    let startX = 0
    let startY = 0
    let startTime = 0
    let isDragging = false
    let currentX = 0
    
    const getContentElement = () => {
      if (location.pathname === '/home') {
        return document.querySelector('#hero')
      } else if (location.pathname === '/projects') {
        return document.querySelector('section')
      }
      return null
    }
    
    const handleTouchStart = (e) => {
      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      startTime = Date.now()
      isDragging = false
      currentX = 0
      
      logger.touch('Touch start', { 
        x: startX, 
        y: startY, 
        page: location.pathname,
        timestamp: startTime 
      })
      
      const contentElement = getContentElement()
      if (contentElement) {
        contentElement.style.transition = 'none'
        logger.animation('Content transition disabled for touch interaction')
      }
    }

    const handleTouchMove = (e) => {
      if (!startX || !startY) return
      
      const touch = e.touches[0]
      const diffX = startX - touch.clientX
      const diffY = startY - touch.clientY
      
      // Проверяем, что это горизонтальный свайп
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 20) {
        if (!isDragging) {
          logger.touch('Horizontal swipe detected', { 
            diffX, 
            diffY, 
            page: location.pathname 
          })
        }
        
        isDragging = true
        currentX = -diffX
        
        // Ограничиваем перемещение
        const maxOffset = window.innerWidth * 0.3
        currentX = Math.max(-maxOffset, Math.min(maxOffset, currentX))
        
        const contentElement = getContentElement()
        if (contentElement) {
          contentElement.style.transform = `translateX(${currentX}px)`
          
          // Добавляем эффект затухания при крайних позициях
          const opacity = 1 - Math.abs(currentX) / maxOffset * 0.3
          contentElement.style.opacity = opacity
          
          // Momentum эффект - добавляем небольшое размытие при быстром движении
          const velocity = Math.abs(diffX) / (Date.now() - startTime)
          if (velocity > 1.5) {
            contentElement.style.filter = `blur(${Math.min(velocity * 0.5, 2)}px)`
          } else {
            contentElement.style.filter = 'none'
          }
        }
        
        // Предотвращаем скролл при горизонтальном свайпе
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e) => {
      if (!startX || !startY) return
      
      const touch = e.changedTouches[0]
      const diffX = startX - touch.clientX
      const diffY = startY - touch.clientY
      const swipeTime = Date.now() - startTime
      
      const contentElement = getContentElement()
      
      if (contentElement) {
        contentElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        
        // Проверяем, достаточно ли сильный свайп для перехода
        const threshold = window.innerWidth * 0.15
        const velocity = Math.abs(diffX) / swipeTime
        
        if (isDragging && (Math.abs(currentX) > threshold || velocity > 0.5)) {
          if (diffX > 0 && location.pathname === '/home') {
            // Свайп влево на /home → переход на /projects
            logger.touch('Swipe left: home->projects', { 
              velocity, 
              distance: Math.abs(currentX),
              swipeTime 
            })
            
            // Устанавливаем контекст перехода
            setTransitionContext({
              from: 'home',
              to: 'projects',
              method: 'swipeLeft',
              velocity,
              timestamp: Date.now()
            })
            
            // Momentum анимация выхода
            contentElement.style.transform = `translateX(-${window.innerWidth}px)`
            contentElement.style.opacity = '0'
            contentElement.style.filter = 'blur(1px)'
            setTimeout(() => handleNavigateToProjects(), 150)
            
          } else if (diffX < 0 && location.pathname === '/home') {
            // Свайп вправо на /home → запуск игры
            logger.touch('Swipe right: home->game', { 
              velocity, 
              distance: Math.abs(currentX),
              swipeTime 
            })
            
            // Устанавливаем контекст перехода
            setTransitionContext({
              from: 'home',
              to: 'game',
              method: 'swipeRight',
              velocity,
              timestamp: Date.now()
            })
            
            // Momentum анимация выхода
            contentElement.style.transform = `translateX(${window.innerWidth}px)`
            contentElement.style.opacity = '0'
            contentElement.style.filter = 'blur(1px)'
            setTimeout(() => handleNavigateToGame(), 150)
            
          } else if (diffX < 0 && location.pathname === '/projects') {
            // Свайп вправо на /projects → переход на /home
            logger.touch('Swipe right: projects->home', { 
              velocity, 
              distance: Math.abs(currentX),
              swipeTime 
            })
            
            // Устанавливаем контекст перехода
            setTransitionContext({
              from: 'projects',
              to: 'home',
              method: 'swipeRight',
              velocity,
              timestamp: Date.now()
            })
            
            // Momentum анимация выхода
            contentElement.style.transform = `translateX(${window.innerWidth}px)`
            contentElement.style.opacity = '0'
            contentElement.style.filter = 'blur(1px)'
            setTimeout(() => handleNavigateToHome(), 150)
            
          } else {
            // Возвращаем на место
            logger.touch('Swipe cancelled - returning to position')
            contentElement.style.transform = 'translateX(0)'
            contentElement.style.opacity = '1'
            contentElement.style.filter = 'none'
          }
        } else {
          // Возвращаем на место
          logger.touch('Swipe too weak - returning to position', { velocity, distance: Math.abs(currentX) })
          contentElement.style.transform = 'translateX(0)'
          contentElement.style.opacity = '1'
          contentElement.style.filter = 'none'
        }
      }
      
      startX = 0
      startY = 0
      isDragging = false
      currentX = 0
    }

    // Добавляем обработчики только на мобильных
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    
    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true })
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd, { passive: true })
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [location.pathname])

  // Сбрасываем трансформацию при смене страницы
  useEffect(() => {
    const contentElement = location.pathname === '/home' 
      ? document.querySelector('#hero')
      : document.querySelector('section')
    
    if (contentElement) {
      contentElement.style.transform = 'translateX(0)'
      contentElement.style.opacity = '1'
      contentElement.style.filter = 'none'
      contentElement.style.transition = ''
      
      logger.animation('Content reset on page change', { 
        page: location.pathname,
        element: contentElement.tagName 
      })
    }
  }, [location.pathname])

  const handleNavigateToProjects = () => {
    logger.navigation('Navigate to projects initiated', { trigger: 'mobile-swipe' })
    
    // Контекстная анимация частиц вместо простого ускорения
    // setParticleSpeed будет вызван автоматически в GlobalParticleManager
    
    setTimeout(() => {
      sessionStorage.setItem('coming-from-home', 'true')
      logger.navigation('Navigating to projects page')
      navigate('/projects')
    }, 200)
  }

  const handleNavigateToHome = () => {
    logger.navigation('Navigate to home initiated', { trigger: 'mobile-swipe' })
    
    // Контекстная анимация частиц вместо простого ускорения
    // setParticleSpeed будет вызван автоматически в GlobalParticleManager
    
    setTimeout(() => {
      sessionStorage.setItem('returning-to-home', 'true')
      logger.navigation('Navigating to home page')
      navigate('/home')
    }, 200)
  }

  const handleNavigateToGame = () => {
    logger.navigation('Navigate to game initiated', { trigger: 'mobile-swipe' })
    
    // Специальная анимация частиц для игры
    setTransitionContext({
      from: 'home',
      to: 'game',
      method: 'swipeRight',
      timestamp: Date.now()
    })
    
    setTimeout(() => {
      sessionStorage.setItem('entering-game', 'true')
      logger.navigation('Launching Space Invaders game')
      navigate('/game')
    }, 200)
  }

  const getSwipeHintText = () => {
    if (location.pathname === '/home') {
      return 'Проекты →'
    } else if (location.pathname === '/projects') {
      return '← Главная'
    }
    return ''
  }

  // Показываем только на /home и /projects (не показываем в игре)
  if (location.pathname !== '/home' && location.pathname !== '/projects') {
    return null
  }

  return (
    <SwipeHint>
      {getSwipeHintText()}
    </SwipeHint>
  )
}

export default MobileNavigation 