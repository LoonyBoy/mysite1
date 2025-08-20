import React, { useEffect, useRef, useMemo } from 'react'
import styled from 'styled-components'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useNavigate } from 'react-router-dom'
import { useParticles } from '../components/GlobalParticleManager'
import CustomCursor from '../components/CustomCursor'
import MobileNavigation from '../components/MobileNavigation'
import useParticleControl from '../hooks/useParticleControl'
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack'

gsap.registerPlugin(ScrollTrigger)

const ProjectsContainer = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: transparent;
  position: relative;
  width: 100%;
  overflow-x: hidden;
  z-index: 1;
  
  @media (max-width: 768px) {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
`

const Section = styled.section`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  background: transparent; /* Прозрачный фон чтобы не перекрывать частицы */
  height: 100vh;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 1rem;
    
    @supports (padding: max(0px)) {
      padding-left: max(1rem, env(safe-area-inset-left) + 1rem);
      padding-right: max(1rem, env(safe-area-inset-right) + 1rem);
    }
  }
`

const SectionTitle = styled.h2`
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 400;
  margin-bottom: 2rem;
  text-align: center;
  opacity: 0;
  transform: translateY(50px);
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`

const ProjectList = styled.div`
  width: 100%;
  flex: 1;
  overflow: hidden;
`

const ProjectTile = styled.div`
  display: flex;
  justify-content: center;
`

const EntityCard = styled.article`
  background-color: rgba(255, 255, 255, 0.95);
  -webkit-backdrop-filter: grayscale(100%);
  backdrop-filter: grayscale(100%);
  color: #000000;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  // Текст и теги без смешения
  > * {
    mix-blend-mode: normal;
  }
`

const CardLink = styled.div`
  cursor: pointer;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
`

const CardHeader = styled.header`
  padding: 1.5rem;
  flex: 1;
`

const CardTitle = styled.h2`
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  color: #000000;
`

const CardDescription = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.4;
  color: #000000;
  opacity: 0.8;
`

const CardCover = styled.img`
  width: 100%;
  height: auto;
  object-fit: cover;
`

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem 1.5rem 1.5rem;
`

const TagButton = styled.button`
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  color: #000000;
  cursor: pointer;
`

const NavigationEdge = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 350px;
  height: 100vh;
  z-index: 5;
  cursor: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(to right, rgba(209, 72, 54, 0.15), transparent);
    backdrop-filter: blur(10px);
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`

const NavigationHint = styled.div`
  position: fixed;
  top: 50%;
  left: 5rem;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 6;
  pointer-events: none;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  
  &.visible {
    opacity: 1;
    transform: translateY(-50%) translateX(15px);
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`

const ProjectsPage = () => {
  const projectsRef = useRef(null)
  const navigate = useNavigate()
  const { camera } = useParticles()
  const isTransitioningRef = useRef(false) // Защита от множественных кликов
  
  // Мемоизируем объект sensitivity чтобы избежать перезапуска хука
  const sensitivity = useMemo(() => ({
    wheel: 0.002,
    touch: 0.005
  }), [])
  
  // Подключаем интерактивное управление частицами
  const { resetRotation } = useParticleControl(camera, true, sensitivity)

  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window

    // Анимация частиц теперь обрабатывается в GlobalParticleManager
    // на основе контекста перехода

    // Проверяем, приходим ли мы с домашней страницы
    const isComingFromHome = sessionStorage.getItem('coming-from-home')
    
    if (isComingFromHome) {
      // Быстрое появление
      gsap.set(projectsRef.current, {
        opacity: 0
      })

      gsap.to(projectsRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out"
      })
      
      sessionStorage.removeItem('coming-from-home')
    } else {
      // Обычная анимация входа (прямое посещение)
      gsap.to(projectsRef.current, {
        opacity: 1,
        duration: 0.3
      })
    }

    // Анимация заголовка
    const h2Element = projectsRef.current?.querySelector('h2')
    if (h2Element) {
      gsap.to(h2Element, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.4
      })
    }

    // Анимация карточек проектов
    const projectCards = projectsRef.current?.querySelectorAll('.project-card')
    if (projectCards && projectCards.length > 0) {
      projectCards.forEach((card, index) => {
        gsap.to(card, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.6 + index * 0.2
        })
      })
    }

    // Обработка наведения на левый край
    const navigationEdge = document.querySelector('.navigation-edge-left')
    const navigationHint = document.querySelector('.navigation-hint-left')
    
    if (navigationEdge && navigationHint && !isMobile) {
      const handleMouseEnter = () => {
        navigationHint.classList.add('visible')
        document.body.style.cursor = 'none'
      }
      
      const handleMouseLeave = () => {
        navigationHint.classList.remove('visible')
        document.body.style.cursor = 'none'
      }
      
      const handleClick = () => {
        // Анимация частиц теперь обрабатывается автоматически
        // в GlobalParticleManager на основе контекста
        
        // Быстрое затухание без смещения
        gsap.to(projectsRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
          onComplete: () => {
            // Устанавливаем флаги возвращения на домашнюю страницу
            sessionStorage.setItem('returning-to-home', 'true')
            sessionStorage.setItem('coming-from-projects', 'true')
            navigate('/home')
          }
        })
        
        // Анимация затухания подсказки
        const hint = document.querySelector('.navigation-hint-left')
        if (hint) {
          gsap.to(hint, {
            opacity: 0,
            duration: 0.3
          })
        }
      }
      
      navigationEdge.addEventListener('mouseenter', handleMouseEnter)
      navigationEdge.addEventListener('mouseleave', handleMouseLeave)
      navigationEdge.addEventListener('click', handleClick)
      
      return () => {
        navigationEdge.removeEventListener('mouseenter', handleMouseEnter)
        navigationEdge.removeEventListener('mouseleave', handleMouseLeave)
        navigationEdge.removeEventListener('click', handleClick)
        ScrollTrigger.getAll().forEach(trigger => trigger.kill())
      }
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [navigate])

  const projects = [
    {
      title: "LightLab Studio",
      description: "Современный сайт для фотостудии с галереей работ, онлайн-бронированием и адаптивным дизайном. Реализован с акцентом на визуальную составляющую и пользовательский опыт.",
      tech: ["React", "GSAP", "WebGL", "Node.js"],
      route: "/project/lightlab"
    },
    {
      title: "Raykhan Telegram WebApp",
      description: "Telegram Web App для парфюмерного бренда с каталогом ароматов, системой заказов и интеграцией с Telegram Bot API. Оптимизирован для мобильных устройств.",
      tech: ["Vue.js", "Telegram API", "Express", "MongoDB"]
    }
  ]

  const handleProjectClick = (project) => {
    if (project.route && !isTransitioningRef.current) {
      console.log('🚀 Starting LightLab case page transition with flash')
      isTransitioningRef.current = true // Блокируем дальнейшие клики
      
      // Создаем элемент вспышки
      const flashOverlay = document.createElement('div')
      flashOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
        z-index: 10000;
        opacity: 0;
        pointer-events: none;
      `
      document.body.appendChild(flashOverlay)
      
      // Анимация вспышки
      gsap.to(flashOverlay, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          // После вспышки переходим на новую страницу
          navigate(project.route)
          
          // Удаляем элемент вспышки через некоторое время
          setTimeout(() => {
            if (document.body.contains(flashOverlay)) {
              document.body.removeChild(flashOverlay)
            }
            // Разблокируем клики через некоторое время
            setTimeout(() => {
              isTransitioningRef.current = false
            }, 1000)
          }, 100)
        }
      })
    } else if (project.route && isTransitioningRef.current) {
      console.log('🚫 Click blocked - transition in progress')
    }
  }

  return (
    <ProjectsContainer>
      <CustomCursor />
      
      <NavigationEdge className="navigation-edge-left" />
      <NavigationHint className="navigation-hint-left">
        ← Домой
      </NavigationHint>
      
      <Section ref={projectsRef}>
        <SectionTitle>Проекты</SectionTitle>
        <ProjectList>
          <ScrollStack
            itemDistance={120}
            itemScale={0.05}
            itemStackDistance={40}
            stackPosition="25%"
            scaleEndPosition="15%"
            baseScale={0.9}
            rotationAmount={2}
            blurAmount={0.5}
            onStackComplete={() => console.log('Stack animation completed')}
          >
            {projects.map(project => (
              <ScrollStackItem key={project.title}>
                <ProjectTile>
                  <EntityCard>
                    <CardLink onClick={() => handleProjectClick(project)}>
                      <CardHeader>
                        <CardTitle>{project.title}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </CardHeader>
                      <TagList>
                        {project.tech.map(tag => (
                          <TagButton key={tag}>{tag}</TagButton>
                        ))}
                      </TagList>
                    </CardLink>
                  </EntityCard>
                </ProjectTile>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </ProjectList>
      </Section>
        
      <MobileNavigation />
    </ProjectsContainer>
  )
}

export default ProjectsPage 