import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import useMobileCardHover from '../hooks/useMobileCardHover'
import '../styles/mobile-card-hover.css'

const DemoContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
`

const Title = styled.h1`
  color: white;
  font-size: 2rem;
  margin-bottom: 20px;
  text-align: center;
`

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 800px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`

const Card = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 24px;
  color: white;
  cursor: pointer;
  backdrop-filter: blur(10px);
  
  /* Apply mobile hover system classes */
  &.card-mobile-hover {
    /* Base styles applied via CSS */
  }
  
  &.card-touch-active {
    /* Touch active styles applied via CSS */
  }
  
  &.card-touch-hover {
    /* Touch hover styles applied via CSS */
  }
  
  &.card-dimmed {
    /* Dimmed styles applied via CSS */
  }
`

const CardTitle = styled.h3`
  font-size: 1.5rem;
  margin: 0 0 12px 0;
  transition: transform 0.3s ease;
`

const CardDescription = styled.p`
  font-size: 1rem;
  margin: 0 0 16px 0;
  opacity: 0.8;
  line-height: 1.5;
`

const CardArrow = styled.div`
  font-size: 1.2rem;
  opacity: 0.7;
  transition: transform 0.3s ease, opacity 0.3s ease;
  
  &::after {
    content: '→';
  }
`

const StatusPanel = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  color: white;
  font-family: monospace;
  font-size: 0.9rem;
  max-width: 400px;
  width: 100%;
`

const StatusTitle = styled.h4`
  margin: 0 0 12px 0;
  color: #4CAF50;
`

const StatusItem = styled.div`
  margin: 4px 0;
  display: flex;
  justify-content: space-between;
  
  .label {
    opacity: 0.8;
  }
  
  .value {
    color: #2196F3;
  }
`

const cardData = [
  {
    title: 'About Me',
    description: 'Learn more about my background, skills, and experience in web development.',
    id: 'about'
  },
  {
    title: 'Projects',
    description: 'Explore my portfolio of web applications, mobile apps, and creative projects.',
    id: 'projects'
  },
  {
    title: 'Services',
    description: 'Discover the web development services I offer to help bring your ideas to life.',
    id: 'services'
  },
  {
    title: 'Contact',
    description: 'Get in touch with me for collaborations, questions, or project inquiries.',
    id: 'contact'
  }
]

const MobileCardHoverDemo = () => {
  const [hoveredCard, setHoveredCard] = useState(null)
  const [systemStatus, setSystemStatus] = useState({})
  const cardRefs = useRef([])
  
  // Initialize mobile card hover system
  const {
    initializeCard,
    isTouch,
    getStatus,
    forceEndAllTouches,
    cleanup
  } = useMobileCardHover({
    touchDebounceTime: 50,
    hapticFeedbackDuration: 0.15,
    visualFeedbackDuration: 0.3,
    touchActiveClass: 'card-touch-active',
    touchHoverClass: 'card-touch-hover'
  })

  // Handle hover state changes
  const handleHoverChange = (cardIndex, isHovering, cardElement) => {
    console.log(`Card ${cardIndex} hover changed:`, isHovering)
    
    if (isHovering) {
      setHoveredCard(cardIndex)
      
      // Dim other cards
      cardRefs.current.forEach((card, index) => {
        if (card && index !== cardIndex) {
          card.classList.add('card-dimmed')
        }
      })
    } else {
      setHoveredCard(null)
      
      // Remove dimming from all cards
      cardRefs.current.forEach((card) => {
        if (card) {
          card.classList.remove('card-dimmed')
        }
      })
    }
  }

  // Initialize cards when component mounts
  useEffect(() => {
    cardRefs.current.forEach((cardElement, index) => {
      if (cardElement) {
        // Add base mobile hover class
        cardElement.classList.add('card-mobile-hover')
        
        // Initialize with mobile hover system
        initializeCard(cardElement, index, handleHoverChange)
      }
    })
    
    // Update status periodically
    const statusInterval = setInterval(() => {
      setSystemStatus(getStatus())
    }, 1000)
    
    return () => {
      clearInterval(statusInterval)
      cleanup()
    }
  }, [initializeCard, getStatus, cleanup])

  // Handle card click
  const handleCardClick = (cardIndex) => {
    console.log(`Card ${cardIndex} clicked:`, cardData[cardIndex].title)
    
    // Force end all touches to clean up any active states
    forceEndAllTouches()
  }

  return (
    <DemoContainer>
      <Title>Mobile Card Hover System Demo</Title>
      
      <CardsContainer>
        {cardData.map((card, index) => (
          <Card
            key={card.id}
            ref={(el) => (cardRefs.current[index] = el)}
            onClick={() => handleCardClick(index)}
            data-card-index={index}
          >
            <CardTitle className="card-title">
              {card.title}
            </CardTitle>
            <CardDescription className="card-content">
              {card.description}
            </CardDescription>
            <CardArrow className="card-arrow" />
          </Card>
        ))}
      </CardsContainer>
      
      <StatusPanel>
        <StatusTitle>System Status</StatusTitle>
        <StatusItem>
          <span className="label">Device Type:</span>
          <span className="value">{isTouch() ? 'Touch' : 'Mouse'}</span>
        </StatusItem>
        <StatusItem>
          <span className="label">Hovered Card:</span>
          <span className="value">{hoveredCard !== null ? `Card ${hoveredCard}` : 'None'}</span>
        </StatusItem>
        <StatusItem>
          <span className="label">Active Touches:</span>
          <span className="value">{systemStatus.activeTouches || 0}</span>
        </StatusItem>
        <StatusItem>
          <span className="label">Active Timers:</span>
          <span className="value">{systemStatus.activeTimers || 0}</span>
        </StatusItem>
        <StatusItem>
          <span className="label">Touch Support:</span>
          <span className="value">{systemStatus.isTouch ? 'Yes' : 'No'}</span>
        </StatusItem>
      </StatusPanel>
    </DemoContainer>
  )
}

export default MobileCardHoverDemo