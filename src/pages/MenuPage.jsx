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
// ProjectsScrollStack не используем в новой версии модалки


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
  position: fixed;
  top: calc(16px + env(safe-area-inset-top, 0px));
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
    flex-direction: column;
    flex-wrap: nowrap;
    height: auto;
    min-height: 100dvh;
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
    @media (max-width: 768px) {
      border-bottom: none;
    }
  }
  
  @media (max-width: 1280px) and (min-width: 1025px) {
    width: 50%;
    height: 50vh;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    height: 22vh;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0 8px;
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
    width: 100%;
    height: 22vh;
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

const AboutRight = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 100%;
`

const AboutPhotoWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 16px 16px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 768px) {
    height: auto;
    min-height: 100dvh;
    padding: 12px 12px calc(16px + env(safe-area-inset-bottom, 0px));
    gap: 12px;
  }
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

const BadgePill = styled.div`
  font-size: 11px; padding: 4px 8px; border-radius: 999px; color: #fff;
  background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.28);
`

const Muted = styled.p`
  margin: 0; font-size: 13px; opacity: 0.8; text-align: center; color: #fff;
`

const PricingGrid = styled.div`
  display: grid; grid-template-columns: 1fr; gap: 0; width: 100%;
  justify-items: ${props => props.$center ? 'center' : 'stretch'};
  @media (min-width: 1024px) { grid-template-columns: ${props => props.$center ? '1fr' : 'repeat(3, 1fr)'}; }
  /* убрать сплошную верхнюю линию из границ карточек */
  & > div:first-child { border-top: none; }
  @media (min-width: 1024px) { & > div:nth-child(-n+3) { border-top: none; } }
`

const PricingCard = styled.div`
  text-align: left; border-radius: 0; padding: 16px; cursor: pointer; color: #fff;
  background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(2px);
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
  /* прижатые карточки: убираем двойную линию между соседями */
  & + & { border-left: none; }
  &:hover { border-color: rgba(255,255,255,0.2); background: rgba(0,0,0,0.36); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
  &.featured { background: rgba(0,0,0,0.34); border-color: rgba(255,255,255,0.22); box-shadow: 0 10px 28px rgba(0,0,0,0.28); }
  display: flex; flex-direction: column; gap: 8px; height: 100%;

  @media (max-width: 768px) {
    padding: 12px;
    gap: 6px;
  }
`

const CardSectionTitle = styled.div`
  margin-top: 8px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.75);
`

const SectionBlock = styled.div`
  min-height: ${props => props.$minHeight ? `${props.$minHeight}px` : 'auto'};
`
const PricingHead = styled.div`
  display: flex; flex-direction: column; gap: 8px;
  h4 { margin: 0; font-size: 18px; font-weight: 600; }
  p { margin: 0; font-size: 13px; opacity: 0.9; }

  @media (max-width: 768px) {
    h4 { font-size: 16px; }
    p { font-size: 12px; }
  }
`

const PricingTop = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
`

const TopPrice = styled.div`
  display: flex; align-items: baseline; gap: 8px; white-space: nowrap;
  align-self: flex-start; margin-top: -8px;
  .amount { font-size: 28px; font-weight: 600; line-height: 1; }
  .period { font-size: 12px; opacity: 0.8; line-height: 1; position: relative; top: 0; }

  @media (max-width: 768px) {
    margin-top: -6px;
    .amount { font-size: 24px; }
    .period { font-size: 11px; }
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
  .term:hover::after { opacity: 1; transform: translateY(0); }
`

const ServiceActions = styled.div`
  margin-top: 8px; display: flex; gap: 10px;
  button { font-size: 12px; padding: 6px 10px; border-radius: 10px; cursor: pointer; }
  .primary { color: #fff; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.28); }
  .secondary { color: #fff; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.18); }
`

const Divider = styled.hr`
  border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 10px 0;
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
    grid-auto-columns: minmax(240px, 300px);
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
    width: 260px;
    min-width: 240px;
    height: 180px;
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
  background-position: center;
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
    font-size: 24px;
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
  // убрали таймеры дебаунса — из‑за них терялись hover‑события
  const [openedIndex, setOpenedIndex] = useState(null)
  const cardRefs = useRef([])
  const mousePosRef = useRef({ x: 0, y: 0 })
  const hoverLockRef = useRef({}) // индекс → timestamp до которого игнорируем mouseleave
  const lastHoveredBeforeOpenRef = useRef(null)
  const isModalOpenRef = useRef(false)
  const lastOpenModalIndexRef = useRef(null)
  const stripsRef = useRef([])
  const aboutContainerRef = useRef(null)
  const ditherBreatheTlRef = useRef(null)
  const [servicesCategory, setServicesCategory] = useState('web')
  const serviceCategories = ['web','bots','automation']
  const isTouchRef = useRef((() => {
    try {
      return (typeof window !== 'undefined' && (('ontouchstart' in window) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)))
    } catch { return false }
  })())
  const getNextCategory = (dir) => {
    const idx = serviceCategories.indexOf(servicesCategory)
    const nextIdx = (idx + (dir === 'next' ? 1 : -1) + serviceCategories.length) % serviceCategories.length
    return serviceCategories[nextIdx]
  }
  const servicesGridRef = useRef(null)
  const tabsRowRef = useRef(null)
  const tabWebRef = useRef(null)
  const tabBotsRef = useRef(null)
  const tabAutoRef = useRef(null)
  const indicatorRef = useRef(null)
  const isServicesSwitchingRef = useRef(false)

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
      gsap.set(ind, { left, width })
    })
  }

  const switchCategory = (nextCat) => {
    if (nextCat === servicesCategory) return
    if (isServicesSwitchingRef.current) return
    isServicesSwitchingRef.current = true
    const grid = servicesGridRef.current
    try { gsap.killTweensOf(grid) } catch {}
    if (grid) {
      gsap.to(grid, { opacity: 0, y: 8, duration: 0.18, ease: 'power2.in', onComplete: () => {
        setServicesCategory(nextCat)
      }})
    } else {
      setServicesCategory(nextCat)
    }
  }

  useEffect(() => {
    const grid = servicesGridRef.current
    if (!grid) return
    // slide/fade анимация появления карточек
    const children = Array.from(grid.children)
    gsap.set(children, { opacity: 0, y: 8 })
    gsap.to(grid, { opacity: 1, duration: 0.01 })
    gsap.to(children, { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out', stagger: 0.06, onComplete: () => { isServicesSwitchingRef.current = false } })
    // анимация индикатора под активным заголовком
  // Индикатор больше не используется — подчёркивание рисуем через ::after у активного заголовка
  }, [servicesCategory])

  // Позиционируем индикатор и анимируем карточки при первом открытии модалки "Услуги"
  useEffect(() => {
    if (openedIndex !== 2) return
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
      id: 'basic',  title: 'Базовый',
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
      id: 'optimal', title: 'Оптимальный',
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
        'Всё из «Оптимальный»',
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
      id: 'bot-optimal', title: 'Оптимальный',
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
      { id: 'tg-shop', title: 'Бот "Худеем с Войтенко!"', description: 'Продажа подписок и консультаций с автопродлением (CloudPayments)', href: '#', image: '/images/botdieta.png', tech: ['Python', 'aiogram 3', 'MySQL', 'CloudPayments'], year: '2025', role: 'Back‑end', features: ['Подписки и автопродление', 'Webhooks CloudPayments'] },
      { id: 'wa-support', title: 'KLAMbot', description: 'Документооборот и статусы по объектам/альбомам. Google Sheets + уведомления.', href: '#', image: '/images/klambot.png', tech: ['Python', 'PTB v20+', 'Google Sheets API', 'aiosmtplib'], year: '2025', role: 'Automation', features: ['Интеграция с Google Sheets', 'Раскраска статусов и уведомления'] },
    ],
    tools: [
      { id: 'wb-integrator', title: 'WB Авто-акции', description: 'Интеграция с Wildberries + Google Sheets: акции, маржа, выгрузки', href: '#', image: '/images/WB.png', tech: ['Python', 'Requests', 'Pandas', 'Google Sheets API'], year: '2025', role: 'Automation', features: ['Расчёт маржи и отбор в акции', 'Выгрузки в Google Sheets'] },
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

    const arrow = cardElement.querySelector(`.arrow-${index}`)
    
    // Единственный заголовок (позиция не меняется)
    const title = cardElement.querySelector(`.title-${index}`)

    // Стоп текущей таймлайн на этой карточке
    const tlPrev = hoverTimelinesRef.current[index]
    if (tlPrev) tlPrev.kill()
    gsap.killTweensOf([arrow, title])
    if (title) gsap.set(title, { x: 0, clearProps: 'transform' })
    // Сохраняем вертикальное центрирование стрелки через yPercent, не очищая transform
    if (arrow) gsap.set(arrow, { x: 0, rotation: 0, opacity: 1, yPercent: -50 })

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
      if (arrow) tl.to(arrow, { x: 10, rotation: 45, opacity: 0.8, yPercent: -50, duration: 0.25 }, 0)
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
      if (arrow) tl.to(arrow, { x: 0, rotation: 0, opacity: 1, yPercent: -50, duration: 0.25 }, 0)
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
    lastOpenModalIndexRef.current = index
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
    let ditherDuration = isTouchRef.current ? 0.24 : 0.6
    if (gd) {
      // Сбрасываем любые зависшие анимации dither, чтобы старт был чистым
      resetGlobalDither()
      if (isTouchRef.current) {
        // Мобильный UX: простое затемнение фона, без FLIP и дыхания
        gsap.set(gd, { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', borderRadius: 0, opacity: 0, clipPath: 'none' })
        gsap.to(gd, { opacity: 0.26, duration: ditherDuration, ease: 'power2.out' })
      } else {
        // Desktop: FLIP dither до fullscreen
        gd.classList.add('front')
        const rect = el.getBoundingClientRect()
        gsap.set(gd, { opacity: 1, clipPath: 'none', position: 'fixed' })
        gsap.set(gd, { top: rect.top, left: rect.left, right: 'auto', bottom: 'auto', width: rect.width, height: rect.height, borderRadius: 16 })
        const ditherState = Flip.getState(gd)
        gsap.set(gd, { top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', borderRadius: 0 })
        Flip.from(ditherState, { duration: ditherDuration, ease: 'power2.inOut', absolute: true, onComplete: () => {
          gd.classList.remove('front')
          // Дышащая анимация dither в модалке — только desktop
          ditherBreatheTlRef.current?.kill()
          if (!isTouchRef.current) {
            ditherBreatheTlRef.current = gsap.timeline({ repeat: -1, yoyo: true })
              .to(gd, { opacity: 0.32, duration: 2.8, ease: 'sine.inOut' })
              .to(gd, { opacity: 0.25, duration: 2.8, ease: 'sine.inOut' })
          }
        } })
      }
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
      duration: isTouchRef.current ? 0.28 : 0.5,
      ease: isTouchRef.current ? 'power2.out' : 'power2.inOut',
      absolute: true,
      scale: false,
      nested: true,
      delay: isTouchRef.current ? 0 : 0.2
    })

    // Появление контента модалки на мобильных: лёгкий fade/slide
    if (isTouchRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            const content = el.querySelector('.about-modal, .projects-modal, .services-modal')
            if (content) {
              gsap.fromTo(content, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: 'power2.out' })
            }
          } catch {}
        })
      })
    }
  }

  const closeCardFullscreen = (index) => {
    const el = cardRefs.current[index]
    if (!el) return
    try { setParticleSpeed?.(1.0) } catch {}
    // На сенсорных: одиночный тап по открытому блоку — закрыть и снять принудительный hover
    if (isTouchRef.current) {
      cardRefs.current.forEach((c) => c && c.classList.remove('force-hover'))
    }
    // Блокируем закрытие hover на короткое время после старта закрытия
    hoverLockRef.current[index] = performance.now() + 600
    const gd = globalDitherRef.current
    const state = Flip.getState(el)
    // Заголовок: при закрытии просто исчезает (fade-out), чтобы не "уезжать" вместе с Flip
    const titleEl = el.querySelector(`.title-${index}`)
    if (titleEl) {
      gsap.set(titleEl, { willChange: 'opacity' })
      gsap.to(titleEl, { opacity: 0, duration: isTouchRef.current ? 0.12 : 0.18, ease: 'power2.out' })
    }
    el.classList.remove('is-open')
    setOpenedIndex(null)
    lastOpenModalIndexRef.current = null
    Flip.from(state, {
      duration: isTouchRef.current ? 0.24 : 0.5,
      ease: isTouchRef.current ? 'power2.in' : 'power2.inOut',
      absolute: true,
      scale: false,
      nested: true,
      onComplete: () => {
        if (titleEl) {
          gsap.set(titleEl, { opacity: 1 })
        }
        if (gd) {
          // Останавливаем дыхание dither
          ditherBreatheTlRef.current?.kill()
          if (isTouchRef.current) {
            // На мобилке — просто гасим фон
            gsap.to(gd, { opacity: 0, duration: 0.18, ease: 'power2.in', onComplete: () => { gd.classList.remove('front') } })
          } else {
            // Desktop — возвращаем dither к карточке
            const endClip = computeClipFromElement(el)
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
                  gsap.set(gd, { opacity: 1, clipPath: endClip })
                } else {
                  gsap.set(gd, { opacity: 0, clipPath: 'inset(0 100% 100% 0 round 16px)' })
                }
                gd.classList.remove('front')
              }
            })
          }
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
      gsap.set([ ...paragraphs, ...listItems ], { opacity: 0, y: 12 })
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
    }
  }, [navigate])

  // Центрирование горизонтальных рядов в модалке «Проекты» и блокировка вертикального скролла
  useEffect(() => {
    if (openedIndex === 1) {
      try { document.body.style.overflow = 'hidden' } catch {}
      // Центрируем каждый ряд по ширине контейнера
      requestAnimationFrame(() => {
        stripsRef.current.forEach((el) => {
          if (!el) return
          const center = Math.max(0, (el.scrollWidth - el.clientWidth) / 2)
          el.scrollLeft = center
        })
      })
    } else {
      try { document.body.style.overflow = '' } catch {}
    }

    return () => { try { document.body.style.overflow = '' } catch {} }
  }, [openedIndex])

  // Защита от layout-съезда после alt-tab/visibilitychange/resize
  useEffect(() => {
    const hardResetLayout = () => {
      if (document.hidden) return
      // Обновляем GSAP/ScrollTrigger измерения
      try { ScrollTrigger.refresh(true) } catch {}

      // Сбрасываем глобальный dither и зависшие твины
      try {
        resetGlobalDither({ opacity: 0, clipPath: 'inset(0 100% 100% 0 round 16px)' })
        gsap.killTweensOf(globalDitherRef.current)
      } catch {}

      // Восстанавливаем ВСЁ в зависимости от того, была ли открыта модалка
      try {
        hoverTimelinesRef.current.forEach((tl) => { try { tl?.kill() } catch {} })
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
            gsap.set(gd, { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', borderRadius: 0, clipPath: 'none', opacity: 0.28 })
          }
          try { setParticleSpeed?.(0.4) } catch {}
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
          try { setParticleSpeed?.(1.0) } catch {}
          requestAnimationFrame(() => {
            stripsRef.current.forEach((el) => {
              if (!el) return
              const center = Math.max(0, (el.scrollWidth - el.clientWidth) / 2)
              el.scrollLeft = center
            })
          })
        }
      } catch {}
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
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    if (isMobile) return

    const onWheelToHome = (e) => {
        if (isTransitioningRef.current) return
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
      
      {/* Удалён левый edge для возврата домой, чтобы не перекрывать первую карточку */}
      
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
                {openedIndex !== index && (
                  <>
                <TitleSection>
                  <CardTitle className={`title-${index}`}>{card.title}</CardTitle>
                </TitleSection>
                <Arrow className={`arrow-${index}`}>→</Arrow>
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
                  <ProjectsModalWrap>
                    <ProjectsTopTitle>Проекты</ProjectsTopTitle>
                    <ProjectsRow>
                      <RowHeader>Веб‑приложения / сайты</RowHeader>
                      <RowScroller>
                        <CardsStrip ref={el => stripsRef.current[0] = el}>
                          {projectsRows.web.map(p => (
                            <ProjectCard key={p.id} onClick={(e)=>{e.stopPropagation(); if(p.href) navigate(p.href)}}>
                              <CardInner>
                                <CardFront>
                                  <CardImage style={{ backgroundImage: `url(${p.image})` }} />
                                  <CardOverlay />
                                  <CardText>
                                    <h4>{p.title}</h4>
                                    <p>{p.description}</p>
                                  </CardText>
                                </CardFront>
                                <CardBack>
                                  <h4 style={{margin:0, fontSize:16, fontWeight:600}}>{p.title}</h4>
                                  <MetaRow>
                                    <span>{p.role || 'Role'}</span>
                                    <span className="dot" />
                                    <span>{p.year || ''}</span>
                                  </MetaRow>
                                  <TechChips>
                                    {(p.tech||[]).slice(0,2).map(t => (<span key={t} className="chip">{t}</span>))}
                                    {((p.tech||[]).length > 2) && (
                                      <span className="chip">+{(p.tech||[]).length - 2}</span>
                                    )}
                                  </TechChips>
                                  <div style={{marginTop:6, display:'flex', flexDirection:'column', gap:4}}>
                                    {(p.features||[]).slice(0,2).map((f, i) => (
                                      <div key={i} style={{display:'flex', alignItems:'center', gap:6, fontSize:12, opacity:0.95}}>
                                        <span style={{width:10, height:10, borderRadius:3, background:'rgba(255,165,0,0.25)', display:'inline-block'}} />
                                        <span style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'250px'}}>{f}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {p.href && (
                                    <button onClick={(e)=>{ e.stopPropagation(); navigate(p.href) }} style={{marginTop:10, fontSize:12, color:'#fff', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'6px 10px', cursor:'pointer'}}>
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
                            <ProjectCard key={p.id} onClick={(e)=>{e.stopPropagation(); if(p.href) navigate(p.href)}}>
                              <CardInner>
                                <CardFront>
                                  <CardImage style={{ backgroundImage: `url(${p.image})` }} />
                                  <CardOverlay />
                                  <CardText>
                                    <h4>{p.title}</h4>
                                    <p>{p.description}</p>
                                  </CardText>
                                </CardFront>
                                <CardBack>
                                  <h4 style={{margin:0, fontSize:16, fontWeight:600}}>{p.title}</h4>
                                  <div style={{fontSize:13, opacity:0.9}}>{p.description}</div>
                                  <TechChips>
                                    {(p.tech||[]).map(t => (<span key={t} className="chip">{t}</span>))}
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
                            <ProjectCard key={p.id} onClick={(e)=>{e.stopPropagation(); if(p.href) navigate(p.href)}}>
                              <CardInner>
                                <CardFront>
                                  <CardImage style={{ backgroundImage: `url(${p.image})` }} />
                                  <CardOverlay />
                                  <CardText>
                                    <h4>{p.title}</h4>
                                    <p>{p.description}</p>
                                  </CardText>
                                </CardFront>
                                <CardBack>
                                  <h4 style={{margin:0, fontSize:16, fontWeight:600}}>{p.title}</h4>
                                  <div style={{fontSize:13, opacity:0.9}}>{p.description}</div>
                                  <TechChips>
                                    {(p.tech||[]).map(t => (<span key={t} className="chip">{t}</span>))}
                                  </TechChips>
                                </CardBack>
                              </CardInner>
                            </ProjectCard>
                          ))}
                        </CardsStrip>
                      </RowScroller>
                    </ProjectsRow>
                  </ProjectsModalWrap>
                )}

                {openedIndex === index && index === 2 && (
                  <ServicesModalWrap>
                    <ProjectsTopTitle>Услуги</ProjectsTopTitle>
                    <PricingHeader>
                      <HeadingsRow style={{marginBottom: 8, position:'relative'}} ref={tabsRowRef}>
                        <HeadingTab ref={tabWebRef} data-active={servicesCategory==='web'} onClick={(e)=>{e.stopPropagation(); switchCategory('web')}}>
                          Сайты / Веб‑приложения
                        </HeadingTab>
                        <HeadingTab ref={tabBotsRef} data-active={servicesCategory==='bots'} onClick={(e)=>{e.stopPropagation(); switchCategory('bots')}}>
                          Боты
                        </HeadingTab>
                        <HeadingTab ref={tabAutoRef} data-active={servicesCategory==='automation'} onClick={(e)=>{e.stopPropagation(); switchCategory('automation')}}>
                          Программы / Автоматизация
                        </HeadingTab>
                        <TabIndicator ref={indicatorRef} />
                      </HeadingsRow>
                    </PricingHeader>

                    <PricingGrid ref={servicesGridRef} $center={servicesCategory === 'automation'}>
                      {(servicesCategory === 'automation'
                        ? servicesAutomation
                        : (servicesCategory === 'web' ? servicesWeb : servicesBots)).map((s, i) => (
                        <PricingCard key={s.id} className={i === 1 ? 'featured' : ''} onClick={(e)=>{ e.stopPropagation(); navigate('/contact') }}>
                          <PricingTop>
                            <PricingHead>
                              <h4>{s.title}</h4>
                              <p>{s.desc}</p>
                            </PricingHead>
                            <TopPrice>
                              <span className="amount">{s.price}</span>
                              <span className="period">{s.price === 'Custom' ? ' / по договоренности' : ' / проект'}</span>
                            </TopPrice>
                          </PricingTop>
                          <Divider />
                          <CardSectionTitle>Что входит</CardSectionTitle>
                          <SectionBlock $minHeight={256}>
                            <Bullets>
                              {s.features.map(f => {
                                const map = {
                                  'Адаптивная верстка': 'Сайт удобно читать с телефона и компьютера — всё подстраивается под экран.',
                                  'Форма обратной связи': 'Посетитель быстро свяжется с вами: заявки уходят на почту или в мессенджер.',
                                  'Кросс‑браузерное тестирование': 'Сайт выглядит и работает одинаково у большинства людей: Chrome, Safari, Firefox, Edge.',
                                  'Развертывание на сервере': 'Публикую сайт на хостинге и настраиваем, чтобы он открывался по адресу.',
                                  'Хостинг/домен': 'Хостинг — место, где живёт сайт. Домен — его адрес (например, site.ru).',
                                  'База данных/CRM': 'Хранение информации о клиентах, покупках, заявках и т.д. Видим аналитику. Всё в одном месте.',
                                  'админ‑панель': 'Управляете страницами, товарами и заявками без программиста.',
                                  'Платежная система': 'Приём оплат на сайте: карты, СБП, криптовалюты и т.п.',
                                  'Калькуляторы и формы': 'Быстрые расчёты и удобные заявки: клиент видит цену и отправляет данные в пару кликов.',
                                  'Калькуляторы/формы': 'Быстрые расчёты и удобные заявки: клиент видит цену и отправляет данные в пару кликов.',
                                  'Мультиязычность': 'Несколько языков и удобное переключение между ними.',
                                  'Безопасность': 'SSL (https) и соблюдение законов о данных — защита и доверие пользователей.',
                                  'GDPR/ФЗ‑152': 'Работа с персональными данными по закону: согласия, политика, защита.',
                                  'Авто‑тесты': 'Автоматические проверки кода и нагрузочные тесты — ловим ошибки до релиза.',
                                  'Документация и инструкции': 'Пошаговые материалы, чтобы вы могли сами работать с сайтом.',
                                  'WebSockets': 'Живые обновления без перезагрузки сайта: чат, уведомления, изменения статусов сразу.',
                                  'PWA (офлайн‑доступ)': 'Сайт как приложение: значок на телефоне, быстрее, часть функций доступна без интернета.',
                                  'SEO': 'Делаю сайт понятным для Google/Yandex, чтобы он был выше в поиске и приводил больше клиентов.',
                                }
                                const norm = (s) => s.toLowerCase().replace(/‑/g, '-');
                                const key = Object.keys(map).find(k => norm(f).includes(norm(k)))
                                const text = key ? (
                                  <span className="term" data-hint={map[key]}>{f}</span>
                                ) : f
                                return (<li key={f}>{text}</li>)
                              })}
                            </Bullets>
                          </SectionBlock>
                          {s.extras?.length ? (
                            <>
                              <Divider />
                              <CardSectionTitle>Доп. услуги</CardSectionTitle>
                              <SectionBlock $minHeight={96}>
                                <Bullets>
                                  {s.extras.map(f => {
                                    const map = {
                                      'Хостинг/домен': 'Хостинг — место, где живёт сайт. Домен — его адрес (например, site.ru).',
                                      'Доп. страница': 'Добавим новую страницу в общий стиль сайта с нужным контентом.',
                                      'Расширенная аналитика': 'Подключим метрики (Google/Yandex), события, цели — чтобы видеть, что работает.',
                                       'Миграции/перенос': 'Безопасный переезд: бэкап, перенос кода/БД/файлов, настройка домена и SSL, редиректы и проверка — без потери данных и SEO.',
                                      'Мультиязычность': 'Добавим ещё один язык и переключатель. Контент можно перевести позже.',
                                    }
                                    const norm = (s) => s.toLowerCase().replace(/‑/g,'-')
                                    const key = Object.keys(map).find(k => norm(f).includes(norm(k)))
                                    const text = key ? (<span className="term" data-hint={map[key]}>{f}</span>) : f
                                    return (<li key={f}>{text}</li>)
                                  })}
                                </Bullets>
                              </SectionBlock>
                            </>
                          ) : null}
                          <Divider />
                          <Muted style={{marginTop: 6}}>{s.timeline}</Muted>
                          <Muted style={{opacity: 0.7}}>{s.tech}</Muted>
                          {s.notes?.length ? (
                            <Muted style={{opacity: 0.7, marginTop: 6}}>{s.notes.join(' • ')}</Muted>
                          ) : null}
                          
                        </PricingCard>
                      ))}
                    </PricingGrid>
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