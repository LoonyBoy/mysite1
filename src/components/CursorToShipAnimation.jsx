import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import styled from 'styled-components'

const AnimatedTriangle = styled.div`
  position: fixed;
  z-index: 10000;
  width: 0;
  height: 0;
  border-right: 16px solid var(--primary-red);
  border-top: 12px solid transparent;
  border-bottom: 12px solid transparent;
  pointer-events: none;
  transform-origin: center;
  will-change: transform;
  mix-blend-mode: normal;
  transition: none;
  
  /* Эффект свечения для более плавного перехода */
  filter: drop-shadow(0 0 6px var(--primary-red));
  
  &.with-trail {
    /* Дополнительный эффект следа во время полета */
    box-shadow: 0 0 20px var(--primary-red);
  }
`

const CursorToShipAnimation = ({ startX, startY, targetX, targetY, onComplete }) => {
  const triangleRef = useRef(null)
  const timelineRef = useRef(null)
  const hasStarted = useRef(false)
  const isCompleted = useRef(false)

  useEffect(() => {
    const triangle = triangleRef.current
    if (!triangle) {
      console.log('🚫 CursorToShipAnimation: triangle ref not found')
      return
    }

    if (hasStarted.current) {
      console.log('⚠️ CursorToShipAnimation: Animation already started, skipping')
      return
    }

    hasStarted.current = true
    console.log('🚀 CursorToShipAnimation: Starting enhanced animation', {
      startPosition: { x: startX, y: startY },
      targetPosition: { x: targetX, y: targetY },
      distance: Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2)
    })

    // Устанавливаем начальную позицию с эффектом следа
    gsap.set(triangle, {
      x: startX,
      y: startY,
      rotation: 0,
      scale: 1.2,
      opacity: 1
    })

    // Добавляем класс для эффекта следа
    triangle.classList.add('with-trail')

    console.log('✅ CursorToShipAnimation: Initial position set with trail effect')

    const tl = gsap.timeline({
      onStart: () => {
        console.log('🎬 CursorToShipAnimation: Enhanced timeline started')
      },
      onComplete: () => {
        console.log('🏁 CursorToShipAnimation: Enhanced timeline completed')
        triangle.classList.remove('with-trail')
        isCompleted.current = true
        if (onComplete) {
          console.log('📞 CursorToShipAnimation: Calling onComplete callback')
          onComplete()
        }
      }
    })
    
    timelineRef.current = tl

    const centerX = targetX
    const centerY = targetY
    const maxRadius = Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2)
    const startAngle = Math.atan2(startY - centerY, startX - centerX)
    
    console.log('Calculated enhanced spiral trajectory', {
      center: { x: centerX, y: centerY },
      maxRadius: maxRadius,
      startAngle: startAngle * 180 / Math.PI,
      spiralTurns: 2.5
    })
    
    const totalRotation = Math.PI * 3
    const spiralData = {
      progress: 0,
      radius: maxRadius,
      angle: startAngle,
      rotation: 0,
      scale: 1.2
    }
    
    // Основная спиральная анимация с улучшенным эффектом следа
    tl.to(spiralData, {
      progress: 1,
      duration: 2.8,
      ease: "power2.inOut",
      onUpdate: function() {
        const progress = spiralData.progress
        const speedCurve = Math.sin(progress * Math.PI)
        const currentRadius = maxRadius * (1 - progress)
        const angleProgress = progress + (speedCurve * 0.3)
        const currentAngle = startAngle + totalRotation * angleProgress
        
        const x = centerX + Math.cos(currentAngle) * currentRadius
        const y = centerY + Math.sin(currentAngle) * currentRadius
        
        const rotationAngle = currentAngle * 180 / Math.PI
        
        // Плавное изменение размера с сохранением пропорций
        const cursorWidth = 16, cursorHeight = 12
        const shipWidth = 30, shipHeight = 30
        
        const currentWidth = cursorWidth + (progress * (shipWidth - cursorWidth))
        const currentHeight = cursorHeight + (progress * (shipHeight - cursorHeight))
        
        triangle.style.borderRightWidth = currentWidth + 'px'
        triangle.style.borderTopWidth = (currentHeight / 2) + 'px'
        triangle.style.borderBottomWidth = (currentHeight / 2) + 'px'
        
        // Усиленный эффект следа на высокой скорости
        const trailIntensity = speedCurve * 0.7
        const scaleX = 1.2 + (trailIntensity * 0.3)
        const scaleY = 1.2 - (trailIntensity * 0.1)
        
        gsap.set(triangle, {
          x: x,
          y: y,
          rotation: rotationAngle,
          scaleX: scaleX,
          scaleY: scaleY,
          filter: `drop-shadow(0 0 ${6 + trailIntensity * 10}px var(--primary-red))`
        })
        
        // Логирование на ключевых моментах
        if (Math.abs(progress - 0.5) < 0.02) {
          console.log('Peak speed with enhanced trail effect:', speedCurve.toFixed(3))
        }
      },
      onStart: () => console.log('Starting enhanced smooth spiral animation'),
      onComplete: () => console.log('Enhanced smooth spiral completed')
    })
    
    // Финальная корректировка с плавным переходом
    .to(triangle, {
      x: centerX,
      y: centerY,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 0.3,
      ease: "back.out(1.7)",
      onStart: () => {
        console.log('Final positioning with smooth transition')
        triangle.style.borderRightWidth = '30px'
        triangle.style.borderTopWidth = '15px'
        triangle.style.borderBottomWidth = '15px'
        triangle.style.filter = 'drop-shadow(0 0 6px var(--primary-red))'
      },
      onComplete: () => console.log('Final positioning completed with enhanced effect')
    })
    
    // Улучшенный эффект приземления
    .to(triangle, {
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 0.15,
      ease: "bounce.out",
      onStart: () => console.log('Enhanced landing effect: Bounce 1')
    })
    .to(triangle, {
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 0.15,
      ease: "bounce.out",
      onStart: () => console.log('Enhanced landing effect: Bounce 2')
    })
    
    // Плавное исчезновение
    .to(triangle, {
      opacity: 0,
      scale: 0.5,
      duration: 0.4,
      ease: "power3.in",
      onStart: () => {
        console.log('Final phase: Enhanced fading out')
        triangle.style.filter = 'drop-shadow(0 0 15px var(--primary-red))'
      },
      onComplete: () => console.log('Final phase: Enhanced fade out complete')
    })

    return () => {
      console.log('🧹 CursorToShipAnimation: Enhanced cleanup called', {
        hasStarted: hasStarted.current,
        isCompleted: isCompleted.current
      })
      
      if (triangle) {
        triangle.classList.remove('with-trail')
      }
      
      if (timelineRef.current && !isCompleted.current) {
        console.log('⚠️ CursorToShipAnimation: Enhanced animation not completed, keeping timeline alive')
      } else if (timelineRef.current) {
        console.log('✅ CursorToShipAnimation: Enhanced animation completed, killing timeline')
        timelineRef.current.kill()
        timelineRef.current = null
      }
    }
  }, [startX, startY, targetX, targetY, onComplete])

  return <AnimatedTriangle ref={triangleRef} />
}

export default CursorToShipAnimation