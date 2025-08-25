// Desktop Modal Animations – Progressive Section Reveal
// Fits the site's card design: sharp corners, subtle scan/blur accents, and red/purple theme.

import { gsap } from 'gsap'

class DesktopModalAnimations {
  constructor() {
    this.prefersReducedMotion = false
    try {
      this.prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {}

    // Timings tuned for desktop feel, subtle and quick
    this.timings = {
      open: 0.5,
      close: 0.32,
      sectionStagger: 0.06,
      overlap: 0.12
    }

    this.easing = {
      in: 'power3.out',
      out: 'power2.in',
      line: 'power2.out'
    }
  }

  // Tries to locate the main content container inside an opened card
  getContentRoot(cardElement) {
    if (!cardElement) return null
    // Priority: explicit modal containers used in MenuPage
    const selectors = [
      '.about-modal',
      '[data-testid="projects-modal"]',
      '.services-modal',
      '.projects-modal',
      '.modal-content',
    ]
    for (const sel of selectors) {
      const el = cardElement.querySelector(sel)
      if (el) return el
    }
    // Fallback to CardContent within is-open card
    const fallback = cardElement.querySelector('[class*="CardContent"], .card-content, [data-stagger-root]')
    return fallback || cardElement
  }

  // Collect common sections to animate progressively
  collectSections(root) {
    const q = (sel) => Array.from(root.querySelectorAll(sel))

    // Headings and key lines
    const headings = q('h1, h2, h3, .title, .section-title')
    const underlines = q('[class*="Underline"], .underline')

    // Primary sections (left column text, key summaries)
    const primary = [
      ...q('.about-left, .about-section, .summary, .lead, .subtitle'),
      ...q('p, .intro, .description'),
      // FAQ summaries count as primary interactive text
      ...q('.faq-accordion summary')
    ]

    // Media and hero visuals
    const media = [
      ...q('img, video, canvas, .hero, .about-photo, [class*="Photo"], [class*="Image"]')
    ]

    // Grids and lists
    const grids = [
      ...q('.projects-grid, .feature-grid, .pricing-grid, .grid, ul, ol'),
      // Treat FAQ answers as grid/list to reveal after primary (content only)
      ...q('.faq-accordion .faq-content')
    ]

    // Actions/buttons
    const actions = q('button, .button, a[role="button"], .actions, .cta')

    return { headings, underlines, primary, media, grids, actions }
  }

  // Prepare initial hidden states to avoid content flashing before Flip completes
  prepareModalOpen(cardElement, contentRoot = null) {
    const root = contentRoot || this.getContentRoot(cardElement)
    if (!root) return
    if (this.prefersReducedMotion) return
    const { headings, underlines, primary, media, grids, actions } = this.collectSections(root)
    this.setInitial(headings, { opacity: 0, y: 10, willChange: 'opacity, transform' })
    this.setInitial(primary, { opacity: 0, y: 12, willChange: 'opacity, transform' })
    this.setInitial(media, { opacity: 0, y: 14, scale: 0.98, willChange: 'opacity, transform' })
    this.setInitial(grids, { opacity: 0, y: 16, willChange: 'opacity, transform' })
    this.setInitial(actions, { opacity: 0, y: 12, willChange: 'opacity, transform' })
    this.setInitial(underlines, { scaleX: 0, transformOrigin: 'left center', opacity: 1, willChange: 'transform' })
  }

  // Prepare initial state for a group of elements
  setInitial(elements, props) {
    if (!elements || elements.length === 0) return
    gsap.set(elements, props)
  }

  animateModalOpen(cardElement, contentRoot = null) {
    if (!cardElement) return null
    if (this.prefersReducedMotion) {
      // Minimal instant appearance
      const root = contentRoot || this.getContentRoot(cardElement)
  if (root) gsap.set(root, { opacity: 1, y: 0 })
      return null
    }

    const root = contentRoot || this.getContentRoot(cardElement)
    if (!root) return null

    const { headings, underlines, primary, media, grids, actions } = this.collectSections(root)

    // Initial states
    this.setInitial(headings, { opacity: 0, y: 10, willChange: 'opacity, transform' })
    this.setInitial(primary, { opacity: 0, y: 12, willChange: 'opacity, transform' })
    this.setInitial(media, { opacity: 0, y: 14, scale: 0.98, willChange: 'opacity, transform' })
    this.setInitial(grids, { opacity: 0, y: 16, willChange: 'opacity, transform' })
    this.setInitial(actions, { opacity: 0, y: 12, willChange: 'opacity, transform' })
    this.setInitial(underlines, { scaleX: 0, transformOrigin: 'left center', opacity: 1, willChange: 'transform' })

  const tl = gsap.timeline({ defaults: { ease: this.easing.in } })

  // Bring root from hidden to visible quickly to avoid flash, then reveal sections
  tl.to(root, { opacity: 1, y: 0, duration: this.timings.open * 0.35, ease: 'power2.out' }, 0)

    // 1) Headings in
    if (headings.length) tl.to(headings, { opacity: 1, y: 0, duration: this.timings.open * 0.6, stagger: this.timings.sectionStagger }, 0)

    // 1.1) Underline draw shortly after heading appears
    if (underlines.length) tl.to(underlines, { scaleX: 1, duration: this.timings.open * 0.45, ease: this.easing.line }, this.timings.sectionStagger * 2)

    // 2) Primary text
    if (primary.length) tl.to(primary, { opacity: 1, y: 0, duration: this.timings.open * 0.65, stagger: this.timings.sectionStagger }, this.timings.overlap)

    // 3) Media
    if (media.length) tl.to(media, { opacity: 1, y: 0, scale: 1, duration: this.timings.open * 0.7, stagger: this.timings.sectionStagger }, this.timings.overlap * 1.2)

    // 4) Grids/lists
    if (grids.length) tl.to(grids, { opacity: 1, y: 0, duration: this.timings.open * 0.7, stagger: this.timings.sectionStagger }, this.timings.overlap * 1.5)

    // 5) Actions/CTAs
    if (actions.length) tl.to(actions, { opacity: 1, y: 0, duration: this.timings.open * 0.6, stagger: this.timings.sectionStagger }, this.timings.overlap * 1.8)

    // Cleanup will-change after animation
    tl.add(() => {
      ;[headings, primary, media, grids, actions].forEach(arr => arr && arr.forEach(el => { try { el.style.willChange = 'auto' } catch {} }))
    })

    return tl
  }

  animateModalClose(cardElement, contentRoot = null) {
    if (!cardElement) return null
    const root = contentRoot || this.getContentRoot(cardElement)
    if (!root) return null

    if (this.prefersReducedMotion) {
      gsap.set(root, { opacity: 0 })
      return null
    }

  const { headings, primary, media, grids, actions, underlines } = this.collectSections(root)
    const all = [
      ...(headings || []),
      ...(primary || []),
      ...(media || []),
      ...(grids || []),
      ...(actions || [])
    ]

    // Quick progressive exit, reverse order for a neat collapse
  const tl = gsap.timeline({ defaults: { ease: this.easing.out, duration: this.timings.close * 0.7 } })

  // Start fading root while children exit
  tl.to(root, { opacity: 0.001, duration: this.timings.close * 0.6 }, 0)
    if (underlines && underlines.length) tl.to(underlines, { scaleX: 0, duration: this.timings.close * 0.5 }, 0)
    if (all.length) tl.to(all.reverse(), { opacity: 0, y: -8, stagger: this.timings.sectionStagger * 0.8 }, 0)

    return tl
  }
}

export default DesktopModalAnimations
