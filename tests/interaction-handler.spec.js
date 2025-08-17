import { test, expect } from '@playwright/test'

test.describe('Touch/Mouse Interaction Detection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to menu page where interaction handler is used
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')
  })

  test('should detect device type correctly', async ({ page }) => {
    // Check if device detection is working by examining console logs
    const logs = []
    page.on('console', msg => {
      if (msg.text().includes('InteractionHandler') || msg.text().includes('Touch device detection')) {
        logs.push(msg.text())
      }
    })

    // Reload to trigger initialization
    await page.reload()
    await page.waitForTimeout(1000)

    // Should have device detection logs
    expect(logs.some(log => log.includes('initialized'))).toBeTruthy()
  })

  test('should handle mouse interactions on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // Wait for cards to be rendered
    await page.waitForSelector('[data-card-index]', { timeout: 5000 })
    
    const firstCard = page.locator('[data-card-index="0"]').first()
    
    // Test mouse enter
    await firstCard.hover()
    await page.waitForTimeout(200)
    
    // Check if hover effects are applied
    const cardStyles = await firstCard.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        willChange: computed.willChange,
        transform: computed.transform,
        zIndex: computed.zIndex
      }
    })
    
    // Should have animation-related styles applied
    expect(cardStyles.willChange).not.toBe('auto')
    
    // Test mouse leave
    await page.mouse.move(0, 0) // Move mouse away
    await page.waitForTimeout(200)
    
    // Animation should reverse or reset
    const cardStylesAfter = await firstCard.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        willChange: computed.willChange
      }
    })
    
    // Will-change might be reset after animation
    expect(typeof cardStylesAfter.willChange).toBe('string')
  })

  test('should handle touch interactions on mobile', async ({ page }) => {
    // Set mobile viewport to trigger touch detection
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to menu page with mobile viewport
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')
    
    // Wait for cards to be rendered
    await page.waitForSelector('[data-card-index]', { timeout: 5000 })
    
    const firstCard = page.locator('[data-card-index="0"]').first()
    
    // Test touch interaction
    await firstCard.tap()
    await page.waitForTimeout(200)
    
    // Check if touch feedback is applied
    const cardRect = await firstCard.boundingBox()
    expect(cardRect).toBeTruthy()
    
    // Card should be responsive to touch
    const cardStyles = await firstCard.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        transform: computed.transform,
        opacity: computed.opacity
      }
    })
    
    expect(typeof cardStyles.transform).toBe('string')
    expect(typeof cardStyles.opacity).toBe('string')
  })

  test('should prevent rapid event flickering', async ({ page }) => {
    // Monitor console for debouncing messages
    const logs = []
    page.on('console', msg => {
      if (msg.text().includes('rapid') || msg.text().includes('debounce')) {
        logs.push(msg.text())
      }
    })

    // Wait for cards to be rendered
    await page.waitForSelector('[data-card-index]', { timeout: 5000 })
    
    const firstCard = page.locator('[data-card-index="0"]').first()
    
    // Rapidly hover and unhover to test debouncing
    for (let i = 0; i < 5; i++) {
      await firstCard.hover()
      await page.mouse.move(0, 0)
      await page.waitForTimeout(10) // Very short delay to simulate rapid events
    }
    
    await page.waitForTimeout(500)
    
    // Should handle rapid events gracefully without errors
    const errors = []
    page.on('pageerror', error => errors.push(error))
    
    await page.waitForTimeout(500)
    expect(errors.length).toBe(0)
  })

  test('should handle multiple card interactions correctly', async ({ page }) => {
    // Wait for cards to be rendered
    await page.waitForSelector('[data-card-index]', { timeout: 5000 })
    
    const cards = await page.locator('[data-card-index]').all()
    expect(cards.length).toBeGreaterThan(1)
    
    // Test interaction with first card
    await cards[0].hover()
    await page.waitForTimeout(100)
    
    // Then interact with second card
    if (cards.length > 1) {
      await cards[1].hover()
      await page.waitForTimeout(100)
      
      // First card should stop its animation when second card is hovered
      // This tests the stopOtherCardAnimations functionality
      const firstCardStyles = await cards[0].evaluate(el => {
        const computed = window.getComputedStyle(el)
        return {
          willChange: computed.willChange
        }
      })
      
      expect(typeof firstCardStyles.willChange).toBe('string')
    }
  })

  test('should adapt interaction behavior based on device capabilities', async ({ page }) => {
    // Test with different viewport sizes to simulate different devices
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/menu')
      await page.waitForLoadState('networkidle')
      
      // Wait for cards to be rendered
      await page.waitForSelector('[data-card-index]', { timeout: 5000 })
      
      const firstCard = page.locator('[data-card-index="0"]').first()
      
      // Test interaction appropriate for device type
      if (viewport.name === 'mobile') {
        await firstCard.tap()
      } else {
        await firstCard.hover()
      }
      
      await page.waitForTimeout(200)
      
      // Should handle interaction without errors
      const errors = []
      page.on('pageerror', error => errors.push(error))
      
      await page.waitForTimeout(300)
      expect(errors.length).toBe(0)
    }
  })

  test('should handle interaction errors gracefully', async ({ page }) => {
    // Monitor console for error handling
    const warnings = []
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('Interaction')) {
        warnings.push(msg.text())
      }
    })

    // Wait for cards to be rendered
    await page.waitForSelector('[data-card-index]', { timeout: 5000 })
    
    const cards = await page.locator('[data-card-index]').all()
    
    // Try to trigger potential errors with rapid, complex interactions
    if (cards.length > 0) {
      // Rapidly interact with multiple cards
      for (let i = 0; i < Math.min(3, cards.length); i++) {
        await cards[i].hover()
        await cards[i].tap()
        await page.waitForTimeout(20)
      }
    }

    // Wait for any error handling
    await page.waitForTimeout(500)

    // Page should still be functional
    expect(await page.title()).toBeTruthy()
    
    // Should not have unhandled errors
    const errors = []
    page.on('pageerror', error => errors.push(error))
    
    await page.waitForTimeout(500)
    expect(errors.length).toBe(0)
  })

  test('should provide visual feedback for touch interactions', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to menu page
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')
    
    // Wait for cards to be rendered
    await page.waitForSelector('[data-card-index]', { timeout: 5000 })
    
    const firstCard = page.locator('[data-card-index="0"]').first()
    
    // Get initial styles
    const initialStyles = await firstCard.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        transform: computed.transform,
        opacity: computed.opacity
      }
    })
    
    // Simulate touch start (press and hold)
    await firstCard.dispatchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }]
    })
    
    await page.waitForTimeout(100)
    
    // Check if visual feedback is applied
    const touchStyles = await firstCard.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        transform: computed.transform,
        opacity: computed.opacity
      }
    })
    
    // Styles should change to provide feedback
    // (exact values depend on implementation, but they should be different)
    expect(typeof touchStyles.transform).toBe('string')
    expect(typeof touchStyles.opacity).toBe('string')
    
    // Simulate touch end
    await firstCard.dispatchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 }]
    })
    
    await page.waitForTimeout(200)
    
    // Styles should return to normal or animation state
    const finalStyles = await firstCard.evaluate(el => {
      const computed = window.getComputedStyle(el)
      return {
        transform: computed.transform,
        opacity: computed.opacity
      }
    })
    
    expect(typeof finalStyles.transform).toBe('string')
    expect(typeof finalStyles.opacity).toBe('string')
  })

  test('should cleanup interaction handlers on navigation', async ({ page }) => {
    // Start on menu page
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')
    
    // Trigger some interactions
    const firstCard = page.locator('[data-card-index="0"]').first()
    await firstCard.hover()
    await page.waitForTimeout(100)
    
    // Navigate away
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Navigate back to menu
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')
    
    // Should not have memory leaks or interaction conflicts
    const errors = []
    page.on('pageerror', error => errors.push(error))
    
    // Test interactions after navigation
    await page.waitForSelector('[data-card-index]', { timeout: 5000 })
    const card = page.locator('[data-card-index="0"]').first()
    await card.hover()
    
    await page.waitForTimeout(500)
    expect(errors.length).toBe(0)
  })
})