import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useNavigate } from 'react-router-dom'
import CustomCursor from '../components/CustomCursor'
import MobileHints from '../components/MobileHints'
import MobileNavigation from '../components/MobileNavigation'
import { useParticles } from '../components/GlobalParticleManager'
import RotatingText from '../components/RotatingText'
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
    -webkit-overflow-scrolling: touch;
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

  @media (max-width: 768px) {
    padding: 32px 16px;
    align-items: flex-start;
    text-align: left;
    height: 100svh;
    
    @supports (padding: max(0px)) {
      padding-top: max(32px, env(safe-area-inset-top) + 32px);
      padding-bottom: max(32px, env(safe-area-inset-bottom) + 32px);
      padding-left: max(16px, env(safe-area-inset-left) + 16px);
      padding-right: max(16px, env(safe-area-inset-right) + 16px);
    }
  }
`

const MainHeading = styled.h1`
  font-size: clamp(3rem, 8vw, 8rem);
  font-weight: 400;
  line-height: 0.8;
  letter-spacing: -0.02em;
  margin-bottom: 32px;
  opacity: 0;
  transform: translateY(100px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;

  .text-line {
    display: flex;
    align-items: baseline;
    gap: 16px;
    min-height: 1em;
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
`

const Description = styled.p`
  font-size: clamp(1rem, 2.5vw, 2rem);
  line-height: 1.5;
  max-width: 600px;
  margin-bottom: 24px;
  opacity: 0;
  transform: translateY(50px);
`

const NavigationEdge = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  width: 352px;
  height: 100vh;
  z-index: 5;
  cursor: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(to left, rgba(209, 72, 54, 0.15), transparent);
    backdrop-filter: blur(10px);
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`

const NavigationHint = styled.div`
  position: fixed;
  top: 50%;
  right: 80px;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  font-weight: 500;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 6;
  pointer-events: none;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  
  &.visible {
    opacity: 1;
    transform: translateY(-50%) translateX(-16px);
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`

const GameEdge = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 352px;
  height: 100vh;
  z-index: 5;
  cursor: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(to right, rgba(209, 72, 54, 0.15), transparent);
    backdrop-filter: blur(10px);
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`

const GameHint = styled.div`
  position: fixed;
  bottom: 50%;
  left: 80px;
  transform: translateY(50%);
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  font-weight: 500;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 6;
  pointer-events: none;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  
  &.visible {
    opacity: 1;
    transform: translateY(50%) translateX(16px);
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`

const HomePage = () => {
  const heroRef = useRef(null)
  const isTransitioningRef = useRef(false)
  const navigate = useNavigate()
  const { camera, setTransitionContext } = useParticles()
  
  // Подключаем интерактивное управление частицами
  const { resetRotation } = useParticleControl(camera, true, {
    wheel: 0.002,
    touch: 0.005
  })

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

  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    // (перенесено в отдельный эффект ниже)

    // Проверяем, возвращаемся ли мы с другой страницы
    const isReturning = sessionStorage.getItem('returning-to-home')
    
    if (isReturning) {
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
          }
        })
        
        tl.to(h1Element, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out"
        })
        .to(pElement, {
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
    } else {
      // Обычная анимация входа (первое посещение)
      const h1Element = heroRef.current?.querySelector('h1')
      const pElement = heroRef.current?.querySelector('p')
      
      if (h1Element && pElement) {
        const tl = gsap.timeline()
        
        tl.to(h1Element, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out"
        })
        .to(pElement, {
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

    // Обработка наведения на правый край (проекты)
    const navigationEdge = document.querySelector('.navigation-edge')
    const navigationHint = document.querySelector('.navigation-hint')
    
    // Обработка наведения на левый край (игра)
    const gameEdge = document.querySelector('.game-edge')
    const gameHint = document.querySelector('.game-hint')
    
    if (navigationEdge && navigationHint && !isMobile) {
      const handleMouseEnter = () => {
        navigationHint.classList.add('visible')
        document.body.style.cursor = 'none'
      }
      
      const handleMouseLeave = () => {
        navigationHint.classList.remove('visible')
        document.body.style.cursor = 'auto'
      }
      
      const handleClick = () => {
        // Анимация частиц при переходе - используем контекстную анимацию
        // setParticleSpeed теперь вызывается автоматически в GlobalParticleManager
        
        // Быстрое затухание
        const heroSection = heroRef.current
        gsap.to(heroSection, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
          onComplete: () => {
            // Устанавливаем флаг перехода на меню
            sessionStorage.setItem('coming-from-home', 'true')
            navigate('/menu')
          }
        })
        
        // Анимация затухания подсказки
        const hint = document.querySelector('.navigation-hint')
        if (hint) {
          gsap.to(hint, {
            opacity: 0,
            duration: 0.3
          })
        }
      }
      
      navigationEdge.addEventListener('mouseenter', handleMouseEnter)
      navigationEdge.addEventListener('mouseleave', handleMouseLeave)
      navigationEdge.addEventListener('click', handleClick)

      // cleanup для этих конкретных колбэков
      return () => {
        navigationEdge.removeEventListener('mouseenter', handleMouseEnter)
        navigationEdge.removeEventListener('mouseleave', handleMouseLeave)
        navigationEdge.removeEventListener('click', handleClick)
      }
    }
    
    if (gameEdge && gameHint && !isMobile) {
      const handleGameMouseEnter = () => {
        gameHint.classList.add('visible')
        document.body.style.cursor = 'none'
      }
      
      const handleGameMouseLeave = () => {
        gameHint.classList.remove('visible')
        document.body.style.cursor = 'auto'
      }
      
      gameEdge.addEventListener('mouseenter', handleGameMouseEnter)
      gameEdge.addEventListener('mouseleave', handleGameMouseLeave)
      gameEdge.addEventListener('click', handleGameClick)

      // cleanup для этих конкретных колбэков
      return () => {
        gameEdge.removeEventListener('mouseenter', handleGameMouseEnter)
        gameEdge.removeEventListener('mouseleave', handleGameMouseLeave)
        gameEdge.removeEventListener('click', handleGameClick)
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
      if (isTransitioningRef.current) return
      const deltaY = e.deltaY || 0
      if (deltaY <= 12) return
      isTransitioningRef.current = true
      if (typeof e.preventDefault === 'function') e.preventDefault()

      const heroSection = heroRef.current
      gsap.to(heroSection, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          sessionStorage.setItem('coming-from-home', 'true')
          navigate('/menu')
        }
      })
    }

    window.addEventListener('wheel', onWheelNavigateToMenu, { passive: false })
    return () => window.removeEventListener('wheel', onWheelNavigateToMenu)
  }, [navigate])

  return (
    <HomeContainer>
      <CustomCursor />
      
      {/* Удалён правый edge перехода в меню */}
      
      <GameEdge className="game-edge" role="button" aria-label="Запустить игру Space Invaders" />
      <GameHint className="game-hint">
        ← Space Invaders
      </GameHint>
      
      <HeroSection ref={heroRef} id="hero">
        <MainHeading>
          <div className="text-line">
            Создаю
          </div>
          <div className="text-line">
            <RotatingText 
              texts={[
                'цифровые',
                'крутые', 
                'красивые', 
                'быстрые', 
                'смелые', 
                'эффективные', 
                'уникальные', 
                'продуманные', 
                'стильные', 
                'креативные'
              ]}
              rotationInterval={3000}
              splitBy="characters"
              staggerDuration={0.03}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
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
                'без шаблонов',
                'на заказ',
                'без воды и лишних слов',
                'не как у всех',
                'которые продают',
                'с душой, но по ТЗ',
                'так, чтобы клиент сказал: "Вау!"'
              ]}
              rotationInterval={3000}
              splitBy="characters"
              staggerDuration={0.03}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
            />
          </div>
        </MainHeading>
        <Description>
          Веб-разработчик, специализирующийся на создании современных 
          интерактивных сайтов и приложений с фокусом на UX/UI и производительность.
        </Description>
      </HeroSection>
      
      <MobileHints />
      <MobileNavigation />
    </HomeContainer>
  )
}

export default HomePage