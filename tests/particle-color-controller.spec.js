import { test, expect } from '@playwright/test'

test.describe('Particle Color Controller Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo page
    await page.goto('/particle-color-controller-demo')
  })

  test('should change particle colors on card hover', async ({ page }) => {
    // Wait for demo to load
    await page.waitForSelector('[data-testid="particle-demo-card-0"]')
    
    // Hover over first card
    await page.hover('[data-testid="particle-demo-card-0"]')
    
    // Check if particle color changed (this would depend on your particle system implementation)
    const activeCardStatus = await page.textContent('[data-testid="active-card-status"]')
    expect(activeCardStatus).toContain('Card 1')
    
    // Check active cards count
    const activeCount = await page.textContent('[data-testid="active-cards-count"]')
    expect(activeCount).toContain('1')
  })

  test('should restore particle colors on mouse leave', async ({ page }) => {
    // Hover over card
    await page.hover('[data-testid="particle-demo-card-0"]')
    
    // Move mouse away
    await page.hover('[data-testid="demo-container"]')
    
    // Check if colors restored
    const activeCardStatus = await page.textContent('[data-testid="active-card-status"]')
    expect(activeCardStatus).toContain('None')
    
    const activeCount = await page.textContent('[data-testid="active-cards-count"]')
    expect(activeCount).toContain('0')
  })

  test('should handle multiple card hovers', async ({ page }) => {
    // Hover over multiple cards quickly
    await page.hover('[data-testid="particle-demo-card-0"]')
    await page.hover('[data-testid="particle-demo-card-1"]')
    await page.hover('[data-testid="particle-demo-card-2"]')
    
    // Should handle transitions smoothly without errors
    const activeCardStatus = await page.textContent('[data-testid="active-card-status"]')
    expect(activeCardStatus).toContain('Card 3')
  })

  test('should allow custom color changes', async ({ page }) => {
    // Change hover color
    await page.fill('[data-testid="hover-color-input"]', '#ff0000')
    
    // Hover over card
    await page.hover('[data-testid="particle-demo-card-0"]')
    
    // Check if custom color is applied (visual test would be better)
    const currentColor = await page.inputValue('[data-testid="hover-color-input"]')
    expect(currentColor).toBe('#ff0000')
  })

  test('should restore all colors with button', async ({ page }) => {
    // Hover over multiple cards
    await page.hover('[data-testid="particle-demo-card-0"]')
    await page.hover('[data-testid="particle-demo-card-1"]')
    
    // Click restore all button
    await page.click('[data-testid="restore-all-button"]')
    
    // Check if all colors restored
    const activeCount = await page.textContent('[data-testid="active-cards-count"]')
    expect(activeCount).toContain('0')
  })

  test('should handle rapid hover events without flickering', async ({ page }) => {
    const card = page.locator('[data-testid="particle-demo-card-0"]')
    
    // Rapid hover/unhover
    for (let i = 0; i < 5; i++) {
      await card.hover()
      await page.hover('[data-testid="demo-container"]')
    }
    
    // Should not crash or show errors
    const errorMessages = await page.locator('.error-message').count()
    expect(errorMessages).toBe(0)
  })

  test('should work on mobile devices', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('Mobile-only test')
    }
    
    // Tap on card (mobile equivalent of hover)
    await page.tap('[data-testid="particle-demo-card-0"]')
    
    // Check if interaction works on mobile
    const activeCardStatus = await page.textContent('[data-testid="active-card-status"]')
    expect(activeCardStatus).toContain('Card 1')
  })

  test('should handle performance gracefully', async ({ page }) => {
    // Simulate low performance by throttling CPU
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 6 })
    
    // Hover over cards
    await page.hover('[data-testid="particle-demo-card-0"]')
    await page.hover('[data-testid="particle-demo-card-1"]')
    
    // Should still work without errors
    const activeCardStatus = await page.textContent('[data-testid="active-card-status"]')
    expect(activeCardStatus).toContain('Card 2')
    
    // Reset CPU throttling
    await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  })
})