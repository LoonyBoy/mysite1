import React, { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)
import styled from 'styled-components'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'
import { useParticles } from '../components/GlobalParticleManager'
import CustomCursor from '../components/CustomCursor'
import MobileNavigation from '../components/MobileNavigation'
import useParticleControl from '../hooks/useParticleControl'
import Dither from '../../dither.jsx'; // Adjusted to new file extension


const MenuContainer = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: transparent;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  overflow-x: hidden;
  z-index: 1;
  margin: 0;
  padding: 0;
  
  @media (max-width: 768px) {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
`

const Section = styled.section`
  padding: 0;
  max-width: none;
  margin: 0;
  position: relative;
  z-index: 2;
  background: transparent;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;

  @media (max-width: 768px) {
    padding: 0;
    height: 100vh;
  }
`

const SectionTitle = styled.h1`
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 400;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--white);
  opacity: 0;
  transform: translateY(50px);
  
  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`

const NavigationEdge = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 175px;
  height: 100vh;
  z-index: 5;
  cursor: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(to right, rgba(132, 0, 255, 0.15), transparent);
    backdrop-filter: blur(10px);
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`

const CardRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100vw;
  height: 100vh;
  margin: 0;
  gap: 1px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const Card = styled.div`
  position: relative;
  width: 25%;
  height: 100%;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  
  &:hover {
    align-items: flex-start;
    padding-top: 40px;
  }
  
  &:last-child {
    border-right: none;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    height: 25vh;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0 40px;
    
    &:last-child {
      border-bottom: none;
    }
  }

  .profile-img {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: auto;
    object-fit: cover;
    display: block;
    z-index: 1;
    opacity: 0;
    transform: translateY(20px);
  }
`

const DitherBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 0%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
`;

const CardContent = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
`

const CardTitle = styled.h3`
  font-size: 80px;
  font-weight: 300;
  color: white;
  margin: 0;
  transition: all 0.3s ease;
  
  ${Card}:hover & {
    color: white;
    /* убираем изменение размера на hover */
  }
  
  @media (max-width: 768px) {
    font-size: 40px;
  }
`

const ShortDescription = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  transition: all 0.3s ease;
  
  ${Card}:hover & {
    color: white;
  }
`

const HiddenDescription = styled.div`
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
  
  p {
    font-size: 14px;
    color: white;
    margin: 0 0 20px 0;
  }
  
  @media (max-width: 768px) {
    p {
      font-size: 16px;
    }
  }
`

const Arrow = styled.div`
  font-size: 24px;
  color: white;
  transition: all 0.3s ease;
  
  ${Card}:hover & {
    color: white;
    /* убираем CSS transform, оставляем только GSAP анимации */
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



const waveColors = [[0,0,1], [0.5,0,0.5], [0,0.5,0], [1,1,1]];
const menuItems = [
  {
    label: "Home",
    title: "Главная",
    description: "Вернуться на главную страницу",
    route: "/home",
    color: "#060010"
  },
  {
    label: "Projects",
    title: "Меню",
    description: "Мои работы и кейсы",
    route: "/menu",
    color: "#060010"
  },
  {
    label: "About",
    title: "Обо мне",
    description: "Информация о разработчике",
    route: "/about",
    color: "#060010"
  },
  {
    label: "Contact",
    title: "Контакты",
    description: "Связаться со мной",
    route: "/contact",
    color: "#060010"
  },
  {
    label: "Services",
    title: "Услуги",
    description: "Что я предлагаю",
    route: "/services",
    color: "#060010"
  },
  {
    label: "Blog",
    title: "Блог",
    description: "Статьи и заметки",
    route: "/blog",
    color: "#060010"
  }
]

const MenuPage = () => {
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const { camera, setParticleProps, setHoveredRect } = useParticles()
  const isTransitioningRef = useRef(false)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const cardRefs = useRef([])
  const cards = [
    { 
      title: 'О себе', 
      shortDesc: 'Кто я, чем живу, что ценю', 
      hiddenDesc: 'Кратко обо мне: подход к работе, ключевые принципы, и почему со мной комфортно делать проекты, которые не стыдно показывать.' 
    },
    { 
      title: 'Проекты', 
      shortDesc: 'Реальные задачи — реальные решения', 
      hiddenDesc: 'Подборка завершённых работ: сайты, Telegram-боты, автоматизации. Всё, что уже принесло пользу клиентам и бизнесу.' 
    },
    { 
      title: 'Услуги', 
      shortDesc: 'Что могу сделать для тебя', 
      hiddenDesc: 'Разработка сайтов и ботов, настройка автоматизаций, UI-дизайн, техподдержка. Гибко под задачи, без шаблонов и лишнего шума.' 
    },
    { 
      title: 'Контакты', 
      shortDesc: 'Всегда на связи', 
      hiddenDesc: 'Telegram, почта, соцсети. Открыт к проектам, предложениям, сотрудничеству. Пиши — отвечаю быстро и по делу.' 
    }
  ]

  const handleHover = (index, isHovering) => {
    const cardElement = cardRefs.current[index]
    if (!cardElement) return

    const hiddenElement = cardElement.querySelector(`.hidden-desc-${index}`)
    const ditherBackground = cardElement.querySelector(`.dither-bg-${index}`)
    const arrow = cardElement.querySelector(`.arrow-${index}`)
    const projectList = index === 1 ? cardElement.querySelector('.project-list') : null;
    
    // Получаем элементы для нормального и hover состояния
    const normalTitle = cardElement.querySelector(`.normal-title-${index}`)
    const hoverTitle = cardElement.querySelector(`.hover-title-${index}`)
    const normalDesc = cardElement.querySelector(`.normal-desc-${index}`)
    const hoverDesc = cardElement.querySelector(`.hover-desc-${index}`)

    // Прерываем все текущие анимации и возвращаем элементы в исходное состояние, чтобы избежать залипания
    gsap.killTweensOf([ditherBackground, arrow, hiddenElement, normalTitle, hoverTitle, normalDesc, hoverDesc]);
    if (projectList) {
      gsap.killTweensOf(projectList);
      gsap.set(projectList, { x: '-100%', opacity: 0 });
    }
    gsap.set([normalTitle, hoverTitle, normalDesc, hoverDesc], { x: 0, clearProps: "transform" })
    // Принудительно сбрасываем стрелочку в исходное состояние
    gsap.set(arrow, { x: 0, y: 0, rotation: 0, opacity: 1, clearProps: "transform" })

    setHoveredIndex(isHovering ? index : null);

    const colors = ['#0000FF', '#800080', '#008000', '#FFFFFF'];
    const defaultColor = '#D14836';

    if (isHovering) {
      setParticleProps(prev => ({ ...prev, color: colors[index] }));
    } else {
      setParticleProps(prev => ({ ...prev, color: defaultColor }));
    }

    if (index === 1 && isHovering) {
      setHoveredRect(cardElement.getBoundingClientRect());
    } else if (index === 1 && !isHovering) {
      setHoveredRect(null);
    }

    if (isHovering) {
      // Анимируем белый фон
      if (ditherBackground) {
        gsap.to(ditherBackground, {
          width: '100%',
          duration: 0.3,
          ease: "power2.out"
        })
      }

      // Анимация стрелки
      if (arrow) {
        gsap.to(arrow, {
          x: 10,
          rotation: 45,
          opacity: 0.8,
          duration: 0.3,
          ease: "power2.out"
        });
      }

      // Скрываем нормальные элементы резко (без движения влево)
      gsap.to([normalTitle, normalDesc], {
        opacity: 0,
        duration: 0.05, // Очень быстрое исчезновение
        ease: "power2.out"
      });

      // Показываем hover элементы (они начинают слева и выезжают вправо)
      gsap.fromTo([hoverTitle, hoverDesc], 
        { x: -100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.3,
          delay: 0.1,
          ease: "power2.out"
        }
      );

      // Показываем описание с анимацией снизу вверх
      gsap.to(hiddenElement, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        delay: 0.2,
        ease: "power2.out"
      });

      // Анимируем изображение для index 0
      if (index === 0) {
        const profileImg = cardElement.querySelector('.profile-img');
        if (profileImg) {
          gsap.to(profileImg, {
            opacity: 1,
            y: 0,
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out"
          });
        }
      }

      // Для Projects: анимируем список
      if (index === 1) {
        const projectList = cardElement.querySelector('.project-list');
        if (projectList) {
          gsap.to(projectList, {
            x: 0,
            opacity: 1,
            duration: 0.4,
            delay: 0.2,
            ease: "power2.out"
          });
        }
      }
    } else {
      // Скрываем белый фон
      if (ditherBackground) {
        gsap.to(ditherBackground, {
          width: '0%',
          duration: 0.3,
          ease: "power2.out"
        });
      }

      // Анимация стрелки обратно
      if (arrow) {
        gsap.to(arrow, {
          x: 0,
          rotation: 0,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      }

      // Скрываем hover элементы
      gsap.to([hoverTitle, hoverDesc], {
        x: -100,
        opacity: 0,
        duration: 0.15,
        ease: "power2.out",
        onComplete: () => {
          // Показываем нормальные элементы только после полного исчезновения hover элементов
          gsap.to([normalTitle, normalDesc], {
            x: 0,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out"
          })
        }
      });

      // Скрываем описание
      gsap.to(hiddenElement, {
        opacity: 0,
        y: 20,
        duration: 0.2,
        ease: "power2.out"
      });

      // Скрываем изображение для index 0
      if (index === 0) {
        const profileImg = cardElement.querySelector('.profile-img');
        if (profileImg) {
          gsap.to(profileImg, {
            opacity: 0,
            y: 20,
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        }
      }

      // Для Projects: скрываем список
      if (index === 1) {
        const projectList = cardElement.querySelector('.project-list');
        if (projectList) {
          gsap.to(projectList, {
            x: '-100%',
            opacity: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        }
      }
    }
  }

  // Подключаем интерактивное управление частицами
  const sensitivity = { wheel: 0.002, touch: 0.005 }
  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
  const { resetRotation } = useParticleControl(camera, !isMobile, sensitivity)

  useEffect(() => {
    window.scrollTo(0, 0);
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window

    // Немедленная анимация fade-in при загрузке
    cards.forEach((_, index) => {
      gsap.fromTo(`.card-${index}`, 
        { opacity: 0, y: 0 }, // Начинаем с y: 0, чтобы карточки не были смещены вниз
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: index * 0.1 // Лёгкая задержка для последовательности
        }
      )
      
      // Установка начального состояния текста без анимации
      const cardElement = cardRefs.current[index];
      if (cardElement) {
        const normalTitle = cardElement.querySelector(`.normal-title-${index}`);
        const normalDesc = cardElement.querySelector(`.normal-desc-${index}`);
        
        if (normalTitle) {
          gsap.set(normalTitle, { x: 0, opacity: 1 });
        }
        
        if (normalDesc) {
          gsap.set(normalDesc, { x: 0, opacity: 1 });
        }
      }
    });

    // Preload dither effects
    cardRefs.current.forEach((card, index) => {
      if (card) {
        const dither = card.querySelector(`.dither-bg-${index}`);
        if (dither) {
          gsap.set(dither, { width: '100%', opacity: 0 });
          setTimeout(() => {
            gsap.set(dither, { width: '0%', opacity: 1 });
          }, 100);
        }
      }
    });

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
        if (isTransitioningRef.current) return
        isTransitioningRef.current = true
        
        // Анимация затухания
        gsap.to(menuRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out",
          onComplete: () => {
            sessionStorage.setItem('returning-to-home', 'true')
            navigate('/home')
          }
        })
      }
      
      navigationEdge.addEventListener('mouseenter', handleMouseEnter)
      navigationEdge.addEventListener('mouseleave', handleMouseLeave)
      navigationEdge.addEventListener('click', handleClick)
      
      return () => {
        navigationEdge.removeEventListener('mouseenter', handleMouseEnter)
        navigationEdge.removeEventListener('mouseleave', handleMouseLeave)
        navigationEdge.removeEventListener('click', handleClick)
      }
    }

    return () => {
      // Очистка анимаций
    }
  }, [navigate])

  const handleMenuClick = (item) => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true
    
    // Анимация вспышки
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
        navigate(item.route)
        
        setTimeout(() => {
          if (document.body.contains(flashOverlay)) {
            document.body.removeChild(flashOverlay)
          }
          setTimeout(() => {
            isTransitioningRef.current = false
          }, 1000)
        }, 100)
      }
    })
  }

  return (
    <MenuContainer>
      <CustomCursor />
      
      <NavigationEdge className="navigation-edge-left" />
      <NavigationHint className="navigation-hint-left">
        ← Домой
      </NavigationHint>
      
      <Section ref={menuRef}>
        <CardRow>
          {cards.map((card, index) => (
            <Card
              ref={(el) => (cardRefs.current[index] = el)}
              className={`card-${index}`}
              key={index}
              onMouseEnter={() => handleHover(index, true)}
              onMouseLeave={() => handleHover(index, false)}
            >
              <DitherBackground className={`dither-bg-${index}`}>
                <Dither style={{position: 'absolute', top:0, left:0, width:'100%', height:'100%'}} waveColor={waveColors[index]} />
              </DitherBackground>
              <CardContent>
                <TitleSection>
                  <CardTitle className={`normal-title-${index}`}>{card.title}</CardTitle>
                  <CardTitle className={`hover-title-${index}`} style={{position: 'absolute', top: 0, left: 0, opacity: 0, transform: 'translateX(-100px)'}}>{card.title}</CardTitle>
                  
                  
                  <HiddenDescription className={`hidden-desc-${index}`}>
                    <p>{card.hiddenDesc}</p>
                  </HiddenDescription>
                </TitleSection>
                <Arrow className={`arrow-${index}`}>→</Arrow>
              </CardContent>
              {index === 0 && <img src="/images/rudakovrz7.png?v=1" alt="Rudakovrz" className="profile-img" />}
              {index === 1 && (
                <ProjectList className="project-list">
                  <h4>Завершенные проекты</h4>
                  <ul>
                    <li><button onClick={() => navigate('/project/light-lab')}>Light Lab Case</button></li>
                    <li><button onClick={() => navigate('/project/space-invaders')}>Space Invaders</button></li>
                  </ul>
                  <h4>В разработке</h4>
                  <ul>
                    <li><button>Project A</button></li>
                    <li><button>Project B</button></li>
                  </ul>
                </ProjectList>
              )}
            </Card>
          ))}
        </CardRow>
      </Section>
        
      <MobileNavigation />
    </MenuContainer>
  )
}

export default MenuPage

const ProjectList = styled.div`
  position: absolute;
  top: 50%;
  left: 20px;
  right: 20px;
  transform: translateY(-50%) translateX(-100%);
  opacity: 0;
  z-index: 3;
  transition: all 0.3s ease;
  text-align: center;

  h4 {
    font-size: 24px;
    margin-bottom: 10px;
    color: white;
  }

  ul {
    list-style: none;
    padding: 0;
    margin-bottom: 20px;
  }

  li {
    margin: 5px 0;
    font-size: 18px; // Увеличенный шрифт
  }

  button {
    background: rgba(0,0,0,0.1);
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    margin: 5px;
    transition: background 0.3s;
    color: white;
    font-weight: 500;
    width: 80%;

    &:hover {
      background: rgba(0,0,0,0.2);
    }
  }
`;

// Preload dither effects
const preloadImage = new Image();
preloadImage.src = '/images/rudakovrz7.png?v=1';

// Обработка наведения на левый край