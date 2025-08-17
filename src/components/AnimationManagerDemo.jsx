import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import useAnimationManager from '../hooks/useAnimationManager'

const DemoContainer = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  z-index: 9999;
  min-width: 200px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    top: 5px;
    right: 5px;
    font-size: 10px;
    padding: 8px;
    min-width: 150px;
  }
`

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const MetricLabel = styled.span`
  opacity: 0.7;
`

const MetricValue = styled.span`
  font-weight: bold;
  color: ${props => {
    if (props.type === 'fps') {
      if (props.value >= 50) return '#4ade80' // green
      if (props.value >= 30) return '#fbbf24' // yellow
      return '#ef4444' // red
    }
    if (props.type === 'performance') {
      if (props.value === 'high') return '#4ade80'
      if (props.value === 'medium') return '#fbbf24'
      return '#ef4444'
    }
    return '#ffffff'
  }};
`

const ToggleButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  margin-top: 8px;
  width: 100%;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`

/**
 * Demo component to display Animation Manager metrics and controls
 * Only shown in development mode
 */
const AnimationManagerDemo = () => {
  const {
    getPerformanceMetrics,
    setPerformanceLevel,
    isInitialized
  } = useAnimationManager()
  
  const [metrics, setMetrics] = useState({
    fps: 0,
    performanceLevel: 'unknown',
    isTouch: false,
    activeTimelines: 0,
    isMonitoring: false
  })
  
  const [isVisible, setIsVisible] = useState(true)
  const intervalRef = useRef(null)

  // Update metrics periodically
  useEffect(() => {
    if (!isInitialized) return

    const updateMetrics = () => {
      const currentMetrics = getPerformanceMetrics()
      setMetrics(currentMetrics)
    }

    // Update immediately
    updateMetrics()

    // Update every second
    intervalRef.current = setInterval(updateMetrics, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isInitialized, getPerformanceMetrics])

  // Cycle through performance levels for testing
  const cyclePerformanceLevel = () => {
    const levels = ['high', 'medium', 'low']
    const currentIndex = levels.indexOf(metrics.performanceLevel)
    const nextIndex = (currentIndex + 1) % levels.length
    setPerformanceLevel(levels[nextIndex])
  }

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  if (!isVisible) {
    return (
      <DemoContainer style={{ width: 'auto', minWidth: 'auto' }}>
        <ToggleButton onClick={() => setIsVisible(true)}>
          Show Metrics
        </ToggleButton>
      </DemoContainer>
    )
  }

  return (
    <DemoContainer>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', textAlign: 'center' }}>
        Animation Manager
      </div>
      
      <MetricRow>
        <MetricLabel>FPS:</MetricLabel>
        <MetricValue type="fps" value={metrics.fps}>
          {metrics.fps}
        </MetricValue>
      </MetricRow>
      
      <MetricRow>
        <MetricLabel>Performance:</MetricLabel>
        <MetricValue type="performance" value={metrics.performanceLevel}>
          {metrics.performanceLevel}
        </MetricValue>
      </MetricRow>
      
      <MetricRow>
        <MetricLabel>Device:</MetricLabel>
        <MetricValue>
          {metrics.isTouch ? 'Touch' : 'Mouse'}
        </MetricValue>
      </MetricRow>
      
      <MetricRow>
        <MetricLabel>Timelines:</MetricLabel>
        <MetricValue>
          {metrics.activeTimelines}
        </MetricValue>
      </MetricRow>
      
      <MetricRow>
        <MetricLabel>Monitoring:</MetricLabel>
        <MetricValue>
          {metrics.isMonitoring ? 'Yes' : 'No'}
        </MetricValue>
      </MetricRow>

      <ToggleButton onClick={cyclePerformanceLevel}>
        Cycle Performance Level
      </ToggleButton>
      
      <ToggleButton onClick={() => setIsVisible(false)}>
        Hide Metrics
      </ToggleButton>
    </DemoContainer>
  )
}

export default AnimationManagerDemo