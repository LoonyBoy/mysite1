import React, { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import styled from 'styled-components'
import { gsap } from 'gsap'
gsap.registerPlugin(ScrollTrigger, Flip)
import { useNavigate } from 'react-router-dom'
import { useParticles } from '../components/GlobalParticleManager'
import CustomCursor from '../components/CustomCursor'
import MobileNavigation from '../components/MobileNavigation'
import useParticleControl from '../hooks/useParticleControl'
import Dither from '../../dither.jsx'; // Adjusted to new file extension


const MenuContainer = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: transparent;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  overflow-x: hidden;
  z-index: 1;
  margin: 0;
  padding: 0;
  
  @media (max-width: 768px) {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
`

const Section = styled.section`
  padding: 0;
  max-width: none;
  margin: 0;
  position: relative;
  z-index: 2;
  background: transparent;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;

  @media (max-width: 768px) {
    padding: 0;
    height: 100vh;
  }
`

const SectionTitle = styled.h1`
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 400;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--white);
  opacity: 0;
  transform: translateY(50px);
  
  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`

const NavigationEdge = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 175px;
  height: 100vh;
  z-index: 5;
  cursor: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(to right, rgba(132, 0, 255, 0.15), transparent);
    backdrop-filter: blur(10px);
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`

const CloseButton = styled.button`
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1102; /* поверх модалки и dither */
  color: #fff;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.2);
  backdrop-filter: blur(6px);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease;

  &:hover {
    background: rgba(255,255,255,0.18);
  }

  &:active {
    transform: translateY(1px);
  }
`

const CardRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100vw;
  height: 100vh;
  margin: 0;
  gap: 0; /* избегаем тонкой линии между карточками при анимации */
  align-items: center;
  flex-wrap: nowrap;
  position: relative;
  z-index: 2; /* гарантируем, что карточки выше GlobalDither */

  @media (max-width: 1280px) and (min-width: 1025px) {
    flex-wrap: wrap;
    height: auto;
    min-height: 100vh;
  }
  
  @media (max-width: 768px) {
    flex-direction: row;
    flex-wrap: wrap;
    height: auto;
    min-height: 100vh;
  }
`

const Card = styled.div`
  position: relative;
  width: 25%;
  height: 100%;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  overflow: visible; /* чтобы hover-слои не обрезались */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0; /* Padding переносим в CardContent, чтобы dither не сдвигался */
  text-align: center;
  flex-direction: column;
  gap: 12px;
  
  &:hover {
    align-items: center;
    padding-top: 0;
  }
  
  &:last-child {
    border-right: none;
  }
  
  @media (max-width: 1280px) and (min-width: 1025px) {
    width: 50%;
    height: 50vh;
  }
  
  @media (max-width: 768px) {
    width: 50%;
    height: 50vh;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0 20px;
  }

  .profile-img {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: auto;
    object-fit: cover;
    display: block;
    z-index: 1;
    opacity: 0;
    transform: translateY(20px);
  }

  &.dimmed {
    opacity: 0.65;
    filter: saturate(0.8);
    transition: opacity 0.08s ease;
  }

  &.is-open {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    z-index: 1001; /* выше GlobalDither */
    border-right: none;
    padding: 0; /* Без padding на контейнере во время Flip */
    background: transparent; /* фон дает GlobalDither на полном экране */
    backdrop-filter: none;
    cursor: default;
  }
`

// Плейсхолдер, удерживающий место карточки в строке во время открытия модалки
const CardPlaceholder = styled.div`
  width: 25%;
  height: 100vh;
  border-right: none; /* убираем тонкую линию рядом с модалкой */
  flex: 0 0 auto;

  @media (max-width: 1280px) and (min-width: 1025px) {
    width: 50%;
    height: 50vh;
  }

  @media (max-width: 768px) {
    width: 50%;
    height: 50vh;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`

const GlobalDither = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1; /* позади карточек, перед фоном/частицами */
  pointer-events: none;
  opacity: 0;
  clip-path: inset(0 100% 100% 0 round 16px);
  will-change: clip-path, opacity;
  &.front {
    z-index: 900; /* поверх карточек, но ниже модалки */
  }
`;

const CardContent = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 0 20px; /* обычные внутренние отступы */

  ${Card}.is-open & {
    padding: 40px 24px; /* во фуллскрине отступы только на контенте */
  }
`

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  align-items: center;
  text-align: center;
  min-height: 1em;

  &::before {
    content: '';
    position: absolute;
    inset: -16px -24px;
    background: linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.6));
    filter: blur(10px);
    border-radius: 16px;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: -1;
  }

  ${Card}:hover &::before {
    opacity: 1;
  }
  ${Card}.force-hover &::before {
    opacity: 1;
  }
`

const CardTitle = styled.h3`
  font-size: clamp(32px, 4vw, 64px);
  font-weight: 400;
  color: white;
  margin: 0;
  transition: all 0.3s ease;
  line-height: 1.08;
  letter-spacing: -0.015em;
  
  ${Card}:hover & {
    color: white;
    /* убираем изменение размера на hover */
  }
  
  @media (max-width: 768px) {
    font-size: 40px;
  }
`

const ShortDescription = styled.p`
  display: none;
`

const HiddenDescription = styled.div`
  display: none;
`

const Arrow = styled.div`
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  color: white;
  transition: all 0.3s ease;
  opacity: 0.7;
  pointer-events: none;
  
  ${Card}:hover & {
    color: white;
    opacity: 1;
    /* убираем CSS transform, оставляем только GSAP анимации */
  }
  ${Card}.force-hover & {
    color: white;
    opacity: 1;
  }

  ${Card}.is-open & {
    display: none;
  }
`

const NavigationHint = styled.div`
  position: fixed;
  top: 50%;
  left: 5rem;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 6;
  pointer-events: none;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  
  &.visible {
    opacity: 1;
    transform: translateY(-50%) translateX(15px);
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`



// Более тёмные тона для dither-фона; для "Контакты" — тёмно-красный
const waveColors = [
  [0, 0, 0.35],      // тёмно-синий
  [0.3, 0, 0.3],     // тёмный пурпур
  [0, 0.3, 0],       // тёмно-зелёный
  [0.4, 0.05, 0.05], // тёмно-красный для "Контакты"
];
const menuItems = [
  {
    label: "Home",
    title: "Главная",
    description: "Вернуться на главную страницу",
    route: "/home",
    color: "#060010"
  },
  {
    label: "Projects",
    title: "Меню",
    description: "Мои работы и кейсы",
    route: "/menu",
    color: "#060010"
  },
  {
    label: "About",
    title: "Обо мне",
    description: "Информация о разработчике",
    route: "/about",
    color: "#060010"
  },
  {
    label: "Contact",
    title: "Контакты",
    description: "Связаться со мной",
    route: "/contact",
    color: "#060010"
  },
  {
    label: "Services",
    title: "Услуги",
    description: "Что я предлагаю",
    route: "/services",
    color: "#060010"
  },
  {
    label: "Blog",
    title: "Блог",
    description: "Статьи и заметки",
    route: "/blog",
    color: "#060010"
  }
]

const MenuPage = () => {
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const { camera, setParticleProps, setHoveredRect, setParticleSpeed } = useParticles()
  const isTransitioningRef = useRef(false)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [globalDitherColorIndex, setGlobalDitherColorIndex] = useState(0)
  const globalDitherRef = useRef(null)
  const hoverTimelinesRef = useRef([])
  const [openedIndex, setOpenedIndex] = useState(null)
  const cardRefs = useRef([])
  const mousePosRef = useRef({ x: 0, y: 0 })
  const hoverLockRef = useRef({}) // индекс → timestamp до которого игнорируем mouseleave
  const lastHoveredBeforeOpenRef = useRef(null)
  const isModalOpenRef = useRef(false)
  const cards = [
    { title: 'О себе' },
    { title: 'Проекты' },
    { title: 'Услуги' },
    { title: 'Контакты' }
  ]

  // Утилита: мгновенно останавливает анимации dither и возвращает слой к базовому состоянию
  const resetGlobalDither = (props = null) => {
    const gd = globalDitherRef.current
    if (!gd) return
    gsap.killTweensOf(gd)
    gd.classList.remove('front')
    if (props) gsap.set(gd, props)
  }

  const handleHover = (index, isHovering) => {
    // Игнорируем любые hover-изменения, пока открыта/закрывается модалка
    if (isModalOpenRef.current) return
    const cardElement = cardRefs.current[index]
    if (!cardElement) return

    // Защита от ложного mouseleave сразу после закрытия модалки
    if (!isHovering) {
      const until = hoverLockRef.current[index]
      if (until && performance.now() < until) {
        return
      }
    }

    const arrow = cardElement.querySelector(`.arrow-${index}`)
    
    // Единственный заголовок (позиция не меняется)
    const title = cardElement.querySelector(`.title-${index}`)

    // Стоп текущей таймлайн на этой карточке
    const tlPrev = hoverTimelinesRef.current[index]
    if (tlPrev) tlPrev.kill()
    gsap.killTweensOf([arrow, title])
    if (title) gsap.set(title, { x: 0, clearProps: 'transform' })
    gsap.set(arrow, { x: 0, y: 0, rotation: 0, opacity: 1, clearProps: 'transform' })

    setHoveredIndex(isHovering ? index : null);
    // Dim siblings for focus
    cardRefs.current.forEach((el, i) => {
      if (!el) return
      if (isHovering) {
        if (i !== index) el.classList.add('dimmed')
        else el.classList.remove('dimmed')
      } else {
        el.classList.remove('dimmed')
      }
    })

    // Затемнённые цвета частиц; для "Контакты" (index 3) — тёмно-красный
    const colors = ['#1a1a66', '#4d1a4d', '#1a4d1a', '#5a0f0f'];
    const defaultColor = '#8B2E23';

    if (isHovering) {
      setParticleProps(prev => ({ ...prev, color: colors[index] }));
      setGlobalDitherColorIndex(index)
    } else {
      setParticleProps(prev => ({ ...prev, color: defaultColor }));
      // на выходе не меняем цвет мгновенно, фейдим глобальный dither
    }

    if (index === 1 && isHovering) {
      setHoveredRect(cardElement.getBoundingClientRect());
    } else if (index === 1 && !isHovering) {
      setHoveredRect(null);
    }

    const buildClipFromRect = (rect) => {
      const viewport = document.documentElement
      const vw = viewport.clientWidth
      const vh = viewport.clientHeight
      const top = Math.max(0, Math.round(rect.top))
      const left = Math.max(0, Math.round(rect.left))
      const right = Math.max(0, Math.round(vw - rect.right))
      const bottom = Math.max(0, Math.round(vh - rect.bottom))
      return `inset(${top}px ${right}px ${bottom}px ${left}px round 16px)`
    }

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
    hoverTimelinesRef.current[index] = tl

    if (isHovering) {
      cardElement.classList.add('force-hover')
      const gd = globalDitherRef.current
      if (gd) {
        gsap.killTweensOf(gd)
        const clip = buildClipFromRect(cardElement.getBoundingClientRect())
        tl.to(gd, { opacity: 1, clipPath: clip, duration: 0.22 }, 0)
      }
      if (arrow) tl.to(arrow, { x: 10, rotation: 45, opacity: 0.8, duration: 0.25 }, 0)
      // Текст не трогаем — только стрелка и dither
      if (index === 0) {
        const profileImg = cardElement.querySelector('.profile-img')
        if (profileImg) tl.to(profileImg, { opacity: 1, y: 0, scale: 1.05, duration: 0.28 }, 0.05)
      }
    } else {
      cardElement.classList.remove('force-hover')
      const gd = globalDitherRef.current
      if (gd) {
        gsap.killTweensOf(gd)
        tl.to(gd, { opacity: 0, clipPath: 'inset(0 100% 100% 0 round 16px)', duration: 0.18, ease: 'power2.in' }, 0)
      }
      if (arrow) tl.to(arrow, { x: 0, rotation: 0, opacity: 1, duration: 0.25 }, 0)
      if (index === 0) {
        const profileImg = cardElement.querySelector('.profile-img')
        if (profileImg) tl.to(profileImg, { opacity: 0, y: 20, scale: 1, duration: 0.25 }, 0)
      }
    }
  }

  // Вспомогательный метод: строит clip-path для GlobalDither из прямоугольника элемента
  const computeClipFromElement = (element) => {
    if (!element) return 'inset(0 0 0 0)'
    const rect = element.getBoundingClientRect()
    const viewport = document.documentElement
    const vw = viewport.clientWidth
    const vh = viewport.clientHeight
    const top = Math.max(0, Math.round(rect.top))
    const left = Math.max(0, Math.round(rect.left))
    const right = Math.max(0, Math.round(vw - rect.right))
    const bottom = Math.max(0, Math.round(vh - rect.bottom))
    return `inset(${top}px ${right}px ${bottom}px ${left}px round 16px)`
  }

  const openCardFullscreen = (index) => {
    if (openedIndex !== null) return
    const el = cardRefs.current[index]
    if (!el) return
    lastHoveredBeforeOpenRef.current = index
    isModalOpenRef.current = true
    // Отключаем hover-анимации только на других карточках, текущую оставляем как есть
    try {
      hoverTimelinesRef.current.forEach((tl, i) => {
        if (i !== index && tl) tl.kill()
      })
    } catch {}
    // Снижаем активность частиц в фоне под модалкой для чистоты текста
    try { setParticleSpeed?.(0.4) } catch {}
    // Глобальный dither: раскрываем до фуллскриновского состояния
    const gd = globalDitherRef.current
    let ditherDuration = 0.6
    if (gd) {
      // Сбрасываем любые зависшие анимации dither, чтобы старт был чистым
      resetGlobalDither()
      // FLIP-анимация dither от размеров карточки до fullscreen — исключает резкий прыжок
      gd.classList.add('front')
      const rect = el.getBoundingClientRect()
      // Важно: у GlobalDither по стилям есть inset: 0; чтобы не было мгновенного фуллскрина, переопределяем right/bottom на auto
      gsap.set(gd, { opacity: 1, clipPath: 'none', position: 'fixed' })
      // Состояние «как карточка»
      gsap.set(gd, { top: rect.top, left: rect.left, right: 'auto', bottom: 'auto', width: rect.width, height: rect.height, borderRadius: 16 })
      const ditherState = Flip.getState(gd)
      // Состояние «fullscreen»
      gsap.set(gd, { top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', borderRadius: 0 })
      Flip.from(ditherState, { duration: ditherDuration, ease: 'power2.inOut', absolute: true, onComplete: () => gd.classList.remove('front') })
    }

    // Прячем соседние карточки с лёгкой задержкой, чтобы dither начал закрывать их первым
    cardRefs.current.forEach((card, i) => {
      if (!card) return
      if (i !== index) {
        gsap.to(card, { opacity: 0, duration: 0.25, delay: 0.12, ease: 'power2.out', pointerEvents: 'none' })
      }
    })
    const state = Flip.getState(el)
    el.classList.add('is-open')
    setOpenedIndex(index)
    // Никакого текста не осталось, поэтому Flip только для карточки
    Flip.from(state, {
      duration: 0.5,
      ease: 'power2.inOut',
      absolute: true,
      scale: false,
      nested: true,
      delay: 0.2
    })
  }

  const closeCardFullscreen = (index) => {
    const el = cardRefs.current[index]
    if (!el) return
    try { setParticleSpeed?.(1.0) } catch {}
    // Блокируем закрытие hover на короткое время после старта закрытия
    hoverLockRef.current[index] = performance.now() + 600
    const gd = globalDitherRef.current
    const state = Flip.getState(el)
    // Заголовок: при закрытии просто исчезает (fade-out), чтобы не "уезжать" вместе с Flip
    const titleEl = el.querySelector(`.title-${index}`)
    if (titleEl) {
      gsap.set(titleEl, { willChange: 'opacity' })
      gsap.to(titleEl, { opacity: 0, duration: 0.18, ease: 'power2.out' })
    }
    el.classList.remove('is-open')
    setOpenedIndex(null)
    Flip.from(state, {
      duration: 0.5,
      ease: 'power2.inOut',
      absolute: true,
      scale: false,
      nested: true,
      onComplete: () => {
        if (titleEl) {
          gsap.set(titleEl, { opacity: 1 })
        }
        if (gd) {
          // Плавно сжимаем dither обратно в область карточки
          const endClip = computeClipFromElement(el)
          // На момент завершения решаем: оставить dither для hover или скрыть полностью
          const { x, y } = mousePosRef.current
          const elAtPoint = document.elementFromPoint(x, y)
          const stillHover = !!(elAtPoint && el.contains(elAtPoint))
          const shouldHoverAfterClose = stillHover || lastHoveredBeforeOpenRef.current === index
          gsap.to(gd, {
            clipPath: endClip,
            duration: 0.35,
            ease: 'power2.inOut',
            onComplete: () => {
              if (shouldHoverAfterClose) {
                // Оставляем dither видимым и обрезанным по карточке, чтобы hover не схлопывался
                gsap.set(gd, { opacity: 1, clipPath: endClip })
              } else {
                gsap.set(gd, { opacity: 0, clipPath: 'inset(0 100% 100% 0 round 16px)' })
              }
              gd.classList.remove('front')
            }
          })
        }
        // Возвращаем видимость остальных карточек
        cardRefs.current.forEach((card) => {
          if (!card) return
          gsap.to(card, { opacity: 1, duration: 0.2, ease: 'power2.out', pointerEvents: 'auto' })
        })
        // После того как карточки снова кликабельны — активируем hover на карточке под курсором
        // Разрешаем обработку hover после закрытия
        isModalOpenRef.current = false
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const { x, y } = mousePosRef.current
            let targetIndex = -1
            for (let i = 0; i < cardRefs.current.length; i++) {
              const c = cardRefs.current[i]
              if (!c) continue
              const r = c.getBoundingClientRect()
              if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
                targetIndex = i
                break
              }
            }
            if (targetIndex === -1) {
              cardRefs.current.forEach((c) => c && c.classList.remove('force-hover'))
            } else {
              cardRefs.current.forEach((c, i) => {
                if (!c) return
                if (i === targetIndex) c.classList.add('force-hover')
                else c.classList.remove('force-hover')
              })
              handleHover(targetIndex, true)
            }
            lastHoveredBeforeOpenRef.current = null
          })
        })
      }
    })
  }

  // Подключаем интерактивное управление частицами
  const sensitivity = { wheel: 0.002, touch: 0.005 }
  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
  const { resetRotation } = useParticleControl(camera, !isMobile, sensitivity)

  useEffect(() => {
    window.scrollTo(0, 0);
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    const onMove = (e) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    // Немедленная анимация fade-in при загрузке
    cards.forEach((_, index) => {
      gsap.fromTo(`.card-${index}`, 
        { opacity: 0, y: 0 }, // Начинаем с y: 0, чтобы карточки не были смещены вниз
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: index * 0.1 // Лёгкая задержка для последовательности
        }
      )
      
      // Установка начального состояния текста без анимации
      const cardElement = cardRefs.current[index];
      if (cardElement) {
        const normalTitle = cardElement.querySelector(`.normal-title-${index}`);
        const normalDesc = cardElement.querySelector(`.normal-desc-${index}`);
        
        if (normalTitle) {
          gsap.set(normalTitle, { x: 0, opacity: 1 });
        }
        
        if (normalDesc) {
          gsap.set(normalDesc, { x: 0, opacity: 1 });
        }
      }
    });

    // Preload dither effects: только opacity, без изменения width
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
        const dither = card.querySelector(`.dither-bg-${index}`);
      if (!dither) return;
      gsap.set(dither, { opacity: 0 });
    });

    // Обработка наведения на левый край
    const navigationEdge = document.querySelector('.navigation-edge-left')
    const navigationHint = document.querySelector('.navigation-hint-left')
    
    if (navigationEdge && navigationHint && !isMobile) {
      const handleMouseEnter = () => {
        navigationHint.classList.add('visible')
        document.body.style.cursor = 'none'
      }
      
      const handleMouseLeave = () => {
        navigationHint.classList.remove('visible')
        document.body.style.cursor = 'none'
      }
      
      const handleClick = () => {
        if (isTransitioningRef.current) return
        isTransitioningRef.current = true
        
        // Анимация затухания
        gsap.to(menuRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
          onComplete: () => {
            sessionStorage.setItem('returning-to-home', 'true')
            navigate('/home')
          }
        })
      }
      
      navigationEdge.addEventListener('mouseenter', handleMouseEnter)
      navigationEdge.addEventListener('mouseleave', handleMouseLeave)
      navigationEdge.addEventListener('click', handleClick)
      
      return () => {
        navigationEdge.removeEventListener('mouseenter', handleMouseEnter)
        navigationEdge.removeEventListener('mouseleave', handleMouseLeave)
        navigationEdge.removeEventListener('click', handleClick)
      }
    }

    return () => {
      // Очистка анимаций
      window.removeEventListener('mousemove', onMove)
    }
  }, [navigate])

  const handleMenuClick = (item) => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true
    
    // Анимация вспышки
    const flashOverlay = document.createElement('div')
    flashOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #ffffff;
      z-index: 10000;
      opacity: 0;
      pointer-events: none;
    `
    document.body.appendChild(flashOverlay)
    
    // Анимация вспышки
    gsap.to(flashOverlay, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
      onComplete: () => {
        navigate(item.route)
        
        setTimeout(() => {
          if (document.body.contains(flashOverlay)) {
            document.body.removeChild(flashOverlay)
          }
          setTimeout(() => {
            isTransitioningRef.current = false
          }, 1000)
        }, 100)
      }
    })
  }

  return (
    <MenuContainer>
      <CustomCursor />
      
      <NavigationEdge className="navigation-edge-left" />
      <NavigationHint className="navigation-hint-left">
        ← Домой
      </NavigationHint>
      
      <Section ref={menuRef}>
        <GlobalDither ref={globalDitherRef} aria-hidden="true">
          <Dither style={{position:'absolute', inset:0}} waveColor={waveColors[globalDitherColorIndex]} enableMouseInteraction={true} trackWindowMouse={true} mouseRadius={0.4} />
        </GlobalDither>
        <CardRow>
          {cards.map((card, index) => (
            <React.Fragment key={index}>
            <Card
              ref={(el) => (cardRefs.current[index] = el)}
              className={`card-${index}`}
              onMouseEnter={() => handleHover(index, true)}
              onMouseLeave={() => handleHover(index, false)}
              onClick={() => openCardFullscreen(index)}
            >
              {/* per-card dither удален, используем глобальный */}
              <CardContent>
                <TitleSection>
                  <CardTitle className={`title-${index}`}>{card.title}</CardTitle>
                </TitleSection>
                <Arrow className={`arrow-${index}`}>→</Arrow>
              </CardContent>
              {openedIndex === index && (
                <CloseButton
                  type="button"
                  className="close-btn"
                  onClick={(e) => { e.stopPropagation(); closeCardFullscreen(index) }}
                  aria-label="Закрыть"
                >
                  Закрыть ✕
                </CloseButton>
              )}
              {/* Убрано изображение в хавере "О себе" */}
              {index === 1 && (
                <ProjectList className="project-list">
                  <h4>Завершенные проекты</h4>
                  <ul>
                    <li><button onClick={() => navigate('/project/lightlab')}>Light Lab Case</button></li>
                    <li><button onClick={() => navigate('/game')}>Space Invaders</button></li>
                  </ul>
                  <h4>В разработке</h4>
                  <ul>
                    <li><button>Project A</button></li>
                    <li><button>Project B</button></li>
                  </ul>
                </ProjectList>
              )}
            </Card>
            {/* Подставка для предотвращения смещения сетки при фиксировании .is-open */}
            {openedIndex === index && <CardPlaceholder aria-hidden="true" />}
            </React.Fragment>
          ))}
        </CardRow>
      </Section>
        
      <MobileNavigation />
    </MenuContainer>
  )
}

export default MenuPage

const ProjectList = styled.div`
  position: absolute;
  top: 50%;
  left: 20px;
  right: 20px;
  transform: translateY(-50%) translateX(-100%);
  opacity: 0;
  z-index: 3;
  transition: all 0.3s ease;
  text-align: center;
  pointer-events: none;

  h4 {
    font-size: 24px;
    margin-bottom: 10px;
    color: white;
  }

  ul {
    list-style: none;
    padding: 0;
    margin-bottom: 20px;
  }

  li {
    margin: 5px 0;
    font-size: 18px; // Увеличенный шрифт
  }

  button {
    background: rgba(0,0,0,0.1);
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    margin: 5px;
    transition: background 0.3s;
    color: white;
    font-weight: 500;
    width: 80%;
    pointer-events: auto;

    &:hover {
      background: rgba(0,0,0,0.2);
    }
  }
`;

// Preload dither effects
const preloadImage = new Image();
preloadImage.src = '/images/rudakovrz7.png?v=1';

// Обработка наведения на левый край