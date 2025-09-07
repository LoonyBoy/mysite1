import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import AnimatedInput from './AnimatedInput'
import telegramIcon from '../images/telegram.svg'
import whatsappIcon from '../images/whatsapp.svg'
import emailIcon from '../images/email.svg'

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: 9999; /* Повышаем z-index для гарантии перекрытия */
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  /* Размытие вместо черного фона */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    background: rgba(0, 0, 0, 0.2);
  }
`

const ModalContent = styled(motion.div)`
  background: #2a2a2a;
  border-radius: 12px;
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
  /* Очень мягкая анимация для общих изменений */
  transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
  /* Сглаживание / предотвращение мерцания текста на мобильных при fade */
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  backface-visibility: hidden;
  transform: translateZ(0); /* форсируем слой */
  will-change: opacity, transform;

  @media (max-width: 768px) {
    max-width: 100%;
    height: auto;
  max-height: 95vh; /* Увеличили до 95vh */
    border-radius: 12px 12px 0 0;
    width: 100vw;
    display: flex;
    flex-direction: column;
  /* Use safe-area inset instead of translate to avoid visual overflow on notch/status bars */
  padding-top: calc(env(safe-area-inset-top, 8px) + 8px);
  }
`

const ModalHeader = styled.div`
  padding: 40px 40px 30px;
  position: relative;
  flex-shrink: 0;

  @media (max-width: 768px) {
  padding: 16px 16px 8px; /* Use 8px grid on mobile */
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`

const ModalTitle = styled.h2`
  color: #ffffff;
  font-size: 2rem;
  font-weight: 400;
  margin: 0;
  text-align: left;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 1.4rem;
    text-align: left; /* Изменили с center на left */
    padding-right: 40px;
  }
`

const CloseButton = styled.button`
  /* same visual style as MenuPage close, but positioned inside modal */
  position: absolute; /* inside ModalContent */
  top: 16px;
  right: 16px;
  z-index: 20; /* above modal content */
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: var(--primary-red);
  background: transparent;
  border: 2px solid var(--primary-red);
  border-radius: 0; /* match 'О себе' */
  padding: 0;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.12s ease, box-shadow 0.2s ease;

  &:hover {
    background: var(--primary-red);
    color: var(--black);
    transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(0,0,0,0.35);
  }

  @media (max-width: 768px) {
  top: calc(env(safe-area-inset-top, 6px) + 2px); /* ещё чуть выше */
  right: 12px;
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
`

const BackButton = styled(motion.button)`
  /* positioned to the left of CloseButton */
  position: absolute;
  top: 16px;
  right: 76px; /* sits left of the close button */
  z-index: 20;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: var(--primary-red);
  background: transparent;
  border: 2px solid var(--primary-red);
  border-radius: 0;
  padding: 0;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.12s ease, box-shadow 0.2s ease;

  &:hover {
    background: var(--primary-red);
    color: var(--black);
    transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(0,0,0,0.35);
  }

  @media (max-width: 768px) {
    top: calc(env(safe-area-inset-top, 6px) + 2px);
    right: 64px; /* leave a gap from the close button */
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
`

const ModalBody = styled.div`
  padding: 0 40px 40px;
  max-height: 60vh;
  overflow-y: auto;
  flex: 1;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #777;
  }

  @media (max-width: 768px) {
    padding: 0 20px 16px; /* Уменьшили нижний padding с 20px до 16px */
    max-height: none;
    overflow-y: auto;
    flex: 1;
    min-height: 0; /* Позволяет сжиматься */
    
    &::-webkit-scrollbar {
      width: 3px;
    }
  }
`

const OptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`

const OptionButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 14px; /* reduced desktop gap */
  padding: 14px 0; /* reduced desktop vertical padding */
  background: transparent;
  border: none;
  color: #999;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  justify-content: flex-start;

  &:hover {
    color: #fff;
  }

  &.selected {
    color: var(--primary-red);
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    padding: 16px 0; /* mobile unchanged */
    gap: 15px; /* mobile unchanged */
    
    &:active {
      background: rgba(255, 255, 255, 0.05);
    }
  }
`

const OptionNumber = styled.span`
  color: #666;
  font-size: 1.1rem;
  font-weight: 400;
  min-width: 30px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  transition: color 0.2s ease;

  ${OptionButton}:hover & {
    color: #999;
  }

  ${OptionButton}.selected & {
    color: var(--primary-red);
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    min-width: 25px;
  }
`

const OptionText = styled.span`
  font-size: 1.1rem;
  line-height: 1.4;
  font-weight: 400;
  text-align: left;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 0.95rem;
    line-height: 1.3;
  }
`

const ContinueButton = styled(motion.button)`
  background: var(--primary-red);
  color: #ffffff;
  border: none;
  padding: 14px 32px;
  border-radius: 0;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;

  &:hover {
    background: #d91e24;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #555;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 16px 32px;
    font-size: 1.1rem;
    font-weight: 700;
    border-radius: 8px;
  }
`

const ContinueContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 30px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px; /* Уменьшили gap */
    align-items: stretch;
    margin-top: 12px; /* Уменьшили margin-top */
    padding: 8px 0 0; /* Уменьшили padding */
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  }
`

/* BackButtonInline removed: desktop inline "Back" button left of Continue is deleted per UX change */

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    order: 2;
    ${ContinueButton} {
      flex: 1;
    }
  }
`

const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    justify-content: center;
    order: 2; /* Перемещаем вниз в ButtonGroup */
    margin-top: 8px; /* Небольшой отступ сверху */
  }
`

const ProgressDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.active ? 'var(--primary-red)' : 'rgba(255, 255, 255, 0.2)'};
  transition: background 0.3s ease;
`

const ProgressLine = styled.div`
  width: 20px;
  height: 2px;
  background: ${props => props.active ? 'var(--primary-red)' : 'rgba(255, 255, 255, 0.2)'};
  transition: background 0.3s ease;
`

const SwipeIndicator = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    width: 40px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    margin: 12px auto 0;
  }
`

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: ${props => props.spacing === 'contact' ? '18px' : '0'};

  @media (max-width: 768px) {
    gap: 12px; /* Уменьшили еще больше для мобильных */
    padding-top: ${props => props.spacing === 'contact' ? '12px' : '0'};
  }
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.label`
  color: #fff;
  font-weight: 500;
  font-size: 1rem;
  @media (max-width: 768px) {
    display: none; /* hide labels on mobile, inputs will use placeholders */
  }
`

const Input = styled.input`
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 14px 16px;
  color: #fff;
  font-size: 1rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.3);
  }

  &::placeholder {
    color: #666;
  }

  @media (max-width: 768px) {
    padding: 16px;
    font-size: 16px; /* Предотвращает зум на iOS */
    border-radius: 12px;
  height: 48px;
  line-height: 48px;
  }
`

const TextArea = styled.textarea`
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 14px 16px;
  color: #fff;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.3);
  }

  &::placeholder {
    color: #666;
  }

  @media (max-width: 768px) {
    padding: 16px;
    font-size: 16px; /* Предотвращает зум на iOS */
    border-radius: 12px;
  min-height: 48px;
  height: 48px;
  line-height: 48px;
  resize: none;
  }
`

const ContactButtonsContainer = styled.div`
  /* Show primary submit button (previously hidden) */
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 30px;

  @media (max-width: 768px) {
    display: flex;
    width: 100%;
  }
`

const MobileContactWrapper = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
    margin-top: 12px;
    padding: 8px 0 0;
  /* removed top border per design */
  }
`

const DesktopContactWrapper = styled.div`
  display: block;
  margin-top: 12px;
  padding: 8px 0 0;
  /* removed top border to match design */

  @media (max-width: 768px) {
    display: none; /* hide on mobile */
  }
`

const MobileContactHeader = styled.div`
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  text-align: center;
  margin-bottom: 10px;
`

const MobileIconGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
`

const MobileIconButton = styled(motion.button)`
  width: 64px;
  height: 64px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(15,15,15,0.55);
  backdrop-filter: blur(10px) saturate(140%);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
  border: 2px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: transform 0.18s ease, background 0.3s ease, opacity 0.18s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  position: relative;
  overflow: hidden;
  isolation: isolate;

  &:before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(140deg, rgba(255,0,80,0.25), rgba(0,200,255,0.15));
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px -6px rgba(0,0,0,0.55), 0 0 22px rgba(209,72,54,0.45);
    border-color: var(--primary-red);
    &:before { opacity: 1; }
  }

  &:active:not(:disabled) { transform: translateY(-1px) scale(0.97); }

  &:disabled { opacity: 0.45; cursor: not-allowed; filter: grayscale(0.3); }

  /* Fallback: show raw SVG as background-image tinted via filters */
  &[data-icon="telegram"],
  &[data-icon="whatsapp"],
  &[data-icon="email"] {
    background-repeat: no-repeat, no-repeat;
    background-position: center, center;
    background-size: 36px 36px, cover;
    filter: brightness(1.05) saturate(1.1);
  }
  &[data-icon="telegram"] { background-image: url(${telegramIcon}); }
  &[data-icon="whatsapp"] { background-image: url(${whatsappIcon}); }
  &[data-icon="email"] { background-image: url(${emailIcon}); }

  /* Mask version (if supported) for solid color tint */
  @supports (-webkit-mask-image: url(${telegramIcon})) or (mask-image: url(${telegramIcon})) {
    &[data-icon="telegram"],
    &[data-icon="whatsapp"],
    &[data-icon="email"] {
      background-image: none; /* remove fallback */
      background-color: #ffffff; /* icon base color while disabled */
    }
    &[data-icon="telegram"] {
      -webkit-mask-image: url(${telegramIcon}); mask-image: url(${telegramIcon});
    }
    &[data-icon="whatsapp"] {
      -webkit-mask-image: url(${whatsappIcon}); mask-image: url(${whatsappIcon});
    }
    &[data-icon="email"] {
      -webkit-mask-image: url(${emailIcon}); mask-image: url(${emailIcon});
    }
    &[data-icon="telegram"],
    &[data-icon="whatsapp"],
    &[data-icon="email"] {
      -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
      -webkit-mask-position: center; mask-position: center;
      -webkit-mask-size: 36px 36px; mask-size: 36px 36px;
    }
  &:not(:disabled)[data-icon] { background-color: var(--primary-red); }
  &:not(:disabled):hover[data-icon] { background-color: var(--primary-red); }
  }
`

const ContactButton = styled(motion.button)`
  /* Replicate ActionButtonBase from HomePage */
  padding: 1rem 3rem;
  border: 2px solid var(--primary-red);
  background: rgba(0,0,0,0.2);
  backdrop-filter: blur(10px);
  color: var(--primary-red);
  font-size: 1.2rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: all 0.3s ease;
  min-height: 44px;
  position: relative;
  z-index: 10;
  overflow: hidden;
  text-shadow:
    0 0 10px rgba(209,72,54,0.5),
    0 0 20px rgba(209,72,54,0.3);
  box-shadow:
    0 0 20px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.1);
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  text-decoration: none;
  white-space: nowrap;
  width: 100%;
  border-radius: 0; /* match flat corners */

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

  &:hover:not(:disabled) {
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

    &::before { animation: cyberpunk-scan 1s infinite; }
    &::after { animation: pixel-flicker 0.1s infinite alternate; opacity: 1; }
  }

  &:active:not(:disabled) {
    transform: scale(0.98) translateY(-2px);
    animation: cyberpunk-glitch 0.2s ease-out;
  }

  &:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  filter: grayscale(0.25) brightness(0.85);
  border-color: rgba(209,72,54,0.5);
  background: linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.15));
  }

  @media (max-width: 768px) {
    padding: 1.2rem 2rem;
    font-size: 1rem;
    min-height: 48px;
    min-width: 200px;
  }
`

// Данные для опций
const mainCategories = [
  { id: 1, text: 'создать /whatsapp бота' },
  { id: 2, text: 'создать сайт/веб-приложение' },
  { id: 3, text: 'обновить дизайн моего сайта или приложения' },
  { id: 4, text: 'автоматизировать работу' },
  { id: 5, text: 'помочь с чем-то ещё' }
]

const subcategories = {
  1: [ // Telegram/WhatsApp бот
    { id: 1, text: 'Подключить платежи (ЮКасса, CloudPayments и т.д.)' },
    { id: 2, text: 'Нужна база данных (хранение пользователей, заказов и т.д.)' },
    { id: 3, text: 'Нужна интеграция с CRM' },
    { id: 4, text: 'Нужна админ-панель для управления' },
    { id: 5, text: 'Вебхуки/API для сторонних сервисов' },
    { id: 6, text: 'MiniApp (встраиваемое приложение)' },
    { id: 7, text: 'Ещё кое-что, чего нет в списке' }
  ],
  2: [ // Сайт/веб-приложение
    { id: 1, text: 'Интернет-магазин с корзиной и оплатой' },
    { id: 2, text: 'Личный кабинет пользователей' },
    { id: 3, text: 'Интеграция с базой данных' },
    { id: 4, text: 'SEO-оптимизация' },
    { id: 5, text: 'Система комментариев/отзывов' },
    { id: 6, text: 'Адаптивный дизайн для мобильных устройств' },
    { id: 7, text: 'Ещё кое-что, чего нет в списке' }
  ],
  3: [ // Обновление дизайна
    { id: 1, text: 'Современный минималистичный дизайн' },
    { id: 2, text: 'Улучшение пользовательского опыта (UX)' },
    { id: 3, text: 'Адаптация под мобильные устройства' },
    { id: 4, text: 'Анимации и интерактивные элементы' },
    { id: 5, text: 'Ребрендинг и новая цветовая схема' },
    { id: 6, text: 'Ещё кое-что, чего нет в списке' }
  ],
  4: [ // Автоматизация
    { id: 1, text: 'Автоматическая отправка email-рассылок' },
    { id: 2, text: 'Интеграция с CRM-системами' },
    { id: 3, text: 'Автоматизация социальных сетей' },
    { id: 4, text: 'Парсинг данных с сайтов' },
    { id: 5, text: 'Автоматические отчёты и аналитика' },
    { id: 6, text: 'Ещё кое-что, чего нет в списке' }
  ],
  5: [ // Что-то ещё
    { id: 1, text: 'Консультация' },
    { id: 2, text: 'Аудит существующего проекта' },
    { id: 3, text: 'Техническая поддержка проекта' },
    { id: 4, text: 'Интеграция сторонних сервисов' },
    { id: 5, text: 'Ещё кое-что, чего нет в списке' }
  ]
}

const ProjectModal = ({ isOpen, onClose, startAnimation = true, prefill }) => {
  // Инициализируем сразу корректный шаг, если есть префилл на контакт
  const [step, setStep] = useState(prefill?.step === 'contact' ? 'contact' : 'main') // 'main', 'subcategory', 'contact'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategories, setSelectedSubcategories] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    description: ''
  })
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)

  const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 768 || 'ontouchstart' in window)

  // Унифицированные пропсы анимации шага (убираем сдвиги на мобильном -> меньше мерцание)
  const stepTransitionDesktop = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: 'easeInOut' }
  }
  const stepTransitionMobile = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.18 }
  }
  const stepAnim = isMobile ? stepTransitionMobile : stepTransitionDesktop
  // Для полного устранения мерцания на мобильных: не делаем fade-in первого появления и не ждём exit
  if (isMobile) {
    stepAnim.initial = { opacity: 1 }
    stepAnim.animate = { opacity: 1 }
    stepAnim.exit = { opacity: 1 }
  }

  const stepsPresenceProps = isMobile
    ? { initial: false } // без ожидания и без начального скрытия
    : { mode: 'wait' }

  // Убираем все блядские переходы - мгновенное появление
  const overlayVariants = {
    hidden: { opacity: 1, backdropFilter: 'none' },
    visible: { opacity: 1, backdropFilter: 'blur(16px)' }
  }

  const modalVariants = {
    hidden: { y: 0, opacity: 1, scale: 1 },
    visible: { y: 0, opacity: 1, scale: 1 }
  }

  // Обновляем высоту viewport для мобильных устройств
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight)
    }

    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', updateViewportHeight)
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight)
      window.removeEventListener('orientationchange', updateViewportHeight)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      // Полная очистка при закрытии
      setStep('main')
      setSelectedCategory(null)
      setSelectedSubcategories([])
      setFormData({ name: '', phone: '', description: '' })
      return
    }
    // Открытие
    if (prefill?.step === 'contact') {
      // Сразу контакт без промежуточного мерцания
      setStep('contact')
      setSelectedCategory(null)
      setSelectedSubcategories([])
      setFormData({ name: '', phone: '', description: prefill?.description || '' })
    } else {
      setStep('main')
      setSelectedCategory(null)
      setSelectedSubcategories([])
      setFormData({ name: '', phone: '', description: prefill?.description || '' })
    }
  }, [isOpen, prefill?.step, prefill?.description])

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId)
  }

  const handleSubcategoryToggle = (subcategoryId) => {
    setSelectedSubcategories(prev => 
      prev.includes(subcategoryId)
        ? prev.filter(id => id !== subcategoryId)
        : [...prev, subcategoryId]
    )
  }

  const handleContinueToSubcategory = () => {
    if (selectedCategory) {
      setStep('subcategory')
    }
  }

  const handleContinueToContact = () => {
    setStep('contact')
  }

  const handleBack = () => {
    if (step === 'subcategory') {
      setStep('main')
      // Сбрасываем выбранные подкатегории и категорию при возврате к главному экрану
      setSelectedSubcategories([])
      setSelectedCategory(null)
    } else if (step === 'contact') {
      setStep('subcategory')
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isFormValid = formData.name.trim() && formData.phone.trim()

  const getCurrentStep = () => {
    if (step === 'main') return 1
    if (step === 'subcategory') return 2
    if (step === 'contact') return 3
    return 1
  }

  const renderProgressIndicator = () => {
    const currentStep = getCurrentStep()
    return (
      <ProgressIndicator>
        <ProgressDot active={currentStep >= 1} />
        <ProgressLine active={currentStep >= 2} />
        <ProgressDot active={currentStep >= 2} />
        <ProgressLine active={currentStep >= 3} />
        <ProgressDot active={currentStep >= 3} />
      </ProgressIndicator>
    )
  }

  const generateContactMessage = () => {
    const category = mainCategories.find(cat => cat.id === selectedCategory)?.text || ''
    const selectedSubcats = selectedSubcategories.map(id => 
      subcategories[selectedCategory]?.find(sub => sub.id === id)?.text
    ).filter(Boolean)

    // New user-requested template
    // Здравствуйте, меня зовут ...!
    // Мне нужен такой-то проект: (категория + опции)
    // Мой номер телефона: ...
    let message = `Привет! 👋 Меня зовут ${formData.name}.\n\n`
    // Project line (если пользователь выбрал категорию внутри модалки)
    if (category) {
      message += `Мне нужен проект: ${category}\n`
    }
    if (selectedSubcats.length > 0) {
      message += `Опции: ${selectedSubcats.join(', ')}\n`
    }
    // Перенос после блока выбора внутри модалки
    message += `\n`

    // Optional short description (от пользователя)
    if (formData.description.trim()) {
      message += `Описание: ${formData.description}\n\n`
    }
    // Prefill из MenuPage (у нас там строка вида: 'Интересует подписка ...\nВыбрана услуга: ...')
    if (prefill?.description) {
      // Разобьём и удалим дубли (если пользователь вставил то же в описание)
      const lines = prefill.description.split(/\n+/).map(l=>l.trim()).filter(Boolean)
      const cleaned = []
      for (const l of lines) {
        if (!cleaned.includes(l)) cleaned.push(l)
      }
      if (cleaned.length) {
        // Пытаемся отделить подписку и услугу
  const serviceLine = cleaned.find(l=>/^Услуга:/i.test(l) || /^Выбрана услуга:/i.test(l))
        const subLine = cleaned.find(l=>/подписка/i.test(l) || /разовый проект/i.test(l))
        if (serviceLine || subLine) {
          message += `Мой выбор на сайте:\n`
          if (serviceLine) message += `• ${serviceLine.replace(/Выбрана услуга:\s*/i,'').replace(/^[Уу]слуга:\s*/,'Услуга: ')}\n`
          if (subLine) message += `• ${subLine.replace(/Интересует\s*/i,'').replace(/^Оформить\s*/i,'Подписка: ')}\n`
          message += `\n`
        }
      }
    }

    // Phone
    message += `Связь: ${formData.phone}`
    message += `\n\nБуду рад обсудить детали! 🚀`

    return encodeURIComponent(message)
  }

  const handleSendEmail = () => {
    const message = generateContactMessage()
    const subject = encodeURIComponent('Заявка на создание проекта')
    window.open(`mailto:loony.boss.work@gmail.com?subject=${subject}&body=${message}`)
  }

  const submitLead = async () => {
    // Fire-and-forget lead submission to backend which forwards to Telegram bot
    try {
      const category = mainCategories.find(cat => cat.id === selectedCategory)?.text || ''
      const selectedSubcats = selectedSubcategories.map(id =>
        subcategories[selectedCategory]?.find(sub => sub.id === id)?.text
      ).filter(Boolean)
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
            phone: formData.phone,
            description: formData.description || prefill?.description || '',
            category,
            options: selectedSubcats
        })
      }).catch(()=>{})
    } catch(e) {
      console.warn('Failed to submit lead', e)
    }
  }

  const [leadStatus, setLeadStatus] = useState('idle') // idle|sending|sent|error
  const handleSendTelegram = async () => {
    if (!isFormValid) return
    if (leadStatus === 'idle') {
      try {
        setLeadStatus('sending')
        await submitLead()
        setLeadStatus('sent')
      } catch { setLeadStatus('error') }
      setTimeout(()=> setLeadStatus('idle'), 3000)
    }
  }
  const handleSendWhatsApp = async () => {
    if (!isFormValid) return
    if (leadStatus === 'idle') {
      try {
        setLeadStatus('sending')
        await submitLead()
        setLeadStatus('sent')
      } catch { setLeadStatus('error') }
      setTimeout(()=> setLeadStatus('idle'), 3000)
    }
  }

  return (
    <>
      {isOpen && (
        // Убираем блядский blocker - модалка появляется мгновенно
        <ModalOverlay
          variants={overlayVariants}
          initial="visible"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
        <ModalContent
          variants={modalVariants}
          initial="visible"
          animate="visible"
          exit="hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHeader>
            <AnimatePresence>
              {step !== 'main' && !(prefill?.hideBack && step === 'contact') && (
                <motion.div
                  key="back-button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <BackButton 
                    onClick={handleBack}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
                    </svg>
                  </BackButton>
                </motion.div>
              )}
            </AnimatePresence>
            <ModalTitle>
              {isMobile ? (
                // На мобильном просто меняем текст без анимации, чтобы убрать моргание
                <span>
                  {step === 'main' && 'Мне нужно...'}
                  {step === 'subcategory' && 'Доп.опции'}
                  {step === 'contact' && 'Финишная прямая'}
                </span>
              ) : (
                <AnimatePresence mode="wait">
                  {step === 'main' && (
                    <motion.span
                      key="main-title"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      Мне нужно...
                    </motion.span>
                  )}
                  {step === 'subcategory' && (
                    <motion.span
                      key="subcategory-title"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      Доп.опции
                    </motion.span>
                  )}
                  {step === 'contact' && (
                    <motion.span
                      key="contact-title"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      Финишная прямая
                    </motion.span>
                  )}
                </AnimatePresence>
              )}
            </ModalTitle>
            <CloseButton onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </CloseButton>
          </ModalHeader>

          {/* Добавляем анимированные переходы между шагами */}
          <ModalBody>
            {isMobile ? (
              // Мобильная версия без переходных анимаций
              <>
                {step === 'main' && (
                  <div>
                    <OptionsList>
                      {mainCategories.map((category) => (
                        <div key={category.id}>
                          <OptionButton
                            className={selectedCategory === category.id ? 'selected' : ''}
                            onClick={() => handleCategorySelect(category.id)}
                          >
                            <OptionNumber>{category.id.toString().padStart(2, '0')}</OptionNumber>
                            <OptionText>{category.text}</OptionText>
                          </OptionButton>
                        </div>
                      ))}
                    </OptionsList>
                    <ContinueContainer>
                      {renderProgressIndicator()}
                      <ButtonGroup>
                        <ContinueButton
                          disabled={!selectedCategory}
                          onClick={handleContinueToSubcategory}
                        >
                          Продолжить
                        </ContinueButton>
                      </ButtonGroup>
                    </ContinueContainer>
                  </div>
                )}
                {step === 'subcategory' && selectedCategory && (
                  <div>
                    <OptionsList>
                      {subcategories[selectedCategory]?.map((subcategory) => (
                        <div key={subcategory.id}>
                          <OptionButton
                            className={selectedSubcategories.includes(subcategory.id) ? 'selected' : ''}
                            onClick={() => handleSubcategoryToggle(subcategory.id)}
                          >
                            <OptionNumber>{subcategory.id.toString().padStart(2, '0')}</OptionNumber>
                            <OptionText>{subcategory.text}</OptionText>
                          </OptionButton>
                        </div>
                      ))}
                    </OptionsList>
                    <ContinueContainer>
                      {renderProgressIndicator()}
                      <ButtonGroup>
                        <ContinueButton onClick={handleContinueToContact}>
                          Продолжить
                        </ContinueButton>
                      </ButtonGroup>
                    </ContinueContainer>
                  </div>
                )}
                {step === 'contact' && (
                  <div>
                    <FormContainer spacing="contact">
                      <FormGroup>
                        <AnimatedInput
                          label="Имя"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                      </FormGroup>
                      <FormGroup>
                        <AnimatedInput
                          label="Телефон"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </FormGroup>
                      <FormGroup>
                        <AnimatedInput
                          label="Коротко о проекте"
                          multiline={true}
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                      </FormGroup>
                    </FormContainer>
                    <ContactButtonsContainer>
                      <ContactButton
                        disabled={!isFormValid || leadStatus==='sending' || leadStatus==='sent'}
                        onClick={handleSendTelegram}
                      >
                        {leadStatus==='sending' && 'Отправка…'}
                        {leadStatus==='sent' && '✓ Отправлено'}
                        {leadStatus==='error' && 'Ошибка, повторить'}
                        {leadStatus==='idle' && 'Отправить заявку'}
                      </ContactButton>
                    </ContactButtonsContainer>
                    <DesktopContactWrapper>
                      <MobileContactHeader>Отправить в...</MobileContactHeader>
                      <MobileIconGroup>
                        <MobileIconButton data-icon="telegram" onClick={handleSendTelegram} disabled={!isFormValid} aria-label="Telegram" />
                        <MobileIconButton data-icon="whatsapp" onClick={handleSendWhatsApp} disabled={!isFormValid} aria-label="WhatsApp" />
                      </MobileIconGroup>
                    </DesktopContactWrapper>
                    <MobileContactWrapper>
                      <MobileContactHeader>Отправить в...</MobileContactHeader>
                      <MobileIconGroup>
                        <MobileIconButton data-icon="telegram" onClick={handleSendTelegram} disabled={!isFormValid} aria-label="Telegram" />
                        <MobileIconButton data-icon="whatsapp" onClick={handleSendWhatsApp} disabled={!isFormValid} aria-label="WhatsApp" />
                      </MobileIconGroup>
                    </MobileContactWrapper>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                      {renderProgressIndicator()}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <AnimatePresence {...stepsPresenceProps}>
                {/* Desktop / non-mobile animated version (оставляем существующую анимацию) */}
                {step === 'main' && (
                  <motion.div
                    key="main"
                    initial={stepAnim.initial}
                    animate={stepAnim.animate}
                    exit={stepAnim.exit}
                    transition={stepAnim.transition}
                  >
                    <OptionsList>
                      {mainCategories.map((category, index) => (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.4 }}
                        >
                          <OptionButton
                            className={selectedCategory === category.id ? 'selected' : ''}
                            onClick={() => handleCategorySelect(category.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <OptionNumber>{category.id.toString().padStart(2, '0')}</OptionNumber>
                            <OptionText>{category.text}</OptionText>
                          </OptionButton>
                        </motion.div>
                      ))}
                    </OptionsList>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: mainCategories.length * 0.1 + 0.2, duration: 0.4 }}
                    >
                      <ContinueContainer>
                        {renderProgressIndicator()}
                        <ButtonGroup>
                          <ContinueButton
                            disabled={!selectedCategory}
                            onClick={handleContinueToSubcategory}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Продолжить
                          </ContinueButton>
                        </ButtonGroup>
                      </ContinueContainer>
                    </motion.div>
                  </motion.div>
                )}
                {step === 'subcategory' && selectedCategory && (
                  <motion.div
                    key="subcategory"
                    initial={stepAnim.initial}
                    animate={stepAnim.animate}
                    exit={stepAnim.exit}
                    transition={stepAnim.transition}
                  >
                    <OptionsList>
                      {subcategories[selectedCategory]?.map((subcategory, index) => (
                        <motion.div
                          key={subcategory.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08, duration: 0.4 }}
                        >
                          <OptionButton
                            className={selectedSubcategories.includes(subcategory.id) ? 'selected' : ''}
                            onClick={() => handleSubcategoryToggle(subcategory.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <OptionNumber>{subcategory.id.toString().padStart(2, '0')}</OptionNumber>
                            <OptionText>{subcategory.text}</OptionText>
                          </OptionButton>
                        </motion.div>
                      ))}
                    </OptionsList>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (subcategories[selectedCategory]?.length || 0) * 0.08 + 0.2, duration: 0.4 }}
                    >
                      <ContinueContainer>
                        {renderProgressIndicator()}
                        <ButtonGroup>
                          <ContinueButton
                            onClick={handleContinueToContact}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Продолжить
                          </ContinueButton>
                        </ButtonGroup>
                      </ContinueContainer>
                    </motion.div>
                  </motion.div>
                )}
                {step === 'contact' && (
                  <motion.div
                    key="contact"
                    initial={stepAnim.initial}
                    animate={stepAnim.animate}
                    exit={stepAnim.exit}
                    transition={stepAnim.transition}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                    >
                      <FormContainer spacing="contact">
                        <FormGroup>
                          <AnimatedInput
                            label="Имя"
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                          />
                        </FormGroup>
                        <FormGroup>
                          <AnimatedInput
                            label="Телефон"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                          />
                        </FormGroup>
                        <FormGroup>
                          <AnimatedInput
                            label="Коротко о проекте"
                            multiline={true}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                          />
                        </FormGroup>
                      </FormContainer>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <ContactButtonsContainer>
                        <ContactButton
                          disabled={!isFormValid || leadStatus==='sending' || leadStatus==='sent'}
                          onClick={handleSendTelegram}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {leadStatus==='sending' && 'Отправка…'}
                          {leadStatus==='sent' && '✓ Отправлено'}
                          {leadStatus==='error' && 'Ошибка, повторить'}
                          {leadStatus==='idle' && 'Отправить заявку'}
                        </ContactButton>
                      </ContactButtonsContainer>
                      <DesktopContactWrapper>
                        <MobileContactHeader>Отправить в...</MobileContactHeader>
                        <MobileIconGroup>
                          <MobileIconButton
                            data-icon="telegram"
                            onClick={handleSendTelegram}
                            disabled={!isFormValid}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            aria-label="Telegram"
                          />
                          <MobileIconButton
                            data-icon="whatsapp"
                            onClick={handleSendWhatsApp}
                            disabled={!isFormValid}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            aria-label="WhatsApp"
                          />
                        </MobileIconGroup>
                      </DesktopContactWrapper>
                      <MobileContactWrapper>
                        <MobileContactHeader>Отправить в...</MobileContactHeader>
                        <MobileIconGroup>
                          <MobileIconButton
                            data-icon="telegram"
                            onClick={handleSendTelegram}
                            disabled={!isFormValid}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            aria-label="Telegram"
                          />
                          <MobileIconButton
                            data-icon="whatsapp"
                            onClick={handleSendWhatsApp}
                            disabled={!isFormValid}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            aria-label="WhatsApp"
                          />
                        </MobileIconGroup>
                      </MobileContactWrapper>
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                        {renderProgressIndicator()}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
      )}
    </>
  )
}

export default ProjectModal
