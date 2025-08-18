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
  color: rgba(255, 255, 255, 0.4);
  font-size: 2.2rem;
  text-align: center;
  z-index: 99;
  display: none;
  font-weight: 300;
  
  @media (max-width: 768px) {
    display: block;
  }
`

const MobileNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setParticleSpeed, setTransitionContext } = useParticles()

  // Блокируем жестовую навигацию, если открыт модал/оверлей
  const isNavigationBlocked = () => {
    try {
      // На /menu полноэкранная карточка помечается классом .is-open
      if (location.pathname === '/menu' && document.querySelector('.is-open')) {
        return true
      }
      // Универсальный индикатор открытого оверлея/модалки
      if (document?.body?.style?.overflow === 'hidden') {
        return true
      }
    } catch {}
    return false
  }

  useEffect(() => {
    let startX = 0
    let startY = 0
    let startTime = 0
    let isDragging = false
    let currentX = 0
    let currentY = 0
    let swipeDirection = null // 'horizontal' или 'vertical'
    
    const getContentElement = () => {
      if (location.pathname === '/home') {
        return document.querySelector('#hero')
      } else if (location.pathname === '/menu') {
        return document.querySelector('section')
      }
      return null
    }
    
    const handleTouchStart = (e) => {
      // Если открыт модал/оверлей — пропускаем, даём внутреннему контенту обрабатывать жест
      if (isNavigationBlocked()) {
        logger.touch('Touch start ignored: navigation blocked by modal/overlay', { page: location.pathname })
        return
      }

      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      startTime = Date.now()
      isDragging = false
      currentX = 0
      currentY = 0
      swipeDirection = null
      
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
      // Если открыт модал/оверлей — не блокируем прокрутку, просто выходим
      if (isNavigationBlocked()) {
        return
      }

      if (!startX || !startY) return
      
      const touch = e.touches[0]
      const diffX = startX - touch.clientX
      const diffY = startY - touch.clientY
      
      // Определяем направление свайпа только один раз
      if (!swipeDirection && (Math.abs(diffX) > 20 || Math.abs(diffY) > 20)) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          swipeDirection = 'horizontal'
        } else {
          swipeDirection = 'vertical'
        }
        
        logger.touch(`${swipeDirection} swipe detected`, { 
          diffX, 
          diffY, 
          page: location.pathname 
        })
      }
      
      // Обрабатываем горизонтальные свайпы (только на /home для игры)
      if (swipeDirection === 'horizontal' && location.pathname === '/home') {
        if (!isDragging) {
          isDragging = true
        }
        
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
      
      // Обрабатываем вертикальные свайпы
      if (swipeDirection === 'vertical') {
        if (!isDragging) {
          isDragging = true
        }
        
        currentY = -diffY
        
        // Ограничиваем перемещение
        const maxOffset = window.innerHeight * 0.2
        currentY = Math.max(-maxOffset, Math.min(maxOffset, currentY))
        
        const contentElement = getContentElement()
        if (contentElement) {
          contentElement.style.transform = `translateY(${currentY}px)`
          
          // Добавляем эффект затухания при крайних позициях
          const opacity = 1 - Math.abs(currentY) / maxOffset * 0.2
          contentElement.style.opacity = opacity
          
          // Momentum эффект
          const velocity = Math.abs(diffY) / (Date.now() - startTime)
          if (velocity > 1.5) {
            contentElement.style.filter = `blur(${Math.min(velocity * 0.3, 1.5)}px)`
          } else {
            contentElement.style.filter = 'none'
          }
        }
        
        // Предотвращаем скролл при вертикальном свайпе
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e) => {
      // Если открыт модал/оверлей — ничего не делаем
      if (isNavigationBlocked()) {
        return
      }

      if (!startX || !startY) return
      
      const touch = e.changedTouches[0]
      const diffX = startX - touch.clientX
      const diffY = startY - touch.clientY
      const swipeTime = Date.now() - startTime
      
      const contentElement = getContentElement()
      
      if (contentElement) {
        contentElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        
        // Обрабатываем горизонтальные свайпы
        if (swipeDirection === 'horizontal') {
          const threshold = window.innerWidth * 0.15
          const velocity = Math.abs(diffX) / swipeTime
          
          if (isDragging && (Math.abs(currentX) > threshold || velocity > 0.5)) {
            if (diffX < 0 && location.pathname === '/home') {
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
              
            } else {
              // Возвращаем на место
              logger.touch('Horizontal swipe cancelled - returning to position')
              contentElement.style.transform = 'translateX(0) translateY(0)'
              contentElement.style.opacity = '1'
              contentElement.style.filter = 'none'
            }
          } else {
            // Возвращаем на место
            logger.touch('Horizontal swipe too weak - returning to position', { velocity, distance: Math.abs(currentX) })
            contentElement.style.transform = 'translateX(0) translateY(0)'
            contentElement.style.opacity = '1'
            contentElement.style.filter = 'none'
          }
        }
        
        // Обрабатываем вертикальные свайпы
        if (swipeDirection === 'vertical') {
          const threshold = window.innerHeight * 0.1
          const velocity = Math.abs(diffY) / swipeTime
          
          if (isDragging && (Math.abs(currentY) > threshold || velocity > 0.3)) {
            if (diffY > 0 && location.pathname === '/home') {
              // Свайп вниз на /home → переход на /menu
              logger.touch('Swipe down: home->menu', { 
                velocity, 
                distance: Math.abs(currentY),
                swipeTime 
              })
              
              // Устанавливаем контекст перехода
              setTransitionContext({
                from: 'home',
                to: 'menu',
                method: 'swipeDown',
                velocity,
                timestamp: Date.now()
              })
              
              // Momentum анимация выхода
              contentElement.style.transform = `translateY(${window.innerHeight}px)`
              contentElement.style.opacity = '0'
              contentElement.style.filter = 'blur(1px)'
              setTimeout(() => handleNavigateToMenu(), 150)
              
            } else if (diffY < 0 && location.pathname === '/menu') {
              // Свайп вверх на /menu → переход на /home
              logger.touch('Swipe up: menu->home', { 
                velocity, 
                distance: Math.abs(currentY),
                swipeTime 
              })
              
              // Устанавливаем контекст перехода
              setTransitionContext({
                from: 'menu',
                to: 'home',
                method: 'swipeUp',
                velocity,
                timestamp: Date.now()
              })
              
              // Momentum анимация выхода
              contentElement.style.transform = `translateY(-${window.innerHeight}px)`
              contentElement.style.opacity = '0'
              contentElement.style.filter = 'blur(1px)'
              setTimeout(() => handleNavigateToHome(), 150)
              
            } else {
              // Возвращаем на место
              logger.touch('Vertical swipe cancelled - returning to position')
              contentElement.style.transform = 'translateX(0) translateY(0)'
              contentElement.style.opacity = '1'
              contentElement.style.filter = 'none'
            }
          } else {
            // Возвращаем на место
            logger.touch('Vertical swipe too weak - returning to position', { velocity, distance: Math.abs(currentY) })
            contentElement.style.transform = 'translateX(0) translateY(0)'
            contentElement.style.opacity = '1'
            contentElement.style.filter = 'none'
          }
        }
      }
      
      startX = 0
      startY = 0
      isDragging = false
      currentX = 0
      currentY = 0
      swipeDirection = null
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
      contentElement.style.transform = 'translateX(0) translateY(0)'
      contentElement.style.opacity = '1'
      contentElement.style.filter = 'none'
      contentElement.style.transition = ''
      
      logger.animation('Content reset on page change', { 
        page: location.pathname,
        element: contentElement.tagName 
      })
    }
  }, [location.pathname])

  const handleNavigateToMenu = () => {
    logger.navigation('Navigate to menu initiated', { trigger: 'mobile-swipe' })
    
    // Контекстная анимация частиц вместо простого ускорения
    // setParticleSpeed будет вызван автоматически в GlobalParticleManager
    
    setTimeout(() => {
      sessionStorage.setItem('coming-from-home', 'true')
      logger.navigation('Navigating to menu page')
      navigate('/menu')
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
      return '⌄' // Более минималистичная стрелочка вниз
    } else if (location.pathname === '/menu') {
      return '' // Убираем текст "← Главная"
    }
    return ''
  }

  // Показываем только на /home и /menu (не показываем в игре)
  if (location.pathname !== '/home' && location.pathname !== '/menu') {
    return null
  }

  return (
    <SwipeHint>
      {getSwipeHintText()}
    </SwipeHint>
  )
}

export default MobileNavigation