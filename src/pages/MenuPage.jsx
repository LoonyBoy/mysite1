import React, { useEffect, useRef, useState, useMemo, Suspense } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import styled from 'styled-components'
import { gsap } from 'gsap'
gsap.registerPlugin(ScrollTrigger, Flip)
import { useNavigate } from 'react-router-dom'
import { useParticles } from '../components/GlobalParticleManager'
import CustomCursor from '../components/CustomCursor'
import MobileNavigation from '../components/MobileNavigation'
import usePageVisibility from '../hooks/usePageVisibility'
import usePerformanceOptimization from '../hooks/usePerformanceOptimization'
// Lazy components to reduce initial bundle
// Прямой импорт ProjectModal (убрали lazy, чтобы не было промежуточного экрана загрузки при открытии модального окна)
import ProjectModal from '../components/ProjectModal'
const ServicesContentLazy = React.lazy(()=>import('../components/ServicesContent'))
import useParticleControl from '../hooks/useParticleControl'
const DitherLazy = React.lazy(() => import('../../dither.jsx')) // Adjusted to new file extension
// DesktopModalAnimations will be dynamically imported when needed
// Иконки каналов связи (используются в hover-оверлее «Контакты»)
import telegramIcon from '../images/telegram.svg'
import whatsappIcon from '../images/whatsapp.svg'
import phoneIcon from '../images/phone.svg'
import emailIcon from '../images/email.svg'

import { useDeviceDetection } from '../hooks/useDeviceDetection'
import ErrorBoundary from '../components/ErrorBoundary'
// ProjectsScrollStack не используем в новой версии модалки


const MenuContainer = styled.div`
  /* Ensure the menu immediately covers the viewport and hides previous page content during transitions */
  position: ${p => p.$windowScroll ? 'relative' : 'fixed'};
  top: 0;
  left: 0;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  height: ${p => p.$windowScroll ? 'auto' : '100dvh'};
  background: transparent; /* частицы видны через прозрачный фон */
  overflow-x: hidden;
  z-index: 100;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  
  /* Prevent layout shifts that cause visible seams */
  * { box-sizing: border-box; }
  
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
  height: ${p => p.$windowScroll ? 'auto' : '100vh'};
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;

  @media (max-width: 768px) {
    padding: 0;
    height: auto;
    min-height: 100dvh;
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
  /* square cyberpunk close icon button */
  position: fixed;
  top: calc(16px + env(safe-area-inset-top, 0px));
  right: calc(24px + var(--close-right-offset, 0px));
  z-index: 1102; /* поверх модалки и dither */
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  color: var(--primary-red);
  background: transparent;
  border: 2px solid var(--primary-red);
  border-radius: 0; /* прямые углы */
  padding: 0;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.12s ease, box-shadow 0.2s ease;
  &:hover { background: var(--primary-red); color: var(--black); box-shadow: 0 8px 20px rgba(0,0,0,0.35); transform: translateY(-2px); }
  &:active { transform: translateY(0) scale(0.985); }
  &:focus-visible { outline: 2px solid var(--primary-red); outline-offset: 2px; }
  &::after { content: ''; position: absolute; inset: 0; pointer-events: none; }
`



const CardRow = styled.div`
  display: flex;
  flex-direction: ${p => p.$windowScroll ? 'column' : 'row'};
  width: 100%;
  height: ${p => p.$windowScroll ? 'auto' : '100vh'};
  margin: 0;
  gap: 0; /* избегаем тонкой линии между карточками при анимации */
  align-items: ${p => p.$windowScroll ? 'stretch' : 'center'};
  flex-wrap: ${p => p.$windowScroll ? 'nowrap' : 'nowrap'};
  position: relative;
  z-index: 2; /* гарантируем, что карточки выше GlobalDither */

  /* Window-scroll mode: показываем только открытую карточку */
  ${p => p.$windowScroll ? `
    & > div:not(.is-open) { display: none !important; }
  ` : ''}

  @media (max-width: 1280px) and (min-width: 1025px) {
    flex-wrap: wrap;
    height: auto;
    min-height: 100vh;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    flex-wrap: nowrap;
    height: auto;
    min-height: 100dvh;
  }
`

const Card = styled.div`
  position: relative;
  width: ${p => p.$windowScroll ? '100%' : '25%'};
  height: 100%;
  /* remove hard separators between cards to avoid visible seams on dark background */
  border-right: none;
  cursor: pointer;
  overflow: visible; /* чтобы hover-слои не обрезались */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0; /* Padding переносим в CardContent, чтобы dither не сдвигался */
  text-align: center;
  flex-direction: column;
  gap: 12px;
  
  /* Предотвращаем начальное мерцание на мобильных */
  @media (max-width: 768px) {
    opacity: 1;
    visibility: visible;
  }
  
  /* Overlap cards slightly to remove visible seams */
  margin-right: -1px;

  /* thin red separator between cards (vertical on desktop, horizontal on mobile)
     Use pseudo-element so it doesn't affect layout; hidden for the last child. */
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    /* span full height on desktop so separator reaches screen edges */
    top: 0;
    bottom: 0;
    right: -1px; /* sits between overlapping cards */
    width: 1px;
    background: var(--primary-red);
    opacity: 0.95;
    pointer-events: none;
    z-index: 2;
  }
  
  &:hover {
    align-items: center;
    padding-top: 0;
  }
  
  &:last-child {
    border-right: none;
    margin-right: 0;
    @media (max-width: 768px) {
      border-bottom: none;
      margin-bottom: 0;
    }
  }
  
  @media (max-width: 1280px) and (min-width: 1025px) {
    width: 50%;
    height: 50vh;
  }
  
  @media (max-width: 768px) {
   width: 100%;
   /* let cards flex to fill the viewport evenly on mobile instead of fixed 22vh
     this prevents leftover empty space below the last card when total card
     heights < 100dvh */
   height: auto;
   min-height: 22vh;
   flex: 1 1 22vh;
    border-right: none;
    /* no bottom border on mobile to avoid seam artifacts */
    border-bottom: none;
    padding: 0 8px;
    margin-right: 0;
   margin-bottom: -1px;
    /* mobile: make separator horizontal between stacked cards */
    &:not(:last-child)::after {
      left: 8px;
      right: 8px;
      top: auto;
      bottom: -1px;
      height: 1px;
      width: auto;
    }
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
    position: ${p => p.$windowScroll ? 'static' : 'fixed'};
    inset: ${p => p.$windowScroll ? 'auto' : '0'};
    width: ${p => p.$windowScroll ? '100%' : '100%'};
    height: ${p => p.$windowScroll ? 'auto' : '100dvh'};
    z-index: 1001; /* выше GlobalDither */
    border-right: none;
    padding: 0; /* Без padding на контейнере во время Flip */
    background: transparent; /* фон дает GlobalDither на полном экране */
    backdrop-filter: none;
    cursor: default;
    /* Hide card separator line when fullscreen to avoid red stripe on mobile */
    &::after {
      display: none !important;
      content: none !important;
    }
  /* Позиционируем содержимое модалки у верхнего края. На десктопе не показываем внутренние скроллы (модалка должна занимать весь экран).
    На мобильных разрешаем вертикальный скролл внутри карточки. */
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding-top: env(safe-area-inset-top, 0px);

  /* По умолчанию (desktop): скрываем внутренние скроллы; в режиме прокрутки окна — показываем содержимое */
  overflow-y: ${p => p.$windowScroll ? 'visible' : 'hidden'};
  /* Prevent horizontal overflow introduced by scrollbars on desktop */
  overflow-x: hidden;

  @media (max-width: 768px) {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
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
  width: 100%;
  /* match Card's mobile flex sizing so placeholder keeps layout when a card opens */
  height: auto;
  min-height: 22vh;
  flex: 1 1 22vh;
  border-right: none;
  border-bottom: none;
  }
`

const GlobalDither = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100dvh;
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
    align-items: flex-start;
    justify-content: flex-start;
  }

  @media (max-width: 768px) {
    gap: 8px;
    padding: 0 8px;
    ${Card}.is-open & {
  padding: 24px 0; /* убираем боковые отступы для full-bleed */
    }
  }
`

// Контент модалки для "О себе"
const AboutModalContent = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  grid-gap: 24px;
  width: 100%;
  height: calc(100vh - 80px);
  padding: 24px;
  box-sizing: border-box;
  align-items: start;
  text-align: left;
  /* Desktop: make About modal internally scrollable */
  overflow: hidden;

  @media (min-width: 769px) {
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: rgba(136,78,255,0.6) rgba(255,255,255,0.06);
    &::-webkit-scrollbar { width: 10px; }
    &::-webkit-scrollbar-track { background: rgba(255,255,255,0.06); }
    &::-webkit-scrollbar-thumb { background: rgba(136,78,255,0.6); border-radius: 10px; }
  }

  /* Desktop: start hidden to avoid flash before progressive reveal */
  @media (min-width: 769px) {
    opacity: 0;
    transform: translateY(10px);
    will-change: opacity, transform;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  height: 100dvh; /* фиксируем высоту экрана для стабильного Flip */
  padding: 12px 10px calc(18px + env(safe-area-inset-bottom, 0px));
  overflow-y: auto; /* скролл внутри, чтобы не прыгал родитель */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  /* Стартовое состояние для плавного входа (мобильный) */
  opacity: 0;
  transform: translateY(12px) scale(.98);
  will-change: opacity, transform;
  }
`

const AboutLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
  width: 100%;
  padding-left: 18px;
  border-left: 2px solid rgba(136, 78, 255, 0.6);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: -1px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, rgba(136,78,255,0.0), rgba(136,78,255,0.9), rgba(136,78,255,0.0));
    filter: blur(0.3px);
    opacity: 0.9;
    pointer-events: none;
  }
`

// Hover-оверлей для карточки «Контакты»: 3 вертикальные зоны (Telegram / WhatsApp / Email)
const ContactsHoverOverlay = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: none; /* показываем только на hover карточки на десктопе */
  /* Поверх глобального Dither (который поднимается до z-index:900 классом .front) */
  z-index: 950;
  pointer-events: none; /* не перехватываем клики — открытие карточки работает как раньше */
  @media (max-width: 768px) {
    display: none !important;
  }

  ${Card}:hover & {
    display: flex;
  }

  flex-direction: column;
`

const HoverZone = styled.div`
  flex: 1 0 33.3333%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative; /* for centering absolute content on hover */
  pointer-events: auto; /* чтобы ловить hover внутри зон */
  cursor: pointer;
  /* Разделители между зонами */
  & + & { border-top: 1px solid rgba(255, 255, 255, 0.18); }
`

const IconCircle = styled.div`
  /* Wrapper only for hover-scale; no visible frame */
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, opacity 0.2s ease;
  will-change: transform;
  background: transparent;
  border: none;
  img {
    width: clamp(36px, 4vw, 56px);
    height: clamp(36px, 4vw, 56px);
    display: block;
    opacity: 1;
    /* Force logos to render white regardless of original colors */
    filter: brightness(0) saturate(100%) invert(1) contrast(1000%);
    mix-blend-mode: normal;
  }
  ${HoverZone}:hover & {
    transform: scale(1.06);
  }
  /* Email zone special hover: hide the icon */
  ${HoverZone}[data-type="email"]:hover & {
    opacity: 0;
    visibility: hidden;
    transform: translateY(-6px) scale(0.94);
  }
`

// Masked glyph to force solid white icons regardless of original SVG colors
const IconGlyph = styled.div`
  width: clamp(48px, 6vw, 84px);
  height: clamp(48px, 6vw, 84px);
  background: ${(p) => p.$color || '#fff'};
  /* Standard and WebKit masks for broader support */
  -webkit-mask: url(${(p) => p.$src}) center / contain no-repeat;
  mask: url(${(p) => p.$src}) center / contain no-repeat;
  pointer-events: none;
`

const IconLabel = styled.div`
  font-size: clamp(11px, 1.2vw, 13px);
  line-height: 1;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: 0.01em;
  user-select: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  /* Email zone special hover: hide the label */
  ${HoverZone}[data-type="email"]:hover & {
    opacity: 0;
    visibility: hidden;
    transform: translateY(-6px);
  }
`

const ContactStack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: transform 0.2s ease, gap 0.2s ease;
  will-change: transform;
  /* Email zone special hover: grow the contact details */
  ${HoverZone}[data-type="email"]:hover & {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1.18);
  z-index: 1;
    gap: 6px;
  }
`

const ContactsLink = styled.a`
  font-size: clamp(11px, 1.1vw, 13px);
  color: rgba(255, 255, 255, 0.92);
  text-decoration: underline;
  line-height: 1.15;
  &:hover { opacity: 1; }
  transition: font-size 0.2s ease, opacity 0.2s ease;
  /* Email zone special hover: increase font size and weight */
  ${HoverZone}[data-type="email"]:hover & {
    font-size: clamp(14px, 1.6vw, 18px);
    font-weight: 600;
  }
`

const AboutTitle = styled.h2`
  font-size: clamp(28px, 4vw, 48px);
  font-weight: 500;
  color: #fff;
  margin: 0 0 6px 0;
  text-align: left;
`

const AboutTitleUnderline = styled.span`
  display: block;
  height: 3px;
  width: 120px;
  margin-top: 8px;
  background: linear-gradient(90deg, rgba(136,78,255,0.0), rgba(136,78,255,1), rgba(136,78,255,0.0));
  transform-origin: left center;
  transform: scaleX(0);
`

const AboutSubheading = styled.h3`
  font-size: clamp(18px, 2.6vw, 24px);
  font-weight: 500;
  color: #fff;
  margin: 18px 0 6px 0;
  text-align: left;
`

const AboutCaption = styled.div`
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.6);
  margin: 10px 0 4px 0;
`

const AboutText = styled.div`
  color: rgba(255,255,255,0.92);
  font-size: clamp(14px, 1.6vw, 18px);
  line-height: 1.75;
  max-width: 70ch;
  text-align: left;

  p { margin: 0 0 12px 0; }

  ul {
    margin: 0 0 12px 18px;
    padding: 0;
  }

  li { margin: 6px 0; }
`

// FAQ (Вопрос-ответ) — раскрывающиеся списки для модалки "О себе"
const FAQAccordion = styled.div`
  width: 100%;
  margin: 12px 0 0 0;
  padding: 0;

  details {
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding: 0;
  }
  details:last-child { border-bottom: none; }

  summary {
    list-style: none;
    cursor: pointer;
    padding: 14px 0;
    font-weight: 500;
    color: #fff;
    font-size: 1.05rem;
    outline: none;
    user-select: none;
    transition: color .25s ease;
  }
  summary::-webkit-details-marker { display: none; }
  summary::marker { content: ''; }
  summary:hover { color: #b9a8ff; }
  details[open] summary { color: #b9a8ff; }

  .faq-content { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .3s ease; }
  details[open] .faq-content { grid-template-rows: 1fr; }
  .faq-content-inner { overflow: hidden; }

  .faq-answer { padding: 0 0 14px 0; color: rgba(255,255,255,0.8); }
  .faq-answer p { margin: 0 0 10px 0; line-height:1.55; }
  .faq-answer ul { margin: 8px 0 2px 18px; }
  .faq-answer li { margin: 4px 0; }
`

// Light purple accented variant (renamed but keeping component name to avoid ref changes)
const FAQAccordionGreen = styled(FAQAccordion)`
  details {
    border-color: rgba(150, 130, 255, 0.35);
  }
  details[open] {
    background: rgba(150, 130, 255, 0.10);
    border-color: rgba(150, 130, 255, 0.6);
  }
  summary { text-align: left; }
  .faq-answer { text-align: left; }
  summary::before {
    background: linear-gradient(180deg, rgba(150,130,255,0.35), rgba(150,130,255,0.15));
    box-shadow: inset 0 0 0 1px rgba(150,130,255,0.55);
  }
`

const AboutRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  /* Keep the photo visible; let it parallax via transform */
  @media (min-width: 769px) {
    position: sticky;
    top: 24px; /* match AboutModalContent padding */
    align-self: start;
  }
  /* Hide on mobile - we show carousel inline in left column */
  @media (max-width: 1024px) {
    display: none;
  }
`

// Полароидный карусель для мобильной версии (показывается в левой колонке)
const MobilePolaroidCarousel = styled.div`
  position: relative;
  width: 100%;
  margin: 16px 0 24px;
  overflow: hidden;
  @media (min-width: 1025px) { 
    display: none; 
  }
`

// Полароидный карусель для десктопной версии (показывается в правой колонке)
const DesktopPolaroidCarousel = styled.div`
  position: relative;
  width: 100%;
  max-width: 720px; /* Увеличено с 620px для больших карточек */
  @media (max-width: 1024px) { 
    display: none; 
  }
`

const PolaroidStack = styled.div`
  position: relative;
  width: 100%;
  height: 640px; /* Увеличено с 520px для размещения больших карточек */
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px; /* Увеличили перспективу для больших карточек */
  perspective-origin: center;
  
  @media (max-width: 1024px) {
    height: 320px;
  }
`

const PolaroidCard = styled.div`
  position: absolute;
  width: 480px; /* Увеличено с 380px */
  height: 580px; /* Увеличено с 460px */
  background: rgba(255, 255, 255, 0.95);
  border-radius: 4px;
  padding: 25px 25px 25px 25px; /* Увеличили padding пропорционально */
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transform-origin: center bottom;
  transition: transform 0.45s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s ease; /* только необходимые свойства */
  cursor: pointer;
  /* Уменьшаем давление на композитор: will-change только у активной карточки (через класс) */
  &.is-active { will-change: transform, opacity; }
  contain: layout paint size; /* Ограничиваем зону перерисовки */
  backface-visibility: hidden;
  perspective: 1000px;

  /* Мобильная версия: делаем карточки больше относительно экрана */
  @media (max-width: 768px) {
    width: 96vw;
    height: min(calc(96vw * 1.25), 82vh); /* чуть выше и больше */
    padding: 14px 14px 14px 14px;
  }

  @media (max-width: 768px) {
    &.mobile-card.is-active {
      transform: translateX(0) translateY(0) translateZ(0) scale(1.04) !important; /* лёгкий акцент */
    }
  }
  
  /* Мобильная анимация: карточка уходит назад после свайпа/тапа */
  &.mobile-card.leaving {
    transition: transform 0.5s cubic-bezier(0.65,0,0.35,1), opacity 0.45s ease;
    transform: translateX(-140%) translateY(-10px) rotate(-7deg) scale(0.9) !important;
    opacity: 0;
    z-index: 300 !important;
  }
  
  /* Эффекты поверх только для активной (экономим перерисовку) */
  &.is-active::before {
    content: '';
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.10), transparent 55%),
      radial-gradient(circle at 80% 70%, rgba(160, 82, 45, 0.08), transparent 55%),
      linear-gradient(45deg, rgba(210, 180, 140, 0.05), transparent);
    border-radius: inherit;
    pointer-events: none;
    mix-blend-mode: multiply;
  }
  &.is-active::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 25% 25%, rgba(255,255,255,0.12) 1px, transparent 1px),
      radial-gradient(circle at 75% 75%, rgba(0,0,0,0.06) 1px, transparent 1px);
    background-size: 4px 4px, 6px 6px;
    border-radius: inherit;
    opacity: 0.45;
    pointer-events: none;
    mix-blend-mode: overlay;
  }
  
  @media (max-width: 1024px) {
    width: 240px;
    height: 290px;
    padding: 12px 12px 12px 12px; /* Равномерный padding на мобильных */
  }
  
  /* Активная карточка */
  &.is-active {
    transform: translateZ(20px) rotateY(0deg) rotateX(0deg);
    z-index: 10;
    opacity: 1;
  }
  
  /* Предыдущие карточки (стек сзади) */
  &.is-prev-1 {
    transform: translateZ(-15px) rotateY(-2deg) rotateX(1deg) translateX(-20px);
    z-index: 9;
    opacity: 0.85;
  }
  
  &.is-prev-2 {
    transform: translateZ(-30px) rotateY(-4deg) rotateX(2deg) translateX(-35px);
    z-index: 8;
    opacity: 0.7;
  }
  
  &.is-prev-3 {
    transform: translateZ(-45px) rotateY(-6deg) rotateX(3deg) translateX(-50px);
    z-index: 7;
    opacity: 0.55;
  }
  
  /* Следующие карточки */
  &.is-next-1 {
    transform: translateZ(-15px) rotateY(2deg) rotateX(1deg) translateX(20px);
    z-index: 9;
    opacity: 0.85;
  }
  
  &.is-next-2 {
    transform: translateZ(-30px) rotateY(4deg) rotateX(2deg) translateX(35px);
    z-index: 8;
    opacity: 0.7;
  }
  
  &.is-next-3 {
    transform: translateZ(-45px) rotateY(6deg) rotateX(3deg) translateX(50px);
    z-index: 7;
    opacity: 0.55;
  }
  
  /* Скрытые карточки */
  &.is-hidden {
    transform: translateZ(-70px) rotateY(10deg) rotateX(5deg) translateX(80px);
    z-index: 1;
    opacity: 0;
  }
`

const PolaroidPhoto = styled.img`
  width: 100%;
  height: 92%;
  object-fit: cover;
  display: block;
  border: 1px solid rgba(0,0,0,0.1);
  background: #f0f0f0;
  opacity: 0;
  transition: opacity .35s ease;
  &.is-ready { opacity: 1; }
  pointer-events: none;
  user-select: none;
  backface-visibility: hidden;
  transform: translateZ(0); /* форсируем слой */
  /* Ken Burns анимация отключена */
`

/* Убираем компонент PolaroidCaption полностью */

const CarouselControls = styled.div`
  position: absolute;
  bottom: -60px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 12px;
  z-index: 20;
  
  @media (max-width: 1024px) {
    bottom: -50px;
  }
`

const ControlDot = styled.button`
  width: 12px;
  height: 12px;
  border: 2px solid rgba(136, 78, 255, 0.6);
  background: ${p => p.$active ? 'rgba(136, 78, 255, 0.9)' : 'rgba(136, 78, 255, 0.2)'};
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.2);
    background: rgba(136, 78, 255, 0.8);
  }
  
  &:active {
    transform: scale(0.95);
  }
`

const AboutPhoto = styled.img`
  max-width: min(520px, 40vw);
  width: 100%;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 30px 80px rgba(35, 0, 70, 0.65)) drop-shadow(0 12px 28px rgba(0,0,0,0.55));
  user-select: none;
  pointer-events: none;

  @media (max-width: 1024px) {
    max-width: 82vw;
    margin: 12px auto 0;
  }
`

const FilmGrainOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: overlay;
  opacity: 0.12;
  background-image: radial-gradient(rgba(255,255,255,0.06) 0.8px, transparent 0.8px);
  background-size: 3px 3px;
  filter: contrast(120%);
  border-radius: 4px;
`

// Модалка проектов
const ProjectsModalWrap = styled.div`
  position: relative;
  width: 100%;
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden; /* не даём вертикально скроллить страницу */
  padding: 72px 16px 12px; /* опускаем блок ниже: увеличили верхний отступ */
  
  /* Desktop: start hidden to avoid flash before progressive reveal */
  @media (min-width: 769px) {
    opacity: 0;
    transform: translateY(10px);
    will-change: opacity, transform;
  }
  
  @media (max-width: 1024px) {
    height: auto;
    min-height: 100dvh;
    overflow: auto; /* на мобильных даём скроллить вертикально */
    -webkit-overflow-scrolling: touch;
    padding: 56px 12px calc(12px + env(safe-area-inset-bottom, 0px));
  }
`

const ProjectsHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 12px;
`

const ProjectsTitle = styled.h2`
  font-size: clamp(28px, 4vw, 48px);
  font-weight: 500;
  color: #fff;
  margin: 0;
`

const ProjectsSubtitle = styled.div`
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.6);
`

// Услуги: стили модалки и карточек прайсинга
const ServicesModalWrap = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 16px 16px;
  pointer-events: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;

  /* Desktop: всегда внутренняя прокрутка (фиксированная высота) */
  @media (min-width: 769px) {
    height: 100vh;
    overflow-y: auto;
    scrollbar-gutter: stable both-edges;
    padding-bottom: 140px; /* запас, чтобы нижний контент (FAQ/подписка) не прилипал к краю */
    /* Зелёный минималистичный скроллбар */
    scrollbar-width: thin;
    scrollbar-color: rgba(34,197,94,0.8) rgba(255,255,255,0.06);
    &::-webkit-scrollbar { width: 10px; }
    &::-webkit-scrollbar-track { background: rgba(255,255,255,0.06); }
    &::-webkit-scrollbar-thumb { background: linear-gradient(180deg, rgba(34,197,94,0.9), rgba(16,122,55,0.85)); border-radius: 10px; box-shadow: 0 0 0 1px rgba(0,0,0,0.4) inset; }
    &::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, rgba(34,197,94,1), rgba(18,140,63,0.95)); }
    &::-webkit-scrollbar-corner { background: transparent; }
    /* Плавное появление при загрузке */
    opacity: 0;
    transform: translateY(10px);
    will-change: opacity, transform;
  }

  /* Mobile: прежнее поведение (нативный скролл) */
  @media (max-width: 768px) {
    height: auto;
    min-height: 100dvh;
    padding: 12px 0 calc(16px + env(safe-area-inset-bottom, 0px));
    gap: 12px;
    overflow: auto;
  }
`

// Subscription explainer styled to match the About modal info look (left accent line, clean text)
const SubscriptionIntro = styled.div`
  position: relative;
  color: #fff;
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0 0 0 18px; /* space for left accent */
  margin: 8px 0 12px 0;
  text-align: left;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
  /* dark green accent */
  background: linear-gradient(180deg, rgba(16,128,96,0.0), rgba(16,128,96,0.95), rgba(16,128,96,0.0));
    filter: blur(0.3px);
    opacity: 0.9;
    pointer-events: none;
  }
`

const IntroTitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 8px;
  h4 { margin: 0; font-size: clamp(18px, 2.6vw, 24px); font-weight: 500; }
`

const IntroPill = styled.span`
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.6);
  white-space: nowrap;
  position: relative;
  padding-left: 0;
  &:not(:first-of-type)::before { content: '•'; margin: 0 8px; color: rgba(255,255,255,0.4); }
`

const IntroGrid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr;

  @media (max-width: 560px) { grid-template-columns: 1fr; }
`

const IntroItem = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 2px 0;
  border: none;
  background: transparent;
`

const IconBubble = styled.div`
  font-size: 16px; line-height: 1; width: auto; height: auto; background: transparent;
`

// Narrative body for subscription intro (mirrors AboutText sizing/color)
const IntroBody = styled.div`
  color: rgba(255,255,255,0.92);
  font-size: clamp(14px, 1.6vw, 18px);
  line-height: 1.75;
  max-width: 70ch;
  text-align: left;

  p { margin: 0 0 10px 0; }
`

const PricingHeader = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 8px; margin: 48px 0 8px;
  h3 { margin: 0; font-size: clamp(22px, 3.2vw, 32px); font-weight: 500; color: #fff; text-align: center; }
`

const SwitchRow = styled.div`
  display: inline-flex; align-items: center; gap: 12px; user-select: none;
  .arrow { width: 32px; height: 32px; display: grid; place-items: center; cursor: pointer; color: #fff; opacity: 0.8; border: 1px solid rgba(255,255,255,0.18); border-radius: 8px; background: rgba(255,255,255,0.06); }
  .arrow:hover { opacity: 1; background: rgba(255,255,255,0.1); }
  .label { margin: 0; font-size: clamp(22px, 3.2vw, 32px); font-weight: 500; color: #fff; text-align: center; }
`

const TabsRow = styled.div`
  display: inline-flex; gap: 8px; align-items: center; justify-content: center; flex-wrap: wrap;
`

const TabButton = styled.button`
  padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.18);
  background: rgba(255,255,255,0.06); color: #fff; cursor: pointer; font-size: 14px;
  transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
  &[aria-selected="true"] { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.28); }
  &:hover { background: rgba(255,255,255,0.1); }
`

const HeadingsRow = styled.div`
  display: inline-flex; gap: 16px; align-items: baseline; justify-content: center; flex-wrap: wrap;
  position: relative; padding-bottom: 8px;
  
  @media (min-width: 769px) {
    display: inline-flex !important;
  }
  
  @media (max-width: 768px) {
    display: none !important;
  }
`

const HeadingTab = styled.h3`
  position: relative;
  margin: 0; font-size: clamp(20px, 4vw, 24px); font-weight: 500; color: #fff; opacity: 0.7; cursor: pointer;
  padding-bottom: 8px; user-select: none; border: none; text-decoration: none;
  white-space: nowrap;
  &::after { content: ''; position: absolute; left: 0; right: auto; bottom: 0; height: 2px; width: 0; background: rgba(255,255,255,0.85); transition: width 0.25s ease; }
  &[data-active="true"] { opacity: 1; }
  &[data-active="true"]::after { width: 100%; }
`

const TabIndicator = styled.div`
  display: none;
`

const CarouselTabs = styled.div`
  display: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px 8px;

  @media (max-width: 768px) {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    padding: 6px;
    background: rgba(0,0,0,0.14);
  }

  .tab {
    width: auto;
    text-align: center;
    opacity: 0.7;
    transform-origin: center;
    transition: transform 0.18s ease, opacity 0.18s ease;
    position: relative;
    padding-bottom: 8px;
    padding-left: 6px;
    padding-right: 6px;
    flex: 0 0 auto;
  }

  .tab::after {
    content: '';
    position: absolute;
    left: 12%;
    right: 12%;
    bottom: 4px;
    height: 3px;
    background: transparent;
    border-radius: 2px;
    transition: background 0.18s ease, transform 0.18s ease;
  }

  .tab.center {
    opacity: 1;
    transform: scale(1.02);
    z-index: 2;
  }

  .tab.center::after {
    background: rgba(255,255,255,0.95);
    transform: scaleX(1);
  }
`

const MobileProjectsNavigation = styled.div`
  display: none;
  
  @media (max-width: 768px) {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0; /* прижать кнопки друг к другу */
  padding: 12px 4px 18px;
    position: relative;
  }
`

const MobileNavIndicator = styled.div`
  display: none; /* нижнее подчеркивание скрыто по запросу */
`

const MobileServicesNavigation = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0; /* прижать кнопки друг к другу */
    padding: 12px 4px 18px;
    position: relative;
  }
`

const ServicesTierNavigation = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0;
    padding: 8px 4px 16px;
    position: relative;
  }
`

const TierNavButton = styled.button`
  position: relative;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.86);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.45s cubic-bezier(0.23, 1, 0.32, 1), 
              opacity 0.25s ease,
              transform 0.35s cubic-bezier(0.23, 1, 0.32, 1),
              box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
  min-width: 90px;

  /* subtle scan gradient similar to NavButton */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -120%;
    width: 220%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(0, 255, 255, 0.06),
      rgba(255, 0, 255, 0.05),
      transparent
    );
    pointer-events: none;
    animation: nav-scan 4s linear infinite;
    opacity: 0.7;
  }

  /* pixel flicker overlay */
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
        rgba(255, 0, 0, 0.02) 1px,
        rgba(255, 0, 0, 0.02) 2px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 1px,
        rgba(0, 255, 255, 0.015) 1px,
        rgba(0, 255, 255, 0.015) 2px
      );
    animation: nav-pixel-flicker 0.18s infinite alternate;
    pointer-events: none;
    opacity: 0.45;
  }

  &:hover {
    color: var(--black);
    background: var(--primary-red);
    border: none;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.35);
    &::before { animation-duration: 1s; opacity: 0.95; }
    &::after { opacity: 0.85; animation-duration: 0.12s; }
  }

  /* transient press coloring */
  &:active {
    transform: translateY(0) scale(0.985);
    background: var(--primary-red);
    border: none;
    color: var(--black);
  }

  /* persistent active state */
  &.active {
    color: var(--black);
    background: var(--primary-red);
    border: none;
    box-shadow: 0 6px 18px rgba(209,72,54,0.28), inset 0 1px 0 rgba(255,255,255,0.06);
    z-index: 2;
    
    /* Don't lift active button on hover */
    &:hover {
      transform: none;
      border: none;
      box-shadow: 0 6px 18px rgba(209,72,54,0.28), inset 0 1px 0 rgba(255,255,255,0.06);
    }
  }

  /* when an already-active button is pressed, show the full colored press state */
  &.active:active {
    background: var(--primary-red);
    color: var(--black);
    transform: translateY(0) scale(0.985);
    box-shadow: 0 10px 30px rgba(209, 72, 54, 0.32), 0 0 40px rgba(209, 72, 54, 0.18);
    &::before { opacity: 0.95; animation-duration: 0.9s; }
    &::after { opacity: 1; animation-duration: 0.08s; }
  }

  /* visual separator between flush buttons - removed to fix white stripes */
  /* &:not(:last-child) {
    box-shadow: inset -1px 0 0 rgba(255,255,255,0.06);
  } */

  /* Ripple effect */
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`

const NavButton = styled.button`
  position: relative;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.86);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 0; /* прямые углы у всех кнопок */
  transition: all 0.45s cubic-bezier(0.23, 1, 0.32, 1), 
              opacity 0.25s ease,
              transform 0.35s cubic-bezier(0.23, 1, 0.32, 1),
              box-shadow 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
  min-width: 90px;

  /* subtle scan gradient similar to EnterButton */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -120%;
    width: 220%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(0, 255, 255, 0.06),
      rgba(255, 0, 255, 0.05),
      transparent
    );
    pointer-events: none;
    animation: nav-scan 4s linear infinite;
    opacity: 0.7;
  }

  /* pixel flicker overlay */
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
        rgba(255, 0, 0, 0.02) 1px,
        rgba(255, 0, 0, 0.02) 2px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 1px,
        rgba(0, 255, 255, 0.015) 1px,
        rgba(0, 255, 255, 0.015) 2px
      );
    animation: nav-pixel-flicker 0.18s infinite alternate;
    pointer-events: none;
    opacity: 0.45;
  }

  &:hover {
    color: var(--black);
    background: var(--primary-red);
    border: none;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.35);
    &::before { animation-duration: 1s; opacity: 0.95; }
    &::after { opacity: 0.85; animation-duration: 0.12s; }
  }

  /* transient press coloring */
  &:active {
    transform: translateY(0) scale(0.985);
    background: var(--primary-red);
    border: none;
    color: var(--black);
  }

  /* subtle persistent active state (not filled) */
  &.active {
    /* Filled red like in the screenshot */
    color: var(--black);
    background: var(--primary-red);
    border: none;
    box-shadow: 0 6px 18px rgba(209,72,54,0.28), inset 0 1px 0 rgba(255,255,255,0.06);
    z-index: 2;
    
    /* Don't lift active button on hover */
    &:hover {
      transform: none;
      border: none;
      box-shadow: 0 6px 18px rgba(209,72,54,0.28), inset 0 1px 0 rgba(255,255,255,0.06);
    }
  }
  }

  /* when an already-active button is pressed, show the full colored press state */
  &.active:active {
  /* keep press state visible but not stronger than base active fill */
  transform: translateY(0) scale(0.985);
  box-shadow: 0 12px 36px rgba(209, 72, 54, 0.34), 0 0 50px rgba(209, 72, 54, 0.12);
  &::before { opacity: 1; animation-duration: 0.85s; }
  &::after { opacity: 1; animation-duration: 0.08s; }
  }

  /* visual separator between flush buttons - removed to fix white stripes */
  /* &:not(:last-child) {
    box-shadow: inset -1px 0 0 rgba(255,255,255,0.06);
  } */

  /* Add keyframes for nav effects */
  @keyframes nav-scan {
    0% {
      left: -120%;
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      left: 120%;
      opacity: 0;
    }
  }

  @keyframes nav-pixel-flicker {
    0% {
      opacity: 0.45;
      transform: translate(0, 0);
    }
    25% {
      opacity: 0.5;
      transform: translate(0.3px, 0);
    }
    50% {
      opacity: 0.4;
      transform: translate(-0.3px, 0.3px);
    }
    75% {
      opacity: 0.55;
      transform: translate(0, -0.3px);
    }
    100% {
      opacity: 0.45;
      transform: translate(-0.3px, 0);
    }
  }

  /* Ripple effect */
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`

// Show mobile list on small screens and hide desktop rows
const MobileProjectsList = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 4px 0 24px; /* убираем боковой сдвиг */
    margin: 0 auto;
    /* дополнительная стабильность центрирования */
    & > div { width: 100%; display: flex; justify-content: center; }
    & > div > ${'ProjectCard'} { margin: 0 auto; }
  }
`

const DesktopProjects = styled.div`
  display: block;
  @media (max-width: 768px) {
    display: none;
  }
`

const BadgePill = styled.div`
  font-size: 11px; padding: 4px 8px; border-radius: 999px; color: #fff;
  background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.28);
`

const Muted = styled.p`
  margin: 0; font-size: 13px; opacity: 0.8; text-align: ${p => (p.$alignLeft ? 'left' : 'center')}; color: #fff;
`

const PricingGrid = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 0; width: 100%;
  /* Single card layout: keep it pleasantly narrow on desktop */
  max-width: ${props => props.$single ? '820px' : (props.$narrow ? '1060px' : '100%')};
  margin: 0 auto;
  justify-items: ${props => (props.$center || props.$single) ? 'center' : 'stretch'};
  justify-content: center;
  
  @media (min-width: 1024px) { 
    grid-template-columns: ${props => {
      if (props.$center || props.$single) return '1fr'
      if (props.$cols === 2) return 'repeat(2, 1fr)'
      if (props.$cols === 4) return 'repeat(4, 1fr)'
      return 'repeat(3, 1fr)'
    }}; 
  }
  
  @media (max-width: 768px) {
    gap: 8px;
  /* Full-bleed on mobile: remove inner padding; parent offsets */
  padding: 0;
    justify-items: stretch;
  }
  
  /* убрать сплошную верхнюю линию из границ карточек */
  & > div:first-child { border-top: none; }
  @media (min-width: 1024px) { & > div:nth-child(-n+3) { border-top: none; } }
`

// Contacts modal styles
// Contacts modal styles - Creative futuristic design
const ContactsModalWrap = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 1000;

  @media (min-width: 769px) {
    opacity: 0;
    transform: translateY(10px);
    will-change: opacity, transform;
  }

  @media (max-width: 768px) {
    padding: 0;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    height: 100vh;
    overscroll-behavior: contain;
  }
`;

const ContactsMainTitle = styled.h2`
  position: absolute;
  /* Опущено чуть ниже (было 12px) по просьбе пользователя */
  top: calc(32px + env(safe-area-inset-top, 0px));
  left: 16px;
  margin: 0;
  font-size: clamp(24px, 5vw, 36px);
  font-weight: 500;
  color: #fff;

  @media (max-width: 768px) {
    top: calc(24px + env(safe-area-inset-top, 0px));
    left: 12px;
    z-index: 10;
  }
`;

const ContactsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 0;
  width: 100vw;
  /* Дополнительно опущены карточки ниже заголовка */
  height: calc(100vh - 120px); /* увеличили доступную высоту рядов (было 100vh-150px) */
  margin: 0;
  padding: 120px 0 0 0; /* уменьшили отступ сверху, чтобы ряды стали выше и нижние карты дошли до низа */
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, auto);
    gap: 1px;
  height: auto;
  /* Компактный режим: уменьшаем отступы чтобы все 4 карточки помещались без скролла */
  min-height: calc(100vh - 64px);
  padding-top: 104px; /* ещё больше пространства над карточками */
  padding-bottom: 32px; /* убрали крупный нижний отступ */
  }
`;

const ContactPortal = styled.a`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-decoration: none;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  transition: all 0.3s ease;
  cursor: pointer;
  width: 100%;
  height: 100%;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  
  &:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.2);
  }
  
  &:active {
    background: rgba(255,255,255,0.06);
  }
  
  &:focus {
    outline: 2px solid rgba(255,255,255,0.3);
    outline-offset: -2px;
  }
  
  /* Убираем border-radius для полноэкранного вида */
  border-radius: 0;
  
  @media (max-width: 768px) {
  /* Compact card sizing */
  min-height: 0;
  height: auto;
  padding: 16px 16px 18px;
  }
`;

const ContactIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  
  svg, img {
    width: 64px;
    height: 64px;
    filter: brightness(0) invert(1); /* Делает SVG белыми */
    transition: all 0.3s ease;
  }
  
  ${ContactPortal}:hover & {
    svg, img {
      transform: scale(1.1);
    }
  }
  
  @media (max-width: 768px) {
    font-size: 36px;
    margin-bottom: 12px;
    svg, img {
      width: 36px;
      height: 36px;
    }
  }
`;

const ContactContent = styled.div`
  text-align: center;
  position: relative;
  z-index: 2;
`;

const ContactTitle = styled.h3`
  font-size: 32px;
  font-weight: 500;
  color: #fff;
  margin: 0 0 16px 0;
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
  font-size: 18px;
  margin: 0 0 6px 0;
  }
`;

const ContactValue = styled.div`
  font-size: 20px;
  color: rgba(255,255,255,0.7);
  font-weight: 400;
  transition: all 0.3s ease;
  
  ${ContactPortal}:hover & {
    color: rgba(255,255,255,0.9);
  }
  
  @media (max-width: 768px) {
  font-size: 14px;
  }
`;

const CopyNotification = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 16px 32px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 16px;
  font-weight: 500;
  z-index: 10000;
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
  backdrop-filter: blur(20px);
  
  &.show {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.05);
  }
  
  &::before {
    content: '✓';
    margin-right: 8px;
    color: #4ade80;
    font-weight: bold;
  }
`;

const PricingCard = styled.div`
  text-align: left; border-radius: 0; padding: 14px; cursor: pointer; color: #fff;
  background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(2px);
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  display: flex; flex-direction: column; gap: 8px; height: 100%;

  /* Per-card accent (RGB string like "255,64,64").
     This replaces the old hardcoded purple highlight. */
  ${props => props.$accentRGB && `
    background: linear-gradient(180deg, rgba(${props.$accentRGB},0.12), rgba(0,0,0,0.28));
    border-color: rgba(${props.$accentRGB},0.45);
    /* No neon glow: keep only a subtle neutral shadow on hover via the default &:hover rule */
  `}

  @media (min-width: 1024px) {
  /* Desktop: только внутренние разделители — симметрично и без внешних краёв */
  border-left: none;
  border-right: none;
  /* Разделитель справа у 1-й и 2-й колонок (в каждой строке) */
  &:nth-child(3n+1),
  &:nth-child(3n+2) { border-right: 1px solid rgba(255,255,255,0.12); }
  /* 3-я колонка без правого края */
  }
  
  @media (max-width: 768px) {
    padding: 16px 14px;
    gap: 10px;
    border-radius: 0; /* прямые углы */
    margin-bottom: 0;
    border: 1px solid rgba(255,255,255,0.15);
    width: 100%; /* occupy full grid width */
    
    /* Restore individual borders on mobile (kept for lists; harmless for single card) */
    & + & { 
      border-left: 1px solid rgba(255,255,255,0.15); 
      margin-top: 0;
    }
  }
  
  &:hover { 
  border-color: rgba(255,255,255,0.28); 
  background: rgba(0,0,0,0.36); 
  box-shadow: 0 10px 26px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06) inset; 
  transform: translateY(-2px);
  }
  
  /* Keep the small lift for the currently selected tier */
  &.featured { 
  transform: translateY(-2px);
  }

  /* Non-selected tiers: show on desktop but subtly, hide on small screens */
  &.tier-hidden {
    opacity: 0.7;
    transform: scale(0.995);
    filter: saturate(0.9) brightness(0.95);
  }

  @media (max-width: 1023px) {
    &.tier-hidden { display: none; }
  }
`

const CardSectionTitle = styled.div`
  margin-top: 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.9);
  
  @media (max-width: 768px) {
    margin-top: 8px;
    font-size: 11px;
    letter-spacing: 0.1em;
  }
`

const SectionBlock = styled.div`
  min-height: ${props => props.$minHeight ? `${props.$minHeight}px` : 'auto'};
`
const SelectButton = styled.button`
  padding: 12px 18px; font-size: 15px; border: 2px solid var(--primary-red);
  background: var(--primary-red); color: var(--black); cursor: pointer; border-radius: 0;
  transition: transform 0.12s ease, box-shadow 0.2s ease, background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  &:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(0,0,0,0.35) }
  &:active { transform: translateY(0) scale(0.985) }
  .btn-text { display: block; }
  .btn-subtext { display: block; font-size: 12px; opacity: 0.85; line-height: 1.15; margin-top: 2px; }
  
  ${props => props.$variant === 'outline' && `
    background: transparent; color: #fff; border-color: rgba(255,255,255,0.7);
    &:hover { background: rgba(255,255,255,0.12); }
  `}
  ${props => props.$variant === 'contrast' && `
    background: #FFD400; color: #111; border-color: #FFD400;
    &:hover { background: #ffde33; }
  `}
  ${props => props.$variant === 'white' && `
    background: #fff; color: #111; border-color: #fff;
    &:hover { background: #f7f7f7; }
  `}
`
const RightCol = styled.div`
  display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex: 0 0 auto; /* don't consume width */
  @media (max-width: 768px) {
    align-items: center;
    width: 100%;
  }
`
const PricingHead = styled.div`
  display: flex; flex-direction: column; gap: 8px; flex: 1 1 auto; /* let left side expand */
  h4 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
  p { margin: 0; font-size: 13px; opacity: 0.85; max-width: none; }

  @media (max-width: 768px) {
    gap: 6px;
    h4 { font-size: 17px; }
    p { font-size: 13px; line-height: 1.4; }
  /* Stretch header block to full card width on mobile so the price+button row spans the right edge */
  width: 100%;
  align-self: stretch;
  }
`

const PricingTop = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
`

const TopPrice = styled.div`
  display: flex; align-items: baseline; gap: 8px; white-space: nowrap;
  align-self: flex-start; margin-top: -8px;
  .amount { font-size: 30px; font-weight: 800; line-height: 1; }
  .period { font-size: 12px; opacity: 0.8; line-height: 1; position: relative; top: 0; }

  @media (max-width: 768px) {
    margin-top: 0;
    align-self: flex-start;
    .amount { font-size: 26px; }
    .period { font-size: 12px; }
  }
`

/* Price under the title on desktop */
const HeadingPrice = styled(TopPrice)`
  margin-top: 2px;
  @media (max-width: 1023px) { display: none; }
`

/* Mobile price under title */
const MobilePriceUnderTitle = styled(TopPrice)`
  margin-top: 4px;
  @media (min-width: 1024px) { display: none; }
  .amount { font-size: 24px; }
  .period { font-size: 11px; }
  /* Make it flex to allow button on the right */
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

/* Mobile price text wrapper */
const MobilePriceText = styled.div`
  display: flex; 
  align-items: baseline; 
  gap: 8px; 
  white-space: nowrap;
`

const PriceRow = styled.div`
  display: flex; align-items: baseline; gap: 6px;
  .amount { font-size: 24px; font-weight: 500; }
  .period { font-size: 12px; opacity: 0.8; }
`

/* Desktop-only confirm button styled like CloseButton */
const ConfirmButton = styled(CloseButton)`
  position: relative;
  top: 0; right: 0; left: 0; bottom: 0;
  width: 44px; height: 44px;
  z-index: 3; /* above decorations within card header */
  @media (max-width: 1023px) { display: none; }
  /* Desktop: no vertical offset */
  transform: none;

  /* compact state: only the icon is visible; label removed from layout */
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: width 180ms ease, background 180ms ease, color 180ms ease, border-color 180ms ease;

  .icon { opacity: 1; transition: opacity 140ms ease; }
  .label { 
    position: absolute; 
    opacity: 0; 
    pointer-events: none; 
    white-space: nowrap; 
    font-size: 14px; 
    transition: opacity 140ms ease; 
  }

  &.is-next { 
    width: 112px; 
    background: var(--primary-red); 
    color: var(--black); 
    border-color: var(--primary-red);
    justify-content: center;
  /* Keep position unchanged in next state on desktop */
  transform: none;
  }
  &.is-next .icon { display: none; }
  &.is-next .label { position: static; opacity: 1; pointer-events: auto; }
`

const MobileOnly = styled.div`
  @media (min-width: 1024px) { display: none; }
`

const DesktopOnly = styled.div`
  @media (max-width: 1023px) { display: none; }
`

// Reserve space for morphing button to avoid layout shift
const ConfirmSlot = styled.div`
  width: 112px; /* equals expanded width of ConfirmButton */
  height: 44px; /* updated to match new button height */
  display: inline-flex;
  align-items: center;
  justify-content: flex-end; /* align the small 44px button to the right edge */
`

// Mobile version of confirm button
const MobileConfirmButton = styled(CloseButton)`
  position: relative;
  top: 0; right: 0; left: 0; bottom: 0;
  width: 44px; height: 44px;
  z-index: 3; /* ensure above potential decorative overlays */
  @media (min-width: 1024px) { display: none; }
  /* Поднимаем кнопку умеренно для мобильной версии */
  transform: translateY(-15px);

  /* compact state: only the icon is visible; label removed from layout */
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: width 180ms ease, background 180ms ease, color 180ms ease, border-color 180ms ease;

  .icon { opacity: 1; transition: opacity 140ms ease; }
  .label { 
    position: absolute; 
    opacity: 0; 
  pointer-events: none; /* keep clicks on the button element */ 
    white-space: nowrap; 
    font-size: 14px; 
    transition: opacity 140ms ease; 
  }

  &.is-next { 
    width: 112px; 
    background: var(--primary-red); 
    color: var(--black); 
    border-color: var(--primary-red);
    justify-content: center;
    transform: translateY(-15px);
  }
  &.is-next .icon { display: none; }
  &.is-next .label { position: static; opacity: 1; pointer-events: auto; }
`

// Mobile version of confirm slot
const MobileConfirmSlot = styled.div`
  width: 112px; /* equals expanded width of MobileConfirmButton */
  height: 44px; /* updated to match new button height */
  display: inline-flex;
  align-items: center;
  justify-content: flex-end; /* align the small 44px button to the right edge */
  @media (min-width: 1024px) { display: none; }
`

const Bullets = styled.ul`
  list-style: none; padding: 0; margin: 8px 0 0 0; display: grid; gap: 8px;
  li { font-size: 13px; opacity: 0.95; position: relative; padding-left: 16px; }
  li::before { content: '✓'; position: absolute; left: 0; top: 0; color: rgba(255,255,255,0.9); font-size: 14px; line-height: 1; }
  
  @media (max-width: 768px) {
    gap: 6px;
    margin: 6px 0 0 0;
    li { 
      font-size: 13px; 
      line-height: 1.4; 
      padding-left: 18px; 
    }
    li::before { 
      font-size: 13px; 
    }
  }
  
  /* термины с подсказками */
  .term { text-decoration: underline dotted; text-underline-offset: 2px; cursor: help; position: relative; }
  .term::after {
    content: attr(data-hint);
    position: absolute; left: 0; bottom: 100%;
    transform: translateY(6px);
    background: rgba(0,0,0,0.9);
    border: 1px solid rgba(255,255,255,0.18);
    color: #fff; padding: 8px 16px; border-radius: 8px;
    white-space: normal; width: max-content; max-width: 320px;
    opacity: 0; pointer-events: none;
    transition: opacity 0.15s ease, transform 0.15s ease;
    z-index: 5;
  }
  .term:hover::after, .term:focus::after, .term.is-open::after { opacity: 1; transform: translateY(0); }
  .term:focus { outline: none; }
  @media (pointer: coarse) {
    .term { cursor: pointer; }
  }
  
  @media (max-width: 768px) {
    .term::after {
      max-width: 280px;
      padding: 6px 12px;
      font-size: 12px;
  z-index: 20;
    }
  }
`

// Tooltip dictionary for complex terms in features
// Specific phrases (basic package) first to ensure they match before generic fallbacks
const TERM_HINTS = {
  'адаптивная верстка под все устройства': 'Сайт одинаково удобно открывается на телефоне, планшете и компьютере.',
  'подключение аналитики': 'Можно видеть, кто заходит на сайт, откуда и что они делают (Яндекс.Метрика/GA).',
  'базовое seo': 'Сайт быстрее грузится и лучше понимается поисковиками (теги, скорость загрузки).',
  'кросс-браузерное тестирование': 'Сайт работает одинаково хорошо в Chrome, Safari, Firefox и других браузерах.',
  'ssl и базовая защита данных': 'Сайт открывается по безопасному протоколу https:// и не пугает пользователей.',
  'развертывание на сервере': 'Сайт будет загружен и настроен на хостинге, доступен по домену.',
  '1 месяц поддержки': 'Если всплывут ошибки, я их исправлю бесплатно в течение месяца (только багфиксы).',

  // Standard package specific
  'анимации: от базовых скроллов': 'Сайт оживает: плавные появления, движения и при желании зрелищные спецэффекты.',
  'crm/база данных + админ-панел': 'Удобный личный кабинет, где можно управлять заявками, клиентами и контентом.',
  'калькуляторы, формы заявок, квизы': 'Интерактивные инструменты, чтобы пользователи оставляли данные или считали стоимость услуг.',
  'платёжные системы': 'Приём онлайн-оплат прямо на сайте, без лишних движений.',
  'личный кабинет клиента/администратора': 'Пользователь видит свои заказы/услуги, админ управляет всем сайтом в одном месте.',
  'email/мессенджер-уведомления': 'Автоматические письма или сообщения клиентам и администратору о заказах и событиях.',

  // Pro package specific
  'сложная логика: чаты': 'Сайт работает как полноценное приложение: онлайн‑чаты, умные функции и готовность к высоким нагрузкам.',
  'полная seo': 'Сайт полностью подготавливается к продвижению: структура, скорость, мета‑теги, микроразметка, тексты.',
  'мультиязычность (2 языка)': 'Сайт сразу доступен для разных стран и аудиторий.',
  'интеграции с crm/erp/облачными сервисами': 'Обмен данными между сайтом и бизнес‑системами (Bitrix24, AmoCRM, SAP и др.), без ручной рутины.',
  'базовое нагрузочное тестирование': 'Проверка, выдержит ли сайт большие наплывы посетителей: скорость и стабильность под трафиком.',
  'документация и инструкции для клиента': 'Простая инструкция для работы с сайтом + подробная техдокументация для разработчиков при необходимости.',
  'faq и сценарии вопросов-ответов': 'Бот сам отвечает на частые вопросы.',
  'формы заявок с уведомлениями в чат/email': 'Заявки от пользователей приходят напрямую вам.',
  'простые сценарии (квиз, калькулятор, меню)': 'Мини-диалоги для вовлечения и сбора данных.',
  'простые сценарии': 'Мини-диалоги для вовлечения и сбора данных.',
  'интеграция с google sheets или crm': 'Данные автоматически сохраняются в таблицу или CRM.',
  'базовая статистика (заявки, активность пользователей)': 'Отслеживание заявок и активности.',
  'развёртывание и настройка': 'Бот полностью готов к работе «под ключ».',
  'приём платежей: карты, сбп, подписки, возвраты': 'Бот принимает оплату и оформляет подписки.',
  'приём платежей (карты, сбп, криптовалюта, подписки, возвраты)': 'Максимальная гибкость в оплатах (карты, СБП, криптовалюта, подписки, возвраты).',
  'админ-панель прямо в боте': 'Удобное управление контентом и заказами прямо из мессенджера.',
  'личный кабинет клиента': 'Пользователь видит свои заказы, подписки и оплаты.',
  'рассылки и уведомления без ограничений': 'Массовые сообщения клиентам в пару кликов.',
  'интеграции с crm и базами данных': 'Синхронизация с учётом заказов и клиентов.',
  'полноценное telegram mini app': 'Бот превращается в приложение внутри Telegram.',
  'современный ui/ux дизайн': 'Интерфейс как у мобильного приложения: удобный и понятный.',
  'расширенная аналитика и статистика по пользователям': 'Отслеживание поведения и сегментация аудитории.',
  'push/уведомления внутри telegram': 'Напоминания и новости прямо в мессенджере.',

  // Generic fallbacks (remain after specifics)
  'ssl': 'SSL — шифрование соединения и сертификат HTTPS для безопасности трафика.',
  'seo': 'SEO — оптимизация сайта для поиска: мета‑теги, структура, скорость, индексация.',
  'crm': 'CRM — система для учёта лидов/клиентов и автоматизации продаж.',
  'erp': 'ERP — система планирования ресурсов предприятия и внутренних процессов.',
  'cloudpayments': 'CloudPayments — платёжный шлюз для приема оплат картами и подписок.',
  'юkassa': 'ЮKassa — популярный платёжный сервис для приёма оплат онлайн.',
  'сбп': 'СБП — Система быстрых платежей, мгновенные переводы по QR/ссылке.',
  'websocket': 'WebSockets — двусторонняя связь в реальном времени без перезагрузок.',
  'websockets': 'WebSockets — двусторонняя связь в реальном времени без перезагрузок.',
  'webhooks': 'Webhooks — события от внешних сервисов, приходящие HTTP‑запросом.',
  'api': 'API — программный интерфейс для интеграций с другими системами.',
  'rest api': 'REST API — стандартные HTTP‑методы/формат для интеграции сервисов.',
  'etl': 'ETL — Extract‑Transform‑Load: загрузка, преобразование и перенос данных.',
  'админ-панел': 'Админ‑панель — раздел для управления контентом и настройками.',
  'личный кабинет': 'Личный кабинет — персональный раздел пользователя с данными и действиями.',
  'нагрузоч': 'Нагрузочное тестирование — проверка производительности под трафиком.',
  'аналитик': 'Аналитика — Метрика/GA: отслеживание посещаемости и конверсий.',
  'мультиязыч': 'Мультиязычность — поддержка нескольких языков интерфейса/контента.',
  'email': 'Email‑уведомления — автоматические письма о событиях и статусах.',
}

const ServiceActions = styled.div`
  margin-top: 8px; display: flex; gap: 10px;
  button { font-size: 12px; padding: 6px 10px; border-radius: 10px; cursor: pointer; }
  .primary { color: #fff; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.28); }
  .secondary { color: #fff; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.18); }
  
  @media (max-width: 768px) {
    margin-top: 12px;
    gap: 8px;
    button { 
      font-size: 13px; 
      padding: 8px 14px; 
      border-radius: 8px;
      min-height: 40px;
      flex: 1;
    }
  }
`

const Divider = styled.hr`
  border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 8px 0;
`

// Comparison table for subscription plans
const ComparisonTable = styled.div`
  width: 100%;
  max-width: 1060px; /* narrow and centered */
  margin: 8px 0 16px;
  /* Do not allow inner scrolling; the page will scroll instead */
  overflow: hidden;
  position: relative; /* enable shadow backdrop */
  isolation: isolate; /* keep pseudo-element beneath content */

  /* Subtle shadow under the whole table for contrast */
  &::before {
    content: '';
    position: absolute;
    inset: 0; /* keep within container to avoid triggering scrollbars */
    border-radius: 14px;
    pointer-events: none;
    z-index: 0;
    /* soft radial shadow with a light blur */
    background: radial-gradient(60% 60% at 50% 40%, rgba(0,0,0,0.28), rgba(0,0,0,0.0) 70%);
    filter: blur(12px);
    opacity: 0.9;
  }

  .comp-table {
    position: relative; 
    z-index: 1; /* above the shadow */
    width: 100%;
    min-width: 0; /* allow shrinking to container */
    table-layout: fixed; /* prevent horizontal overflow */
    border-collapse: separate;
    border-spacing: 0;
    background: rgba(0,0,0,0.18);
  border-radius: 12px; /* soften edges over the shadow */
    overflow: hidden;
  }

  /* Base cells */
  th, td {
    color: #fff;
    text-align: center;
  padding: 16px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    border-right: 1px solid rgba(255,255,255,0.06);
    vertical-align: middle;
    overflow-wrap: anywhere; /* allow wrapping long words */
    word-break: break-word;
    line-height: 1.45;
  }
  th:last-child, td:last-child { border-right: none; }

  /* Body striping */
  tbody tr:nth-child(odd) { background: rgba(255,255,255,0.02); }
  tbody tr:nth-child(even) { background: rgba(255,255,255,0.04); }

  /* Feature column */
  th.feat, td.feat {
    text-align: left;
    color: rgba(255,255,255,0.95);
    font-size: 15px;
    letter-spacing: 0.02em;
    min-width: 260px;
  }
  .plan-title { display: inline-block; }

  /* Value cells */
  td.val { text-align: center; white-space: nowrap; }

  .check { color: #fff; font-weight: 700; font-size: 16px; display: inline-block; margin-right: 8px; }
  .dash { color: rgba(255,255,255,0.35); display: inline-block; margin-right: 8px; }
  small { color: rgba(255,255,255,0.85); font-size: 12px; }

  /* Sticky headers */
  thead th {
    position: sticky;
    z-index: 3;
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(2px);
  }
  thead tr.cta-row th {
    top: 0;
    background: rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.12);
  padding: 16px 16px;
  height: 80px; /* room for 2-line buttons (8px grid) */
    z-index: 4;
  }
  thead tr.cta-row th.feat { background: transparent; border-bottom: none; }
  thead tr.header-row th {
  top: 80px;
    z-index: 3;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.02em;
  padding: 16px 16px;
  }
  thead th.feat { text-align: left; }

  /* Column width hints (table-layout: fixed honors first row) */
  thead tr.header-row th.feat { width: 36%; }
  thead tr.header-row th:nth-child(2),
  thead tr.header-row th:nth-child(3),
  thead tr.header-row th:nth-child(4) { width: 21.33%; }

  .select-cta { width: 100%; }

  /* Mobile tweaks */
  @media (max-width: 768px) {
  /* Full-bleed on mobile: parent handles side margins; remove rounding */
  .comp-table { border-radius: 0; }
  &::before { border-radius: 0; }
  th, td { padding: 8px 8px; line-height: 1.4; }
    th.feat, td.feat { font-size: 14px; min-width: 200px; }
    td.val { white-space: normal; }
    thead tr.header-row th { font-size: 15px; }
  }
`

const ComparisonCTARow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
  width: 100%;
  max-width: 1060px; /* match table width */
  margin-left: auto;
  margin-right: auto;
  align-items: center;
  justify-content: center;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

// Two-column layout for subscription step: left text, right table
const SubscriptionSplit = styled.div`
  display: grid;
  grid-template-columns: 1fr minmax(520px, 1.2fr);
  grid-template-areas: 'left right';
  gap: 24px;
  align-items: start;
  width: 100%;
  overflow: hidden; /* no inner scrollbars; page scrolls */
  & > div:nth-child(1) { grid-area: left; }
  & > div:nth-child(2) { grid-area: right; }
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-areas: 
      'right'
      'left';
    gap: 18px;
  }
`

// Mobile subscription UI: tabs + stacked card
const MobilePlansWrap = styled.div`
  display: none;
  @media (max-width: 1023px) {
    display: block;
    width: 100%;
    margin-top: 8px;
  }
`

const PlanTabs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  margin-bottom: 10px;
`

const PlanTabButton = styled.button`
  appearance: none;
  border: 1px solid rgba(255,255,255,0.2);
  background: ${(p) => (p.$active ? 'var(--primary-red)' : 'transparent')};
  color: ${(p) => (p.$active ? 'var(--black)' : '#fff')};
  border-radius: 0;
  padding: 10px 8px;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.1;
  text-align: center;
  min-height: 48px;
  display: grid;
  align-content: center;
  gap: 2px;
  transition: background 160ms ease, color 160ms ease, border-color 160ms ease, transform 120ms ease;
  &:active { transform: scale(0.98); }
  .sub { font-weight: 500; font-size: 12px; opacity: ${(p)=>p.$active?0.95:0.85}; }
  /* Remove double borders between adjacent buttons */
  border-left-width: 0;
  &:first-child { border-left-width: 1px; }
  &:last-child { border-right-width: 1px; }
`

const PlanCard = styled.div`
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 10px;
  @media (max-width: 1023px) { border-radius: 0; }
`

const PlanHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  .title { font-size: 16px; font-weight: 600; }
  .price { font-size: 14px; opacity: 0.9; }
  @media (max-width: 1023px) { border-radius: 0; }
`

const FeatureList = styled.ul`
  list-style: none; margin: 0; padding: 0; display: grid; gap: 8px;
`

const PlanFeatureItem = styled.li`
  display: flex; align-items: baseline; gap: 8px;
  .label { color: rgba(255,255,255,0.9); font-size: 14px; line-height: 1.35; }
  .value { margin-left: auto; font-size: 14px; opacity: 0.95; }
  .ok { color: #fff; font-weight: 700; }
  .dash { color: rgba(255,255,255,0.4); }
`

const PlanCTA = styled(SelectButton)`
  width: 100%; margin-top: 4px; border-radius: 10px;
  @media (max-width: 1023px) { border-radius: 0; max-width: 260px; justify-self: center; }
`

// Sticky CTA at the bottom on mobile
const StickyCTABar = styled.div`
  position: sticky;
  bottom: 0;
  padding: 10px 0 8px;
  background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.0));
  backdrop-filter: none;
  z-index: 5;
  @media (min-width: 1024px) { display: none; }
  .inner { display: grid; grid-template-columns: 1fr; gap: 6px; }
  .hint { text-align: center; font-size: 12px; opacity: 0.9; color: #fff; }
`

const StepNote = styled.div`
  color: #fff;
  opacity: 0.9;
  font-size: 14px;
  margin: 8px 0 0 0;
`

/* Desktop-only next-step bar aligned to the right above the pricing grid */
const NextStepBar = styled.div`
  display: none;
  @media (min-width: 1024px) {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  position: sticky;
  top: 0; /* stick to top of the scrollable services modal */
  z-index: 5; /* keep above cards */
  margin: 6px auto; /* center like grid */
  max-width: ${props => props.$narrow ? '1060px' : '100%'};
  width: 100%;
  }
`

const NextButton = styled(SelectButton)`
  @media (max-width: 1023px) { display: none; }
`

const ProjectsRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;

  @media (max-width: 768px) {
    gap: 8px;
    margin-top: 6px;
  }
`

const RowHeader = styled.div`
  font-size: 15px;
  color: rgba(255,255,255,0.9);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0 12px;

  @media (max-width: 768px) {
    font-size: 13px;
    padding: 0 8px;
  }
`

const RowScroller = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr; /* без стрелок */
  align-items: center;
  gap: 8px;
`

/* Стрелки удалены по требованию */

const CardsStrip = styled.div`
  /* Desktop: центрируем без горизонтального скролла */
  display: flex;
  justify-content: center;
  gap: 14px; /* reduced desktop gap */
  padding: 6px 4px;
  overflow: visible;

  /* Mobile/Tablet: горизонтальная лента со скроллом */
  @media (max-width: 1024px) {
    display: grid;
  grid-auto-flow: column;
  /* allow cards to grow to most of the viewport on small screens */
  grid-auto-columns: minmax(220px, 90%);
    gap: 12px;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar { display: none; }
    padding: 4px 8px 12px;
  }
`

const ProjectCard = styled.div`
  position: relative;
  height: 170px; /* reduced desktop height */
  width: 280px; /* reduced desktop width */
  max-width: 300px; /* scale bounds down */
  min-width: 250px; /* narrower min */
  @media (min-width: 1280px) { height: 190px; } /* slightly larger on very wide screens */
  border-radius: 14px;
  perspective: 600px; /* глубже перспектива */
  perspective-origin: 50% 50%;
  overflow: visible;
  border: none;
  background: transparent;
  cursor: pointer;
  scroll-snap-align: center;

  @media (max-width: 768px) {
    /* Mobile: make cards responsive to viewport width and flexible height */
    width: min(92vw, 340px);
    min-width: auto;
    height: auto;
  }
`

const CardInner = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 14px;
  transform-style: preserve-3d; /* важно для 3D на дочерних слоях */
  /* Больше не вращаем контейнер; стороны крутятся сами */
  transition: none;
  transform-origin: center;
  box-shadow: none;
  border: none;
  background: transparent;
  overflow: hidden;

  /* Принудительный флип на мобильном при первом тапе */
  &.force-flip ${'' /* styled-components keep */} {
    /* Ничего – класс используется дочерними в селекторах ниже */
  }

  @media (max-width: 768px) {
    /* allow flexible height on mobile while keeping visual ratio */
    height: auto;
    aspect-ratio: 16 / 9;
  }
`

const CardFace = styled.div`
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 14px;
  overflow: hidden;
`

const CardFront = styled(CardFace)`
  transform: rotateY(0deg) rotateX(0deg) translateZ(1px);
  transform-origin: 50% 50%;
  transition: transform 0.6s ease, box-shadow 0.3s ease;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  ${ProjectCard}:hover & { transform: rotateY(180deg) rotateX(1deg) translateZ(1px); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  /* Мобильный: флип по классу force-flip */
  @media (max-width: 768px) {
    .force-flip & { transform: rotateY(180deg) rotateX(1deg) translateZ(1px); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  }
`

const CardBack = styled(CardFace)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  /* Синхронизируем внутренние отступы с фронтной стороной (CardText: left/right 12px, bottom 10px) */
  padding: 8px 12px 10px; /* чуть выше контент */
  gap: 6px;
  /* Белый фон на обороте */
  background: #ffffff;
  transform: rotateY(-180deg) rotateX(0deg) translateZ(1px);
  transform-origin: 50% 50%;
  transition: transform 0.6s ease, box-shadow 0.3s ease;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  ${ProjectCard}:hover & { transform: rotateY(0deg) rotateX(1deg) translateZ(1px); box-shadow: 0 12px 36px rgba(0,0,0,0.35); }
  @media (max-width: 768px) {
    .force-flip & { transform: rotateY(0deg) rotateX(1deg) translateZ(1px); box-shadow: 0 12px 36px rgba(0,0,0,0.35); }
  }
  color: #000;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  text-align: left;
  position: relative;
  height: 100%;
  box-sizing: border-box;
  /* Перекраска внутреннего текста/контента в чёрный */
  &, h4, p, div, span { color: #000; }
  /* Кнопка (стрелка) остаётся брендовой */
  button { color: var(--primary-red); }
  /* Точки и чипы адаптированы под светлый фон */
  .dot { background: rgba(0,0,0,0.5); }
  .chip { background: rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.18); color: #000; }
  .chip.more { opacity: 0.7; }
  @media (max-width: 768px) {
    padding: 8px 12px 10px;
    justify-content: center;
  }
`

/* Заголовок на обороте: чуть крупнее и визуально приподнят */
const CardBackTitle = styled.h4`
  margin: 0;
  font-size: 16px; /* reduced from 18px after card size shrink */
  font-weight: 600;
  line-height: 1.2;
  transform: translateY(-2px); /* оптически приподнять */
  letter-spacing: 0.2px;
  padding-right: 60px; /* место под кнопку перехода */
  word-break: break-word;
  @media (max-width: 768px) {
    font-size: 15px; /* mobile slightly smaller too */
    padding-right: 56px; /* чуть меньше на мобильном */
  }
`
/* Ряд метаданных (роль, год и т.п.) */
const CardBackMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  font-size: 11px; /* was 12px */
  opacity: 0.9;
  line-height: 1.3;
  position: relative;
  padding-top: 2px;
  .dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(0,0,0,0.55); }
`

/* Список ключевых фич проекта (на обороте карточки) */
const ProjectFeaturesList = styled.ul`
  list-style: none;
  margin: 4px 0 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 100%;
`

const ProjectFeatureItem = styled.li`
  display: flex;
  gap: 6px;
  align-items: flex-start;
  font-size: 11px; /* was 12px */
  line-height: 1.35;
  color: #000;
  opacity: 0.95;
  position: relative;
  padding-left: 14px; /* место под маркер */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 4px;
    width: 10px;
    height: 10px;
    border-radius: 3px;
    background: linear-gradient(135deg, rgba(255,165,0,0.55), rgba(255,165,0,0.25));
    box-shadow: 0 0 0 1px rgba(255,165,0,0.35), 0 2px 4px rgba(0,0,0,0.15);
  }
`

// Кнопка перехода (иконка «стрелка вправо-вверх») в правом верхнем углу оборотной стороны
const CardGoIcon = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: transparent;
  border: 2px solid var(--primary-red);
  border-radius: 0;
  color: var(--primary-red);
  cursor: pointer;
  padding: 0;
  font-size: 18px;
  line-height: 1;
  backdrop-filter: none;
  transition: background 0.18s ease, transform 0.12s ease, box-shadow 0.2s ease;
  & > svg { width: 20px; height: 20px; display: block; pointer-events: none; transition: transform 0.18s ease; }
  &:hover > svg { transform: translate(1px, -1px); }
  &:hover { background: var(--primary-red); color: var(--black); box-shadow: 0 8px 20px rgba(0,0,0,0.35); transform: translateY(-2px); }
  &:active { transform: translateY(0) scale(0.985); }
  opacity: 0; transform: translateY(-4px); pointer-events: none; /* появление при ховере */
  ${ProjectCard}:hover & { opacity: 1; transform: translateY(0); pointer-events: auto; }
  @media (max-width: 768px) {
    width: 40px; height: 40px; font-size: 16px; opacity: 1; pointer-events: auto; transform: none; /* всегда видна на мобильных */
  }
`

const TechChips = styled.div`
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;
  .chip {
    position: relative;
  font-size: 11px; /* was 12px */ padding: 4px 8px 4px 10px; border-radius: 999px;
    background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.20);
    line-height: 1.1; letter-spacing: .2px;
    transition: background .25s ease, border-color .25s ease, transform .2s ease;
    overflow: hidden;
  }
  .chip::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, var(--primary-red), #ff9966);
    opacity: .85;
  }
  /* Темная тема hover (фронт) */
  ${ProjectCard} &:hover .chip { background: rgba(255,255,255,0.16); }
  .chip.more { font-size: 10px; /* was 11px */ opacity: 0.8; }
  /* Варианты по технологиям через data-tech (частичное совпадение) */
  .chip[data-tech*='react']::before { background: linear-gradient(180deg,#61dafb,#388bab); }
  .chip[data-tech*='node']::before { background: linear-gradient(180deg,#3c873a,#6bbf5a); }
  .chip[data-tech*='python']::before { background: linear-gradient(180deg,#3776ab,#ffdd57); }
  .chip[data-tech*='next']::before { background: linear-gradient(180deg,#000,#555); }
  .chip[data-tech*='router']::before { background: linear-gradient(180deg,#e53935,#ff8a65); }
  .chip[data-tech*='aws']::before { background: linear-gradient(180deg,#ff9900,#ffb84d); }
  .chip[data-tech*='docker']::before { background: linear-gradient(180deg,#0db7ed,#016799); }
  .chip[data-tech*='go']::before { background: linear-gradient(180deg,#00add8,#5ed0e6); }
  .chip[data-tech*='ts']::before, .chip[data-tech*='typescript']::before { background: linear-gradient(180deg,#3178c6,#5495e6); }
  .chip[data-tech*='postgres']::before, .chip[data-tech*='pg']::before { background: linear-gradient(180deg,#336791,#6fa3d6); }
  .chip[data-tech*='redis']::before { background: linear-gradient(180deg,#d82c20,#ff6a5c); }
  }
`

const MetaRow = styled.div`
  display: flex; gap: 10px; align-items: center;
  font-size: 12px; opacity: 0.9;
  .dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.5); }
`

const CardImage = styled.div`
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center center;
  filter: saturate(1) brightness(0.9);
  transform: scale(1.02);
  transition: transform 0.4s ease;
  ${ProjectCard}:hover & { transform: scale(1.06); }
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
`

const CardOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(8,8,12,0.0) 0%, rgba(8,8,12,0.55) 55%, rgba(8,8,12,0.85) 100%);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
`

const DevBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  pointer-events: none;
  font-size: 11px;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 999px;
  color: #fff;
  background: ${props => props.$status === 'done' ? 'rgba(34,197,94,0.22)' : 'rgba(234,179,8,0.22)'};
  border: 1px solid ${props => props.$status === 'done' ? 'rgba(34,197,94,0.5)' : 'rgba(234,179,8,0.5)'};
  box-shadow: 0 0 0 1px ${props => props.$status === 'done' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)'}, 0 6px 16px rgba(0,0,0,0.25);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  backdrop-filter: blur(2px);

  @media (max-width: 768px) {
    font-size: 10px;
    padding: 3px 7px;
    top: 8px;
    left: 8px;
  }
`

const CardText = styled.div`
  position: absolute;
  left: 12px; right: 12px; bottom: 10px;
  display: flex; flex-direction: column; gap: 4px;
  color: #fff;
  h4 { margin: 0; font-size: 16px; font-weight: 600; }
  p { margin: 0; font-size: 13px; color: rgba(255,255,255,0.85); }
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  text-align: left;

  @media (max-width: 768px) {
    h4 { font-size: 15px; }
    p { font-size: 12px; }
  }
`

const ProjectsTopTitle = styled.h2`
  position: absolute;
  top: ${p => p.$compactTop ? '-8px' : '24px'}; /* ещё выше (негативный отступ) в модалке Услуги */
  left: 16px;
  margin: 0;
  font-size: clamp(24px, 5vw, 36px);
  font-weight: 500;
  color: #fff;

  @media (max-width: 768px) {
  top: ${p => p.$compactTop ? '-4px' : '16px'}; /* чуть-чуть выше на мобильном */
    left: 12px;
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
  /* Make Contacts title backdrop slightly darker to avoid red tint looking gray */
  ${Card}.card-3:hover &::before,
  ${Card}.card-3.force-hover &::before {
    opacity: 1;
    background: linear-gradient(180deg, rgba(0,0,0,0.82), rgba(0,0,0,0.74));
    filter: blur(9px);
  }
  /* When a card hides its title (e.g., contacts overlay), suppress the dark backdrop */
  ${Card}.title-hidden &::before {
    opacity: 0 !important;
  }
`

const CardTitle = styled.h3`
  font-size: clamp(32px, 4vw, 64px);
  font-weight: 400;
  color: white;
  margin: 0;
  transition: color 0.2s ease, opacity 0.2s ease;
  line-height: 1.08;
  letter-spacing: -0.015em;
  position: relative;
  padding-bottom: 8px; /* room for underline */

  /* Make Contacts title (card-3) visually brighter */
  ${Card}.card-3 & {
    color: #ffffff;
    opacity: 1;
  }
  ${Card}.card-3:hover &,
  ${Card}.card-3.force-hover & {
    color: #ffffff;
    text-shadow: 0 0 1px rgba(255,255,255,0.7), 0 0 10px rgba(255,255,255,0.08);
  }

  /* Underline swipe: hidden by default */
  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    height: 2px;
    width: 0;
    background: rgba(255,255,255,0.85);
    transition: width 0.22s ease;
  }
  &.no-underline::after { width: 0 !important; }
  /* Show underline on hover/focus of the card */
  ${Card}:hover &::after,
  ${Card}.force-hover &::after,
  ${Card}:focus-visible &::after {
    width: 100%;
  }
  /* On touch devices, don't show underline on hover/focus to avoid default initial highlight */
  @media (pointer: coarse) {
    ${Card}:hover &::after,
    ${Card}:focus-visible &::after {
      width: 0;
    }
  }
  /* Hide underline when opened */
  ${Card}.is-open &::after { width: 0; }
  
  ${Card}:hover & {
    color: white;
    /* убираем изменение размера на hover */
  }
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`

const ShortDescription = styled.p`
  display: none;
`

const HiddenDescription = styled.div`
  display: none;
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



// Более тёмные тона для dither-фона; для "Контакты" — тёмно-красный.
// Добавлены отдельные цвета для зон: Telegram / WhatsApp / Email на ховере контактов (индексы 4–6)
const waveColors = [
  [0, 0, 0.35],       // 0: тёмно-синий (About)
  [0.3, 0, 0.3],      // 1: тёмный пурпур (Projects)
  [0, 0.3, 0],        // 2: тёмно-зелёный (Services)
  [0.4, 0.05, 0.05],  // 3: тёмно-красный для "Контакты"
  [0.06, 0.22, 0.62], // 4: Telegram — глубокий голубой
  [0.03, 0.45, 0.22], // 5: WhatsApp — насыщенный зелёный
  [0.55, 0.45, 0.06], // 6: Email — мягкий жёлтый
];
// Вынесено из компонента, чтобы не пересоздавать на каждый рендер
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
    description: "Все способы связи",
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

// Крупные структуры данных вынесены за пределы компонента
const servicesWeb = [
  { id: 'basic', title: 'Базовый', desc: 'Лендинг/одностраничник для презентации услуг/продуктов', price: 'от 70 000 ₽',
    features: ['Кастомный дизайн','До 5 блоков/секций','Адаптивная верстка под все устройства','Подключение аналитики (Яндекс.Метрика/GA)','Базовое SEO (теги, скорость загрузки)','Кросс‑браузерное тестирование','SSL и базовая защита данных','Развертывание на сервере','1 месяц поддержки (только багфиксы)'],
    notes: [], timeline: 'Сроки: 1–2 недели', tech: 'HTML, CSS, JavaScript, React' },
  { id: 'optimal', title: 'Стандарт', desc: 'Многостраничный сайт с интеграциями и анимациями', price: 'от 130 000 ₽',
    features: ['Всё из "Базовый"','До 10 страниц','Анимации: от базовых скроллов до эффектных «вау» при необходимости','CRM/База данных + админ-панель (самописная дороже, по согласованию)','Калькуляторы, формы заявок, квизы','Платёжные системы (ЮKassa, CloudPayments, криптовалюта и т.д.)','Личный кабинет клиента/администратора','Email/мессенджер-уведомления','1 месяц поддержки (только багфиксы)'],
    timeline: 'Сроки: 3–6 недель', tech: 'HTML, Tailwind CSS, JavaScript, React, Framer Motion / GSAP, Ruby, MySQL/PostgreSQL' },
  { id: 'premium', title: 'Премиум', desc: 'Сложное веб‑приложение с продвинутой логикой', price: 'от 250 000 ₽',
    features: ['Всё из «Стандарт»','Сложная логика: чаты в реальном времени, интеграция ИИ (автоматизация процессов), масштабируемые API','Полная SEO‑оптимизация','Мультиязычность (2 языка)','Интеграции с CRM/ERP/облачными сервисами (Bitrix24, AmoCRM, SAP и др.)','Базовое нагрузочное тестирование (проверка скорости и стабильности при трафике)','Документация и инструкции для клиента (техдок — по запросу)','1 месяц поддержки (только багфиксы)'],
    timeline: 'Сроки: 5–12 недель', tech: 'Next.js, TypeScript, Nest.js, MongoDB, Docker, WebSockets' },
]

const servicesBots = [
  { id: 'bot-basic', title: 'Базовый', desc: 'FAQ/поддержка, сбор заявок, простые сценарии', price: 'от 40 000 ₽',
    features: [
      'Telegram/WhatsApp бот',
      'FAQ и сценарии вопросов-ответов',
      'Формы заявок с уведомлениями в чат/email',
      'Простые сценарии (квиз, калькулятор, меню)',
      'Интеграция с Google Sheets или CRM',
      'Базовая статистика (заявки, активность пользователей)',
      'Развёртывание и настройка',
      '1 месяц поддержки (исправление багов)'
    ],
    extras: ['Подключение оплат: от 10 000 ₽','Импорт/экспорт базы: от 5 000 ₽'], notes: [], timeline: 'Сроки: 1–2 недели', tech: 'Python/Node.js, aiogram/grammY, SQLite/Google Sheets, Webhooks, базовые CRM-интеграции (AmoCRM/Bitrix24)' },
  { id: 'bot-optimal', title: 'Стандарт', desc: 'Продажи/записи, оплаты, админ‑панель', price: 'от 90 000 ₽',
    features: [
      'Всё из «Базовый»',
      'Приём платежей: карты, СБП, подписки, возвраты',
      'Админ-панель прямо в боте (добавление контента, управление заказами)',
      'Личный кабинет клиента (заказы, подписки, оплаты, данные)',
      'Рассылки и уведомления без ограничений',
      'Интеграции с CRM и базами данных',
      '1 месяц поддержки (исправление багов)'
    ],
    extras: ['Сегментация рассылок: +10 000 ₽','А/Б‑тесты сценариев: +10 000 ₽'], timeline: 'Сроки: 3–5 недель', tech: 'Node.js/Python (aiogram/grammY), PostgreSQL, Redis, Telegram Bot API, интеграции (ЮKassa/CloudPayments/СБП, CRM API), Docker/VPS.' },
  { id: 'bot-premium', title: 'Премиум', desc: 'Сложная логика, интеграции и realtime', price: 'от 180 000 ₽',
    features: [
      'Полноценное Telegram Mini App (бот‑приложение внутри мессенджера)',
      'Современный UI/UX дизайн в стиле мобильного приложения',
      'Личный кабинет пользователя (заказы, подписки, баланс, настройки)',
      'Приём платежей (карты, СБП, криптовалюта, подписки, возвраты)',
      'Интеграции с CRM/ERP/облачными сервисами (Bitrix24, AmoCRM, SAP и др.)',
      'Расширенная аналитика и статистика по пользователям',
      'Push/уведомления внутри Telegram',
      'Документация и инструкции для клиента (техдок по запросу)',
      '1 месяц поддержки (исправление багов)'
    ],
    timeline: 'Сроки: 4–8 недель', tech: 'Next.js/React (Telegram WebApp SDK), Node.js/Nest.js, TypeScript, PostgreSQL/MongoDB, Redis, WebSockets, интеграции (ЮKassa/CloudPayments/СБП/крипто, CRM/ERP API), Docker/Kubernetes.' },
]

const servicesAutomation = [
  { id: 'auto-custom', title: 'Программы/Софт', desc: 'Программы, интеграции, автоматизация процессов под задачу', price: 'Custom',
    features: ['Анализ задачи и проектирование','Интеграции с CRM/ERP/Sheets/API','Скрипты, ETL, отчёты и уведомления','Реал‑тайм при необходимости','Документация и обучение'],
    extras: [], notes: ['Стоимость обсуждается после брифинга'], timeline: 'Сроки: зависят от объёма', tech: 'Python/Node.js, Google API, PostgreSQL' },
]

// FAQ данные для подписки
const subscriptionFAQ = [
  {
    question: 'Что если у меня уже есть хостинг и домен?',
    answer: 'Подключение возможно к существующему серверу или проект может быть перенесён на предоставленный хостинг — всё зависит от ваших предпочтений. В любом случае поддержка и обновления входят в подписку.'
  },
  {
    question: 'А если не хватит часов?',
    answer: 'Дополнительные часы можно докупить по фиксированной ставке либо перейти на тариф Pro. Вся работа фиксируется в отчёте, чтобы видеть распределение времени.'
  },
  {
    question: 'Накапливаются ли часы, если их не использовать?',
    answer: 'Неиспользованные часы переносятся в размере 50% от остатка на следующий месяц.'
  },
  {
    question: 'Как быстро происходит реакция на инциденты?',
    answer: 'На тарифе Basic — в течение 2 рабочих дней. На тарифе Pro — в течение 4 рабочих часов. Задачи клиентов Pro всегда ставятся в приоритет.'
  },
  {
    question: 'Как происходит старт работ и оплата?',
    answer: 'После выбора тарифа заключается договор и выставляется счёт за месяц вперёд. Сразу после оплаты проект подключается к системе мониторинга, и начинаются работы по задачам.'
  },
  {
    question: 'Какие гарантии качества и сроков?',
    answer: 'Все условия фиксируются в официальном договоре: сроки реакции, объём работ и ответственность сторон. Вы получаете ежемесячный отчёт с результатами и рекомендациями, что обеспечивает прозрачность и контроль.'
  },
  {
    question: 'Что если понадобится задача вне подписки?',
    answer: 'Крупные задачи, которые не укладываются в лимит часов (например, новые интеграции или разработка функционала), оцениваются и согласовываются отдельно. При этом поддержка и мелкие доработки продолжают выполняться в рамках подписки.'
  }
]

const projectsRows = {
  web: [
    { id: 'lightlab', title: 'Light Lab', description: 'Онлайн‑бронирование слотов в фотостудии (витрина залов, корзина, ЛК, админка)', href: '/project/lightlab', image: '/images/lightlab.png', tech: ['React 19', 'Router 7', 'MUI', 'Framer Motion', 'Node/Express', 'Socket.IO', 'MySQL'], year: '2025', role: 'Full‑stack', features: ['Часы‑слоты с проверкой конфликтов', 'Динамическое ценообразование и промокоды', 'Live‑обновления через Socket.IO', 'Админ‑панель: клиенты/цены/услуги/брони', 'Загрузка и оптимизация фото (sharp/multer)', 'REST API + события bookingChange'] },
    { id: 'raykhan', title: 'Raykhan', description: 'SPA интернет‑магазин премиальных духов с 3D‑фоном и анимациями', href: '#', image: '/images/raykhan.png', tech: ['React 18', 'Framer Motion', 'GSAP', 'Three.js'], year: '2025', role: 'Front‑end', features: ['WebGL Silk‑фон', 'Каталог/карточки товаров'] },
  ],
  bots: [
    { id: 'tg-shop', status: 'done', title: 'Бот "Худеем с Войтенко!"', description: 'Продажа подписок и консультаций с автопродлением (CloudPayments)', href: '/project/voytenko', image: '/images/botdieta.png', tech: ['Python', 'aiogram 3', 'MySQL', 'CloudPayments'], year: '2025', role: 'Back‑end', features: ['Подписки и автопродление', 'Webhooks CloudPayments'] },
  { id: 'wa-support', status: 'done', title: 'KLAMbot', description: 'Документооборот и статусы по объектам/альбомам. Google Sheets + уведомления.', href: '/project/klambot', image: '/images/klambot.png', tech: ['Python', 'PTB v20+', 'Google Sheets API', 'aiosmtplib'], year: '2025', role: 'Automation', features: ['Интеграция с Google Sheets', 'Раскраска статусов и уведомления'] },
  ],
  tools: [
  { id: 'wb-integrator', status: 'done', title: 'WB Авто-акции', description: 'Интеграция с Wildberries + Google Sheets: акции, маржа, выгрузки', href: '/project/wb-auto-actions', image: '/images/WB.png', tech: ['Python', 'Requests', 'Pandas', 'Google Sheets API'], year: '2025', role: 'Automation', features: ['Расчёт маржи и отбор в акции', 'Выгрузки в Google Sheets'] },
  ],
}

// Полароидный карусель компонент
function PolaroidCarousel({ isMobile = false }) {
  const photos = React.useMemo(() => [
    { id: 'p1', src: '/images/photo1.webp' },
    { id: 'p2', src: '/images/photo2.webp' },
    { id: 'p3', src: '/images/photo3.webp' },
    { id: 'p4', src: '/images/photo4.webp' },
    { id: 'p5', src: '/images/photo5.webp' },
  ], [])
  
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [loadedImages, setLoadedImages] = React.useState(new Set())
  const [order, setOrder] = React.useState(() => photos.map((_, i) => i))
  const touchStartRef = React.useRef({ x: 0, y: 0 })

  // Предзагрузка изображений
  React.useEffect(() => {
    const preloadImages = () => {
      photos.forEach((photo, index) => {
        const img = new Image()
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, index]))
        }
        img.onerror = () => {
          console.warn(`Failed to load image: ${photo.src}`)
        }
        img.src = photo.src
      })
    }

    preloadImages()
  }, [photos])

  // Автопроигрывание удалено по запросу

  // Функция перехода к следующему/предыдущему фото
  const goToSlide = React.useCallback((index) => {
    setCurrentIndex(index)
    try {
      const gd = document.querySelector('.global-dither')
      if (gd && +gd.style.opacity > 0) {
        gsap.to(gd, { opacity: "+=0.05", duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' })
      }
    } catch {}
  }, [])

  // При тапе (мобильная версия) — перенести активную карточку в конец
  const rotateForward = React.useCallback(() => {
    if (!isMobile) return goToSlide((currentIndex + 1) % photos.length)
    // Анимируем уход первой карточки влево, затем переставляем порядок
    setOrder(prev => {
      if (prev.length === 0) return prev
      const activeIndex = prev[0]
      const cardEl = document.querySelector('.polaroid-stack .mobile-card.is-active')
      if (cardEl) {
        cardEl.classList.add('leaving')
        // После завершения transition меняем порядок
        const onEnd = (e) => {
          if (e.propertyName !== 'transform') return
          cardEl.removeEventListener('transitionend', onEnd)
          requestAnimationFrame(() => {
            setOrder(old => {
              const rearranged = [...old.slice(1), old[0]]
              setCurrentIndex(rearranged[0])
              return rearranged
            })
          })
        }
        cardEl.addEventListener('transitionend', onEnd)
      } else {
        // fallback без анимации
        const next = [...prev.slice(1), prev[0]]
        setCurrentIndex(next[0])
        return next
      }
      return prev
    })
  }, [isMobile, goToSlide, currentIndex, photos.length])

  // Обработка свайпов
  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    
    // Проверяем, что это горизонтальный свайп
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Свайп вправо - предыдущее фото
        goToSlide((currentIndex - 1 + photos.length) % photos.length)
      } else {
        // Свайп влево - следующее фото
        goToSlide((currentIndex + 1) % photos.length)
      }
    }
  }

  // Определяем класс для каждой карточки
  const getCardClass = (index) => {
    const diff = index - currentIndex
    const totalPhotos = photos.length
    
    // Нормализуем разность для циклического массива
    let normalizedDiff = diff
    if (normalizedDiff > totalPhotos / 2) {
      normalizedDiff -= totalPhotos
    } else if (normalizedDiff < -totalPhotos / 2) {
      normalizedDiff += totalPhotos
    }
    
    if (normalizedDiff === 0) return 'is-active'
    if (normalizedDiff === -1) return 'is-prev-1'
    if (normalizedDiff === -2) return 'is-prev-2'
    if (normalizedDiff === -3) return 'is-prev-3'
    if (normalizedDiff === 1) return 'is-next-1'
    if (normalizedDiff === 2) return 'is-next-2'
    if (normalizedDiff === 3) return 'is-next-3'
    return 'is-hidden'
  }

  const CarouselWrapper = isMobile ? MobilePolaroidCarousel : DesktopPolaroidCarousel

  return (
    <CarouselWrapper>
      <PolaroidStack
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => { e.stopPropagation(); goToSlide((currentIndex + 1) % photos.length) }}
      >
        {photos.map((photo, index) => {
          const diff = Math.abs(index - currentIndex)
          const wrapDiff = Math.min(diff, photos.length - diff)
          // На мобильных показываем все, на десктопе ограничиваем
          if (!isMobile && wrapDiff > 2) return null
          const cls = getCardClass(index)
          return (
            <PolaroidCard
              key={photo.id}
              className={cls + (isMobile ? ' mobile-card' : '')}
              style={{ zIndex: cls.includes('is-active') ? 40 : 40 - wrapDiff }}
              onClick={(e) => { e.stopPropagation(); goToSlide((currentIndex + 1) % photos.length) }}
            >
              <PolaroidPhoto
                src={photo.src}
                alt={`Фото ${index + 1}`}
                decoding="async"
                loading={index === currentIndex ? 'eager' : 'lazy'}
                fetchpriority={index === currentIndex ? 'high' : 'low'}
                draggable={false}
                className={loadedImages.has(index) ? 'is-ready' : ''}
                onLoad={() => setLoadedImages(prev => new Set([...prev, index]))}
              />
            </PolaroidCard>
          )
        })}
      </PolaroidStack>
      <CarouselControls>
        {photos.map((_, index) => (
          <ControlDot
            key={index}
            $active={index === currentIndex}
            onClick={(e) => { e.stopPropagation(); goToSlide(index) }}
            aria-label={`Перейти к фото ${index + 1}`}
          />
        ))}
      </CarouselControls>
    </CarouselWrapper>
  )
}

import Seo from '../components/Seo'

const MenuPage = () => {
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const { camera, guardedSetParticleProps: setParticleProps, setHoveredRect, setParticleSpeed, particlesVisible, pauseParticles, resumeParticles, setTransitionContext, setParticleAnimation, setTargetCase } = useParticles()
  const isTransitioningRef = useRef(false)
  // Гейт для перехода в кейсы: пока контент модалки "Проекты" полностью не прогружен (изображения), навигация запрещена
  const [isProjectsContentReady, setIsProjectsContentReady] = useState(true) // true по умолчанию (переопределим при открытии)
  const projectsLoadTokenRef = useRef(0)
  // Жёсткая блокировка любых кликов внутри модалки "Проекты" первые 2.5s после открытия
  const [isProjectsInteractionLocked, setIsProjectsInteractionLocked] = useState(false)
  
  // Отслеживание видимости страницы для оптимизации производительности
  const isPageVisible = usePageVisibility()
  
  // Автоматическое управление производительностью
  usePerformanceOptimization(isPageVisible, pauseParticles, resumeParticles)
  
  // Логируем состояние частиц
  useEffect(() => {
    console.log('MenuPage: Particles state', { camera: !!camera, particlesVisible })
  }, [camera, particlesVisible])
  useEffect(() => { setIsMounted(true) }, [])
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [globalDitherColorIndex, setGlobalDitherColorIndex] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const globalDitherRef = useRef(null)
  const hoverTimelinesRef = useRef([])
  // убрали таймеры дебаунса — из‑за них терялись hover‑события
  const [openedIndex, setOpenedIndex] = useState(null)
  // Мобильный двухтаповый флип проектов: id карточки, чья обратная сторона показана
  const [mobileFlippedId, setMobileFlippedId] = useState(null)
  const desktopAnimatorRef = useRef(null)
  const cardRefs = useRef([])
  // Which service card shows inline "Next" morph button (desktop only)
  const [inlineNextFor, setInlineNextFor] = useState(null)
  // Track if user interacted on Step 1 (to decide when to show the top Next button)
  const [step1Interacted, setStep1Interacted] = useState(false)
  const mousePosRef = useRef({ x: 0, y: 0 })
  const hoverLockRef = useRef({}) // индекс → timestamp до которого игнорируем mouseleave
  const lastHoveredBeforeOpenRef = useRef(null)
  const isModalOpenRef = useRef(false)
  const lastOpenModalIndexRef = useRef(null)
  const isNavigatingRef = useRef(false) // Флаг для предотвращения множественных навигаций
  // Prevent fast-click bugs right after navigating into /menu
  const menuReadyRef = useRef(false)
  const pendingOpenRef = useRef(null)
  const stripsRef = useRef([])
  const aboutContainerRef = useRef(null)
  const ditherBreatheTlRef = useRef(null)
  const aboutPhotoWrapRef = useRef(null)
  // store a cleanup handler for transient dither edge bars (top/bottom)
  const edgeBarsCleanupRef = useRef(null)
  const [servicesCategory, setServicesCategory] = useState('web')
  const serviceCategories = ['web', 'bots', 'automation']
  const [servicesTier, setServicesTier] = useState('optimal')
  const [servicesStep, setServicesStep] = useState('pick') // only 'pick' now
  // --- Добавлено: отслеживаем выбранную услугу и отправляем выбор в Telegram ---
  const lastTelegramSentRef = useRef(null)
  const findServiceById = (id) => {
    if (!id) return null
    return [...servicesWeb, ...servicesBots, ...servicesAutomation].find(s => s.id === id)
  }
  const categoryLabelByServiceId = (id) => {
    if (!id) return ''
    if (servicesWeb.some(s=>s.id===id)) return '🌐 Сайты/Веб-приложения'
    if (servicesBots.some(s=>s.id===id)) return '🤖 Боты'
    if (servicesAutomation.some(s=>s.id===id)) return '⚙️ Автоматизация'
    return ''
  }
  // Больше не отправляем сразу в Telegram — сохраняем выбор для ProjectModal

  // Project creation modal (same behavior as on HomePage)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [prefill, setPrefill] = useState(null)
  const [showSubscriptionInfo, setShowSubscriptionInfo] = useState(false)
  const [isProjectModalAnimationReady, setIsProjectModalAnimationReady] = useState(false)
  const [copyNotification, setCopyNotification] = useState({ show: false, text: '' })
  const bodyLockRef = useRef({ scrollY: 0, prevStyles: {} })

  // Lock body scroll while ProjectModal is open (copied from HomePage)
  useEffect(() => {
  // Hard stop / resume background particles specifically for modal
  try {
    if (isProjectModalOpen) {
      pauseParticles?.()
    } else {
      resumeParticles?.()
    }
  } catch {}
    const lockBody = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0
      const body = document.body
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
      body.style.position = prevStyles.position
      body.style.top = prevStyles.top
      body.style.left = prevStyles.left
      body.style.right = prevStyles.right
      body.style.width = prevStyles.width
      body.style.overflow = prevStyles.overflow
      body.style.overscrollBehavior = prevStyles.overscrollBehavior
      window.scrollTo(0, scrollY || 0)
    }

    if (isProjectModalOpen) {
      isModalOpenRef.current = true
      lockBody()
    } else {
      unlockBody()
      if (openedIndex == null) isModalOpenRef.current = false
    }

    return () => {
      if (isProjectModalOpen) {
        unlockBody()
        try { resumeParticles?.() } catch {}
      }
    }
  }, [isProjectModalOpen, openedIndex])
  const serviceTiers = ['basic', 'optimal', 'premium']
  const serviceTierLabels = {
    basic: 'Базовый',
    optimal: 'Стандарт', 
    premium: 'Премиум'
  }
  // Projects modal: selected category on mobile and swipe handling
  const [projectsCategory, setProjectsCategory] = useState('web')
  const projectsCategories = ['web', 'bots', 'tools']
  const projectsCategoryLabels = {
    web: 'Сайты',
    bots: 'Боты',
    tools: 'Софт'
  }
  const projectsTouchStartXRef = useRef(null)
  // Cleanup any leftover runtime elements (red dither edge bars) on mount
  useEffect(() => {
    try {
      const top = document.querySelector('.__dither-edge-top')
      const bottom = document.querySelector('.__dither-edge-bottom')
      if (top && top.parentNode) top.parentNode.removeChild(top)
      if (bottom && bottom.parentNode) bottom.parentNode.removeChild(bottom)
      // also ensure global dither isn't stuck visible
      const gd = globalDitherRef.current || document.querySelector('.global-dither')
      if (gd) {
        try { gd.style.opacity = ''; gd.style.clipPath = 'inset(0 100% 100% 0 round 16px)'; gd.classList.remove('front') } catch (e) {}
      }
    } catch (e) { }
  }, [])

  // Функция копирования в буфер обмена
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      showCopyNotification(`${type} скопирован в буфер обмена`)
    } catch (err) {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        showCopyNotification(`${type} скопирован в буфер обмена`)
      } catch (fallbackErr) {
        console.error('Не удалось скопировать:', fallbackErr)
        showCopyNotification('Не удалось скопировать')
      }
      document.body.removeChild(textArea)
    }
  }

  const showCopyNotification = (text) => {
    setCopyNotification({ show: true, text })
    setTimeout(() => {
      setCopyNotification({ show: false, text: '' })
    }, 2000)
  }

  // Prefetch heavy modules used by the subscription/modal step to avoid delay
  // One-shot flag for dynamic chunk preloading (ProjectModal, animations, dither)
  const prefetchDoneRef = useRef(false)

  // On initial mount, ensure no accidental force-hover on mobile
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      requestAnimationFrame(() => {
        cardRefs.current.forEach((c) => c && c.classList.remove('force-hover'))
      })
    }
  }, [])

  // runtime helper: detect thin red hairline elements near bottom of viewport and hide them
  const removeBottomHairlines = () => {
    try {
      const winH = window.innerHeight || document.documentElement.clientHeight
      const els = Array.from(document.querySelectorAll('body *'))
      const candidates = []
      els.forEach((el) => {
        try {
          const r = el.getBoundingClientRect()
          if (!r || r.width === 0 || r.height === 0) return
          // thin element and near bottom
          if (r.height <= 6 && Math.abs(r.bottom - winH) <= 4) {
            const s = getComputedStyle(el)
            const bg = (s.backgroundColor || '').toLowerCase()
            const btop = (s.borderTopColor || '').toLowerCase()
            const bbot = (s.borderBottomColor || '').toLowerCase()
            if (bg.indexOf('var(--primary-red)') !== -1 || btop.indexOf('var(--primary-red)') !== -1 || bbot.indexOf('var(--primary-red)') !== -1) {
              candidates.push(el)
            } else {
              // try rgb heuristic: red channel significantly larger than others
              const parseRgb = (str) => {
                const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(str)
                if (!m) return null
                return [Number(m[1]), Number(m[2]), Number(m[3])]
              }
              const c = parseRgb(bg) || parseRgb(btop) || parseRgb(bbot)
              if (c && c[0] > 120 && c[1] < 100 && c[2] < 100) candidates.push(el)
            }
          }
        } catch (e) { }
      })
      if (candidates.length) {
        candidates.forEach((el) => {
          try {
            // log for debugging and briefly highlight the element so the user can inspect it in DevTools
            console.log('Detected thin bottom hairline candidate', el, el.getBoundingClientRect(), getComputedStyle(el).backgroundColor, getComputedStyle(el).borderTopColor)
            // temporary visual highlight so it's obvious on device: bright outline + bring to front
            const prevOutline = el.style.outline || ''
            const prevZ = el.style.zIndex || ''
            el.style.outline = '3px solid lime'
            el.style.zIndex = '2147483647'
            el.setAttribute('data-hairline-highlight', '1')
            // after a short delay, hide the element and clear highlight (so we don't leave artifacts)
            setTimeout(() => {
              try {
                el.style.display = 'none'
                el.style.outline = prevOutline
                el.style.zIndex = prevZ
                el.removeAttribute('data-hairline-highlight')
                console.log('Removed/hid thin hairline element', el)
              } catch (e) {}
            }, 3000)
          } catch (e) {}
        })
      }
    } catch (e) { }
  }

  // Aggressive cleanup: remove transient edge bars and any thin red hairlines that may remain
  const forceRemoveTransientRedBars = () => {
    try {
      // remove explicit edge bars
      const tops = Array.from(document.querySelectorAll('.__dither-edge-top'))
      const bottoms = Array.from(document.querySelectorAll('.__dither-edge-bottom'))
      tops.concat(bottoms).forEach((el) => { try { if (el.parentNode) el.parentNode.removeChild(el) } catch(e){} })

      // scan for thin red elements (height <=6px) near viewport edges and hide them
      const winH = window.innerHeight || document.documentElement.clientHeight
      const els = Array.from(document.querySelectorAll('body *'))
      els.forEach((el) => {
        try {
          const r = el.getBoundingClientRect()
          if (!r || r.width === 0 || r.height === 0) return
          if (r.height <= 6 && (Math.abs(r.bottom - winH) <= 6 || Math.abs(r.top) <= 6)) {
            const s = getComputedStyle(el)
            const bg = (s.backgroundColor || '').toLowerCase()
            const bt = (s.borderTopColor || '').toLowerCase()
            const bb = (s.borderBottomColor || '').toLowerCase()
            const isRedish = (str) => {
              const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(str)
              if (!m) return false
              const rch = Number(m[1]), gch = Number(m[2]), bch = Number(m[3])
              return rch > 120 && gch < 100 && bch < 100
            }
            if (bg.indexOf('var(--primary-red)') !== -1 || bt.indexOf('var(--primary-red)') !== -1 || bb.indexOf('var(--primary-red)') !== -1 || isRedish(bg) || isRedish(bt) || isRedish(bb)) {
              try { el.style.display = 'none'; el.style.opacity = '0'; } catch (e) {}
            }
          }
        } catch (e) { }
      })
    } catch (e) { }
  }
  const projectsTouchingRef = useRef(false)
  const projectsTouchLastTimeRef = useRef(0)
  const projectsTouchLastXRef = useRef(0)
  const projectsTransitionDirRef = useRef(0) // -1 next, 1 prev
  const projectsTouchRAFRef = useRef(null)
  const mobileListRef = useRef(null)
  const mobilePaneRef = useRef(null)
  const navBotsRef = useRef(null)
  const navWebRef = useRef(null)
  const navToolsRef = useRef(null)
  const mobileIndicatorRef = useRef(null)
  // Projects mobile navigation refs / debounce
  const projectsNavDebounceRef = useRef(null)
  const pendingProjectsCategoryRef = useRef(null)
  const isProjectsUIUpdatingRef = useRef(false)
  const isTouchRef = useRef((() => {
    try {
      return (typeof window !== 'undefined' && (('ontouchstart' in window) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)))
    } catch { return false }
  })())
  const { isMobile } = useDeviceDetection()
  // Some environments may provide isMobile as a boolean-like value; guard calls
  const isMobileFlag = useMemo(() => {
    try {
      return typeof isMobile === 'function' ? !!isMobile() : !!isMobile
    } catch {
      return false
    }
  }, [isMobile])
  const getNextCategory = (dir) => {
    const idx = serviceCategories.indexOf(servicesCategory)
    const nextIdx = (idx + (dir === 'next' ? 1 : -1) + serviceCategories.length) % serviceCategories.length
    return serviceCategories[nextIdx]
  }
  const servicesGridRef = useRef(null)
  const servicesModalRef = useRef(null)
  const contactsModalRef = useRef(null)
  const tabsRowRef = useRef(null)
  const tabWebRef = useRef(null)
  const tabBotsRef = useRef(null)
  const tabAutoRef = useRef(null)
  const indicatorRef = useRef(null)
  const isServicesSwitchingRef = useRef(false)
  
  // Services mobile navigation refs
  const servicesNavWebRef = useRef(null)
  const servicesNavBotsRef = useRef(null)
  const servicesNavAutoRef = useRef(null)
  
  // Services tier navigation refs
  const servicesTierBasicRef = useRef(null)
  const servicesTierOptimalRef = useRef(null)
  const servicesTierPremiumRef = useRef(null)
  
  // Debounce refs for navigation
  const servicesNavDebounceRef = useRef(null)
  const tierNavDebounceRef = useRef(null)
  const pendingServicesCategoryRef = useRef(null)
  const isServicesUIUpdatingRef = useRef(false)

  const onProjectsTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return
    projectsTouchStartXRef.current = e.touches[0].clientX
    projectsTouchingRef.current = true
    projectsTouchLastTimeRef.current = performance.now()
    projectsTouchLastXRef.current = e.touches[0].clientX
    try { const p = mobilePaneRef.current; if (p) { p.style.willChange = 'transform'; p.style.transition = 'none'; /* use direct transform during touch */ gsap.set(p, { x: 0 }) } } catch { }
  }

  const onProjectsTouchMove = (e) => {
    if (!projectsTouchingRef.current) return
    if (!e.touches || !e.touches.length) return
    const x = e.touches[0].clientX
    const dx = x - (projectsTouchStartXRef.current || 0)
    projectsTouchLastXRef.current = x
    projectsTouchLastTimeRef.current = performance.now()
    const pane = mobilePaneRef.current
    if (!pane) return
    if (projectsTouchRAFRef.current) cancelAnimationFrame(projectsTouchRAFRef.current)
    projectsTouchRAFRef.current = requestAnimationFrame(() => {
      try {
        const resistance = Math.min(1, Math.max(-1, dx / (window.innerWidth * 0.6)))
        const translateX = resistance * 40
        gsap.set(pane, { x: translateX })
      } catch {}
    })
  }

  const onProjectsTouchEnd = (e) => {
    if (!projectsTouchingRef.current) return
    projectsTouchingRef.current = false
    const pane = mobilePaneRef.current
    const startX = projectsTouchStartXRef.current || 0
    const endX = projectsTouchLastXRef.current || startX
    const dx = endX - startX
    const dt = Math.max(1, performance.now() - projectsTouchLastTimeRef.current)
    const velocity = dx / dt // px per ms
    const paneWidth = window.innerWidth
    const threshold = paneWidth * 0.15

    let direction = 0 // -1 = next, 1 = prev
    if (Math.abs(dx) > threshold || Math.abs(velocity) > 0.4) {
      direction = dx < 0 ? -1 : 1
    }

    // Animate pane back to center (or off and snap) then reset transform
    if (pane) {
      const targetX = 0
      gsap.to(pane, { x: targetX, duration: 0.3, ease: 'power3.out' })
    }

    // Potential category swipe change (placeholder: integrate with category switching if needed)
    if (direction !== 0) {
      // Example: switchProjectsCategory(direction === -1 ? 'next' : 'prev')
    }
  }

  // Handle services tier navigation button click with animation  
  const handleServicesTierButtonClick = (tier, event) => {
    if (servicesTier === tier) return
    
    // Immediately update tier for instant visual feedback
    setServicesTier(tier)
  setStep1Interacted(true)
    
    // Clear any existing debounce
    if (tierNavDebounceRef.current) {
      clearTimeout(tierNavDebounceRef.current)
    }

    // Create ripple effect
    createRipple(event, event.currentTarget)

    // Quick visual feedback animation
    const tierButtons = event.currentTarget.parentElement.querySelectorAll('button')
    
    gsap.to(tierButtons, {
      opacity: 0.8,
      duration: 0.06,
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(tierButtons, {
          opacity: 1,
          duration: 0.1,
          ease: 'power2.out'
        })
      }
    })

    // Minimal debounce for any heavy processing
    tierNavDebounceRef.current = setTimeout(() => {
      // Any heavy tier processing here
    }, 50)
  }

  // Ripple helper (used by nav and tier buttons)
  const createRipple = (event, button) => {
    try {
      const target = button || event.currentTarget
      if (!target) return
      const rect = target.getBoundingClientRect()
      const diameter = Math.max(rect.width, rect.height)
      const radius = diameter / 2
      const circle = document.createElement('span')
      circle.className = 'ripple'
      circle.style.width = circle.style.height = `${diameter}px`
      circle.style.left = `${(event.clientX || (rect.left + rect.width/2)) - rect.left - radius}px`
      circle.style.top = `${(event.clientY || (rect.top + rect.height/2)) - rect.top - radius}px`
      // Remove any existing ripple first
      const existing = target.querySelector('.ripple')
      if (existing) { try { existing.remove() } catch {} }
      target.appendChild(circle)
      setTimeout(() => { try { circle.remove() } catch {} }, 650)
    } catch (e) { /* silent */ }
  }

  // Handle services category navigation (mobile & desktop tabs)
  const handleServicesNavButtonClick = (cat, event) => {
    if (servicesCategory === cat) return
    // Guard concurrent animations
    if (isServicesUIUpdatingRef.current) return
    isServicesUIUpdatingRef.current = true
    setStep1Interacted(true)
    // Visual feedback
    if (event) createRipple(event, event.currentTarget)
    // Debounce rapid clicks
    if (servicesNavDebounceRef.current) clearTimeout(servicesNavDebounceRef.current)
    servicesNavDebounceRef.current = setTimeout(() => {
      try { switchCategory(cat) } finally {
        // allow further interactions shortly after animation start
        setTimeout(() => { isServicesUIUpdatingRef.current = false }, 180)
      }
    }, 10)
  }

  // Handle projects category navigation (mobile)
  const handleProjectsNavButtonClick = (cat, event) => {
    if (projectsCategory === cat) return
    // Guard concurrent animations
    if (isProjectsAnimatingRef.current) return
    // Visual feedback
    if (event) createRipple(event, event.currentTarget)
    // Change category with animation
    changeProjectsCategory(cat)
    // Update mobile indicator position
    setTimeout(positionMobileIndicator, 50)
  }

  // Mapping href -> case key used in particle manager
  const caseKeyFromHref = (href) => {
    if (href.includes('voytenko')) return 'voytenko'
    if (href.includes('lightlab')) return 'lightlab'
    if (href.includes('klambot')) return 'klambot'
    if (href.includes('wb-auto-actions')) return 'wb-auto-actions'
    return null
  }

  // Navigate to project case page (phase-based particle handling occurs in GlobalParticleManager)
  const handleProjectNavigation = (href) => {
    // Блокируем переход на lightlab
    if (href && href.includes('lightlab')) {
      console.warn('Переход на lightlab временно заблокирован')
      return
    }
    
    if (isProjectsInteractionLocked) {
      console.warn('Навигация заблокирована: стартовый лок 2.5s')
      return
    }
    if (!isProjectsContentReady) {
      console.warn('Навигация в проект заблокирована: контент проектов ещё грузится')
      return
    }
    if (!href) return
    if (isNavigatingRef.current) return
    if (isProjectsAnimatingRef.current) {
      setTimeout(() => handleProjectNavigation(href), 120)
      return
    }
    isNavigatingRef.current = true
    const key = caseKeyFromHref(href)
    if (key) setTargetCase(key)
    setTransitionContext('menu->case')
    // Micro-delay to flush state before route change
    setTimeout(() => {
      navigate(href)
      setTimeout(() => { isNavigatingRef.current = false }, 800)
    }, 0)
  }

  // Мобильный обработчик: первый тап — флип, второй тап — переход
  const onProjectCardClick = (e, project) => {
    e.stopPropagation()
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    if (!isMobile) {
      handleProjectNavigation(project.href)
      return
    }
    if (mobileFlippedId !== project.id) {
      setMobileFlippedId(project.id)
      return
    }
    handleProjectNavigation(project.href)
  }

  // Сброс флипа при смене категории проектов
  useEffect(() => { setMobileFlippedId(null) }, [projectsCategory])

  // Прелоад изображений в модалке "Проекты" при её открытии
  useEffect(() => {
    // index 1 соответствует модалке "Проекты" (см. JSX ниже)
    const isProjectsModalOpen = openedIndex === 1
    if (!isProjectsModalOpen) {
      // Если закрываем модалку — сбрасываем состояние (при повторном открытии снова проверим)
      setIsProjectsContentReady(true)
      setIsProjectsInteractionLocked(false)
      return
    }
    // Старт новой сессии загрузки
    setIsProjectsContentReady(false)
    setIsProjectsInteractionLocked(true)
    const unlockTimer = setTimeout(() => setIsProjectsInteractionLocked(false), 2500)
    const token = ++projectsLoadTokenRef.current
    const all = [...projectsRows.web, ...projectsRows.bots, ...projectsRows.tools]
      .filter(p => p.image && p.image !== '#')
    if (all.length === 0) {
      setIsProjectsContentReady(true)
      return
    }
    let loaded = 0
    const mark = () => {
      loaded++
      if (loaded >= all.length && projectsLoadTokenRef.current === token) {
        setIsProjectsContentReady(true)
      }
    }
    const timers = []
    all.forEach(p => {
      const img = new Image()
      const finalize = () => mark()
      img.onload = finalize
      img.onerror = finalize
      // Кэшированный ресурс может уже быть загружен
      img.src = p.image
      if (img.complete) finalize()
    })
    // Фолбек таймаут: не держим блокировку бесконечно (3.5s)
  const fallback = setTimeout(() => {
      if (projectsLoadTokenRef.current === token) {
        console.warn('Проекты: фолбек снял блокировку (не все изображения успели загрузиться)')
        setIsProjectsContentReady(true)
      }
    }, 3500)
  timers.push(fallback, unlockTimer)
  return () => timers.forEach(t => clearTimeout(t))
  }, [openedIndex])

  // Toggle term tooltip (mobile/keyboard)
  const handleTermToggle = (e) => {
    e.stopPropagation()
    const el = e.currentTarget
    const open = el.classList.contains('is-open')
    // close others within the same modal to avoid stacking
    try {
      const root = servicesModalRef.current || document
      root.querySelectorAll('.term.is-open').forEach(n => { if (n !== el) n.classList.remove('is-open') })
    } catch {}
    if (open) el.classList.remove('is-open')
    else el.classList.add('is-open')
  }

  // Close any open term tooltips on outside click (while Services modal open)
  useEffect(() => {
    if (openedIndex !== 2) return
    const onDocClick = (e) => {
      const root = servicesModalRef.current
      if (!root) return
      if (root.contains(e.target)) return
      try { root.querySelectorAll('.term.is-open').forEach(n => n.classList.remove('is-open')) } catch {}
    }
    document.addEventListener('click', onDocClick, true)
    return () => document.removeEventListener('click', onDocClick, true)
  }, [openedIndex])

  // Contacts modal: lock body scroll + futuristic reveal animation
  useEffect(() => {
    if (openedIndex !== 3) return
    const prevOverflow = document.body.style.overflow
    const prevPad = document.body.style.paddingRight
    
    // Определяем, является ли устройство мобильным
    const isMobile = window.innerWidth <= 768
    
    // Блокируем прокрутку body только на десктопе
    if (!isMobile) {
      try {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
        document.body.style.overflow = 'hidden'
        document.body.style.paddingRight = `${scrollbarWidth}px`
      } catch {}
    }
    
    const root = contactsModalRef.current
    if (root) {
      try {
        const title = root.querySelector('h2') // ContactsMainTitle
        const portals = root.querySelectorAll('a, button') // ContactPortal elements (ссылки и кнопки)
        
        // Set initial states
        gsap.set(root, { opacity: 0, y: 10 })
        gsap.set(title, { opacity: 0, scale: 0.8, rotationX: 20 })
        gsap.set(portals, { opacity: 0, y: 40, scale: 0.9, rotationY: 15 })
        
        // Create dramatic timeline
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        tl.to(root, { opacity: 1, y: 0, duration: 0.6 })
          .to(title, { opacity: 1, scale: 1, rotationX: 0, duration: 0.8 }, 0.1)
          .to(portals, { opacity: 1, y: 0, scale: 1, rotationY: 0, duration: 0.8, stagger: 0.15 }, 0.3)
      } catch {}
    }
    return () => {
      // Восстанавливаем прокрутку только если она была заблокирована
      if (!isMobile) {
        try { document.body.style.overflow = prevOverflow; document.body.style.paddingRight = prevPad } catch {}
      }
    }
  }, [openedIndex])

  // Desktop-only: ensure scroll behavior depending on mode
  useEffect(() => {
    if (openedIndex !== 2) return
    if (isTouchRef.current) return
    const container = servicesModalRef.current
    if (!container) return

    const windowScrollMode = false // removed subscription step logic
    if (!windowScrollMode) {
      // Focus the container so keyboard scrolling works (PgUp/PgDn/Home/End)
      try { container.setAttribute('tabindex', '-1'); container.focus({ preventScroll: true }) } catch {}
    }

    // Prevent body scroll only in internal-scroll mode
    const prevOverflow = document.body.style.overflow
    const prevPad = document.body.style.paddingRight
    if (!windowScrollMode) {
      try {
        const bodyScrollbarWidth = window.innerWidth - document.documentElement.clientWidth
        document.body.style.overflow = 'hidden'
        document.body.style.paddingRight = `${bodyScrollbarWidth}px`
      } catch {}
    }

    // Move close/back buttons to not overlap with internal scrollbar
    const applyCloseOffset = () => {
      try {
        const innerScrollbarWidth = container.offsetWidth - container.clientWidth
        const offset = Math.max(0, innerScrollbarWidth - 2) + 4
        document.documentElement.style.setProperty('--close-right-offset', `${offset}px`)
      } catch {}
    }
    if (!windowScrollMode) {
      applyCloseOffset()
      const onResize = () => applyCloseOffset()
      window.addEventListener('resize', onResize)
    }

    // Ensure wheel scrolling always moves the container
    let onResize = null
    const onWheelScroll = (e) => {
      if (windowScrollMode) return // let the window scroll freely
      const canScroll = container.scrollHeight > container.clientHeight
      if (!canScroll) return
      container.scrollTop += (e.deltaY || 0)
      e.stopPropagation()
      if (typeof e.preventDefault === 'function') e.preventDefault()
    }
    if (!windowScrollMode) container.addEventListener('wheel', onWheelScroll, { passive: false })

    // Keyboard scrolling support
    const onKeyDown = (e) => {
      if (windowScrollMode) return // allow default window scrolling
      const key = e.key
      const line = 40
      const page = container.clientHeight * 0.9
      if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(key)) {
        e.preventDefault()
        e.stopPropagation()
        if (key === 'ArrowDown' || key === ' ') container.scrollTop += line
        else if (key === 'ArrowUp') container.scrollTop -= line
        else if (key === 'PageDown') container.scrollTop += page
        else if (key === 'PageUp') container.scrollTop -= page
        else if (key === 'Home') container.scrollTop = 0
        else if (key === 'End') container.scrollTop = container.scrollHeight
      }
    }
    if (!windowScrollMode) container.addEventListener('keydown', onKeyDown)

  return () => {
    try { container.removeEventListener('wheel', onWheelScroll) } catch {}
    try { container.removeEventListener('keydown', onKeyDown) } catch {}
    try { document.body.style.overflow = prevOverflow; document.body.style.paddingRight = prevPad } catch {}
    try { document.documentElement.style.removeProperty('--close-right-offset') } catch {}
    try { if (onResize) window.removeEventListener('resize', onResize) } catch {}
    }
  }, [openedIndex, servicesStep])

  // Анимация появления модального окна "Услуги"
  useEffect(() => {
    if (openedIndex !== 2) return
    const container = servicesModalRef.current
    if (!container) return
    
    // Анимируем появление модального окна
    gsap.set(container, { opacity: 0, y: 10 })
    gsap.to(container, { 
      opacity: 1, 
      y: 0, 
      duration: 0.4, 
      ease: 'power2.out',
      delay: 0.1
    })
  }, [openedIndex])

  // Reset inline morph button when leaving pick step, switching category, or changing tier
  useEffect(() => {
    if (servicesStep !== 'pick') setInlineNextFor(null)
  }, [servicesStep])

  // When returning to Step 1, hide the top Next button until user interacts again
  useEffect(() => {
    if (servicesStep === 'pick') {
      setStep1Interacted(false)
    }
  }, [servicesStep])

  useEffect(() => {
    // If user changes services category, clear any inline-next state
    setInlineNextFor(null)
  }, [servicesCategory])

  useEffect(() => {
    // If tier changes externally (e.g., via mobile nav), ensure morph state doesn't linger on a mismatched card
    // Compare using normalized tier names so IDs like 'bot-optimal' match servicesTier 'optimal'.
    if (!inlineNextFor) return;
    const toTier = (id) => {
      if (!id) return null;
      if (id.includes('premium')) return 'premium';
      if (id.includes('optimal')) return 'optimal';
      if (id.includes('basic')) return 'basic';
      return null; // e.g., automation 'auto-custom' — don't auto-clear based on tier
    };
    const normalized = toTier(inlineNextFor);
    if (!normalized) return;
    if (normalized !== servicesTier) setInlineNextFor(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicesTier, inlineNextFor])

  // Allow ESC to cancel inline-next morph on desktop while pick step is open
  useEffect(() => {
    if (openedIndex !== 2 || servicesStep !== 'pick') return
    const onKeyDown = (e) => { if (e.key === 'Escape') setInlineNextFor(null) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openedIndex, servicesStep])

  // animate category change: slide out current, swap content, slide in new
  const isProjectsAnimatingRef = useRef(false)
  const changeProjectsCategory = (newCat, dir = 0, animateSlide = true) => {
    if (newCat === projectsCategory) return
    if (isProjectsAnimatingRef.current) return
    isProjectsAnimatingRef.current = true
    const el = mobilePaneRef.current || mobileListRef.current
    try { gsap.killTweensOf(el) } catch { }
    if (el) {
      gsap.to(el, {
        opacity: 0, y: 4, duration: 0.08, ease: 'power2.in', onComplete: () => {
          setProjectsCategory(newCat)
        }
      })
    } else {
      setProjectsCategory(newCat)
    }
  }

  useEffect(() => {
    const el = mobilePaneRef.current || mobileListRef.current
    if (!el) return
    // анимация появления карточек проектов при смене категории
    const children = Array.from(el.children)
    gsap.set(children, { opacity: 0, y: 4 })
    gsap.to(el, { opacity: 1, duration: 0.01 })
    gsap.to(children, { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out', stagger: 0.03, onComplete: () => { isProjectsAnimatingRef.current = false } })
  }, [projectsCategory])

  const positionServicesIndicator = () => {
    const ind = indicatorRef.current
    const tabs = {
      web: tabWebRef.current,
      bots: tabBotsRef.current,
      automation: tabAutoRef.current,
    }
    const active = tabs[servicesCategory]
    if (!(ind && active && tabsRowRef.current)) return
    requestAnimationFrame(() => {
      const left = active.offsetLeft
      const width = active.offsetWidth
      gsap.to(ind, { left, width, duration: 0.35, ease: 'power2.out' })
    })
  }

  const positionMobileIndicator = () => {
    const ind = mobileIndicatorRef.current
    const tabs = {
      web: navWebRef.current,
      bots: navBotsRef.current,
      tools: navToolsRef.current,
    }
    const active = tabs[projectsCategory]
    if (!(ind && active && active.parentElement)) return
    requestAnimationFrame(() => {
      try {
        const rect = active.getBoundingClientRect()
        const parentRect = active.parentElement.getBoundingClientRect()
        const left = Math.round(rect.left - parentRect.left)
        const width = Math.max(24, Math.round(rect.width))
        gsap.to(ind, { left, width, duration: 0.35, ease: 'power2.out' })
      } catch (err) { }
    })
  }

  useEffect(() => {
    // position indicator when category changes or on mount
    positionMobileIndicator()
    const onResize = () => positionMobileIndicator()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [projectsCategory])

  const switchCategory = (nextCat) => {
    if (nextCat === servicesCategory) return
    if (isServicesSwitchingRef.current) return
    isServicesSwitchingRef.current = true
  setStep1Interacted(true)
    const grid = servicesGridRef.current
    try { gsap.killTweensOf(grid) } catch { }
    if (grid) {
      gsap.to(grid, {
        opacity: 0, y: 4, duration: 0.08, ease: 'power2.in', onComplete: () => {
          setServicesCategory(nextCat)
        }
      })
    } else {
      setServicesCategory(nextCat)
    }
  }

  useEffect(() => {
    const grid = servicesGridRef.current
    if (!grid) return
    // slide/fade анимация появления карточек
    const children = Array.from(grid.children)
    gsap.set(children, { opacity: 0, y: 4 })
    gsap.to(grid, { opacity: 1, duration: 0.01 })
    gsap.to(children, { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out', stagger: 0.03, onComplete: () => { isServicesSwitchingRef.current = false } })
    // анимация индикатора под активным заголовком
    // Индикатор больше не используется — подчёркивание рисуем через ::after у активного заголовка
  }, [servicesCategory])

  // Позиционируем индикатор и анимируем карточки при первом открытии модалки "Услуги"
  useEffect(() => {
    if (openedIndex !== 2) return
  // При каждом открытии модалки "Услуги" начинаем со шага выбора услуги
  setServicesStep('pick')
  // Reset interaction flag on open of Services Step 1
  setStep1Interacted(false)
    // Всегда сбрасываем категорию на "web" при каждом открытии модалки
    if (servicesCategory !== 'web') {
      setServicesCategory('web')
      isServicesSwitchingRef.current = false
      // подождём, пока сменится категория, затем выставим индикатор
      const t0 = setTimeout(() => positionServicesIndicator(), 0)
      return () => clearTimeout(t0)
    }
    positionServicesIndicator()
    // повторная установка через небольшой таймер, чтобы учесть завершающуюся FLIP‑анимацию модалки
    const t = setTimeout(positionServicesIndicator, 80)
    const grid = servicesGridRef.current
    if (grid) {
      const children = Array.from(grid.children)
      gsap.set(children, { opacity: 0, y: 8 })
      gsap.to(children, { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out', stagger: 0.06 })
    }
    return () => clearTimeout(t)
  }, [openedIndex])

  // Перепозиционирование индикатора при ресайзе/изменении шрифтов
  useEffect(() => {
    if (openedIndex !== 2) return
    const onResize = () => positionServicesIndicator()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [openedIndex, servicesCategory])
  const cards = [
    { title: 'О себе' },
    { title: 'Проекты' },
    { title: 'Услуги' },
    { title: 'Контакты' }
  ]

  // Данные сервисов и проектов вынесены за компонент (см. верх файла)

  // Утилита: мгновенно останавливает анимации dither и возвращает слой к базовому состоянию
  const resetGlobalDither = (props = null) => {
    const gd = globalDitherRef.current
    if (!gd) return
    try { ditherBreatheTlRef.current?.kill(); ditherBreatheTlRef.current = null } catch {}
    gsap.killTweensOf(gd)
    gd.classList.remove('front')
    const base = {
      opacity: 0,
      clipPath: 'inset(0 100% 100% 0 round 16px)',
      top: 0,
      left: 0,
      width: '100%',
      height: '100dvh',
      right: 'auto',
      bottom: 'auto'
    }
    gsap.set(gd, props ? { ...base, ...props } : base)
  }

  // Mark menu as ready after layout settles (2 RAFs + fonts), then run queued open if any
  useEffect(() => {
    let raf1 = 0, raf2 = 0, t = 0
    const settle = () => {
      menuReadyRef.current = true
      if (pendingOpenRef.current != null && openedIndex === null) {
        const idx = pendingOpenRef.current
        pendingOpenRef.current = null
        // Defer to next frame to be safe
        requestAnimationFrame(() => openCardFullscreen(idx))
      }
    }
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        try {
          const hasFonts = typeof document !== 'undefined' && document.fonts
          const ready = hasFonts ? document.fonts.ready : null
          const hasThen = !!(ready && typeof ready.then === 'function')
          if (hasThen) {
            ready.then(() => { t = setTimeout(settle, 20) })
          } else {
            t = setTimeout(settle, 20)
          }
        } catch {
          t = setTimeout(settle, 20)
        }
      })
    })
    return () => { try { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); clearTimeout(t) } catch {} }
  }, [openedIndex])

  // Init desktop animations helper (no-op on mobile/reduced motion) with dynamic import
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const mod = await import('../utils/DesktopModalAnimations')
        const Ctor = mod && mod.default
        if (!cancelled && typeof Ctor === 'function') {
          desktopAnimatorRef.current = new Ctor()
        }
      } catch (e) {
        // ignore – desktop animations are optional
      }
    })()
    return () => { cancelled = true; desktopAnimatorRef.current = null }
  }, [])

  const handleHover = (index, isHovering) => {
    // На сенсорных устройствах отключаем hover-анимации, чтобы контент не "съезжал"
    if (isTouchRef.current) return
    // Игнорируем любые hover-изменения, пока открыта/закрывается модалка
    if (isModalOpenRef.current) return
    const cardElement = cardRefs.current[index]
    if (!cardElement) return

    // Узкая dead-zone 3px на границе между "О себе" (0) и "Проекты" (1)
    if (index === 1 && isHovering) {
      const leftCard = cardRefs.current[0]
      if (leftCard) {
        const r0 = leftCard.getBoundingClientRect()
        const { x } = mousePosRef.current
        if (Math.abs(x - r0.right) <= 3) {
          return
        }
      }
    }

    // Защита от ложного mouseleave сразу после закрытия модалки
    if (!isHovering) {
      const until = hoverLockRef.current[index]
      if (until && performance.now() < until) {
        return
      }
    }

    // Единственный заголовок (позиция не меняется)
    const title = cardElement.querySelector(`.title-${index}`)

    // Стоп текущей таймлайн на этой карточке
    const tlPrev = hoverTimelinesRef.current[index]
    if (tlPrev) tlPrev.kill()
  gsap.killTweensOf([title])
    if (title) gsap.set(title, { x: 0, clearProps: 'transform' })

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
  // Текст не трогаем — только dither
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

  const openCardFullscreen = (index, event) => {
    // Early exit for performance
    if (openedIndex !== null) return
    
    // If page just mounted and layout isn't settled yet, queue the intent
    if (!menuReadyRef.current) {
      pendingOpenRef.current = index
      return
    }
    
    // Simplified event validation for better performance
    if (event) {
      const el = cardRefs.current[index]
      if (!el) return
      
      // Quick bounds check instead of detailed coordinate validation
      const rect = el.getBoundingClientRect()
      let x, y
      if (event.touches?.length) {
        x = event.touches[0].clientX
        y = event.touches[0].clientY
      } else if (event.changedTouches?.length) {
        x = event.changedTouches[0].clientX
        y = event.changedTouches[0].clientY
      } else {
        x = event.clientX
        y = event.clientY
      }
      
      // If click is outside the intended card, ignore
      if (x !== undefined && y !== undefined) {
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
          return
        }
      }
    }

    const el = cardRefs.current[index]
    if (!el) return
    
    // Performance optimizations
    lastHoveredBeforeOpenRef.current = index
    lastOpenModalIndexRef.current = index
    isModalOpenRef.current = true
    
    // Quick state updates
    if (index === 1) {
      setProjectsCategory('web')
    }
    
    // Batch DOM operations for better performance
    requestAnimationFrame(() => {
      // Reset section transforms immediately
      const sectionEl = document.querySelector('section')
      if (sectionEl) {
        sectionEl.style.cssText = 'transform: none; opacity: 1; filter: none; transition: none;'
      }
      
      // Kill hover animations efficiently
      hoverTimelinesRef.current.forEach((tl, i) => {
        if (i !== index && tl) tl.kill()
      })
      
      // Reduce particle activity
      setParticleSpeed?.(0.4)
      
      // Optimized dither animation
      handleDitherAnimation(index, el)
      
      // Hide other cards immediately for smoother transition
      hideOtherCards(index)
      
      // Main flip animation with optimizations
      performCardFlip(index, el)
    })
  }
  
  const handleDitherAnimation = (index, el) => {
    const gd = globalDitherRef.current
    if (!gd) return
    
    resetGlobalDither()
    const ditherDuration = isTouchRef.current ? 0.2 : 0.5 // Reduced duration
    
    if (isTouchRef.current) {
      // Simplified mobile animation
      setGlobalDitherColorIndex(index)
      let bg = 'rgba(6,6,12,0.98)'
      if (index === 1) bg = 'rgba(139,92,246,0.94)'
      else if (index === 2) bg = 'rgba(34,197,94,0.92)' 
      else if (index === 3) bg = 'rgba(186,26,26,0.92)'
      
      gsap.set(gd, { 
        position: 'fixed', 
        inset: 0, 
        width: '100%', 
        height: '100dvh', 
        borderRadius: 0, 
        opacity: 0, 
        clipPath: 'none', 
        backgroundColor: bg 
      })
      gsap.to(gd, { 
        opacity: 1, 
        duration: ditherDuration, 
        ease: 'power2.out',
        onComplete: () => {
          // Запускаем дыхание dither и на мобильных, чтобы он не "застывал"
          try {
            ditherBreatheTlRef.current?.kill()
            ditherBreatheTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
              .to(gd, { opacity: 0.35, duration: 2.4, ease: 'sine.inOut' })
          } catch {}
        }
      })
    } else {
      // Optimized desktop FLIP
      gd.classList.add('front')
      const rect = el.getBoundingClientRect()
      
      gsap.set(gd, { 
        opacity: 1, 
        clipPath: 'none', 
        position: 'fixed',
        top: rect.top, 
        left: rect.left, 
        width: rect.width, 
        height: rect.height, 
        right: 'auto',
        bottom: 'auto',
        borderRadius: 16,
        transformOrigin: 'center center'
      })
      
      const ditherState = Flip.getState(gd)
  gsap.set(gd, { top: 0, left: 0, width: '100%', height: '100dvh', borderRadius: 0 })
      
      Flip.from(ditherState, {
        duration: ditherDuration, 
        ease: 'power2.inOut', 
        absolute: true,
        onComplete: () => {
          gd.classList.remove('front')
          // Simplified breathing animation
          if (!isTouchRef.current) {
            ditherBreatheTlRef.current?.kill()
            ditherBreatheTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
              .to(gd, { opacity: 0.3, duration: 2.5, ease: 'sine.inOut' })
          }
        }
      })
    }
  }
  
  const hideOtherCards = (index) => {
    cardRefs.current.forEach((card, i) => {
      if (card && i !== index) {
        card.style.pointerEvents = 'none'
        gsap.set(card, { autoAlpha: 0 })
      }
    })
  }
  
  const performCardFlip = (index, el) => {
    const state = Flip.getState(el)
    el.classList.add('is-open')
    setOpenedIndex(index)
    
    // Optimized flip animation
    Flip.from(state, {
      duration: isTouchRef.current ? 0.25 : 0.4, // Reduced duration
      ease: isTouchRef.current ? 'power2.out' : 'power2.inOut',
      absolute: true,
      scale: false,
      nested: true,
      delay: isTouchRef.current ? 0 : 0.1, // Reduced delay
      onComplete: () => {
        // Desktop progressive reveal
        if (!isTouchRef.current) {
          const content = el.querySelector('.about-modal, [data-testid="projects-modal"], .services-modal, .projects-modal, .modal-content')
          desktopAnimatorRef.current?.animateModalOpen(el, content)
        }
      }
    })
    
    // Mobile content animation
    if (isTouchRef.current) {
      performMobileExpansion(index, el)
      requestAnimationFrame(() => {
        const content = el.querySelector('.about-modal, [data-testid="projects-modal"], .services-modal, .projects-modal, .modal-content')
        if (content) {
          gsap.fromTo(content, 
            { opacity: 0, y: 20 }, 
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
          )
        }
      })
    }
  }

  // Helper function for mobile expansion animation
  const performMobileExpansion = (index, el) => {
    if (!isTouchRef.current) return
    
    try {
      const rect = el.getBoundingClientRect()
      const clone = el.cloneNode(true)
      try {
        // Remove original heading inside clone to avoid duplicate title during animation
        const oldTitle = clone.querySelector(`.title-${index}`)
        if (oldTitle) oldTitle.remove()
      } catch {}
      
      // Setup clone
      Object.assign(clone.style, {
        position: 'fixed',
        top: rect.top + 'px',
        left: rect.left + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        margin: '0',
        zIndex: '99999',
        transform: 'none',
        transition: 'none',
        pointerEvents: 'none'
      })
      
      clone.setAttribute('aria-hidden', 'true')
      document.body.appendChild(clone)

      // Simplified mobile expansion animation
      const gd = globalDitherRef.current
      if (gd) {
        const startClip = computeClipFromElement(el)
        const fullClip = 'inset(0px 0px 0px 0px)'
        gsap.set(gd, { 
          position: 'fixed', 
          inset: 0, 
          width: '100%', 
          height: '100dvh', 
          borderRadius: 0, 
          clipPath: startClip, 
          opacity: 0, 
          backgroundColor: gd.style.backgroundColor || '' 
        })

        // Remove any existing edge bars
        document.querySelectorAll('.__dither-edge-top, .__dither-edge-bottom').forEach(el => el.remove())

        // Optimized animation timeline
        const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
        tl.to(clone, { 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          duration: 0.4 
        }, 0)
        tl.to(gd, { 
          clipPath: fullClip, 
          opacity: 1, 
          duration: 0.35, 
          ease: 'power2.out' 
        }, 0)
        tl.to(clone, { 
          opacity: 1, 
          duration: 0.2 
        }, '-=0.2')

        // Cleanup
        tl.call(() => {
          if (clone?.parentNode) clone.parentNode.removeChild(clone)
          // Анимация появления контента About после завершения расширения
          try {
            const about = el.querySelector('.about-modal')
            if (about) {
              gsap.fromTo(about, { opacity: 0, y: 14, scale: 0.985 }, { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: 'power2.out' })
            }
          } catch {}
        })
      }
    } catch (err) { 
      console.warn('Mobile expansion animation failed:', err)
    }
  }

  const closeCardFullscreen = (index) => {
    const el = cardRefs.current[index]
    if (!el) return
    try { setParticleSpeed?.(1.0) } catch { }
    // На сенсорных: одиночный тап по открытому блоку — закрыть и снять принудительный hover
    if (isTouchRef.current) {
      cardRefs.current.forEach((c) => c && c.classList.remove('force-hover'))
    }
    // Блокируем закрытие hover на короткое время после старта закрытия
    hoverLockRef.current[index] = performance.now() + 600
    const gd = globalDitherRef.current
    const state = Flip.getState(el)
    // Desktop: progressive content exit before flip-back
    if (!isTouchRef.current) {
      try {
        const content = el.querySelector('.about-modal, [data-testid="projects-modal"], .services-modal, .projects-modal, .modal-content')
        desktopAnimatorRef.current?.animateModalClose(el, content)
      } catch {}
    }
    // Заголовок: при закрытии просто исчезает (fade-out), чтобы не "уезжать" вместе с Flip
    const titleEl = el.querySelector(`.title-${index}`)
    if (titleEl) {
      gsap.set(titleEl, { willChange: 'opacity' })
      gsap.to(titleEl, { opacity: 0, duration: isTouchRef.current ? 0.18 : 0.26, ease: 'power2.out' })
    }
    // don't remove the .is-open class or reset opened index until after FLIP animation completes
    // Run Flip and dither/bars animation concurrently on mobile to avoid sequential delay
    const runCloseAnimations = async () => {
      const flipPromise = new Promise((resolve) => {
        Flip.from(state, {
          duration: isTouchRef.current ? 0.18 : 0.44,
          ease: isTouchRef.current ? 'power2.in' : 'power2.inOut',
          absolute: true,
          scale: false,
          nested: true,
          onComplete: resolve
        })
      })

      const gdAnimPromise = new Promise((resolve) => {
        if (!gd) return resolve()
        // Останавливаем дыхание dither
        ditherBreatheTlRef.current?.kill()
        if (isTouchRef.current) {
          try {
            // Просто затемнить global dither без анимации баров (они больше не создаются)
            const endClip = computeClipFromElement(el)
            gsap.to(gd, { clipPath: endClip, opacity: 0, duration: 0.26, ease: 'sine.inOut', onComplete: () => {
              gd.classList.remove('front')
              try { gd.style.backgroundColor = ''; } catch {}
              // Убираем обработчики если были установлены
              try {
                if (edgeBarsCleanupRef.current) {
                  document.removeEventListener('scroll', edgeBarsCleanupRef.current)
                  document.removeEventListener('touchmove', edgeBarsCleanupRef.current)
                  edgeBarsCleanupRef.current = null
                }
              } catch (e) { }
              resolve()
            } })
          } catch (err) {
            gsap.to(gd, { opacity: 0, duration: 0.12, ease: 'power2.in', onComplete: () => { try { gd.classList.remove('front'); gd.style.backgroundColor = '' } catch {} ; resolve() } })
          }
        } else {
          const endClip = computeClipFromElement(el)
          gsap.to(gd, {
            clipPath: endClip,
            duration: 0.24,
            ease: 'power2.inOut',
            onComplete: () => {
              try { gd.classList.remove('front') } catch {}
              // Полный сброс к базовому состоянию для предотвращения смещений hover
              resetGlobalDither()
              resolve()
            }
          })
        }
      })

      // wait for both animations to finish
      await Promise.all([flipPromise, gdAnimPromise])

      // cleanup & restore UI state
      try { el.classList.remove('is-open') } catch (e) {}
      try { setOpenedIndex(null) } catch (e) {}
      try { lastOpenModalIndexRef.current = null } catch (e) {}
      if (titleEl) {
        gsap.set(titleEl, { opacity: 1 })
      }

      // Возвращаем видимость и интерактив остальных карточек
      cardRefs.current.forEach((card) => {
        if (!card) return
        gsap.killTweensOf(card)
        gsap.set(card, { clearProps: 'opacity,visibility' })
        gsap.to(card, { autoAlpha: 1, duration: 0.2, ease: 'power2.out', onComplete: () => { try { card.style.pointerEvents = 'auto' } catch {} } })
      })

      // Разрешаем обработку hover после закрытия
      isModalOpenRef.current = false
      // After closing, do not auto-select any card; clear any forced hover to avoid accidental underline
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          cardRefs.current.forEach((c) => c && c.classList.remove('force-hover'))
          lastHoveredBeforeOpenRef.current = null
        })
      })
    }

    runCloseAnimations()
  }

  // Подключаем интерактивное управление частицами
  const sensitivity = useMemo(() => ({ wheel: 0.002, touch: 0.005 }), [])
  const isMobileDevice = useMemo(() => window.innerWidth <= 768 || 'ontouchstart' in window, [])
  const { resetRotation } = useParticleControl(camera, !isMobileDevice && !!camera, sensitivity)

  useEffect(() => {
    window.scrollTo(0, 0);

    // Улучшенная анимация fade-in при загрузке без мерцания на мобильных
    const isMobileDevice = window.innerWidth <= 768 || 'ontouchstart' in window;
    
    if (isMobileDevice) {
      // На мобильных: более быстрая и мягкая анимация без задержки
      cards.forEach((_, index) => {
        const cardElement = cardRefs.current[index];
        if (!cardElement) return;
        
        // Устанавливаем начальное состояние сразу, без opacity: 0
        gsap.set(cardElement, { opacity: 1, y: 0 });
        
        // Легкая анимация появления только для контента внутри карточек
        const normalTitle = cardElement.querySelector(`.normal-title-${index}`);
        const normalDesc = cardElement.querySelector(`.normal-desc-${index}`);
        
        if (normalTitle) {
          gsap.fromTo(normalTitle, 
            { opacity: 0, y: 10 }, 
            { opacity: 1, y: 0, duration: 0.4, delay: index * 0.05 }
          );
        }
        
        if (normalDesc) {
          gsap.fromTo(normalDesc, 
            { opacity: 0, y: 8 }, 
            { opacity: 1, y: 0, duration: 0.4, delay: index * 0.05 + 0.1 }
          );
        }
      });
    } else {
      // На десктопе: оригинальная анимация
      cards.forEach((_, index) => {
        gsap.fromTo(`.card-${index}`,
          { opacity: 0, y: 0 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: index * 0.1
          }
        );

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
    }

    // Анимации появления контента модалки "О себе"
    if (aboutContainerRef.current) {
      const root = aboutContainerRef.current
      const title = root.querySelector('.about-title')
      const underline = root.querySelector('.about-title-underline')
      const paragraphs = root.querySelectorAll('.about-text p')
      const listItems = root.querySelectorAll('.about-list li')
  const photo = root.querySelector('.about-photo')

      // Стартовые состояния
      gsap.set(underline, { scaleX: 0 })
      gsap.set([...paragraphs, ...listItems], { opacity: 0, y: 12 })
      gsap.set(photo, { opacity: 0, scale: 0.96, rotateZ: -1 })

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      tl.to(underline, { scaleX: 1, duration: 0.5 }, 0.05)
        .to(paragraphs, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06 }, 0.08)
        .to(listItems, { opacity: 1, y: 0, duration: 0.45, stagger: 0.05 }, 0.25)
        .to(photo, { opacity: 1, scale: 1, rotateZ: 0, duration: 0.6, ease: 'power3.out' }, 0.15)
    }

    // Preload dither effects: только opacity, без изменения width
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const dither = card.querySelector(`.dither-bg-${index}`);
      if (!dither) return;
      gsap.set(dither, { opacity: 0 });
    });

    // Удалён обработчик левего edge, чтобы не блокировать hover первой карточки

  return () => {
      
      // Очистка debounce таймеров
      if (servicesNavDebounceRef.current) {
        clearTimeout(servicesNavDebounceRef.current)
      }
      if (tierNavDebounceRef.current) {
        clearTimeout(tierNavDebounceRef.current)
      }
      
      // Reset pending states
      pendingServicesCategoryRef.current = null
      isServicesUIUpdatingRef.current = false
    }
  }, [navigate])

  // Desktop-only: enable internal scrolling for About modal and parallax the photo slower than content
  useEffect(() => {
    if (openedIndex !== 0) return
    if (isTouchRef.current) return
    const container = aboutContainerRef.current
    if (!container) return

    // Ensure body doesn't block scrolling while modal handles it
    const prevOverflow = document.body.style.overflow
    const prevPad = document.body.style.paddingRight
    try {
      const bodyScrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${bodyScrollbarWidth}px`
    } catch {}

    // Move close button away from the modal's internal scrollbar
    const applyCloseOffset = () => {
      try {
        const innerScrollbarWidth = container.offsetWidth - container.clientWidth
        const offset = Math.max(0, innerScrollbarWidth - 2) + 4
        document.documentElement.style.setProperty('--close-right-offset', `${offset}px`)
      } catch {}
    }
    applyCloseOffset()
    const onResize = () => applyCloseOffset()
    window.addEventListener('resize', onResize)

    // Parallax: move photo wrapper at a slower rate
    const photoWrap = container.querySelector('.about-photo-wrap')
    const speed = 0.25 // 25% of scroll speed
    const onScroll = () => {
      const y = container.scrollTop * speed
      if (photoWrap) {
        gsap.to(photoWrap, { y: y, duration: 0.2, ease: 'power2.out', overwrite: true })
      }
    }
    // Prevent wheel from bubbling to window (which has a global wheel listener)
    const onWheelBlock = (e) => {
      e.stopPropagation()
      // Do not preventDefault so native scrolling of the container still occurs
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    container.addEventListener('wheel', onWheelBlock, { passive: true })
    // Initialize position
    onScroll()

    return () => {
  try { container.removeEventListener('scroll', onScroll) } catch {}
      try { container.removeEventListener('wheel', onWheelBlock) } catch {}
      try { gsap.killTweensOf(photoWrap) } catch {}
      try { if (photoWrap) gsap.set(photoWrap, { clearProps: 'transform' }) } catch {}
  try { document.body.style.overflow = prevOverflow; document.body.style.paddingRight = prevPad } catch {}
  try { document.documentElement.style.removeProperty('--close-right-offset') } catch {}
  try { window.removeEventListener('resize', onResize) } catch {}
    }
  }, [openedIndex])

  // Центрирование горизонтальных рядов в модалке «Проекты» и блокировка вертикального скролла
  useEffect(() => {
    if (openedIndex === 1) {
      try { 
        // Compensate for scrollbar width to prevent layout shift that causes visible seams
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollbarWidth}px`;
  // Also prevent any horizontal overflow on the root element while modal is open
  try { document.documentElement.style.overflowX = 'hidden' } catch (e) {}
      } catch { }
      // Центрируем каждый ряд по ширине контейнера
      requestAnimationFrame(() => {
        stripsRef.current.forEach((el) => {
          if (!el) return
          const center = Math.max(0, (el.scrollWidth - el.clientWidth) / 2)
          el.scrollLeft = center
        })
      })
    } else {
      try { 
        document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  try { document.documentElement.style.overflowX = '' } catch (e) {}
      } catch { }
    }

    return () => { 
      try { 
        document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  try { document.documentElement.style.overflowX = '' } catch (e) {}
      } catch { } 
    }
  }, [openedIndex])

  // Защита от layout-съезда после alt-tab/visibilitychange/resize
  useEffect(() => {
    const hardResetLayout = () => {
      if (document.hidden) return
      // Обновляем GSAP/ScrollTrigger измерения
      try { ScrollTrigger.refresh(true) } catch { }

      // Сбрасываем глобальный dither и зависшие твины
      try {
        resetGlobalDither({ opacity: 0, clipPath: 'inset(0 100% 100% 0 round 16px)' })
        gsap.killTweensOf(globalDitherRef.current)
      } catch { }

      // Восстанавливаем ВСЁ в зависимости от того, была ли открыта модалка
      try {
        hoverTimelinesRef.current.forEach((tl) => { try { tl?.kill() } catch { } })
        const openIdx = lastOpenModalIndexRef.current
        if (isModalOpenRef.current && openIdx !== null && openIdx !== undefined) {
          // Режим модалки: удерживаем открытую карточку и скрываем остальные
          cardRefs.current.forEach((el, i) => {
            if (!el) return
            gsap.killTweensOf(el)
            el.classList.remove('force-hover')
            if (i === openIdx) {
              el.classList.add('is-open')
              gsap.set(el, { opacity: 1, pointerEvents: 'auto' })
            } else {
              el.classList.remove('is-open')
              gsap.set(el, { opacity: 0, pointerEvents: 'none' })
            }
          })
          setOpenedIndex(openIdx)
          // Восстанавливаем dither как фон модалки
          const gd = globalDitherRef.current
          if (gd) {
            resetGlobalDither()
            gsap.set(gd, { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100dvh', borderRadius: 0, clipPath: 'none', opacity: 0.28 })
          }
          try { setParticleSpeed?.(0.4) } catch { }
        } else {
          // Обычный режим: всё видимо, модалка закрыта
          isModalOpenRef.current = false
          lastOpenModalIndexRef.current = null
          setOpenedIndex(null)
          setHoveredRect?.(null)
          cardRefs.current.forEach((el) => {
            if (!el) return
            gsap.killTweensOf(el)
            el.classList.remove('force-hover')
            el.classList.remove('is-open')
            el.classList.remove('dimmed')
            gsap.set(el, { opacity: 1, pointerEvents: 'auto' })
          })
          try { setParticleSpeed?.(1.0) } catch { }
          requestAnimationFrame(() => {
            stripsRef.current.forEach((el) => {
              if (!el) return
              const center = Math.max(0, (el.scrollWidth - el.clientWidth) / 2)
              el.scrollLeft = center
            })
          })
        }
      } catch { }
    }

    let lastHiddenAt = 0
    const onHidden = () => { lastHiddenAt = performance.now() }
    const onVisible = () => {
      // только если таб был в фоне заметное время
      if (performance.now() - lastHiddenAt > 500) hardResetLayout()
    }

    window.addEventListener('visibilitychange', () => document.hidden ? onHidden() : onVisible())
    window.addEventListener('focus', onVisible)
    window.addEventListener('resize', hardResetLayout)
    return () => {
      window.removeEventListener('visibilitychange', () => document.hidden ? onHidden() : onVisible())
      window.removeEventListener('focus', onVisible)
      window.removeEventListener('resize', hardResetLayout)
    }
  }, [])

  // Переход на /home при скролле вверх (только десктоп)
  useEffect(() => {
    const isMobileDevice = window.innerWidth <= 768 || 'ontouchstart' in window
    if (isMobileDevice) return

    const onWheelToHome = (e) => {
      if (isTransitioningRef.current) return
      // allow normal page scroll when Services subscription is open
      if (isModalOpenRef.current) return
      const deltaY = e.deltaY || 0
      // Навигация только при заметной прокрутке вверх
      if (deltaY >= -12) return
      isTransitioningRef.current = true
      if (typeof e.preventDefault === 'function') e.preventDefault()

      gsap.to(menuRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          sessionStorage.setItem('returning-to-home', 'true')
          navigate('/home')
        }
      })
    }

    window.addEventListener('wheel', onWheelToHome, { passive: false })
    return () => window.removeEventListener('wheel', onWheelToHome)
  }, [navigate, openedIndex, servicesStep])

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

  const windowScroll = false // removed subscription step logic
  return (
    <MenuContainer $windowScroll={windowScroll}>
      <Seo
        title="Портфолио и услуги — loony_boss"
        description="Web Development | Bots | Automation. Портфолио проектов, услуги разработки и поддержка по подписке. Открыть портфолио и выбрать формат работы."
        canonical="https://www.loonyboss.com/menu"
        ogImage="/images/photo1.webp"
      />
      <CustomCursor />

      {/* Удалён левый edge для возврата домой, чтобы не перекрывать первую карточку */}

  <Section ref={menuRef} $windowScroll={windowScroll}>
        <GlobalDither ref={globalDitherRef} aria-hidden="true">
          {isMounted && (
            <ErrorBoundary fallback={null}>
              <Suspense fallback={null}>
                <DitherLazy style={{ position: 'absolute', inset: 0 }} waveColor={waveColors[globalDitherColorIndex]} enableMouseInteraction={true} trackWindowMouse={true} mouseRadius={0.4} />
              </Suspense>
            </ErrorBoundary>
          )}
        </GlobalDither>
  <CardRow $windowScroll={windowScroll}>
          {cards.map((card, index) => (
            <React.Fragment key={index}>
              <Card
                ref={(el) => (cardRefs.current[index] = el)}
                className={`card-${index}`}
                onPointerEnter={() => { handleHover(index, true) }}
                onPointerLeave={() => { handleHover(index, false) }}
                onClick={(e) => {
                  // For all indices including contacts (3) use unified fullscreen flow now
                  openCardFullscreen(index, e)
                }}
                tabIndex={0}
                role="button"
                aria-disabled={false}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openCardFullscreen(index, e)
                  }
                }}
              >
                {/* per-card dither удален, используем глобальный */}
                <CardContent>
                  {openedIndex !== index && (
                    <>
                      <TitleSection>
      <CardTitle className={`title-${index}`}>{card.title}</CardTitle>
                      </TitleSection>
                    </>
                  )}

                  {openedIndex === index && index === 0 && (
                    <AboutModalContent ref={aboutContainerRef} className="about-modal">
                      <AboutLeft>
                        <AboutTitle className="about-title">О себе<AboutTitleUnderline className="about-title-underline" /></AboutTitle>
                        {/* Mobile polaroid carousel right under the heading */}
                        <PolaroidCarousel isMobile={true} />
                        <AboutText className="about-text">
                          <p>Привет, меня зовут Михаил! Я разрабатываю сайты, веб‑приложения, Telegram‑ и WhatsApp‑ботов, а также автоматизирую бизнес‑процессы, чтобы сэкономить твоё время, повысить эффективность и увеличить прибыль.</p>
                          <p>Мои клиенты — от стартапов до компаний — ценят скорость погружения в суть, умение предлагать нестандартные, но практичные решения и чёткое соблюдение сроков. Я избегаю лишней бюрократии, но всегда добиваюсь того, чтобы результат был стильным, продуманным и качественным.</p>
                          <AboutCaption className="about-caption">Как я работаю</AboutCaption>
                          <ul className="about-list">
                            <li>Мы обсуждаем задачу и формируем понятную концепцию.</li>
                            <li>Я готовлю чёткий план: этапы, объём, сроки.</li>
                            <li>Реализую и держу тебя в курсе. Вношу правки по ходу.</li>
                          </ul>
                          <AboutCaption className="about-caption">Вопрос-ответ</AboutCaption>
                          <FAQAccordionGreen className="faq-accordion">
                            <details>
                              <summary>Что делать, если я не разбираюсь в технических деталях?</summary>
                              <div className="faq-content"><div className="faq-content-inner">
                                <div className="faq-answer">
                                  <p>Это не проблема. Я объясняю простыми словами, без «айтишного жаргона», и беру на себя всю техническую часть. Тебе нужно только рассказать, какой результат ты хочешь — остальное я сделаю сам.</p>
                                </div>
                              </div></div>
                            </details>

                            <details>
                              <summary>Можно ли вносить изменения в проект по ходу работы?</summary>
                              <div className="faq-content"><div className="faq-content-inner">
                                <div className="faq-answer">
                                  <p>Да, можно. Небольшие правки я вношу без проблем. Если изменения крупные — мы обсуждаем их отдельно, потому что они могут повлиять на сроки и бюджет.</p>
                                </div>
                              </div></div>
                            </details>

                            <details>
                              <summary>Что ты делаешь, если я не знаю, чего хочу?</summary>
                              <div className="faq-content"><div className="faq-content-inner">
                                <div className="faq-answer">
                                  <p>Помогаю разобраться. Я задаю правильные вопросы, структурирую твои мысли и предлагаю варианты решений. В итоге вместе формируем понятное техническое задание, с которым можно уверенно двигаться дальше.</p>
                                </div>
                              </div></div>
                            </details>

                            <details>
                              <summary>Что такое подписочная система?</summary>
                              <div className="faq-content"><div className="faq-content-inner">
                                <div className="faq-answer">
                                  <p>Подписка — это ваш личный мини‑IT‑отдел по фиксированной цене в месяц. Вместо того чтобы тратить время на поиск фрилансеров или собирать отдельную команду для поддержки вашего проекта, вы просто оформляете подписку. Все задачи по развитию и поддержке проекта выполняются регулярно, быстро и с приоритетом, а вы получаете стабильный результат без лишней головной боли.</p>
                                  <p><a href="https://loonyboss.com/menu/subscription" target="_blank" rel="noopener" style={{ color: 'var(--primary-green, #22c55e)' }}>Подробнее о подписке →</a></p>
                                </div>
                              </div></div>
                            </details>

                            <details>
                              <summary>Можешь ли ты подключаться к уже существующему проекту и дорабатывать его?</summary>
                              <div className="faq-content"><div className="faq-content-inner">
                                <div className="faq-answer">
                                  <p>Да. Часто ко мне приходят после других разработчиков. Я могу оптимизировать код, исправить ошибки, ускорить работу сайта или бота и довести проект до нужного результата.</p>
                                </div>
                              </div></div>
                            </details>

                            <details>
                              <summary>Что для тебя значит «сделать хорошо»?</summary>
                              <div className="faq-content"><div className="faq-content-inner">
                                <div className="faq-answer">
                                  <p>Это значит создать надёжный, удобный и качественный продукт, который работает без сбоев, одинаково хорошо открывается на любых устройствах и понятен каждому пользователю.</p>
                                </div>
                              </div></div>
                            </details>
                          </FAQAccordionGreen>
                        </AboutText>
                      </AboutLeft>
                      <AboutRight>
                        <PolaroidCarousel isMobile={false} />
                      </AboutRight>
                    </AboutModalContent>
                  )}

                  {openedIndex === index && index === 1 && (
                    <ProjectsModalWrap
                      data-testid="projects-modal"
                      onTouchStart={onProjectsTouchStart}
                      onTouchEnd={onProjectsTouchEnd}
                      onClickCapture={(e) => {
                        if (isProjectsInteractionLocked) {
                          // Разрешаем кнопки категорий и кнопку закрытия
                          const allowed = e.target.closest && e.target.closest('button.nav-btn, .close-btn, [data-allow-during-lock="true"]')
                          if (!allowed) {
                            e.stopPropagation()
                            e.preventDefault()
                          }
                        }
                      }}
                      aria-busy={isProjectsInteractionLocked ? 'true' : undefined}
                    >
                      {!isProjectsContentReady && (
                        <div style={{
                          position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(2px)', zIndex: 50,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                          fontSize: 14, fontWeight: 500, color: '#222'
                        }}>
                          <div style={{ animation: 'pulse 1.2s ease-in-out infinite' }}>Загружаю превью…</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>Переход в кейс станет доступен сразу после подготовки</div>
                        </div>
                      )}
                      <ProjectsTopTitle $compactTop>Проекты</ProjectsTopTitle>
                      <MobileProjectsNavigation data-testid="mobile-projects-nav">
                        <NavButton
                          ref={navBotsRef}
                          className={`nav-btn ${projectsCategory === 'bots' ? 'active' : ''}`}
                          onClick={(e) => handleProjectsNavButtonClick('bots', e)}
                          data-testid="nav-button-bots"
                        >
                          Боты
                        </NavButton>
                        <NavButton
                          ref={navWebRef}
                          className={`nav-btn ${projectsCategory === 'web' ? 'active' : ''}`}
                          onClick={(e) => handleProjectsNavButtonClick('web', e)}
                          data-testid="nav-button-web"
                        >
                          Сайты
                        </NavButton>
                        <NavButton
                          ref={navToolsRef}
                          className={`nav-btn ${projectsCategory === 'tools' ? 'active' : ''}`}
                          onClick={(e) => handleProjectsNavButtonClick('tools', e)}
                          data-testid="nav-button-tools"
                        >
                          Софт
                        </NavButton>
                        <MobileNavIndicator ref={mobileIndicatorRef} />
                      </MobileProjectsNavigation>

                      <div ref={mobilePaneRef} style={{ display: 'block' }}>
                        <MobileProjectsList ref={mobileListRef} data-testid="projects-list" onTouchMove={onProjectsTouchMove}>
                          {(projectsCategory === 'web' ? projectsRows.web : (projectsCategory === 'bots' ? projectsRows.bots : projectsRows.tools)).map(p => (
                            <div key={p.id} style={{ padding: 12 }} onClick={(e) => onProjectCardClick(e, p)}>
                              <ProjectCard style={{ width: '100%' }}>
                                <CardInner className={mobileFlippedId === p.id ? 'force-flip' : ''}>
                                  <CardFront>
                                    <DevBadge $status={p.status === 'done' ? 'done' : 'wip'}>{p.status === 'done' ? 'Готово' : 'В разработке'}</DevBadge>
                                    <CardImage style={{ backgroundImage: `url(${p.image})` }} />
                                    <CardOverlay />
                                    <CardText>
                                      <h4>{p.title}</h4>
                                      <p>{p.description}</p>
                                    </CardText>
                                  </CardFront>
                                  <CardBack>
                                    {p.id !== 'raykhan' && p.id !== 'lightlab' && (
                                      <CardGoIcon type="button" aria-label="Открыть проект" onClick={(e)=>{ e.stopPropagation(); handleProjectNavigation(p.href) }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                          <path d="M7 17L17 7" />
                                          <path d="M9 7H17V15" />
                                        </svg>
                                      </CardGoIcon>
                                    )}
                                    <CardBackTitle>{p.title}</CardBackTitle>
                                    <div style={{ fontSize: 13, opacity: 0.9 }}>{p.description}</div>
                                    <TechChips>
                                      {(p.tech || []).map(t => (<span key={t} className="chip">{t}</span>))}
                                    </TechChips>
                                  </CardBack>
                                </CardInner>
                              </ProjectCard>
                            </div>
                          ))}
                        </MobileProjectsList>
                      </div>
                      <DesktopProjects>
                        <ProjectsRow>
                          <RowHeader>Веб‑приложения / сайты</RowHeader>
                          <RowScroller>
                            <CardsStrip ref={el => stripsRef.current[0] = el}>
                              {projectsRows.web.map(p => (
                                <ProjectCard key={p.id} onClick={(e) => onProjectCardClick(e, p)}>
                                  <CardInner className={mobileFlippedId === p.id ? 'force-flip' : ''}>
                                    <CardFront>
                                      <DevBadge $status={p.status === 'done' ? 'done' : 'wip'}>{p.status === 'done' ? 'Готово' : 'В разработке'}</DevBadge>
                                      <CardImage style={{ backgroundImage: `url(${p.image})` }} />
                                      <CardOverlay />
                                      <CardText>
                                        <h4>{p.title}</h4>
                                        <p>{p.description}</p>
                                      </CardText>
                                    </CardFront>
                                    <CardBack>
                                      {p.id !== 'raykhan' && p.id !== 'lightlab' && (
                                        <CardGoIcon type="button" aria-label="Открыть проект" onClick={(e)=>{ e.stopPropagation(); handleProjectNavigation(p.href) }}>
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M7 17L17 7" />
                                            <path d="M9 7H17V15" />
                                          </svg>
                                        </CardGoIcon>
                                      )}
                                      <CardBackTitle>{p.title}</CardBackTitle>
                                      <CardBackMeta>
                                        <span>{p.role || 'Role'}</span>
                                        <span className="dot" />
                                        <span>{p.year || ''}</span>
                                      </CardBackMeta>
                                      <TechChips>
                                        {(p.tech || []).slice(0, 2).map(t => (<span key={t} className="chip" data-tech={t.toLowerCase()}>{t}</span>))}
                                        {((p.tech || []).length > 2) && (
                                          <span className="chip more" data-tech="more">+{(p.tech || []).length - 2}</span>
                                        )}
                                      </TechChips>
                                      <ProjectFeaturesList>
                                        {(p.features || []).slice(0, 2).map((f, i) => (
                                          <ProjectFeatureItem key={i}>{f}</ProjectFeatureItem>
                                        ))}
                                      </ProjectFeaturesList>
                                      {/* Убрана кнопка "Подробнее" – теперь клик по всей карточке */}
                                    </CardBack>
                                  </CardInner>
                                </ProjectCard>
                              ))}
                            </CardsStrip>
                          </RowScroller>
                        </ProjectsRow>

                        <ProjectsRow>
                          <RowHeader>Боты</RowHeader>
                          <RowScroller>
                            <CardsStrip ref={el => stripsRef.current[1] = el}>
                              {projectsRows.bots.map(p => (
                                <ProjectCard key={p.id} onClick={(e) => onProjectCardClick(e, p)}>
                                  <CardInner className={mobileFlippedId === p.id ? 'force-flip' : ''}>
                                    <CardFront>
                                      <DevBadge $status={p.status === 'done' ? 'done' : 'wip'}>{p.status === 'done' ? 'Готово' : 'В разработке'}</DevBadge>
                                      <CardImage style={{ backgroundImage: `url(${p.image})` }} />
                                      <CardOverlay />
                                      <CardText>
                                        <h4>{p.title}</h4>
                                        <p>{p.description}</p>
                                      </CardText>
                                    </CardFront>
                                    <CardBack>
                                      {p.id !== 'raykhan' && p.id !== 'lightlab' && (
                                        <CardGoIcon type="button" aria-label="Открыть проект" onClick={(e)=>{ e.stopPropagation(); handleProjectNavigation(p.href) }}>
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" >
                                            <path d="M7 17L17 7" />
                                            <path d="M9 7H17V15" />
                                          </svg>
                                        </CardGoIcon>
                                      )}
                                      <CardBackTitle>{p.title}</CardBackTitle>
                                      <div style={{ fontSize: 13, opacity: 0.9 }}>{p.description}</div>
                                      <TechChips>
                                        {(p.tech || []).map(t => (<span key={t} className="chip" data-tech={t.toLowerCase()}>{t}</span>))}
                                      </TechChips>
                                    </CardBack>
                                  </CardInner>
                                </ProjectCard>
                              ))}
                            </CardsStrip>
                          </RowScroller>
                        </ProjectsRow>

                        <ProjectsRow>
                          <RowHeader>Программы / автоматизации</RowHeader>
                          <RowScroller>
                            <CardsStrip ref={el => stripsRef.current[2] = el}>
                              {projectsRows.tools.map(p => (
                                <ProjectCard key={p.id} onClick={(e) => onProjectCardClick(e, p)}>
                                  <CardInner className={mobileFlippedId === p.id ? 'force-flip' : ''}>
                                    <CardFront>
                                      <DevBadge $status={p.status === 'done' ? 'done' : 'wip'}>{p.status === 'done' ? 'Готово' : 'В разработке'}</DevBadge>
                                      <CardImage style={{ backgroundImage: `url(${p.image})` }} />
                                      <CardOverlay />
                                      <CardText>
                                        <h4>{p.title}</h4>
                                        <p>{p.description}</p>
                                      </CardText>
                                    </CardFront>
                                    <CardBack>
                                      {p.id !== 'raykhan' && p.id !== 'lightlab' && (
                                        <CardGoIcon type="button" aria-label="Открыть проект" onClick={(e)=>{ e.stopPropagation(); handleProjectNavigation(p.href) }}>
                                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <path d="M7 17L17 7" />
                                            <path d="M9 7H17V15" />
                                          </svg>
                                        </CardGoIcon>
                                      )}
                                      <CardBackTitle>{p.title}</CardBackTitle>
                                      <div style={{ fontSize: 13, opacity: 0.9 }}>{p.description}</div>
                                      <TechChips>
                                        {(p.tech || []).map(t => (<span key={t} className="chip" data-tech={t.toLowerCase()}>{t}</span>))}
                                      </TechChips>
                                    </CardBack>
                                  </CardInner>
                                </ProjectCard>
                              ))}
                            </CardsStrip>
                          </RowScroller>
                        </ProjectsRow>
                      </DesktopProjects>
                    </ProjectsModalWrap>
                  )}

                  {openedIndex === index && index === 2 && (
                    <Suspense fallback={
                      <ServicesModalWrap className="services-modal" ref={servicesModalRef} $windowScroll={windowScroll}>
                        <ProjectsTopTitle>Загрузка…</ProjectsTopTitle>
                      </ServicesModalWrap>
                    }>
                      <ServicesContentLazy
                        servicesStep={servicesStep}
                        windowScroll={windowScroll}
                        servicesModalRef={servicesModalRef}
                        servicesCategory={servicesCategory}
                        switchCategory={switchCategory}
                        tabWebRef={tabWebRef}
                        tabBotsRef={tabBotsRef}
                        tabAutoRef={tabAutoRef}
                        indicatorRef={indicatorRef}
                        servicesTier={servicesTier}
                        servicesTierBasicRef={servicesTierBasicRef}
                        servicesTierOptimalRef={servicesTierOptimalRef}
                        servicesTierPremiumRef={servicesTierPremiumRef}
                        servicesGridRef={servicesGridRef}
                        isMobileFlag={isMobileFlag}
                        servicesAutomation={servicesAutomation}
                        servicesWeb={servicesWeb}
                        servicesBots={servicesBots}
                        inlineNextFor={inlineNextFor}
                        setInlineNextFor={setInlineNextFor}
                        setServicesStep={setServicesStep}
                        setServicesTier={setServicesTier}
                        TERM_HINTS={TERM_HINTS}
                        setPrefill={setPrefill}
                        setIsProjectModalOpen={setIsProjectModalOpen}
                        findServiceById={findServiceById}
                        categoryLabelByServiceId={categoryLabelByServiceId}
                        handleServicesNavButtonClick={handleServicesNavButtonClick}
                        handleServicesTierButtonClick={handleServicesTierButtonClick}
                        handleTermToggle={handleTermToggle}
                        navigate={navigate}
                        servicesNavWebRef={servicesNavWebRef}
                        servicesNavBotsRef={servicesNavBotsRef}
                        servicesNavAutoRef={servicesNavAutoRef}
                        /* component references */
                        ServicesModalWrap={ServicesModalWrap}
                        ProjectsTopTitle={ProjectsTopTitle}
                        PricingHeader={PricingHeader}
                        HeadingsRow={HeadingsRow}
                        HeadingTab={HeadingTab}
                        MobileServicesNavigation={MobileServicesNavigation}
                        NavButton={NavButton}
                        ServicesTierNavigation={ServicesTierNavigation}
                        TierNavButton={TierNavButton}
                        PricingGrid={PricingGrid}
                        PricingCard={PricingCard}
                        PricingTop={PricingTop}
                        PricingHead={PricingHead}
                        DesktopOnly={DesktopOnly}
                        HeadingPrice={HeadingPrice}
                        MobileOnly={MobileOnly}
                        MobilePriceUnderTitle={MobilePriceUnderTitle}
                        MobilePriceText={MobilePriceText}
                        MobileConfirmButton={MobileConfirmButton}
                        SelectButton={SelectButton}
                        Muted={Muted}
                        Divider={Divider}
                        CardSectionTitle={CardSectionTitle}
                        SectionBlock={SectionBlock}
                        Bullets={Bullets}
                        RightCol={RightCol}
                        ConfirmSlot={ConfirmSlot}
                        ConfirmButton={ConfirmButton}
                        subscriptionFAQ={subscriptionFAQ}
                      />
                    </Suspense>
                  )}
                  {openedIndex === index && index === 3 && (
                    <ContactsModalWrap className="contacts-modal" ref={contactsModalRef}>
                      <ContactsMainTitle>Контакты</ContactsMainTitle>
                      <ContactsGrid>
                        <ContactPortal 
                          href="https://t.me/loonyboss" 
                          target="_blank" 
                          rel="noopener" 
                          aria-label="Написать в Telegram"
                        >

                          <ContactContent>
                            <ContactIcon>
                              <img src={telegramIcon} alt="Telegram" />
                            </ContactIcon>
                            <ContactTitle>
                              Telegram
                            </ContactTitle>
                            <ContactValue>@loonyboss</ContactValue>
                          </ContactContent>
                        </ContactPortal>
                        
                        <ContactPortal 
                          href="https://wa.me/79131114551" 
                          target="_blank" 
                          rel="noopener" 
                          aria-label="Написать в WhatsApp"
                        >
                          <ContactContent>
                            <ContactIcon>
                              <img src={whatsappIcon} alt="WhatsApp" />
                            </ContactIcon>
                            <ContactTitle>
                              WhatsApp
                            </ContactTitle>
                            <ContactValue>+7 913 111-45-51</ContactValue>
                          </ContactContent>
                        </ContactPortal>
                        
                        <ContactPortal 
                          as="button"
                          onClick={(e) => {
                            e.preventDefault()
                            // Проверяем, является ли устройство мобильным
                            const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                            
                            if (isMobile) {
                              // На мобильных устройствах предлагаем позвонить
                              window.location.href = 'tel:+79131114551'
                            } else {
                              // На десктопе копируем в буфер обмена
                              copyToClipboard('+79131114551', 'Номер телефона')
                            }
                          }}
                          aria-label="Позвонить или скопировать номер телефона"
                        >
                          <ContactContent>
                            <ContactIcon>
                              <img src={phoneIcon} alt="Phone" />
                            </ContactIcon>
                            <ContactTitle>
                              Телефон
                            </ContactTitle>
                            <ContactValue>+7 913 111-45-51</ContactValue>
                          </ContactContent>
                        </ContactPortal>
                        
                        <ContactPortal 
                          as="button"
                          onClick={(e) => {
                            e.preventDefault()
                            copyToClipboard('mikhail@loonyboss.com', 'Email')
                          }}
                          aria-label="Скопировать email"
                        >
                          <ContactContent>
                            <ContactIcon>
                              <img src={emailIcon} alt="Email" />
                            </ContactIcon>
                            <ContactTitle>
                              Email
                            </ContactTitle>
                            <ContactValue>mikhail@loonyboss.com</ContactValue>
                          </ContactContent>
                        </ContactPortal>
                      </ContactsGrid>
                    </ContactsModalWrap>
                  )}
                </CardContent>
                {openedIndex === index && (
                  <CloseButton
                    type="button"
                    className="close-btn"
                    onClick={(e) => { e.stopPropagation(); closeCardFullscreen(index) }}
                    aria-label="Закрыть"
                  >
                    ✕
                  </CloseButton>
                )}
                {/* Убрано изображение в хавере "О себе" */}
              </Card>
              {/* Подставка для предотвращения смещения сетки при фиксировании .is-open */}
              {openedIndex === index && <CardPlaceholder aria-hidden="true" />}
            </React.Fragment>
          ))}
        </CardRow>
      </Section>

      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <ProjectModal
            isOpen={isProjectModalOpen}
            prefill={prefill}
            startAnimation={isProjectModalAnimationReady}
            onClose={() => {
              setIsProjectModalAnimationReady(false)
              setIsProjectModalOpen(false)
              setPrefill(null)
            }}
          />
        </Suspense>
      </ErrorBoundary>

      <MobileNavigation />
      
      {/* Уведомление о копировании */}
      <CopyNotification className={copyNotification.show ? 'show' : ''}>
        {copyNotification.text}
      </CopyNotification>
    </MenuContainer>
  )
}

export default MenuPage
export { subscriptionFAQ }

// Preload dither effects
const preloadImage = new Image();
preloadImage.src = '/images/rudakovrz7.png?v=1';

// Обработка наведения на левый край