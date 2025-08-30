import React, { useEffect, useRef, useState, useCallback } from 'react'
import styled from 'styled-components'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'
import { useParticles } from '../components/GlobalParticleManager'
import CustomCursor from '../components/CustomCursor'
import logger from '../utils/Logger'
import { fetchTopScores, saveScore } from '../lib/scoresApi'

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

const LowHealthOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, transparent 40%, rgba(255, 68, 68, 0.1) 100%);
  pointer-events: none;
  z-index: 998;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
  animation: ${props => props.visible ? 'pulse' : 'none'} 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% { 
      background: radial-gradient(circle, transparent 40%, rgba(255, 68, 68, 0.1) 100%);
    }
    50% { 
      background: radial-gradient(circle, transparent 40%, rgba(255, 68, 68, 0.2) 100%);
    }
  }
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

// Элементы ввода инициалов (с мобильными отступами)
const InitialsRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  @media (max-width: 768px) {
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
`

const InitialsColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
  border: ${props => props.$active ? '2px solid var(--primary-red)' : '2px solid transparent'};
  @media (max-width: 768px) {
    padding: 2px;
  }
`

const ArrowButton = styled.button`
  width: 40px;
  height: 28px;
  border: 2px solid var(--primary-red);
  background: transparent;
  color: var(--primary-red);
  @media (max-width: 768px) {
    width: 32px;
    height: 24px;
  }
`

const InitialLetter = styled.div`
  font-size: 2rem;
  color: #fff;
  width: 40px;
  text-align: center;
  line-height: 1;
  @media (max-width: 768px) {
    font-size: 1.6rem;
    width: 32px;
  }
`

// Контейнер для действий справа от инициалов
const GameOverActionRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
  @media (max-width: 768px) {
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
`

const RightActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: stretch;
`

const ButtonsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

// Стили для интерфейса выбора корабля
const ShipSelectionOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 200;
  opacity: 1;
`

const ShipSelectionTitle = styled.h2`
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 400;
  color: var(--primary-red);
  text-align: left;
  margin: 0;
  text-shadow: 
    0 0 10px rgba(209, 72, 54, 0.5),
    0 0 20px rgba(209, 72, 54, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.8);

  @media (max-width: 768px) {
    /* Make the title smaller on mobile */
    font-size: 1.5rem;
    line-height: 1.2;
  }
`

const ShipSelectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: calc(100% - 4rem);
  max-width: 1200px;
  margin: 0 auto 0.5rem;
  padding: 1rem 2rem;
  box-sizing: border-box;

  @media (max-width: 768px) {
    width: 100%;
    padding: 0 1rem;
    margin-bottom: 0.5rem;
  }
`

const CloseOverlayButton = styled.button`
  /* Match MenuPage modal close button visuals */
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
    box-shadow: 0 8px 20px rgba(0,0,0,0.35);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0) scale(0.985);
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
`

// Кнопка "крестик" для оверлея Game Over (в правом верхнем углу)
const GameOverCloseButton = styled(CloseOverlayButton)`
  position: absolute;
  top: 2rem;
  right: 2rem;
  z-index: 101;
  @media (max-width: 768px) {
    top: 1rem;
    right: 1rem;
  }
`

const ShipsGrid = styled.div`
  display: grid;
  /* фиксированное количество колонок для отображения всех кораблей в одну линию */
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  width: calc(100% - 4rem);
  margin: 0 auto;
  padding: 1rem 2rem;
  /* prevent overlay from overflowing the viewport on desktop */
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  box-sizing: border-box;

  @media (max-width: 768px) {
  grid-template-columns: 1fr;
  /* Cards should be flush to each other on mobile */
  gap: 0;
  padding: 0;
    max-height: calc(100vh - 140px);
  }
`

const ShipCard = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid ${props => props.selected ? 'var(--primary-red)' : 'rgba(255, 255, 255, 0.2)'};
  backdrop-filter: blur(10px);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    border-color: var(--primary-red);
  ${props => !props.selected && 'transform: translateY(-5px);'}
    box-shadow: 0 10px 30px rgba(209, 72, 54, 0.3);
  }
  
  ${props => props.selected && `
    background: rgba(209, 72, 54, 0.1);
    box-shadow: 0 0 30px rgba(209, 72, 54, 0.5);
  `}
  
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
      rgba(209, 72, 54, 0.1),
      transparent
    );
    animation: ${props => props.selected ? 'ship-scan 2s infinite' : 'none'};
    pointer-events: none;
  }
  
  @keyframes ship-scan {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  @media (max-width: 768px) {
  /* Make cards taller with more inner space */
  padding: 1rem 1rem 1.1rem;
  margin: 0;
    width: 100%;
    display: flex;
    text-align: left;
    align-items: flex-start;
    gap: 1rem;
  /* Ensure comfortable touch height */
  min-height: 110px;
  }
`

const ShipIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  background: ${props => props.color || 'var(--primary-red)'};
  clip-path: ${props => props.shape || 'polygon(0% 50%, 100% 0%, 100% 100%)'};
  transition: all 0.3s ease;
  border-radius: 6px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.4);

  ${ShipCard}:hover & {
    transform: scale(1.1);
    box-shadow: 0 0 30px rgba(0,0,0,0.6);
  }

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    margin: 0 auto 0.8rem;
  }
`

const ShipLeftSection = styled.div`
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 80px;
    text-align: center;
  }
`

const ShipRightSection = styled.div`
  @media (max-width: 768px) {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
`

const ShipName = styled.h3`
  font-size: 1.5rem;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);

  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 0;
    text-align: center;
  }
`

const ShipStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    gap: 0.4rem;
    margin-bottom: 0.6rem;
  }
`

const StatBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`

const StatValue = styled.div`
  display: flex;
  gap: 6px;

  span {
    width: 12px;
    height: 12px;
    background: ${props => props.filled ? (props.color || 'var(--primary-red)') : 'rgba(255, 255, 255, 0.18)'};
    transition: all 0.3s ease;
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    gap: 3px;
    
    span {
      width: 8px;
      height: 8px;
    }
  }
`

const ShipDescription = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    font-size: 0.7rem;
    line-height: 1.2;
    margin-bottom: 0.6rem;
  }
`

const SelectButton = styled.button`
  padding: 0.8rem 2rem;
  border: 2px solid var(--primary-red);
  background: ${props => props.selected ? 'var(--primary-red)' : 'transparent'};
  color: ${props => props.selected ? 'white' : 'var(--primary-red)'};
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: all 0.3s ease;
  cursor: pointer;
  outline: none;
  /* Avoid minor overflow due to border/padding on narrow screens */
  box-sizing: border-box;
  display: block;
  width: 100%;
  
  &:hover {
    background: var(--primary-red);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(209, 72, 54, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
  width: 100%;
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem;
    margin-top: auto;
  }
`

const StartGameButton = styled.button`
  margin-top: 3rem;
  padding: 1rem 3rem;
  border: 2px solid var(--primary-red);
  background: var(--primary-red);
  color: white;
  font-size: 1.3rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: all 0.3s ease;
  cursor: pointer;
  outline: none;
  opacity: ${props => props.disabled ? 0.5 : 1};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};
  
  &:hover {
    background: rgba(209, 72, 54, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(209, 72, 54, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    width: 90%;
    padding: 0.9rem 1rem;
    font-size: 1.1rem;
    margin-top: 1.5rem;
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
  // Таблица рекордов и сохранение
  const [topScores, setTopScores] = useState([])
  const [initials, setInitials] = useState(['A','A','A'])
  const [saving, setSaving] = useState(false)
  const [saveDone, setSaveDone] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [activeInitial, setActiveInitial] = useState(0)
  const gameOverRef = useRef(null)
  
  // Состояния для выбора корабля
  const [showShipSelection, setShowShipSelection] = useState(true)
  // По умолчанию корабль не выбран
  const [selectedShipType, setSelectedShipType] = useState(null)
  
  // Конфигурации кораблей (визуальный порядок: Синий, Фиолетовый, Зеленый, Красный)
  const shipTypes = {
    cruiser: {
      name: 'Крейсер',
      description: 'Прочный корабль, но со слабым вооружением',
      shape: 'polygon(0% 50%, 90% 20%, 100% 35%, 100% 65%, 90% 80%)',
      stats: { health: 4, fireRate: 1 },
      color: '#4169E1', // Синий
      trail: { length: 8, width: 4 }
    },
    stealth: {
      name: 'Хардкор',
      description: 'Экстремальный вызов для опытных игроков',
      shape: 'polygon(0% 50%, 80% 30%, 100% 40%, 100% 60%, 80% 70%)',
      stats: { health: 1, fireRate: 1 },
      color: '#8A2BE2', // Фиолетовый
  trail: { length: 10, width: 2 }
    },
    scout: {
      name: 'Разведчик',
      description: 'Лучшее вооружение, но слабая броня',
      shape: 'polygon(0% 50%, 100% 0%, 80% 50%, 100% 100%)',
      stats: { health: 1, fireRate: 5 },
      color: '#32CD32', // Зеленый
      trail: { length: 15, width: 2 }
    },
    interceptor: {
      name: 'Перехватчик',
      description: 'Сбалансированный корабль',
      shape: 'polygon(0% 50%, 100% 0%, 100% 100%)',
      stats: { health: 2, fireRate: 3 },
      color: '#D14836', // Красный
      trail: { length: 12, width: 3 }
    }
  }
  
  // Игровые объекты
  const gameObjects = useRef({
    player: {
      x: 0,
      y: 0,
      width: 16, // Будет обновлен при выборе корабля
      height: 24, // Будет обновлен при выборе корабля
      speed: 15, // Увеличена скорость для более быстрого следования за мышкой
      type: null, // Тип корабля
      fireRate: 3, // Скорострельность
      bulletSpeed: 3, // Скорость пуль
      bulletDamage: 1, // Урон пуль
      lastShot: 0, // Время последнего выстрела
  // Стелс удален для режима "Хардкор"
    },
    bullets: [],
    enemies: [],
    particles: [],
    shipTrail: [] // Массив точек трейла корабля
  })

  // Функция выбора корабля
  const selectShip = (shipType) => {
    console.log('🚢 Selecting ship:', shipType)
    setSelectedShipType(shipType)
  }

  // Функция начала игры с выбранным кораблем
  const startGameWithShip = () => {
    const shipType = selectedShipType || 'interceptor' // По умолчанию перехватчик
    const shipConfig = shipTypes[shipType]
    const stats = shipConfig.stats
    
    // Получаем размеры канваса для правильного позиционирования
    const canvas = canvasRef.current
    const playerX = canvas ? canvas.width / 2 : 400
    const playerY = canvas ? canvas.height - 80 : 500
    
    // Полностью пересоздаем объект игрока для сброса всех визуальных свойств
    gameObjects.current.player = {
      x: playerX,
      y: playerY,
      width: 24,
      height: 32,
      speed: 15,
      type: shipType,
      fireRate: stats.fireRate,
      bulletSpeed: 3,
      bulletDamage: 1,
      lastShot: 0,
  // Стелс удален для режима "Хардкор"
      color: shipConfig.color,
      visualProps: null // Сбрасываем визуальные свойства
    }

    console.log('🚀 Ship selected:', shipType, shipConfig, 'Position:', { x: playerX, y: playerY })

    // Устанавливаем жизни игрока из конфигурации выбранного корабля
    setLives(stats.health || 2)

    setShowShipSelection(false)
    setGameInitialized(true)

    // Запускаем игру
    initializeGame()
  }

  // Функция инициализации игры (вынесем отдельно)
  const initializeGame = () => {
    console.log('🎮 Initializing game with ship:', selectedShipType)
    // Инициализация canvas и игрового цикла будет здесь
  }

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
      console.log('ℹ️ SpaceInvadersPage: No animation data found - showing ship selection')
      // Не устанавливаем visualProps здесь, они будут установлены при начале игры
      
      // Показываем выбор корабля перед стартом
      setShowShipSelection(true)
      setGameInitialized(false)
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

    // Запускаем игровой цикл только если игра инициализирована и корабль выбран
    // (может быть задержано из-за анимации курсора)
    if (gameInitialized && !shipAnimating && !showShipSelection) {
      console.log('🎮 SpaceInvadersPage: Starting game loop immediately')
      startGameLoop(ctx)
      spawnEnemies()
    } else {
      console.log('⏳ SpaceInvadersPage: Game loop delayed', {
        gameInitialized,
        shipAnimating,
        showShipSelection
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
    if (gameInitialized && !shipAnimating && !showShipSelection && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      console.log('🎮 SpaceInvadersPage: Game initialization triggered, starting game loop')
      startGameLoop(ctx)
      spawnEnemies()
    }
  }, [gameInitialized, shipAnimating, showShipSelection])

  // Загрузка Топ-10 и подготовка ввода инициалов при окончании игры
  useEffect(() => {
    if (gameState === 'gameOver') {
      setSaving(false)
      setSaveDone(false)
      setSaveError('')
      setActiveInitial(0)
      fetchTopScores(10).then(setTopScores).catch(() => {})
      // Фокус на оверлее для перехвата стрелок
      setTimeout(() => {
        if (gameOverRef.current) gameOverRef.current.focus()
      }, 0)
    }
  }, [gameState])

  const handleInitialsKeyDown = useCallback((e) => {
    if (gameState !== 'gameOver') return
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const isForbiddenName = (name) => {
      const n = String(name).toUpperCase()
      const forbidden = ['HUY','HUI','XUI','XUY','XYI','BLY','EBA','LOH','LOX']
      return forbidden.includes(n)
    }
    const rotate = (i, delta) => {
      setInitials(prev => {
        const pos = letters.indexOf(prev[i])
        const next = letters[(pos + delta + letters.length) % letters.length]
        const copy = [...prev]
        copy[i] = next
        return copy
      })
    }
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        setActiveInitial(prev => Math.max(0, prev - 1))
        break
      case 'ArrowRight':
        e.preventDefault()
        setActiveInitial(prev => Math.min(2, prev + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        rotate(activeInitial, +1)
        break
      case 'ArrowDown':
        e.preventDefault()
        rotate(activeInitial, -1)
        break
      case 'Enter':
        e.preventDefault()
        // Нажать сохранить, если доступно
        if (!saving && !saveDone) {
          if (score <= 0) {
            setSaveError('Счет 0 не сохраняется')
            return
          }
          const name = initials.join('')
          if (isForbiddenName(name)) {
            setSaveError('ты думаешь это правда смешно?')
            return
          }
          const ship = gameObjects.current.player.type || 'unknown'
          setSaving(true); setSaveError('')
          Promise.resolve()
            .then(() => saveScore({ name, ship, score }))
            .then(() => setSaveDone(true))
            .then(() => fetchTopScores(10).then(setTopScores))
            .catch((err) => {
              const msg = (err && err.message === 'FORBIDDEN_NAME') ? 'ты думаешь это правда смешно?' : 'Не удалось сохранить. Попробуйте позже.'
              setSaveError(msg)
            })
            .finally(() => setSaving(false))
        }
        break
    }
  }, [activeInitial, gameState, initials, saveDone, saving, score])

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
        const player = gameObjects.current.player
        const playerWidth = player.width || 16
        const minX = playerWidth / 2
        const maxX = canvas.width - playerWidth / 2
        
        // Более быстрое и плавное движение за мышкой
        const targetX = Math.max(minX, Math.min(maxX, e.clientX))
        const speed = player.speed || 15
        const diff = targetX - player.x
        
        // Увеличена чувствительность и плавность движения
        const lerpFactor = 0.3 // Фактор интерполяции для плавности
        const maxMoveDistance = speed * 2 // Максимальное расстояние за кадр
        
        if (Math.abs(diff) > maxMoveDistance) {
          player.x += Math.sign(diff) * maxMoveDistance
        } else {
          // Плавная интерполяция к целевой позиции
          player.x += diff * lerpFactor
        }
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
  // Space key no longer triggers any ability
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

  // Обновление трейла корабля
  const updateShipTrail = () => {
    const { player, shipTrail } = gameObjects.current
    
    // Получаем настройки трейла для текущего корабля
    const shipConfig = player.type ? shipTypes[player.type] : null
    const trailLength = shipConfig?.trail?.length || 12
    const trailFadeSpeed = 20 // Скорость исчезновения
    
    // Добавляем новую точку трейла в текущую позицию игрока
    shipTrail.push({
      x: player.x,
      y: player.y + 8, // Немного позади корабля
      opacity: 1.0,
      age: 0
    })
    
    // Обновляем существующие точки трейла
    for (let i = shipTrail.length - 1; i >= 0; i--) {
      const point = shipTrail[i]
      point.age++
      point.opacity = Math.max(0, 1.0 - point.age / trailFadeSpeed)
      
      // Удаляем старые точки
      if (point.opacity <= 0) {
        shipTrail.splice(i, 1)
      }
    }
    
    // Ограничиваем количество точек трейла в зависимости от корабля
    if (shipTrail.length > trailLength + 5) {
      shipTrail.splice(0, shipTrail.length - (trailLength + 5))
    }
  }

  // Обновление игровой логики
  const updateGame = () => {
    if (gameStateRef.current !== 'playing') {
      console.log('🚫 updateGame blocked, gameState:', gameStateRef.current)
      return
    }
    
    const { player, bullets, enemies, shipTrail } = gameObjects.current
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Обновляем трейл корабля
    updateShipTrail()
    
    // Стрельба с учетом характеристик корабля
    const currentTime = Date.now()
    const timeSinceLastShot = currentTime - player.lastShot
    const fireInterval = 1000 / (player.fireRate || 3) // Интервал между выстрелами
    
    // Автоматическая стрельба: корабль стреляет сам с интервалом, зависящим от характеристики fireRate
    if (timeSinceLastShot >= fireInterval) {
      // Создаем пулю с характеристиками корабля
      const bulletSpeed = player.bulletSpeed || 8
      const bulletDamage = player.bulletDamage || 1

      bullets.push({
        x: player.x,
        y: player.y - 10,
        width: 3,
        height: 10,
        speed: bulletSpeed,
        damage: bulletDamage,
        color: player.color || '#FFD700' // Цвет пули соответствует кораблю
      })

      player.lastShot = currentTime
    }
    
  // Особые способности отключены для "Хардкор"
    
    // Обновляем пули
    gameObjects.current.bullets = bullets.filter(bullet => {
      bullet.y -= bullet.speed
      return bullet.y > -10
    })
    
    // Обновляем врагов с уникальным поведением для каждого типа
    enemies.forEach(enemy => {
      // Базовое движение вниз
      enemy.y += enemy.speed
      
      // Уникальное поведение для каждого типа
      switch (enemy.type) {
        case 'fast':
          // Быстрые враги просто движутся прямо вниз
          break
          
        case 'tank':
          // Медленные танки слегка покачиваются
          enemy.x += Math.sin(enemy.y * 0.02) * 0.5
          break
          
        case 'zigzag':
          // Зигзаг движение (сглаженное и замедленное)
          enemy.zigzagTimer++
          if (enemy.zigzagTimer >= enemy.zigzagChangeInterval) {
            enemy.zigzagDirection *= -1 // Меняем направление
            enemy.zigzagTimer = 0
            // Увеличен интервал смены направления для меньшей резкости
            enemy.zigzagChangeInterval = 45 + Math.random() * 60 // 45-105 кадров
          }

          // Плавное горизонтальное движение: применяем демпфирование
          const zigzagDamping = 0.6
          enemy.x += enemy.speedX * enemy.zigzagDirection * zigzagDamping

          // Отражаем от границ экрана для зигзага
          if (enemy.x <= enemy.width/2 || enemy.x >= canvas.width - enemy.width/2) {
            enemy.zigzagDirection *= -1
          }
          break
      }
      
      // Ограничиваем всех врагов границами экрана
      enemy.x = Math.max(enemy.width/2, Math.min(canvas.width - enemy.width/2, enemy.x))
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
    
    // Рисуем игрока только если он видим
    if (playerVisible) {
      // Сохраняем текущий контекст для применения трансформаций
      ctx.save()
      
      // Применяем трансформации относительно центра корабля
      ctx.translate(player.x, player.y)
      
      // Применяем визуальные свойства анимации если они есть
      const visualProps = player.visualProps
      if (visualProps) {
        // Устанавливаем прозрачность
        ctx.globalAlpha = visualProps.opacity || 1
        
        // Применяем масштаб
        ctx.scale(visualProps.scale || 1, visualProps.scale || 1)
        
        // Применяем поворот (анимационный)
        ctx.rotate((visualProps.rotation || 0) * Math.PI / 180)
      } else {
        // Для обычной игры: поворачиваем корабль на 90 градусов (направляем вверх)
        ctx.rotate(90 * Math.PI / 180)
      }
      
      ctx.translate(-player.x, -player.y)
      
      // Добавляем красное свечение при низких жизнях
      if (lives <= 1) {
        ctx.shadowColor = '#FF4444'
        ctx.shadowBlur = 15
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      }
      
  // Невидимость отключена для режима "Хардкор"
      
      // Цвет корабля зависит от типа
      const shipColor = player.color || '#D14836'
      ctx.fillStyle = shipColor
      ctx.beginPath()
      
      // Размеры корабля
      const width = player.width || 16
      const height = player.height || 24
      
      // Рисуем корабль в зависимости от типа
      if (player.type && shipTypes[player.type]) {
        const shipConfig = shipTypes[player.type]
        drawShipShape(ctx, player.x, player.y, width, height, player.type)
      } else {
        // Стандартный треугольник (как курсор)
        ctx.moveTo(player.x - width/2, player.y) // Левая вершина
        ctx.lineTo(player.x + width/2, player.y - height/2) // Правый верх
        ctx.lineTo(player.x + width/2, player.y + height/2) // Правый низ
        ctx.closePath()
      }
      
      ctx.fill()
      
      // Сбрасываем тень
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      
      // Восстанавливаем контекст
      ctx.restore()
    }
  }

  // Функция для рисования разных форм кораблей
  const drawShipShape = (ctx, x, y, width, height, shipType) => {
    const halfWidth = width / 2
    const halfHeight = height / 2
    
    switch (shipType) {
      case 'scout': // Стрела
        ctx.moveTo(x - halfWidth, y)
        ctx.lineTo(x + halfWidth * 0.6, y - halfHeight * 0.6)
        ctx.lineTo(x + halfWidth * 0.8, y)
        ctx.lineTo(x + halfWidth * 0.6, y + halfHeight * 0.6)
        break
        
      case 'interceptor': // Классический треугольник
        ctx.moveTo(x - halfWidth, y)
        ctx.lineTo(x + halfWidth, y - halfHeight)
        ctx.lineTo(x + halfWidth, y + halfHeight)
        break
        
      case 'cruiser': // Крупный корабль
        ctx.moveTo(x - halfWidth, y)
        ctx.lineTo(x + halfWidth * 0.9, y - halfHeight * 0.4)
        ctx.lineTo(x + halfWidth, y - halfHeight * 0.7)
        ctx.lineTo(x + halfWidth, y + halfHeight * 0.7)
        ctx.lineTo(x + halfWidth * 0.9, y + halfHeight * 0.4)
        break
        
      case 'stealth': // Угловатый корабль
        ctx.moveTo(x - halfWidth, y)
        ctx.lineTo(x + halfWidth * 0.6, y - halfHeight * 0.6)
        ctx.lineTo(x + halfWidth, y - halfHeight * 0.4)
        ctx.lineTo(x + halfWidth, y + halfHeight * 0.4)
        ctx.lineTo(x + halfWidth * 0.6, y + halfHeight * 0.6)
        break
        
      default: // Стандартный треугольник
        ctx.moveTo(x - halfWidth, y)
        ctx.lineTo(x + halfWidth, y - halfHeight)
        ctx.lineTo(x + halfWidth, y + halfHeight)
    }
    
    ctx.closePath()
  }

  // Отрисовка трейла корабля
  const drawShipTrail = (ctx) => {
    const { shipTrail, player } = gameObjects.current
    
    if (shipTrail.length < 2) return // Нужно минимум 2 точки для линии
    
    ctx.save()
    
    // Получаем настройки трейла для текущего корабля
    const shipConfig = player.type ? shipTypes[player.type] : null
    const trailConfig = shipConfig?.trail || { length: 12, width: 3 }
    const trailColor = player.color || '#D14836'
    
    // Рисуем трейл как градиентную линию
    for (let i = 1; i < shipTrail.length; i++) {
      const currentPoint = shipTrail[i]
      const prevPoint = shipTrail[i - 1]
      
      // Создаем градиент от предыдущей точки к текущей
      const gradient = ctx.createLinearGradient(
        prevPoint.x, prevPoint.y,
        currentPoint.x, currentPoint.y
      )
      
      // Парсим цвет корабля для трейла
      let r = 209, g = 72, b = 54 // По умолчанию красный
      if (trailColor.startsWith('#')) {
        const hex = trailColor.slice(1)
        r = parseInt(hex.substr(0, 2), 16)
        g = parseInt(hex.substr(2, 2), 16)
        b = parseInt(hex.substr(4, 2), 16)
      }
      
      // Цвет трейла с прозрачностью
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${prevPoint.opacity * 0.8})`)
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${currentPoint.opacity * 0.8})`)
      
      // Рисуем линию
      ctx.strokeStyle = gradient
      ctx.lineWidth = trailConfig.width + (currentPoint.opacity * 2) // Толщина зависит от прозрачности
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(prevPoint.x, prevPoint.y)
      ctx.lineTo(currentPoint.x, currentPoint.y)
      ctx.stroke()
      
      // Добавляем светящиеся точки для большего эффекта
      ctx.fillStyle = `rgba(255, 255, 255, ${currentPoint.opacity * 0.6})`
      ctx.beginPath()
      ctx.arc(currentPoint.x, currentPoint.y, 1 + currentPoint.opacity, 0, Math.PI * 2)
      ctx.fill()
    }
    
    ctx.restore()
  }

  // Отрисовка игры
  const drawGame = (ctx) => {
    const { bullets, enemies, particles, shipTrail } = gameObjects.current
    
    // Рисуем трейл корабля (до игрока, чтобы был позади)
    drawShipTrail(ctx)
    
    // Рисуем игрока
    drawPlayer(ctx)
    
    // Рисуем пули с цветами кораблей
    bullets.forEach(bullet => {
      ctx.fillStyle = bullet.color || '#FFD700' // Используем цвет пули или золотой по умолчанию
      
      // Рисуем пулю с небольшим свечением
      ctx.shadowColor = bullet.color || '#FFD700'
      ctx.shadowBlur = 5
      ctx.fillRect(bullet.x - bullet.width/2, bullet.y, bullet.width, bullet.height)
      
      // Сбрасываем тень
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    })
    
    // Рисуем врагов с новыми типами
    enemies.forEach(enemy => {
      // Используем цвет врага из его конфигурации
      ctx.fillStyle = enemy.color
      
      // Рисуем врага в зависимости от типа
      switch (enemy.type) {
        case 'fast':
          // Быстрые враги - маленькие треугольники
          ctx.save()
          ctx.translate(enemy.x, enemy.y)
          ctx.beginPath()
          ctx.moveTo(0, -enemy.height/2)
          ctx.lineTo(-enemy.width/2, enemy.height/2)
          ctx.lineTo(enemy.width/2, enemy.height/2)
          ctx.closePath()
          ctx.fill()
          ctx.restore()
          break
          
        case 'tank':
          // Танки - большие квадраты с рамкой
          ctx.fillRect(enemy.x - enemy.width/2, enemy.y - enemy.height/2, enemy.width, enemy.height)
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.strokeRect(enemy.x - enemy.width/2, enemy.y - enemy.height/2, enemy.width, enemy.height)
          break
          
        case 'zigzag':
          // Зигзаг враги - ромбы
          ctx.save()
          ctx.translate(enemy.x, enemy.y)
          ctx.rotate(Math.PI / 4) // Поворачиваем на 45 градусов
          ctx.fillRect(-enemy.width/2, -enemy.height/2, enemy.width, enemy.height)
          ctx.restore()
          break
      }
      
      // Показываем здоровье для врагов с несколькими HP
      if (enemy.health > 1 && enemy.health < enemy.maxHealth) {
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(enemy.health.toString(), enemy.x, enemy.y - enemy.height/2 - 5)
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
    
    // Выбираем тип врага: 60% Tank, 20% Fast, 20% Zigzag
    const rand = Math.random()
    let enemyType
    if (rand < 0.6) {
      enemyType = 'tank'
    } else if (rand < 0.8) {
      enemyType = 'fast'
    } else {
      enemyType = 'zigzag'
    }
    
    // Конфигурация для каждого типа врага
    const enemyConfigs = {
      fast: {
        width: 20,        // Увеличено с 15 до 20
        height: 20,       // Увеличено с 15 до 20
        speed: 3,         // Уменьшено с 4 до 3
        speedX: 0,
        health: 1,
        color: '#FF4444', // Красный
        points: 15
      },
      tank: {
        width: 35,
        height: 35,
        speed: 1,
        speedX: 0,
    health: 3,
        color: '#4169E1', // Синий
        points: 50
      },
      zigzag: {
        width: 20,
        height: 20,
  speed: 1.6,
  speedX: 1.6, // Чуть побыстрее зигзага
        health: 2,
        color: '#32CD32', // Зеленый
        points: 25
      }
    }
    
    const config = enemyConfigs[enemyType]
    
    const enemy = {
      x: Math.random() * (canvas.width - config.width) + config.width / 2,
      y: -config.height,
      width: config.width,
      height: config.height,
      speed: config.speed,
      speedX: config.speedX,
      type: enemyType,
      health: config.health,
      maxHealth: config.health,
      color: config.color,
      points: config.points,
      // Специальные свойства для зигзага
      zigzagDirection: Math.random() > 0.5 ? 1 : -1,
      zigzagTimer: 0,
      zigzagChangeInterval: 30 + Math.random() * 30 // 30-60 кадров до смены направления
    }
    
    gameObjects.current.enemies.push(enemy)
    
    console.log('✅ New enemy spawned:', { 
      type: enemyType, 
      position: { x: enemy.x, y: enemy.y },
      health: enemy.health,
      totalEnemies: gameObjects.current.enemies.length,
      gameState: gameStateRef.current
    })
    
    logger.particles('Enemy spawned', { type: enemyType, position: { x: enemy.x, y: enemy.y } })
  }

  // Проверка коллизий пуль с врагами
  const checkCollisions = () => {
    const { bullets, enemies } = gameObjects.current
    
    // Используем обратный цикл для безопасного удаления элементов
    for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
      const bullet = bullets[bulletIndex]
      
      for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
        const enemy = enemies[enemyIndex]
        
        if (
          bullet.x < enemy.x + enemy.width/2 &&
          bullet.x + bullet.width > enemy.x - enemy.width/2 &&
          bullet.y < enemy.y + enemy.height/2 &&
          bullet.y + bullet.height > enemy.y - enemy.height/2
        ) {
          // Попадание! Используем урон пули
          const damage = bullet.damage || 1
          enemy.health -= damage
          bullets.splice(bulletIndex, 1)
          
          if (enemy.health <= 0) {
            // Создаем частицы взрыва
            createExplosionParticles(enemy.x, enemy.y, enemy.type)
            
            enemies.splice(enemyIndex, 1)
            // Используем очки из конфигурации врага
            setScore(prev => prev + enemy.points)
            
            logger.particles('Enemy destroyed', { 
              type: enemy.type, 
              scoreGained: enemy.points,
              damage: damage
            })
          }
          
          break // Выходим из цикла врагов, так как пуля уже попала
        }
      }
    }
  }

  // Проверка коллизий врагов с игроком
  const checkPlayerCollisions = () => {
    const { player, enemies } = gameObjects.current
  // Невидимость отключена: всегда проверяем столкновения
    
    // Используем обратный цикл для безопасного удаления элементов
    for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      const enemy = enemies[enemyIndex]
      
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
    }
  }

  // Рестарт игры
  const restartGame = () => {
    logger.navigation('Restarting game')
    
    // Сброс состояния игры в начале для корректной работы
    setGameState('playing')
    gameStateRef.current = 'playing' // Синхронно устанавливаем ref
    setScore(0)
    setLives(3)
    
    // Возвращаемся к выбору корабля
    setShowShipSelection(true)
    setSelectedShipType(null)
    setGameInitialized(false)
    
    console.log('🔄 Restarting game, returning to ship selection')
    
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
    gameObjects.current.shipTrail = [] // Очищаем трейл корабля
    
    // Сброс игрока к базовым настройкам
    gameObjects.current.player = {
      x: 0,
      y: 0,
      width: 16,
      height: 24,
      speed: 15, // Увеличенная скорость как в оригинале
      type: null,
      fireRate: 3,
      bulletSpeed: 3,
      bulletDamage: 1,
      lastShot: 0,
  // Стелс удален для режима "Хардкор"
      visualProps: null // Сбрасываем визуальные свойства
    }
    
    // Очищаем канвас
    const canvas = canvasRef.current
    if (canvas) {
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

  // Создание частиц взрыва для новых типов врагов
  const createExplosionParticles = (x, y, enemyType) => {
    // Конфигурация частиц для каждого типа врага
    const particleConfigs = {
      fast: { count: 6, color: '#FF4444', size: 1.5 },    // Мало красных частиц
      tank: { count: 15, color: '#4169E1', size: 3 },     // Много больших синих частиц
      zigzag: { count: 10, color: '#32CD32', size: 2 }    // Средне зеленых частиц
    }
    
    const config = particleConfigs[enemyType] || particleConfigs.fast
    
    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 / config.count) * i + Math.random() * 0.5
      const speed = 2 + Math.random() * 3
      
      gameObjects.current.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: config.size + Math.random() * 2,
        color: config.color,
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
      
      {/* Красный overlay при критично низких жизнях */}
      <LowHealthOverlay visible={lives <= 1 && gameState === 'playing'} />
      
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
        <div style={{ 
          color: lives <= 1 ? '#FF4444' : 'white',
          textShadow: lives <= 1 ? '0 0 10px #FF4444, 0 0 20px #FF4444' : '0 2px 10px rgba(0, 0, 0, 0.8)',
          fontWeight: lives <= 1 ? 'bold' : 'normal'
        }}>
          Жизни: {lives}
        </div>
        {gameObjects.current.player.type && (
          <div style={{ 
            fontSize: '0.9em', 
            marginTop: '0.3rem',
            color: gameObjects.current.player.color || '#D14836',
            textShadow: `0 0 10px ${gameObjects.current.player.color || '#D14836'}`
          }}>
            {shipTypes[gameObjects.current.player.type]?.name}
          </div>
        )}
        <div style={{ fontSize: '0.8em', marginTop: '0.5rem', opacity: 0.7 }}>
          Зажми и двигай для управления
        </div>
      </GameUI>
      
            {gameState === 'playing' && !showShipSelection && (
        <ExitHint>
          Стрелочка справа или Escape для выхода
        </ExitHint>
      )}
      
  {gameState === 'playing' && !showShipSelection && (
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
      
      {showShipSelection && (
        <ShipSelectionOverlay>
          <ShipSelectionHeader>
            <ShipSelectionTitle>Выберите корабль</ShipSelectionTitle>
            <CloseOverlayButton
              aria-label="Закрыть"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                exitGame();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                exitGame();
              }}
            >
              ✕
            </CloseOverlayButton>
          </ShipSelectionHeader>
          <ShipsGrid>
            {Object.keys(shipTypes).map(key => {
              const s = shipTypes[key]
              return (
                <ShipCard
                  key={key}
                  selected={selectedShipType === key}
                  onClick={(e) => {
                    // Проверяем, что клик не был по кнопке
                    if (e.target.tagName !== 'BUTTON') {
                      selectShip(key);
                    }
                  }}
                  onTouchEnd={(e) => {
                    // Позволяем выбирать корабль простым тапом по карточке
                    e.preventDefault();
                    e.stopPropagation();
                    selectShip(key);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectShip(key);
                    }
                  }}
                  data-card-index={key}
                >
                  <ShipLeftSection>
                    <ShipIcon shape={s.shape} color={s.color} />
                    <ShipName>{s.name}</ShipName>
                  </ShipLeftSection>
                  <ShipRightSection>
                    <ShipDescription>{s.description}</ShipDescription>
                    <ShipStats>
                      <StatBar>Жизни <StatValue color={s.color}>{Array.from({length: Math.max(1, s.stats.health)}).map((_, i) => <span key={i} />)}</StatValue></StatBar>
                      <StatBar>Оружие <StatValue color={s.color}>{Array.from({length: Math.max(1, s.stats.fireRate)}).map((_, i) => <span key={i} />)}</StatValue></StatBar>
                    </ShipStats>
                    <SelectButton 
                      selected={selectedShipType === key} 
                      onClick={(e) => {
                        e.stopPropagation();
                        selectShip(key);
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        selectShip(key);
                      }}
                    >
                      {selectedShipType === key ? 'ВЫБРАН' : 'ВЫБРАТЬ'}
                    </SelectButton>
                  </ShipRightSection>
                </ShipCard>
              )
            })}
          </ShipsGrid>
          <StartGameButton 
            onClick={(e) => {
              e.preventDefault();
              console.log('🎮 Start game button clicked, selected ship:', selectedShipType);
              startGameWithShip();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎮 Start game button touched, selected ship:', selectedShipType);
              if (selectedShipType) {
                startGameWithShip();
              }
            }}
            disabled={!selectedShipType}
          >
            Начать
          </StartGameButton>
        </ShipSelectionOverlay>
      )}
      {gameState === 'gameOver' && (
        <GameOverOverlay
          tabIndex={-1}
          ref={gameOverRef}
          onKeyDown={handleInitialsKeyDown}
        >
          <GameOverCloseButton
            aria-label="Закрыть"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              exitGame();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              exitGame();
            }}
          >
            ✕
          </GameOverCloseButton>
          <GameOverTitle>GAME OVER</GameOverTitle>
          <FinalScore>Финальный счет: {score}</FinalScore>
          {/* Ввод и сохранение инициалов + действия справа */}
          <GameOverActionRow>
            <InitialsRow>
              {[0,1,2].map(i => (
                <InitialsColumn key={i} $active={i === activeInitial}>
                  <ArrowButton
                    type="button"
                    onClick={() => {
                      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                      setInitials(prev => {
                        const pos = letters.indexOf(prev[i]);
                        const next = letters[(pos + 1) % letters.length];
                        const copy = [...prev];
                        copy[i] = next; return copy;
                      })
                    }}
                    aria-label={`Буква ${i+1} вверх`}
                  >▲</ArrowButton>
                  <InitialLetter>{initials[i]}</InitialLetter>
                  <ArrowButton
                    type="button"
                    onClick={() => {
                      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                      setInitials(prev => {
                        const pos = letters.indexOf(prev[i]);
                        const next = letters[(pos - 1 + letters.length) % letters.length];
                        const copy = [...prev];
                        copy[i] = next; return copy;
                      })
                    }}
                    aria-label={`Буква ${i+1} вниз`}
                  >▼</ArrowButton>
                </InitialsColumn>
              ))}
            </InitialsRow>
            <RightActions>
              <GameOverButton
                onClick={async () => {
                  if (score <= 0) {
                    setSaveError('Счет 0 не сохраняется')
                    return
                  }
                  try {
                    setSaving(true); setSaveError('')
                    const name = initials.join('')
                    const upper = name.toUpperCase()
                    const forbidden = ['HUY','HUI','XUI','XUY','XYI','BLY','EBA','LOH','LOX']
                    if (forbidden.includes(upper)) {
                      setSaving(false)
                      setSaveError('ты думаешь это правда смешно?')
                      return
                    }
                    const ship = gameObjects.current.player.type || 'unknown'
                    await saveScore({ name, ship, score })
                    setSaveDone(true)
                    const items = await fetchTopScores(10)
                    setTopScores(items)
                  } catch (e) {
                    const msg = (e && e.message === 'FORBIDDEN_NAME') ? 'ты думаешь это правда смешно?' : 'Не удалось сохранить. Попробуйте позже.'
                    setSaveError(msg)
                  } finally { setSaving(false) }
                }}
                disabled={saving || saveDone || score <= 0}
                style={{ opacity: (saving || saveDone || score <= 0) ? 0.6 : 1 }}
              >
                {saveDone ? 'СОХРАНЕНО' : (saving ? 'СОХРАНЕНИЕ…' : 'СОХРАНИТЬ СЧЕТ')}
              </GameOverButton>
              <ButtonsColumn>
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
              </ButtonsColumn>
            </RightActions>
          </GameOverActionRow>
          {saveError && <div style={{ color: 'var(--primary-red)', marginBottom: '1rem' }}>{saveError}</div>}


          {/* Таблица Топ-10 */}
          <div style={{ width: 'min(600px, 90vw)', margin: '0 auto 2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', gap: '8px', color: '#fff', opacity: 0.9, marginBottom: 8 }}>
              <div>#</div>
              <div>Имя</div>
              <div>Корабль</div>
              <div>Счет</div>
            </div>
            <div style={{ display: 'grid', rowGap: '6px' }}>
              {topScores.map((row, idx) => (
                <div key={`${row.name}-${row.score}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr', gap: '8px', color: '#ddd' }}>
                  <div>{idx + 1}</div>
                  <div>{row.name}</div>
                  <div>{shipTypes[row.ship]?.name || row.ship}</div>
                  <div>{row.score}</div>
                </div>
              ))}
            </div>
          </div>
          
        </GameOverOverlay>
      )}
    </GameContainer>
  )
}

export default SpaceInvadersPage