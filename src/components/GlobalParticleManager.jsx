import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import UniversalParticles from './UniversalParticles'
import { gsap } from 'gsap'
import logger from '../utils/Logger'

const ParticleContext = createContext()

export const useParticles = () => {
  const context = useContext(ParticleContext)
  if (!context) {
    throw new Error('useParticles must be used within a ParticleProvider')
  }
  return context
}

export const ParticleProvider = ({ children }) => {
  const location = useLocation()
  
  // Определяем начальную страницу на основе текущего маршрута
  const getInitialPage = () => {
    return location.pathname === '/home' ? 'home' : 'start'
  }
  
  const [currentPage, setCurrentPage] = useState(getInitialPage())
  const [camera, setCamera] = useState(null)
  const [particlesVisible, setParticlesVisible] = useState(false) // Состояние видимости частиц
  const [hoveredRect, setHoveredRect] = useState(null) // Состояние для области hover
  
  // Устанавливаем начальные свойства частиц в зависимости от страницы
  const getInitialParticleProps = () => {
  // Treat /home and /menu the same for initial particle scale (mobile/home parity)
  if (location.pathname === '/home' || location.pathname === '/menu') {
      return {
        color: "#D14836",
        size: 0.005,
        opacity: 0.7
      }
    }
    return {
      color: "#FF5544",
      size: 0.025,
      opacity: 0.9
    }
  }
  
  const [particleProps, setParticleProps] = useState(getInitialParticleProps())
  const [particleAnimation, setParticleAnimation] = useState({
    rotationSpeed: { x: 1, y: 1 },
    fastRotation: false
  })
  const [isPageVisible, setIsPageVisible] = useState(true)
  const [savedSpeed, setSavedSpeed] = useState({ x: 1, y: 1 })
  const [transitionContext, setTransitionContext] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false) // Флаг для блокировки восстановления во время анимации
  const particleAnimationRef = useRef(particleAnimation) // Ref для актуальной скорости
  const colorAnimationRef = useRef(null) // Ref для отслеживания активной анимации цвета
  const hasAnimatedLightLabEntry = useRef(false) // Флаг для предотвращения повторной анимации LightLab

  // Обновляем ref при изменении particleAnimation
  useEffect(() => {
    particleAnimationRef.current = particleAnimation
  }, [particleAnimation])

  // Отслеживаем изменения маршрута
  useEffect(() => {
    const path = location.pathname
    
    logger.navigation('Route change detected', { 
      from: currentPage, 
      to: path,
      hasCamera: !!camera 
    })
    
    // СПЕЦИАЛЬНАЯ ОБРАБОТКА ВЫХОДА ИЗ LIGHTLAB
    if (path === '/menu' && currentPage === 'lightlab-case' && !isAnimating) {
      console.log('🚨 DIRECT lightlab->menu transition detected!')
      logger.particles('DIRECT lightlab->menu transition', { path, currentPage })
      setIsAnimating(true)
      setCurrentPage('projects')
      setParticlesVisible(true)
      setTimeout(() => {
        console.log('🔄 Executing lightlab exit animation')
        animateParticlesLightLabExit()
        setTimeout(() => {
          setIsAnimating(false)
          console.log('🔓 Animation finished, isAnimating set to false')
        }, 2000) // Увеличиваем время разблокировки
      }, 100)
      return // Выходим, чтобы не выполнять остальную логику
    }
    
    if (path === '/' && currentPage === 'home') {
      // Возвращаемся на стартовую страницу - анимируем приближение
      if (camera) {
        animateToStart()
      }
    } else if (path === '/' && currentPage !== 'start') {
      // Устанавливаем стартовую страницу без анимации (первая загрузка)
      setCurrentPage('start')
      setParticlesVisible(false) // Скрываем частицы до инициализации камеры
    } else if (path === '/home' && currentPage === 'start') {
      // Переход на домашнюю страницу со стартовой - анимируем удаление
      if (camera) {
        animateToHome()
      }
    } else if (path === '/home' && (currentPage === 'projects' || currentPage === 'menu') && !isAnimating) {
      // Возвращение с проектов на домашнюю - контекстная анимация
      logger.particles('Contextual transition: projects->home', { context: transitionContext })
      setCurrentPage('home')
      setParticlesVisible(true)
      animateParticlesHomeReturn()
      return
    } else if (path === '/home' && currentPage !== 'home' && !isAnimating) {
      // Устанавливаем домашнюю страницу без анимации (первая загрузка или прямой переход)
      setCurrentPage('home')
      setParticlesVisible(true) // На домашней странице частицы видны сразу
    } else if (path === '/menu' && currentPage === 'home' && !isAnimating) {
      // Переход на меню с домашней — без анимации вращения
      logger.particles('Transition: home->menu (no rotation animation)', { context: transitionContext, particlesVisible })
      setCurrentPage('menu')
      setParticlesVisible(true)
      console.log('🎨 Setting particles visible for home->menu transition')
      // Фиксируем базовую скорость без ускорения/замедления
      setParticleAnimation({ rotationSpeed: { x: 1.0, y: 1.0 }, fastRotation: false })
      // Цвет частиц оставляем как есть, чтобы не было анимации перехода
      return
    } else if (path === '/menu' && currentPage !== 'menu' && !isAnimating) {
      // Устанавливаем страницу меню без анимации (прямой переход)
      logger.particles('Direct transition to menu', { from: currentPage, to: 'menu', particlesVisible })
      setCurrentPage('menu')
      setParticlesVisible(true)
      console.log('🎨 Setting particles visible for menu page')
      return
    } else if (path === '/game' && currentPage === 'home' && !isAnimating) {
      // Переход в игру с домашней - специальная анимация
      logger.particles('Contextual transition: home->game', { context: transitionContext })
      setCurrentPage('game')
      setParticlesVisible(true)
      animateParticlesGameEntry()
      return
    } else if (path === '/game' && currentPage !== 'game' && !isAnimating) {
      // Устанавливаем игровую страницу без анимации (прямой переход)
      setCurrentPage('game')
      setParticlesVisible(true)
      return
    } else if (path === '/home' && currentPage === 'game' && !isAnimating) {
      // Выход из игры на домашнюю - возвращение к нормальной скорости
      logger.particles('Contextual transition: game->home', { context: transitionContext })
      console.log('🎮➡️🏠 Detected game exit, starting particles restoration animation')
      setCurrentPage('home')
      setParticlesVisible(true)
      
      // Принудительно запускаем анимацию выхода из игры
      setTimeout(() => {
        animateParticlesGameExit()
      }, 100)
      return
  } else if ((path === '/project/lightlab' || path === '/project/voytenko') && !isAnimating) {
      // Переход на страницу кейса LightLab - белый фон с черными частицами
      logger.particles('Contextual transition: projects->lightlab-case', { context: transitionContext })
  console.log('📸 Detected case page entry, switching to white background with black particles')
  setCurrentPage('lightlab-case')
      setParticlesVisible(true)
      animateParticlesLightLabEntry()
      return
    } else if (path === '/menu' && currentPage !== 'menu' && currentPage !== 'lightlab-case' && !isAnimating) {
      // Переход на menu с любой другой страницы
      logger.particles('Generic transition to menu', { from: currentPage, to: 'menu' })
      setCurrentPage('menu')
      setParticlesVisible(true)
      // Если пришли не с lightlab, то просто показываем обычные частицы
      if (currentPage !== 'lightlab-case') {
        setParticleProps(prev => ({
          ...prev,
          color: '#D14836',
          size: 0.005,
          opacity: 0.7
        }))
        setParticleAnimation(prev => ({
          ...prev,
          rotationSpeed: { x: 1.0, y: 1.0 },
          fastRotation: false
        }))
      }
    }
  }, [location.pathname, camera, currentPage, transitionContext])

  // Отслеживаем видимость страницы
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Страница скрыта - сохраняем текущую скорость и останавливаем частицы
        const currentSpeed = particleAnimation.rotationSpeed
        logger.particles('Page hidden - pausing animations', { 
          currentSpeed, 
          currentPage 
        })
        
        // Сохраняем текущую скорость только если она не нулевая
        if (currentSpeed.x !== 0 || currentSpeed.y !== 0) {
          setSavedSpeed(currentSpeed)
        }
        
        setParticleAnimation(prev => ({
          ...prev,
          rotationSpeed: { x: 0, y: 0 }
        }))
        setIsPageVisible(false)
      } else {
        // Страница видима - восстанавливаем скорость частиц
        logger.particles('Page visible - restoring animations', { 
          savedSpeed, 
          currentPage 
        })
        
        // Определяем правильную скорость для текущей страницы
        let speedToRestore = savedSpeed
        
        // Если сохраненная скорость нулевая, используем дефолт для страницы
        if (savedSpeed.x === 0 && savedSpeed.y === 0) {
          speedToRestore = currentPage === 'lightlab-case' 
            ? { x: 0.4, y: 0.4 }
            : { x: 1.0, y: 1.0 }
          
          logger.particles('Using default speed for page', { speedToRestore, currentPage })
          setSavedSpeed(speedToRestore) // Обновляем сохраненную скорость
        }
        
        setParticleAnimation(prev => ({
          ...prev,
          rotationSpeed: speedToRestore
        }))
        setIsPageVisible(true)
      }
    }

    // Добавляем слушатель события
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Также отслеживаем focus/blur окна для дополнительной надежности
    const handleFocus = () => {
      if (!document.hidden && !isAnimating) {
        logger.particles('Window focused - restoring animations', { 
          savedSpeed, 
          currentPage,
          particleAnimationSpeed: particleAnimation.rotationSpeed,
          isAnimating
        })
        
        // Определяем правильную скорость для текущей страницы
        let speedToRestore = savedSpeed
        
        // Если сохраненная скорость нулевая, используем дефолт для страницы
        if (savedSpeed.x === 0 && savedSpeed.y === 0) {
          speedToRestore = currentPage === 'lightlab-case' 
            ? { x: 0.4, y: 0.4 }
            : { x: 1.0, y: 1.0 }
          
          logger.particles('Using default speed for page', { speedToRestore, currentPage })
          setSavedSpeed(speedToRestore) // Обновляем сохраненную скорость
        }
        
        setParticleAnimation(prev => ({
          ...prev,
          rotationSpeed: speedToRestore
        }))
        setIsPageVisible(true)
      } else if (isAnimating) {
        logger.particles('Window focused but animation in progress - skipping restoration', { isAnimating })
      }
    }

    const handleBlur = () => {
      if (!isAnimating) {
        const currentSpeed = particleAnimationRef.current.rotationSpeed
        logger.particles('Window blurred - pausing animations', { 
          currentSpeed, 
          currentPage,
          isAnimating
        })
        
        // Сохраняем текущую скорость только если она не нулевая
        if (currentSpeed.x !== 0 || currentSpeed.y !== 0) {
          setSavedSpeed(currentSpeed)
        }
        
        setParticleAnimation(prev => ({
          ...prev,
          rotationSpeed: { x: 0, y: 0 }
        }))
        setIsPageVisible(false)
      } else {
        logger.particles('Window blurred but animation in progress - skipping pause', { isAnimating })
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    // Очистка слушателей
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [savedSpeed, currentPage, isAnimating])

  const animateToHome = () => {
    if (camera) {
      // Анимируем камеру и свойства частиц одновременно
      const startPos = { 
        z: camera.position.z, 
        fov: camera.fov,
        size: particleProps.size,
        opacity: particleProps.opacity
      }
      const endPos = { 
        z: 1, 
        fov: 75,
        size: 0.005,
        opacity: 0.7
      }

      // GSAP анимация камеры и частиц
      gsap.to(startPos, {
        z: endPos.z,
        fov: endPos.fov,
        size: endPos.size,
        opacity: endPos.opacity,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => {
          camera.position.z = startPos.z
          camera.fov = startPos.fov
          camera.updateProjectionMatrix()
          
          // Обновляем свойства частиц
          setParticleProps({
            color: "#D14836", // Меняем цвет в процессе
            size: startPos.size,
            opacity: startPos.opacity
          })
        },
        onComplete: () => {
          setCurrentPage('home')
          setParticlesVisible(true) // Убеждаемся что частицы видны
        }
      })
    }
  }

  const animateToStart = () => {
    if (camera) {
      const startPos = { 
        z: camera.position.z, 
        fov: camera.fov,
        size: particleProps.size,
        opacity: particleProps.opacity
      }
      const endPos = { 
        z: 0.2, 
        fov: 90,
        size: 0.025,
        opacity: 0.9
      }

      gsap.to(startPos, {
        z: endPos.z,
        fov: endPos.fov,
        size: endPos.size,
        opacity: endPos.opacity,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => {
          camera.position.z = startPos.z
          camera.fov = startPos.fov
          camera.updateProjectionMatrix()
          
          // Обновляем свойства частиц
          setParticleProps({
            color: "#FF5544", // Меняем цвет обратно
            size: startPos.size,
            opacity: startPos.opacity
          })
        },
        onComplete: () => {
          setCurrentPage('start')
          setParticlesVisible(true) // Убеждаемся что частицы видны
        }
      })
    }
  }

  const handleCameraReady = ({ camera: cameraObj }) => {
    setCamera(cameraObj)
    
    // Запускаем анимацию появления частиц только на стартовой странице
    if (currentPage === 'start') {
      startParticleAppearAnimation()
    } else {
      // На других страницах частицы видны сразу
      setParticlesVisible(true)
    }
  }
  
  // Анимация появления частиц на стартовой странице
  const startParticleAppearAnimation = () => {
    // Небольшая задержка перед началом анимации
    setTimeout(() => {
      setParticlesVisible(true)
    }, 200) // 200мс задержка для инициализации
  }

  // Контекстные анимации частиц
  const animateParticlesMenuEntry = () => {
    if (!camera) return
    
    logger.particles('Starting menu entry animation', { 
      direction: 'left',
      effect: 'gradual acceleration then deceleration',
      initialSpeed: { x: 1.0, y: 1.0 },
      peakSpeed: { x: 1.8, y: 1.3 },
      finalSpeed: { x: 1.0, y: 1.0 }
    })
    
    // Начинаем с базовой скорости
    setParticleAnimation({
      rotationSpeed: { x: 1.0, y: 1.0 },
      fastRotation: false
    })
    
    // Плавный переход цвета: красный → синий
    animateParticleColor('#D14836', '#2196F3', 1500)
    
    // Фаза 1: Медленное ускорение (600мс)
    const accelerationInterval = setInterval(() => {
      setParticleAnimation(prev => {
        const newSpeedX = Math.min(prev.rotationSpeed.x * 1.08, 1.8) // Медленное ускорение до пика
        const newSpeedY = Math.min(prev.rotationSpeed.y * 1.06, 1.3)
        
        if (newSpeedX >= 1.75 && newSpeedY >= 1.25) {
          clearInterval(accelerationInterval)
          logger.particles('Acceleration phase completed, starting deceleration')
          
          // Фаза 2: Плавное замедление до базового уровня (начинается через 400мс)
          setTimeout(() => {
            const decelerationInterval = setInterval(() => {
              setParticleAnimation(prev => {
                const newSpeedX = Math.max(prev.rotationSpeed.x * 0.96, 1.0)
                const newSpeedY = Math.max(prev.rotationSpeed.y * 0.97, 1.0)
                
                if (newSpeedX <= 1.05 && newSpeedY <= 1.05) {
                  clearInterval(decelerationInterval)
                  logger.particles('Menu entry animation completed')
                  return {
                    rotationSpeed: { x: 1.0, y: 1.0 }, // Возвращаемся к базовой скорости
                    fastRotation: false
                  }
                }
                
                return {
                  rotationSpeed: { x: newSpeedX, y: newSpeedY },
                  fastRotation: newSpeedX > 1.2
                }
              })
            }, 150) // Интервалы замедления
          }, 400) // Пауза на пиковой скорости
          
          return {
            rotationSpeed: { x: newSpeedX, y: newSpeedY },
            fastRotation: true
          }
        }
        
        return {
          rotationSpeed: { x: newSpeedX, y: newSpeedY },
          fastRotation: newSpeedX > 1.2
        }
      })
    }, 120) // Интервалы ускорения
  }

  const animateParticlesHomeReturn = () => {
    if (!camera) return
    
    logger.particles('Starting home return animation', { 
      direction: 'right',
      effect: 'gradual acceleration then deceleration',
      initialSpeed: { x: 1.0, y: 1.0 },
      peakSpeed: { x: -1.7, y: 1.2 },
      finalSpeed: { x: 1.0, y: 1.0 }
    })
    
    // Начинаем с базовой скорости
    setParticleAnimation({
      rotationSpeed: { x: 1.0, y: 1.0 },
      fastRotation: false
    })
    
    // Плавный переход цвета: текущий → красный
    animateParticleColor(particleProps.color || '#2196F3', '#D14836', 1600)
    
    // Фаза 1: Медленное ускорение в обратном направлении
    const accelerationInterval = setInterval(() => {
      setParticleAnimation(prev => {
        const newSpeedX = prev.rotationSpeed.x > 0 
          ? Math.max(prev.rotationSpeed.x * 0.92, -1.7) // Ускорение в отрицательную сторону
          : Math.max(prev.rotationSpeed.x * 1.08, -1.7) // Продолжаем ускорение в отрицательную сторону
        const newSpeedY = Math.min(prev.rotationSpeed.y * 1.05, 1.2)
        
        if (newSpeedX <= -1.65 && newSpeedY >= 1.15) {
          clearInterval(accelerationInterval)
          logger.particles('Home return acceleration completed, starting deceleration')
          
          // Фаза 2: Плавное замедление до базового уровня
          setTimeout(() => {
            const decelerationInterval = setInterval(() => {
              setParticleAnimation(prev => {
                const newSpeedX = prev.rotationSpeed.x < 0 
                  ? Math.min(prev.rotationSpeed.x * 0.94, 1.0) // Замедление к положительной базовой скорости
                  : Math.max(prev.rotationSpeed.x * 0.96, 1.0)
                const newSpeedY = Math.max(prev.rotationSpeed.y * 0.97, 1.0)
                
                if (Math.abs(newSpeedX - 1.0) <= 0.05 && newSpeedY <= 1.05) {
                  clearInterval(decelerationInterval)
                  logger.particles('Home return animation completed')
                  return {
                    rotationSpeed: { x: 1.0, y: 1.0 }, // Возвращаемся к базовой скорости
                    fastRotation: false
                  }
                }
                
                return {
                  rotationSpeed: { x: newSpeedX, y: newSpeedY },
                  fastRotation: Math.abs(newSpeedX) > 1.2 || newSpeedY > 1.2
                }
              })
            }, 160) // Интервалы замедления
          }, 500) // Пауза на пиковой скорости
          
          return {
            rotationSpeed: { x: newSpeedX, y: newSpeedY },
            fastRotation: true
          }
        }
        
        return {
          rotationSpeed: { x: newSpeedX, y: newSpeedY },
          fastRotation: Math.abs(newSpeedX) > 1.2 || newSpeedY > 1.2
        }
      })
    }, 130) // Интервалы ускорения
  }

  // Анимация частиц для перехода в игру
  const animateParticlesGameEntry = () => {
    if (!camera) return
    
    logger.particles('Starting game entry animation', { 
      direction: 'backwards',
      effect: 'backward movement for gaming immersion',
      initialSpeed: { x: 1.0, y: 1.0 },
      peakSpeed: { x: 0.3, y: 1.8 }, // Медленно по X, быстро по Y для эффекта движения назад
      finalSpeed: { x: 0.2, y: 1.4 } // Игровая скорость с эффектом движения назад
    })
    
    // Начинаем с базовой скорости
    setParticleAnimation({
      rotationSpeed: { x: 1.0, y: 1.0 },
      fastRotation: false
    })
    
    // Плавный переход цвета: красный → фиолетовый (игровой)
    animateParticleColor('#D14836', '#8A2BE2', 1200)
    
    // Ускорение с эффектом движения назад
    const accelerationInterval = setInterval(() => {
      setParticleAnimation(prev => {
        const newSpeedX = Math.max(prev.rotationSpeed.x * 0.94, 0.3) // Замедляем X для эффекта движения назад
        const newSpeedY = Math.min(prev.rotationSpeed.y * 1.08, 1.8) // Ускоряем Y
        
        if (newSpeedX <= 0.35 && newSpeedY >= 1.7) {
          clearInterval(accelerationInterval)
          logger.particles('Game backward animation completed, maintaining gaming speed')
          
          // Остаемся на игровой скорости с эффектом движения назад
          setTimeout(() => {
            setParticleAnimation({
              rotationSpeed: { x: 0.2, y: 1.4 }, // Медленно по X, быстро по Y
              fastRotation: true
            })
          }, 300)
          
          return {
            rotationSpeed: { x: newSpeedX, y: newSpeedY },
            fastRotation: true
          }
        }
        
        return {
          rotationSpeed: { x: newSpeedX, y: newSpeedY },
          fastRotation: newSpeedY > 1.3
        }
      })
    }, 120)
  }

  // Анимация выхода из игры
  const animateParticlesGameExit = () => {
    if (!camera) return
    
    setIsAnimating(true) // Блокируем восстановление focus/blur во время анимации
    
    logger.particles('Starting game exit animation', { 
      direction: 'forward',
      effect: 'return from backward movement to normal',
      initialSpeed: { x: 0.2, y: 1.4 }, // Игровая скорость с движением назад
      finalSpeed: { x: 1.0, y: 1.0 } // Базовая скорость
    })
    
    // Плавный переход цвета: фиолетовый → красный (обратно)
    animateParticleColor('#8A2BE2', '#D14836', 1200)
    
    // Восстанавливаем все параметры частиц домашней страницы
    setParticleProps(prev => ({
      ...prev,
      size: 0.005,    // Размер для домашней страницы
      opacity: 0.7    // Прозрачность для домашней страницы
    }))
    
    // Сохраняем базовую скорость для корректного восстановления
    setSavedSpeed({ x: 1.0, y: 1.0 })
    
    // Постепенное возвращение к базовой скорости от движения назад
    const decelerationInterval = setInterval(() => {
      setParticleAnimation(prev => {
        const newSpeedX = Math.min(prev.rotationSpeed.x * 1.12, 1.0) // Ускоряем X обратно к норме
        const newSpeedY = Math.max(prev.rotationSpeed.y * 0.93, 1.0) // Замедляем Y к норме
        
        if (newSpeedX >= 0.95 && newSpeedY <= 1.05) {
          clearInterval(decelerationInterval)
          logger.particles('Game exit animation completed - fully restored to home state', {
            finalSpeed: { x: 1.0, y: 1.0 },
            color: '#D14836',
            size: 0.005,
            opacity: 0.7
          })
          
          // Разблокируем восстановление focus/blur
          setIsAnimating(false)
          
          // Сбрасываем контекст перехода после завершения анимации
          setTimeout(() => {
            setTransitionContext(null)
          }, 200)
          
          return {
            rotationSpeed: { x: 1.0, y: 1.0 }, // Возвращаемся к базовой скорости
            fastRotation: false
          }
        }
        
        return {
          rotationSpeed: { x: newSpeedX, y: newSpeedY },
          fastRotation: newSpeedY > 1.2
        }
      })
    }, 100) // Немного быстрее для лучшего отклика
  }

  // Анимация входа в кейс LightLab
  const animateParticlesLightLabEntry = () => {
    if (!camera) return
    if (hasAnimatedLightLabEntry.current) {
      logger.particles('LightLab entry animation already performed, skipping')
      return
    }
    hasAnimatedLightLabEntry.current = true
    
    logger.particles('Starting LightLab case entry animation', { 
      effect: 'switch to black particles on white background',
      finalColor: '#000000',
      finalSpeed: { x: 0.4, y: 0.4 }
    })
    
    // Плавный переход цвета: красный → черный
    animateParticleColor('#D14836', '#000000', 1500)
    
    // Замедляем частицы для более спокойного фона
    setParticleAnimation(prev => ({
      ...prev,
      rotationSpeed: { x: 0.4, y: 0.4 },
      fastRotation: false
    }))
    
    // Настраиваем свойства для белого фона
    setParticleProps(prev => ({
      ...prev,
      size: 0.006,    // Поменьше для более элегантного вида
      opacity: 0.4    // Более прозрачные для тонкого эффекта
    }))
    
    // Сохраняем скорость для кейса
    setSavedSpeed({ x: 0.4, y: 0.4 })
    
    // Сбрасываем контекст перехода
    setTimeout(() => {
      setTransitionContext(null)
    }, 1500)
  }

  // Анимация выхода из кейса LightLab
  const animateParticlesLightLabExit = () => {
    if (!camera) return
    hasAnimatedLightLabEntry.current = false // Сбрасываем флаг при выходе
    
    logger.particles('Starting LightLab case exit animation', { 
      effect: 'return to red particles',
      finalColor: '#D14836',
      finalSpeed: { x: 1.0, y: 1.0 }
    })
    
    // Плавный переход цвета: черный → красный
    animateParticleColor('#000000', '#D14836', 1000)
    
    // Возвращаем нормальную скорость
    setParticleAnimation(prev => ({
      ...prev,
      rotationSpeed: { x: 1.0, y: 1.0 },
      fastRotation: false
    }))
    
    // Восстанавливаем свойства для домашней страницы
    setParticleProps(prev => ({
      ...prev,
      size: 0.005,    // Обычный размер
      opacity: 0.7    // Обычная прозрачность
    }))
    
    // Сохраняем базовую скорость
    setSavedSpeed({ x: 1.0, y: 1.0 })
    
    // Сбрасываем контекст перехода
    setTimeout(() => {
      setTransitionContext(null)
    }, 1200)
  }

  // Анимация изменения цвета частиц
  const animateParticleColor = (fromColor, toColor, duration) => {
    // Останавливаем предыдущую анимацию если она выполняется
    if (colorAnimationRef.current) {
      cancelAnimationFrame(colorAnimationRef.current)
      logger.particles('Previous color animation cancelled')
    }
    
    logger.particles('Color transition started', { from: fromColor, to: toColor, duration })
    
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Интерполяция цвета
      const interpolatedColor = interpolateColor(fromColor, toColor, progress)
      
      setParticleProps(prev => ({
        ...prev,
        color: interpolatedColor
      }))
      
      if (progress < 1) {
        colorAnimationRef.current = requestAnimationFrame(animate)
      } else {
        colorAnimationRef.current = null
        logger.particles('Color transition completed', { finalColor: toColor })
      }
    }
    
    colorAnimationRef.current = requestAnimationFrame(animate)
  }

  // Функция интерполяции цвета
  const interpolateColor = (color1, color2, factor) => {
    const hex1 = color1.replace('#', '')
    const hex2 = color2.replace('#', '')
    
    const r1 = parseInt(hex1.substr(0, 2), 16)
    const g1 = parseInt(hex1.substr(2, 2), 16)
    const b1 = parseInt(hex1.substr(4, 2), 16)
    
    const r2 = parseInt(hex2.substr(0, 2), 16)
    const g2 = parseInt(hex2.substr(2, 2), 16)
    const b2 = parseInt(hex2.substr(4, 2), 16)
    
    const r = Math.round(r1 + (r2 - r1) * factor)
    const g = Math.round(g1 + (g2 - g1) * factor)
    const b = Math.round(b1 + (b2 - b1) * factor)
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  // Устаревшие методы для совместимости
  const animateToMenu = () => {
    logger.particles('Legacy animateToMenu called - redirecting to contextual animation')
    animateParticlesMenuEntry()
  }

  const animateFromMenu = () => {
    logger.particles('Legacy animateFromMenu called - redirecting to contextual animation')
    animateParticlesHomeReturn()
  }

  // Функция для прямого управления скоростью частиц
  const setParticleSpeed = useCallback((speed) => {
    const newSpeed = { x: speed, y: speed }
    setSavedSpeed(newSpeed) // Сохраняем новую скорость
    
    logger.particles('setParticleSpeed called', { speed, isPageVisible, documentHidden: document.hidden })
    
    // Применяем скорость только если страница видима
    if (isPageVisible && !document.hidden) {
      setParticleAnimation(prev => ({
        ...prev,
        rotationSpeed: newSpeed
      }))
    }
  }, [isPageVisible])

  const value = {
    currentPage,
    setCurrentPage,
    animateToHome,
    animateToStart,
    animateToMenu,
    animateFromMenu,
    setParticleSpeed,
    camera,
    particlesVisible,
    startParticleAppearAnimation,
    isPageVisible,
    setTransitionContext,
    transitionContext,
    animateParticlesGameExit,
    animateParticlesLightLabEntry,
    animateParticlesLightLabExit,
    hoveredRect,
    setHoveredRect,
    setParticleProps, // Added to expose the setter
    pauseParticles: () => {
      // Save current speed (if not zero) and set speed to 0
      setSavedSpeed(prev => {
        const cur = particleAnimationRef.current.rotationSpeed
        if ((cur.x !== 0 || cur.y !== 0)) return cur
        return prev
      })
      setParticleAnimation(prev => ({ ...prev, rotationSpeed: { x: 0, y: 0 } }))
    },
    resumeParticles: () => {
      // Restore saved speed or fallback to default for current page
      setParticleAnimation(prev => {
        let restore = savedSpeed
        if (restore.x === 0 && restore.y === 0) {
          restore = currentPage === 'lightlab-case' ? { x: 0.4, y: 0.4 } : { x: 1.0, y: 1.0 }
        }
        return { ...prev, rotationSpeed: restore }
      })
    }
  }

  return (
    <ParticleContext.Provider value={value}>
      {/* Глобальные частицы - всегда присутствуют */}
      <UniversalParticles 
        isStartPage={currentPage === 'start'} 
        onCameraReady={handleCameraReady}
        particleColor={particleProps.color}
        particleSize={particleProps.size}
        particleOpacity={particleProps.opacity}
        rotationSpeed={particleAnimation.rotationSpeed}
        fastRotation={particleAnimation.fastRotation}
        particlesVisible={particlesVisible}
        isLightLabCase={currentPage === 'lightlab-case'}
        hoveredRect={hoveredRect}
      />
      {children}
    </ParticleContext.Provider>
  )
}

export default ParticleProvider