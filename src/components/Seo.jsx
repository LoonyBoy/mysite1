import { useEffect } from 'react'

// Lightweight SEO helper for SPA routes
// Usage: <Seo title="..." description="..." canonical="https://www.loonyboss.com/menu" ogImage="/images/photo1.webp" />
export default function Seo({
  title,
  description,
  canonical,
  ogImage,
  noindex = false,
  lang = 'ru-RU'
}) {
  useEffect(() => {
    const prevTitle = document.title
    if (title) document.title = title

    const ensure = (selector, attrs) => {
      let el = document.head.querySelector(selector)
      if (!el) {
        const tag = selector.startsWith('meta[') ? 'meta' : selector.startsWith('link[') ? 'link' : 'meta'
        el = document.createElement(tag)
        Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]))
        document.head.appendChild(el)
        return el
      }
      Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]))
      return el
    }

    const metas = []
    if (description) metas.push(ensure('meta[name="description"]', { name: 'description', content: description }))
    if (noindex) metas.push(ensure('meta[name="robots"]', { name: 'robots', content: 'noindex, nofollow' }))

    // Canonical
    let canonicalLink
    if (canonical) {
      canonicalLink = document.head.querySelector('link[rel="canonical"]')
      if (!canonicalLink) {
        canonicalLink = document.createElement('link')
        canonicalLink.setAttribute('rel', 'canonical')
        document.head.appendChild(canonicalLink)
      }
      canonicalLink.setAttribute('href', canonical)
    }

    // Open Graph / Twitter can help social snippets as well
    const ogTitle = ensure('meta[property="og:title"]', { property: 'og:title', content: title || document.title })
    const ogDesc = ensure('meta[property="og:description"]', { property: 'og:description', content: description || '' })
    const ogUrl = ensure('meta[property="og:url"]', { property: 'og:url', content: canonical || window.location.href })
    ensure('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    ensure('meta[property="og:locale"]', { property: 'og:locale', content: lang.replace('-', '_') })
    let ogImg
    if (ogImage) {
      const abs = ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`
      ogImg = ensure('meta[property="og:image"]', { property: 'og:image', content: abs })
    }

    const twCard = ensure('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
    const twTitle = ensure('meta[name="twitter:title"]', { name: 'twitter:title', content: title || document.title })
    const twDesc = ensure('meta[name="twitter:description"]', { name: 'twitter:description', content: description || '' })
    let twImg
    if (ogImage) {
      const abs = ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`
      twImg = ensure('meta[name="twitter:image"]', { name: 'twitter:image', content: abs })
    }

    return () => {
      // We keep tags persistent between route changes; restore title only
      document.title = prevTitle
    }
  }, [title, description, canonical, ogImage, noindex, lang])

  return null
}
