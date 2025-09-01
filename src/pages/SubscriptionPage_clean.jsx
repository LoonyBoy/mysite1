import React, { useState, useRef, Suspense } from 'react'
import styled from 'styled-components'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { subscriptionFAQ } from './MenuPage'
import CustomCursor from '../components/CustomCursor'
import ErrorBoundary from '../components/ErrorBoundary'

// Lazy import ProjectModal
const ProjectModal = React.lazy(() => import('../components/ProjectModal'))

// Container for the full page
const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--black);
  color: var(--white);
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`

// Title of the page
const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 400;
  text-align: center;
  margin-bottom: 2rem;
  color: var(--white);
  
  @media (max-width: 768px) {
    font-size: 2rem;
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
  
  .service-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--white);
    margin: 0 0 0.5rem 0;
  }
  
  .service-category {
    font-size: 0.9rem;
    color: var(--primary-red);
    margin: 0 0 0.5rem 0;
  }
  
  .service-desc {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 0.5rem 0;
  }
  
  .service-price {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--primary-red);
    margin: 0;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
    
    .service-title {
      font-size: 1.1rem;
    }
    
    .service-desc, .service-price {
      font-size: 0.9rem;
    }
  }
`

const SubscriptionSplit = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
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

const SubscriptionIntro = styled.div`
  h4 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: var(--white);
  }
  
  @media (max-width: 768px) {
    h4 {
      font-size: 1.3rem;
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
    font-size: 1.5rem;
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
      font-size: 1.3rem;
    }
  }
`

const IntroBody = styled.div`
  p {
    font-size: 1rem;
    line-height: 1.6;
    margin: 0 0 1rem 0;
    color: rgba(255, 255, 255, 0.9);
  }
  
  @media (max-width: 768px) {
    p {
      font-size: 0.9rem;
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
    font-size: 1rem;
    
    &:hover {
      color: var(--primary-red);
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

const StepNote = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    margin-bottom: 1rem;
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

const ButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const PlanOptionContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  padding: ${props => props.$featured ? '1.5rem 1rem 1rem' : '1rem'};
  background: ${props => props.$featured ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)'};
  border: ${props => props.$featured ? '2px solid var(--primary-red)' : '1px solid rgba(255, 255, 255, 0.1)'};
  transform: ${props => props.$featured ? 'scale(1.05)' : 'scale(1)'};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$featured ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)'};
  }
  
  @media (max-width: 768px) {
    transform: none;
    padding: 1rem;
  }
`

const RecommendedBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary-red);
  color: var(--black);
  padding: 6px 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const PlanTitle = styled.h3`
  font-size: ${props => props.$featured ? '1.4rem' : '1.2rem'};
  font-weight: 600;
  color: var(--white);
  margin: 0 0 0.25rem 0;
  text-align: center;
`

const PlanPrice = styled.div`
  font-size: ${props => props.$featured ? '1.2rem' : '1rem'};
  color: var(--primary-red);
  font-weight: 500;
  margin-bottom: 1rem;
  text-align: center;
`

const SelectButton = styled.button`
  background: ${props => 
    props.$variant === 'white' ? 'rgba(255, 255, 255, 0.1)' :
    props.$variant === 'contrast' ? 'var(--primary-red)' :
    'var(--primary-red)'
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
  padding: ${props => props.$featured ? '1.2rem 2.5rem' : '1rem 2rem'};
  font-size: ${props => props.$featured ? '1.1rem' : '1rem'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  min-height: ${props => props.$featured ? '60px' : '50px'};
  
  .btn-text {
    font-size: ${props => props.$featured ? '1.1rem' : '1rem'};
    font-weight: 600;
  }
  
  .btn-subtext {
    font-size: 0.8rem;
    opacity: 0.8;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }
  
  @media (max-width: 768px) {
    padding: 1rem 2rem;
    font-size: 1rem;
    min-height: 50px;
    
    .btn-text {
      font-size: 1rem;
    }
  }
`

const ComparisonTable = styled.div`
  .comp-table {
    width: 100%;
    border-collapse: collapse;
    
    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    th {
      font-weight: 600;
      color: var(--white);
    }
    
    .feat {
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .val {
      text-align: center;
      
      .check {
        color: #4ade80;
        font-weight: 600;
      }
      
      .dash {
        color: rgba(255, 255, 255, 0.4);
      }
    }
    
    .header-row th {
      font-size: 1.2rem;
      font-weight: 600;
      text-align: center;
      
      .plan-title {
        display: block;
        margin-top: 0.5rem;
      }
    }
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
  background: ${props => props.$active ? 'var(--primary-red)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? 'var(--black)' : 'var(--white)'};
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  .sub {
    font-size: 0.7rem;
    opacity: 0.8;
  }
  
  &:hover {
    background: ${props => props.$active ? 'var(--primary-red)' : 'rgba(255, 255, 255, 0.15)'};
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
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--white);
  }
  
  .price {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--primary-red);
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
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.9);
    flex: 1;
  }
  
  .value {
    font-size: 0.9rem;
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
    props.$variant === 'contrast' ? 'var(--primary-red)' :
    'var(--primary-red)'
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
  font-size: 1rem;
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
            
            <p style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '24px 0 8px', opacity: 0.9 }}>
              Вопрос‑ответ
            </p>
            
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
          </div>
          
          <div>
            <StepNote>Шаг 2 из 2: Выберите подходящий тариф подписки</StepNote>
            
            <MobileOnly>
              <MobilePlansWrap>
                {(() => {
                  const active = mobilePlan
                  const plans = {
                    none: { title: 'Без подписки', price: null },
                    basic: { title: 'Basic', price: '30 000 ₽/мес' },
                    optimal: { title: 'Pro', price: '60 000 ₽/мес' }
                  }
                  const current = plans[active] || plans.optimal
                  
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
                          Basic<span className="sub">30 000 ₽/мес</span>
                        </PlanTabButton>
                        <PlanTabButton 
                          $active={active==='optimal'} 
                          onClick={() => setMobilePlan('optimal')}
                        >
                          Pro<span className="sub">60 000 ₽/мес</span>
                        </PlanTabButton>
                      </PlanTabs>
                      
                      <PlanCard>
                        <PlanHeader>
                          <span className="title">{current.title}</span>
                          {current.price && <span className="price">{current.price}</span>}
                        </PlanHeader>
                      </PlanCard>
                      
                      <StickyCTABar>
                        <div className="inner">
                          <PlanCTA 
                            $variant={active === 'none' ? 'white' : active === 'optimal' ? 'contrast' : 'default'} 
                            onClick={() => {
                              if (active === 'none') {
                                handleSelectPlan('none', 'Разовый проект')
                              } else if (active === 'basic') {
                                handleSelectPlan('basic', 'Basic 30 000 ₽/мес')
                              } else {
                                handleSelectPlan('optimal', 'Pro 60 000 ₽/мес')
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
              <ButtonsContainer>
                <PlanOptionContainer>
                  <PlanTitle>Без подписки</PlanTitle>
                  <PlanPrice>Разовый проект</PlanPrice>
                  <SelectButton 
                    $variant="white" 
                    onClick={() => handleSelectPlan('none', 'Разовый проект')}
                  >
                    <span className="btn-text">Выбрать</span>
                  </SelectButton>
                </PlanOptionContainer>

                <PlanOptionContainer>
                  <PlanTitle>Basic</PlanTitle>
                  <PlanPrice>30 000 ₽/мес</PlanPrice>
                  <SelectButton 
                    onClick={() => handleSelectPlan('basic', 'Basic 30 000 ₽/мес')}
                  >
                    <span className="btn-text">Выбрать</span>
                  </SelectButton>
                </PlanOptionContainer>

                <PlanOptionContainer $featured>
                  <RecommendedBadge>Рекомендуем</RecommendedBadge>
                  <PlanTitle $featured>Pro</PlanTitle>
                  <PlanPrice $featured>60 000 ₽/мес</PlanPrice>
                  <SelectButton 
                    $variant="contrast" 
                    $featured
                    onClick={() => handleSelectPlan('optimal', 'Pro 60 000 ₽/мес')}
                  >
                    <span className="btn-text">Выбрать</span>
                  </SelectButton>
                </PlanOptionContainer>
              </ButtonsContainer>

              <ComparisonTable>
                <table className="comp-table">
                  <thead>
                    <tr className="header-row">
                      <th className="feat">Преимущества</th>
                      <th><span className="plan-title">Без подписки</span></th>
                      <th><span className="plan-title">Basic</span></th>
                      <th><span className="plan-title">Pro</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Развертывание проекта на сервере', ['✓', '✓', '✓']],
                      ['Хостинг+SSL', ['—', '✓', '✓']],
                      ['Отчёт посещаемости', ['—', '✓', '✓']],
                      ['Часы работы (улучшения UX/UI, редактирования, изменения и т.д.)', ['—', '10', '25']],
                      ['Создание резервных копий', ['—', '1 раз в месяц', '2 раза в месяц']],
                      ['Обновление зависимостей/библиотек', ['—', 'Раз в месяц', 'Два раза в месяц']],
                      ['Реакция на инциденты', ['—', '2 рабочих дня', '4 рабочих часа']],
                      ['Приоритетная помощь в работе', ['—', '—', '✓']],
                      ['Личные консультации и рекомендации', ['—', '—', '✓']]
                    ].map(([feat, vals]) => (
                      <tr key={feat}>
                        <td className="feat">{feat}</td>
                        {vals.map((v, i) => (
                          <td key={i} className="val">
                            <span className={v === '✓' ? 'check' : (v === '—' ? 'dash' : 'check')}>
                              {v}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ComparisonTable>
            </DesktopOnly>
          </div>
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
