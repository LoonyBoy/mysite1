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
  transition: opacity 0.2s ease;

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
  font-size: clamp(2.5rem, 6vw, 6rem);
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
  font-size: clamp(0.9rem, 2vw, 1.6rem);
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
`

const CreateProjectButton = styled.button`
  display: inline-grid;
  place-items: center;
  padding: 16px 32px;
  min-width: 200px;
  border: 2px solid var(--primary-red);
  border-bottom: 1px solid var(--primary-red);
  color: var(--primary-red);
  background: transparent;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  font-family: 'Unbounded', sans-serif;
  border-radius: 0;
  transition: background 0.18s ease, color 0.18s ease, transform 0.12s ease, box-shadow 0.2s ease;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: var(--primary-red);
    color: var(--black);
    transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(0,0,0,0.35);
    z-index: 1;
    position: relative;
  }

  @media (max-width: 768px) {
    padding: 12px 20px;
    min-width: 160px;
    font-size: 1rem;
  }
`

const LaunchEnginesButton = styled.a`
  display: inline-grid;
  place-items: center;
  padding: 16px 32px;
  min-width: 200px;
  border: 2px solid var(--primary-red);
  border-top: 1px solid var(--primary-red);
  color: var(--primary-red);
  background: transparent;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  border-radius: 0;
  transition: background 0.18s ease, color 0.18s ease, transform 0.12s ease, box-shadow 0.2s ease;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: var(--primary-red);
    color: var(--black);
    transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(0,0,0,0.35);
    z-index: 1;
    position: relative;
  }

  @media (max-width: 768px) {
    padding: 12px 20px;
    min-width: 160px;
    font-size: 1rem;
  }
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
  
  // Подключаем интерактивное управление частицами
  const { resetRotation } = useParticleControl(camera, true, {
    wheel: 0.002,
    touch: 0.005
  })

  // Блокируем скролл body когда модальное окно открыто
  // Блокируем скролл body когда модальное окно открыто — более надёжный метод для мобильных
  // Используем position: fixed и сохраняем scrollY, чтобы избежать «прыжков» из-за изменения viewport
  const bodyLockRef = useRef({ scrollY: 0, prevStyles: {} })

  useEffect(() => {
    const lockBody = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0
      const body = document.body
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
    }

    const unlockBody = () => {
      const body = document.body
      const { scrollY, prevStyles } = bodyLockRef.current

      // Восстанавливаем предыдущие инлайн-стили
      body.style.position = prevStyles.position
      body.style.top = prevStyles.top
      body.style.left = prevStyles.left
      body.style.right = prevStyles.right
      body.style.width = prevStyles.width
      body.style.overflow = prevStyles.overflow
      body.style.overscrollBehavior = prevStyles.overscrollBehavior

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
      // Просто убираем флаг, если возвращаемся с других страниц (например, с /menu)
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

    // Обработка наведения на правый край (проекты)
    const navigationEdge = document.querySelector('.navigation-edge')
    const navigationHint = document.querySelector('.navigation-hint')
    
    if (navigationEdge && navigationHint && !isMobile) {
      const handleMouseEnter = () => {
        navigationHint.classList.add('visible')
      }
      
      const handleMouseLeave = () => {
        navigationHint.classList.remove('visible')
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
    
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [navigate])

  // Отдельный эффект: переход на /menu при скролле вниз (только десктоп)
  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    if (isMobile) return

    const onWheelNavigateToMenu = (e) => {
      if (isTransitioningRef.current || isProjectModalOpen) return
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
  }, [navigate, isProjectModalOpen])

  return (
    <HomeContainer>
      <CustomCursor />
      
      {/* Удалён правый edge перехода в меню */}
      
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
                'персональные',
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
                'приятные в использовании',
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
            Веб-разработчик, специализирующийся на создании современных 
            интерактивных сайтов и приложений с фокусом на UX/UI и производительность.
          </Description>
          <ButtonsContainer>
            <CreateProjectButton 
              onClick={() => {
                // НИКАКИХ БЛЯДСКИХ ЗАДЕРЖЕК - ВСЁ СРАЗУ
                setIsProjectModalOpen(true)
                setIsProjectModalAnimationReady(true)
              }}
            >
              Создать проект
            </CreateProjectButton>
            <LaunchEnginesButton href="/game" onClick={handleEngineClick}>
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