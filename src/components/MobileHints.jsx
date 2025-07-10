import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { gsap } from 'gsap'

const HintContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  border-radius: 25px;
  border: 1px solid var(--primary-red);
  color: var(--white);
  font-size: 0.9rem;
  text-align: center;
  z-index: 1000;
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
  pointer-events: none;
  
  @media (min-width: 769px) {
    display: none;
  }
  
  @media (max-width: 768px) {
    bottom: calc(1rem + env(safe-area-inset-bottom));
    left: 1rem;
    right: 1rem;
    transform: none;
    max-width: none;
  }
  
  .hint-icon {
    display: inline-block;
    margin-right: 0.5rem;
    animation: bounce 2s infinite;
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-5px);
    }
    60% {
      transform: translateY(-3px);
    }
  }
`

const MobileHints = () => {
  const [currentHint, setCurrentHint] = useState(0)
  const [showHints, setShowHints] = useState(false)

  const hints = [
    {
      icon: '👆',
      text: 'Проведите вверх для прокрутки'
    },
    {
      icon: '📱',
      text: 'Нажмите на меню в правом углу'
    },
    {
      icon: '✨',
      text: 'Нажмите на проекты для деталей'
    }
  ]

  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    const hasSeenHints = localStorage.getItem('portfolio-hints-seen')
    
    if (isMobile && !hasSeenHints) {
      setShowHints(true)
      
      // Показываем первую подсказку через 2 секунды
      const timer = setTimeout(() => {
        gsap.to('.hint-container', {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out"
        })
      }, 2000)

      // Циклически показываем подсказки
      const hintInterval = setInterval(() => {
        setCurrentHint(prev => {
          const next = (prev + 1) % hints.length
          if (next === 0) {
            // После последней подсказки скрываем их
            setTimeout(() => {
              gsap.to('.hint-container', {
                opacity: 0,
                y: 20,
                duration: 0.3,
                onComplete: () => {
                  setShowHints(false)
                  localStorage.setItem('portfolio-hints-seen', 'true')
                }
              })
            }, 3000)
            clearInterval(hintInterval)
          }
          return next
        })
      }, 4000)

      return () => {
        clearTimeout(timer)
        clearInterval(hintInterval)
      }
    }
  }, [])

  const handleTouchStart = () => {
    // Скрываем подсказки при первом взаимодействии
    gsap.to('.hint-container', {
      opacity: 0,
      y: 20,
      duration: 0.3,
      onComplete: () => {
        setShowHints(false)
        localStorage.setItem('portfolio-hints-seen', 'true')
      }
    })
  }

  useEffect(() => {
    if (showHints) {
      document.addEventListener('touchstart', handleTouchStart, { once: true })
      return () => {
        document.removeEventListener('touchstart', handleTouchStart)
      }
    }
  }, [showHints])

  if (!showHints) return null

  return (
    <HintContainer className="hint-container">
      <span className="hint-icon">{hints[currentHint].icon}</span>
      {hints[currentHint].text}
    </HintContainer>
  )
}

export default MobileHints 