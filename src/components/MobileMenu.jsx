import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { gsap } from 'gsap'

const MenuButton = styled.button`
  position: fixed;
  top: 2rem;
  right: 2rem;
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  z-index: 1000;
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  
  @media (max-width: 768px) {
    display: flex;
  }
  
  .line {
    width: 25px;
    height: 2px;
    background: var(--white);
    transition: all 0.3s ease;
    transform-origin: center;
  }
  
  &.active {
    .line:nth-child(1) {
      transform: rotate(45deg) translate(6px, 6px);
    }
    
    .line:nth-child(2) {
      opacity: 0;
    }
    
    .line:nth-child(3) {
      transform: rotate(-45deg) translate(6px, -6px);
    }
  }
`

const MenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  z-index: 999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  
  &.active {
    opacity: 1;
    visibility: visible;
  }
`

const MenuList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  text-align: center;
`

const MenuItem = styled.a`
  font-size: 2rem;
  font-weight: 300;
  color: var(--white);
  text-decoration: none;
  padding: 1rem 2rem;
  border: 1px solid transparent;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
  
  &:hover, &:active {
    color: var(--primary-red);
    border-color: var(--primary-red);
    transform: translateY(-2px);
  }
`

const MobileMenu = ({ currentPage = 'home' }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    if (isOpen) {
      // Анимация появления пунктов меню
      gsap.to('.menu-item', {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power3.out"
      })
      
      // Блокируем скролл
      document.body.style.overflow = 'hidden'
    } else {
      // Разблокируем скролл
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Для контактов прокручиваем в центр экрана
      const scrollOptions = sectionId === 'contact' 
        ? { behavior: 'smooth', block: 'center' }
        : { behavior: 'smooth', block: 'start' }
      
      element.scrollIntoView(scrollOptions)
      
      // Дополнительная проверка для контактов
      if (sectionId === 'contact') {
        setTimeout(() => {
          const rect = element.getBoundingClientRect()
          console.log('Contact section position:', rect)
          if (rect.bottom > window.innerHeight) {
            window.scrollBy({ top: 100, behavior: 'smooth' })
          }
        }, 500)
      }
    }
    setIsOpen(false)
  }

  return (
    <>
      <MenuButton 
        className={isOpen ? 'active' : ''} 
        onClick={toggleMenu}
        aria-label="Меню"
      >
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
      </MenuButton>

      <MenuOverlay className={isOpen ? 'active' : ''}>
        <MenuList>
          <MenuItem 
            className="menu-item"
            onClick={() => scrollToSection('hero')}
          >
            Главная
          </MenuItem>
          <MenuItem 
            className="menu-item"
            onClick={() => scrollToSection('projects')}
          >
            Проекты
          </MenuItem>
          <MenuItem 
            className="menu-item"
            onClick={() => scrollToSection('contact')}
          >
            Контакты
          </MenuItem>
          <MenuItem 
            className="menu-item"
            href="mailto:loony.boss@example.com"
          >
            Написать
          </MenuItem>
        </MenuList>
      </MenuOverlay>
    </>
  )
}

export default MobileMenu 