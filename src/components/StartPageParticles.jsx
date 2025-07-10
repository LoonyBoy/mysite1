import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'

function StartParticles(props) {
  const ref = useRef()
  const [sphere] = useMemo(() => {
    // Меньше частиц, но они ближе
    const particleCount = 800
    const positions = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      // Меньший радиус сферы - частицы ближе к камере
      const radius = Math.random() * 0.8 + 0.2 // от 0.2 до 1.0
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }
    return [positions]
  }, [])

  useFrame((state, delta) => {
    // Более медленное и плавное вращение для стартовой страницы
    ref.current.rotation.x -= delta / 20
    ref.current.rotation.y -= delta / 25
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#FF5544" // Ярче и теплее цвет для стартовой
          size={0.025} // Еще крупнее частицы
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.8}
        />
      </Points>
    </group>
  )
}

const StartPageParticles = () => {
  return (
    <>
      {/* Черный фон - полный экран включая safe area */}
      <div className="background-fullscreen" style={{
        background: '#000'
      }} />
      
      {/* Частицы - полный экран включая safe area */}
      <div className="particles-fullscreen start-particles-container">
        <Canvas 
          camera={{ 
            position: [0, 0, 0.2], // Камера очень близко к частицам
            fov: 90 // Широкий угол обзора для эффекта погружения
          }}
          style={{ 
            pointerEvents: 'none',
            width: '100%',
            height: '100%'
          }}
        >
          <StartParticles />
        </Canvas>
      </div>
    </>
  )
}

export default StartPageParticles 