import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useNavigate } from 'react-router-dom'
import { useParticles } from '../components/GlobalParticleManager'
import CustomCursor from '../components/CustomCursor'
import { FaPlayCircle, FaFilePdf, FaKey, FaShoppingCart, FaUserShield } from 'react-icons/fa'

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
  overscroll-behavior: contain;
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

const LightLabCasePage = () => {
  const navigate = useNavigate()
  const titleRef = useRef(null)
  const heroRef = useRef(null)
  const actionsRef = useRef(null)
  const backButtonRef = useRef(null)
  const { setTransitionContext } = useParticles()
  const [isBackButtonVisible, setIsBackButtonVisible] = React.useState(false)
  const [isBackButtonEnabled, setIsBackButtonEnabled] = React.useState(true)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [animatedOptions, setAnimatedOptions] = React.useState([])
  const [lightboxIndex, setLightboxIndex] = React.useState(null)
  const hasUserInteractedRef = useRef(false)
  const scrollYRef = useRef(0)
  const cardRefs = useRef([])
  const carouselOptions = React.useMemo(() => ([
    { title: 'Сайт', description: 'Главные экраны', image: '/images/rudakovrz8.png', icon: <FaPlayCircle size={20} color="#fff" /> },
    { title: 'Календарь', description: 'Выбор залов и слотов', image: '/images/photo_2024-03-01_11-30-50.jpg', icon: <FaShoppingCart size={20} color="#fff" /> },
    { title: 'ЛК клиента', description: 'История и статусы', image: '/images/rudakovrz7.jpg', icon: <FaUserShield size={18} color="#fff" /> },
    { title: 'Оплата', description: 'ЮKassa/эквайринг', image: '/images/botdieta.png', icon: <FaKey size={18} color="#fff" /> },
    { title: 'Админка', description: 'Управление бронированиями', image: '/images/botdieta.jpg', icon: <FaFilePdf size={20} color="#fff" /> },
  ]), [])
  const [accOpen, setAccOpen] = React.useState({
    overview: false,
    booking: false,
    payments: false,
    client: false,
    admin: false,
    tech: false,
  })

  const toggleAcc = (key) => setAccOpen(s => ({ ...s, [key]: !s[key] }))

  useEffect(() => {
    // Белый фон и серые частицы
    setTransitionContext('lightlab-case')

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Мобильная блокировка кнопки «Назад» первые 3s
    const mobile = window.innerWidth <= 768
    if (mobile) {
      setIsBackButtonEnabled(false)
      setTimeout(() => setIsBackButtonEnabled(true), 3000)
    } else {
      setIsBackButtonEnabled(true)
    }

    // Плавное появление кнопки «Назад»
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

    // Всегда полная видимость заголовка и действий
    {
      const items = [titleRef.current, actionsRef.current].filter(Boolean)
      if (items.length) gsap.set(items, { opacity: 1, y: 0, scale: 1, clearProps: 'transform' })
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill())
      clearTimeout(timer)
    }
  }, [setTransitionContext])

  // Carousel staggered entrance
  useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setAnimatedOptions([0,1,2,3,4])
      return
    }
    const timers = []
    const count = 5
    for (let i = 0; i < count; i++) {
      timers.push(setTimeout(() => setAnimatedOptions(prev => Array.from(new Set([...prev, i]))), 180 * i))
    }
    return () => { timers.forEach(t => clearTimeout(t)) }
  }, [])

  // Lightbox: preserve scroll position
  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e) => { if (e.key === 'Escape') setLightboxIndex(null) }
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
      const lockedTop = document.body.style.top
      const y = lockedTop ? Math.abs(parseInt(lockedTop, 10)) : scrollYRef.current

      document.body.style.overflow = prevOverflow
      document.body.style.position = prevPosition
      document.body.style.top = prevTop
      document.body.style.width = prevWidth
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.scrollBehavior = 'auto'
      window.scrollTo(0, y)
      document.documentElement.style.scrollBehavior = prevScrollBehavior
    }
  }, [lightboxIndex])

  const handleBack = () => {
  if (lightboxIndex !== null) return
  if (!isBackButtonEnabled) return
    setTransitionContext('lightlab-case->projects')
    navigate('/menu')
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!carouselOptions.length) return
    const last = carouselOptions.length - 1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      hasUserInteractedRef.current = true
      setActiveIndex(i => (i >= last ? 0 : i + 1))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      hasUserInteractedRef.current = true
      setActiveIndex(i => (i <= 0 ? last : i - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      hasUserInteractedRef.current = true
      setActiveIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      hasUserInteractedRef.current = true
      setActiveIndex(last)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); setLightboxIndex(activeIndex)
    }
  }

  // Auto-scroll active card on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!hasUserInteractedRef.current) return
    const isMobile = window.innerWidth <= 768
    if (!isMobile) return
    const el = cardRefs.current[activeIndex]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeIndex])

  return (
    <CaseContainer>
      <CustomCursor color="#D14836" />
    {isBackButtonVisible && (
        <BackButton
          ref={backButtonRef}
      onClick={handleBack}
          visible={isBackButtonVisible}
      $disabled={lightboxIndex !== null || !isBackButtonEnabled}
      aria-disabled={lightboxIndex !== null || !isBackButtonEnabled}
        >
          ← Назад в меню
        </BackButton>
      )}

      <HeroSection>
        <CaseTitle ref={titleRef}>Кейс фотостудии LightLab Studio</CaseTitle>
        <HeaderActions ref={actionsRef}>
          <CtaButton href="#" target="_blank" rel="noopener noreferrer">
            Открыть сайт
          </CtaButton>
        </HeaderActions>
      </HeroSection>

      <ContentSection>
        <Description>
          <p className="lead">
            Свой сайт для бронирований без комиссий платформы. Кастомный календарь, личные кабинеты
            клиента и администратора, интеграция с платежами и промокодами.
          </p>

          <FeaturesTechGrid>
            <div>
              <h3>Что реализовано</h3>
              <Accordion>
                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.overview}
                    aria-controls="panel-overview"
                    onClick={() => toggleAcc('overview')}
                  >
                    Проект и задачи
                    <Chevron aria-hidden $open={accOpen.overview} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-overview" role="region" $open={accOpen.overview}>
                    <BulletList>
                      <li>Отказ от AppEvent и любых комиссий за транзакции.</li>
                      <li>Собственный сайт в стиле студии с удобной воронкой.</li>
                      <li>Гибкий контент и дизайн без ограничений SaaS.</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.booking}
                    aria-controls="panel-booking"
                    onClick={() => toggleAcc('booking')}
                  >
                    Онлайн‑календарь бронирований
                    <Chevron aria-hidden $open={accOpen.booking} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-booking" role="region" $open={accOpen.booking}>
                    <BulletList>
                      <li>Залы, слоты, длительности и дополнительные услуги.</li>
                      <li>Блокировки и пересечения, управление расписанием.</li>
                      <li>Напоминания клиентам об аренде и статусах.</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.payments}
                    aria-controls="panel-payments"
                    onClick={() => toggleAcc('payments')}
                  >
                    Оплата и скидки
                    <Chevron aria-hidden $open={accOpen.payments} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-payments" role="region" $open={accOpen.payments}>
                    <BulletList>
                      <li>Интеграция с ЮKassa/эквайрингом, статусы платежей.</li>
                      <li>Промокоды, скидки, акции, чеки.</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.client}
                    aria-controls="panel-client"
                    onClick={() => toggleAcc('client')}
                  >
                    Личный кабинет клиента
                    <Chevron aria-hidden $open={accOpen.client} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-client" role="region" $open={accOpen.client}>
                    <BulletList>
                      <li>История бронирований, статусы, платежи.</li>
                      <li>Редактирование/отмена по правилам, напоминания.</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.admin}
                    aria-controls="panel-admin"
                    onClick={() => toggleAcc('admin')}
                  >
                    Админ‑панель
                    <Chevron aria-hidden $open={accOpen.admin} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-admin" role="region" $open={accOpen.admin}>
                    <BulletList>
                      <li>Управление залами, слотами, расписанием и ценами.</li>
                      <li>Просмотр и модерация броней, отчётность, экспорт.</li>
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
                    Стек и интеграции
                    <Chevron aria-hidden $open={accOpen.tech} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-tech" role="region" $open={accOpen.tech}>
                    <BulletList>
                      <li>React SPA, кастомные хуки и компоненты.</li>
                      <li>Серверная часть с REST API (Node) и БД (любая SQL/NoSQL).</li>
                      <li>Интеграция с платёжным провайдером, веб‑хуки статусов.</li>
                      <li>Логи, обработка ошибок, аналитика событий.</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </div>
          </FeaturesTechGrid>

          <ResultCallout>
            Результат: автономная система бронирований без комиссий с кастомным дизайном и полным контролем.
          </ResultCallout>
        </Description>

        <CarouselSection>
          <OptionsContainer
            role="listbox"
            aria-label="Слайды кейса LightLab"
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
                onMouseEnter={() => { 
                  if (window.innerWidth > 768) {
                    hasUserInteractedRef.current = true
                    setActiveIndex(i)
                  }
                }}
                onClick={() => { 
                  hasUserInteractedRef.current = true
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
                onClick={() => {
                  hasUserInteractedRef.current = true
                  setActiveIndex(i)
                }}
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
      </ContentSection>
    </CaseContainer>
  )
}

export default LightLabCasePage