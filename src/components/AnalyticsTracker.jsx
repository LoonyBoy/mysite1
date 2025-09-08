import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Tracks route changes and sends page_view events to GA4 and Yandex.Metrika.
 * Assumes global window.__GA_ID__ and window.__YM_ID__ are defined in index.html.
 */
export default function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname + (location.search || '')

    // Google Analytics 4
    if (window.gtag && window.__GA_ID__) {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_path: path,
        page_location: window.location.href
      })
    }

    // Yandex.Metrika
    if (window.ym && window.__YM_ID__) {
      window.ym(window.__YM_ID__, 'hit', path, {
        title: document.title,
        referer: document.referrer
      })
    }
  }, [location])

  return null
}
