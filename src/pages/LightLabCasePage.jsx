import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useNavigate } from 'react-router-dom'
import { useParticles } from '../components/GlobalParticleManager'
import CustomCursor from '../components/CustomCursor'

gsap.registerPlugin(ScrollTrigger)

const CaseContainer = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: transparent;
  position: relative;
  width: 100%;
  overflow-x: hidden;
  z-index: 0;
  color: #000000;
  
  @media (max-width: 768px) {
    min-height: 400vh;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
    height: auto;
  }
`

const HeroSection = styled.section`
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    padding: 4rem 1rem;
    height: 100svh;
    min-height: 100svh;
    position: static;
  }
`

const CaseTitle = styled.h1`
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 2rem;
  color: #000000;
  text-align: center;
  white-space: nowrap;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.3s ease-out;
  
  @media (max-width: 768px) {
    font-size: clamp(2rem, 6vw, 3rem);
    white-space: normal;
    text-align: center;
    padding: 0 1rem;
    line-height: 1.2;
    width: 90%;
    pointer-events: none;
    user-select: none;
    will-change: opacity;
    transition: none;
  }
`

const ContentSection = styled.section`
  min-height: 100vh;
  padding: 4rem 2rem;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
    min-height: 200vh;
  }
`

const Description = styled.div`
  font-family: 'Andale Mono', 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 1.1rem;
  line-height: 1.7;
  color: #1a1a1a;
  margin-bottom: 3rem;
  background: rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 2.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  h3 {
    font-family: 'Andale Mono', 'Monaco', 'Consolas', 'Courier New', monospace;
    font-size: 1.4rem;
    font-weight: 600;
    margin: 2rem 0 1.2rem 0;
    color: #000000;
    border-bottom: 2px solid #D14836;
    padding-bottom: 0.5rem;
    display: inline-block;
  }
  
  p {
    margin-bottom: 1.5rem;
    font-weight: 400;
    
    &:last-child {
      margin-bottom: 0;
      font-weight: 500;
      color: #000000;
      border-left: 3px solid #D14836;
      padding-left: 1rem;
      font-style: italic;
    }
  }
  
  ol {
    margin: 1.5rem 0;
    padding-left: 0;
    counter-reset: custom-counter;
    list-style: none;
    
    li {
      margin-bottom: 1rem;
      font-weight: 400;
      padding-left: 2rem;
      position: relative;
      counter-increment: custom-counter;
      
      &::before {
        content: counter(custom-counter) ".";
        position: absolute;
        left: 0;
        top: 0;
        color: #D14836;
        font-weight: 600;
        font-size: 1rem;
      }
      
      &:hover {
        color: #000000;
      font-weight: 500;
      }
    }
  }
  
  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.6;
    padding: 2rem 1.5rem;
    margin: 0 -0.5rem 3rem -0.5rem;
    
    h3 {
      font-size: 1.2rem;
    }
    
    ol li {
      padding-left: 1.5rem;
    }
  }
`

const BackButton = styled.button`
  position: fixed;
  top: 2rem;
  left: 2rem;
  z-index: 1000;
  padding: 1rem 2rem;
  border: 2px solid #000000;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  color: #000000;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: all 0.3s ease, opacity 1s ease;
  cursor: none;
  outline: none;
  user-select: none;
  opacity: ${props => props.visible ? 1 : 0};
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
  
  &:hover {
    background: #000000;
    color: #ffffff;
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    top: 1rem;
    left: 1rem;
    padding: 0.8rem 1.5rem;
    font-size: 0.9rem;
    cursor: pointer;
    touch-action: manipulation;
  }
`

const LightLabCasePage = () => {
  const navigate = useNavigate()
  const titleRef = useRef(null)
  const backButtonRef = useRef(null)
  const { setTransitionContext } = useParticles()
  const [isBackButtonVisible, setIsBackButtonVisible] = React.useState(false)

  useEffect(() => {
    console.log('LightLabCasePage useEffect started')
    
    // Устанавливаем контекст для белого фона и серых частиц
    setTransitionContext('lightlab-case')
    console.log('Context set to lightlab-case')
    
    // Задержка появления кнопки 'Назад к проектам'
    const timer = setTimeout(() => {
      setIsBackButtonVisible(true)
      // Плавное появление кнопки с помощью gsap
      if (backButtonRef.current) {
        gsap.fromTo(backButtonRef.current, 
          { opacity: 0, y: -10 }, 
          { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
        );
      }
    }, 2500)
    
    let mobileScrollCleanup = null
    
    const screenWidth = window.innerWidth
    const isMobile = screenWidth <= 768
    console.log('Screen width:', screenWidth, 'isMobile:', isMobile, 'titleRef exists:', !!titleRef.current)
    
    if (!isMobile) {
      console.log('Setting up desktop ScrollTrigger')
      // Анимация исчезновения заголовка при скролле для десктопа
      ScrollTrigger.create({
        trigger: document.body,
        start: "top top", 
        end: "80vh top",
        scrub: 1, // Плавнее сглаживаем анимацию
        onUpdate: (self) => {
          const title = titleRef.current
          if (title) {
            // Простой расчет прозрачности
            const opacity = 1 - self.progress
            gsap.set(title, { opacity: Math.max(0, opacity) })
          }
        }
      })
      console.log('Desktop ScrollTrigger created')
    } else {
      console.log('Mobile detected - setting up mobile scroll handler')
      let isScrolling = false
      let scrollCount = 0
      
      const handleMobileScroll = () => {
        scrollCount++
        
        if (!isScrolling) {
          window.requestAnimationFrame(() => {
            const currentScroll = window.pageYOffset || window.scrollY || document.documentElement.scrollTop
            const title = titleRef.current
            
            // Логируем только если есть реальный скролл
            if (currentScroll > 0) {
              console.log('Mobile scroll detected:', {
                count: scrollCount,
                currentScroll,
                titleExists: !!title
              })
            }
            
            if (title) {
              const maxScroll = window.innerHeight * 0.3
              const opacity = Math.max(0, 1 - (currentScroll / maxScroll))
              
              if (currentScroll > 0) {
                console.log('Changing opacity:', {
                  currentScroll,
                  maxScroll,
                  opacity
                })
              }
              
              title.style.opacity = String(opacity)
            }
            
            isScrolling = false
          })
        }
        isScrolling = true
      }
      
      // Добавляем обработчики для разных событий скролла
      const events = ['scroll', 'touchmove', 'touchend']
      events.forEach(eventName => {
        window.addEventListener(eventName, handleMobileScroll, { passive: true })
        console.log(`Added ${eventName} event listener`)
      })
      
      // Тестируем сразу
      console.log('Testing scroll handler immediately...')
      handleMobileScroll()
      
      mobileScrollCleanup = () => {
        console.log('Removing mobile scroll handlers')
        events.forEach(eventName => {
          window.removeEventListener(eventName, handleMobileScroll)
        })
      }
    }
    
    return () => {
      console.log('LightLabCasePage cleanup started')
      ScrollTrigger.getAll().forEach(t => t.kill())
      if (mobileScrollCleanup) {
        mobileScrollCleanup()
      }
      clearTimeout(timer)
      console.log('LightLabCasePage cleanup completed')
    }
  }, [setTransitionContext])

  const handleBack = () => {
    // Устанавливаем контекст возврата
    setTransitionContext('lightlab-case->projects')
    navigate('/menu')
  }

  return (
    <CaseContainer>
      <CustomCursor color="#FFD700" />
      
      {isBackButtonVisible && (
        <BackButton 
          ref={backButtonRef}
          onClick={handleBack}
          visible={isBackButtonVisible}
        >
          ← Назад к проектам
        </BackButton>
      )}
      
      <HeroSection>
        <CaseTitle ref={titleRef}>
          Кейс фотостудии<br />LightLab Studio
        </CaseTitle>
      </HeroSection>
      
      <ContentSection>
        <Description>
          <p>
            Ребята из LightLab долгое время сидели на AppEvent - CRM для создания бронирований. 
            Большие минусы были, что эта CRM брала % комиссий за каждую транзакцию, совершаемую клиентами. 
            В первую очередь была нужда избавиться от платы комиссий за сервис и за подписку на сервис.
          </p>
          
          <p>
            Во вторую очередь - CRM жестко ограничена в дизайне, поэтому нельзя было создать свой, 
            кастомный сайт с календарем, личным кабинетом пользователя и много других функций.
          </p>
          
          <h3>Мое решение:</h3>
          
          <ol>
            <li>Сайт (веб-приложение на React) с оформлением в дизайне студии</li>
            <li>Кастомный календарь для бронирования</li>
            <li>Личный кабинет клиента</li>
            <li>Личный кабинет администратора</li>
            <li>Подключение к ЮКасса</li>
            <li>Скидки, промокоды</li>
          </ol>
          
          <p>
            Результат: полностью автономная система бронирования без комиссий, 
            с кастомным дизайном и полным контролем над функциональностью.
          </p>
        </Description>
      </ContentSection>
    </CaseContainer>
  )
}

export default LightLabCasePage