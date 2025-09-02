import React, { useState, useRef, Suspense, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { subscriptionFAQ } from './MenuPage'
import CustomCursor from '../components/CustomCursor'
import ErrorBoundary from '../components/ErrorBoundary'
import { useParticles } from '../components/GlobalParticleManager'

// Lazy import ProjectModal
const ProjectModal = React.lazy(() => import('../components/ProjectModal'))

// Container for the full page
const PageContainer = styled.div`
  min-height: 100vh;
  background: transparent;
  color: var(--white);
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

// Title of the page
const PageTitle = styled.h1`
  font-size: 2.6rem;
  font-weight: 400;
  text-align: center;
  margin-bottom: 2rem;
  color: var(--white);
  
  @media (max-width: 768px) {
    font-size: 2.1rem;
    margin-bottom: 1.5rem;
  }
`

// Main content area
const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`

// Back button
const BackButton = styled.button`
  position: fixed;
  top: 24px;
  left: 24px;
  z-index: 100;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: var(--primary-red, #D14836);
  background: transparent;
  border: 2px solid var(--primary-red, #D14836);
  border-radius: 0;
  padding: 0;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.12s ease, box-shadow 0.2s ease;

  &:hover {
    background: var(--primary-red, #D14836);
    color: var(--black);
    transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(0,0,0,0.35);
  }

  @media (max-width: 768px) {
    top: 16px;
    left: 16px;
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
`

// Service info display
const ServiceInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  /* Desktop: ограничиваем ширину чтобы совпадала с колонкой слева (учитываем gap=60px и новые пропорции 1fr:1.4fr) */
  @media (min-width: 1025px) {
    width: calc((100% - 60px) / 2.4);
    max-width: calc((100% - 60px) / 2.4);
    margin-left: 0;
  }
  
  .service-title {
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--white);
    margin: 0 0 0.5rem 0;
  }
  
  .service-category {
    font-size: 0.95rem;
  color: var(--primary-green, #22c55e);
    margin: 0 0 0.5rem 0;
  }
  
  .service-desc {
    font-size: 1.05rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 0.5rem 0;
  }
  
  .service-price {
    font-size: 1.15rem;
    font-weight: 500;
  color: var(--primary-green, #22c55e);
    margin: 0;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
    
    .service-title {
      font-size: 1.15rem;
    }
    
    .service-desc, .service-price {
      font-size: 0.95rem;
    }
  }
`

const SubscriptionSplit = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 60px;
  align-items: start;
  margin-top: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  @media (max-width: 768px) {
    gap: 24px;
  }
`

// Правая колонка (десктоп): поднимаем блок выбора тарифов выше
const RightCol = styled.div`
  @media (min-width: 1025px) {
    margin-top: -210px; /* поднимаем вверх таблицу и подпись шага */
  }
`

const SubscriptionIntro = styled.div`
  h4 {
    font-size: 1.55rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: var(--white);
  }
  
  @media (max-width: 768px) {
    h4 {
      font-size: 1.35rem;
    }
  }
`

const IntroTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
  
  span {
    font-size: 1.5rem;
  }
  
  h4 {
    font-size: 1.55rem;
    font-weight: 600;
    margin: 0;
    color: var(--white);
  }
  
  @media (max-width: 768px) {
    gap: 8px;
    
    span {
      font-size: 1.3rem;
    }
    
    h4 {
      font-size: 1.35rem;
    }
  }
`

const IntroBody = styled.div`
  p {
    font-size: 1.05rem;
    line-height: 1.6;
    margin: 0 0 1rem 0;
    color: rgba(255, 255, 255, 0.9);
  }
  
  @media (max-width: 768px) {
    p {
      font-size: 0.95rem;
    }
  }
`

const FAQAccordionGreen = styled.div`
  margin-top: 2rem;
  
  details {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  summary {
    padding: 1rem 0;
    font-weight: 500;
    color: var(--white);
    cursor: pointer;
    font-size: 1.05rem;
    
    &:hover {
      color: var(--primary-green, #22c55e);
    }
  }
  
  .faq-content {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s ease;
  }
  
  details[open] .faq-content {
    grid-template-rows: 1fr;
  }
  
  .faq-content-inner {
    overflow: hidden;
  }
  
  .faq-answer {
    padding: 0 0 1rem 0;
    color: rgba(255, 255, 255, 0.8);
    text-align: left;
    
    p {
      margin: 0 0 10px 0;
      line-height: 1.6;
    }
  }
`

const FAQToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: transparent;
  border: none;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 24px 0 8px;
  opacity: 0.9;
  color: var(--white);
  cursor: pointer;
  padding: 0.5rem 0;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
  }
  
  .toggle-icon {
    font-size: 14px;
    transition: transform 0.3s ease;
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }
`

const FAQContainer = styled.div`
  overflow: hidden;
  transition: max-height 0.3s ease;
  max-height: ${props => props.$isOpen ? '1000px' : '0px'};
`

const StepNote = styled.div`
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.75rem;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }
`

const BillingToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 1.5rem;
  
  .toggle-wrapper {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 26px;
  }
  
  .toggle-input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    cursor: pointer;
    z-index: 1;
  }
  
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.2);
    transition: 0.3s;
    border-radius: 26px;
    
    &:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
  }
  
  .toggle-input:checked + .toggle-slider {
    background-color: var(--primary-green, #22c55e);
  }
  
  .toggle-input:checked + .toggle-slider:before {
    transform: translateX(24px);
  }
  
  .toggle-label {
    font-size: 0.95rem;
    color: var(--white);
    display: flex;
    align-items: center;
    gap: 6px;
    
    .discount-badge {
  background: var(--primary-green, #22c55e);
      color: var(--black);
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
  }
  
  /* Улучшенная мобильная версткая */
  @media (max-width: 768px) {
    gap: 20px;
    margin-bottom: 2rem;
    padding: 0.5rem 1rem;
    
    .toggle-wrapper {
      width: 60px;
      height: 32px;
      /* Увеличиваем область касания */
      padding: 4px;
      margin: -4px;
    }
    
    .toggle-slider {
      border-radius: 32px;
      
      &:before {
        height: 24px;
        width: 24px;
        left: 4px;
        bottom: 4px;
      }
    }
    
    .toggle-input:checked + .toggle-slider:before {
      transform: translateX(28px);
    }
    
    .toggle-label {
      font-size: 1.1rem;
      font-weight: 500;
      gap: 8px;
      
      .discount-badge {
        padding: 4px 8px;
        border-radius: 16px;
        font-size: 0.8rem;
        font-weight: 700;
        box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
      }
    }
  }
  
  /* Для очень маленьких экранов */
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 16px;
    text-align: center;
    
    .toggle-wrapper {
      order: 2;
      align-self: center;
    }
    
    .toggle-label:first-child {
      order: 1;
    }
    
    .toggle-label:last-child {
      order: 3;
    }
    
    .toggle-label {
      font-size: 1rem;
      justify-content: center;
    }
  }
`

const MobileOnly = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`

const DesktopOnly = styled.div`
  display: block;
  
  @media (max-width: 768px) {
    display: none;
  }
`

// (Desktop) Buttons integrated into table now; old separate plan cards removed.
// If needed later, the removed styled components can be restored from git history.

// New responsive comparison matrix (desktop)
const ComparisonMatrix = styled.div`
  margin-top: 0; /* убран отступ — управляем через RightCol */
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.02);
  overflow: hidden;
  --divider: rgba(255,255,255,0.07);
  --col-feature: 1.35fr;
  --col-plan: 1fr;

  .matrix {
    display: grid;
    grid-template-columns: var(--col-feature) repeat(3, var(--col-plan));
  }
  .cell { padding: 0.9rem 1rem; border-right:1px solid var(--divider); transition: background .2s ease; }
  /* Убираем правую границу у последнего столбца каждой строки */
  .cell:nth-child(4n) { border-right:none; }
  /* Чередующиеся фоны строк для лучшей читаемости */
  .matrix .cell:nth-child(8n+5), .matrix .cell:nth-child(8n+6), .matrix .cell:nth-child(8n+7), .matrix .cell:nth-child(8n+8) { background: rgba(0,0,0,0.15); }
  /* Hover для столбца - управляется через JS класс */
  .matrix.col-1-hover .cell:nth-child(4n-2) { background: rgba(34,197,94, 0.08) !important; }
  .matrix.col-2-hover .cell:nth-child(4n-1) { background: rgba(34,197,94, 0.08) !important; }
  .matrix.col-3-hover .cell:nth-child(4n) { background: rgba(34,197,94, 0.08) !important; }
  /* Убираем внутренние отступы у ячеек с кнопками планов, чтобы кнопки соприкасались без зазоров */
  .row-head.head.plan-col { padding: 0; }
  .head { text-align:center; }
  .plan-btn { cursor:pointer; position:relative; display:flex; flex-direction:row; gap:10px; align-items:center; justify-content:center; width:100%; height:80px; padding:1rem 0.75rem; font-weight:600; font-size:1.05rem; letter-spacing:.01em; background:rgba(255,255,255,0.1); color:var(--white); border:0; transition:background .25s, border-color .25s; }
  .plan-btn .check { width:20px; height:20px; border:2px solid rgba(255,255,255,0.55); display:grid; place-items:center; font-size:12px; line-height:1; font-weight:700; border-radius:3px; background:transparent; transition:background .25s, border-color .25s; }
  .plan-btn .check .tick { opacity:0; transform:scale(.6); transition:opacity .2s, transform .25s; color:var(--primary-green,#22c55e); }
  .plan-btn:hover .check { border-color:var(--primary-green,#22c55e); }
  .plan-btn.selected .check { background:var(--black); border-color:var(--black); }
  .plan-btn.selected .check .tick { opacity:1; transform:scale(1); }
  .plan-btn:hover { background:var(--primary-green, #22c55e); color:var(--black); }
  /* price span удалён — строка 'Цена' теперь ниже */
  .plan-btn:active { transform:none; }
  .plan-btn.selected { background:var(--primary-green, #22c55e); color:var(--black); }
  
  .value .price-val { color: var(--primary-green, #22c55e); font-weight:600; font-size:0.9rem; }
  .feature { font-weight:500; font-size:0.95rem; color:rgba(255,255,255,0.85); line-height:1.35; }
  .value { text-align:center; font-size:0.9rem; font-weight:500; }
  .value .ok { color:#4ade80; font-weight:600; }
  .value .dash { color:rgba(255,255,255,0.35); }
  .value .num { font-weight:700; color:var(--white); }
  .row-buttons .cell { border-bottom:1px solid var(--divider); }
  .plan-col { position:relative; }
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }

  /* Grid row grouping using named lines for clarity */
  .row-head { background:rgba(255,255,255,0.045); }
  /* Делаем первую ячейку "Преимущества" визуально идентичной кнопкам тарифов */
  .cell.row-head.feature { background:rgba(255,255,255,0.1); padding:0; height:80px; display:flex; align-items:center; justify-content:center; font-weight:600; }

  @media (max-width: 1024px) {
    .matrix { font-size:0.95rem; }
    .head { font-size:0.95rem; }
    .select-btn { font-size:0.75rem; padding:0.7rem 1rem; max-width:150px; }
  /* Mobile: возвращаем прежний верхний отступ чтобы визуально отделить */
  margin-top: 1.2rem; /* на планшетах чуть больше отступ */
  }
`

// Mobile components (kept simple for now)
const MobilePlansWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const PlanTabs = styled.div`
  display: flex;
  overflow: hidden;
  margin-bottom: 1rem;
`

const PlanTabButton = styled.button`
  flex: 1;
  padding: 12px 8px;
  background: ${props => props.$active ? 'var(--primary-green, #22c55e)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? 'var(--black)' : 'var(--white)'};
  border: none;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  .sub {
    font-size: 0.75rem;
    opacity: 0.8;
  }
  
  &:hover {
  background: ${props => props.$active ? 'var(--primary-green, #22c55e)' : 'rgba(255, 255, 255, 0.15)'};
  }
`

const PlanCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const PlanHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  .title {
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--white);
  }
  
  .price {
    font-size: 1.15rem;
    font-weight: 500;
  color: var(--primary-green, #22c55e);
  }
`

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`

const FeatureItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
  
  .label {
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.9);
    flex: 1;
  }
  
  .value {
    font-size: 0.95rem;
    font-weight: 500;
    
    .ok {
      color: #4ade80;
    }
    
    .dash {
      color: rgba(255, 255, 255, 0.4);
    }
  }
`

const StickyCTABar = styled.div`
  margin-top: 1.5rem;
  
  .inner {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    .hint {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      text-align: center;
    }
  }
`

const PlanCTA = styled.button`
  width: 100%;
  padding: 1rem 2rem;
  background: ${props => 
    props.$variant === 'white' ? 'rgba(255, 255, 255, 0.1)' :
    props.$variant === 'contrast' ? 'var(--primary-green, #22c55e)' :
    'var(--primary-green, #22c55e)'
  };
  color: ${props => 
    props.$variant === 'white' ? 'var(--white)' :
    props.$variant === 'contrast' ? 'var(--black)' :
    'var(--black)'
  };
  border: ${props => 
    props.$variant === 'white' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'
  };
  border-radius: 0;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }
`

const SubscriptionPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mobilePlan, setMobilePlan] = useState('optimal')
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [prefill, setPrefill] = useState(null)
  const [selectedSubscriptionLabel, setSelectedSubscriptionLabel] = useState('')
  // FAQ открыт по умолчанию на десктопе
  const [isFAQOpen, setIsFAQOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768
    }
    return false
  })
  const [isAnnualBilling, setIsAnnualBilling] = useState(false)
  const [hoveredColumn, setHoveredColumn] = useState(null)

  // Подключаем систему частиц
  const { setParticleProps } = useParticles()

  // Настраиваем зеленые частицы при загрузке компонента
  useEffect(() => {
    // Устанавливаем зеленый цвет частиц и параметры как на /menu
    // Используем цвет как в модальном окне "Услуги" - rgba(34,197,94)
    setParticleProps({
      color: "#298529ff", // Темно-зеленый как при hover карточки "Услуги"
      size: 0.005,
      opacity: 0.7
    })

  // Cleanup: оставляем зелёные частицы (не возвращаем к старому красному бренду)
  return () => {}
  }, [setParticleProps])

  // Get URL parameters
  const serviceId = searchParams.get('service')
  const category = searchParams.get('category') || 'web'
  const tier = searchParams.get('tier') || 'optimal'

  // Service data (copied from MenuPage)
  const servicesData = {
    web: [
      { id: 'basic', title: 'Базовый', desc: 'Лендинг/одностраничник для презентации услуг/продуктов', price: 'от 70 000 ₽' },
      { id: 'optimal', title: 'Стандарт', desc: 'Многостраничный сайт с интеграциями и анимациями', price: 'от 130 000 ₽' },
      { id: 'premium', title: 'Премиум', desc: 'Сложное веб‑приложение с продвинутой логикой', price: 'от 250 000 ₽' },
    ],
    bots: [
      { id: 'bot-basic', title: 'Базовый', desc: 'FAQ/поддержка, сбор заявок, простые сценарии', price: 'от 40 000 ₽' },
      { id: 'bot-optimal', title: 'Стандарт', desc: 'Продажи/записи, оплаты, админ‑панель', price: 'от 90 000 ₽' },
      { id: 'bot-premium', title: 'Премиум', desc: 'Сложная логика, ИИ, интеграции с CRM/API', price: 'от 180 000 ₽' },
    ],
    automation: [
      { id: 'auto-basic', title: 'Базовый', desc: 'Парсинг данных, простая автоматизация', price: 'от 50 000 ₽' },
      { id: 'auto-optimal', title: 'Стандарт', desc: 'Комплексная автоматизация процессов', price: 'от 120 000 ₽' },
      { id: 'auto-premium', title: 'Премиум', desc: 'Корпоративные решения с ИИ', price: 'от 250 000 ₽' },
    ]
  }

  const categoryLabels = {
    web: 'Сайты/веб-приложения',
    bots: 'Боты',
    automation: 'Программы/софт'
  }

  // Mock data for selected service (since we're on a standalone page)
  const mockService = {
    id: 'subscription-page',
    title: 'Подписочное обслуживание'
  }

  const findServiceById = (id) => {
    if (id === 'subscription-page') return mockService
    
    for (const cat of Object.values(servicesData)) {
      const service = cat.find(s => s.id === id)
      if (service) return service
    }
    return mockService
  }

  const categoryLabelByServiceId = (id) => {
    if (id === 'subscription-page') return 'Подписка'
    
    for (const [catKey, services] of Object.entries(servicesData)) {
      if (services.find(s => s.id === id)) {
        return categoryLabels[catKey] || catKey
      }
    }
    return 'Подписка'
  }

  // Get selected service info
  const selectedService = serviceId ? findServiceById(serviceId) : null
  const selectedCategory = categoryLabelByServiceId(serviceId)

  const handleBack = () => {
    navigate('/menu')
  }

  const handleSelectPlan = (plan, label) => {
    setSelectedSubscriptionLabel(label)
    const service = selectedService || findServiceById('subscription-page')
    const cat = selectedCategory || categoryLabelByServiceId('subscription-page')
    const serviceInfo = selectedService && selectedService.id !== 'subscription-page' 
      ? `\nВыбранная услуга: ${service.title} (${service.price})`
      : ''
      
    setPrefill({
      step: 'contact',
      description: `Выбор: ${label}\nКатегория: ${cat}${serviceInfo}`,
      hideBack: true
    })
    setIsProjectModalOpen(true)
  }

  return (
    <PageContainer>
      <CustomCursor />
      
      <BackButton onClick={handleBack} aria-label="Назад">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
        </svg>
      </BackButton>

      <ContentContainer>
        <PageTitle>Подписка</PageTitle>
        
        {selectedService && selectedService.id !== 'subscription-page' && (
          <ServiceInfo>
            <div className="service-category">{selectedCategory}</div>
            <div className="service-title">{selectedService.title}</div>
            <div className="service-desc">{selectedService.desc}</div>
            <div className="service-price">{selectedService.price}</div>
          </ServiceInfo>
        )}
        
        <SubscriptionSplit>
          <div>
            <SubscriptionIntro>
              <IntroTitleRow>
                <span style={{ fontSize: 16 }}>✨</span>
                <h4>Что такое подписка?</h4>
              </IntroTitleRow>
              <IntroBody>
                <p>Подписка — это ваш личный мини-IT-отдел по фиксированной цене в месяц. Вместо поиска фрилансеров или найма команды, все задачи по поддержке и развитию проекта закрываются регулярно, быстро и с приоритетом.</p>
              </IntroBody>
            </SubscriptionIntro>
            
            <FAQToggleButton 
              $isOpen={isFAQOpen}
              onClick={() => setIsFAQOpen(!isFAQOpen)}
            >
              Вопрос‑ответ
              <span className="toggle-icon">▼</span>
            </FAQToggleButton>
            
            <FAQContainer $isOpen={isFAQOpen}>
              <FAQAccordionGreen>
                {subscriptionFAQ.map(item => (
                  <details key={item.question}>
                    <summary>{item.question}</summary>
                    <div className="faq-content">
                      <div className="faq-content-inner">
                        <div className="faq-answer">
                          <p>{item.answer}</p>
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </FAQAccordionGreen>
            </FAQContainer>
          </div>
          
          <RightCol>
            <StepNote>Шаг 2 из 2: Выберите подходящий тариф подписки</StepNote>
            
            <MobileOnly>
              <BillingToggle>
                <span className="toggle-label">Месячная оплата</span>
                <div className="toggle-wrapper">
                  <input
                    type="checkbox"
                    className="toggle-input"
                    checked={isAnnualBilling}
                    onChange={(e) => setIsAnnualBilling(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
                <span className="toggle-label">
                  Годовая оплата
                  <span className="discount-badge">Save 20%</span>
                </span>
              </BillingToggle>
              
              <MobilePlansWrap>
                {(() => {
                  const active = mobilePlan
                  const calculateMobilePrice = (monthlyPrice) => {
                    if (!monthlyPrice) return null
                    const price = parseInt(monthlyPrice.replace(/\D/g, ''))
                    if (isAnnualBilling) {
                      const annualPrice = Math.floor(price * 12 * 0.8)
                      return `${annualPrice.toLocaleString()} ₽/год`
                    }
                    return `${price.toLocaleString()} ₽/мес`
                  }
                  
                  const flat = {
                    none: { 
                      title: 'Без подписки', 
                      price: null, 
                      feats: [
                        ['Развертывание проекта на сервере','✓'],
                        ['Хостинг+SSL','—'],
                        ['Отчёт посещаемости','—'],
                        ['Часы работы','—'],
                        ['Создание резервных копий','—'],
                        ['Обновление зависимостей/библиотек','—'],
                        ['Реакция на инциденты','—'],
                        ['Приоритетная помощь в работе','—'],
                        ['Личные консультации и рекомендации','—']
                      ]
                    },
                    basic: { 
                      title: 'Basic', 
                      price: calculateMobilePrice('30000'), 
                      feats: [
                        ['Развертывание проекта на сервере','✓'],
                        ['Хостинг+SSL','✓'],
                        ['Отчёт посещаемости','✓'],
                        ['Часы работы','10 ч/мес'],
                        ['Создание резервных копий','1×/мес'],
                        ['Обновление зависимостей/библиотек','1×/мес'],
                        ['Реакция на инциденты','2 раб. дня'],
                        ['Приоритетная помощь в работе','—'],
                        ['Личные консультации и рекомендации','—']
                      ]
                    },
                    optimal: { 
                      title: 'Pro', 
                      price: calculateMobilePrice('60000'), 
                      feats: [
                        ['Развертывание проекта на сервере','✓'],
                        ['Хостинг+SSL','✓'],
                        ['Отчёт посещаемости','✓'],
                        ['Часы работы','25 ч/мес'],
                        ['Создание резервных копий','2×/мес'],
                        ['Обновление зависимостей/библиотек','2×/мес'],
                        ['Реакция на инциденты','4 раб. часа'],
                        ['Приоритетная помощь в работе','✓'],
                        ['Личные консультации и рекомендации','✓']
                      ]
                    }
                  }
                  const current = flat[active] || flat.optimal
                  
                  return (
                    <>
                      <PlanTabs>
                        <PlanTabButton 
                          $active={active==='none'} 
                          onClick={() => setMobilePlan('none')}
                        >
                          Без подписки
                        </PlanTabButton>
                        <PlanTabButton 
                          $active={active==='basic'} 
                          onClick={() => setMobilePlan('basic')}
                        >
                          Basic<span className="sub">{calculateMobilePrice('30000') || '30 000 ₽/мес'}</span>
                        </PlanTabButton>
                        <PlanTabButton 
                          $active={active==='optimal'} 
                          onClick={() => setMobilePlan('optimal')}
                        >
                          Pro<span className="sub">{calculateMobilePrice('60000') || '60 000 ₽/мес'}</span>
                        </PlanTabButton>
                      </PlanTabs>
                      
                      <PlanCard>
                        <PlanHeader>
                          <span className="title">{current.title}</span>
                          {current.price && <span className="price">{current.price}</span>}
                        </PlanHeader>
                        <FeatureList>
                          {current.feats.map(([label, val]) => (
                            <FeatureItem key={label}>
                              <span className="label">{label}</span>
                              <span className="value">
                                {val === '✓' ? (
                                  <span className="ok">✓</span>
                                ) : val === '—' ? (
                                  <span className="dash">—</span>
                                ) : val}
                              </span>
                            </FeatureItem>
                          ))}
                        </FeatureList>
                      </PlanCard>
                      
                      <StickyCTABar>
                        <div className="inner">
                          <PlanCTA 
                            $variant={active === 'none' ? 'white' : active === 'optimal' ? 'contrast' : 'default'} 
                            onClick={() => {
                              if (active === 'none') {
                                handleSelectPlan('none', 'Разовый проект')
                              } else if (active === 'basic') {
                                const label = isAnnualBilling ? 'Basic 288 000 ₽/год' : 'Basic 30 000 ₽/мес'
                                handleSelectPlan('basic', label)
                              } else {
                                const label = isAnnualBilling ? 'Pro 576 000 ₽/год' : 'Pro 60 000 ₽/мес'
                                handleSelectPlan('optimal', label)
                              }
                            }}
                          >
                            {active === 'none' ? 'Оставить заявку' : 
                             active === 'basic' ? 'Оформить Basic' : 'Оформить Pro'}
                          </PlanCTA>
                          <div className="hint">Можно отменить в любой момент</div>
                        </div>
                      </StickyCTABar>
                    </>
                  )
                })()}
              </MobilePlansWrap>
            </MobileOnly>
            
            <DesktopOnly>
              <BillingToggle>
                <span className="toggle-label">Месячная оплата</span>
                <div className="toggle-wrapper">
                  <input
                    type="checkbox"
                    className="toggle-input"
                    checked={isAnnualBilling}
                    onChange={(e) => setIsAnnualBilling(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
                <span className="toggle-label">
                  Годовая оплата
                  <span className="discount-badge">Save 20%</span>
                </span>
              </BillingToggle>
              
      <ComparisonMatrix aria-label="Сравнение тарифов подписки">
                {(() => {
                  // Функция для расчета цены с учетом годовой скидки
                  const calculatePrice = (monthlyPrice) => {
                    const price = parseInt(monthlyPrice.replace(/\D/g, ''))
                    if (isAnnualBilling) {
                      const annualPrice = Math.floor(price * 12 * 0.8) // 20% скидка
                      return `${annualPrice.toLocaleString()} ₽/год`
                    }
                    return `${price.toLocaleString()} ₽/мес`
                  }
                  
                  const plans = [
                    { key: 'none', label: 'Без подписки', price: '', btnClass: 'none', selectLabel: 'Разовый проект' },
                    { key: 'basic', label: 'Basic', price: calculatePrice('30000'), btnClass: 'basic', selectLabel: isAnnualBilling ? 'Basic 288 000 ₽/год' : 'Basic 30 000 ₽/мес' },
        { key: 'pro', label: 'Pro', price: calculatePrice('60000'), btnClass: 'pro', selectLabel: isAnnualBilling ? 'Pro 576 000 ₽/год' : 'Pro 60 000 ₽/мес', recommended: true }
                  ]
                  const features = [
                    ['Развертывание проекта на сервере', ['✓','✓','✓']],
                    ['Хостинг+SSL', ['—','✓','✓']],
                    ['Отчёт посещаемости', ['—','✓','✓']],
                    ['Часы работы (улучшения UX/UI, редактирования, изменения и т.д.)', ['—','<span class="num">10</span> ч/мес','<span class="num">25</span> ч/мес']],
                    ['Создание резервных копий', ['—','<span class="num">1</span> раз в месяц','<span class="num">2</span> раза в месяц']],
                    ['Обновление зависимостей/библиотек', ['—','<span class="num">1</span> раз в месяц','<span class="num">2</span> раза в месяц']],
                    ['Реакция на инциденты', ['—','<span class="num">2</span> рабочих дня','<span class="num">4</span> рабочих часа']],
                    ['Приоритетная помощь в работе', ['—','—','✓']],
                    ['Личные консультации и рекомендации', ['—','—','✓']]
                  ]
                  const currentSelected = selectedSubscriptionLabel
                  return (
                    <div className={`matrix ${hoveredColumn ? `col-${hoveredColumn}-hover` : ''}`} role="table">
                      {/* Header row with buttons containing name + price */}
                      <div className="cell row-head feature" role="rowheader">Преимущества</div>
                      {plans.map((p, idx) => {
                        const isSelected = currentSelected && p.selectLabel === currentSelected
                        return (
                          <div 
                            key={p.key} 
                            className={`cell row-head head plan-col`} 
                            role="columnheader"
                            onMouseEnter={() => setHoveredColumn(idx + 1)}
                            onMouseLeave={() => setHoveredColumn(null)}
                          >
                            <button
                              type="button"
                              className={`plan-btn ${p.recommended ? 'recommended' : ''} ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleSelectPlan(p.key === 'pro' ? 'optimal' : p.key, p.selectLabel)}
                              aria-pressed={isSelected}
                              aria-label={`Выбрать тариф ${p.label}`}
                            >
                              <span className="check" aria-hidden="true"><span className="tick">✓</span></span>
                              <span className="name">{p.label}</span>
                              {/* price removed from button; shown in dedicated 'Цена' row */}
                            </button>
                          </div>
                        )
                      })}
                      {/* Цена row */}
                      <div className="cell feature" role="rowheader">Цена</div>
                      {plans.map((p, idx) => (
                        <div 
                          key={'price-'+p.key} 
                          className="cell value" 
                          role="cell"
                          onMouseEnter={() => setHoveredColumn(idx + 1)}
                          onMouseLeave={() => setHoveredColumn(null)}
                        >
                          {p.price ? <span className="price-val">{p.price}</span> : <span className="dash">—</span>}
                        </div>
                      ))}
                      {/* Feature rows */}
                      {features.map(([feat, vals]) => (
                        <React.Fragment key={feat}>
                          <div className="cell feature" role="rowheader">{feat}</div>
                          {vals.map((v, i) => (
                            <div 
                              key={feat + i} 
                              className="cell value" 
                              role="cell"
                              onMouseEnter={() => setHoveredColumn(i + 1)}
                              onMouseLeave={() => setHoveredColumn(null)}
                            >
                              {v === '✓' ? (
                                <span className="ok">✓</span>
                              ) : v === '—' ? (
                                <span className="dash">—</span>
                              ) : (
                                <span dangerouslySetInnerHTML={{ __html: v }} />
                              )}
                            </div>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  )
                })()}
              </ComparisonMatrix>
            </DesktopOnly>
          </RightCol>
        </SubscriptionSplit>
      </ContentContainer>

      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <ProjectModal
            isOpen={isProjectModalOpen}
            prefill={prefill}
            startAnimation={true}
            onClose={() => {
              setIsProjectModalOpen(false)
              setPrefill(null)
            }}
          />
        </Suspense>
      </ErrorBoundary>
    </PageContainer>
  )
}

export default SubscriptionPage
