import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
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

  @media (max-width: 768px) {
    max-width: 100%;
    height: auto;
    max-height: 80vh;
    border-radius: 12px 12px 0 0;
    width: 100vw;
    display: flex;
    flex-direction: column;
  }
`

const ModalHeader = styled.div`
  padding: 40px 40px 30px;
  position: relative;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 20px 20px 15px;
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
    text-align: center;
    padding-right: 40px;
  }
`

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 25px;
  background: transparent;
  border: none;
  color: #999;
  font-size: 28px;
  cursor: pointer;
  padding: 5px;
  transition: color 0.2s ease;
  line-height: 1;
  z-index: 10;

  &:hover {
    color: #fff;
  }

  @media (max-width: 768px) {
    top: 15px;
    right: 15px;
    font-size: 24px;
    padding: 8px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const BackButton = styled.button`
  position: absolute;
  bottom: 25px;
  left: 40px;
  background: transparent;
  border: none;
  color: #999;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 12px;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 6px;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.05);
  }

  @media (max-width: 768px) {
    position: static;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    margin-bottom: 15px;
    align-self: flex-start;
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
    padding: 0 20px 20px;
    max-height: none;
    overflow-y: auto;
    flex: 1;
    
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
  gap: 20px;
  padding: 20px 0;
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
    padding: 16px 0;
    gap: 15px;
    
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
    gap: 15px;
    align-items: stretch;
    margin-top: 20px;
    padding: 15px 0 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  }
`

const BackButtonInline = styled(motion.button)`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #999;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;

  &:hover {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.05);
  }

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 8px;
    min-width: 56px;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    order: 2;
    
    ${BackButtonInline} {
      flex-shrink: 0;
      width: auto;
    }
    
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
    order: 1;
    margin-bottom: 5px;
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

  @media (max-width: 768px) {
    gap: 20px;
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
    min-height: 120px;
  }
`

const ContactButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 30px;

  @media (max-width: 768px) {
    gap: 10px;
    margin-top: 20px;
    padding-bottom: 20px;
  }
`

const ContactButton = styled(motion.button)`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 14px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 16px 20px;
    border-radius: 12px;
    font-size: 1.05rem;
    
    &:active {
      transform: scale(0.98);
    }
  }
`

// Данные для опций
const mainCategories = [
  { id: 1, text: 'создать telegram/whatsapp бота' },
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
    { id: 5, text: 'Интеграция с Google Sheets' },
    { id: 6, text: 'Вебхуки/API для сторонних сервисов' }
  ],
  2: [ // Сайт/веб-приложение
    { id: 1, text: 'Интернет-магазин с корзиной и оплатой' },
    { id: 2, text: 'Личный кабинет пользователей' },
    { id: 3, text: 'Система авторизации и регистрации' },
    { id: 4, text: 'Интеграция с базой данных' },
    { id: 5, text: 'Адаптивный дизайн для мобильных' },
    { id: 6, text: 'SEO-оптимизация' },
    { id: 7, text: 'Система комментариев/отзывов' },
    { id: 8, text: 'Многоязычность' }
  ],
  3: [ // Обновление дизайна
    { id: 1, text: 'Современный минималистичный дизайн' },
    { id: 2, text: 'Улучшение пользовательского опыта (UX)' },
    { id: 3, text: 'Адаптация под мобильные устройства' },
    { id: 4, text: 'Анимации и интерактивные элементы' },
    { id: 5, text: 'Ребрендинг и новая цветовая схема' },
    { id: 6, text: 'Оптимизация скорости загрузки' }
  ],
  4: [ // Автоматизация
    { id: 1, text: 'Автоматическая отправка email-рассылок' },
    { id: 2, text: 'Интеграция с CRM-системами' },
    { id: 3, text: 'Автоматизация социальных сетей' },
    { id: 4, text: 'Парсинг данных с сайтов' },
    { id: 5, text: 'Автоматические отчёты и аналитика' },
    { id: 6, text: 'Чат-бот для сайта' }
  ],
  5: [ // Что-то ещё
    { id: 1, text: 'Консультация по технологиям' },
    { id: 2, text: 'Аудит существующего проекта' },
    { id: 3, text: 'Техническая поддержка проекта' },
    { id: 4, text: 'Обучение команды' },
    { id: 5, text: 'Интеграция сторонних сервисов' }
  ]
}

const ProjectModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('main') // 'main', 'subcategory', 'contact'
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategories, setSelectedSubcategories] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    description: ''
  })
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)

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
    if (isOpen) {
      // Сброс состояния при открытии модального окна
      setStep('main')
      setSelectedCategory(null)
      setSelectedSubcategories([])
      setFormData({ name: '', phone: '', description: '' })
      
      // Блокируем скролл body
      document.body.style.overflow = 'hidden'
    } else {
      // Восстанавливаем скролл body при закрытии
      document.body.style.overflow = ''
    }
    
    // Cleanup при размонтировании
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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

    let message = `🚀 Новая заявка на проект!\n\n`
    message += `👤 Имя: ${formData.name}\n`
    message += `📞 Телефон: ${formData.phone}\n\n`
    message += `📋 Категория проекта: ${category}\n`
    
    if (selectedSubcats.length > 0) {
      message += `\n✅ Выбранные опции:\n`
      selectedSubcats.forEach((sub, index) => {
        message += `${index + 1}. ${sub}\n`
      })
    }
    
    if (formData.description.trim()) {
      message += `\n💬 Дополнительная информация:\n${formData.description}`
    }

    return encodeURIComponent(message)
  }

  const handleSendEmail = () => {
    const message = generateContactMessage()
    const subject = encodeURIComponent('Заявка на создание проекта')
    window.open(`mailto:loony.boss.work@gmail.com?subject=${subject}&body=${message}`)
  }

  const handleSendTelegram = () => {
    const message = generateContactMessage()
    window.open(`https://t.me/loony_boss?text=${message}`)
  }

  const handleSendWhatsApp = () => {
    const message = generateContactMessage()
    // Замените YOUR_PHONE_NUMBER на ваш номер телефона в международном формате без + (например: 79123456789)
    window.open(`https://wa.me/79123456789?text=${message}`)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <ModalOverlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <ModalContent
          initial={{ 
            scale: window.innerWidth <= 768 ? 1 : 0.8, 
            opacity: 0,
            y: window.innerWidth <= 768 ? 100 : 0
          }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            y: 0
          }}
          exit={{ 
            scale: window.innerWidth <= 768 ? 1 : 0.8, 
            opacity: 0,
            y: window.innerWidth <= 768 ? 100 : 0
          }}
          onClick={(e) => e.stopPropagation()}
          drag="y"
          dragConstraints={{ top: 0, bottom: 300 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(e, { offset, velocity }) => {
            if (offset.y > 100 || velocity.y > 500) {
              onClose()
            }
          }}
        >
          <ModalHeader>
            <SwipeIndicator />
            {step !== 'main' && (
              <BackButton onClick={handleBack}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
                </svg>
              </BackButton>
            )}
            <ModalTitle>
              {step === 'main' && 'Мне нужно...'}
              {step === 'subcategory' && 'Дополнительные опции'}
              {step === 'contact' && 'Свяжитесь со мной'}
            </ModalTitle>
            <CloseButton onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </CloseButton>
          </ModalHeader>

          <ModalBody>
            {step === 'main' && (
              <>
                <OptionsList>
                  {mainCategories.map((category) => (
                    <OptionButton
                      key={category.id}
                      className={selectedCategory === category.id ? 'selected' : ''}
                      onClick={() => handleCategorySelect(category.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <OptionNumber>{category.id.toString().padStart(2, '0')}</OptionNumber>
                      <OptionText>{category.text}</OptionText>
                    </OptionButton>
                  ))}
                </OptionsList>
                <ContinueContainer>
                  {renderProgressIndicator()}
                  <ContinueButton
                    disabled={!selectedCategory}
                    onClick={handleContinueToSubcategory}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Продолжить
                  </ContinueButton>
                </ContinueContainer>
              </>
            )}

            {step === 'subcategory' && selectedCategory && (
              <>
                <OptionsList>
                  {subcategories[selectedCategory]?.map((subcategory) => (
                    <OptionButton
                      key={subcategory.id}
                      className={selectedSubcategories.includes(subcategory.id) ? 'selected' : ''}
                      onClick={() => handleSubcategoryToggle(subcategory.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <OptionNumber>{subcategory.id.toString().padStart(2, '0')}</OptionNumber>
                      <OptionText>{subcategory.text}</OptionText>
                    </OptionButton>
                  ))}
                </OptionsList>
                <ContinueContainer>
                  {renderProgressIndicator()}
                  <ButtonGroup>
                    <BackButtonInline
                      onClick={handleBack}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
                      </svg>
                    </BackButtonInline>
                    <ContinueButton
                      onClick={handleContinueToContact}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Продолжить
                    </ContinueButton>
                  </ButtonGroup>
                </ContinueContainer>
              </>
            )}

            {step === 'contact' && (
              <>
                <ContinueContainer>
                  {renderProgressIndicator()}
                  <BackButtonInline
                    onClick={handleBack}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
                    </svg>
                  </BackButtonInline>
                </ContinueContainer>
                
                <FormContainer>
                  <FormGroup>
                    <Label>Имя *</Label>
                    <Input
                      type="text"
                      placeholder="Ваше имя"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Номер телефона *</Label>
                    <Input
                      type="tel"
                      placeholder="+7 (xxx) xxx-xx-xx"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Дополнительная информация о проекте</Label>
                    <TextArea
                      placeholder="Расскажите подробнее о вашем проекте, сроках, бюджете..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  </FormGroup>

                  <ContactButtonsContainer>
                    <ContactButton
                      disabled={!isFormValid}
                      onClick={handleSendEmail}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      📧 Отправить на почту
                    </ContactButton>
                    
                    <ContactButton
                      disabled={!isFormValid}
                      onClick={handleSendTelegram}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      📱 Отправить в Telegram
                    </ContactButton>
                    
                    <ContactButton
                      disabled={!isFormValid}
                      onClick={handleSendWhatsApp}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      💬 Отправить в WhatsApp
                    </ContactButton>
                  </ContactButtonsContainer>
                </FormContainer>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </AnimatePresence>
  )
}

export default ProjectModal
