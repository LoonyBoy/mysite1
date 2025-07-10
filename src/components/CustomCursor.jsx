import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

// Глобальная функция для запуска анимации корабля
window.startShipAnimation = null

const CustomCursor = ({ color = '#D14836' }) => {
  const cursorRef = useRef(null)
  const trailRef = useRef(null)
  const mousePos = useRef({ x: 0, y: 0 })
  const cursorPos = useRef({ x: 0, y: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const animationId = useRef(null)
  const cursorState = useRef({ scaleX: 1, scaleY: 1, rotation: 0 })

  useEffect(() => {
    const cursor = cursorRef.current
    const trail = trailRef.current
    if (!cursor || !trail) return

    // Отключаем курсор на мобильных устройствах
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    if (isMobile) return

    // Создаем элемент следа
    trail.style.position = 'fixed'
    trail.style.pointerEvents = 'none'
    trail.style.zIndex = '9998'
    trail.style.mixBlendMode = 'difference'
    trail.style.opacity = '0'

    // Функция для вычисления скорости движения
    const calculateVelocity = (current, previous) => {
      return {
        x: current.x - previous.x,
        y: current.y - previous.y
      }
    }

    // Функция для обновления позиции курсора
    const updateCursor = () => {
      const prevCursorPos = { ...cursorPos.current }

      // Мгновенная синхронизация с мышью для отзывчивости
      cursorPos.current.x = mousePos.current.x
      cursorPos.current.y = mousePos.current.y
      
      // Вычисляем скорость
      velocity.current = calculateVelocity(cursorPos.current, prevCursorPos)
      
      const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.y ** 2)
      
      // Эффект "огненного шара" (растягивание)
      let targetScaleX = 1
      let targetScaleY = 1
      let targetRotation = cursorState.current.rotation

      if (speed > 1) {
        const angle = Math.atan2(velocity.current.y, velocity.current.x) * (180 / Math.PI)
        const stretchIntensity = Math.min(speed / 15, 0.6) // Увеличил чувствительность
        targetScaleX = 1 + stretchIntensity
        targetScaleY = 1 - stretchIntensity // Усилил сжатие
        targetRotation = angle
      }

      // Плавная интерполяция для мягкого перехода
      const lerpFactor = 0.2 // Увеличил скорость реакции
      cursorState.current.scaleX += (targetScaleX - cursorState.current.scaleX) * lerpFactor
      cursorState.current.scaleY += (targetScaleY - cursorState.current.scaleY) * lerpFactor

      let deltaRotation = targetRotation - cursorState.current.rotation
      if (deltaRotation > 180) deltaRotation -= 360
      if (deltaRotation < -180) deltaRotation += 360
      cursorState.current.rotation += deltaRotation * lerpFactor
      
      // Обновляем позицию и трансформацию основного курсора
      gsap.set(cursor, {
        x: cursorPos.current.x - 10,
        y: cursorPos.current.y - 10,
        rotation: cursorState.current.rotation,
        scaleX: cursorState.current.scaleX,
        scaleY: cursorState.current.scaleY,
      })
      
      // Эффект следа при быстром движении
      if (speed > 5) {
        const trailIntensity = Math.min(speed / 20, 1)
        const trailLength = Math.min(speed * 0.8, 40)
        
        // Направление следа противоположно направлению движения
        const trailX = cursorPos.current.x - (velocity.current.x * trailLength / speed)
        const trailY = cursorPos.current.y - (velocity.current.y * trailLength / speed)
        
        // Обновляем след
        gsap.set(trail, {
          x: trailX - 10,
          y: trailY - 10,
          scaleX: 1 + (trailIntensity * 0.5),
          scaleY: 1 - (trailIntensity * 0.2),
          opacity: trailIntensity * 0.6
        })
        
        // Постепенно убираем след
        gsap.to(trail, {
          opacity: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 0.3,
          ease: "power2.out"
        })
      }
      
      animationId.current = requestAnimationFrame(updateCursor)
    }

    const moveCursor = (e) => {
      mousePos.current.x = e.clientX
      mousePos.current.y = e.clientY
    }

    const handleMouseEnter = () => {
      cursor.classList.add('hover')
      trail.classList.add('hover')
    }

    const handleMouseLeave = () => {
      cursor.classList.remove('hover')
      trail.classList.remove('hover')
    }

    const handleNavigationEdgeEnter = () => {
      cursor.classList.remove('hover', 'triangle')
      cursor.classList.add('navigation')
      cursor.textContent = '>'
      trail.style.display = 'none'
      document.body.style.cursor = 'none'
    }

    const handleNavigationEdgeLeave = () => {
      cursor.classList.remove('navigation')
      cursor.textContent = ''
      trail.style.display = 'block'
      document.body.style.cursor = 'none'
    }

    const handleNavigationEdgeLeftEnter = () => {
      cursor.classList.remove('hover', 'navigation')
      cursor.classList.add('triangle')
      cursor.textContent = ''
      cursor.style.backgroundColor = 'transparent'
      trail.style.display = 'none'
      document.body.style.cursor = 'none'
    }

    const handleNavigationEdgeLeftLeave = () => {
      cursor.classList.remove('triangle')
      cursor.textContent = ''
      cursor.style.backgroundColor = color
      trail.style.display = 'block'
      document.body.style.cursor = 'none'
    }

    // Функция для запуска анимации превращения в корабль
    const startShipAnimation = () => {
      console.log('🎮 CustomCursor: startShipAnimation called')
      
      const cursorRect = cursor.getBoundingClientRect()
      const targetX = window.innerWidth / 2
      const targetY = window.innerHeight - 80
      
      const animationData = {
        startX: cursorRect.left + 8,
        startY: cursorRect.top + 10,
        targetX: targetX,
        targetY: targetY,
        active: true
      }
      
      console.log('📊 CustomCursor: Animation data prepared', {
        cursor: { x: cursorRect.left, y: cursorRect.top, width: cursorRect.width, height: cursorRect.height },
        animationData,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        shipPosition: { x: targetX, y: targetY },
        distance: Math.sqrt((targetX - animationData.startX) ** 2 + (targetY - animationData.startY) ** 2)
      })
      
      sessionStorage.setItem('cursorToShipAnimation', JSON.stringify(animationData))
      console.log('💾 CustomCursor: Animation data saved to sessionStorage')
      
      // Скрываем оригинальный курсор и след
      cursor.style.opacity = '0'
      trail.style.opacity = '0'
      console.log('👻 CustomCursor: Original cursor and trail hidden')
      
      return animationData
    }

    // Делаем функцию доступной глобально
    window.startShipAnimation = startShipAnimation

    const updateInteractiveElements = () => {
      const interactiveElements = document.querySelectorAll('a, button, [data-hover]')
      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', handleMouseEnter)
        el.addEventListener('mouseleave', handleMouseLeave)
      })
      
      const navigationEdge = document.querySelector('.navigation-edge')
      if (navigationEdge) {
        navigationEdge.addEventListener('mouseenter', handleNavigationEdgeEnter)
        navigationEdge.addEventListener('mouseleave', handleNavigationEdgeLeave)
      }

      const gameEdge = document.querySelector('.game-edge')
      if (gameEdge) {
        gameEdge.addEventListener('mouseenter', handleNavigationEdgeLeftEnter)
        gameEdge.addEventListener('mouseleave', handleNavigationEdgeLeftLeave)
      }
      
      return { interactiveElements, navigationEdge, gameEdge }
    }

    // Инициализация позиции курсора
    const initMousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    mousePos.current = initMousePos
    cursorPos.current = initMousePos

    document.addEventListener('mousemove', moveCursor)
    
    // Запускаем анимацию
    animationId.current = requestAnimationFrame(updateCursor)
    
    let { interactiveElements, navigationEdge, gameEdge } = updateInteractiveElements()
    
    const observer = new MutationObserver(() => {
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      })
      if (navigationEdge) {
        navigationEdge.removeEventListener('mouseenter', handleNavigationEdgeEnter)
        navigationEdge.removeEventListener('mouseleave', handleNavigationEdgeLeave)
      }
      if (gameEdge) {
        gameEdge.removeEventListener('mouseenter', handleNavigationEdgeLeftEnter)
        gameEdge.removeEventListener('mouseleave', handleNavigationEdgeLeftLeave)
      }
      
      const updated = updateInteractiveElements()
      interactiveElements = updated.interactiveElements
      navigationEdge = updated.navigationEdge
      gameEdge = updated.gameEdge
    })
    
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('mousemove', moveCursor)
      if (animationId.current) {
        cancelAnimationFrame(animationId.current)
      }
      observer.disconnect()
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      })
      if (navigationEdge) {
        navigationEdge.removeEventListener('mouseenter', handleNavigationEdgeEnter)
        navigationEdge.removeEventListener('mouseleave', handleNavigationEdgeLeave)
      }
      if (gameEdge) {
        gameEdge.removeEventListener('mouseenter', handleNavigationEdgeLeftEnter)
        gameEdge.removeEventListener('mouseleave', handleNavigationEdgeLeftLeave)
      }
    }
  }, [color])

  return (
    <>
      <div ref={cursorRef} className="cursor" style={{ backgroundColor: color }} />
      <div ref={trailRef} className="cursor cursor-trail" style={{ backgroundColor: color }} />
    </>
  )
}

export default CustomCursor