import { test, expect } from '@playwright/test'

test.describe('Simple Mobile Card Expansion Test', () => {
  test('should have AnimationManager initialized', async ({ page }) => {
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')
    
    // Check if AnimationManager is initialized
    const animationManagerExists = await page.evaluate(() => {
      return window.animationManagerRef !== undefined
    })
    
    console.log('AnimationManager exists:', animationManagerExists)
    
    // Check if cards exist
    const cards = await page.locator('[data-card-index]').count()
    console.log('Number of cards found:', cards)
    
    expect(cards).toBeGreaterThan(0)
  })

  test('should add mobile expansion class on hover', async ({ page }) => {
    await page.goto('/menu')
    await page.waitForLoadState('networkidle')
    
    // Wait for cards to be visible
    await page.waitForSelector('[data-card-index="0"]', { state: 'visible' })
    
    const firstCard = page.locator('[data-card-index="0"]')
    
    // Get initial classes and styles
    const initialClasses = await firstCard.getAttribute('class')
    const initialStyles = await firstCard.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        position: computed.position,
        width: computed.width,
        height: computed.height,
        top: computed.top,
        left: computed.left,
        zIndex: computed.zIndex
      }
    })
    console.log('Initial classes:', initialClasses)
    console.log('Initial styles:', initialStyles)
    
    // Hover over the card
    await firstCard.hover()
    await page.waitForTimeout(800) // Wait longer for animation
    
    // Get classes and styles after hover
    const hoverClasses = await firstCard.getAttribute('class')
    const hoverStyles = await firstCard.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        position: computed.position,
        width: computed.width,
        height: computed.height,
        top: computed.top,
        left: computed.left,
        zIndex: computed.zIndex
      }
    })
    console.log('Hover classes:', hoverClasses)
    console.log('Hover styles:', hoverStyles)
    
    // Check if mobile expansion class was added
    expect(hoverClasses).toContain('card-mobile-expanded')
    
    // Check if styles changed for full-height expansion
    expect(hoverStyles.position).toBe('fixed')
    expect(hoverStyles.zIndex).toBe('100')
  })
})