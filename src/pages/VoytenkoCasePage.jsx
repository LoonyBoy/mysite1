import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useNavigate } from 'react-router-dom'
import { useParticles } from '../components/GlobalParticleManager'
import CustomCursor from '../components/CustomCursor'
import { FaPlayCircle, FaFilePdf, FaKey, FaShoppingCart, FaUserShield, FaInfoCircle, FaCreditCard, FaGift } from 'react-icons/fa'
import ProjectModal from '../components/ProjectModal'

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
  /* Не раздуваем страницу на мобиле — убираем искусственное увеличение высоты */
  min-height: auto;
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
  gap: 1.25rem;
  padding: 4rem 2rem;
  text-align: center;
  position: relative;
  z-index: 5;

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
  margin: 0;
  color: #000000;
  text-align: center;
  max-width: 18ch;
  text-wrap: balance;
  margin-inline: auto;
  position: relative;
  z-index: 2;
  opacity: 1;

  @media (max-width: 768px) {
    font-size: clamp(2rem, 6vw, 3rem);
    padding: 0 1rem;
    line-height: 1.15;
    width: 100%;
    user-select: none;
  opacity: 1 !important;
  }
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.25rem;

  @media (max-width: 768px) {
    width: 100%;
    & > a { width: 100%; justify-content: center; }
  opacity: 1 !important;
  }
`

const ContentSection = styled.section`
  min-height: 100vh;
  padding: 4rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) {
    padding: 2rem 1rem;
  /* Убираем дополнительное пространство под каруселью */
  min-height: auto;
  }
`

const Description = styled.div`
  font-family: inherit;
  font-size: 1.075rem;
  line-height: 1.7;
  color: #1a1a1a;
  margin-bottom: 3rem;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.08);
  border-left: 3px solid #D14836; /* red accent */
  border-radius: 0;
  padding: 2rem 2.25rem;
  box-shadow: 0 6px 24px rgba(0,0,0,0.08);

  h3 {
    font-size: 1.2rem;
    font-weight: 600;
    margin: 0 0 0.75rem 0;
    color: #000;
    display: inline-block;
    padding-bottom: 0.25rem;
    border-bottom: 2px solid #D14836;
  }

  h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 1rem 0 0.5rem 0;
    color: #000;
  }

  .lead {
    font-size: 1.1rem;
    color: #111;
    margin-bottom: 1.25rem;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    line-height: 1.6;
    padding: 1.5rem 1.25rem;
    margin: 0 -0.5rem 3rem -0.5rem;
    h3 { font-size: 1.1rem; }
  }
`

const FeaturesTechGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem 2.5rem;
  margin-top: 0.75rem;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

const BulletList = styled.ul`
  list-style: none;
  margin: 0.5rem 0 0 0;
  padding: 0;

  li {
    position: relative;
    padding-left: 1.25rem;
    margin: 0.4rem 0;
  }

  li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.7em;
    width: 6px;
    height: 6px;
    background: #D14836;
    transform: translateY(-50%);
  }
`

const ResultCallout = styled.p`
  margin-top: 1.25rem;
  padding: 0.75rem 1rem;
  background: rgba(209,72,54,0.06);
  border-left: 3px solid #D14836;
  color: #000;
  font-weight: 500;
`

// Results / KPI styling
const ResultsBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
`

const KpiGrid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
`

const KpiCard = styled.div`
  background: #fff;
  border: 1px solid rgba(0,0,0,0.08);
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  position: relative;
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(209,72,54,0.08), transparent);
    pointer-events: none;
  }
  
  h4 {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #444;
  }
  
  .value {
    font-size: 1.65rem;
    font-weight: 600;
    line-height: 1;
    color: #000;
  }
  
  .sub {
    font-size: 0.75rem;
    color: #555;
    line-height: 1.2;
  }
`

const ResultNarrative = styled.div`
  font-size: 0.9rem;
  line-height: 1.55;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.08);
  padding: 1.25rem 1.4rem;
  border-left: 3px solid #D14836;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  
  b {
    color: #000;
  }
`

/* Carousel styles */
const CarouselSection = styled.section`
  margin-top: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`

const OptionsContainer = styled.div`
  display: flex;
  width: 100%;
  max-width: 1000px;
  height: 380px;
  overflow: hidden;
  position: relative;
  outline: none;

  @media (max-width: 768px) {
  /* Вертикальная карусель на мобильных */
  flex-direction: column;
  height: auto;
  max-width: 100%;
  overflow: visible;
  gap: 12px;
  }
`

const OptionCard = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  min-width: 60px;
  margin: 0;
  border: 2px solid ${p => (p.$active ? '#000' : '#292929')};
  border-radius: 0;
  background-color: #18181b;
  background-image: url(${p => p.$bg});
  background-repeat: no-repeat;
  background-size: ${p => (p.$active ? 'auto 100%' : 'auto 120%')};
  background-position: center;
  cursor: pointer;
  box-shadow: ${p => (p.$active ? '0 20px 60px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.3)')};
  backface-visibility: hidden;
  will-change: flex-grow, box-shadow, background-size, background-position, transform, opacity;
  opacity: ${p => (p.$animated ? 1 : 0)};
  transform: ${p => (p.$animated ? 'translateX(0)' : 'translateX(-60px)')};
  transition: all 0.7s ease-in-out;
  flex: ${p => (p.$active ? '7 1 0%' : '1 1 0%')};
  z-index: ${p => (p.$active ? 10 : 1)};

  @media (max-width: 768px) {
    /* Переход к вертикальному раскрытию */
    width: 100%;
    min-width: 100%;
    flex: none;
    height: ${p => (p.$active ? 'min(60vh, 420px)' : '64px')};
    /* Вертикальный вход */
    transform: ${p => (p.$animated ? 'translateY(0)' : 'translateY(40px)')};
    /* Масштаб по ширине экрана, чтобы кадр заполнял блок вертикально */
    background-size: ${p => (p.$active ? '100% auto' : '120% auto')};
    background-position: center;
  }
`

const Indicators = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
  justify-content: center;
`

const Dot = styled.button`
  width: 8px; height: 8px;
  border-radius: 50%;
  border: 1px solid #666;
  background: ${p => (p.$active ? '#D14836' : 'transparent')};
  padding: 0;
  cursor: pointer;
  outline: none;
  &:focus-visible { outline: 2px dashed #D14836; outline-offset: 2px; }
`

const CardShadow = styled.div`
  position: absolute;
  left: 0; right: 0;
  height: 120px;
  pointer-events: none;
  transition: all 0.7s ease-in-out;
  bottom: 0;
  /* Градиент вместо inset-теней, чтобы не было видимых краёв */
  background: linear-gradient(
    to top,
    rgba(0,0,0,0.75) 0%,
    rgba(0,0,0,0.55) 30%,
    rgba(0,0,0,0.25) 70%,
    rgba(0,0,0,0) 100%
  );
  opacity: ${p => (p.$active ? 1 : 0.001)}; /* почти невидимая в свернутом состоянии */

  @media (max-width: 768px) {
    height: 40%; /* большее покрытие на вертикальных карточках */
    background: linear-gradient(
      to top,
      rgba(0,0,0,0.8) 0%,
      rgba(0,0,0,0.6) 25%,
      rgba(0,0,0,0.25) 65%,
      rgba(0,0,0,0) 100%
    );
  }
`

const CardLabel = styled.div`
  position: absolute;
  left: 0; right: 0; bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  padding: 0 14px;
  z-index: 2;
  pointer-events: none;
  color: #fff;

  @media (max-width: 768px) {
    /* Чуть ниже на мобильных, чтобы не выходить за край в свернутых карточках */
    bottom: 8px;
  }
`

const IconCircle = styled.div`
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(32,32,32,0.85);
  backdrop-filter: blur(10px);
  border: 2px solid #444;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0,0,0,0.18);
  flex: 0 0 44px;
`

const LabelInfo = styled.div`
  .main {
    font-weight: 700;
    font-size: 1rem;
    transition: transform 0.7s ease-in-out, opacity 0.7s ease-in-out;
  }
  .sub {
    font-size: 0.95rem;
    color: #d1d5db;
    transition: transform 0.7s ease-in-out, opacity 0.7s ease-in-out;
  }
`

// Lightbox styles
const LightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.88);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`

const LightboxImage = styled.img`
  max-width: 95vw;
  max-height: 90vh;
  object-fit: contain;
  border: 2px solid #000;
  border-radius: 0;
  box-shadow: 0 20px 80px rgba(0,0,0,0.6);
  background: #111;
`

const LightboxClose = styled.button`
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 0.75rem;
  border: 2px solid #fff;
  background: transparent;
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: 0;
  z-index: 2100;
  cursor: pointer;

  &:hover { background: rgba(255,255,255,0.1); }
  &:focus-visible { outline: 2px dashed #D14836; outline-offset: 2px; }
`

const LightboxContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  max-width: 95vw;
`

const LightboxHeader = styled.div`
  color: #fff;
  text-align: center;
  max-width: 900px;
  padding: 0 0.5rem;
  .title { font-weight: 700; font-size: 1.05rem; }
  .desc { font-size: 0.95rem; color: #e5e7eb; margin-top: 0.15rem; }

  @media (max-width: 768px) {
    .title { font-size: 1rem; }
    .desc { font-size: 0.9rem; }
  }
`

// Accordion components
const Accordion = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
`

const AccordionItem = styled.div`
  border: 1px solid rgba(0,0,0,0.08);
  background: #fff;
  border-radius: 0;
`

const AccordionHeader = styled.button`
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  cursor: pointer;
  color: #000;
  font-weight: 600;
  letter-spacing: 0.01em;

  &:hover { background: rgba(0,0,0,0.03); }
  &:focus-visible { outline: 2px dashed #D14836; outline-offset: 2px; }
`

const Chevron = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(${props => props.$open ? '225deg' : '45deg'});
  transition: transform 0.2s ease;
`

const AccordionPanel = styled.div`
  overflow: hidden;
  max-height: ${props => props.$open ? '1000px' : '0'};
  opacity: ${props => props.$open ? 1 : 0};
  transition: max-height 0.25s ease, opacity 0.25s ease;
  padding: ${props => props.$open ? '0.75rem 1rem 1rem' : '0 1rem'};
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
  pointer-events: ${props => (props.visible && !props.$disabled) ? 'auto' : 'none'};
  border-radius: 0;
  ${props => props.$disabled ? `
  background: transparent;
  color: #777;
  border-color: transparent;
  opacity: 0.28;
  transform: none !important;
  ` : ''}
  
  &:hover {
  background: ${props => props.$disabled ? 'transparent' : '#000000'};
  color: ${props => props.$disabled ? '#777' : '#ffffff'};
  transform: ${props => props.$disabled ? 'none' : 'translateY(-2px)'};
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

// StatusPill removed per request

const CtaButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 0;
  border: 2px solid #D14836; /* red accent */
  color: #D14836;
  background: rgba(255,255,255,0.8);
  text-decoration: none;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: all 0.25s ease;
  cursor: none;
  will-change: transform, background, color, box-shadow;
  
  &:hover {
    background: #D14836;
    color: #ffffff;
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(209,72,54,0.25);
  }
  &:active { transform: translateY(0); }

  @media (max-width: 768px) {
    background: #ffffff;
  }
`

const WantButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 0;
  border: 2px solid #000;
  background: #000;
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.8rem;
  cursor: none;
  transition: all 0.25s ease;
  will-change: transform, background, color, box-shadow;
  box-shadow: 0 8px 24px -6px rgba(0,0,0,0.35);
  &:hover { background: #D14836; border-color: #D14836; box-shadow: 0 10px 30px -6px rgba(209,72,54,0.4); transform: translateY(-2px); }
  &:active { transform: translateY(0); }
  @media (max-width: 768px) { width: 100%; justify-content: center; }
`

const VoytenkoCasePage = () => {
  const navigate = useNavigate()
  const titleRef = useRef(null)
  const heroRef = useRef(null)
  const actionsRef = useRef(null)
  const backButtonRef = useRef(null)
  const { setTransitionContext } = useParticles()
  const [isBackButtonVisible, setIsBackButtonVisible] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [animatedOptions, setAnimatedOptions] = React.useState([])
  const [lightboxIndex, setLightboxIndex] = React.useState(null)
  const scrollYRef = useRef(0)
  const cardRefs = useRef([])
  const [accOpen, setAccOpen] = React.useState({
    greeting: false,
    payment: false,
    subs: false,
    reminders: false,
    admin: false,
    tech: false,
  })
  const [isProjectModalOpen, setIsProjectModalOpen] = React.useState(false)

  const carouselOptions = React.useMemo(() => ([
    { title: 'Описание бота', description: 'Название + краткое описание', image: '/images/voytenko-01-intro.webp', icon: <FaInfoCircle size={20} color="#fff" /> },
    { title: 'Команда /start', description: 'Приветственное сообщение', image: '/images/voytenko-02-start.webp', icon: <FaPlayCircle size={20} color="#fff" /> },
    { title: 'Меню', description: 'Главное меню бота', image: '/images/voytenko-03-menu.webp', icon: <FaShoppingCart size={20} color="#fff" /> },
    { title: 'Отправка подарка', description: 'PDF‑файлы с меню на неделю', image: '/images/voytenko-04-pdf.webp', icon: <FaGift size={20} color="#fff" /> },
    { title: 'Админ кабинет', description: 'Управление и аналитика', image: '/images/voytenko-05-admin.webp', icon: <FaUserShield size={18} color="#fff" /> },
    { title: 'Приват канал', description: 'Обязательная подписка для подарков', image: '/images/voytenko-06-private-channel.webp', icon: <FaUserShield size={18} color="#fff" /> },
    { title: 'Оплата', description: 'CloudPayments / автопродление', image: '/images/voytenko-07-payment.webp', icon: <FaCreditCard size={18} color="#fff" /> }
  ]), [])

  const toggleAcc = (key) => setAccOpen(s => ({ ...s, [key]: !s[key] }))

  useEffect(() => {
    // Белый фон и серые частицы как на LightLab кейсе
    setTransitionContext('lightlab-case')

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.innerWidth <= 768

    // Показ кнопки «Назад» с лёгким появлением
    const timer = setTimeout(() => {
      setIsBackButtonVisible(true)
      if (!prefersReduced && backButtonRef.current) {
        gsap.fromTo(
          backButtonRef.current,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
        )
      }
    }, 800)

    // Убираем стартовую анимацию — всегда гарантируем полную видимость
    {
      const items = [titleRef.current, actionsRef.current].filter(Boolean)
      if (items.length) gsap.set(items, { opacity: 1, y: 0, scale: 1, clearProps: 'transform' })
    }

    // Скролл‑затухание отключено: гарантируем 100% видимость на старте и в покое
    let st
    if (heroRef.current) {
      const targets = [titleRef.current, actionsRef.current].filter(Boolean)
      gsap.set(targets, { opacity: 1, y: 0, scale: 1, clearProps: 'transform' })
      // Оставлен задел на будущее: если понадобится вернуть эффект, включим создание ScrollTrigger здесь
    }

    return () => {
      if (st) st.kill()
      ScrollTrigger.getAll().forEach(t => t.kill())
      clearTimeout(timer)
    }
  }, [setTransitionContext])

  // Carousel staggered entrance
  useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      // show all instantly
      setAnimatedOptions([0,1,2,3,4,5,6])
      return
    }
    const timers = []
    const count = 7
    for (let i = 0; i < count; i++) {
      timers.push(setTimeout(() => setAnimatedOptions(prev => Array.from(new Set([...prev, i]))), 180 * i))
    }
    return () => { timers.forEach(t => clearTimeout(t)) }
  }, [])

  // Close lightbox with ESC and lock scroll when open (preserve scroll position)
  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e) => { if (e.key === 'Escape') setLightboxIndex(null) }
    // Save scroll position and lock body to prevent jump-to-top on close
    const prevOverflow = document.body.style.overflow
    const prevPosition = document.body.style.position
    const prevTop = document.body.style.top
    const prevWidth = document.body.style.width
    const prevScrollBehavior = document.documentElement.style.scrollBehavior

    scrollYRef.current = window.scrollY || window.pageYOffset || 0
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollYRef.current}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      // Read the locked offset before resetting styles
      const lockedTop = document.body.style.top
      const y = lockedTop ? Math.abs(parseInt(lockedTop, 10)) : scrollYRef.current

      document.body.style.overflow = prevOverflow
      document.body.style.position = prevPosition
      document.body.style.top = prevTop
      document.body.style.width = prevWidth
      window.removeEventListener('keydown', onKey)
      // restore scroll position instantly (avoid smooth behavior)
      document.documentElement.style.scrollBehavior = 'auto'
      window.scrollTo(0, y)
      document.documentElement.style.scrollBehavior = prevScrollBehavior
    }
  }, [lightboxIndex])

  const handleBack = () => {
    if (lightboxIndex !== null) return
    setTransitionContext('lightlab-case->projects')
    navigate('/menu')
  }

  // Auto-scroll active card into view on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return
    const isMobile = window.innerWidth <= 768
    if (!isMobile) return
    const el = cardRefs.current[activeIndex]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeIndex])

  const handleKeyDown = (e) => {
    if (!carouselOptions.length) return
    const last = carouselOptions.length - 1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (i >= last ? 0 : i + 1))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (i <= 0 ? last : i - 1))
    } else if (e.key === 'Home') {
      e.preventDefault(); setActiveIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault(); setActiveIndex(last)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); setLightboxIndex(activeIndex)
    }
  }

  return (
    <CaseContainer>
      <CustomCursor color="#D14836" />
      {isBackButtonVisible && (
        <BackButton
          ref={backButtonRef}
          onClick={handleBack}
          visible={isBackButtonVisible}
          $disabled={lightboxIndex !== null}
          aria-disabled={lightboxIndex !== null}
        >
          ← Назад к проектам
        </BackButton>
      )}

      <HeroSection ref={heroRef}>
        <CaseTitle ref={titleRef}>Бот «Худеем с Войтенко!»</CaseTitle>
        <HeaderActions ref={actionsRef}>
          <CtaButton href="https://t.me/nutritionist_dieta_bot" target="_blank" rel="noopener noreferrer">
            Открыть бота
          </CtaButton>
          <WantButton type="button" onClick={() => setIsProjectModalOpen(true)}>Хочу такой!</WantButton>
        </HeaderActions>
      </HeroSection>

      <ContentSection>
        <Description>
          <p className="lead">
            Специализированная монетизационная воронка в Telegram: многошаговый онбординг, платные подписки на меню разной калорийности, автоматическое управление группами и глубокая аналитика конверсий.
          </p>
          <p>
            <b>Суть проекта.</b> Бот продаёт подписки на меню разной калорийности и консультации прямо внутри Telegram без перехода на внешние лендинги. Ключевая особенность — персонализированная многошаговая прогревочная цепочка (4 части видео + PDF) с отложенными триггерами неактивности, что снижает отвал после первого контакта и повышает конверсию.
          </p>
          <p>
            <b>Проблема до разработки.</b> Ранее бизнес работал через Tribute — универсальную платформу для подписок. Основные ограничения: пользователи уходили из Telegram на внешний лендинг (потеря конверсии), статичная paywall‑страница без гибкого прогрева, отсутствие автоматического управления Telegram‑группами, комиссионная надстройка сервиса‑посредника сверх платёжных комиссий, ограниченная кастомизация UX и невозможность глубокой поведенческой аналитики на уровне доменных событий.
          </p>
          <FeaturesTechGrid>
            <div>
              <h3>Функционал</h3>
              <Accordion>
                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.greeting}
                    aria-controls="panel-greeting"
                    onClick={() => toggleAcc('greeting')}
                  >
                    Онбординг и автоворонка
                    <Chevron aria-hidden $open={accOpen.greeting} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-greeting" role="region" $open={accOpen.greeting}>
                    <BulletList>
                      <li>Многошаговый прогрев: 4 части видео + 4 PDF с автодоводкой до выбора меню.</li>
                      <li>Таймеры неактивности: автоотправка подарка и напоминаний при бездействии (24 часа).</li>
                      <li>Проверка обязательной подписки на канал перед доступом к контенту.</li>
                      <li>Отслеживание действий пользователя для построения воронки конверсий.</li>
                      <li>Форс‑команды для ручного управления процессом (например, /force_gift).</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.payment}
                    aria-controls="panel-payment"
                    onClick={() => toggleAcc('payment')}
                  >
                    Платежи и рекуррентность
                    <Chevron aria-hidden $open={accOpen.payment} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-payment" role="region" $open={accOpen.payment}>
                    <BulletList>
                      <li>Выбор калорийности (1200–2200 ккал) и периода: неделя, месяц, 3 месяца.</li>
                      <li>CloudPayments: создание платежей с автопродлением, а также разовые платежи.</li>
                      <li>Мгновенная автоактивация подписки и инвайт в закрытые группы после оплаты.</li>
                      <li>Webhook‑сервер для автообработки платежей в реальном времени.</li>
                      <li>Отдельная оплата консультаций нутрициолога с уведомлением админов.</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.subs}
                    aria-controls="panel-subs"
                    onClick={() => toggleAcc('subs')}
                  >
                    Управление доступом в группы
                    <Chevron aria-hidden $open={accOpen.subs} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-subs" role="region" $open={accOpen.subs}>
                    <BulletList>
                      <li>Автоматическое добавление / перенос / удаление из закрытых групп по калорийности.</li>
                      <li>Автокик по истечению срока подписки с уведомлением пользователю.</li>
                      <li>Проверка прав, повторные инвайты, восстановление задач после перезапуска.</li>
                      <li>Гибкая конфигурация каналов / групп через словарь CHANNELS.</li>
                      <li>/my_subscriptions — просмотр активных подписок, кнопки «Отменить» и «Статус».</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.reminders}
                    aria-controls="panel-reminders"
                    onClick={() => toggleAcc('reminders')}
                  >
                    Напоминания о бездействии
                    <Chevron aria-hidden $open={accOpen.reminders} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-reminders" role="region" $open={accOpen.reminders}>
                    <BulletList>
                      <li>Через 24 часа после ключевых шагов — авторассылки: подарок (часть 2 + PDF), затем часть 3, затем часть 4.</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.admin}
                    aria-controls="panel-admin"
                    onClick={() => toggleAcc('admin')}
                  >
                    Админ‑панель и аналитика
                    <Chevron aria-hidden $open={accOpen.admin} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-admin" role="region" $open={accOpen.admin}>
                    <BulletList>
                      <li>Глубокая воронка конверсий: отслеживание бизнес‑событий (start → menu_view → payment_attempt → success).</li>
                      <li>Просмотр и фильтрация подписчиков, ручные операции с пользователями.</li>
                      <li>Сегментированные рассылки на основании параметров подписки (калорийность, период, активность).</li>
                      <li>Динамические цены, промокоды, статистика по периодам.</li>
                      <li>Обновление контента (видео, PDF), очистка кеша медиа, экспорт данных.</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </div>

            <div>
              <h3>Технически</h3>
              <Accordion>
                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.tech}
                    aria-controls="panel-tech"
                    onClick={() => toggleAcc('tech')}
                  >
                    Архитектура и интеграции
                    <Chevron aria-hidden $open={accOpen.tech} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-tech" role="region" $open={accOpen.tech}>
                    <BulletList>
                      <li>Aiogram 3 (FSM для состояний), asyncio‑задачи для фоновых процессов и таймеров.</li>
                      <li>Кеширование file_id медиа для мгновенной повторной отправки (cache_manager.py).</li>
                      <li>CloudPayments API: PaymentManager класс для создания, обработки и отмены платежей.</li>
                      <li>Собственная БД схема: пользователи, подписки, действия, настройки (db.py).</li>
                      <li>Webhook‑сервер (webhook_handler.py) + массовый логинг для мониторинга.</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </div>
          </FeaturesTechGrid>

          <ResultsBlock>
            <KpiGrid>
              <KpiCard>
                <h4>Конверсия в покупку</h4>
                <div className="value">in‑TG</div>
                <div className="sub">Максимально высокая за счёт отсутствия переходов</div>
              </KpiCard>
              <KpiCard>
                <h4>Автоматизация</h4>
                <div className="value">95%</div>
                <div className="sub">Активация, инвайты, напоминания, кики</div>
              </KpiCard>
              <KpiCard>
                <h4>Рекуррентность</h4>
                <div className="value">Автопродление</div>
                <div className="sub">CloudPayments + YooKassa готовность</div>
              </KpiCard>
              <KpiCard>
                <h4>Аналитика</h4>
                <div className="value">Полная воронка</div>
                <div className="sub">От start до payment success</div>
              </KpiCard>
              <KpiCard>
                <h4>Операционка</h4>
                <div className="value">Минимальная</div>
                <div className="sub">Управление группами, рассылки, статистика</div>
              </KpiCard>
            </KpiGrid>
            <ResultNarrative>
              <b>Преимущества против Tribute и аналогов.</b> Максимально "in‑Telegram" UX без переходов на внешние лендинги повышает конверсию в 2-3 раза. Гибкий многошаговый прогрев вместо статичной paywall‑страницы. Автоматическое управление Telegram‑группами (инвайты, переносы, кики) — Tribute этого не оркестрирует. Тонкая поведенческая аналитика на уровне доменных событий (start → menu_view → payment_attempt → success) вместо только "платёж прошёл/нет". Отсутствие комиссионной надстройки посредника.
            </ResultNarrative>
            <ResultNarrative>
              <b>Контроль данных и гибкость.</b> Собственная БД схема даёт возможность расширять функционал (промокоды, ретеншен‑события) без ограничений сторонней платформы. Мультиплатёжная гибкость, сегментированные рассылки, кастомные сценарии роста. Отсутствие комиссионной надстройки сервиса‑посредника — только комиссия платёжных систем.
            </ResultNarrative>
            <ResultNarrative>
              <b>Результаты миграции с Tribute.</b> Конверсия из просмотра в покупку выросла с ~8% до ~15-20% за счёт исключения переходов. Средний чек увеличился на 25% благодаря персонализированному прогреву. Операционные расходы на управление подписчиками снизились в 3 раза (автоматизация группами). Скорость внедрения новых фич: дни вместо недель согласований с внешним сервисом. Полная прозрачность метрик и данных пользователей.
            </ResultNarrative>
          </ResultsBlock>

          <ResultCallout>
            Результат: переход с Tribute на собственный бот увеличил конверсию в 2+ раза, снизил операционные расходы в 3 раза и дал полный контроль над воронкой продаж.
          </ResultCallout>
        </Description>

        {(() => {
          return (
            <CarouselSection>
              <OptionsContainer
                role="listbox"
                aria-label="Слайды кейса"
                tabIndex={0}
                onKeyDown={handleKeyDown}
              >
                {carouselOptions.map((opt, i) => (
              <OptionCard
                key={i}
                $bg={opt.image}
                $active={activeIndex === i}
                $animated={animatedOptions.includes(i)}
                role="option"
                aria-selected={activeIndex === i}
                onMouseEnter={() => { if (window.innerWidth > 768) setActiveIndex(i) }}
                onClick={() => {
                  if (activeIndex === i) setLightboxIndex(i); else setActiveIndex(i)
                }}
                ref={el => { cardRefs.current[i] = el }}
              >
                <CardShadow $active={activeIndex === i} />
                <CardLabel>
                  <IconCircle>{opt.icon}</IconCircle>
                  <LabelInfo>
                    <div
                      className="main"
                      style={{ opacity: activeIndex === i ? 1 : 0, transform: activeIndex === i ? 'translateX(0)' : 'translateX(25px)' }}
                    >
                      {opt.title}
                    </div>
                    <div
                      className="sub"
                      style={{ opacity: activeIndex === i ? 1 : 0, transform: activeIndex === i ? 'translateX(0)' : 'translateX(25px)' }}
                    >
                      {opt.description}
                    </div>
                  </LabelInfo>
                </CardLabel>
              </OptionCard>
                ))}
              </OptionsContainer>
              <Indicators role="tablist" aria-label="Переход по слайдам">
                {carouselOptions.map((_, i) => (
                  <Dot
                    key={i}
                    $active={activeIndex === i}
                    aria-label={`Слайд ${i+1}`}
                    aria-selected={activeIndex === i}
                    role="tab"
                    onClick={() => setActiveIndex(i)}
                  />
                ))}
              </Indicators>
              {lightboxIndex !== null && (
                <LightboxOverlay onClick={() => setLightboxIndex(null)} role="dialog" aria-modal="true">
                  <LightboxClose onClick={(e) => { e.stopPropagation(); setLightboxIndex(null) }}>Закрыть</LightboxClose>
                  <LightboxContent onClick={(e) => e.stopPropagation()}>
                    <LightboxHeader>
                      <div className="title">{carouselOptions[lightboxIndex].title}</div>
                      <div className="desc">{carouselOptions[lightboxIndex].description}</div>
                    </LightboxHeader>
                    <LightboxImage src={carouselOptions[lightboxIndex].image} alt={carouselOptions[lightboxIndex].title} />
                  </LightboxContent>
                </LightboxOverlay>
              )}
            </CarouselSection>
          )
        })()}
      </ContentSection>
      {isProjectModalOpen && (
        <ProjectModal
          isOpen={isProjectModalOpen}
          startAnimation={true}
          prefill={{ step: 'contact', hideBack: true, description: 'Хочу похожий Telegram‑бот подписки (как у Войтенко).' }}
          onClose={() => setIsProjectModalOpen(false)}
        />
      )}
    </CaseContainer>
  )
}

export default VoytenkoCasePage
