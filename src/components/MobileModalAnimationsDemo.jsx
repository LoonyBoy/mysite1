/**
 * Demo Component for Mobile Modal Animations
 * 
 * Demonstrates optimized modal animations for mobile devices
 * with performance monitoring and adaptive quality.
 * 
 * Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3
 */

import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { useMobileModalAnimations } from '../hooks/useMobileModalAnimations'

const DemoContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const DemoHeader = styled.div`
  text-align: center;
  color: white;
  
  h1 {
    font-size: clamp(24px, 5vw, 36px);
    margin-bottom: 10px;
  }
  
  p {
    opacity: 0.8;
    font-size: 16px;
  }
`

const DeviceInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  color: white;
  
  h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    font-size: 14px;
  }
  
  .label {
    opacity: 0.8;
  }
  
  .value {
    font-weight: 500;
  }
`

const DemoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
`

const DemoCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  &.is-open {
    position: fixed;
    inset: 0;
    z-index: 1000;
    border-radius: 0;
    padding: 40px;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(20px);
  }
  
  h3 {
    color: white;
    margin: 0 0 12px 0;
    font-size: 20px;
  }
  
  p {
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 16px 0;
    line-height: 1.5;
  }
  
  .demo-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }
`

const ModalContent = styled.div`
  display: none;
  
  ${DemoCard}.is-open & {
    display: block;
  }
  
  .modal-header {
    margin-bottom: 30px;
    
    h2 {
      color: white;
      font-size: clamp(28px, 6vw, 48px);
      margin: 0 0 12px 0;
    }
    
    .subtitle {
      color: rgba(255, 255, 255, 0.7);
      font-size: 16px;
    }
  }
  
  .content-section {
    margin-bottom: 24px;
    
    h4 {
      color: white;
      margin: 0 0 12px 0;
      font-size: 18px;
    }
    
    p {
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.6;
      margin: 0 0 12px 0;
    }
  }
  
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin: 20px 0;
  }
  
  .feature-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 16px;
    
    h5 {
      color: white;
      margin: 0 0 8px 0;
      font-size: 16px;
    }
    
    p {
      font-size: 14px;
      margin: 0;
    }
  }
`

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  
  ${DemoCard}:not(.is-open) & {
    display: none;
  }
`

const MobileModalAnimationsDemo = () => {
  const [openModal, setOpenModal] = useState(null)
  const cardRefs = useRef([])
  
  const {
    animateModalOpen,
    animateModalClose,
    animateBackground,
    getDeviceInfo,
    isReady
  } = useMobileModalAnimations()

  const deviceInfo = getDeviceInfo()

  const handleCardClick = async (index) => {
    if (openModal !== null) return
    
    const cardElement = cardRefs.current[index]
    if (!cardElement) return

    setOpenModal(index)
    
    const modalContent = cardElement.querySelector('.modal-content')
    
    try {
      await animateModalOpen(cardElement, modalContent, {
        enableStagger: true,
        onComplete: () => {
          console.log('Modal opened successfully')
        }
      })
    } catch (error) {
      console.error('Error opening modal:', error)
    }
  }

  const handleCloseModal = async () => {
    if (openModal === null) return
    
    const cardElement = cardRefs.current[openModal]
    if (!cardElement) return

    const modalContent = cardElement.querySelector('.modal-content')
    
    try {
      await animateModalClose(cardElement, modalContent, {
        onComplete: () => {
          setOpenModal(null)
          console.log('Modal closed successfully')
        }
      })
    } catch (error) {
      console.error('Error closing modal:', error)
      setOpenModal(null)
    }
  }

  const demoCards = [
    {
      title: 'About Modal',
      description: 'Demonstrates mobile-optimized modal opening with staggered content animations and performance monitoring.',
      features: [
        { name: 'Staggered Animation', desc: 'Content appears with smooth staggered timing' },
        { name: 'Mobile Easing', desc: 'Optimized easing functions for touch devices' },
        { name: 'Performance Adaptive', desc: 'Automatically adjusts quality based on device performance' }
      ]
    },
    {
      title: 'Projects Modal',
      description: 'Shows project cards with 3D effects and mobile-specific timing optimizations.',
      features: [
        { name: '3D Effects', desc: 'Hardware-accelerated 3D transformations' },
        { name: 'Image Optimization', desc: 'Progressive image loading with blur effects' },
        { name: 'Touch Optimized', desc: 'Designed specifically for touch interactions' }
      ]
    },
    {
      title: 'Services Modal',
      description: 'Pricing cards with mobile-friendly animations and reduced motion support.',
      features: [
        { name: 'Reduced Motion', desc: 'Respects user accessibility preferences' },
        { name: 'Pricing Animation', desc: 'Special animations for pricing card reveals' },
        { name: 'Memory Efficient', desc: 'Optimized for mobile memory constraints' }
      ]
    }
  ]

  if (!isReady) {
    return (
      <DemoContainer>
        <DemoHeader>
          <h1>Loading Mobile Modal Animations...</h1>
        </DemoHeader>
      </DemoContainer>
    )
  }

  return (
    <DemoContainer>
      <DemoHeader>
        <h1>Mobile Modal Animations Demo</h1>
        <p>Optimized modal animations for mobile devices with performance monitoring</p>
      </DemoHeader>

      {deviceInfo && (
        <DeviceInfo>
          <h3>Device Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Device Type:</span>
              <span className="value">{deviceInfo.isMobile ? 'Mobile' : 'Desktop'}</span>
            </div>
            <div className="info-item">
              <span className="label">Performance Level:</span>
              <span className="value">{deviceInfo.performanceLevel}</span>
            </div>
            <div className="info-item">
              <span className="label">Reduced Motion:</span>
              <span className="value">{deviceInfo.prefersReducedMotion ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="info-item">
              <span className="label">Blur Effects:</span>
              <span className="value">{deviceInfo.animationSettings.enableBlur ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="info-item">
              <span className="label">Shadows:</span>
              <span className="value">{deviceInfo.animationSettings.enableShadows ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="info-item">
              <span className="label">Max Stagger Items:</span>
              <span className="value">{deviceInfo.animationSettings.maxStaggerItems}</span>
            </div>
          </div>
        </DeviceInfo>
      )}

      <DemoGrid>
        {demoCards.map((card, index) => (
          <DemoCard
            key={index}
            ref={el => cardRefs.current[index] = el}
            className={openModal === index ? 'is-open' : ''}
            onClick={() => handleCardClick(index)}
          >
            <CloseButton onClick={(e) => {
              e.stopPropagation()
              handleCloseModal()
            }}>
              ×
            </CloseButton>
            
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <button className="demo-button">
              Open Modal
            </button>

            <ModalContent className="modal-content">
              <div className="modal-header">
                <h2>{card.title}</h2>
                <div className="subtitle">Mobile-Optimized Modal Animation</div>
              </div>

              <div className="content-section">
                <h4>Animation Features</h4>
                <p>This modal demonstrates mobile-specific optimizations including adaptive performance, staggered content animations, and touch-optimized timing.</p>
              </div>

              <div className="feature-grid">
                {card.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="feature-item">
                    <h5>{feature.name}</h5>
                    <p>{feature.desc}</p>
                  </div>
                ))}
              </div>

              <div className="content-section">
                <h4>Performance Optimizations</h4>
                <p>The animation system automatically detects device capabilities and adjusts animation complexity accordingly. On lower-end devices, effects like blur and shadows are disabled to maintain smooth 60fps performance.</p>
              </div>

              <div className="content-section">
                <h4>Mobile-Specific Timing</h4>
                <p>Mobile devices use shorter animation durations and different easing functions optimized for touch interactions. The stagger timing is also adjusted to feel more responsive on mobile.</p>
              </div>
            </ModalContent>
          </DemoCard>
        ))}
      </DemoGrid>
    </DemoContainer>
  )
}

export default MobileModalAnimationsDemo