import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import { gsap } from 'gsap'

function Particles(props) {
  const ref = useRef()
  const [sphere] = useMemo(() => {
  // Адаптивное количество частиц
  const particleCount = props.particleCount || 1200
    const positions = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 1.5 + 0.3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }
    return [positions]
  }, [])

  const frameCountRef = useRef(0)
  useFrame((state, delta) => {
    if (!ref.current) return
    const { rotationSpeed = { x: 1, y: 1 }, fastRotation = false, frameSkip = 0 } = props
    // Пропуск кадров для снижения нагрузки (на мобильных)
    frameCountRef.current++
    if (frameSkip && frameCountRef.current % (frameSkip + 1) !== 0) return
    if (fastRotation) {
      ref.current.rotation.x -= delta * rotationSpeed.x
      ref.current.rotation.y -= delta * rotationSpeed.y
    } else {
      ref.current.rotation.x -= delta * (rotationSpeed.x / 15)
      ref.current.rotation.y -= delta * (rotationSpeed.y / 20)
    }
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color={props.color || "#D14836"}
          size={props.size || 0.005}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={props.opacity || 0.7}
        />
      </Points>
    </group>
  )
}

// Компонент для отрисовки серых частиц внутри области карточки проекта
const HoveredParticles = ({ hoveredRect, size, opacity, rotationSpeed, fastRotation }) => {
  const { gl, size: canvasSize } = useThree()
  const maskRect = useRef(null)

  useEffect(() => {
    if (hoveredRect) {
      maskRect.current = {
        x: hoveredRect.left,
        y: canvasSize.height - hoveredRect.bottom,
        width: hoveredRect.width,
        height: hoveredRect.height
      }
    } else {
      maskRect.current = null
    }
  }, [hoveredRect, canvasSize])

  if (!maskRect.current) return null

  return (
    <group renderOrder={1}
      onBeforeRender={(renderer) => {
        const { x, y, width, height } = maskRect.current
        const ctx = renderer.getContext()
        ctx.enable(ctx.SCISSOR_TEST)
        ctx.scissor(x, y, width, height)
      }}
      onAfterRender={(renderer) => {
        const ctx = renderer.getContext()
        ctx.disable(ctx.SCISSOR_TEST)
      }}
    >
      <Particles
        color="#000000"
        size={size}
        opacity={opacity}
        rotationSpeed={rotationSpeed}
        fastRotation={fastRotation}
      />
    </group>
  )
}

const MaskedParticles = ({ size, opacity, rotationSpeed, fastRotation }) => {
  const { gl, size: canvasSize } = useThree()
  const maskRect = useRef(null)

  useFrame(() => {
    const el = document.querySelector('.project-card')
    if (el) {
      const rect = el.getBoundingClientRect()
      maskRect.current = {
        x: rect.left,
        y: canvasSize.height - rect.bottom,
        width: rect.width,
        height: rect.height
      }
    }
  })

  if (!maskRect.current) return null
  return (
    <group renderOrder={1}
      onBeforeRender={(renderer) => {
        const { x, y, width, height } = maskRect.current
        const ctx = renderer.getContext()
        ctx.enable(ctx.SCISSOR_TEST)
        ctx.scissor(x, y, width, height)
      }}
      onAfterRender={(renderer) => {
        const ctx = renderer.getContext()
        ctx.disable(ctx.SCISSOR_TEST)
      }}
    >
      <Particles
        color="#808080" // Gray color for masked particles
        size={size}
        opacity={opacity}
        rotationSpeed={rotationSpeed}
        fastRotation={fastRotation}
      />
    </group>
  )
}
const UniversalParticles = ({ 
  isStartPage = false, 
  onCameraReady,
  particleColor = "#D14836",
  particleSize = 0.005,
  particleOpacity = 0.7,
  rotationSpeed = { x: 1, y: 1 },
  fastRotation = false,
  particlesVisible = true,
  isLightLabCase = false,
  hoveredRect
}) => {
  const containerRef = useRef(null)
  const initialCameraPosition = isStartPage ? [0, 0, 0.2] : [0, 0, 1]
  const initialFOV = isStartPage ? 90 : 75
  const isMobile = useMemo(() => typeof window !== 'undefined' && (window.innerWidth <= 820 || 'ontouchstart' in window), [])
  // Понижаем нагрузку на мобильных: меньше частиц, пропуск кадров
  const mobileParticleFactor = 0.5 // 50% частиц
  const baseParticleCount = 1200
  const effectiveParticleCount = isMobile ? Math.round(baseParticleCount * mobileParticleFactor) : baseParticleCount
  const frameSkip = isMobile ? 1 : 0 // ~30fps на мобильных
  
  // Анимация появления частиц
  useEffect(() => {
    if (containerRef.current) {
      if (particlesVisible) {
        // Анимация появления
        gsap.fromTo(containerRef.current, 
          {
            opacity: 0
          },
          {
            opacity: 1,
            duration: 4,
            ease: "power2.out"
          }
        )
      } else {
        // Скрываем частицы
        gsap.set(containerRef.current, { opacity: 0 })
      }
    }
  }, [particlesVisible])

  return (
    <>
      {/* Фон - черный для обычных страниц, белый для LightLab кейса */}
      <div className="background-fullscreen" style={{
        background: isLightLabCase ? '#ffffff' : '#000'
      }} />
      
      {/* Частицы - полный экран включая safe area */}
      <div 
        ref={containerRef}
        className={`particles-fullscreen ${isStartPage ? "start-particles-container" : "particle-background"}`}
        style={{ opacity: 0 }}
      >
        <Canvas 
          camera={{ 
            position: initialCameraPosition,
            fov: initialFOV
          }}
          dpr={[1, 1.5]} /* ограничение DPR снижает нагрузку */
          gl={{ powerPreference: 'low-power', antialias: false }}
          style={{ 
            pointerEvents: 'none',
            width: '100%',
            height: '100%'
          }}
          onCreated={({ camera }) => {
            if (onCameraReady) {
              onCameraReady({ camera })
            }
          }}
        >
          {/* Первый проход: цветные частицы */}
          <Particles
            color={particleColor}
            size={particleSize}
            opacity={particleOpacity}
            rotationSpeed={rotationSpeed}
            fastRotation={fastRotation}
            particleCount={effectiveParticleCount}
            frameSkip={frameSkip}
          />
          {/* Черные частицы в hovered области */}
          <HoveredParticles
            hoveredRect={hoveredRect}
            size={particleSize}
            opacity={particleOpacity}
            rotationSpeed={rotationSpeed}
            fastRotation={fastRotation}
          />
          {/* Второй проход: серые частицы внутри карточки */}
          <MaskedParticles
            size={particleSize}
            opacity={particleOpacity}
            rotationSpeed={rotationSpeed}
            fastRotation={fastRotation}
          />
        </Canvas>
      </div>
    </>
  )
}

export default UniversalParticles