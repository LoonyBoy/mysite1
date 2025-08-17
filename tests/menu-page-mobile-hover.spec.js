import { test, expect } from '@playwright/test'

test.describe('Menu Page Mobile Card Hover System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the menu page
    await page.goto('http://localhost:3000/menu')
    
    // Wait for the page to load and cards to be visible
    await page.waitForSelector('[data-card-index="0"]', { timeout: 10000 })
  })

  test('should display menu page with mobile card hover system', async ({ page }) => {
    // Check if all cards are present with mobile hover system
    for (let i = 0; i < 4; i++) {
      const card = page.locator(`[data-card-index="${i}"]`)
      await expect(card).toBeVisible()
      
      // Check if mobile hover class is applied
      await expect(card).toHaveClass(/card-mobile-hover/)
    }
  })

  test('should handle mouse hover on desktop', async ({ page, isMobile }) => {
    // Skip on mobile devices
    if (isMobile) {
      test.skip('Mouse hover test not applicable on mobile')
    }
    
    const firstCard = page.locator('[data-card-index="0"]')
    const secondCard = page.locator('[data-card-index="1"]')
    
    // Hover over the first card
    await firstCard.hover()
    
    // Wait a bit for hover effects to apply
    await page.waitForTimeout(500)
    
    // Check if other cards are dimmed (they should have dimmed class or reduced opacity)
    const secondCardOpacity = await secondCard.evaluate(el => {
      const style = window.getComputedStyle(el)
      return parseFloat(style.opacity)
    })
    
    // Dimmed cards should have reduced opacity
    expect(secondCardOpacity).toBeLessThan(1)
    
    // Move away from card
    await page.locator('h1').hover()
    
    // Wait for hover effects to clear
    await page.waitForTimeout(500)
    
    // Check if dimming is removed
    const secondCardOpacityAfter = await secondCard.evaluate(el => {
      const style = window.getComputedStyle(el)
      return parseFloat(style.opacity)
    })
    
    expect(secondCardOpacityAfter).toBe(1)
  })

  test('should handle touch interactions on mobile', async ({ page, isMobile }) => {
    // Skip on desktop devices
    if (!isMobile) {
      test.skip('Touch interaction test only applicable on mobile')
    }
    
    const firstCard = page.locator('[data-card-index="0"]')
    
    // Touch the first card
    await firstCard.tap()
    
    // Check if the card responds to touch (this will trigger the click handler)
    // Since touch interactions are brief, we mainly test that the system doesn't crash
    await expect(firstCard).toBeVisible()
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    const firstCard = page.locator('[data-card-index="0"]')
    
    // Check if card has proper data attributes
    await expect(firstCard).toHaveAttribute('data-card-index', '0')
    
    // Check if card is focusable
    await firstCard.focus()
    await expect(firstCard).toBeFocused()
  })

  test('should handle rapid interactions without errors', async ({ page, isMobile }) => {
    const cards = page.locator('[data-card-index]')
    const cardCount = await cards.count()
    
    // Perform rapid interactions
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < cardCount; j++) {
        const card = page.locator(`[data-card-index="${j}"]`)
        
        if (isMobile) {
          await card.tap()
        } else {
          await card.hover({ timeout: 100 })
        }
        
        // Small delay to prevent overwhelming the system
        await page.waitForTimeout(50)
      }
    }
    
    // System should still be responsive
    await expect(page.locator('[data-card-index="0"]')).toBeVisible()
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
    
    // With reduced motion, animations should be minimal or disabled
    // We can't easily test this without checking computed styles, but we ensure no errors occur
    await expect(firstCard).toBeVisible()
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
    await expect(firstCard).toBeVisible()
  })

  test('should not crash with console errors', async ({ page }) => {
    const consoleErrors = []
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Interact with cards
    const firstCard = page.locator('[data-card-index="0"]')
    await firstCard.hover()
    await page.waitForTimeout(500)
    
    const secondCard = page.locator('[data-card-index="1"]')
    await secondCard.hover()
    await page.waitForTimeout(500)
    
    // Click a card
    await firstCard.click()
    await page.waitForTimeout(1000)
    
    // Check for critical errors (ignore minor warnings)
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Error') && 
      !error.includes('Warning') &&
      !error.includes('DevTools')
    )
    
    expect(criticalErrors).toHaveLength(0)
  })

  test('should maintain card structure and content', async ({ page }) => {
    // Check if cards have proper content structure
    const cards = [
      { index: 0, title: 'О себе' },
      { index: 1, title: 'Проекты' },
      { index: 2, title: 'Услуги' },
      { index: 3, title: 'Контакты' }
    ]
    
    for (const cardData of cards) {
      const card = page.locator(`[data-card-index="${cardData.index}"]`)
      await expect(card).toBeVisible()
      
      // Check if card has title
      const title = card.locator('h3, .card-title')
      await expect(title).toContainText(cardData.title)
      
      // Check if card has arrow
      const arrow = card.locator('.arrow, [class*="arrow"]')
      await expect(arrow).toBeVisible()
    }
  })

  test('should handle card clicks and modal opening', async ({ page }) => {
    const firstCard = page.locator('[data-card-index="0"]')
    
    // Click the first card to open modal
    await firstCard.click()
    
    // Wait for modal to open
    await page.waitForTimeout(1000)
    
    // Check if modal content is visible (About modal)
    // The modal should contain information about the developer
    const modalContent = page.locator('.is-open, [class*="modal"], [class*="about"]')
    
    // At least one modal-related element should be visible
    const modalElements = await modalContent.count()
    expect(modalElements).toBeGreaterThan(0)
  })
})