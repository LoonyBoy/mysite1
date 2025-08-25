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
    min-height: 200vh;
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

  @media (max-width: 768px) {
    height: 320px;
    max-width: 100%;
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
`

const CardShadow = styled.div`
  position: absolute;
  left: 0; right: 0;
  height: 120px;
  pointer-events: none;
  transition: all 0.7s ease-in-out;
  bottom: ${p => (p.$active ? '0' : '-40px')};
  box-shadow: ${p => (p.$active ? 'inset 0 -120px 120px -120px #000, inset 0 -120px 120px -80px #000' : 'inset 0 -120px 0px -120px #000, inset 0 -120px 0px -80px #000')};
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
  const [accOpen, setAccOpen] = React.useState({
    greeting: false,
    payment: false,
    subs: false,
    reminders: false,
    admin: false,
    tech: false,
  })

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

    // Входная анимация заголовка и действий (только десктоп)
    if (!prefersReduced && !isMobile) {
      if (titleRef.current) {
        gsap.from(titleRef.current, { opacity: 0, y: 12, duration: 0.8, ease: 'power2.out' })
      }
      if (actionsRef.current) {
        gsap.from(actionsRef.current, { opacity: 0, y: 12, delay: 0.05, duration: 0.8, ease: 'power2.out' })
      }
    } else {
      // На мобиле/при reduced motion гарантируем полную видимость
      const items = [titleRef.current, actionsRef.current].filter(Boolean)
      if (items.length) gsap.set(items, { opacity: 1, y: 0, scale: 1, clearProps: 'transform' })
    }

    // Скролл‑затухание внутри HeroSection только на десктопе и без reduced motion
    let st
    if (!prefersReduced && !isMobile && heroRef.current) {
      const targets = [titleRef.current, actionsRef.current].filter(Boolean)
      st = ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          const p = Math.min(1, Math.max(0, self.progress))
          const easeOut = p // линейно, деликатно
          targets.forEach(el => {
            gsap.to(el, { opacity: 1 - easeOut, y: -12 * easeOut, scale: 1 - 0.015 * easeOut, overwrite: 'auto', duration: 0 })
          })
        }
      })
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

  // Close lightbox with ESC and lock scroll when open
  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e) => { if (e.key === 'Escape') setLightboxIndex(null) }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [lightboxIndex])

  const handleBack = () => {
    if (lightboxIndex !== null) return
    setTransitionContext('lightlab-case->projects')
    navigate('/menu')
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
        </HeaderActions>
      </HeroSection>

      <ContentSection>
        <Description>
          <p className="lead">
            Telegram‑бот для платных подписок на программу похудения Войтенко с автопродлением.
            Оплата через CloudPayments, уведомления и статусы подписок.
          </p>

          <FeaturesTechGrid>
            <div>
              <h3>Что делает бот</h3>
              <Accordion>
                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.greeting}
                    aria-controls="panel-greeting"
                    onClick={() => toggleAcc('greeting')}
                  >
                    Приветствие и контент‑воронка
                    <Chevron aria-hidden $open={accOpen.greeting} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-greeting" role="region" $open={accOpen.greeting}>
                    <BulletList>
                      <li>/start отправляет 1‑ю часть видео с интро.</li>
                      <li>2‑я часть доступна после подписки на обязательный канал; при бездействии придёт через 24 часа вместе с PDF‑пакетом.</li>
                      <li>После 2‑й части бот присылает 4 PDF: «Как пользоваться меню», дни 1–2, 3–4, 5–6.</li>
                      <li>3‑я часть приходит вручную или автоматически (через 24 часа неактивности) и открывает выбор меню по калорийности.</li>
                      <li>4‑я часть — видео‑инструкция, также приходит автонапоминанием при бездействии.</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.payment}
                    aria-controls="panel-payment"
                    onClick={() => toggleAcc('payment')}
                  >
                    Выбор меню и оплата
                    <Chevron aria-hidden $open={accOpen.payment} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-payment" role="region" $open={accOpen.payment}>
                    <BulletList>
                      <li>Выбор калорийности (1200–2200 ккал) и периода: неделя, месяц, 3 месяца.</li>
                      <li>Создание платежа для подписки с автопродлением через CloudPayments; проверка статуса кнопкой «Проверить оплату».</li>
                      <li>Успешная оплата создаёт подписку и присылает инвайт‑ссылку в закрытый канал (join request).</li>
                      <li>Отдельная оплата консультации нутрициолога с уведомлением админам.</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem>
                  <AccordionHeader
                    aria-expanded={accOpen.subs}
                    aria-controls="panel-subs"
                    onClick={() => toggleAcc('subs')}
                  >
                    Управление подписками
                    <Chevron aria-hidden $open={accOpen.subs} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-subs" role="region" $open={accOpen.subs}>
                    <BulletList>
                      <li>/my_subscriptions — просмотр активных подписок, кнопки «Отменить» и «Статус».</li>
                      <li>Автоодобрение заявок в закрытый канал при активной подписке.</li>
                      <li>По окончании периода — автоудаление из канала и уведомление пользователю.</li>
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
                    Админ‑инструменты
                    <Chevron aria-hidden $open={accOpen.admin} />
                  </AccordionHeader>
                  <AccordionPanel id="panel-admin" role="region" $open={accOpen.admin}>
                    <BulletList>
                      <li>Обновление видео по частям, обновление PDF командами.</li>
                      <li>Очистка кеша медиа для обновления описаний.</li>
                      <li>Полноценный админ-кабинет</li>
                      <li>Просмотр конверсии бота, аналитика по пользователям и подпискам, изменение цен, экспорт данных CSV и XLS, рассылки пользователям.</li>
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
                      <li>Aiogram (FSM для состояний), asyncio‑задачи для напоминаний.</li>
                      <li>Кеширование file_id для мгновенной отправки видео и документов.</li>
                      <li>Интеграция с CloudPayments (создание платежей, веб‑поток обработки, проверка статуса).</li>
                      <li>Поддержка приватных каналов: инвайты, автоодобрение join request, планирование «кика».</li>
                      <li>Логирование, обработка ошибок, трекинг действий пользователя в БД.</li>
                    </BulletList>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </div>
          </FeaturesTechGrid>

          <ResultCallout>
            Результат: стабильная монетизация, прозрачные статусы, минимум ручной рутины.
          </ResultCallout>
        </Description>

        <CarouselSection>
          <OptionsContainer>
            {(() => {
              const carouselOptions = [{
              title: 'Видео‑интро',
              description: '1‑я часть + приветствие',
              image: '/images/botdieta.jpg',
              icon: <FaPlayCircle size={20} color="#fff" />
            }, {
              title: 'PDF‑пакет',
              description: 'Гайд + меню',
              image: '/images/rudakovrz7.jpg',
              icon: <FaFilePdf size={20} color="#fff" />
            }, {
              title: 'Выбор меню',
              description: '1200–2200 ккал',
              image: '/images/botdieta.png',
              icon: <FaShoppingCart size={20} color="#fff" />
            }, {
              title: 'Подписка',
              description: 'CloudPayments',
              image: '/images/photo_2024-03-01_11-30-50.jpg',
              icon: <FaKey size={18} color="#fff" />
            }, {
              title: 'Закрытый канал',
              description: 'Автоинвайт и доступ',
              image: '/images/rudakovrz8.png',
              icon: <FaUserShield size={18} color="#fff" />
            }]
              return carouselOptions.map((opt, i) => (
              <OptionCard
                key={i}
                $bg={opt.image}
                $active={activeIndex === i}
                $animated={animatedOptions.includes(i)}
                onClick={() => {
                  if (activeIndex === i) setLightboxIndex(i); else setActiveIndex(i)
                }}
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
            ))})()}
          </OptionsContainer>
          {lightboxIndex !== null && (() => {
            const imgs = ['/images/botdieta.jpg','/images/rudakovrz7.jpg','/images/botdieta.png','/images/photo_2024-03-01_11-30-50.jpg','/images/rudakovrz8.png']
            return (
              <LightboxOverlay onClick={() => setLightboxIndex(null)} role="dialog" aria-modal="true">
                <LightboxClose onClick={(e) => { e.stopPropagation(); setLightboxIndex(null) }}>Закрыть</LightboxClose>
                <LightboxImage src={imgs[lightboxIndex]} alt="Просмотр изображения" onClick={(e) => e.stopPropagation()} />
              </LightboxOverlay>
            )
          })()}
        </CarouselSection>
      </ContentSection>
    </CaseContainer>
  )
}

export default VoytenkoCasePage
