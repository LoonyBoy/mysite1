import React, { useState } from 'react'
import styled from 'styled-components'
import { useDeviceDetection, useIsTouchDevice, useDevicePerformance, useResponsiveDevice } from '../hooks/useDeviceDetection'

const DemoContainer = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`

const Title = styled.h1`
  color: #333;
  text-align: center;
  margin-bottom: 30px;
`

const Section = styled.div`
  margin-bottom: 25px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`

const SectionTitle = styled.h2`
  color: #555;
  margin-bottom: 15px;
  font-size: 18px;
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
`

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
`

const Label = styled.span`
  font-weight: 500;
  color: #666;
`

const Value = styled.span`
  color: #333;
  font-family: 'Courier New', monospace;
`

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.type) {
      case 'success': return '#d4edda'
      case 'warning': return '#fff3cd'
      case 'danger': return '#f8d7da'
      default: return '#e2e3e5'
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success': return '#155724'
      case 'warning': return '#856404'
      case 'danger': return '#721c24'
      default: return '#383d41'
    }
  }};
`

const Button = styled.button`
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 10px;
  margin-bottom: 10px;
  
  &:hover {
    background: #0056b3;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`

const TestArea = styled.div`
  padding: 20px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  text-align: center;
  background: #fafafa;
  margin-top: 15px;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
`

const DeviceDetectionDemo = () => {
  const {
    capabilities,
    isLoading,
    isPrimaryTouch,
    isPrimaryMouse,
    isMobile,
    isTablet,
    isDesktop,
    getPerformanceLevel,
    supportsHover,
    prefersReducedMotion,
    refreshCapabilities
  } = useDeviceDetection()

  const isTouch = useIsTouchDevice()
  const performance = useDevicePerformance()
  const responsive = useResponsiveDevice()

  const [testResults, setTestResults] = useState([])

  const addTestResult = (test, result) => {
    setTestResults(prev => [...prev.slice(-4), { test, result, timestamp: Date.now() }])
  }

  const runTouchTest = () => {
    const result = isPrimaryTouch() ? 'Touch device detected' : 'Non-touch device detected'
    addTestResult('Touch Detection', result)
  }

  const runPerformanceTest = () => {
    const level = getPerformanceLevel()
    addTestResult('Performance Test', `Performance level: ${level}`)
  }

  const runResponsiveTest = () => {
    const deviceType = isMobile() ? 'Mobile' : isTablet() ? 'Tablet' : 'Desktop'
    addTestResult('Responsive Test', `Device type: ${deviceType}`)
  }

  if (!capabilities) {
    return (
      <DemoContainer>
        <Title>Device Detection Demo</Title>
        <div>Loading device capabilities...</div>
      </DemoContainer>
    )
  }

  return (
    <DemoContainer>
      <Title>Device Detection Demo</Title>

      <Section>
        <SectionTitle>Basic Device Information</SectionTitle>
        <InfoGrid>
          <InfoItem>
            <Label>Device Type:</Label>
            <Value>{capabilities.deviceType}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Primary Touch:</Label>
            <StatusBadge type={isPrimaryTouch() ? 'success' : 'danger'}>
              {isPrimaryTouch() ? 'Yes' : 'No'}
            </StatusBadge>
          </InfoItem>
          <InfoItem>
            <Label>Primary Mouse:</Label>
            <StatusBadge type={isPrimaryMouse() ? 'success' : 'danger'}>
              {isPrimaryMouse() ? 'Yes' : 'No'}
            </StatusBadge>
          </InfoItem>
          <InfoItem>
            <Label>Supports Hover:</Label>
            <StatusBadge type={supportsHover() ? 'success' : 'warning'}>
              {supportsHover() ? 'Yes' : 'No'}
            </StatusBadge>
          </InfoItem>
        </InfoGrid>
      </Section>

      <Section>
        <SectionTitle>Screen Information</SectionTitle>
        <InfoGrid>
          <InfoItem>
            <Label>Screen Size:</Label>
            <Value>{capabilities.screenSize.width} × {capabilities.screenSize.height}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Available Size:</Label>
            <Value>{capabilities.screenSize.availWidth} × {capabilities.screenSize.availHeight}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Pixel Ratio:</Label>
            <Value>{capabilities.screenSize.pixelRatio}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Orientation:</Label>
            <Value>{capabilities.orientation}</Value>
          </InfoItem>
        </InfoGrid>
      </Section>

      <Section>
        <SectionTitle>Performance Information</SectionTitle>
        <InfoGrid>
          <InfoItem>
            <Label>Performance Level:</Label>
            <StatusBadge type={
              performance.performanceLevel === 'high' ? 'success' :
              performance.performanceLevel === 'medium' ? 'warning' : 'danger'
            }>
              {performance.performanceLevel}
            </StatusBadge>
          </InfoItem>
          <InfoItem>
            <Label>Device Memory:</Label>
            <Value>{capabilities.deviceMemory ? `${capabilities.deviceMemory} GB` : 'Unknown'}</Value>
          </InfoItem>
          <InfoItem>
            <Label>CPU Cores:</Label>
            <Value>{capabilities.hardwareConcurrency}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Reduce Animations:</Label>
            <StatusBadge type={performance.shouldReduceAnimations ? 'warning' : 'success'}>
              {performance.shouldReduceAnimations ? 'Yes' : 'No'}
            </StatusBadge>
          </InfoItem>
        </InfoGrid>
      </Section>

      <Section>
        <SectionTitle>Responsive Breakpoints</SectionTitle>
        <InfoGrid>
          <InfoItem>
            <Label>Is Mobile:</Label>
            <StatusBadge type={responsive.isMobile ? 'success' : 'danger'}>
              {responsive.isMobile ? 'Yes' : 'No'}
            </StatusBadge>
          </InfoItem>
          <InfoItem>
            <Label>Is Tablet:</Label>
            <StatusBadge type={responsive.isTablet ? 'success' : 'danger'}>
              {responsive.isTablet ? 'Yes' : 'No'}
            </StatusBadge>
          </InfoItem>
          <InfoItem>
            <Label>Is Desktop:</Label>
            <StatusBadge type={responsive.isDesktop ? 'success' : 'danger'}>
              {responsive.isDesktop ? 'Yes' : 'No'}
            </StatusBadge>
          </InfoItem>
          <InfoItem>
            <Label>Is Portrait:</Label>
            <StatusBadge type={responsive.isPortrait ? 'success' : 'warning'}>
              {responsive.isPortrait ? 'Yes' : 'No'}
            </StatusBadge>
          </InfoItem>
        </InfoGrid>
      </Section>

      <Section>
        <SectionTitle>Accessibility</SectionTitle>
        <InfoGrid>
          <InfoItem>
            <Label>Prefers Reduced Motion:</Label>
            <StatusBadge type={prefersReducedMotion() ? 'warning' : 'success'}>
              {prefersReducedMotion() ? 'Yes' : 'No'}
            </StatusBadge>
          </InfoItem>
          <InfoItem>
            <Label>Pointer Events:</Label>
            <StatusBadge type={capabilities.supportsPointerEvents ? 'success' : 'warning'}>
              {capabilities.supportsPointerEvents ? 'Supported' : 'Not Supported'}
            </StatusBadge>
          </InfoItem>
        </InfoGrid>
      </Section>

      <Section>
        <SectionTitle>Interactive Tests</SectionTitle>
        <div>
          <Button onClick={runTouchTest}>Test Touch Detection</Button>
          <Button onClick={runPerformanceTest}>Test Performance</Button>
          <Button onClick={runResponsiveTest}>Test Responsive</Button>
          <Button onClick={refreshCapabilities} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh Capabilities'}
          </Button>
        </div>

        <TestArea>
          <div>Touch or click this area to test interactions</div>
          {testResults.length > 0 && (
            <div>
              <strong>Recent Test Results:</strong>
              {testResults.map((result, index) => (
                <div key={result.timestamp}>
                  {result.test}: {result.result}
                </div>
              ))}
            </div>
          )}
        </TestArea>
      </Section>

      <Section>
        <SectionTitle>Raw Capabilities Data</SectionTitle>
        <pre style={{
          background: '#f8f9fa',
          padding: '15px',
          borderRadius: '6px',
          overflow: 'auto',
          fontSize: '12px',
          lineHeight: '1.4'
        }}>
          {JSON.stringify(capabilities, null, 2)}
        </pre>
      </Section>
    </DemoContainer>
  )
}

export default DeviceDetectionDemo