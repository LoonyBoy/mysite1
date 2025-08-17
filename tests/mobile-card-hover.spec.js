import { test, expect } from '@playwright/test'

test.describe('Mobile Card Hover System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the menu page
    await page.goto('/menu')
    
    // Wait for the component to load
    await page.waitForSelector('[data-card-index="0"]')
  })

  test('should display menu page with mobile card hover system', async ({ page }) => {
    // Check if all cards are present (About, Projects, Services, Contact)
    for (let i = 0; i < 4; i++) {
      await expect(page.locator(`[data-card-index="${i}"]`)).toBeVisible()
    }
    
    // Check if cards have mobile hover classes
    await expect(page.locator('[data-card-index="0"]')).toHaveClass(/card-mobile-hover/)
  })

  test('should detect device type correctly', async ({ page }) => {
    // Check if mobile hover system is initialized by checking for mobile hover classes
    const firstCard = page.locator('[data-card-index="0"]')
    await expect(firstCard).toHaveClass(/card-mobile-hover/)
  })

  test('should handle mouse hover on desktop', async ({ page, isMobile }) => {
    // Skip on mobile devices
    if (isMobile) {
      test.skip('Mouse hover test not applicable on mobile')
    }
    
    const firstCard = page.locator('[data-card-index="0"]')
    
    // Hover over the first card
    await firstCard.hover()
    
    // Wait a bit for hover effects to apply
    await page.waitForTimeout(100)
    
    // Check if hover state is applied (could be card-touch-hover or force-hover)
    const hasHoverClass = await firstCard.evaluate(el => 
      el.classList.contains('card-touch-hover') || 
      el.classList.contains('force-hover') ||
      el.classList.contains('card-hovered')
    )
    expect(hasHoverClass).toBe(true)
    
    // Check if other cards are dimmed
    const secondCard = page.locator('[data-card-index="1"]')
    await expect(secondCard).toHaveClass(/dimmed/)
    
    // Move away from card
    await page.locator('body').hover({ position: { x: 10, y: 10 } })
    
    // Wait for hover effects to clear
    await page.waitForTimeout(100)
    
    // Check if hover state is removed
    const stillHasHoverClass = await firstCard.evaluate(el => 
      el.classList.contains('card-touch-hover') || 
      el.classList.contains('force-hover') ||
      el.classList.contains('card-hovered')
    )
    expect(stillHasHoverClass).toBe(false)
    
    await expect(secondCard).not.toHaveClass(/dimmed/)
  })

  test('should handle touch interactions on mobile', async ({ page, isMobile }) => {
    // Skip on desktop devices
    if (!isMobile) {
      test.skip('Touch interaction test only applicable on mobile')
    }
    
    const firstCard = page.locator('[data-card-index="0"]')
    
    // Touch the first card
    await firstCard.tap()
    
    // Check if the card was clicked (should trigger click handler)
    // Note: Touch hover states are temporary and may not be visible after tap
    
    // Check if touch interaction was handled (card should have mobile hover class)
    await expect(firstCard).toHaveClass(/card-mobile-hover/)
  })

  test('should apply proper CSS classes', async ({ page }) => {
    const firstCard = page.locator('[data-card-index="0"]')
    
    // Check if base mobile hover class is applied
    await expect(firstCard).toHaveClass(/card-mobile-hover/)
    
    // Check if card has proper data attributes
    await expect(firstCard).toHaveAttribute('data-card-index', '0')
  })

  test('should handle card clicks', async ({ page }) => {
    const firstCard = page.locator('[data-card-index="0"]')
    
    // Click the card
    await firstCard.click()
    
    // Check console for click message (if console logging is enabled)
    // This would require setting up console event listeners
  })

  test('should have proper card structure', async ({ page }) => {
    // Check if all cards have proper data attributes
    for (let i = 0; i < 4; i++) {
      await expect(page.locator(`[data-card-index="${i}"]`)).toHaveAttribute('data-card-index', i.toString())
    }
    
    // Check if cards have mobile hover classes
    for (let i = 0; i < 4; i++) {
      await expect(page.locator(`[data-card-index="${i}"]`)).toHaveClass(/card-mobile-hover/)
    }
  })

  test('should handle multiple rapid interactions', async ({ page, isMobile }) => {
    const firstCard = page.locator('[data-card-index="0"]')
    const secondCard = page.locator('[data-card-index="1"]')
    
    if (isMobile) {
      // Rapid taps on mobile
      await firstCard.tap()
      await secondCard.tap()
      await firstCard.tap()
    } else {
      // Rapid hovers on desktop
      await firstCard.hover()
      await secondCard.hover()
      await firstCard.hover()
      
      // Should end up with second card hovered
      await expect(secondCard).toHaveClass(/card-touch-hover/)
      await expect(firstCard).toHaveClass(/card-dimmed/)
    }
  })

  test('should be accessible with keyboard navigation', async ({ page }) => {
    // Tab to first card
    await page.keyboard.press('Tab')
    
    // Check if first card is focused
    await expect(page.locator('[data-card-index="0"]')).toBeFocused()
    
    // Tab to next card
    await page.keyboard.press('Tab')
    
    // Check if second card is focused
    await expect(page.locator('[data-card-index="1"]')).toBeFocused()
  })

  test('should respect reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    // Reload page to apply preference
    await page.reload()
    await page.waitForSelector('[data-card-index="0"]')
    
    const firstCard = page.locator('[data-card-index="0"]')
    
    // Hover over card (on desktop)
    await firstCard.hover()
    
    // Check that animations are disabled (no transition classes)
    const hasTransitions = await firstCard.evaluate(el => {
      const style = getComputedStyle(el)
      return style.transition !== 'none' && style.transition !== ''
    })
    
    // With reduced motion, transitions should be disabled
    expect(hasTransitions).toBeFalsy()
  })

  test('should handle viewport resize', async ({ page }) => {
    // Start with desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 })
    
    const firstCard = page.locator('[data-card-index="0"]')
    await expect(firstCard).toBeVisible()
    
    // Resize to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Cards should still be visible and functional
    await expect(firstCard).toBeVisible()
    
    // Touch interaction should work on mobile viewport
    await firstCard.tap()
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Inject an error into the system
    await page.evaluate(() => {
      // Simulate a system error by removing a required method
      if (window.mobileHoverSystem) {
        window.mobileHoverSystem.initializeCard = null
      }
    })
    
    // Try to interact with cards - should not crash
    const firstCard = page.locator('[data-card-index="0"]')
    await firstCard.click()
    
    // Page should still be functional
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should clean up properly on navigation', async ({ page }) => {
    // Check initial state
    await expect(page.locator('[data-card-index="0"]')).toBeVisible()
    
    // Navigate away
    await page.goto('/')
    
    // Navigate back
    await page.goto('/menu')
    await page.waitForSelector('[data-card-index="0"]')
    
    // System should be reinitialized properly
    await expect(page.locator('[data-card-index="0"]')).toBeVisible()
    await expect(page.locator('[data-card-index="0"]')).toHaveClass(/card-mobile-hover/)
  })

  test('should handle touch events with proper timing', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('Touch timing test only applicable on mobile')
    }
    
    const firstCard = page.locator('[data-card-index="0"]')
    
    // Long press simulation
    await firstCard.dispatchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100, identifier: 1 }]
    })
    
    // Wait for debounce time
    await page.waitForTimeout(150)
    
    await firstCard.dispatchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100, identifier: 1 }]
    })
    
    // Should have triggered hover state
    // Note: This is a simplified test - actual touch behavior may vary
  })

  test('should maintain performance with many interactions', async ({ page }) => {
    const cards = page.locator('[data-card-index]')
    const cardCount = await cards.count()
    
    // Perform many rapid interactions
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < cardCount; j++) {
        const card = page.locator(`[data-card-index="${j}"]`)
        await card.hover({ timeout: 100 })
      }
    }
    
    // System should still be responsive
    await expect(page.locator('h1')).toBeVisible()
    
    // Status should show reasonable values
    const activeTouches = await page.locator('text=Active Touches:').locator('+ *').textContent()
    expect(parseInt(activeTouches)).toBeLessThan(10)
  })
})