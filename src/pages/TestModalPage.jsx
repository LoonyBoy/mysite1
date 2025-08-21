import React, { useState } from 'react'
import styled from 'styled-components'
import ProjectModal from '../components/ProjectModal'

const TestContainer = styled.div`
  min-height: 100vh;
  background: #1a1a1a;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`

const TestButton = styled.button`
  background: var(--primary-red);
  color: #fff;
  border: none;
  padding: 16px 32px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #d91e24;
    transform: translateY(-2px);
  }
`

const TestModalPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <TestContainer>
      <TestButton onClick={() => setIsModalOpen(true)}>
        Открыть модальное окно
      </TestButton>
      
      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </TestContainer>
  )
}

export default TestModalPage
