# Design Document

## Overview

Данный документ описывает архитектурное решение для улучшения мобильного дизайна и анимаций страницы меню (/menu). Основная цель - создать более точные, плавные и приятные анимации, особенно для мобильных устройств, с улучшенным управлением hover-эффектами и интеграцией с системой частиц.

## Architecture

### Компонентная архитектура

```
MenuPage
├── GlobalParticleManager (контекст частиц)
├── CustomCursor (десктоп курсор)
├── MobileNavigation (мобильная навигация)
├── Card Components (блоки меню)
│   ├── CardContent (контент карточки)
│   ├── FrameOverlay (мобильная рамка)
│   └── GlobalDither (фоновый эффект)
└── Modal Components (модальные окна)
    ├── AboutModalContent
    ├── ProjectsModalWrap
    └── ServicesModalWrap
```

### Система анимаций

1. **GSAP Timeline Manager** - централизованное управление анимациями
2. **Touch/Hover Detection** - определение типа устройства и взаимодействия
3. **Particle Color Controller** - управление цветом частиц в зависимости от hover-состояния
4. **Performance Monitor** - мониторинг производительности и адаптация анимаций

## Components and Interfaces

### 1. Enhanced Animation Manager

```javascript
class AnimationManager {
  constructor() {
    this.timelines = new Map()
    this.isTouch = this.detectTouchDevice()
    this.performanceLevel = this.detectPerformance()
  }

  // Создание timeline для конкретной карточки
  createCardTimeline(cardIndex, cardElement) {
    const tl = gsap.timeline({ paused: true })
    
    // Анимация расширения до полного экрана
    tl.to(cardElement, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 1000,
      duration: 0.6,
      ease: 'power2.inOut'
    })
    
    this.timelines.set(cardIndex, tl)
    return tl
  }

  // Управление hover-эффектами
  handleCardHover(cardIndex, isHovering) {
    if (this.isTouch) {
      return this.handleTouchInteraction(cardIndex, isHovering)
    }
    return this.handleMouseHover(cardIndex, isHovering)
  }
}
```

### 2. Particle Color Controller

```javascript
class ParticleColorController {
  constructor(particleManager) {
    this.particleManager = particleManager
    this.activeCards = new Set()
    this.colorTransitions = new Map()
  }

  // Изменение цвета частиц для конкретной области
  setParticleColorForCard(cardIndex, color, bounds) {
    const transitionId = `card-${cardIndex}`
    
    // Отменяем предыдущую анимацию если есть
    if (this.colorTransitions.has(transitionId)) {
      this.colorTransitions.get(transitionId).kill()
    }

    // Создаем новую анимацию перехода цвета
    const transition = gsap.to(this.particleManager, {
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.particleManager.setParticleProps({
          color: color,
          bounds: bounds
        })
      }
    })

    this.colorTransitions.set(transitionId, transition)
    this.activeCards.add(cardIndex)
  }

  // Восстановление исходного цвета
  restoreParticleColor(cardIndex) {
    const transitionId = `card-${cardIndex}`
    
    if (this.colorTransitions.has(transitionId)) {
      this.colorTransitions.get(transitionId).kill()
    }

    const transition = gsap.to(this.particleManager, {
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => {
        this.particleManager.setParticleProps({
          color: '#D14836', // исходный цвет
          bounds: null
        })
      }
    })

    this.colorTransitions.set(transitionId, transition)
    this.activeCards.delete(cardIndex)
  }
}
```

### 3. Touch/Mouse Interaction Handler

```javascript
class InteractionHandler {
  constructor(animationManager, particleController) {
    this.animationManager = animationManager
    this.particleController = particleController
    this.isTouch = this.detectTouchDevice()
    this.activeInteractions = new Map()
  }

  // Универсальный обработчик взаимодействия
  handleInteraction(cardElement, cardIndex, type) {
    switch (type) {
      case 'enter':
        return this.handleEnter(cardElement, cardIndex)
      case 'leave':
        return this.handleLeave(cardElement, cardIndex)
      case 'tap':
        return this.handleTap(cardElement, cardIndex)
    }
  }

  handleEnter(cardElement, cardIndex) {
    // Останавливаем анимации других карточек
    this.stopOtherCardAnimations(cardIndex)
    
    // Запускаем анимацию расширения
    const timeline = this.animationManager.createCardTimeline(cardIndex, cardElement)
    timeline.play()
    
    // Изменяем цвет частиц
    const bounds = cardElement.getBoundingClientRect()
    this.particleController.setParticleColorForCard(cardIndex, '#000000', bounds)
    
    this.activeInteractions.set(cardIndex, { type: 'hover', timestamp: Date.now() })
  }

  handleLeave(cardElement, cardIndex) {
    // Проверяем, не заблокировано ли взаимодействие
    const interaction = this.activeInteractions.get(cardIndex)
    if (interaction && Date.now() - interaction.timestamp < 300) {
      return // Игнорируем быстрые leave события
    }
    
    // Останавливаем анимацию расширения
    const timeline = this.animationManager.timelines.get(cardIndex)
    if (timeline) {
      timeline.reverse()
    }
    
    // Восстанавливаем цвет частиц
    this.particleController.restoreParticleColor(cardIndex)
    
    this.activeInteractions.delete(cardIndex)
  }

  stopOtherCardAnimations(excludeIndex) {
    this.animationManager.timelines.forEach((timeline, index) => {
      if (index !== excludeIndex) {
        timeline.reverse()
      }
    })
  }
}
```

### 4. Performance Monitor

```javascript
class PerformanceMonitor {
  constructor() {
    this.fps = 60
    this.frameCount = 0
    this.lastTime = performance.now()
    this.performanceLevel = 'high'
  }

  startMonitoring() {
    const monitor = () => {
      this.frameCount++
      const currentTime = performance.now()
      
      if (currentTime - this.lastTime >= 1000) {
        this.fps = this.frameCount
        this.frameCount = 0
        this.lastTime = currentTime
        
        this.adjustPerformance()
      }
      
      requestAnimationFrame(monitor)
    }
    
    requestAnimationFrame(monitor)
  }

  adjustPerformance() {
    if (this.fps < 30) {
      this.performanceLevel = 'low'
      this.reduceAnimationComplexity()
    } else if (this.fps < 45) {
      this.performanceLevel = 'medium'
      this.moderateAnimationComplexity()
    } else {
      this.performanceLevel = 'high'
      this.enableFullAnimations()
    }
  }

  reduceAnimationComplexity() {
    // Отключаем сложные эффекты
    gsap.globalTimeline.timeScale(0.5) // Замедляем анимации
    // Уменьшаем количество частиц
    // Упрощаем blur эффекты
  }
}
```

## Data Models

### Animation State Model

```javascript
const AnimationState = {
  cardStates: {
    [cardIndex]: {
      isHovered: boolean,
      isExpanded: boolean,
      timeline: GSAPTimeline,
      particleColor: string,
      lastInteraction: timestamp
    }
  },
  globalState: {
    activeCard: number | null,
    isModalOpen: boolean,
    performanceLevel: 'low' | 'medium' | 'high',
    isTouch: boolean
  },
  particleState: {
    currentColor: string,
    targetColor: string,
    isTransitioning: boolean,
    activeBounds: DOMRect | null
  }
}
```

### Touch Interaction Model

```javascript
const TouchInteraction = {
  type: 'tap' | 'hold' | 'swipe',
  startTime: timestamp,
  endTime: timestamp,
  startPosition: { x: number, y: number },
  endPosition: { x: number, y: number },
  duration: number,
  velocity: { x: number, y: number },
  target: HTMLElement
}
```

## Error Handling

### Animation Error Recovery

```javascript
class AnimationErrorHandler {
  static handleTimelineError(error, cardIndex) {
    console.warn(`Animation error for card ${cardIndex}:`, error)
    
    // Сброс состояния карточки
    const cardElement = document.querySelector(`[data-card-index="${cardIndex}"]`)
    if (cardElement) {
      gsap.set(cardElement, { clearProps: 'all' })
    }
    
    // Восстановление частиц
    particleController.restoreParticleColor(cardIndex)
  }

  static handleParticleError(error) {
    console.warn('Particle system error:', error)
    
    // Fallback к базовому состоянию
    gsap.set('.particles', { opacity: 0.5 })
  }
}
```

### Performance Fallbacks

```javascript
const PerformanceFallbacks = {
  lowPerformance: {
    disableParticleColorChange: true,
    reduceAnimationDuration: 0.3,
    disableBlurEffects: true,
    simplifyEasing: 'linear'
  },
  
  mediumPerformance: {
    reduceAnimationDuration: 0.5,
    limitParticleCount: 50,
    simplifyEasing: 'power1.inOut'
  },
  
  highPerformance: {
    enableAllEffects: true,
    fullAnimationDuration: 0.8,
    complexEasing: 'power2.inOut'
  }
}
```

## Testing Strategy

### Unit Tests

1. **Animation Manager Tests**
   - Тестирование создания и управления timeline
   - Проверка корректности анимаций расширения
   - Тестирование обработки ошибок

2. **Particle Controller Tests**
   - Тестирование изменения цвета частиц
   - Проверка восстановления исходного состояния
   - Тестирование множественных активных областей

3. **Interaction Handler Tests**
   - Тестирование определения типа устройства
   - Проверка обработки touch/mouse событий
   - Тестирование блокировки быстрых событий

### Integration Tests

1. **Card Hover Flow**
   - Полный цикл hover → expand → particle color change
   - Тестирование на разных устройствах
   - Проверка производительности

2. **Modal Animation Flow**
   - Открытие/закрытие модальных окон
   - Синхронизация с анимациями карточек
   - Тестирование на мобильных устройствах

### Performance Tests

1. **FPS Monitoring**
   - Измерение производительности анимаций
   - Тестирование на слабых устройствах
   - Проверка адаптивного снижения качества

2. **Memory Usage**
   - Мониторинг утечек памяти в GSAP timeline
   - Проверка очистки event listeners
   - Тестирование длительного использования

### Accessibility Tests

1. **Motion Sensitivity**
   - Поддержка `prefers-reduced-motion`
   - Альтернативные анимации для чувствительных пользователей
   - Опция полного отключения анимаций

2. **Touch Accessibility**
   - Минимальные размеры touch targets (44px)
   - Поддержка assistive technologies
   - Keyboard navigation fallbacks

## Implementation Notes

### GSAP Configuration

```javascript
// Оптимизация GSAP для мобильных устройств
gsap.config({
  force3D: true,
  nullTargetWarn: false
})

// Регистрация плагинов
gsap.registerPlugin(ScrollTrigger, Flip)

// Настройка производительности
if (isMobileDevice()) {
  gsap.config({
    autoSleep: 60,
    lag: 0.1
  })
}
```

### CSS Optimizations

```css
/* Оптимизация для анимаций */
.card {
  will-change: transform, opacity;
  transform: translateZ(0); /* Принудительное GPU ускорение */
  backface-visibility: hidden;
}

/* Мобильные оптимизации */
@media (max-width: 768px) {
  .card {
    transform: translate3d(0, 0, 0);
  }
  
  /* Упрощенные анимации для слабых устройств */
  @media (prefers-reduced-motion: reduce) {
    .card {
      transition: none !important;
      animation: none !important;
    }
  }
}
```

### Memory Management

```javascript
// Очистка ресурсов при размонтировании
useEffect(() => {
  return () => {
    // Очищаем все GSAP timeline
    animationManager.timelines.forEach(timeline => {
      timeline.kill()
    })
    
    // Очищаем particle transitions
    particleController.colorTransitions.forEach(transition => {
      transition.kill()
    })
    
    // Удаляем event listeners
    interactionHandler.cleanup()
  }
}, [])