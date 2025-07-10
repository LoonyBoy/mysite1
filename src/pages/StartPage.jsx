import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { gsap } from 'gsap'
import CustomCursor from '../components/CustomCursor'
import { useParticles } from '../components/GlobalParticleManager'
import useParticleControl from '../hooks/useParticleControl'

const StartPageContainer = styled.div`
  width: 100vw;
  height: 100vh;
  height: 100dvh; /* Для новых iPhone */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: transparent; /* Убираем черный фон, чтобы видеть частицы */
  position: fixed; /* Фиксируем страницу */
  top: 0;
  left: 0;
  overflow: hidden;
  z-index: 5; /* Контейнер поверх частиц */
  
  /* Контент учитывает safe area на iOS */
  @supports (padding: max(0px)) {
    padding-top: max(20px, env(safe-area-inset-top));
    padding-bottom: max(20px, env(safe-area-inset-bottom));
    padding-left: max(20px, env(safe-area-inset-left));
    padding-right: max(20px, env(safe-area-inset-right));
  }
  
  @media (max-width: 768px) {
    /* Дополнительные отступы для мобильных */
    padding: 2rem 1rem;
    
    @supports (padding: max(0px)) {
      padding-top: max(2rem, env(safe-area-inset-top) + 1rem);
      padding-bottom: max(2rem, env(safe-area-inset-bottom) + 1rem);
      padding-left: max(1rem, env(safe-area-inset-left) + 1rem);
      padding-right: max(1rem, env(safe-area-inset-right) + 1rem);
    }
  }
`

const MainTitle = styled.h1`
  font-size: clamp(4rem, 12vw, 12rem);
  font-weight: 400;
  line-height: 0.8;
  letter-spacing: -0.05em;
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 10; /* Значительно поверх частиц */
  color: var(--white);
  opacity: 0; /* Скрыт до анимации появления */
  text-shadow: 
    0 0 10px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(0, 0, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.8);
  
  .char {
    display: inline-block;
    opacity: 0;
    transform: translateY(100px) rotateX(90deg);
    position: relative;
  }
  
  /* Глитч эффект */
  &.glitch-active {
    animation: glitch-main 0.3s ease-in-out infinite alternate;
    
    .char {
      animation: glitch-char 0.1s ease-in-out infinite alternate;
    }
    
    /* Псевдоэлементы для цветовых искажений */
    &::before,
    &::after {
      content: attr(data-text);
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    
    &::before {
      color: #ff0040;
      animation: glitch-red 0.15s ease-in-out infinite alternate;
      clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
    }
    
    &::after {
      color: #00ffff;
      animation: glitch-blue 0.2s ease-in-out infinite alternate;
      clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
    }
  }
  
  @keyframes glitch-main {
    0% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
    100% { transform: translate(0); }
  }
  
  @keyframes glitch-char {
    0% { transform: translateY(0); }
    25% { transform: translateY(-1px); }
    50% { transform: translateY(1px); }
    75% { transform: translateY(-0.5px); }
    100% { transform: translateY(0); }
  }
  
  @keyframes glitch-red {
    0% { transform: translate(0); }
    33% { transform: translate(-2px, 1px); }
    66% { transform: translate(2px, -1px); }
    100% { transform: translate(0); }
  }
  
  @keyframes glitch-blue {
    0% { transform: translate(0); }
    33% { transform: translate(2px, -1px); }
    66% { transform: translate(-2px, 1px); }
    100% { transform: translate(0); }
  }
`

const Subtitle = styled.p`
  font-size: clamp(1.2rem, 3vw, 2rem);
  font-weight: 300;
  color: var(--primary-red);
  text-align: center;
  margin-bottom: 4rem;
  opacity: 0;
  transform: translateY(30px);
  position: relative;
  z-index: 10; /* Значительно поверх частиц */
  text-shadow: 
    0 0 10px rgba(0, 0, 0, 0.7),
    0 0 20px rgba(0, 0, 0, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.9);
`

const EnterButton = styled.button`
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
  opacity: 0;
  transform: translateY(30px);
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
  
  @media (max-width: 768px) {
    padding: 1.2rem 2rem;
    font-size: 1rem;
    min-height: 48px;
    min-width: 200px;
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
    
    &::before {
      animation: cyberpunk-scan 1s infinite;
    }
    
    &::after {
      animation: pixel-flicker 0.1s infinite alternate;
      opacity: 1;
    }
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
`

const BackgroundText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 25vw;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.02);
  z-index: 0; /* Между частицами и основным контентом */
  user-select: none;
  pointer-events: none;
`

const StartPage = () => {
  const navigate = useNavigate()
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const buttonRef = useRef(null)
  const backgroundRef = useRef(null)
  const { currentPage, camera } = useParticles()
  const glitchIntervalRef = useRef(null)
  
  // Подключаем интерактивное управление частицами только на стартовой странице
  const { resetRotation } = useParticleControl(
    camera, 
    currentPage === 'start', 
    { wheel: 0.002, touch: 0.005 }
  )

  useEffect(() => {
    // Отключаем скролл на стартовой странице
    document.body.style.overflow = 'hidden'

    const tl = gsap.timeline()
    
    // Анимация фонового текста (скрытая, начинается сразу)
    tl.from(backgroundRef.current, {
      scale: 0,
      rotation: 180,
      duration: 2,
      ease: "power3.out"
    })

    // Глитч-появление заголовка loony_boss
    const chars = titleRef.current.querySelectorAll('.char')
    
    // Сначала делаем заголовок видимым с глитч-эффектом
    tl.set(titleRef.current, { 
      opacity: 1,
      onComplete: () => {
        // Запускаем интенсивный глитч при появлении
        startAppearanceGlitch()
      }
    }, 0.5)
    
    // Анимация букв с глитч-эффектом появления
    .to(chars, {
      opacity: 1,
      y: 0,
      rotationX: 0,
      duration: 1.2,
      stagger: 0.08,
      ease: "power2.out",
      onComplete: () => {
        // После появления запускаем обычные глитчи
        setTimeout(() => {
          startGlitchEffect()
        }, 500)
      }
    }, 0.7)

    // Анимация подзаголовка и кнопки через 2 секунды после заголовка
    .to([subtitleRef.current, buttonRef.current], {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.3,
      ease: "power3.out"
    }, "+=2") // Задержка 2 секунды

    // Включаем скролл обратно при размонтировании
    return () => {
      document.body.style.overflow = 'auto'
      // Очищаем интервал глитча
      if (glitchIntervalRef.current) {
        clearInterval(glitchIntervalRef.current)
      }
    }

  }, [])



  // Функция для интенсивного глитч-эффекта при появлении
  const startAppearanceGlitch = () => {
    const titleElement = titleRef.current
    if (!titleElement) return

    // Устанавливаем data-text атрибут для псевдоэлементов
    titleElement.setAttribute('data-text', 'loony_boss')

    // Интенсивный глитч при появлении - несколько быстрых вспышек
    let glitchCount = 0
    const maxGlitches = 8
    
    const intensiveGlitch = () => {
      if (glitchCount >= maxGlitches) return
      
      titleElement.classList.add('glitch-active')
      
      // Короткие быстрые глитчи
      const glitchDuration = Math.random() * 150 + 50
      setTimeout(() => {
        titleElement.classList.remove('glitch-active')
        glitchCount++
        
        // Следующий глитч через короткое время
        if (glitchCount < maxGlitches) {
          setTimeout(intensiveGlitch, Math.random() * 200 + 100)
        }
      }, glitchDuration)
    }
    
    // Запускаем интенсивный глитч
    intensiveGlitch()
  }

  // Функция для обычных глитч-эффектов
  const startGlitchEffect = () => {
    const titleElement = titleRef.current
    if (!titleElement) return

    // Функция для случайного глитча
    const randomGlitch = () => {
      // Добавляем класс глитча
      titleElement.classList.add('glitch-active')
      
      // Убираем глитч через случайное время (100-500мс)
      const glitchDuration = Math.random() * 400 + 100
      setTimeout(() => {
        titleElement.classList.remove('glitch-active')
      }, glitchDuration)
    }

    // Первый обычный глитч через небольшую паузу
    setTimeout(() => {
      randomGlitch()
      
      // Затем случайные глитчи каждые 3-8 секунд
      glitchIntervalRef.current = setInterval(() => {
        // Случайность появления глитча (30% вероятность)
        if (Math.random() < 0.3) {
          randomGlitch()
        }
      }, Math.random() * 5000 + 3000) // 3-8 секунд
    }, 500)
  }

  const handleEnter = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        // Просто переходим на домашнюю страницу
        // GlobalParticleManager автоматически запустит анимацию частиц
        navigate('/home')
      }
    })

    // Анимируем исчезновение элементов интерфейса
    tl.to([titleRef.current, subtitleRef.current, buttonRef.current], {
      opacity: 0,
      y: -50,
      duration: 0.8,
      stagger: 0.1
    })
    
    .to(backgroundRef.current, {
      scale: 10,
      opacity: 0,
      duration: 1,
      ease: "power2.in"
    }, "-=0.5")
  }

  // Разбиваем текст на символы для анимации
  const splitText = (text) => {
    return text.split('').map((char, index) => (
      <span key={index} className="char">
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))
  }

  return (
    <StartPageContainer>
      <CustomCursor />
      <BackgroundText ref={backgroundRef}>CODE</BackgroundText>
      
      <MainTitle ref={titleRef}>
        {splitText('loony_boss')}
      </MainTitle>
      
      <Subtitle ref={subtitleRef}>
        Web Developer & Digital Creator
      </Subtitle>
      
      <EnterButton 
        ref={buttonRef} 
        onClick={handleEnter}
        data-hover
      >
        Enter Portfolio
      </EnterButton>
    </StartPageContainer>
  )
}

export default StartPage 