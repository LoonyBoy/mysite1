import { useState, useEffect } from 'react'

/**
 * Hook для отслеживания видимости страницы
 * Возвращает true если страница активна, false если пользователь переключился на другую вкладку
 */
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return isVisible
}

export default usePageVisibility
