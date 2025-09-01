import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/**
 * Хук для управления производительностью анимаций
 * Автоматически приостанавливает анимации когда страница неактивна
 */
export const usePerformanceOptimization = (isPageVisible, pauseParticles, resumeParticles) => {
  const savedRAFsRef = useRef([])
  const originalRAF = useRef(null)
  const pauseParticlesRef = useRef(pauseParticles)
  const resumeParticlesRef = useRef(resumeParticles)
  const lastStateRef = useRef(isPageVisible) // Защита от повторных вызовов
  // NOTE: overriding requestAnimationFrame during page hide previously caused
  // infinite animation loops (cursor, particles) to permanently stop after alt-tab.
  // We now avoid monkey-patching RAF; browsers already throttle hidden tabs.
  // Leaving variables (savedRAFsRef/originalRAF) for potential future nuanced throttle.
  
  // Обновляем ссылки на функции
  useEffect(() => {
    pauseParticlesRef.current = pauseParticles
    resumeParticlesRef.current = resumeParticles
  })
  
  useEffect(() => {
    // Сохраняем оригинальный requestAnimationFrame при первом запуске
    if (!originalRAF.current) {
      originalRAF.current = window.requestAnimationFrame
    }
  }, [])
  
  useEffect(() => {
    // Защита от повторных вызовов с тем же состоянием
    if (lastStateRef.current === isPageVisible) {
      return
    }
    lastStateRef.current = isPageVisible
    
    if (!isPageVisible) {
      console.log('[PERFORMANCE] Pausing animations - page hidden (no RAF override)')
      gsap.globalTimeline.pause()
      if (pauseParticlesRef.current) {
        try { pauseParticlesRef.current() } catch (error) { console.warn('[PERFORMANCE] Error pausing particles:', error) }
      }
    } else {
      console.log('[PERFORMANCE] Resuming animations - page visible (no RAF override)')
      gsap.globalTimeline.play()
      if (resumeParticlesRef.current) {
        try { resumeParticlesRef.current() } catch (error) { console.warn('[PERFORMANCE] Error resuming particles:', error) }
      }
    }
  }, [isPageVisible]) // Убираем pauseParticles и resumeParticles из зависимостей
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
  // No RAF override performed; nothing special to restore.
  savedRAFsRef.current.forEach(id => cancelAnimationFrame(id))
    }
  }, [])
}

export default usePerformanceOptimization
