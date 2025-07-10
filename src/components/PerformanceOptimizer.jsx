import { useEffect } from 'react'

const PerformanceOptimizer = () => {
  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    // Определяем слабые устройства
    const isLowEndDevice = () => {
      return (
        navigator.hardwareConcurrency <= 2 ||
        navigator.deviceMemory <= 2 ||
        /Android.*Version\/4\.[0-3]/.test(navigator.userAgent)
      )
    }

    if (isMobile || prefersReducedMotion || isLowEndDevice()) {
      // Отключаем сложные анимации
      document.documentElement.style.setProperty('--animation-duration', '0.1s')
      document.documentElement.style.setProperty('--reduced-motion', '1')
      
      // Уменьшаем количество частиц
      const particleCount = isLowEndDevice() ? 500 : 1000
      document.documentElement.style.setProperty('--particle-count', particleCount.toString())
      
      // Добавляем класс для условной стилизации
      document.documentElement.classList.add('performance-mode')
    }

    // Ленивая загрузка для тяжелых компонентов
    const observerOptions = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    }

    const lazyComponents = document.querySelectorAll('[data-lazy]')
    
    const componentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target
          element.classList.add('loaded')
          componentObserver.unobserve(element)
        }
      })
    }, observerOptions)

    lazyComponents.forEach(component => {
      componentObserver.observe(component)
    })

    // Пауза анимаций при потере фокуса
    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.documentElement.classList.add('paused')
      } else {
        document.documentElement.classList.remove('paused')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      componentObserver.disconnect()
    }
  }, [])

  return null
}

export default PerformanceOptimizer 