import { useEffect } from 'react'
import { gsap } from 'gsap'

const MobileScrollAnimations = () => {
  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    
    if (!isMobile) return

    // Настройка Intersection Observer для мобильных
    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -10% 0px',
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
    }

    const animateElement = (element, delay = 0) => {
      gsap.to(element, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: delay,
        ease: "power3.out"
      })
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
          const element = entry.target
          
          // Проекты
          if (element.classList.contains('project-card')) {
            const index = Array.from(element.parentNode.children).indexOf(element)
            animateElement(element, index * 0.1)
            observer.unobserve(element)
          }
          
          // Заголовки секций
          if (element.tagName === 'H2') {
            animateElement(element)
            observer.unobserve(element)
          }
          
          // Контакты
          if (element.classList.contains('animate')) {
            const index = Array.from(element.parentNode.children).indexOf(element)
            animateElement(element, index * 0.2)
            observer.unobserve(element)
          }
        }
      })
    }, observerOptions)

    // Наблюдаем за элементами после небольшой задержки
    setTimeout(() => {
      const elementsToObserve = document.querySelectorAll(
        '.project-card, section h2, .animate'
      )
      
      elementsToObserve.forEach((element) => {
        // Сбрасываем стили для корректной анимации
        if (element.classList.contains('project-card')) {
          element.style.opacity = '0'
          element.style.transform = 'translateY(50px)'
        }
        observer.observe(element)
      })
    }, 100)

    // Дополнительное наблюдение при скролле
    let scrollTimeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        // Проверяем видимые элементы при остановке скролла
        const visibleCards = document.querySelectorAll('.project-card')
        visibleCards.forEach((card) => {
          const rect = card.getBoundingClientRect()
          const windowHeight = window.innerHeight
          
          if (rect.top < windowHeight * 0.8 && rect.bottom > windowHeight * 0.2) {
            if (card.style.opacity === '0' || !card.style.opacity) {
              const index = Array.from(card.parentNode.children).indexOf(card)
              animateElement(card, 0)
            }
          }
        })
      }, 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('touchend', handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('touchend', handleScroll)
    }
  }, [])

  return null
}

export default MobileScrollAnimations 