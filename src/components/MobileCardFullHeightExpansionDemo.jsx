/**
 * Mobile Card Full-Height Expansion Demo Component
 * Task 3: Create Mobile Card Full-Height Expansion
 * 
 * Demonstrates card expansion animations to reach full viewport height (100dvh)
 * with smooth GSAP animations
 */

import React, { useState, useRef, useEffect } from 'react';
import { useMobileCardFullHeightExpansion } from '../hooks/useMobileCardFullHeightExpansion';
import '../styles/mobile-card-full-height-expansion.css';

const MobileCardFullHeightExpansionDemo = () => {
    const [selectedCard, setSelectedCard] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef(null);
    const cardRefs = useRef({});

    const {
        expandCard,
        contractCard,
        isCardExpanded,
        isCardExpanding,
        initializeCard,
        cleanupCard
    } = useMobileCardFullHeightExpansion();

    const cards = [
        {
            id: 1,
            title: 'Full Height Card 1',
            subtitle: 'Tap to expand to full viewport',
            content: 'This card will smoothly animate to fill the entire viewport height using GSAP animations.',
            color: '#FF6B6B'
        },
        {
            id: 2,
            title: 'Full Height Card 2',
            subtitle: 'Interactive expansion demo',
            content: 'Experience smooth transitions with proper easing and timing for mobile interactions.',
            color: '#4ECDC4'
        },
        {
            id: 3,
            title: 'Full Height Card 3',
            subtitle: 'Responsive animation',
            content: 'Optimized for mobile devices with touch-friendly interactions and performance.',
            color: '#45B7D1'
        }
    ];

    // Initialize cards when component mounts
    useEffect(() => {
        cards.forEach(card => {
            const cardElement = cardRefs.current[card.id];
            if (cardElement) {
                initializeCard(cardElement, { cardIndex: card.id });
            }
        });

        return () => {
            // Cleanup cards when component unmounts
            cards.forEach(card => {
                const cardElement = cardRefs.current[card.id];
                if (cardElement) {
                    cleanupCard(cardElement);
                }
            });
        };
    }, [initializeCard, cleanupCard]);

    const handleCardClick = async (card) => {
        const cardElement = cardRefs.current[card.id];
        if (!cardElement) return;

        const cardState = isCardExpanded(cardElement);
        const cardAnimating = isCardExpanding(cardElement);

        if (cardAnimating) return;

        setIsAnimating(true);

        try {
            if (selectedCard?.id === card.id && cardState) {
                await contractCard(cardElement);
                setSelectedCard(null);
                setIsExpanded(false);
            } else {
                // Contract any other expanded cards first
                if (selectedCard && selectedCard.id !== card.id) {
                    const prevCardElement = cardRefs.current[selectedCard.id];
                    if (prevCardElement && isCardExpanded(prevCardElement)) {
                        await contractCard(prevCardElement);
                    }
                }

                setSelectedCard(card);
                await expandCard(cardElement);
                setIsExpanded(true);
            }
        } catch (error) {
            console.error('Error handling card interaction:', error);
        } finally {
            setIsAnimating(false);
        }
    };

    const handleBackdropClick = async (e) => {
        if (e.target === e.currentTarget && isExpanded && selectedCard) {
            const cardElement = cardRefs.current[selectedCard.id];
            if (cardElement) {
                setIsAnimating(true);
                try {
                    await contractCard(cardElement);
                    setSelectedCard(null);
                    setIsExpanded(false);
                } catch (error) {
                    console.error('Error handling backdrop click:', error);
                } finally {
                    setIsAnimating(false);
                }
            }
        }
    };

    return (
        <div className="mobile-card-full-height-demo" ref={containerRef}>
            <div className="demo-header">
                <h2>Mobile Card Full-Height Expansion</h2>
                <p>Tap cards to see smooth full-viewport expansion animations</p>
            </div>

            <div className="cards-grid">
                {cards.map((card) => (
                    <div
                        key={card.id}
                        ref={el => cardRefs.current[card.id] = el}
                        className={`expansion-card mobile-card-full-height ${selectedCard?.id === card.id ? 'selected' : ''}`}
                        data-card-id={card.id}
                        data-card-index={card.id}
                        onClick={() => handleCardClick(card)}
                        style={{ '--card-color': card.color }}
                    >
                        <div className="card-content">
                            <h3 className="card-title">{card.title}</h3>
                            <p className="card-subtitle">{card.subtitle}</p>
                            <div className="card-body">
                                <p>{card.content}</p>
                            </div>
                        </div>

                        <div className="card-indicator">
                            <span className={`expand-icon ${isExpanded && selectedCard?.id === card.id ? 'rotated' : ''}`}>
                                ↗
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Full-height overlay for expanded state */}
            {isExpanded && selectedCard && (
                <div
                    className="full-height-overlay"
                    onClick={handleBackdropClick}
                >
                    <div className="expanded-card-container">
                        <div className="expanded-card" style={{ '--card-color': selectedCard.color }}>
                            <div className="expanded-header">
                                <button
                                    className="close-button"
                                    onClick={() => handleCardClick(selectedCard)}
                                    disabled={isAnimating}
                                >
                                    ✕
                                </button>
                                <h2>{selectedCard.title}</h2>
                            </div>

                            <div className="expanded-content">
                                <p className="expanded-subtitle">{selectedCard.subtitle}</p>
                                <div className="expanded-body">
                                    <p>{selectedCard.content}</p>
                                    <div className="additional-content">
                                        <h4>Full Height Features:</h4>
                                        <ul>
                                            <li>Smooth GSAP animations</li>
                                            <li>100dvh viewport coverage</li>
                                            <li>Touch-optimized interactions</li>
                                            <li>Proper z-index management</li>
                                            <li>Backdrop dismiss functionality</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="demo-controls">
                <div className="status-indicator">
                    <span className={`status ${isExpanded ? 'expanded' : 'collapsed'}`}>
                        {isExpanded ? 'Expanded' : 'Collapsed'}
                    </span>
                    {isAnimating && <span className="animating">Animating...</span>}
                </div>
            </div>
        </div>
    );
};

export default MobileCardFullHeightExpansionDemo;