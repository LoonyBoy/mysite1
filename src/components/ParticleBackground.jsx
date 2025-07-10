import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'

function Particles(props) {
  const ref = useRef()
  const [sphere] = useMemo(() => {
    // Адаптивное количество частиц
    const getParticleCount = () => {
      const isMobile = window.innerWidth <= 768
      const isLowEnd = navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2
      
      if (isLowEnd) return 300
      if (isMobile) return 800
      return 2000
    }
    
    const particleCount = getParticleCount()
    const positions = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 1.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }
    return [positions]
  }, [])

  useFrame((state, delta) => {
    // Замедляем анимацию на слабых устройствах
    const isMobile = window.innerWidth <= 768
    const speedMultiplier = isMobile ? 0.5 : 1
    
    ref.current.rotation.x -= (delta / 10) * speedMultiplier
    ref.current.rotation.y -= (delta / 15) * speedMultiplier
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#D14836"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  )
}

const ParticleBackground = () => {
  return (
    <>
      {/* Черный фон - полный экран включая safe area */}
      <div className="background-fullscreen" style={{
        background: '#000'
      }} />
      
      {/* Частицы - полный экран включая safe area */}
      <div className="particles-fullscreen particle-background">
        <Canvas 
          camera={{ position: [0, 0, 1] }} // Камера дальше от частиц
          style={{ 
            pointerEvents: 'none',
            width: '100%',
            height: '100%'
          }}
        >
          <Particles />
        </Canvas>
      </div>
    </>
  )
}

export default ParticleBackground 