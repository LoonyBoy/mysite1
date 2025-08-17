import React, { useState, useRef } from 'react'
import { useParticleColorController } from '../hooks/useParticleColorController'

/**
 * Demo component for testing ParticleColorController functionality
 */
const ParticleColorControllerDemo = ({ particleManager }) => {
  const [activeCard, setActiveCard] = useState(null)
  const [customColor, setCustomColor] = useState('#000000')
  const cardRefs = useRef([])
  
  const {
    setCardColor,
    restoreCardColor,
    restoreAllColors,
    getActiveCards,
    isCardActive,
    setOriginalColor,
    setHoverColor
  } = useParticleColorController(particleManager)

  // Mock card data
  const cards = [
    { id: 0, title: 'Card 1', color: '#FF6B6B' },
    { id: 1, title: 'Card 2', color: '#4ECDC4' },
    { id: 2, title: 'Card 3', color: '#45B7D1' },
    { id: 3, title: 'Card 4', color: '#96CEB4' }
  ]

  const handleCardHover = (cardIndex, isHovering) => {
    if (isHovering) {
      const cardElement = cardRefs.current[cardIndex]
      if (cardElement) {
        const bounds = cardElement.getBoundingClientRect()
        setCardColor(cardIndex, customColor, bounds)
        setActiveCard(cardIndex)
      }
    } else {
      restoreCardColor(cardIndex)
      setActiveCard(null)
    }
  }

  const handleCustomColorChange = (e) => {
    setCustomColor(e.target.value)
    setHoverColor(e.target.value)
  }

  const handleOriginalColorChange = (e) => {
    setOriginalColor(e.target.value)
  }

  return (
    <div data-testid="demo-container" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Particle Color Controller Demo</h2>
      
      {/* Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <label>
          Hover Color:
          <input
            data-testid="hover-color-input"
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            style={{ marginLeft: '5px' }}
          />
        </label>
        
        <label>
          Original Color:
          <input
            type="color"
            defaultValue="#D14836"
            onChange={handleOriginalColorChange}
            style={{ marginLeft: '5px' }}
          />
        </label>
        
        <button
          data-testid="restore-all-button"
          onClick={restoreAllColors}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Restore All Colors
        </button>
      </div>

      {/* Status */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <p><strong>Active Card:</strong> <span data-testid="active-card-status">{activeCard !== null ? `Card ${activeCard + 1}` : 'None'}</span></p>
        <p><strong>Active Cards Count:</strong> <span data-testid="active-cards-count">{getActiveCards().size}</span></p>
        <p><strong>Current Hover Color:</strong> {customColor}</p>
      </div>

      {/* Demo Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {cards.map((card) => (
          <div
            key={card.id}
            data-testid={`particle-demo-card-${card.id}`}
            ref={(el) => cardRefs.current[card.id] = el}
            onMouseEnter={() => handleCardHover(card.id, true)}
            onMouseLeave={() => handleCardHover(card.id, false)}
            style={{
              padding: '20px',
              backgroundColor: card.color,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              transform: isCardActive(card.id) ? 'scale(1.05)' : 'scale(1)',
              boxShadow: isCardActive(card.id) ? '0 8px 16px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
              color: 'white',
              textAlign: 'center',
              minHeight: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 10px 0' }}>{card.title}</h3>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                {isCardActive(card.id) ? 'Active' : 'Hover me'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
        <h4>Instructions:</h4>
        <ul>
          <li>Hover over cards to change particle colors in their bounds</li>
          <li>Use color pickers to customize hover and original colors</li>
          <li>Click "Restore All Colors" to reset all particle colors</li>
          <li>Watch the status panel to see active cards</li>
        </ul>
      </div>
    </div>
  )
}

export default ParticleColorControllerDemo