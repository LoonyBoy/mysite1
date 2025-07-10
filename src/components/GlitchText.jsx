import React, { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import styled from 'styled-components'

const GlitchWrapper = styled.span`
  position: relative;
  display: inline-block;
  color: var(--primary-red);
  min-height: 1.2em;
  min-width: ${props => props.type === 'endings' ? '300px' : '200px'};
  
  @media (max-width: 768px) {
    min-width: ${props => props.type === 'endings' ? '250px' : '150px'};
    min-height: 1.5em;
  }
  
  .animated-text {
    position: relative;
    display: inline-block;
    will-change: transform, opacity;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    white-space: pre-wrap;
    
    /* Специальные стили для iOS Safari */
    @supports (-webkit-touch-callout: none) {
      -webkit-font-smoothing: antialiased;
      -webkit-backface-visibility: hidden;
      -webkit-perspective: 1000;
      -webkit-transform: translate3d(0, 0, 0);
      transform: translate3d(0, 0, 0);
    }
    
    /* Базовые стили без transitions - анимации управляются GSAP */
    .char, .pixel, .quantum-char {
      display: inline-block;
      will-change: transform, opacity;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      white-space: pre;
      
      /* Обеспечиваем правильное отображение пробелов */
      &:empty::after {
        content: '\00A0';
      }
    }
    
    /* Упрощенные анимации для мобильных Safari */
    &.matrix-rain {
      .char {
        animation: matrixDrop 0.5s ease-out;
        animation-fill-mode: both;
      }
    }
    
    &.digital-decay {
      .pixel {
        animation: pixelDissolve 0.5s ease-out;
        animation-fill-mode: both;
      }
    }
    
    &.holographic {
      animation: holoFlicker 0.5s ease-out;
      animation-fill-mode: both;
      
      &::before,
      &::after {
        content: attr(data-text);
        position: absolute;
        top: 0;
        left: 0;
        opacity: 0;
        pointer-events: none;
      }
      
      &::before {
        color: #00ffff;
        animation: holoShift1 0.5s ease-out;
      }
      
      &::after {
        color: #ff00ff;
        animation: holoShift2 0.5s ease-out;
      }
    }
    
    &.static-noise {
      animation: staticGlitch 0.5s ease-out;
      animation-fill-mode: both;
      
      &::before {
        content: attr(data-text);
        position: absolute;
        top: 0;
        left: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 1px,
          rgba(255, 255, 255, 0.03) 1px,
          rgba(255, 255, 255, 0.03) 2px
        );
        animation: staticLines 0.5s ease-out;
        pointer-events: none;
      }
    }
    
    &.neon-flash {
      animation: neonBurst 0.5s ease-out;
      animation-fill-mode: both;
      text-shadow: 0 0 3px var(--primary-red);
    }
    
    &.quantum-shake {
      .quantum-char {
        animation: quantumVibrate 0.5s ease-out;
        animation-fill-mode: both;
      }
    }
  }
  
  /* Упрощенные анимации для Safari */
  @keyframes matrixDrop {
    0% { 
      transform: translateY(-10px);
      opacity: 0;
      color: #00ff00;
    }
    50% { 
      color: #00ff00;
      opacity: 1;
    }
    100% { 
      transform: translateY(0);
      opacity: 1;
      color: var(--primary-red);
    }
  }
  
  @keyframes pixelDissolve {
    0% { 
      transform: scale(1);
      opacity: 1;
    }
    50% { 
      transform: scale(1.02);
      opacity: 0.7;
    }
    100% { 
      transform: scale(1);
      opacity: 1;
    }
  }
  
  @keyframes holoFlicker {
    0%, 100% { 
      opacity: 1;
      filter: hue-rotate(0deg);
    }
    50% { 
      opacity: 0.8;
      filter: hue-rotate(90deg);
    }
  }

  @keyframes holoShift1 {
    0%, 100% { 
      opacity: 0;
    }
    50% { 
      opacity: 0.2;
      transform: translateX(-0.5px);
    }
  }

  @keyframes holoShift2 {
    0%, 100% { 
      opacity: 0;
    }
    50% { 
      opacity: 0.2;
      transform: translateX(0.5px);
    }
  }

  @keyframes staticLines {
    0%, 100% { 
      opacity: 0;
    }
    50% { 
      opacity: 0.5;
    }
  }

  @keyframes staticGlitch {
    0%, 100% { 
      transform: translate(0);
    }
    25% { 
      transform: translate(-0.5px, 0);
    }
    75% { 
      transform: translate(0.5px, 0);
    }
  }

  @keyframes neonBurst {
    0% { 
      text-shadow: 0 0 3px var(--primary-red);
      transform: scale(1);
    }
    50% { 
      text-shadow: 
        0 0 5px var(--primary-red),
        0 0 10px var(--primary-red);
      transform: scale(1.02);
    }
    100% { 
      text-shadow: 0 0 3px var(--primary-red);
      transform: scale(1);
    }
  }
  
  @keyframes quantumVibrate {
    0%, 100% { 
      transform: translate(0, 0);
      opacity: 1;
    }
    25% { 
      transform: translate(-0.2px, -0.2px);
      opacity: 0.95;
    }
    50% { 
      transform: translate(0.2px, -0.2px);
      opacity: 0.9;
    }
    75% { 
      transform: translate(-0.2px, 0.2px);
      opacity: 0.95;
    }
  }
`

const GlitchText = ({ type = 'adjectives', delay = 0, syncId = null }) => {
  const wordsData = {
    adjectives: [
      { word: 'цифровые', animation: 'matrix-rain' },
      { word: 'крутые', animation: 'neon-flash' }, 
      { word: 'красивые', animation: 'holographic' }, 
      { word: 'быстрые', animation: 'static-noise' }, 
      { word: 'смелые', animation: 'neon-flash' }, 
      { word: 'эффективные', animation: 'quantum-shake' }, 
      { word: 'уникальные', animation: 'matrix-rain' }, 
      { word: 'продуманные', animation: 'digital-decay' }, 
      { word: 'стильные', animation: 'digital-decay' }, 
      { word: 'гибкие', animation: 'holographic' }, 
      { word: 'адаптивные', animation: 'static-noise' }, 
      { word: 'кастомные', animation: 'neon-flash' }, 
      { word: 'креативные', animation: 'quantum-shake' }
    ],
    endings: [
      { word: 'будущего', animation: 'neon-flash' },
      { word: ', которые работают', animation: 'matrix-rain' },
      { word: 'без шаблонов', animation: 'holographic' },
      { word: 'на заказ', animation: 'digital-decay' },
      { word: 'без воды и лишних слов', animation: 'static-noise' },
      { word: 'не как у всех', animation: 'quantum-shake' },
      { word: ', которые продают', animation: 'matrix-rain' },
      { word: 'с душой, но по ТЗ', animation: 'holographic' },
      { word: 'с пониманием бизнеса, а не ради картинок', animation: 'digital-decay' },
      { word: 'так, чтобы клиент сказал: "Вау!"', animation: 'neon-flash' }
    ],
    // Синхронные пары для одновременной смены
    syncPairs: [
      { 
        adjective: { word: 'цифровые', animation: 'matrix-rain' },
        ending: { word: 'будущего', animation: 'neon-flash' }
      },
      { 
        adjective: { word: 'крутые', animation: 'neon-flash' },
        ending: { word: 'которые работают', animation: 'matrix-rain' }
      },
      { 
        adjective: { word: 'красивые', animation: 'holographic' },
        ending: { word: 'без шаблонов', animation: 'holographic' }
      },
      { 
        adjective: { word: 'быстрые', animation: 'static-noise' },
        ending: { word: 'на заказ', animation: 'digital-decay' }
      },
      { 
        adjective: { word: 'смелые', animation: 'neon-flash' },
        ending: { word: 'без воды и лишних слов', animation: 'static-noise' }
      },
      { 
        adjective: { word: 'эффективные', animation: 'quantum-shake' },
        ending: { word: 'не как у всех', animation: 'quantum-shake' }
      },
      { 
        adjective: { word: 'уникальные', animation: 'matrix-rain' },
        ending: { word: 'которые продают', animation: 'matrix-rain' }
      },
      { 
        adjective: { word: 'продуманные', animation: 'digital-decay' },
        ending: { word: 'с душой, но по ТЗ', animation: 'holographic' }
      },
      { 
        adjective: { word: 'стильные', animation: 'digital-decay' },
        ending: { word: 'с пониманием бизнеса, а не ради картинок', animation: 'digital-decay' }
      },
      { 
        adjective: { word: 'креативные', animation: 'quantum-shake' },
        ending: { word: 'так, чтобы клиент сказал: "Вау!"', animation: 'neon-flash' }
      }
    ]
  }
  
  const wordsWithAnimations = wordsData[type] || wordsData.adjectives
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const textRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const timelineRef = useRef(null)
  const [hasStarted, setHasStarted] = useState(false)
  
  // Для синхронного режима
  const [syncIndex, setSyncIndex] = useState(0)
  
  // Получаем текущий элемент в зависимости от режима
  const getCurrentItem = () => {
    if (type === 'sync') {
      const pair = wordsData.syncPairs[syncIndex]
      return syncId === 'adjective' ? pair.adjective : pair.ending
    }
    return wordsWithAnimations[currentIndex]
  }
  
  const currentItem = getCurrentItem()
  
  // Определение мобильного устройства и iOS
  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth <= 768 || 'ontouchstart' in window
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                  /Safari/.test(navigator.userAgent) && /iPhone|iPad/.test(navigator.userAgent)
      
      setIsMobile(mobile)
      setIsIOS(ios)
      
      // Для iOS устанавливаем базовые стили для стабильности
      if (ios && textRef.current) {
        textRef.current.style.webkitFontSmoothing = 'antialiased'
        textRef.current.style.webkitBackfaceVisibility = 'hidden'
        textRef.current.style.webkitTransform = 'translate3d(0, 0, 0)'
      }
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  // Функция для рендера текста в зависимости от анимации
  const renderAnimatedText = () => {
    const { word, animation } = currentItem
    const baseClasses = `animated-text ${animation}`
    
    // Для iOS используем упрощенный рендеринг
    if (isIOS || isMobile) {
      return (
        <span className={baseClasses} data-text={word} ref={textRef}>
          {word}
        </span>
      )
    }
    
    // Для десктопа используем посимвольную анимацию
    switch (animation) {
      case 'matrix-rain':
      case 'digital-decay':
      case 'quantum-shake':
        return (
          <span className={baseClasses} data-text={word} ref={textRef}>
            {word.split('').map((char, index) => (
              <span 
                key={index} 
                className={animation === 'matrix-rain' ? 'char' : 
                          animation === 'digital-decay' ? 'pixel' : 'quantum-char'}
                style={{ 
                  animationDelay: `${index * 0.05}s`,
                  // Сохраняем пробелы
                  whiteSpace: char === ' ' ? 'pre' : 'normal'
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </span>
        )
      
      default:
        return (
          <span className={baseClasses} data-text={word} ref={textRef}>
            {word}
          </span>
        )
    }
  }
  
  // Анимация смены слов с оптимизацией для iOS Safari
  const animateWordChange = () => {
    if (!textRef.current) return
    
    setIsAnimating(true)
    
    // Для iOS Safari используем CSS transitions вместо GSAP
    if (isIOS) {
      // Проверяем существование элемента
      if (!textRef.current) {
        setIsAnimating(false)
        return
      }
      
      // Устанавливаем CSS transition
      textRef.current.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out'
      textRef.current.style.webkitTransition = 'opacity 0.5s ease-out, -webkit-transform 0.5s ease-out'
      
      // Анимация исчезновения
      textRef.current.style.opacity = '0'
      textRef.current.style.transform = 'translateY(-3px) scale(0.99)'
      textRef.current.style.webkitTransform = 'translateY(-3px) scale(0.99)'
      
      const fadeTimeout = setTimeout(() => {
        if (!textRef.current) return
        
        // Смена слова
        if (type === 'sync') {
          setSyncIndex((prevIndex) => (prevIndex + 1) % wordsData.syncPairs.length)
        } else {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % wordsWithAnimations.length)
        }
        
        // Подготовка к появлению
        textRef.current.style.transform = 'translateY(3px) scale(1.01)'
        textRef.current.style.webkitTransform = 'translateY(3px) scale(1.01)'
        
        const showTimeout = setTimeout(() => {
          if (!textRef.current) return
          
          // Анимация появления
          textRef.current.style.opacity = '1'
          textRef.current.style.transform = 'translateY(0) scale(1)'
          textRef.current.style.webkitTransform = 'translateY(0) scale(1)'
          
          const cleanupTimeout = setTimeout(() => {
            if (!textRef.current) return
            
            setIsAnimating(false)
            // Убираем inline стили после анимации
            textRef.current.style.transition = ''
            textRef.current.style.webkitTransition = ''
            textRef.current.style.transform = ''
            textRef.current.style.webkitTransform = ''
          }, 500)
          
          // Сохраняем timeout для очистки
          timelineRef.current = { kill: () => clearTimeout(cleanupTimeout) }
        }, 100)
        
        // Сохраняем timeout для очистки
        timelineRef.current = { kill: () => { clearTimeout(showTimeout); clearTimeout(cleanupTimeout) } }
      }, 500)
      
      // Сохраняем timeout для очистки
      timelineRef.current = { kill: () => { clearTimeout(fadeTimeout); clearTimeout(showTimeout); clearTimeout(cleanupTimeout) } }
      
      return
    }
    
    // Для других браузеров используем GSAP
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false)
      }
    })
    
    // Анимация исчезновения
    tl.to(textRef.current, {
      opacity: 0,
      y: -10,
      scale: 0.95,
      duration: isMobile ? 0.6 : 0.4,
      ease: "power2.out"
    })
    
    // Смена слова
    .call(() => {
      if (type === 'sync') {
        setSyncIndex((prevIndex) => (prevIndex + 1) % wordsData.syncPairs.length)
      } else {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % wordsWithAnimations.length)
      }
    })
    
    // Небольшая пауза
    .to({}, { duration: isMobile ? 0.2 : 0.1 })
    
    // Анимация появления
    .fromTo(textRef.current, 
      {
        opacity: 0,
        y: 10,
        scale: 1.05
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: isMobile ? 0.7 : 0.5,
        ease: "power2.out"
      }
    )
    
    timelineRef.current = tl
  }
  
  // Глобальное событие для синхронизации
  useEffect(() => {
    if (type === 'sync') {
      const handleSyncChange = () => {
        animateWordChange()
      }
      
      window.addEventListener('syncGlitchChange', handleSyncChange)
      return () => window.removeEventListener('syncGlitchChange', handleSyncChange)
    }
  }, [type])
  
  // Основной цикл смены слов
  useEffect(() => {
    // Инициализация первого слова с задержкой
    const initTimeout = setTimeout(() => {
      if (textRef.current) {
        gsap.set(textRef.current, { opacity: 1, y: 0, scale: 1 })
        setHasStarted(true)
      }
    }, delay)
    
    return () => clearTimeout(initTimeout)
  }, [delay])
  
  useEffect(() => {
    if (!hasStarted) return
    
    // Для синхронного режима только первый элемент (adjective) запускает таймер
    if (type === 'sync' && syncId !== 'adjective') {
      return
    }
    
    // Интервал смены слов
    const intervalTime = type === 'sync' ? 
      (isMobile ? 4000 : 3500) : // Синхронный режим
      type === 'endings' ? 
        (isMobile ? 4000 : 3500) : // Медленнее для длинных фраз
        (isMobile ? 3000 : 2500)   // Обычная скорость для прилагательных
    
    const interval = setInterval(() => {
      if (type === 'sync') {
        // Отправляем глобальное событие для синхронизации
        window.dispatchEvent(new CustomEvent('syncGlitchChange'))
      } else {
        animateWordChange()
      }
    }, intervalTime)
    
    return () => {
      clearInterval(interval)
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
    }
  }, [hasStarted, isMobile, wordsWithAnimations.length, type, syncId])
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
    }
  }, [])
  
  return (
    <GlitchWrapper type={type}>
      {renderAnimatedText()}
    </GlitchWrapper>
  )
}

export default GlitchText 