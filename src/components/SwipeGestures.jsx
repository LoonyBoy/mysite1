import { useEffect } from 'react'

const SwipeGestures = () => {
  useEffect(() => {
    let startY = 0
    let startX = 0
    let startTime = 0
    let isVerticalSwipe = false
    
    const handleTouchStart = (e) => {
      const touch = e.touches[0]
      startY = touch.clientY
      startX = touch.clientX
      startTime = Date.now()
      isVerticalSwipe = false
    }

    const handleTouchMove = (e) => {
      if (!startY || !startX) return
      
      const touch = e.touches[0]
      const diffY = startY - touch.clientY
      const diffX = startX - touch.clientX
      
      // Определяем направление свайпа
      if (Math.abs(diffY) > Math.abs(diffX)) {
        isVerticalSwipe = true
      }
      
      // НЕ предотвращаем обычный скролл
      // e.preventDefault() - УБИРАЕМ это
    }

    const handleTouchEnd = (e) => {
      if (!startY || !startX || !isVerticalSwipe || !canSwipe()) return
      
      const touch = e.changedTouches[0]
      const diffY = startY - touch.clientY
      const minSwipeDistance = 100 // Увеличиваем еще больше для предотвращения конфликтов
      
      // Проверяем, что это быстрый и четкий свайп
      const swipeTime = Date.now() - startTime
      const isQuickSwipe = swipeTime < 250
      const velocity = Math.abs(diffY) / swipeTime
      
      if (Math.abs(diffY) > minSwipeDistance && isQuickSwipe && velocity > 0.5) {
        const sections = ['hero', 'projects', 'contact']
        const currentSection = getCurrentSection()
        const currentIndex = sections.indexOf(currentSection)
        
        // Добавляем проверку, что мы не в середине секции при скролле
        const isAtSectionBoundary = () => {
          const scrollTop = window.scrollY
          const windowHeight = window.innerHeight
          const docHeight = document.documentElement.scrollHeight
          
          return scrollTop < 50 || scrollTop > docHeight - windowHeight - 50
        }
        
        if (isAtSectionBoundary()) {
          if (diffY > 0 && currentIndex < sections.length - 1) {
            // Swipe up - следующая секция
            scrollToSection(sections[currentIndex + 1])
          } else if (diffY < 0 && currentIndex > 0) {
            // Swipe down - предыдущая секция
            scrollToSection(sections[currentIndex - 1])
          }
        }
      }
      
      startY = 0
      startX = 0
      isVerticalSwipe = false
    }

    const getCurrentSection = () => {
      const sections = document.querySelectorAll('section[id]')
      const scrollPosition = window.scrollY + window.innerHeight / 2
      
      for (let section of sections) {
        const sectionTop = section.offsetTop
        const sectionBottom = sectionTop + section.offsetHeight
        
        if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
          return section.id
        }
      }
      
      return 'hero'
    }

    const canSwipe = () => {
      // Проверяем, что пользователь не скроллит активно
      const now = Date.now()
      if (now - lastScrollTime < 200) {
        return false
      }
      
      // Проверяем, что касание происходит не на интерактивных элементах
      const activeElement = document.activeElement
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return false
      }
      
      return true
    }

    let lastScrollTime = 0
    const handleScroll = () => {
      lastScrollTime = Date.now()
    }

    const scrollToSection = (sectionId) => {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
        
        // Вибрация для тактильной обратной связи
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }
    }

    // Добавляем обработчики только на мобильных устройствах
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    
    if (isMobile) {
      // Добавляем обработчики с опцией passive для лучшей производительности
      const options = { passive: true, capture: false }
      document.addEventListener('touchstart', handleTouchStart, options)
      document.addEventListener('touchmove', handleTouchMove, options)
      document.addEventListener('touchend', handleTouchEnd, options)
      document.addEventListener('scroll', handleScroll, options)
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart, options)
        document.removeEventListener('touchmove', handleTouchMove, options)
        document.removeEventListener('touchend', handleTouchEnd, options)
        document.removeEventListener('scroll', handleScroll, options)
      }
    }

    return () => {}
  }, [])

  return null
}

export default SwipeGestures 