import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useNavigate } from 'react-router-dom'
import CustomCursor from '../components/CustomCursor'
import MobileHints from '../components/MobileHints'
import MobileNavigation from '../components/MobileNavigation'
import ProjectModal from '../components/ProjectModal'
import RotatingText from '../components/RotatingText'
import { useParticles } from '../components/GlobalParticleManager'
import useParticleControl from '../hooks/useParticleControl'

gsap.registerPlugin(ScrollTrigger)

const HomeContainer = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: transparent;
  position: relative;
  width: 100%;
  overflow-x: hidden;
  z-index: 1;
  
  @media (max-width: 768px) {
    overflow-y: auto;
    overflow-x: hidden; /* запрещаем горизонтальный скролл */
    -webkit-overflow-scrolling: touch;
    /* Полная блокировка горизонтального движения */
    touch-action: pan-y; /* только вертикальный скролл, убираем pinch-zoom */
    overscroll-behavior-x: none; /* отключаем bounce эффект по горизонтали */
    overscroll-behavior: contain; /* полное ограничение прокрутки */
    /* Дополнительные ограничения для WebKit */
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    /* Фиксируем ширину контейнера */
    max-width: 100vw;
    box-sizing: border-box;
    /* Предотвращаем любые transform эффекты */
    transform: none !important;
    transform-origin: 0 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    /* Жесткое позиционирование */
    position: relative;
    left: 0 !important;
    right: 0 !important;
  }
`

const HeroSection = styled.section`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding-left: 64px;
  text-align: left;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  transition: opacity 0.2s ease;

  @media (max-width: 768px) {
    padding: 32px 16px;
    align-items: flex-start;
    text-align: left;
    height: 100svh;
    /* Предотвращаем выход контента за границы экрана */
    max-width: 100vw;
    overflow-x: hidden;
    word-wrap: break-word;
    /* Дополнительная фиксация позиции */
    transform: none !important;
    left: 0 !important;
    right: 0 !important;
    position: relative;
    
    @supports (padding: max(0px)) {
      padding-top: max(32px, env(safe-area-inset-top) + 32px);
      padding-bottom: max(32px, env(safe-area-inset-bottom) + 32px);
      padding-left: max(16px, env(safe-area-inset-left) + 16px);
      padding-right: max(16px, env(safe-area-inset-right) + 16px);
    }
  }
`

const MainHeading = styled.h1`
  font-size: clamp(2.5rem, 5.5vw, 4.8rem);
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.02em;
  margin-bottom: 32px;
  opacity: 0;
  transform: translateY(100px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;

  .text-line {
    display: flex;
    align-items: center; /* avoid baseline shifts during transforms */
    gap: 8px; /* unified 8px rule */
    min-height: 1em;
    overflow: visible;
    /* Убеждаемся что контейнер не ограничивает ширину RotatingText */
    flex-shrink: 0;
    
    &:last-child {
      min-height: 2em;
      align-items: flex-start;
      flex-wrap: nowrap;
    }
  }

  .highlight {
    color: var(--primary-red);
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      width: 0;
      height: 4px;
      background: var(--primary-red);
      transition: width 1s ease;
    }
  }

  @media (max-width: 768px) {
    gap: 8px;
    line-height: 1;
    margin-bottom: 24px;
    
    .text-line {
      gap: 8px; /* keep 8px spacing on mobile */
      min-height: 1em;
      overflow: visible;
      /* Remove conflicting layout rules that interfere with animations */
      
      &:last-child {
        min-height: 2em; /* match desktop to avoid extra vertical space */
        align-items: flex-start;
        /* Allow natural text flow for long content */
        white-space: normal;
        flex-wrap: wrap;
      }
    }
  }
`

const DescriptionContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 48px;
  max-width: 100%;
  margin-bottom: 24px;
  opacity: 0;
  transform: translateY(50px);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
  }
`

const Description = styled.p`
  font-size: clamp(1rem, 2vw, 1.5rem);
  line-height: 1.5;
  max-width: 600px;
  margin: 0;
  flex: 1;
`

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  flex-shrink: 0;
  align-self: flex-start; /* anchor to top of description container */
  margin-top: 6px; /* поднял кнопки выше (было 6px) */

  @media (max-width: 768px) {
    margin-top: 0; /* avoid crowding on stacked mobile layout */
  }
`

// Unified action button style (matches StartPage EnterButton)
const ActionButtonBase = styled.button`
  padding: 1rem 3rem;
  border: 2px solid var(--primary-red);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  color: var(--primary-red);
  font-size: 1.2rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: all 0.3s ease;
  min-height: 44px;
  position: relative;
  z-index: 10;
  overflow: hidden;
  text-shadow:
    0 0 10px rgba(209, 72, 54, 0.5),
    0 0 20px rgba(209, 72, 54, 0.3);
  box-shadow:
    0 0 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  text-decoration: none;
  white-space: nowrap;

  /* Киберпанк пиксельное мерцание */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(0, 255, 255, 0.1),
      rgba(255, 0, 255, 0.1),
      transparent
    );
    animation: cyberpunk-scan 3s infinite;
    pointer-events: none;
  }

  /* Пиксельные глитчи */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 1px,
        rgba(209, 72, 54, 0.03) 1px,
        rgba(209, 72, 54, 0.03) 2px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 1px,
        rgba(0, 255, 255, 0.02) 1px,
        rgba(0, 255, 255, 0.02) 2px
      );
    animation: pixel-flicker 0.15s infinite alternate;
    pointer-events: none;
    opacity: 0.7;
  }

  &:hover {
    background: var(--primary-red);
    color: var(--black);
    transform: translateY(-2px);
    box-shadow:
      0 10px 30px rgba(209, 72, 54, 0.4),
      0 0 40px rgba(209, 72, 54, 0.3),
      0 0 60px rgba(0, 255, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    text-shadow:
      0 0 5px rgba(0, 0, 0, 0.8),
      0 0 10px rgba(0, 255, 255, 0.3);
    animation: cyberpunk-hover 0.5s ease-out;

    &::before { animation: cyberpunk-scan 1s infinite; }
    &::after { animation: pixel-flicker 0.1s infinite alternate; opacity: 1; }
  }

  &:active {
    transform: scale(0.98) translateY(-2px);
    animation: cyberpunk-glitch 0.2s ease-out;
  }

  /* Анимации */
  @keyframes cyberpunk-scan {
    0% {
      left: -100%;
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      left: 100%;
      opacity: 0;
    }
  }
  
  @keyframes pixel-flicker {
    0% {
      opacity: 0.7;
      transform: translate(0, 0);
    }
    25% {
      opacity: 0.8;
      transform: translate(0.5px, 0);
    }
    50% {
      opacity: 0.6;
      transform: translate(-0.5px, 0.5px);
    }
    75% {
      opacity: 0.9;
      transform: translate(0, -0.5px);
    }
    100% {
      opacity: 0.7;
      transform: translate(-0.5px, 0);
    }
  }
  
  @keyframes cyberpunk-hover {
    0% {
      box-shadow: 
        0 10px 30px rgba(209, 72, 54, 0.4),
        0 0 40px rgba(209, 72, 54, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
    50% {
      box-shadow: 
        0 15px 40px rgba(209, 72, 54, 0.6),
        0 0 60px rgba(209, 72, 54, 0.5),
        0 0 80px rgba(0, 255, 255, 0.3),
        0 0 100px rgba(255, 0, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }
    100% {
      box-shadow: 
        0 10px 30px rgba(209, 72, 54, 0.4),
        0 0 40px rgba(209, 72, 54, 0.3),
        0 0 60px rgba(0, 255, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
  }
  
  @keyframes cyberpunk-glitch {
    0% { transform: scale(0.98) translateY(-2px) translate(0, 0); }
    20% { transform: scale(0.98) translateY(-2px) translate(-1px, 1px); }
    40% { transform: scale(0.98) translateY(-2px) translate(1px, -1px); }
    60% { transform: scale(0.98) translateY(-2px) translate(-1px, -1px); }
    80% { transform: scale(0.98) translateY(-2px) translate(1px, 1px); }
    100% { transform: scale(0.98) translateY(-2px) translate(0, 0); }
  }

  @media (max-width: 768px) {
    padding: 1.2rem 2rem;
    font-size: 1rem;
    min-height: 48px;
    min-width: 200px;
  }
`

const CreateProjectButton = styled(ActionButtonBase)``
const LaunchEnginesButton = styled(ActionButtonBase).attrs({ as: 'a' })``

const HomePage = () => {
  const heroRef = useRef(null)
  const isTransitioningRef = useRef(false)
  const navigate = useNavigate()
  const { camera, setTransitionContext } = useParticles()
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isProjectModalAnimationReady, setIsProjectModalAnimationReady] = useState(false)
  
  // Детекция мобильного устройства для оптимизации анимаций
  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
  
  // Настройки анимации в зависимости от устройства
  const animationConfig = isMobile ? {
    // Более мягкие настройки для мобильных
    rotationInterval: 3500,
    staggerDuration: 0.01,
    transition: { type: "spring", damping: 40, stiffness: 260 },
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
    mode: "wait" // Ждем завершения анимации выхода
  } : {
    // Стандартные настройки для десктопа
    rotationInterval: 3000,
    staggerDuration: 0.02,
    transition: { type: "spring", damping: 35, stiffness: 300 },
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
    mode: "wait" // Ждем завершения анимации выхода
  }
  
  // Подключаем интерактивное управление частицами (отключаем touch на мобильных)
  const { resetRotation } = useParticleControl(camera, true, {
    wheel: 0.002,
    touch: isMobile ? 0 : 0.005 // отключаем touch управление на мобильных
  })

  // Применяем глобальные стили для предотвращения горизонтального скролла на мобильных
  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    if (isMobile) {
      const body = document.body
      const html = document.documentElement
      
      // Сохраняем оригинальные стили
      const originalBodyStyles = {
        overflowX: body.style.overflowX,
        touchAction: body.style.touchAction,
        overscrollBehaviorX: body.style.overscrollBehaviorX,
        maxWidth: body.style.maxWidth
      }
      
      const originalHtmlStyles = {
        overflowX: html.style.overflowX,
        touchAction: html.style.touchAction,
        overscrollBehaviorX: html.style.overscrollBehaviorX
      }
      
      // Применяем ограничения
      body.style.overflowX = 'hidden'
      body.style.touchAction = 'pan-y'
      body.style.overscrollBehaviorX = 'none'
      body.style.maxWidth = '100vw'
      
      html.style.overflowX = 'hidden'
      html.style.touchAction = 'pan-y'
      html.style.overscrollBehaviorX = 'none'
      
      // Cleanup функция
      return () => {
        body.style.overflowX = originalBodyStyles.overflowX
        body.style.touchAction = originalBodyStyles.touchAction
        body.style.overscrollBehaviorX = originalBodyStyles.overscrollBehaviorX
        body.style.maxWidth = originalBodyStyles.maxWidth
        
        html.style.overflowX = originalHtmlStyles.overflowX
        html.style.touchAction = originalHtmlStyles.touchAction
        html.style.overscrollBehaviorX = originalHtmlStyles.overscrollBehaviorX
      }
    }
  }, [])

  // Жесткая блокировка горизонтальных touch движений на мобильных
  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    if (!isMobile) return

    let startX = 0
    let startY = 0
    let isScrolling = false

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      isScrolling = false
    }

    const handleTouchMove = (e) => {
      if (!startX || !startY) return

      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      
      const diffX = Math.abs(currentX - startX)
      const diffY = Math.abs(currentY - startY)

      // Ждем достаточного движения перед определением направления
      const totalMovement = Math.sqrt(diffX * diffX + diffY * diffY)
      if (totalMovement < 15) return // минимальный порог движения

      // Определяем направление движения только один раз
      if (!isScrolling) {
        // Блокируем только если горизонтальное движение значительно больше вертикального
        if (diffX > diffY * 1.5 && diffX > 20) {
          // Явное горизонтальное движение - блокируем
          isScrolling = 'horizontal'
        } else {
          // Вертикальное или диагональное движение - разрешаем
          isScrolling = 'vertical'
        }
      }

      // Блокируем только четко горизонтальные движения
      if (isScrolling === 'horizontal') {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    const handleTouchEnd = () => {
      startX = 0
      startY = 0
      isScrolling = false
    }

    // Используем capture: true для перехвата событий раньше других обработчиков
    document.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true, capture: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart, { capture: true })
      document.removeEventListener('touchmove', handleTouchMove, { capture: true })
      document.removeEventListener('touchend', handleTouchEnd, { capture: true })
    }
  }, [])

  // Блокируем скролл body когда модальное окно открыто
  // Блокируем скролл body когда модальное окно открыто — более надёжный метод для мобильных
  // Используем position: fixed и сохраняем scrollY, чтобы избежать «прыжков» из-за изменения viewport
  const bodyLockRef = useRef({ scrollY: 0, prevStyles: {} })

  useEffect(() => {
    const lockBody = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0
      const body = document.body
      const html = document.documentElement
      
      // Сохраняем инлайн-стили, чтобы восстановить их позже
      bodyLockRef.current.prevStyles = {
        position: body.style.position || '',
        top: body.style.top || '',
        left: body.style.left || '',
        right: body.style.right || '',
        width: body.style.width || '',
        overflow: body.style.overflow || '',
        overscrollBehavior: body.style.overscrollBehavior || ''
      }
      bodyLockRef.current.scrollY = scrollY

      body.style.position = 'fixed'
      body.style.top = `-${scrollY}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'
      body.style.overflow = 'hidden'
      body.style.overscrollBehavior = 'none'
      
      // Дополнительные ограничения для мобильных устройств
      if (window.innerWidth <= 768) {
        body.style.touchAction = 'pan-y'
        body.style.overflowX = 'hidden'
        html.style.overflowX = 'hidden'
        html.style.touchAction = 'pan-y'
        html.style.overscrollBehavior = 'contain'
      }
    }

    const unlockBody = () => {
      const body = document.body
      const html = document.documentElement
      const { scrollY, prevStyles } = bodyLockRef.current

      // Восстанавливаем предыдущие инлайн-стили
      body.style.position = prevStyles.position
      body.style.top = prevStyles.top
      body.style.left = prevStyles.left
      body.style.right = prevStyles.right
      body.style.width = prevStyles.width
      body.style.overflow = prevStyles.overflow
      body.style.overscrollBehavior = prevStyles.overscrollBehavior

      // Очищаем дополнительные мобильные стили
      if (window.innerWidth <= 768) {
        body.style.touchAction = ''
        body.style.overflowX = ''
        html.style.overflowX = ''
        html.style.touchAction = ''
        html.style.overscrollBehavior = ''
      }

      // Восстанавливаем позицию прокрутки
      window.scrollTo(0, scrollY || 0)
    }

    if (isProjectModalOpen) {
      lockBody()
    } else {
      // Небольшая отложенная очистка чтобы избежать layout-thrashing если close вызывается сразу
      unlockBody()
    }

    return () => {
      // Cleanup на размонтировании
      if (isProjectModalOpen) {
        unlockBody()
      }
    }
  }, [isProjectModalOpen])

  // Обработчик перехода в игру
  const handleGameClick = () => {
    console.log('🏠 HomePage: Game click detected')
    
    // Устанавливаем контекст перехода
    setTransitionContext('home->game')
    console.log('🔄 HomePage: Transition context set to home->game')
    
    // Запускаем анимацию превращения курсора в корабль
    if (window.startShipAnimation) {
      console.log('🚀 HomePage: Starting cursor to ship animation')
      const animationData = window.startShipAnimation()
      console.log('📋 HomePage: Animation data received', animationData)
    } else {
      console.warn('⚠️ HomePage: startShipAnimation function not available')
    }
    
    // Анимация затухания контента (быстрее, чем анимация курсора)
    const heroSection = heroRef.current
    console.log('🌅 HomePage: Starting hero section fade out')
    gsap.to(heroSection, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => console.log('✅ HomePage: Hero section fade out complete')
    })
    
    // Анимация затухания подсказки
    const hint = document.querySelector('.game-hint')
    if (hint) {
      console.log('💡 HomePage: Starting hint fade out')
      gsap.to(hint, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => console.log('✅ HomePage: Hint fade out complete')
      })
    }
    
    // Переход на страницу игры с небольшой задержкой
    console.log('⏱️ HomePage: Scheduling navigation to /game in 200ms')
    setTimeout(() => {
      console.log('🎯 HomePage: Navigating to /game')
      navigate('/game')
    }, 200)
  }

  // Обработчик кнопки "Запустить двигатели!" - красивый переход с эффектами
  const handleEngineClick = (e) => {
    e.preventDefault()
    console.log('🚀 HomePage: Engine launch initiated!')
    
    const button = e.currentTarget
    
    // Устанавливаем контекст перехода
    setTransitionContext('home->game')
    
    // 1. Анимация кнопки - пульсация и свечение
    gsap.timeline()
      .to(button, {
        scale: 1.05,
        boxShadow: '0 0 30px rgba(209, 72, 54, 0.8), 0 0 60px rgba(209, 72, 54, 0.4)',
        duration: 0.2,
        ease: "power2.out"
      })
      .to(button, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.in"
      })
      .to(button, {
        scale: 1,
        duration: 0.1,
        ease: "power2.out"
      })
    
    // 2. Создаем эффект взрыва от кнопки
    const createExplosionEffect = () => {
      const buttonRect = button.getBoundingClientRect()
      const centerX = buttonRect.left + buttonRect.width / 2
      const centerY = buttonRect.top + buttonRect.height / 2
      
      // Создаем частицы взрыва
      for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div')
        particle.style.cssText = `
          position: fixed;
          width: 4px;
          height: 4px;
          background: var(--primary-red);
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          left: ${centerX}px;
          top: ${centerY}px;
        `
        document.body.appendChild(particle)
        
        const angle = (i / 12) * Math.PI * 2
        const distance = 100 + Math.random() * 50
        const endX = centerX + Math.cos(angle) * distance
        const endY = centerY + Math.sin(angle) * distance
        
        gsap.to(particle, {
          x: endX - centerX,
          y: endY - centerY,
          opacity: 0,
          scale: 0,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => particle.remove()
        })
      }
    }
    
    // 3. Эффект экрана с красной вспышкой
    const createScreenFlash = () => {
      const flash = document.createElement('div')
      flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(circle, rgba(209, 72, 54, 0.3) 0%, rgba(209, 72, 54, 0.1) 50%, transparent 100%);
        pointer-events: none;
        z-index: 9998;
        opacity: 0;
      `
      document.body.appendChild(flash)
      
      gsap.timeline()
        .to(flash, {
          opacity: 1,
          duration: 0.1,
          ease: "power2.out"
        })
        .to(flash, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          onComplete: () => flash.remove()
        })
    }
    
    // Запускаем эффекты с небольшой задержкой
    setTimeout(() => {
      createExplosionEffect()
      createScreenFlash()
    }, 300)
    
    // 4. Запускаем анимацию превращения курсора в корабль
    setTimeout(() => {
      if (window.startShipAnimation) {
        console.log('🚀 HomePage: Starting cursor to ship animation')
        const animationData = window.startShipAnimation()
        console.log('📋 HomePage: Animation data received', animationData)
      }
    }, 500)
    
    // 5. Анимация затухания контента
    setTimeout(() => {
      const heroSection = heroRef.current
      console.log('🌅 HomePage: Starting hero section fade out')
      gsap.to(heroSection, {
        opacity: 0,
        scale: 1.1,
        duration: 0.6,
        ease: "power2.out",
        onComplete: () => console.log('✅ HomePage: Hero section fade out complete')
      })
      
      // Анимация затухания подсказки
      const hint = document.querySelector('.game-hint')
      if (hint) {
        gsap.to(hint, {
          opacity: 0,
          duration: 0.3
        })
      }
    }, 600)
    
    // 6. Переход на страницу игры
    setTimeout(() => {
      console.log('🎯 HomePage: Navigating to /game')
      navigate('/game')
    }, 1200)
  }

  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    // (перенесено в отдельный эффект ниже)

    // Проверяем, возвращаемся ли мы с другой страницы
    const isReturning = sessionStorage.getItem('returning-to-home')
    const comingFromProjects = sessionStorage.getItem('coming-from-projects')
    
  if (isReturning && comingFromProjects) {
      // Анимация появления текста при возвращении с /projects
      const h1Element = heroRef.current?.querySelector('h1')
      const pElement = heroRef.current?.querySelector('p')
      
      if (h1Element && pElement) {
        gsap.set(h1Element, {
          opacity: 0,
          y: 30
        })
        gsap.set(pElement, {
          opacity: 0,
          y: 20
        })
        
        const tl = gsap.timeline({
          onComplete: () => {
            sessionStorage.removeItem('returning-to-home')
            sessionStorage.removeItem('coming-from-projects')
          }
        })
        
        tl.to(h1Element, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out"
        })
        .to(heroRef.current?.querySelector('.description-container'), {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out"
        }, "-=0.3")
        
        // Анимация подсветки
        const highlightElement = heroRef.current?.querySelector('.highlight::after')
        if (highlightElement) {
          tl.to(highlightElement, {
            width: '100%',
            duration: 0.8,
            ease: "power2.out"
          }, "-=0.2")
        }
      }
    } else if (isReturning) {
      // Возвращаемся НЕ со страницы projects (например, с /menu) – просто мгновенно показываем контент
      const h1Element = heroRef.current?.querySelector('h1')
      const descriptionContainer = heroRef.current?.querySelector('.description-container')
      if (h1Element) {
        gsap.set(h1Element, { opacity: 1, y: 0 })
      }
      if (descriptionContainer) {
        gsap.set(descriptionContainer, { opacity: 1, y: 0 })
      }
      sessionStorage.removeItem('returning-to-home')
    } else {
      // Обычная анимация входа (первое посещение)
      const h1Element = heroRef.current?.querySelector('h1')
      const descriptionContainer = heroRef.current?.querySelector('.description-container')
      
      if (h1Element && descriptionContainer) {
        const tl = gsap.timeline()
        
        tl.to(h1Element, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out"
        })
        .to(descriptionContainer, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out"
        }, "-=0.5")

        // Анимация подсветки
        const highlightElement = heroRef.current?.querySelector('.highlight::after')
        if (highlightElement) {
          tl.to(highlightElement, {
            width: '100%',
            duration: 1,
            ease: "power2.out"
          }, "-=0.3")
        }
      }
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [navigate])

  // Отдельный эффект: переход на /menu при скролле вниз (только десктоп)
  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    if (isMobile) return

    const onWheelNavigateToMenu = (e) => {
      console.log('🖱️ HomePage: Wheel event detected', { deltaY: e.deltaY, isTransitioning: isTransitioningRef.current, isModalOpen: isProjectModalOpen })
      
      if (isTransitioningRef.current || isProjectModalOpen) {
        console.log('⏸️ HomePage: Wheel navigation blocked (transitioning or modal open)')
        return
      }
      
      const deltaY = e.deltaY || 0
      if (deltaY <= 12) {
        console.log('⏸️ HomePage: Wheel navigation blocked (deltaY too small)', deltaY)
        return
      }
      
      console.log('🚀 HomePage: Starting wheel navigation to /menu')
      isTransitioningRef.current = true
      if (typeof e.preventDefault === 'function') e.preventDefault()

      const heroSection = heroRef.current
      gsap.to(heroSection, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          console.log('✅ HomePage: Hero fade complete, navigating to /menu')
          sessionStorage.setItem('coming-from-home', 'true')
          navigate('/menu')
        }
      })
    }

    window.addEventListener('wheel', onWheelNavigateToMenu, { passive: false })
    return () => window.removeEventListener('wheel', onWheelNavigateToMenu)
  }, [navigate, isProjectModalOpen])

  return (
    <HomeContainer>
      <CustomCursor />
      
      <HeroSection ref={heroRef} id="hero" style={{
        pointerEvents: isProjectModalOpen ? 'none' : 'auto'
      }}>
        <MainHeading>
          <div className="text-line">
            Создаю
          </div>
          <div className="text-line">
            <RotatingText 
              texts={[
                'цифровые',
                'крутые',
                'прибыльные',
                'адаптивные',
                'доступные',
                'комфортные',
                'уникальные',
                'понятные',
                'продуманные',
                'простые',
                'креативные'
              ]}
              rotationInterval={animationConfig.rotationInterval}
              splitBy="words"
              staggerDuration={animationConfig.staggerDuration}
              transition={animationConfig.transition}
              animatePresenceMode={animationConfig.mode}
              initial={animationConfig.initial}
              animate={animationConfig.animate}
              exit={animationConfig.exit}
            />
          </div>
          <div className="text-line">
            решения
          </div>
          <div className="text-line">
            <RotatingText 
              texts={[
                'будущего',
                'которые работают',
                'для роста бизнеса',
                'для всех устройств',
                'для всех',
                'приятные в пользовании',
                'под ваши потребности',
                'для любой аудитории',
                'до мелочей',
                'для сложных проблем',
                'которые выделяют вас'
              ]}
              rotationInterval={animationConfig.rotationInterval}
              splitBy="words"
              staggerDuration={animationConfig.staggerDuration}
              transition={animationConfig.transition}
              animatePresenceMode={animationConfig.mode}
              initial={animationConfig.initial}
              animate={animationConfig.animate}
              exit={animationConfig.exit}
            />
          </div>
        </MainHeading>
        <DescriptionContainer className="description-container">
          <Description>
            Помогаю бизнесу работать быстрее и прибыльнее: 
            сайты, чат-боты и автоматизации, созданные под ваши цели.
          </Description>
          <ButtonsContainer>
            <CreateProjectButton
              onClick={() => {
                setIsProjectModalOpen(true)
                setIsProjectModalAnimationReady(true)
              }}
              data-variant="primary"
            >
              Создать проект
            </CreateProjectButton>
            <LaunchEnginesButton href="/game" onClick={handleEngineClick} data-variant="primary">
              Запустить двигатели!
            </LaunchEnginesButton>
          </ButtonsContainer>
        </DescriptionContainer>
      </HeroSection>
      
      <ProjectModal 
        isOpen={isProjectModalOpen} 
        // trigger the internal entry animation slightly after mount to avoid animation races on mobile
        startAnimation={isProjectModalAnimationReady}
        onClose={() => {
          setIsProjectModalAnimationReady(false)
          setIsProjectModalOpen(false)
        }} 
      />
      
  {/* Hide mobile hints on mobile devices */}
  {!isMobile && <MobileHints />}
      <MobileNavigation />
    </HomeContainer>
  )
}

export default HomePage