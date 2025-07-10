import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import logger from '../utils/Logger'

const useParticleControl = (camera, isEnabled = true, sensitivity = { wheel: 0.002, touch: 0.005 }) => {
  const rotationRef = useRef({ x: 0, y: 0 })
  const isInteractingRef = useRef(false)

  useEffect(() => {
    if (!camera || !isEnabled) return

    logger.particles('Particle control enabled', { 
      sensitivity,
      cameraPosition: camera.position,
      cameraRotation: camera.rotation 
    })

    // Обработчик колеса мыши для вращения частиц
    const handleWheel = (e) => {
      e.preventDefault()
      if (!camera) return

      const { wheel } = sensitivity
      rotationRef.current.x += e.deltaY * wheel
      rotationRef.current.y += e.deltaX * wheel

      logger.touch('Wheel interaction', { 
        deltaY: e.deltaY, 
        deltaX: e.deltaX,
        newRotation: rotationRef.current 
      })

      // Анимируем вращение частиц
      gsap.to(camera.rotation, {
        x: rotationRef.current.x,
        y: rotationRef.current.y,
        duration: 0.5,
        ease: "power2.out"
      })
    }

    // Обработчик движения мыши для вращения частиц
    const handleMouseMove = (e) => {
      if (!camera || isInteractingRef.current) return

      // Вращение на основе позиции мыши (более мягкое)
      const mouseX = (e.clientX / window.innerWidth) * 2 - 1
      const mouseY = -(e.clientY / window.innerHeight) * 2 + 1

      const targetRotationX = mouseY * 0.1
      const targetRotationY = mouseX * 0.1

      // Плавное следование за мышью
      gsap.to(camera.rotation, {
        x: targetRotationX,
        y: targetRotationY,
        duration: 2,
        ease: "power1.out"
      })
    }

    // Обработчики touch-событий для мобильных
    let touchStartY = 0
    let touchStartX = 0

    const handleTouchStart = (e) => {
      if (!camera) return
      
      touchStartY = e.touches[0].clientY
      touchStartX = e.touches[0].clientX
      isInteractingRef.current = true

      logger.touch('Touch start for particle control', { 
        x: touchStartX, 
        y: touchStartY 
      })
    }

    const handleTouchMove = (e) => {
      if (!camera || !isInteractingRef.current) return

      // Проверяем, что это не горизонтальный свайп для навигации
      const touchY = e.touches[0].clientY
      const touchX = e.touches[0].clientX
      const deltaY = touchStartY - touchY
      const deltaX = touchStartX - touchX

      // Если горизонтальное движение больше вертикального, не управляем частицами
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
        return
      }

      e.preventDefault()

      const { touch } = sensitivity
      rotationRef.current.x += deltaY * touch
      rotationRef.current.y += deltaX * touch

      logger.touch('Touch move for particle control', { 
        deltaY, 
        deltaX,
        newRotation: rotationRef.current 
      })

      // Плавное вращение при свайпе
      gsap.to(camera.rotation, {
        x: rotationRef.current.x,
        y: rotationRef.current.y,
        duration: 0.3,
        ease: "power2.out"
      })

      touchStartY = touchY
      touchStartX = touchX
    }

    const handleTouchEnd = () => {
      isInteractingRef.current = false
      logger.touch('Touch end for particle control')
    }

    // Добавляем обработчики
    document.addEventListener('wheel', handleWheel, { passive: false })
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('touchstart', handleTouchStart, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      logger.particles('Particle control disabled')
      document.removeEventListener('wheel', handleWheel)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [camera, isEnabled, sensitivity])

  // Функция для сброса вращения
  const resetRotation = () => {
    if (!camera) return

    logger.particles('Resetting particle rotation')
    
    rotationRef.current = { x: 0, y: 0 }
    gsap.to(camera.rotation, {
      x: 0,
      y: 0,
      duration: 1,
      ease: "power2.out"
    })
  }

  // Функция для установки конкретного вращения
  const setRotation = (x, y) => {
    if (!camera) return

    logger.particles('Setting particle rotation', { x, y })
    
    rotationRef.current = { x, y }
    gsap.to(camera.rotation, {
      x,
      y,
      duration: 0.5,
      ease: "power2.out"
    })
  }

  return {
    resetRotation,
    setRotation,
    currentRotation: rotationRef.current
  }
}

export default useParticleControl 