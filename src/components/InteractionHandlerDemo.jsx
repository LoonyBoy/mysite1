import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import useInteractionHandler from '../hooks/useInteractionHandler'
import useAnimationManager from '../hooks/useAnimationManager'

const DemoContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 16px;
  border-radius: 8px;
  font-size: 12px;
  font-family: monospace;
  z-index: 9999;
  min-width: 250px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    font-size: 10px;
    padding: 12px;
    min-width: 200px;
  }
`

const DemoTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 14px;
  color: ${props => props.mobileOnly ? '#ff9500' : '#00ff88'};
  
  @media (max-width: 768px) {
    font-size: 12px;
    margin-bottom: 8px;
  }
`

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  
  .label {
    color: #aaa;
  }
  
  .value {
    color: #fff;
    font-weight: bold;
  }
  
  &.highlight .value {
    color: #00ff88;
  }
`

const StatusIndicator = styled.div`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  background: ${props => props.active ? '#00ff88' : '#ff4444'};
`

/**
 * Demo component to show InteractionHandler status and device detection
 */
const InteractionHandlerDemo = () => {
  const { getAnimationManager, isInitialized: animationManagerInitialized } = useAnimationManager()
  const {
    getDeviceInfo,
    getInteractionState,
    isInitialized: interactionHandlerInitialized
  } = useInteractionHandler(getAnimationManager())

  const [deviceInfo, setDeviceInfo] = useState(null)
  const [interactionState, setInteractionState] = useState(null)
  const [updateCount, setUpdateCount] = useState(0)

  // Update device info and interaction state periodically
  useEffect(() => {
    const updateInfo = () => {
      if (interactionHandlerInitialized) {
        setDeviceInfo(getDeviceInfo())
        setInteractionState(getInteractionState())
        setUpdateCount(prev => prev + 1)
      }
    }

    // Initial update
    updateInfo()

    // Update every 2 seconds
    const interval = setInterval(updateInfo, 2000)

    return () => clearInterval(interval)
  }, [interactionHandlerInitialized, getDeviceInfo, getInteractionState])

  if (!interactionHandlerInitialized || !deviceInfo) {
    return (
      <DemoContainer>
        <DemoTitle mobileOnly>
          <StatusIndicator active={false} />
          Mobile Interaction Handler
        </DemoTitle>
        <InfoRow>
          <span className="label">Status:</span>
          <span className="value">Initializing...</span>
        </InfoRow>
      </DemoContainer>
    )
  }

  return (
    <DemoContainer>
      <DemoTitle mobileOnly={!deviceInfo.isTouch}>
        <StatusIndicator active={interactionHandlerInitialized && deviceInfo.isTouch} />
        Mobile Interaction Handler {!deviceInfo.isTouch ? '(Desktop - Disabled)' : ''}
      </DemoTitle>
      
      <InfoRow className="highlight">
        <span className="label">Device Type:</span>
        <span className="value">{deviceInfo.isTouch ? 'Touch (Mobile)' : 'Mouse (Desktop)'}</span>
      </InfoRow>
      
      {!deviceInfo.isTouch && (
        <InfoRow>
          <span className="label">Status:</span>
          <span className="value" style={{color: '#ff9500'}}>Desktop - Using Default Handlers</span>
        </InfoRow>
      )}
      
      <InfoRow>
        <span className="label">Animation Manager:</span>
        <span className="value">{animationManagerInitialized ? 'Ready' : 'Loading'}</span>
      </InfoRow>
      
      {interactionState && (
        <>
          <InfoRow>
            <span className="label">Active Interactions:</span>
            <span className="value">{interactionState.activeInteractions.length}</span>
          </InfoRow>
          
          <InfoRow>
            <span className="label">Debounce Timers:</span>
            <span className="value">{interactionState.debounceTimers.length}</span>
          </InfoRow>
          
          <InfoRow>
            <span className="label">Interaction Locks:</span>
            <span className="value">{interactionState.interactionLocks.length}</span>
          </InfoRow>
          
          <InfoRow>
            <span className="label">Debounce Delay:</span>
            <span className="value">{interactionState.config.debounceDelay}ms</span>
          </InfoRow>
          
          <InfoRow>
            <span className="label">Lock Duration:</span>
            <span className="value">{interactionState.config.lockDuration}ms</span>
          </InfoRow>
        </>
      )}
      
      <InfoRow>
        <span className="label">Updates:</span>
        <span className="value">{updateCount}</span>
      </InfoRow>
    </DemoContainer>
  )
}

export default InteractionHandlerDemo