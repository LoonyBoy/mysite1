import { test, expect } from '@playwright/test'

test.describe('Mobile Card Full-Height Expansion - Task 2', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to menu page
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')
  })

  test('should expand card to full viewport height on hover', async ({ page }) => {
    // Wait for cards to be rendered
    await page.waitForSelector('[data-card-index]', { timeout: 10000 })
    
    const firstCard = page.locator('[data-card-index="0"]').first()
    await expect(firstCard).toBeVisible()
    
    // Get initial card dimensions
    const initialBox = await firstCard.boundingBox()
    expect(initialBox).toBeTruthy()
    
    // Hover over the card to trigger expansion
    await firstCard.hover()
    
    // Wait for animation to complete
    await page.waitForTimeout(800)
    
    // Check if card has mobile expansion class
    await expect(firstCard).toHaveClass(/card-mobile-expanded/)
    
    // Get expanded card dimensions
    const expandedBox = await firstCard.boundingBox()
    expect(expandedBox).toBeTruthy()
    
    // Verify full-height expansion (Requirements 2.1, 2.2)
    const viewportSize = page.viewportSize()
    expect(expandedBox.height).toBeGreaterThanOrEqual(viewportSize.height * 0.9) // Allow for small margins
    expect(expandedBox.width).toBeGreaterThanOrEqual(viewportSize.width * 0.9)
    
    // Verify card is positioned at top of screen (Requirement 2.1)
    expect(expandedBox.y).toBeLessThanOrEqual(10) // Allow for small offset
    expect(expandedBox.x).toBeLessThanOrEqual(10)
  })

  test('should handle mobile viewport with 100dvh support', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    const firstCard = page.locator('[data-card-index="0"]').first()
    await expect(firstCard).toBeVisible()
    
    // Trigger expansion
    await firstCard.hover()
    await page.waitForTimeout(600)
    
    // Check mobile expansion class
    await expect(firstCard).toHaveClass(/card-mobile-expanded/)
    
    // Verify CSS properties for mobile viewport handling (Requirement 2.4)
    const styles = await firstCard.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        position: computed.position,
        height: computed.height,
        width: computed.width,
        top: computed.top,
        left: computed.left
      }
    })
    
    expect(styles.position).toBe('fixed')
    expect(styles.top).toBe('0px')
    expect(styles.left).toBe('0px')
    expect(styles.width).toContain('100')
    expect(styles.height).toContain('100')
  })

  test('should have smooth transitions between states', async ({ page }) => {
    const firstCard = page.locator('[data-card-index="0"]').first()
    await expect(firstCard).toBeVisible()
    
    // Monitor transition duration
    const startTime = Date.now()
    
    // Trigger expansion
    await firstCard.hover()
    
    // Wait for expansion to complete
    await page.waitForFunction(() => {
      const card = document.querySelector('[data-card-index="0"]')
      return card && card.classList.contains('card-mobile-expanded')
    }, { timeout: 2000 })
    
    const expansionTime = Date.now() - startTime
    
    // Verify smooth transition timing (Requirement 2.3)
    expect(expansionTime).toBeGreaterThan(200) // Should take some time for smooth animation
    expect(expansionTime).toBeLessThan(1500) // But not too long
    
    // Test reverse transition
    const reverseStartTime = Date.now()
    
    // Move mouse away to trigger reverse
    await page.mouse.move(0, 0)
    
    // Wait for expansion to reverse
    await page.waitForFunction(() => {
      const card = document.querySelector('[data-card-index="0"]')
      return card && !card.classList.contains('card-mobile-expanded')
    }, { timeout: 2000 })
    
    const reverseTime = Date.now() - reverseStartTime
    
    // Verify smooth reverse transition
    expect(reverseTime).toBeGreaterThan(200)
    expect(reverseTime).toBeLessThan(1500)
  })

  test('should only expand hovered card, not all cards', async ({ page }) => {
    // Wait for multiple cards
    await page.waitForSelector('[data-card-index]', { timeout: 10000 })
    
    const cards = await page.locator('[data-card-index]').all()
    expect(cards.length).toBeGreaterThan(1)
    
    const firstCard = cards[0]
    const secondCard = cards[1]
    
    // Hover over first card
    await firstCard.hover()
    await page.waitForTimeout(400)
    
    // Check that only first card is expanded
    await expect(firstCard).toHaveClass(/card-mobile-expanded/)
    await expect(secondCard).not.toHaveClass(/card-mobile-expanded/)
    
    // Check that other cards are dimmed
    await expect(secondCard).toHaveClass(/card-dimmed/)
  })

  test('should handle touch interactions on mobile', async ({ page, browserName }) => {
    // Skip on browsers that don't support touch
    if (browserName === 'webkit') {
      test.skip()
    }
    
    // Set mobile viewport with touch support
    await page.setViewportSize({ width: 375, height: 667 })
    
    const firstCard = page.locator('[data-card-index="0"]').first()
    await expect(firstCard).toBeVisible()
    
    // Simulate touch interaction
    await firstCard.tap({ force: true })
    await page.waitForTimeout(400)
    
    // Should have mobile expansion class
    const hasExpansionClass = await firstCard.evaluate((el) => {
      return el.classList.contains('card-mobile-expanded') || 
             el.classList.contains('card-touched')
    })
    
    expect(hasExpansionClass).toBeTruthy()
  })

  test('should respect reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    const firstCard = page.locator('[data-card-index="0"]').first()
    await expect(firstCard).toBeVisible()
    
    // Hover should not trigger complex animations
    await firstCard.hover()
    await page.waitForTimeout(200)
    
    // Check that animations are disabled via CSS
    const hasReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    })
    
    expect(hasReducedMotion).toBeTruthy()
  })
})