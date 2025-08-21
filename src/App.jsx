import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { GlobalStyles } from './styles/GlobalStyles'
import StartPage from './pages/StartPage'
import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'
import SpaceInvadersPage from './pages/SpaceInvadersPage'
import LightLabCasePage from './pages/LightLabCasePage'
import TestModalPage from './pages/TestModalPage'
import PerformanceOptimizer from './components/PerformanceOptimizer'
import { ParticleProvider } from './components/GlobalParticleManager'

function App() {
  return (
    <>
      <GlobalStyles />
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <ParticleProvider>
          <PerformanceOptimizer />
          <Routes>
            <Route path="/" element={<StartPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/project/lightlab" element={<LightLabCasePage />} />
            <Route path="/game" element={<SpaceInvadersPage />} />
            <Route path="/test-modal" element={<TestModalPage />} />
          </Routes>
        </ParticleProvider>
      </Router>
    </>
  )
}

export default App