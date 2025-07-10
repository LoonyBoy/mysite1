import React, { useEffect, useRef, useState, useCallback } from 'react'
import styled from 'styled-components'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'
import { useParticles } from '../components/GlobalParticleManager'
import CustomCursor from '../components/CustomCursor'
import logger from '../utils/Logger'

const GameContainer = styled.div`
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: transparent;
  position: relative;
  overflow: hidden;
  z-index: 1;
  touch-action: none;
  user-select: none;
`



const GameUI = styled.div`
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 3;
  color: white;
  font-size: 1.2rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
  
  @media (max-width: 768px) {
    top: 1rem;
    left: 1rem;
    font-size: 1rem;
  }
`

const ExitHint = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  text-align: center;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
  
  @media (max-width: 768px) {
    bottom: 1rem;
    font-size: 0.8rem;
  }
`

const ExitButton = styled.button`
  position: absolute;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
  width: 50px;
  height: 50px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: none;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.5rem;
  user-select: none;
  pointer-events: auto;
  touch-action: manipulation;
  outline: none;
  
  &:hover {
    background: rgba(209, 72, 54, 0.2);
    border-color: var(--primary-red);
    color: var(--primary-red);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    top: 1rem;
    right: 1rem;
    width: 44px;
    height: 44px;
    font-size: 1.3rem;
  }
  
  @media (min-width: 769px) {
    display: none;
  }
`

const ScreenFlashOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 0, 0, ${props => props.opacity || 0});
  pointer-events: none;
  z-index: 999;
  transition: opacity 0.1s ease;
`

const GameOverOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
  pointer-events: auto;
  
  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
`

const GameOverTitle = styled.h2`
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 400;
  color: var(--primary-red);
  text-align: center;
  margin-bottom: 1rem;
  text-shadow: 
    0 0 10px rgba(209, 72, 54, 0.5),
    0 0 20px rgba(209, 72, 54, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.8);
`

const FinalScore = styled.p`
  font-size: clamp(1.2rem, 3vw, 2rem);
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-bottom: 3rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
`

const GameOverButtons = styled.div`
  display: flex;
  gap: 2rem;
  flex-direction: row;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`

const GameOverButton = styled.button`
  padding: 1rem 3rem;
  border: 2px solid var(--primary-red);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  color: var(--primary-red);
  font-size: 1.2rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: all 0.3s ease;
  min-height: 44px;
  position: relative;
  overflow: hidden;
  cursor: none;
  z-index: 101;
  pointer-events: auto;
  border-radius: 0;
  outline: none;
  user-select: none;
  text-shadow: 
    0 0 10px rgba(209, 72, 54, 0.5),
    0 0 20px rgba(209, 72, 54, 0.3);
  box-shadow: 
    0 0 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  /* Киберпанк пиксельное мерцание */
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
  
  &:hover {
    background: rgba(209, 72, 54, 0.1);
    border-color: rgba(209, 72, 54, 0.8);
    color: rgba(209, 72, 54, 0.9);
    box-shadow: 
      0 0 30px rgba(209, 72, 54, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 
      0 0 15px rgba(209, 72, 54, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  @keyframes cyberpunk-scan {
    0% { left: -100%; }
    100% { left: 100%; }
  }
  
  @media (max-width: 768px) {
    padding: 0.8rem 2rem;
    font-size: 1rem;
    min-width: 200px;
  }
`

const SpaceInvadersPage = () => {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const gameLoopRef = useRef(null)
  const touchRef = useRef({ isPressed: false, x: 0 })
  const hasInitialized = useRef(false)
  const { camera, setTransitionContext, animateParticlesGameExit } = useParticles()
  
  // Игровые состояния
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameState, setGameState] = useState('playing') // playing, gameOver
  const gameStateRef = useRef('playing') // Ref для синхронного доступа к состоянию
  const [showCursorAnimation, setShowCursorAnimation] = useState(false)
  const [animationData, setAnimationData] = useState(null)
  const [playerVisible, setPlayerVisible] = useState(true)
  const [screenShake, setScreenShake] = useState({ active: false, intensity: 0 })
  const [screenFlash, setScreenFlash] = useState({ active: false, opacity: 0 })
  const [gameInitialized, setGameInitialized] = useState(false)
  const [shipAnimating, setShipAnimating] = useState(false)
  
  // Игровые объекты
  const gameObjects = useRef({
    player: {
      x: 0,
      y: 0,
      width: 16, // Синхронизировано с курсором
      height: 24, // Синхронизировано с курсором
      speed: 5
    },
    bullets: [],
    enemies: [],
    particles: []
  })

  // Инициализация игры
  useEffect(() => {
    // Предотвращаем повторные инициализации
    if (hasInitialized.current) {
      console.log('⚠️ SpaceInvadersPage: Already initialized, skipping')
      return
    }
    
    hasInitialized.current = true
    console.log('🎮 SpaceInvadersPage: Component mounted, initializing...')
    
    // Проверяем, есть ли данные анимации курсора
    const animationDataStr = sessionStorage.getItem('cursorToShipAnimation')
    console.log('🔍 SpaceInvadersPage: Checking for animation data in sessionStorage', {
      found: !!animationDataStr,
      data: animationDataStr
    })
    
    if (animationDataStr) {
      try {
        const data = JSON.parse(animationDataStr)
        console.log('📦 SpaceInvadersPage: Parsed animation data', data)
        
        if (data.active) {
          console.log('✅ SpaceInvadersPage: Animation data is active, setting up ship animation')
          setAnimationData(data)
          setShipAnimating(true) // корабль будет анимироваться
          setPlayerVisible(true) // корабль видим для анимации
          setGameInitialized(false) // задерживаем инициализацию игры
          
          // Устанавливаем корабль в позицию курсора
          gameObjects.current.player.x = data.startX
          gameObjects.current.player.y = data.startY
          
          // Инициализируем визуальные свойства для анимации (видимый корабль = курсор)
          // rotation: 0 - направлен влево как курсор-треугольник
          gameObjects.current.player.visualProps = { scale: 1, opacity: 1, rotation: 0 }
          
          console.log('🚀 SpaceInvadersPage: Ship positioned at cursor location', {
            x: data.startX, 
            y: data.startY,
            visualProps: gameObjects.current.player.visualProps
          })
          console.log('⏳ SpaceInvadersPage: Game initialization delayed until animation completes')
          
          // Очищаем данные анимации
          sessionStorage.removeItem('cursorToShipAnimation')
          console.log('🗑️ SpaceInvadersPage: Animation data cleared from sessionStorage')
        } else {
          console.log('❌ SpaceInvadersPage: Animation data not active')
          setGameInitialized(true)
        }
      } catch (error) {
        console.error('❌ SpaceInvadersPage: Error parsing cursor animation data:', error)
      }
    } else {
      console.log('ℹ️ SpaceInvadersPage: No animation data found, normal game start')
      // Инициализируем визуальные свойства для обычного режима
      // rotation: 90 - для обычной игры корабль направлен вверх
      gameObjects.current.player.visualProps = { scale: 1, opacity: 1, rotation: 90 }
      setGameInitialized(true)
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    
    // Устанавливаем размеры канваса
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      // Инициализируем позицию игрока
      gameObjects.current.player.x = canvas.width / 2
      gameObjects.current.player.y = canvas.height - 80
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    logger.navigation('Space Invaders game initialized', {
      canvasSize: { width: canvas.width, height: canvas.height },
      playerPosition: gameObjects.current.player
    })

    // Запускаем игровой цикл только если игра инициализирована
    // (может быть задержано из-за анимации курсора)
    if (gameInitialized && !shipAnimating) {
      console.log('🎮 SpaceInvadersPage: Starting game loop immediately')
      startGameLoop(ctx)
      spawnEnemies()
    } else {
      console.log('⏳ SpaceInvadersPage: Game loop delayed, waiting for animation completion', {
        gameInitialized,
        shipAnimating
      })
    }

    return () => {
      console.log('🧹 SpaceInvadersPage: Cleanup - removing listeners and stopping game loop')
      window.removeEventListener('resize', resizeCanvas)
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }
  }, []) // Убираем зависимость camera, чтобы useEffect выполнился только один раз

  // Эффект для работы с камерой частиц
  useEffect(() => {
    if (camera) {
      console.log('📷 SpaceInvadersPage: Setting up camera animation')
      gsap.to(camera.rotation, {
        x: 0.5,
        y: 0.3,
        duration: 2,
        ease: "power2.out"
      })
    }
  }, [camera])

      // Запуск игрового цикла после завершения анимации
  useEffect(() => {
    if (gameInitialized && !shipAnimating && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      console.log('🎮 SpaceInvadersPage: Game initialization triggered, starting game loop')
      startGameLoop(ctx)
      spawnEnemies()
    }
  }, [gameInitialized, shipAnimating])

  // Анимация корабля от позиции курсора до игровой позиции
  useEffect(() => {
    if (shipAnimating && canvasRef.current && animationData && gameObjects.current.player.visualProps) {
      const canvas = canvasRef.current
      const targetX = canvas.width / 2
      const targetY = canvas.height - 80
      
      console.log('🌀 SpaceInvadersPage: Cursor-ship ready for spiral flight', {
        from: { x: animationData.startX, y: animationData.startY },
        to: { x: targetX, y: targetY },
        shipProps: gameObjects.current.player.visualProps
      })
      
      // Используем уже существующий объект для анимации визуальных свойств
      const visualProps = gameObjects.current.player.visualProps
      
             // Сразу начинаем спиральную анимацию к игровой позиции (курсор уже стал кораблем)
       console.log('🚀 Cursor transformed to ship, starting spiral flight')
        
        const centerX = targetX
        const centerY = targetY
        const maxRadius = Math.sqrt((targetX - animationData.startX) ** 2 + (targetY - animationData.startY) ** 2)
        const startAngle = Math.atan2(animationData.startY - centerY, animationData.startX - centerX)
        const totalRotation = Math.PI * 3 // 1.5 оборота
        
        const spiralData = { progress: 0 }
        
        gsap.to(spiralData, {
          progress: 1,
          duration: 2.5,
          ease: "power2.inOut",
          onUpdate: function() {
            const progress = spiralData.progress
            const speedCurve = Math.sin(progress * Math.PI)
            
            const currentRadius = maxRadius * (1 - progress)
            const angleProgress = progress + (speedCurve * 0.3)
            const currentAngle = startAngle + totalRotation * angleProgress
            
            const x = centerX + Math.cos(currentAngle) * currentRadius
            const y = centerY + Math.sin(currentAngle) * currentRadius
            
            // Сохраняем предыдущую позицию для расчета направления
            const prevX = gameObjects.current.player.x
            const prevY = gameObjects.current.player.y
            
            // Обновляем позицию корабля
            gameObjects.current.player.x = x
            gameObjects.current.player.y = y
            
            // Рассчитываем угол поворота корабля по направлению движения и плавно интерполируем к вертикали
            if (progress > 0.01) { // Избегаем деления на ноль в начале
              const deltaX = x - prevX
              const deltaY = y - prevY
              // Рассчитываем угол движения в градусах и корректируем для ориентации треугольника
              const movementAngle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
              const baseRotation = movementAngle + 180
              // Плавная интерполяция к 90° при прогрессе > 0.8
              const rotateStart = 0.8
              if (progress > rotateStart) {
                const t = (progress - rotateStart) / (1 - rotateStart)
                visualProps.rotation = baseRotation * (1 - t) + 90 * t
              } else {
                visualProps.rotation = baseRotation
              }
            }
            
            // Принудительно перерисовываем корабль во время анимации
            const canvas = canvasRef.current
            if (canvas) {
              const ctx = canvas.getContext('2d')
              // Очищаем только область корабля для оптимизации
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              // Рисуем только корабль
              drawPlayer(ctx)
            }
            
            // Логируем ключевые моменты
            if (Math.abs(progress - 0.5) < 0.02) {
              console.log('🔄 Ship spiral flight halfway complete, rotation:', Math.round(visualProps.rotation) + '°')
            }
          },
          onComplete: () => {
            console.log('✅ Ship spiral flight completed')
            // Устанавливаем финальную позицию
            gameObjects.current.player.x = targetX
            gameObjects.current.player.y = targetY
            
            // Ориентация уже установлена во время спирали, дальнейшие вращения не нужны
            
            // Завершаем анимацию и запускаем игру
            setShipAnimating(false)
            setGameInitialized(true)
            
            // Восстанавливаем курсор
            const cursor = document.querySelector('.cursor')
            if (cursor) {
              cursor.style.opacity = '1'
              console.log('🔄 SpaceInvadersPage: Original cursor restored')
            }
          }
        })
    }
  }, [shipAnimating, animationData])

  // Обработка касаний для управления кораблем
  useEffect(() => {
    // Не добавляем обработчики, если игра окончена
    if (gameState === 'gameOver') return
    const handleTouchStart = (e) => {
      if (gameState !== 'playing') return
      
      e.preventDefault()
      const touch = e.touches[0]
      touchRef.current.isPressed = true
      touchRef.current.x = touch.clientX
      
      logger.touch('Game touch start', { x: touch.clientX, y: touch.clientY })
    }

    const handleTouchMove = (e) => {
      e.preventDefault()
      if (!touchRef.current.isPressed) return
      
      const touch = e.touches[0]
      const deltaX = touch.clientX - touchRef.current.x
      
      // Проверяем свайп влево для выхода (работает в любом состоянии)
      if (Math.abs(deltaX) > 100 && deltaX < 0) {
        logger.navigation('Swipe left detected, exiting game')
        exitGame()
        return
      }
      
      // Управление кораблем только во время игры
      if (gameState !== 'playing') return
      
      // Управление кораблем с ограничением по границам экрана
      const canvas = canvasRef.current
      if (canvas) {
        const playerWidth = gameObjects.current.player.width
        const minX = playerWidth / 2
        const maxX = canvas.width - playerWidth / 2
        gameObjects.current.player.x = Math.max(minX, Math.min(maxX, touch.clientX))
      }
      touchRef.current.x = touch.clientX
      
      logger.touch('Game ship control', { 
        shipX: gameObjects.current.player.x,
        touchX: touch.clientX 
      })
    }

    const handleTouchEnd = (e) => {
      e.preventDefault()
      touchRef.current.isPressed = false
      
      logger.touch('Game touch end')
    }

    // Обработчики мыши для десктопа
    const handleMouseMove = (e) => {
      if (gameState !== 'playing') return
      
      const canvas = canvasRef.current
      if (canvas) {
        const playerWidth = gameObjects.current.player.width
        const minX = playerWidth / 2
        const maxX = canvas.width - playerWidth / 2
        gameObjects.current.player.x = Math.max(minX, Math.min(maxX, e.clientX))
      }
    }

    const handleMouseDown = (e) => {
      if (gameState !== 'playing') return
      
      touchRef.current.isPressed = true
      touchRef.current.x = e.clientX
    }

    const handleMouseUp = () => {
      touchRef.current.isPressed = false
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        logger.navigation('Escape key pressed, exiting game')
        exitGame()
      }
    }

    // Добавляем обработчики для касаний и мыши
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mousedown', handleMouseDown, { passive: true })
    document.addEventListener('mouseup', handleMouseUp, { passive: true })
    document.addEventListener('keydown', handleKeyDown, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [gameState])

  // Игровой цикл
  const startGameLoop = (ctx) => {
    logger.navigation('Starting game loop')
    
    // Останавливаем предыдущий цикл, если он был
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }
    
    const gameLoop = () => {
      // Проверяем текущее состояние через ref или прямую проверку
      const canvas = canvasRef.current
      if (!canvas) {
        logger.navigation('Game loop stopped: no canvas')
        gameLoopRef.current = null
        return
      }
      
      // Очищаем канвас
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      
      // Обновляем и рисуем игровые объекты
      updateGame()
      drawGame(ctx)
      
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
    
    gameLoop()
  }

  // Обновление игровой логики
  const updateGame = () => {
    if (gameStateRef.current !== 'playing') {
      console.log('🚫 updateGame blocked, gameState:', gameStateRef.current)
      return
    }
    
    const { player, bullets, enemies } = gameObjects.current
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Автоматическая стрельба
    if (Math.random() < 0.1) { // 10% шанс выстрела каждый кадр
      bullets.push({
        x: player.x,
        y: player.y - 10,
        width: 3,
        height: 10,
        speed: 8
      })
    }
    
    // Обновляем пули
    gameObjects.current.bullets = bullets.filter(bullet => {
      bullet.y -= bullet.speed
      return bullet.y > -10
    })
    
    // Обновляем врагов
    enemies.forEach(enemy => {
      enemy.y += enemy.speed
      enemy.x += enemy.speedX
      
      // Отражаем от границ экрана
      if (enemy.x <= enemy.width/2 || enemy.x >= canvas.width - enemy.width/2) {
        enemy.speedX *= -0.8 // Отражаем и немного замедляем
      }
      
      // Меняем направление случайно
      enemy.directionChangeTimer--
      if (enemy.directionChangeTimer <= 0) {
        enemy.speedX = (Math.random() - 0.5) * 3
        enemy.directionChangeTimer = Math.random() * 60 + 30
      }
    })
    
    // Проверяем врагов, которые ушли за нижний край экрана
    const remainingEnemies = []
    enemies.forEach(enemy => {
      if (enemy.y < canvas.height + 50) {
        remainingEnemies.push(enemy)
      } else {
        // Враг ушел за край - отнимаем жизнь
        logger.particles('Enemy escaped! Losing life')
        setLives(prev => {
          const newLives = prev - 1
          logger.particles('Life lost! Lives remaining:', newLives)
          
          // Запускаем эффекты тряски и покраснения только если игра продолжается
          if (newLives > 0) {
            triggerScreenEffects()
          }
          
          if (newLives <= 0) {
            // Останавливаем игровой цикл немедленно
            if (gameLoopRef.current) {
              cancelAnimationFrame(gameLoopRef.current)
              gameLoopRef.current = null
            }
            setGameState('gameOver')
            gameStateRef.current = 'gameOver'
            logger.navigation('Game Over! Final score:', score)
          }
          
          return newLives
        })
      }
    })
    gameObjects.current.enemies = remainingEnemies
    
    // Обновляем частицы
    gameObjects.current.particles = gameObjects.current.particles.filter(particle => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life--
      particle.alpha = particle.life / 60 // Плавное исчезновение
      
      return particle.life > 0
    })
    
    // Проверяем коллизии
    checkCollisions()
    
    // Проверяем коллизии врагов с игроком
    checkPlayerCollisions()
    
    // Спавним новых врагов
    if (Math.random() < 0.02) { // 2% шанс спавна каждый кадр
      spawnEnemies()
    }
    
    // Отладочная информация (каждые 60 кадров ~ 1 раз в секунду)
    if (Math.random() < 0.017) { // ~1% шанс
      console.log('🎮 Game update:', {
        gameState: gameStateRef.current,
        enemyCount: enemies.length,
        bulletCount: bullets.length,
        particleCount: gameObjects.current.particles.length
      })
    }
  }

  // Отдельная функция для рисования игрока
  const drawPlayer = (ctx) => {
    const { player } = gameObjects.current
    
    // Рисуем игрока только если он видим (треугольник фирменного цвета)
    if (playerVisible) {
      // Сохраняем текущий контекст для применения трансформаций
      ctx.save()
      
      // Применяем визуальные свойства анимации если они есть
      const visualProps = player.visualProps
      if (visualProps) {
        // Логируем визуальные свойства только при изменениях
        if (Math.random() < 0.1) { // 10% шанс логирования
          console.log('🎨 Drawing player with visual props:', {
            scale: visualProps.scale,
            opacity: visualProps.opacity,
            rotation: visualProps.rotation || 0,
            position: { x: player.x, y: player.y }
          })
        }
        
        // Устанавливаем прозрачность
        ctx.globalAlpha = visualProps.opacity || 1
        
        // Применяем трансформации относительно центра корабля
        ctx.translate(player.x, player.y)
        ctx.scale(visualProps.scale || 1, visualProps.scale || 1)
        
        // Применяем поворот (по умолчанию 0 - направлен влево как курсор)
        ctx.rotate((visualProps.rotation || 0) * Math.PI / 180)
        
        ctx.translate(-player.x, -player.y)
      }
      
      ctx.fillStyle = '#D14836' // Фирменный оранжево-красный
      ctx.beginPath()
      
      // Рисуем треугольник направленный влево (как курсор) - синхронизируем размеры
      // Курсор: border-right: 16px, border-top/bottom: 12px
      const width = 16
      const height = 24 // 12px + 12px
      
      // Треугольник направлен влево (вершина слева)
      ctx.moveTo(player.x - width/2, player.y) // Левая вершина
      ctx.lineTo(player.x + width/2, player.y - height/2) // Правый верх
      ctx.lineTo(player.x + width/2, player.y + height/2) // Правый низ
      ctx.closePath()
      ctx.fill()
      
      // Восстанавливаем контекст
      ctx.restore()
    } else {
      // Логируем только первые несколько раз, чтобы не спамить консоль
      if (Math.random() < 0.01) { // 1% шанс логирования
        console.log('👻 SpaceInvadersPage: Player ship hidden (waiting for animation)')
      }
    }
  }

  // Отрисовка игры
  const drawGame = (ctx) => {
    const { bullets, enemies, particles } = gameObjects.current
    
    // Рисуем игрока
    drawPlayer(ctx)
    
    // Рисуем пули
    ctx.fillStyle = '#FFD700' // Золотые пули
    bullets.forEach(bullet => {
      ctx.fillRect(bullet.x - bullet.width/2, bullet.y, bullet.width, bullet.height)
    })
    
    // Рисуем врагов
    enemies.forEach(enemy => {
      ctx.fillStyle = enemy.type === 'weak' ? '#87CEEB' : '#4169E1' // Светло-голубой или синий
      ctx.fillRect(enemy.x - enemy.width/2, enemy.y - enemy.height/2, enemy.width, enemy.height)
      
      // Показываем здоровье для сильных врагов
      if (enemy.type === 'strong' && enemy.health < 3) {
        ctx.fillStyle = '#FF4444'
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(enemy.health.toString(), enemy.x, enemy.y - 20)
      }
    })
    
    // Рисуем частицы
    particles.forEach(particle => {
      ctx.save()
      ctx.globalAlpha = particle.alpha
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  // Создание врагов
  const spawnEnemies = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.log('🚫 spawnEnemies: No canvas found')
      return
    }
    
    const enemyType = Math.random() < 0.7 ? 'weak' : 'strong' // 70% слабых, 30% сильных
    
    const enemy = {
      x: Math.random() * (canvas.width - 40) + 20,
      y: -30,
      width: 25,
      height: 25,
      speed: enemyType === 'weak' ? 2 : 1.5,
      speedX: (Math.random() - 0.5) * 3, // Хаотичное движение влево/вправо
      type: enemyType,
      health: enemyType === 'weak' ? 1 : 3,
      directionChangeTimer: Math.random() * 60 + 30 // Смена направления каждые 30-90 кадров
    }
    
    gameObjects.current.enemies.push(enemy)
    
    console.log('✅ Enemy spawned:', { 
      type: enemyType, 
      position: { x: enemy.x, y: enemy.y },
      totalEnemies: gameObjects.current.enemies.length,
      gameState: gameStateRef.current
    })
    
    logger.particles('Enemy spawned', { type: enemyType, position: { x: enemy.x, y: enemy.y } })
  }

  // Проверка коллизий пуль с врагами
  const checkCollisions = () => {
    const { bullets, enemies } = gameObjects.current
    
    bullets.forEach((bullet, bulletIndex) => {
      enemies.forEach((enemy, enemyIndex) => {
        if (
          bullet.x < enemy.x + enemy.width/2 &&
          bullet.x + bullet.width > enemy.x - enemy.width/2 &&
          bullet.y < enemy.y + enemy.height/2 &&
          bullet.y + bullet.height > enemy.y - enemy.height/2
        ) {
          // Попадание!
          enemy.health -= 1
          bullets.splice(bulletIndex, 1)
          
          if (enemy.health <= 0) {
            // Создаем частицы взрыва
            createExplosionParticles(enemy.x, enemy.y, enemy.type)
            
            enemies.splice(enemyIndex, 1)
            setScore(prev => prev + (enemy.type === 'weak' ? 10 : 30))
            
            logger.particles('Enemy destroyed', { 
              type: enemy.type, 
              scoreGained: enemy.type === 'weak' ? 10 : 30 
            })
          }
        }
      })
    })
  }

  // Проверка коллизий врагов с игроком
  const checkPlayerCollisions = () => {
    const { player, enemies } = gameObjects.current
    
    enemies.forEach((enemy, enemyIndex) => {
      if (
        player.x < enemy.x + enemy.width/2 &&
        player.x + player.width/2 > enemy.x - enemy.width/2 &&
        player.y < enemy.y + enemy.height/2 &&
        player.y + player.height/2 > enemy.y - enemy.height/2
      ) {
        // Столкновение с игроком!
        // Создаем частицы взрыва врага
        createExplosionParticles(enemy.x, enemy.y, enemy.type)
        
        enemies.splice(enemyIndex, 1) // Убираем врага
        setLives(prev => {
          const newLives = prev - 1
          logger.particles('Player hit! Lives remaining:', newLives)
          
          // Запускаем эффекты тряски и покраснения только если игра продолжается
          if (newLives > 0) {
            triggerScreenEffects()
          }
          
          if (newLives <= 0) {
            // Останавливаем игровой цикл немедленно
            if (gameLoopRef.current) {
              cancelAnimationFrame(gameLoopRef.current)
              gameLoopRef.current = null
            }
            setGameState('gameOver')
            gameStateRef.current = 'gameOver'
            logger.navigation('Game Over! Final score:', score)
          }
          
          return newLives
        })
      }
    })
  }

  // Рестарт игры
  const restartGame = () => {
    logger.navigation('Restarting game')
    
    // Сброс состояния игры в начале для корректной работы
    setGameState('playing')
    gameStateRef.current = 'playing' // Синхронно устанавливаем ref
    setScore(0)
    setLives(3)
    
    console.log('🔄 Restarting game, gameState set to:', gameStateRef.current)
    
    // Сбрасываем эффекты экрана
    setScreenShake({ active: false, intensity: 0 })
    setScreenFlash({ active: false, opacity: 0 })
    
    // Останавливаем текущий игровой цикл
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
      gameLoopRef.current = null
    }
    
    // Очистка игровых объектов
    gameObjects.current.bullets = []
    gameObjects.current.enemies = []
    gameObjects.current.particles = []
    
    // Сброс позиции игрока
    const canvas = canvasRef.current
    if (canvas) {
      gameObjects.current.player.x = canvas.width / 2
      gameObjects.current.player.y = canvas.height - 80
      // Инициализируем визуальные свойства
      gameObjects.current.player.visualProps = { scale: 1, opacity: 1, rotation: 90 }
      
      // Очищаем канвас
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    
    // Запускаем игру с небольшой задержкой для корректного обновления состояния
    setTimeout(() => {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Создаем первых врагов сразу
          spawnEnemies()
          spawnEnemies() // Создаем несколько врагов для быстрого старта
          
          // Запускаем игровой цикл
          startGameLoop(ctx)
          
          logger.navigation('Game restarted successfully')
        }
      }
    }, 150) // Увеличиваем задержку для надежности
  }

  // Выход из игры
  const exitGame = () => {
    logger.navigation('Exiting Space Invaders game', { finalScore: score })
    
    // Останавливаем игровой цикл
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
      gameLoopRef.current = null
    }
    
    // Устанавливаем контекст перехода для правильной анимации частиц
    setTransitionContext('game->home')
    
    // Принудительно запускаем анимацию возврата частиц
    console.log('🔥 Manually triggering particle game exit animation')
    
    // Немедленный сброс анимации частиц
    if (animateParticlesGameExit) {
      console.log('📦 Using particle context to trigger exit animation')
      animateParticlesGameExit()
    }
    
    // Возвращаем камеру в исходное состояние домашней страницы
    if (camera) {
      console.log('📷 Resetting camera properties')
      
      // Сбрасываем вращение камеры
      gsap.to(camera.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1.2,
        ease: "power2.out"
      })
      
      // Сбрасываем позицию камеры
      gsap.to(camera.position, {
        z: 1,
        duration: 1.2,
        ease: "power2.out"
      })
      
      // Сбрасываем FOV камеры
      gsap.to(camera, {
        fov: 75,
        duration: 1.2,
        ease: "power2.out",
        onUpdate: () => {
          camera.updateProjectionMatrix()
        }
      })
    }
    
    console.log('🎮➡️🏠 Exiting game, transition context set to:', 'game->home')
    
    // Анимация выхода из игры
    const container = document.querySelector('.game-container')
    if (container) {
      gsap.to(container, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
        onComplete: () => {
          navigate('/home')
        }
      })
    } else {
      navigate('/home')
    }
  }

  // Создание частиц взрыва
  const createExplosionParticles = (x, y, enemyType) => {
    const particleCount = enemyType === 'weak' ? 8 : 12
    const color = enemyType === 'weak' ? '#87CEEB' : '#4169E1'
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5
      const speed = 2 + Math.random() * 3
      
      gameObjects.current.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: color,
        alpha: 1,
        life: 60 + Math.random() * 30 // жизнь частицы в кадрах
      })
    }
  }

  // Эффект тряски экрана и покраснения
  const triggerScreenEffects = () => {
    // Тряска экрана
    setScreenShake({ active: true, intensity: 10 })
    
    // Покраснение экрана
    setScreenFlash({ active: true, opacity: 0.3 })
    
    // Отключение эффектов через 1 секунду
    setTimeout(() => {
      setScreenShake({ active: false, intensity: 0 })
      setScreenFlash({ active: false, opacity: 0 })
    }, 1000)
  }

  return (
    <GameContainer 
      className="game-container"
      style={{
        transform: screenShake.active 
          ? `translate(${(Math.random() - 0.5) * screenShake.intensity}px, ${(Math.random() - 0.5) * screenShake.intensity}px)`
          : 'none'
      }}
    >
      <CustomCursor />
      
      {screenFlash.active && (
        <ScreenFlashOverlay opacity={screenFlash.opacity} />
      )}
      
      <canvas
        data-testid="game-canvas"
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          touchAction: 'none',
          zIndex: 2
        }}
      />
      
      <GameUI>
        <div>Счет: {score}</div>
        <div>Жизни: {lives}</div>
        <div style={{ fontSize: '0.8em', marginTop: '0.5rem', opacity: 0.7 }}>
          Зажми и двигай для управления
        </div>
      </GameUI>
      
            {gameState === 'playing' && (
        <ExitHint>
          Стрелочка справа или Escape для выхода
        </ExitHint>
      )}
      
      {gameState === 'playing' && (
        <ExitButton 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Exit button clicked!')
            logger.navigation('Exit button clicked')
            exitGame()
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Exit button mouse down')
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            console.log('Exit button touch start')
          }}
          onTouchEnd={(e) => {
            e.stopPropagation()
            console.log('Exit button touch end')
            exitGame()
          }}
        >
          →
        </ExitButton>
      )}
      
      {gameState === 'gameOver' && (
        <GameOverOverlay>
          <GameOverTitle>GAME OVER</GameOverTitle>
          <FinalScore>Финальный счет: {score}</FinalScore>
          <GameOverButtons>
            <GameOverButton 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Restart button clicked!')
                logger.navigation('Restart button clicked')
                restartGame()
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Restart button mouse down')
              }}
            >
              РЕСТАРТ
            </GameOverButton>
            <GameOverButton 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Exit button clicked!')
                logger.navigation('Exit button clicked')
                exitGame()
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Exit button mouse down')
              }}
            >
              ДОМОЙ
            </GameOverButton>
          </GameOverButtons>
        </GameOverOverlay>
      )}
    </GameContainer>
  )
}

export default SpaceInvadersPage 