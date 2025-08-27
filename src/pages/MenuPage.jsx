import React, { useEffect, useRef, useState, useMemo } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import styled from 'styled-components'
import { gsap } from 'gsap'
gsap.registerPlugin(ScrollTrigger, Flip)
import { useNavigate } from 'react-router-dom'
import { useParticles } from '../components/GlobalParticleManager'
import CustomCursor from '../components/CustomCursor'
import MobileNavigation from '../components/MobileNavigation'
import ProjectModal from '../components/ProjectModal'
import useParticleControl from '../hooks/useParticleControl'
import Dither from '../../dither.jsx'; // Adjusted to new file extension
import DesktopModalAnimations from '../utils/DesktopModalAnimations'
// Иконки каналов связи (используются в hover-оверлее «Контакты»)
import telegramIcon from '../images/telegram.svg'
import whatsappIcon from '../images/whatsapp.svg'
import emailIcon from '../images/email.svg'

import { useDeviceDetection } from '../hooks/useDeviceDetection'
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
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: var(--primary-red);
  background: transparent;
  border: 2px solid var(--primary-red);
  border-radius: 0; /* прямые углы */
  padding: 0;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.12s ease, box-shadow 0.2s ease;

  &:hover {
    background: var(--primary-red);
    color: var(--black);
    box-shadow: 0 8px 20px rgba(0,0,0,0.35);
    transform: translateY(-2px);
  }

  &:active { transform: translateY(0) scale(0.985); }

  /* make icon visually similar to nav buttons */
  &::after { content: ''; position: absolute; inset: 0; pointer-events: none; }
`

const BackTopButton = styled(CloseButton)`
  right: calc(24px + var(--close-right-offset, 0px) + 44px + 8px);
  width: 44px;
  height: 44px;
  padding: 0;
  color: var(--primary-red);
  border-color: var(--primary-red);
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
    align-items: flex-start;
    justify-content: flex-start;
  }

  @media (max-width: 768px) {
    gap: 8px;
    padding: 0 8px;
    ${Card}.is-open & {
      padding: 24px 12px;
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
    height: auto;
    padding: 16px 12px calc(16px + env(safe-area-inset-bottom, 0px));
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

const ContactLink = styled.a`
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
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(136, 78, 255, 0.25);
    border-radius: 6px;
    margin: 8px 0;
    transition: border-color 160ms ease, background-color 160ms ease;
    overflow: hidden;
  }

  details[open] {
    background: rgba(136, 78, 255, 0.06);
    border-color: rgba(136, 78, 255, 0.5);
  }

  summary {
    list-style: none;
    cursor: pointer;
    padding: 12px 14px 12px 40px;
    position: relative;
    font-weight: 500;
    color: #fff;
    outline: none;
    user-select: none;
  }

  summary::-webkit-details-marker { display: none; }
  summary::marker { content: ''; }

  /* Иконка + / − */
  summary::before {
    content: '+';
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    font-weight: 600;
    color: rgba(255,255,255,0.95);
    background: linear-gradient(180deg, rgba(136,78,255,0.35), rgba(136,78,255,0.15));
    box-shadow: inset 0 0 0 1px rgba(136,78,255,0.5);
  }

  details[open] summary::before { content: '−'; }

  /* Плавное раскрытие: grid rows trick */
  .faq-content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 220ms ease;
  }
  details[open] .faq-content { grid-template-rows: 1fr; }
  .faq-content-inner { overflow: hidden; }

  .faq-answer {
    padding: 0 14px 12px 40px;
    color: rgba(255,255,255,0.9);
  }
  .faq-answer p { margin: 0 0 10px 0; }
  .faq-answer ul { margin: 8px 0 2px 18px; }
  .faq-answer li { margin: 4px 0; }
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
`

const AboutPhotoWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  will-change: transform; /* parallax */
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
  /* Desktop: occupy full viewport and avoid internal scrollbars */
  height: ${p => p.$windowScroll ? 'auto' : '100vh'};
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 16px 16px;
  /* Allow vertical scroll on desktop for tall content (subscription step) */
  overflow-y: ${p => p.$windowScroll ? 'visible' : 'auto'};
  overscroll-behavior: contain;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;

  /* Desktop scrollbar styling for visibility */
  @media (min-width: 769px) {
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

  @media (max-width: 768px) {
    /* Mobile: allow content to scroll inside modal */
    height: auto;
    min-height: 100dvh;
    padding: 12px 12px calc(16px + env(safe-area-inset-bottom, 0px));
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
    background: linear-gradient(180deg, rgba(136,78,255,0.0), rgba(136,78,255,0.9), rgba(136,78,255,0.0));
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
    display: block;
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
  margin: 0; font-size: 13px; opacity: 0.8; text-align: center; color: #fff;
`

const PricingGrid = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 0; width: 100%;
  max-width: ${props => props.$narrow ? '1060px' : '100%'};
  margin: 0 auto;
  justify-items: ${props => props.$center ? 'center' : 'stretch'};
  justify-content: center;
  
  @media (min-width: 1024px) { 
    grid-template-columns: ${props => {
      if (props.$center) return '1fr'
      if (props.$cols === 2) return 'repeat(2, 1fr)'
      if (props.$cols === 4) return 'repeat(4, 1fr)'
      return 'repeat(3, 1fr)'
    }}; 
  }
  
  @media (max-width: 768px) {
    gap: 8px;
    padding: 0 8px;
  }
  
  /* убрать сплошную верхнюю линию из границ карточек */
  & > div:first-child { border-top: none; }
  @media (min-width: 1024px) { & > div:nth-child(-n+3) { border-top: none; } }
`

const PricingCard = styled.div`
  text-align: left; border-radius: 0; padding: 14px; cursor: pointer; color: #fff;
  background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(2px);
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  display: flex; flex-direction: column; gap: 8px; height: 100%;

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
    border-radius: 12px;
    margin-bottom: 0;
    border: 1px solid rgba(255,255,255,0.15);
    
    /* Restore individual borders on mobile */
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
  
  &.featured { 
  background: linear-gradient(180deg, rgba(136,78,255,0.12), rgba(0,0,0,0.28));
  border-color: rgba(136,78,255,0.45);
  box-shadow: 0 12px 30px rgba(136,78,255,0.18), 0 8px 24px rgba(0,0,0,0.28);
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
  margin-top: 10px; font-size: 13px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.9);
  
  @media (max-width: 768px) {
    margin-top: 10px;
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
  
  ${props => props.$variant === 'outline' && `
    background: transparent; color: #fff; border-color: rgba(255,255,255,0.7);
    &:hover { background: rgba(255,255,255,0.12); }
  `}
  ${props => props.$variant === 'contrast' && `
    background: #FFD400; color: #111; border-color: #FFD400;
    &:hover { background: #ffde33; }
  `}
`
const RightCol = styled.div`
  display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
  @media (max-width: 768px) {
    align-items: center;
    width: 100%;
  }
`
const PricingHead = styled.div`
  display: flex; flex-direction: column; gap: 8px;
  h4 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
  p { margin: 0; font-size: 13px; opacity: 0.85; }

  @media (max-width: 768px) {
    gap: 6px;
    h4 { font-size: 17px; }
    p { font-size: 13px; line-height: 1.4; }
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

const PriceRow = styled.div`
  display: flex; align-items: baseline; gap: 6px;
  .amount { font-size: 24px; font-weight: 500; }
  .period { font-size: 12px; opacity: 0.8; }
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
  border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 10px 0;
`

// Comparison table for subscription plans
const ComparisonTable = styled.div`
  width: 100%;
  max-width: 1060px; /* narrow and centered */
  margin: 8px auto 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  .comp-table { 
    width: 100%; 
    min-width: 760px; 
    border-collapse: separate; 
    border-spacing: 0; 
    background: rgba(0,0,0,0.18);
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 1;
    background: rgba(255,255,255,0.06);
    color: #fff;
    text-align: center;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.02em;
    padding: 12px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.14);
  }
  thead th.feat { text-align: left; }

  tbody tr:nth-child(odd) { background: rgba(255,255,255,0.02); }
  tbody tr:nth-child(even) { background: rgba(255,255,255,0.04); }

  td { 
    padding: 12px; 
    border-bottom: 1px solid rgba(255,255,255,0.06);
    border-right: 1px solid rgba(255,255,255,0.06);
    vertical-align: middle;
  }
  td:last-child { border-right: none; }
  td.feat { 
    color: rgba(255,255,255,0.95);
    font-size: 14px; 
    text-align: left; 
    min-width: 260px;
  }
  td.val { text-align: center; white-space: nowrap; }
  .check { color: #fff; font-weight: 700; font-size: 16px; display: inline-block; margin-right: 6px; }
  .dash { color: rgba(255,255,255,0.35); display: inline-block; margin-right: 6px; }
  small { color: rgba(255,255,255,0.85); font-size: 12px; }
`

const ComparisonCTARow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
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
  gap: 18px;
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
  height: 200px;
  width: 320px;
  max-width: 340px;
  min-width: 280px;
  @media (min-width: 1280px) { height: 220px; }
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
`

const CardBack = styled(CardFace)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 14px;
  gap: 8px;
  background: linear-gradient(180deg, rgba(16,16,20,0.6), rgba(8,8,12,0.9));
  transform: rotateY(-180deg) rotateX(0deg) translateZ(1px);
  transform-origin: 50% 50%;
  transition: transform 0.6s ease, box-shadow 0.3s ease;
  ${ProjectCard}:hover & { transform: rotateY(0deg) rotateX(1deg) translateZ(1px); box-shadow: 0 12px 36px rgba(0,0,0,0.35); }
  color: #fff;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  text-align: left;
  @media (max-width: 768px) {
    padding: 12px;
    justify-content: center;
  }
`

const TechChips = styled.div`
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;
  .chip {
    font-size: 12px; padding: 4px 8px; border-radius: 999px;
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  }
  .chip.more { font-size: 11px; opacity: 0.8; }
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
  top: 24px; /* заголовок тоже чуть ниже */
  left: 16px;
  margin: 0;
  font-size: clamp(24px, 5vw, 36px);
  font-weight: 500;
  color: #fff;

  @media (max-width: 768px) {
    top: 16px;
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
  const { camera, setParticleProps, setHoveredRect, setParticleSpeed, particlesVisible } = useParticles()
  const isTransitioningRef = useRef(false)
  
  // Логируем состояние частиц
  useEffect(() => {
    console.log('MenuPage: Particles state', { camera: !!camera, particlesVisible })
  }, [camera, particlesVisible])
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [globalDitherColorIndex, setGlobalDitherColorIndex] = useState(0)
  const globalDitherRef = useRef(null)
  const hoverTimelinesRef = useRef([])
  // убрали таймеры дебаунса — из‑за них терялись hover‑события
  const [openedIndex, setOpenedIndex] = useState(null)
  const desktopAnimatorRef = useRef(null)
  const cardRefs = useRef([])
  const mousePosRef = useRef({ x: 0, y: 0 })
  const hoverLockRef = useRef({}) // индекс → timestamp до которого игнорируем mouseleave
  const lastHoveredBeforeOpenRef = useRef(null)
  const isModalOpenRef = useRef(false)
  const lastOpenModalIndexRef = useRef(null)
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
  const [servicesStep, setServicesStep] = useState('pick') // 'pick' | 'subscription'

  // Project creation modal (same behavior as on HomePage)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [prefill, setPrefill] = useState(null)
  const [showSubscriptionInfo, setShowSubscriptionInfo] = useState(false)
  const [isProjectModalAnimationReady, setIsProjectModalAnimationReady] = useState(false)
  const bodyLockRef = useRef({ scrollY: 0, prevStyles: {} })

  // Lock body scroll while ProjectModal is open (copied from HomePage)
  useEffect(() => {
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
      // only reset modal flag if no card modal is active
      if (openedIndex == null) isModalOpenRef.current = false
    }

    return () => {
      if (isProjectModalOpen) {
        unlockBody()
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
  const getNextCategory = (dir) => {
    const idx = serviceCategories.indexOf(servicesCategory)
    const nextIdx = (idx + (dir === 'next' ? 1 : -1) + serviceCategories.length) % serviceCategories.length
    return serviceCategories[nextIdx]
  }
  const servicesGridRef = useRef(null)
  const servicesModalRef = useRef(null)
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
    const x = (e.touches && e.touches[0] && e.touches[0].clientX) || 0
    const dx = x - (projectsTouchStartXRef.current || 0)
    // follow finger: move whole pane (tabs + list)
    try {
      const pane = mobilePaneRef.current
      if (pane) {
        // throttle visual updates via requestAnimationFrame to avoid calling GSAP on every event
        if (projectsTouchRAFRef.current) cancelAnimationFrame(projectsTouchRAFRef.current)
        projectsTouchRAFRef.current = requestAnimationFrame(() => {
          try {
            // apply a small resistance when dragging past half the screen
            const w = window.innerWidth || document.documentElement.clientWidth
            const max = w * 0.5
            let applied = dx
            if (Math.abs(dx) > max) {
              applied = dx > 0 ? max + (dx - max) * 0.2 : -max + (dx + max) * 0.2
            }
            pane.style.transform = `translate3d(${applied}px,0,0)`
          } catch (err) { }
        })
      }
    } catch { }
    // store for velocity
    projectsTouchLastTimeRef.current = performance.now()
    projectsTouchLastXRef.current = x
  }

  const onProjectsTouchEnd = (e) => {
    if (!projectsTouchingRef.current) return
    projectsTouchingRef.current = false
    if (projectsTouchRAFRef.current) { cancelAnimationFrame(projectsTouchRAFRef.current); projectsTouchRAFRef.current = null }
    const startX = projectsTouchStartXRef.current
    const endX = (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientX) || null
    if (startX == null || endX == null) return
    const dx = endX - startX
    const dt = Math.max(1, performance.now() - projectsTouchLastTimeRef.current)
    const vx = (endX - projectsTouchLastXRef.current) / dt
    const threshold = 60 // px
    const velocityThreshold = 0.3
    const idx = projectsCategories.indexOf(projectsCategory)
    let targetIdx = idx
    let dir = 0
    if (dx < -threshold || vx < -velocityThreshold) {
      targetIdx = Math.min(projectsCategories.length - 1, idx + 1)
      dir = -1
    } else if (dx > threshold || vx > velocityThreshold) {
      targetIdx = Math.max(0, idx - 1)
      dir = 1
    }
    if (targetIdx === idx) {
      // animate back to center of pane — use GSAP for smooth animation from current transform
      try {
        const p = mobilePaneRef.current
        if (p) {
          gsap.to(p, { x: 0, duration: 0.28, ease: 'power2.out', clearProps: 'willChange', onStart: () => { p.style.transition = '' } })
        }
      } catch { }
      return
    }
    if (targetIdx === idx) {
      try { const el = mobileListRef.current; if (el) gsap.to(el, { x: 0, duration: 0.28, ease: 'power2.out' }) } catch { }
      return
    }
    const newCat = projectsCategories[targetIdx]
    // animate change
    changeProjectsCategory(newCat, dir)
  }

  // Ripple effect for navigation buttons
  const createRipple = (event, button) => {
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = x + 'px'
    ripple.style.top = y + 'px'

    button.appendChild(ripple)

    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple)
      }
    }, 600)
  }

  // Handle navigation button click with animation
  const handleNavButtonClick = (category, event) => {
    if (projectsCategory === category) return

    // Create ripple effect
    createRipple(event, event.currentTarget)

    // Add fade animation for nav buttons during transition
    const navButtons = event.currentTarget.parentElement.querySelectorAll('button')
    
    // Fade out all buttons briefly
    gsap.to(navButtons, {
      opacity: 0.3,
      duration: 0.15,
      ease: 'power2.out',
      onComplete: () => {
        // Change category
        changeProjectsCategory(category, 0, true)
        
        // Fade buttons back in
        gsap.to(navButtons, {
          opacity: 1,
          duration: 0.25,
          ease: 'power2.out'
        })
      }
    })
  }

  // Projects navigation button click with services-like animations
  const handleProjectsNavButtonClick = (category, event) => {
    if (projectsCategory === category) return

    // Immediately update UI state for instant visual feedback
    setProjectsCategory(category)
    pendingProjectsCategoryRef.current = category

    // Clear any existing debounce
    if (projectsNavDebounceRef.current) {
      clearTimeout(projectsNavDebounceRef.current)
    }

    // Prevent UI animation conflicts
    if (isProjectsUIUpdatingRef.current) return

    // Create ripple effect
    createRipple(event, event.currentTarget)

    // Set UI updating flag
    isProjectsUIUpdatingRef.current = true

    // Add minimal fade animation for nav buttons
    const navButtons = event.currentTarget.parentElement.querySelectorAll('button')
    
    // Quick fade for immediate feedback
    gsap.to(navButtons, {
      opacity: 0.7,
      duration: 0.08,
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(navButtons, {
          opacity: 1,
          duration: 0.12,
          ease: 'power2.out',
          onComplete: () => {
            isProjectsUIUpdatingRef.current = false
          }
        })
      }
    })

    // Debounced processing (if any heavy work needed)
    projectsNavDebounceRef.current = setTimeout(() => {
      if (pendingProjectsCategoryRef.current === category) {
        // placeholder for any async/backend work
        pendingProjectsCategoryRef.current = null
      }
    }, 150)
  }

  // Handle services navigation button click with animation
  const handleServicesNavButtonClick = (category, event) => {
    if (servicesCategory === category) return
    
    // Immediately update UI state for instant visual feedback
    setServicesCategory(category)
    pendingServicesCategoryRef.current = category
    
    // Clear any existing debounce
    if (servicesNavDebounceRef.current) {
      clearTimeout(servicesNavDebounceRef.current)
    }
    
    // Prevent UI animation conflicts
    if (isServicesUIUpdatingRef.current) return

    // Create ripple effect
    createRipple(event, event.currentTarget)

    // Set UI updating flag
    isServicesUIUpdatingRef.current = true

    // Add minimal fade animation for nav buttons
    const navButtons = event.currentTarget.parentElement.querySelectorAll('button')
    
    // Quick fade for immediate feedback
    gsap.to(navButtons, {
      opacity: 0.7,
      duration: 0.08,
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(navButtons, {
          opacity: 1,
          duration: 0.12,
          ease: 'power2.out',
          onComplete: () => {
            isServicesUIUpdatingRef.current = false
          }
        })
      }
    })

    // Debounced backend processing (heavy operations)
    servicesNavDebounceRef.current = setTimeout(() => {
      // Only process if this is still the pending category
      if (pendingServicesCategoryRef.current === category) {
        // Force any backend processing here if needed
        // Switch category is already called above for immediate UI
        
        // Reset switching flag with extra delay to prevent conflicts
        setTimeout(() => {
          isServicesSwitchingRef.current = false
        }, 200)
        
        pendingServicesCategoryRef.current = null
      }
    }, 150) // Longer delay for backend processing
  }

  // Handle services tier navigation button click with animation  
  const handleServicesTierButtonClick = (tier, event) => {
    if (servicesTier === tier) return
    
    // Immediately update tier for instant visual feedback
    setServicesTier(tier)
    
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

  // Desktop-only: ensure scroll behavior depending on mode
  useEffect(() => {
    if (openedIndex !== 2) return
    if (isTouchRef.current) return
    const container = servicesModalRef.current
    if (!container) return

    const windowScrollMode = servicesStep === 'subscription' // enable full page scroll for subscription step
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

  // Прайс‑планы для модалки "Услуги" — веб/приложения
  const servicesWeb = [
    {
      id: 'basic', title: 'Базовый',
      desc: 'Лендинг/одностраничник для презентации услуг/продуктов',
      price: 'от 70 000 ₽',
      features: [
        'Дизайн по готовому шаблону',
        'До 5 блоков/секций',
        'Адаптивная верстка',
        'Базовое SEO (мета‑теги, скорость)',
        'Форма обратной связи',
        'Кросс‑браузерное тестирование',
        'Безопасность: SSL, GDPR/ФЗ‑152',
        'Развертывание на сервере',
        '1 месяц техподдержки',
      ],
      extras: [
        'Кастомный дизайн: +15 000 ₽',
        'Свыше 5 блоков: +5 000 ₽ за блок',
        'Хостинг/домен: +10 000 ₽ за год',
      ],
      notes: [

      ],
      timeline: 'Сроки: 1–2 недели',
      tech: 'Технологии: HTML, CSS, JavaScript, React'
    },
    {
      id: 'optimal', title: 'Стандарт',
      desc: 'Многостраничный сайт с интеграциями и анимациями',
      price: 'от 130 000 ₽',
      features: [
        'Всё из "Базовый"',
        'Кастомный дизайн',
        'До 10 страниц',
        'Анимации и интерактив',
        'База данных/CRM, админ‑панель',
        'Калькуляторы и формы',
        'Платежная система',
        'Личный кабинет клиента/администратора',
        'Email/мессенджер-уведомления',
        '2 месяца техподдержки',
      ],
      extras: [
        'Доп. страница: 10 000 ₽ за страницу',
        'Расширенная аналитика: +10 000 ₽',
        'Мультиязычность: +15 000 ₽ за язык',
      ],
      notes: [
        'Хостинг на 3 месяца включён',
      ],
      timeline: 'Сроки: 3–6 недель',
      tech: 'Технологии: HTML, Tailwind CSS, JavaScript, React, Framer Motion / GSAP, MySQL/PostgreSQL'
    },
    {
      id: 'premium', title: 'Премиум',
      desc: 'Сложное веб‑приложение с продвинутой логикой',
      price: 'от 250 000 ₽',
      features: [
        'Всё из «Стандарт»',
        'Сложная логика: WebSockets/AI',
        'Полная SEO‑оптимизация',
        'Мультиязычность (2+ языка)',
        'Сложные интеграции: CRM/ERP/облако',
        'Авто‑тесты (unit/нагрузочные)',
        '6 месяцев техподдержки',
        'Документация и инструкции',
      ],
      extras: [
        'Миграции/перенос: от 20 000 ₽',
        'Обучение персонала: от 15 000 ₽',
      ],
      notes: [
        'Хостинг/домен по договоренности',
      ],
      timeline: 'Сроки: 5–12 недель',
      tech: 'Технологии: Next.js, TypeScript, Nest.js, MongoDB, Docker, WebSockets'
    },
  ]

  // Прайс‑планы для модалки "Услуги" — боты/автоматизации
  const servicesBots = [
    {
      id: 'bot-basic', title: 'Базовый',
      desc: 'FAQ/поддержка, сбор заявок, простые сценарии',
      price: 'от 40 000 ₽',
      features: [
        'Telegram/WhatsApp бот',
        'Сценарии вопросов‑ответов',
        'Формы заявок с уведомлениями',
        'Интеграция с Google Sheets/CRM',
        'Базовая аналитика',
        'Развертывание и настройка',
        '1 месяц техподдержки',
      ],
      extras: [
        'Подключение оплат: от 10 000 ₽',
        'Импорт/экспорт базы: от 5 000 ₽',
      ],
      notes: [],
      timeline: 'Сроки: 1–2 недели',
      tech: 'Технологии: Python/Node.js, aiogram/grammY, Google Sheets/CRM'
    },
    {
      id: 'bot-optimal', title: 'Стандарт',
      desc: 'Продажи/записи, оплаты, админ‑панель',
      price: 'от 90 000 ₽',
      features: [
        'Всё из "Базовый"',
        'Оплаты (СБП/карты)',
        'Админ‑панель для контента',
        'Личный кабинет клиента',
        'Интеграции с CRM/БД',
        'Уведомления и рассылки',
        '2 месяца техподдержки',
      ],
      extras: [
        'Сегментация рассылок: +10 000 ₽',
        'А/Б‑тесты сценариев: +10 000 ₽',
      ],
      notes: ['Хостинг на 3 месяца включён'],
      timeline: 'Сроки: 3–5 недель',
      tech: 'Технологии: Node.js/Python, PostgreSQL, CloudPayments/ЮKassa'
    },
    {
      id: 'bot-premium', title: 'Премиум',
      desc: 'Сложная логика, интеграции и realtime',
      price: 'от 180 000 ₽',
      features: [
        'Сложные сценарии и роли',
        'WebSockets для live‑обновлений',
        'Полная аналитика и сегментация',
        'Интеграции: CRM/ERP/облако',
        'Авто‑тесты и мониторинг',
        '6 месяцев техподдержки',
        'Документация и инструкции',
      ],
      extras: [
        'Нейро‑модули (NLP): от 30 000 ₽',
        'Миграции/перенос: от 20 000 ₽',
      ],
      notes: ['Хостинг/домен по договоренности'],
      timeline: 'Сроки: 4–8 недель',
      tech: 'Технологии: Node.js/Python, PostgreSQL, WebSockets'
    },
  ]

  // Прайс‑планы: программы / автоматизация (одна карточка, по договоренности)
  const servicesAutomation = [
    {
      id: 'auto-custom',
      title: 'По договоренности',
      desc: 'Программы, интеграции, автоматизация процессов под задачу',
      price: 'Custom',
      features: [
        'Анализ задачи и проектирование',
        'Интеграции с CRM/ERP/Sheets/API',
        'Скрипты, ETL, отчёты и уведомления',
        'Реал‑тайм при необходимости',
        'Документация и обучение',
      ],
      extras: [],
      notes: ['Стоимость обсуждается после брифинга'],
      timeline: 'Сроки: зависят от объёма',
      tech: 'Технологии: Python/Node.js, Google API, PostgreSQL',
    }
  ]

  const projectsRows = {
    web: [
      { id: 'lightlab', title: 'Light Lab', description: 'Онлайн‑бронирование слотов в фотостудии (витрина залов, корзина, ЛК, админка)', href: '/project/lightlab', image: '/images/lightlab.png', tech: ['React 19', 'Router 7', 'MUI', 'Framer Motion', 'Node/Express', 'Socket.IO', 'MySQL'], year: '2025', role: 'Full‑stack', features: ['Часы‑слоты с проверкой конфликтов', 'Динамическое ценообразование и промокоды', 'Live‑обновления через Socket.IO', 'Админ‑панель: клиенты/цены/услуги/брони', 'Загрузка и оптимизация фото (sharp/multer)', 'REST API + события bookingChange'] },
      { id: 'raykhan', title: 'Raykhan', description: 'SPA интернет‑магазин премиальных духов с 3D‑фоном и анимациями', href: '#', image: '/images/raykhan.png', tech: ['React 18', 'Framer Motion', 'GSAP', 'Three.js'], year: '2025', role: 'Front‑end', features: ['WebGL Silk‑фон', 'Каталог/карточки товаров'] },
    ],
    bots: [
  { id: 'tg-shop', status: 'done', title: 'Бот "Худеем с Войтенко!"', description: 'Продажа подписок и консультаций с автопродлением (CloudPayments)', href: '/project/voytenko', image: '/images/botdieta.png', tech: ['Python', 'aiogram 3', 'MySQL', 'CloudPayments'], year: '2025', role: 'Back‑end', features: ['Подписки и автопродление', 'Webhooks CloudPayments'] },
  { id: 'wa-support', status: 'done', title: 'KLAMbot', description: 'Документооборот и статусы по объектам/альбомам. Google Sheets + уведомления.', href: '#', image: '/images/klambot.png', tech: ['Python', 'PTB v20+', 'Google Sheets API', 'aiosmtplib'], year: '2025', role: 'Automation', features: ['Интеграция с Google Sheets', 'Раскраска статусов и уведомления'] },
    ],
    tools: [
  { id: 'wb-integrator', status: 'done', title: 'WB Авто-акции', description: 'Интеграция с Wildberries + Google Sheets: акции, маржа, выгрузки', href: '#', image: '/images/WB.png', tech: ['Python', 'Requests', 'Pandas', 'Google Sheets API'], year: '2025', role: 'Automation', features: ['Расчёт маржи и отбор в акции', 'Выгрузки в Google Sheets'] },
    ],
  }

  // Утилита: мгновенно останавливает анимации dither и возвращает слой к базовому состоянию
  const resetGlobalDither = (props = null) => {
    const gd = globalDitherRef.current
    if (!gd) return
    gsap.killTweensOf(gd)
    gd.classList.remove('front')
    if (props) gsap.set(gd, props)
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
          if (document.fonts && typeof document.fonts.ready?.then === 'function') {
            document.fonts.ready.then(() => { t = setTimeout(settle, 20) })
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

  // Init desktop animations helper (no-op on mobile/reduced motion)
  useEffect(() => {
    try {
      desktopAnimatorRef.current = new DesktopModalAnimations()
    } catch {}
    return () => { desktopAnimatorRef.current = null }
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
    // If page just mounted and layout isn't settled yet, queue the intent
    if (!menuReadyRef.current) {
      pendingOpenRef.current = index
      return
    }
    // If click event provided, confirm the pointer is actually within the intended card
    if (event) {
      let x = undefined, y = undefined
      if (event.touches && event.touches.length) {
        x = event.touches[0].clientX
        y = event.touches[0].clientY
      } else if (event.changedTouches && event.changedTouches.length) {
        x = event.changedTouches[0].clientX
        y = event.changedTouches[0].clientY
      } else if (event.clientX !== undefined && event.clientY !== undefined) {
        x = event.clientX
        y = event.clientY
      }
      if (x !== undefined && y !== undefined) {
        let realIndex = -1
        for (let i = 0; i < cardRefs.current.length; i++) {
          const c = cardRefs.current[i]
          if (!c) continue
          const r = c.getBoundingClientRect()
          if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
            realIndex = i
            break
          }
        }
        if (realIndex !== -1 && realIndex !== index) {
          index = realIndex
        }
      }
    }

    if (openedIndex !== null) return
    const el = cardRefs.current[index]
    if (!el) return
    lastHoveredBeforeOpenRef.current = index
    lastOpenModalIndexRef.current = index
    isModalOpenRef.current = true
    // when opening Projects modal (index 1), default to web category
    if (index === 1) {
      setProjectsCategory('web')
    }
    // Сбрасываем возможные transform/opacity/filter у контейнера section, чтобы fixed располагался от окна
    try {
      const sectionEl = document.querySelector('section')
      if (sectionEl) {
        sectionEl.style.transform = 'none'
        sectionEl.style.opacity = ''
        sectionEl.style.filter = ''
        sectionEl.style.transition = ''
      }
    } catch { }
    // Отключаем hover-анимации только на других карточках, текущую оставляем как есть
    try {
      hoverTimelinesRef.current.forEach((tl, i) => {
        if (i !== index && tl) tl.kill()
      })
    } catch { }
    // Снижаем активность частиц в фоне под модалкой для чистоты текста
    try { setParticleSpeed?.(0.4) } catch { }
  // Глобальный dither: раскрываем до фуллскриновкого состояния
    const gd = globalDitherRef.current
  let ditherDuration = isTouchRef.current ? 0.28 : 0.7
  if (gd) {
      // Сбрасываем любые зависшие анимации dither, чтобы старт был чистым
      resetGlobalDither()
  if (isTouchRef.current) {
  // Мобильный UX: простое затемнение фона, без FLIP и дыхания
  // Обновляем индекс цвета глобального dither (фиолет/зелёный/красный)
  try { setGlobalDitherColorIndex(index) } catch {}
  // делаем фон плотным цветным в зависимости от открытой карточки
  let bg = 'rgba(6,6,12,0.98)'
  if (index === 1) bg = 'rgba(139,92,246,0.94)' // фиолетовый для Проектов
  else if (index === 2) bg = 'rgba(34,197,94,0.92)' // зелёный для Услуг
  else if (index === 3) bg = 'rgba(186,26,26,0.92)' // красный для Контактов
  gsap.set(gd, { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100dvh', borderRadius: 0, opacity: 0, clipPath: 'none', backgroundColor: bg })
  gsap.to(gd, { opacity: 1, duration: ditherDuration, ease: 'power2.out' })
      } else {
        // Desktop: FLIP dither до fullscreen
        gd.classList.add('front')
        const rect = el.getBoundingClientRect()
        gsap.set(gd, { opacity: 1, clipPath: 'none', position: 'fixed' })
        gsap.set(gd, { top: rect.top, left: rect.left, right: 'auto', bottom: 'auto', width: rect.width, height: rect.height, borderRadius: 16 })
        const ditherState = Flip.getState(gd)
  gsap.set(gd, { top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100dvh', borderRadius: 0 })
        Flip.from(ditherState, {
          duration: ditherDuration, ease: 'power3.inOut', absolute: true, onComplete: () => {
            gd.classList.remove('front')
            // Дышащая анимация dither в модалке — только desktop
            ditherBreatheTlRef.current?.kill()
            if (!isTouchRef.current) {
              ditherBreatheTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
                .to(gd, { opacity: 0.32, duration: 3.2, ease: 'sine.inOut' })
                .to(gd, { opacity: 0.25, duration: 3.2, ease: 'sine.inOut' })
            }
          }
        })
      }
    }

    // Сразу скрываем и отключаем интерактив у соседних карточек (без задержек)
  cardRefs.current.forEach((card, i) => {
      if (!card) return
      if (i !== index) {
        try { card.style.pointerEvents = 'none' } catch {}
        gsap.killTweensOf(card)
        gsap.set(card, { autoAlpha: 0 })
      }
    })
  const state = Flip.getState(el)
    el.classList.add('is-open')
    setOpenedIndex(index)
    // Desktop: after content mounts, pre-hide sections to avoid flash (CSS also covers initial state)
    if (!isTouchRef.current) {
      requestAnimationFrame(() => {
        try {
          const content = el.querySelector('.about-modal, [data-testid="projects-modal"], .services-modal, .projects-modal, .modal-content')
          desktopAnimatorRef.current?.prepareModalOpen(el, content)
        } catch {}
      })
    }
    // Никакого текста не осталось, поэтому Flip только для карточки
  Flip.from(state, {
      duration: isTouchRef.current ? 0.36 : 0.6,
      ease: isTouchRef.current ? 'power2.out' : 'power3.inOut',
      absolute: true,
      scale: false,
      nested: true,
      delay: isTouchRef.current ? 0 : 0.16,
      onComplete: () => {
        // Desktop: progressive section reveal inside modal content
        if (!isTouchRef.current) {
          try {
            const content = el.querySelector('.about-modal, [data-testid="projects-modal"], .services-modal, .projects-modal, .modal-content')
            desktopAnimatorRef.current?.animateModalOpen(el, content)
          } catch {}
        }
      }
    })

  // Defensive removal attempts right after modal is opened (no longer needed since we don't create red bars)
  // try { forceRemoveTransientRedBars() } catch (e) { }
  // try { setTimeout(() => { try { forceRemoveTransientRedBars() } catch (e) {} }, 200) } catch (e) {}
  // try { setTimeout(() => { try { forceRemoveTransientRedBars() } catch (e) {} }, 800) } catch (e) {}

    // Появление контента модалки на мобильных: лёгкий fade/slide
    if (isTouchRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            const content = el.querySelector('.about-modal, .projects-modal, .services-modal')
            if (content) {
              gsap.fromTo(content, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: 'power2.out' })
            }
          } catch { }
        })
      })
    }
    }

    // Mobile: cloned-card expansion animation (stretch top to top, bottom to bottom)
    if (isTouchRef.current) {
      try {
        const rect = el.getBoundingClientRect()
        const clone = el.cloneNode(true)
        clone.style.position = 'fixed'
        clone.style.top = rect.top + 'px'
        clone.style.left = rect.left + 'px'
        clone.style.width = rect.width + 'px'
        clone.style.height = rect.height + 'px'
        clone.style.margin = '0'
        clone.style.zIndex = 99999
        clone.style.transform = 'none'
        clone.style.transition = 'none'
        clone.setAttribute('aria-hidden', 'true')
        // prevent pointer events on clone during animation
        clone.style.pointerEvents = 'none'

        document.body.appendChild(clone)

        // animate dither/overlay and clone together for a smoother expansion
        try {
          const startClip = computeClipFromElement(el) // inset(top right bottom left round 16px)
          const fullClip = 'inset(0px 0px 0px 0px)'
          gsap.set(gd, { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100dvh', borderRadius: 0, clipPath: startClip, opacity: 0, backgroundColor: gd.style.backgroundColor || '' })

          // Remove any existing edge bars completely - no longer creating new ones
          const existingTop = document.querySelector('.__dither-edge-top')
          const existingBottom = document.querySelector('.__dither-edge-bottom')
          if (existingTop) existingTop.remove()
          if (existingBottom) existingBottom.remove()

          // animate clone to full screen bounds (respect safe-area-inset)
          const vw = document.documentElement.clientWidth || window.innerWidth
          const vh = document.documentElement.clientHeight || window.innerHeight
          const targetTop = 0
          const targetLeft = 0
          const targetWidth = vw
          const targetHeight = vh
          const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } })
          tl.to(clone, { top: targetTop, left: targetLeft, width: targetWidth, height: targetHeight, duration: 0.68 }, 0)
          // animate dither clipPath to full
          tl.to(gd, { clipPath: fullClip, opacity: 1, duration: 0.64, ease: 'sine.inOut' }, 0)
          // fade in internal modal content slightly after start
          tl.to(clone, { opacity: 1, duration: 0.26 }, '-=0.38')

          // when animation completes, remove clone
          tl.call(() => {
            try { if (clone && clone.parentNode) clone.parentNode.removeChild(clone) } catch (e) {}
          })
        } catch (err) { /* non-fatal */ }
      } catch (err) { /* non-fatal */ }
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
            duration: 0.28,
            ease: 'power2.inOut',
            onComplete: () => {
              try { gd.classList.remove('front') } catch {}
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
    const onMove = (e) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY }
      // если модалки нет — проверяем, не находимся ли мы над текущей карточкой и не потерян ли hover
      if (!isModalOpenRef.current && !isTouchRef.current) {
        for (let i = 0; i < cardRefs.current.length; i++) {
          const c = cardRefs.current[i]
          if (!c) continue
          const r = c.getBoundingClientRect()
          const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
          if (inside && hoveredIndex !== i) {
            handleHover(i, true)
            break
          }
        }
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    // Немедленная анимация fade-in при загрузке (на мобилке мягче/короче)
    cards.forEach((_, index) => {
      gsap.fromTo(`.card-${index}`,
        { opacity: 0, y: 0 }, // Начинаем с y: 0, чтобы карточки не были смещены вниз
        {
          opacity: 1,
          y: 0,
          duration: isTouchRef.current ? 0.5 : 0.8,
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
      // Очистка анимаций
      window.removeEventListener('mousemove', onMove)
      
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
      if (openedIndex === 2 && servicesStep === 'subscription') return
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

  const windowScroll = openedIndex === 2 && servicesStep === 'subscription'
  return (
    <MenuContainer $windowScroll={windowScroll}>
      <CustomCursor />

      {/* Удалён левый edge для возврата домой, чтобы не перекрывать первую карточку */}

  <Section ref={menuRef} $windowScroll={windowScroll}>
        <GlobalDither ref={globalDitherRef} aria-hidden="true">
          <Dither style={{ position: 'absolute', inset: 0 }} waveColor={waveColors[globalDitherColorIndex]} enableMouseInteraction={true} trackWindowMouse={true} mouseRadius={0.4} />
        </GlobalDither>
  <CardRow $windowScroll={windowScroll}>
          {cards.map((card, index) => (
            <React.Fragment key={index}>
              <Card
                ref={(el) => (cardRefs.current[index] = el)}
                className={`card-${index}`}
    onMouseEnter={() => { handleHover(index, true) }}
    onMouseLeave={() => { handleHover(index, false) }}
                onClick={(e) => {
                  if (index === 3) {
                    e.stopPropagation();
                    e.preventDefault?.();
                    // Open project creation modal like on HomePage
                    setIsProjectModalOpen(true)
                    setIsProjectModalAnimationReady(true)
                    return
                  }
                  openCardFullscreen(index, e)
                }}
                tabIndex={0}
                role="button"
                aria-disabled={index === 3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (index === 3) {
                      setIsProjectModalOpen(true)
                      setIsProjectModalAnimationReady(true)
                      return
                    }
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
                        <AboutText className="about-text">
                          <p>Привет, меня зовут Михаил.</p>
                          <p>
                            Я разрабатываю сайты, Telegram- и WhatsApp-ботов, а также автоматизирую всё,
                            что может сэкономить твоё время и упростить жизнь.
                          </p>
                          <p>
                            Клиенты ценят меня за то, что я быстро понимаю задачи, предлагаю адекватные и
                            нестандартные решения и чётко соблюдаю сроки. Со мной легко общаться: я не люблю
                            формальностей, зато люблю, когда сделано красиво, продуманно и качественно.
                          </p>
                          <AboutCaption className="about-caption">Как я работаю</AboutCaption>
                          <ul className="about-list">
                            <li>Общаемся, обсуждаем задачу, утверждаем концепцию.</li>
                            <li>Я готовлю чёткий план, где прописаны сроки и этапы.</li>
                            <li>Реализую проект, держа тебя в курсе и уточняя моменты, если нужно.</li>
                          </ul>
                          <p>
                            Сделать «как у всех» — это не ко мне. Сделать продуманно и стильно — это ко мне.
                          </p>
                          <AboutCaption className="about-caption">Вопрос-ответ</AboutCaption>
                          <FAQAccordion className="faq-accordion">
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
                                  <p>Это «абонемент на спокойствие» за 30 000 ₽ в месяц. Тебе не нужно искать и нанимать разных специалистов для поддержки проекта — всё делаю я. В подписку входит:</p>
                                  <ul>
                                    <li>хостинг и размещение проекта,</li>
                                    <li>техническая поддержка,</li>
                                    <li>обновление контента (до 5 страниц/пунктов в месяц),</li>
                                    <li>защита от DDoS-атак и других угроз,</li>
                                    <li>консультации и мелкие доработки.</li>
                                  </ul>
                                  <p>Ты занимаешься бизнесом, а я слежу, чтобы твой проект всегда работал стабильно и без проблем.</p>
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
                          </FAQAccordion>
                        </AboutText>
                      </AboutLeft>
                      <AboutRight>
                        <AboutPhotoWrap className="about-photo-wrap">
                          <AboutPhoto className="about-photo" src="/images/rudakovrz7.png" alt="" />
                          <FilmGrainOverlay className="film-grain" aria-hidden="true" />
                        </AboutPhotoWrap>
                      </AboutRight>
                    </AboutModalContent>
                  )}

                  {openedIndex === index && index === 1 && (
                    <ProjectsModalWrap data-testid="projects-modal" onTouchStart={onProjectsTouchStart} onTouchEnd={onProjectsTouchEnd}>
                      <ProjectsTopTitle>Проекты</ProjectsTopTitle>
                      <MobileProjectsNavigation data-testid="mobile-projects-nav">
                        <NavButton
                          ref={navBotsRef}
                          className={projectsCategory === 'bots' ? 'active' : ''}
                          onClick={(e) => handleProjectsNavButtonClick('bots', e)}
                          data-testid="nav-button-bots"
                        >
                          Боты
                        </NavButton>
                        <NavButton
                          ref={navWebRef}
                          className={projectsCategory === 'web' ? 'active' : ''}
                          onClick={(e) => handleProjectsNavButtonClick('web', e)}
                          data-testid="nav-button-web"
                        >
                          Сайты
                        </NavButton>
                        <NavButton
                          ref={navToolsRef}
                          className={projectsCategory === 'tools' ? 'active' : ''}
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
                            <div key={p.id} style={{ padding: 12 }} onClick={(e) => { e.stopPropagation(); if (p.href) navigate(p.href) }}>
                              <ProjectCard style={{ width: '100%' }}>
                                <CardInner>
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
                                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{p.title}</h4>
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
                                <ProjectCard key={p.id} onClick={(e) => { e.stopPropagation(); if (p.href) navigate(p.href) }}>
                                  <CardInner>
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
                                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{p.title}</h4>
                                      <MetaRow>
                                        <span>{p.role || 'Role'}</span>
                                        <span className="dot" />
                                        <span>{p.year || ''}</span>
                                      </MetaRow>
                                      <TechChips>
                                        {(p.tech || []).slice(0, 2).map(t => (<span key={t} className="chip">{t}</span>))}
                                        {((p.tech || []).length > 2) && (
                                          <span className="chip">+{(p.tech || []).length - 2}</span>
                                        )}
                                      </TechChips>
                                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {(p.features || []).slice(0, 2).map((f, i) => (
                                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.95 }}>
                                            <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(255,165,0,0.25)', display: 'inline-block' }} />
                                            <span style={{ whiteSpace: 'normal' }}>{f}</span>
                                          </div>
                                        ))}
                                      </div>
                                      {p.href && (
                                        <button onClick={(e) => { e.stopPropagation(); navigate(p.href) }} style={{ marginTop: 10, fontSize: 12, color: '#fff', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
                                          Подробнее
                                        </button>
                                      )}
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
                                <ProjectCard key={p.id} onClick={(e) => { e.stopPropagation(); if (p.href) navigate(p.href) }}>
                                  <CardInner>
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
                                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{p.title}</h4>
                                      <div style={{ fontSize: 13, opacity: 0.9 }}>{p.description}</div>
                                      <TechChips>
                                        {(p.tech || []).map(t => (<span key={t} className="chip">{t}</span>))}
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
                                <ProjectCard key={p.id} onClick={(e) => { e.stopPropagation(); if (p.href) navigate(p.href) }}>
                                  <CardInner>
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
                                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{p.title}</h4>
                                      <div style={{ fontSize: 13, opacity: 0.9 }}>{p.description}</div>
                                      <TechChips>
                                        {(p.tech || []).map(t => (<span key={t} className="chip">{t}</span>))}
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
                    <ServicesModalWrap className="services-modal" ref={servicesModalRef} $windowScroll={windowScroll}>
                      <ProjectsTopTitle>{servicesStep === 'subscription' ? 'Подписка' : 'Услуги'}</ProjectsTopTitle>
                      <PricingHeader>
                        {/* Desktop navigation (hidden on subscription step) */}
                        {servicesStep === 'pick' && (
                          <HeadingsRow style={{ marginBottom: 8, position: 'relative', display: 'none' }} className="desktop-only" ref={tabsRowRef}>
                            <HeadingTab ref={tabWebRef} data-active={servicesCategory === 'web'} onClick={(e) => { e.stopPropagation(); switchCategory('web') }}>
                              Сайты / Веб‑приложения
                            </HeadingTab>
                            <HeadingTab ref={tabBotsRef} data-active={servicesCategory === 'bots'} onClick={(e) => { e.stopPropagation(); switchCategory('bots') }}>
                              Боты
                            </HeadingTab>
                            <HeadingTab ref={tabAutoRef} data-active={servicesCategory === 'automation'} onClick={(e) => { e.stopPropagation(); switchCategory('automation') }}>
                              Программы / Софт
                            </HeadingTab>
                            <TabIndicator ref={indicatorRef} />
                          </HeadingsRow>
                        )}
                        
                        {/* Mobile navigation (hidden on subscription step) */}
                        {servicesStep === 'pick' && (
                          <MobileServicesNavigation data-testid="mobile-services-nav">
                            <NavButton
                              ref={servicesNavWebRef}
                              className={servicesCategory === 'web' ? 'active' : ''}
                              onClick={(e) => handleServicesNavButtonClick('web', e)}
                              data-testid="services-nav-button-web"
                            >
                              Сайты
                            </NavButton>
                            <NavButton
                              ref={servicesNavBotsRef}
                              className={servicesCategory === 'bots' ? 'active' : ''}
                              onClick={(e) => handleServicesNavButtonClick('bots', e)}
                              data-testid="services-nav-button-bots"
                            >
                              Боты
                            </NavButton>
                            <NavButton
                              ref={servicesNavAutoRef}
                              className={servicesCategory === 'automation' ? 'active' : ''}
                              onClick={(e) => handleServicesNavButtonClick('automation', e)}
                              data-testid="services-nav-button-auto"
                            >
                              Софт
                            </NavButton>
                          </MobileServicesNavigation>
                        )}
                        
                        {/* Mobile tier navigation (hidden on subscription step) */}
                        {servicesStep === 'pick' && (
                          <ServicesTierNavigation data-testid="mobile-services-tier-nav">
                            <TierNavButton
                              ref={servicesTierBasicRef}
                              className={servicesTier === 'basic' ? 'active' : ''}
                              onClick={(e) => handleServicesTierButtonClick('basic', e)}
                              data-testid="services-tier-button-basic"
                            >
                              Базовый
                            </TierNavButton>
                            <TierNavButton
                              ref={servicesTierOptimalRef}
                              className={servicesTier === 'optimal' ? 'active' : ''}
                              onClick={(e) => handleServicesTierButtonClick('optimal', e)}
                              data-testid="services-tier-button-optimal"
                            >
                              Стандарт
                            </TierNavButton>
                            <TierNavButton
                              ref={servicesTierPremiumRef}
                              className={servicesTier === 'premium' ? 'active' : ''}
                              onClick={(e) => handleServicesTierButtonClick('premium', e)}
                              data-testid="services-tier-button-premium"
                            >
                              Премиум
                            </TierNavButton>
                          </ServicesTierNavigation>
                        )}
                      </PricingHeader>

                      {/* Шаги услуг: 1) выбор услуги, 2) выбор подписки */}

                      {servicesStep === 'pick' ? (
                        <>
                          <div style={{width: '100%', display: 'grid', gap: 8, margin: '8px 0'}}>
                            <div style={{textAlign:'center', color:'#fff', opacity:0.9, fontSize:14}}>
                              Шаг 1 из 2 — выберите услугу.
                            </div>
                          </div>
                          <PricingGrid ref={servicesGridRef} $center={servicesCategory === 'automation'} $narrow>
                          {(() => {
                            const list = servicesCategory === 'automation' ? servicesAutomation : (servicesCategory === 'web' ? servicesWeb : servicesBots)
                            const sel = servicesTier === 'basic' ? 0 : servicesTier === 'optimal' ? 1 : 2
                            return list.map((s, i) => (
                              <PricingCard
                                key={s.id}
                                className={`${servicesTier === 'optimal' ? 'featured' : ''} ${i !== sel ? 'tier-hidden' : ''}`}
                                style={{ cursor: 'default' }}
                              >
                                 <PricingTop>
                                   <PricingHead>
                                     <h4>{s.title}</h4>
                                     <p>{s.desc}</p>
                                   </PricingHead>
                                   <RightCol>
                                     <TopPrice>
                                       <span className="amount">{s.price}</span>
                                       <span className="period">{s.price === 'Custom' ? ' / по договоренности' : ' / проект'}</span>
                                     </TopPrice>
                                     <SelectButton type="button" onClick={(e)=>{ e.stopPropagation(); setServicesStep('subscription') }}>
                                       Выбрать
                                     </SelectButton>
                                   </RightCol>
                                 </PricingTop>
                                {/* Для кого подходит */}
                                <Divider />
                                <CardSectionTitle>Для кого подходит</CardSectionTitle>
                                <SectionBlock $minHeight={96}>
                                  <Bullets>
                                    {(() => {
                                      const audMap = {
                                        basic: ['Лендинги и промо‑сайты', 'Стартапы/MVP', 'Личные проекты'],
                                        optimal: ['Сайты компаний и каталоги', 'Небольшие интернет‑магазины', 'CRM/формы/личные кабинеты'],
                                        premium: ['Сложные веб‑приложения', 'SaaS/реал‑тайм', 'Высокие нагрузки'],
                                        'bot-basic': ['FAQ и поддержка', 'Сбор лидов', 'Простые сценарии'],
                                        'bot-optimal': ['Продажи/записи', 'Оплаты и админ‑панель', 'Интеграции с CRM'],
                                        'bot-premium': ['Сложные сценарии', 'Realtime/аналитика', 'Масштабирование'],
                                        'auto-custom': ['Интеграции и автоматизация', 'ETL/отчёты', 'Индивидуальные задачи']
                                      }
                                      const items = audMap[s.id] || []
                                      return items.map(v => (<li key={v}>{v}</li>))
                                    })()}
                                  </Bullets>
                                </SectionBlock>
                                <Divider />
                                <CardSectionTitle>Что входит</CardSectionTitle>
                                <SectionBlock $minHeight={256}>
                                  <Bullets>
                                    {s.features.map(f => {
                                      const map = { /* ...same mapping... */ }
                                      const norm = (s) => s.toLowerCase().replace(/\u2011/g, '-')
                                      const key = Object.keys(map).find(k => norm(f).includes(norm(k)))
                                      const text = key ? (
                                        <span className="term" tabIndex={0} role="button" aria-label="Подсказка" data-hint={map[key]} onClick={handleTermToggle} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTermToggle(e) } }}>{f}</span>
                                      ) : f
                                      return (<li key={f}>{text}</li>)
                                    })}
                                  </Bullets>
                                </SectionBlock>
                                {/* Блок "Доп. услуги" убран по требованию */}
                                <Divider />
                                <Muted style={{ marginTop: 6 }}>{s.timeline}</Muted>
                                <Muted style={{ opacity: 0.7 }}>{s.tech}</Muted>
                                {s.notes?.length ? (
                                  <Muted style={{ opacity: 0.7, marginTop: 6 }}>{s.notes.join(' • ')}</Muted>
                                ) : null}
                              </PricingCard>
                            ))
                          })()}
                          </PricingGrid>
                        </>
                      ) : (
                        <>
                          {/* Эксплейнер подписки — лаконичным текстом */}
                          <SubscriptionIntro>
                            <IntroTitleRow>
                              <IconBubble>✨</IconBubble>
                              <h4>Что такое подписка?</h4>
                            </IntroTitleRow>
                            <IntroBody>
                              <p>
                                Подписка — это простой и прозрачный способ получать поддержку и развитие продукта без лишней рутины.
                                Вы заранее понимаете объём работ и скорость реакции, а задачи выполняются регулярно и приоритетно.
                                Это чаще выгоднее разовых работ и найма, гибко масштабируется под рост и сопровождается отчётами.
                              </p>
                            </IntroBody>
                          </SubscriptionIntro>

                          <div style={{width: '100%', display: 'grid', gap: 8, margin: '8px 0'}}>
                            <div style={{textAlign:'center', color:'#fff', opacity:0.9, fontSize:14}}>
                              Шаг 2 из 2 — выберите подписку под задачу.
                            </div>
                          </div>

                          {/* Таблица сравнения подписок — как на скриншоте */}
                          <ComparisonTable>
                            <table className="comp-table">
                              <thead>
                                <tr>
                                  <th className="feat">Преимущества</th>
                                  <th>Без подписки</th>
                                  <th>Basic</th>
                                  <th>Pro</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="feat">Развертывание проекта на сервере</td>
                                  <td className="val"><span className="check">✓</span></td>
                                  <td className="val"><span className="check">✓</span></td>
                                  <td className="val"><span className="check">✓</span></td>
                                </tr>
                                <tr>
                                  <td className="feat">Хостинг+SSL</td>
                                  <td className="val"><span className="check">—</span></td>
                                  <td className="val"><span className="check">✓</span></td>
                                  <td className="val"><span className="check">✓</span></td>
                                </tr>
                                <tr>
                                  <td className="feat">Хостинг+SSL</td>
                                  <td className="val"><span className="check">—</span></td>
                                  <td className="val"><span className="check">✓</span></td>
                                  <td className="val"><span className="check">✓</span></td>
                                </tr>
                                <tr>
                                  <td className="feat">Задачи в месяц</td>
                                  <td className="val"><span className="dash">—</span></td>
                                  <td className="val"><span className="check">5</span></td>
                                  <td className="val"><span className="check">10</span></td>
                                </tr>
                                <tr>
                                  <td className="feat">Обновление зависимостей/библиотек</td>
                                  <td className="val"><span className="check">—</span></td>
                                  <td className="val"><span className="check">Раз в месяц</span></td>
                                  <td className="val"><span className="check">Два раза в месяц</span></td>
                                </tr>
                                <tr>
                                  <td className="feat">Расширенная аналитика</td>
                                  <td className="val"><span className="dash">—</span></td>
                                  <td className="val"><span className="check">✓</span></td>
                                  <td className="val"><span className="check">✓</span></td>
                                </tr>
                                <tr>
                                  <td className="feat">Время реагирования</td>
                                  <td className="val"><span className="dash">—</span></td>
                                  <td className="val"><span className="check">до 2 рабочих дней</span></td>
                                  <td className="val"><span className="check">✓</span><small>реакция ≤ 4 ч в рамках рабочего дня</small></td>
                                </tr>
                              </tbody>
                            </table>
                          </ComparisonTable>

                          <ComparisonCTARow>
                            <SelectButton type="button" onClick={(e)=>{ e.stopPropagation(); setPrefill({ step:'contact', description: 'Интересует разовый проект (без подписки).' }); setIsProjectModalOpen(true); }}>Разовый проект →</SelectButton>
                            <SelectButton $variant="outline" type="button" onClick={(e)=>{ e.stopPropagation(); setPrefill({ step:'contact', description: 'Интересует подписка Basic.' }); setIsProjectModalOpen(true); }}>Выбрать Basic</SelectButton>
                            <SelectButton $variant="contrast" type="button" onClick={(e)=>{ e.stopPropagation(); setPrefill({ step:'contact', description: 'Интересует подписка Pro.' }); setIsProjectModalOpen(true); }}>Заказать Pro →</SelectButton>
                          </ComparisonCTARow>
                        </>
                      )}
                    </ServicesModalWrap>
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
                {openedIndex === index && servicesStep === 'subscription' && (
                  <BackTopButton
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setServicesStep('pick') }}
                    aria-label="Назад"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
                    </svg>
                  </BackTopButton>
                )}
                {/* Убрано изображение в хавере "О себе" */}
              </Card>
              {/* Подставка для предотвращения смещения сетки при фиксировании .is-open */}
              {openedIndex === index && <CardPlaceholder aria-hidden="true" />}
            </React.Fragment>
          ))}
        </CardRow>
      </Section>

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

      <MobileNavigation />
    </MenuContainer>
  )
}

export default MenuPage

// Preload dither effects
const preloadImage = new Image();
preloadImage.src = '/images/rudakovrz7.png?v=1';

// Обработка наведения на левый край