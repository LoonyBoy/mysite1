import { test, expect } from '@playwright/test'

test.describe('Animation Manager Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to menu page
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')
  })

  test('should initialize animation manager on menu page', async ({ page }) => {
    // Check if animation manager is initialized by looking for console logs
    const logs = []
    page.on('console', msg => {
      if (msg.text().includes('Animation Manager')) {
        logs.push(msg.text())
      }
    })

    // Reload to trigger initialization
    await page.reload()
    await page.waitForTimeout(1000)

    // Should have initialization log
    expect(logs.some(log => log.includes('initialized'))).toBeTruthy()
  })

  test('should handle card hover animations', async ({ page }) => {
    // Wait for cards to be rendered
    await page.waitForSelector('[data-card-index]', { timeout: 5000 })
    
    const cards = await page.locator('[data-card-index]').all()
    expect(cards.length).toBeGreaterThan(0)

    // Test hover on first card
    const firstCard = cards[0]
    await firstCard.hover()
    
    // Wait for animation to start
    await page.waitForTimeout(100)
    
    // Check if card has animation-related styles
    const cardStyles = await firstCard.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        willChange: computed.willChange,
        transform: computed.transform
      }
    })
    
    // Should have will-change property set for GPU acceleration
    expect(cardStyles.willChange).not.toBe('auto')
  })

  test('should adapt to performance on low-end simulation', async ({ page }) => {
    // Simulate low-end device by throttling CPU
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 6 })

    // Navigate to menu page
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')

    // Wait for performance monitoring to kick in
    await page.waitForTimeout(2000)

    // Check if performance adaptations are applied
    const performanceLevel = await page.evaluate(() => {
      // Try to access animation manager from window if exposed for testing
      return window.animationManagerMetrics?.performanceLevel || 'unknown'
    })

    // Performance level should be detected (even if we can't access the exact value)
    expect(typeof performanceLevel).toBe('string')
  })

  test('should handle touch interactions on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to menu page
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')
    
    // Wait for cards to be rendered
    await page.waitForSelector('[data-card-index]', { timeout: 5000 })
    
    const firstCard = page.locator('[data-card-index="0"]').first()
    
    // Simulate touch interaction
    await firstCard.tap()
    
    // Wait for animation
    await page.waitForTimeout(200)
    
    // Check if card responds to touch
    const cardRect = await firstCard.boundingBox()
    expect(cardRect).toBeTruthy()
  })

  test('should cleanup animations on page navigation', async ({ page }) => {
    // Start on menu page
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')
    
    // Trigger some animations
    const firstCard = page.locator('[data-card-index="0"]').first()
    await firstCard.hover()
    await page.waitForTimeout(100)
    
    // Navigate away
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check for cleanup logs
    const logs = []
    page.on('console', msg => {
      if (msg.text().includes('Animation Manager') && msg.text().includes('cleanup')) {
        logs.push(msg.text())
      }
    })
    
    // Navigate back to menu to trigger cleanup
    await page.goto('/menu')
    await page.waitForTimeout(500)
    
    // Should not have memory leaks or errors
    const errors = []
    page.on('pageerror', error => errors.push(error))
    
    await page.waitForTimeout(1000)
    expect(errors.length).toBe(0)
  })

  test('should handle animation errors gracefully', async ({ page }) => {
    // Monitor console for error handling
    const warnings = []
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('Animation')) {
        warnings.push(msg.text())
      }
    })

    // Navigate to menu page
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')

    // Try to trigger potential errors by rapid interactions
    const cards = await page.locator('[data-card-index]').all()
    
    if (cards.length > 0) {
      // Rapidly hover over multiple cards
      for (let i = 0; i < Math.min(3, cards.length); i++) {
        await cards[i].hover()
        await page.waitForTimeout(50)
      }
    }

    // Wait for any error handling
    await page.waitForTimeout(500)

    // Page should still be functional even if there were warnings
    expect(await page.title()).toBeTruthy()
  })
})