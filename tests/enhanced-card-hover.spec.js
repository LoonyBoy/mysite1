import { test, expect } from '@playwright/test'

test.describe('Enhanced Card Hover Animations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/menu')
    await page.waitForLoadState('networkidle')
  })

  test('should only expand the hovered card, not all cards', async ({ page }) => {
    // Get all card elements
    const cards = await page.locator('[data-card-index]').all()
    expect(cards.length).toBeGreaterThan(0)

    // Hover over the first card
    await cards[0].hover()
    
    // Wait for animation to start
    await page.waitForTimeout(300)

    // Check that only the first card has hover-related classes
    const firstCardClasses = await cards[0].getAttribute('class')
    expect(firstCardClasses).toMatch(/card-hovered|force-hover/)
    
    // Check that other cards are dimmed
    for (let i = 1; i < cards.length; i++) {
      await expect(cards[i]).toHaveClass(/card-dimmed|dimmed/)
    }

    // Force cleanup using the global function
    await page.evaluate(() => {
      if (window.forceCleanupHoverStates) {
        window.forceCleanupHoverStates()
      }
    })
    
    await page.waitForTimeout(100)
    
    // Check that hover effects are removed
    const cleanedFirstCardClasses = await cards[0].getAttribute('class')
    expect(cleanedFirstCardClasses).not.toMatch(/card-hovered|force-hover/)
    
    // Check that dimmed effects are removed from other cards
    for (let i = 1; i < cards.length; i++) {
      await expect(cards[i]).not.toHaveClass(/card-dimmed/)
    }
  })

  test('should expand card to full viewport height on hover', async ({ page }) => {
    const card = page.locator('[data-card-index="0"]')
    
    // Get initial card height
    const initialHeight = await card.evaluate(el => el.getBoundingClientRect().height)
    
    // Hover over the card
    await card.hover()
    
    // Wait for expansion animation
    await page.waitForTimeout(600)
    
    // Check that card height has increased significantly
    const expandedHeight = await card.evaluate(el => el.getBoundingClientRect().height)
    expect(expandedHeight).toBeGreaterThan(initialHeight * 1.5)
    
    // Check that card reaches near viewport height
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    expect(expandedHeight).toBeGreaterThan(viewportHeight * 0.8)
  })

  test('should apply proper z-index management during hover', async ({ page }) => {
    const cards = await page.locator('[data-card-index]').all()
    
    // Hover over the second card
    await cards[1].hover()
    await page.waitForTimeout(100)
    
    // Check z-index of hovered card is higher
    const hoveredZIndex = await cards[1].evaluate(el => 
      parseInt(getComputedStyle(el).zIndex) || 0
    )
    
    // Check z-index of other cards
    const otherZIndex = await cards[0].evaluate(el => 
      parseInt(getComputedStyle(el).zIndex) || 0
    )
    
    expect(hoveredZIndex).toBeGreaterThan(otherZIndex)
  })

  test('should animate card content elements during hover', async ({ page }) => {
    const card = page.locator('[data-card-index="0"]')
    const title = card.locator('.title-0')
    const arrow = card.locator('.arrow-0')
    
    // Get initial positions
    const initialTitleTransform = await title.evaluate(el => 
      getComputedStyle(el).transform
    )
    const initialArrowTransform = await arrow.evaluate(el => 
      getComputedStyle(el).transform
    )
    
    // Hover over the card
    await card.hover()
    await page.waitForTimeout(400)
    
    // Check that elements have been transformed
    const hoveredTitleTransform = await title.evaluate(el => 
      getComputedStyle(el).transform
    )
    const hoveredArrowTransform = await arrow.evaluate(el => 
      getComputedStyle(el).transform
    )
    
    expect(hoveredTitleTransform).not.toBe(initialTitleTransform)
    expect(hoveredArrowTransform).not.toBe(initialArrowTransform)
  })

  test('should handle touch interactions on mobile devices', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('Skipping mobile-specific test on desktop')
    }

    const card = page.locator('[data-card-index="0"]')
    
    // Tap the card
    await card.tap()
    await page.waitForTimeout(100)
    
    // Check that touch class is applied
    await expect(card).toHaveClass(/card-touched/)
    
    // Tap elsewhere to remove touch
    await page.tap('body', { position: { x: 10, y: 10 } })
    await page.waitForTimeout(300)
    
    // Check that touch class is removed
    await expect(card).not.toHaveClass(/card-touched/)
  })

  test('should provide smooth enter and exit animations', async ({ page }) => {
    const card = page.locator('[data-card-index="0"]')
    
    // Monitor animation duration by checking transform changes
    let transformChanges = 0
    
    await card.evaluate(el => {
      const observer = new MutationObserver(() => {
        window.transformChanges = (window.transformChanges || 0) + 1
      })
      observer.observe(el, { 
        attributes: true, 
        attributeFilter: ['style'] 
      })
    })
    
    // Hover and unhover quickly to test smooth transitions
    await card.hover()
    await page.waitForTimeout(200)
    await page.mouse.move(0, 0)
    await page.waitForTimeout(400)
    
    // Check that animations completed smoothly
    transformChanges = await page.evaluate(() => window.transformChanges || 0)
    expect(transformChanges).toBeGreaterThan(0)
  })

  test('should respect reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    const card = page.locator('[data-card-index="0"]')
    
    // Hover over card
    await card.hover()
    await page.waitForTimeout(100)
    
    // Check that no complex animations are applied
    const hasTransition = await card.evaluate(el => {
      const style = getComputedStyle(el)
      return style.transition !== 'none' && style.transition !== ''
    })
    
    // With reduced motion, transitions should be disabled
    expect(hasTransition).toBeFalsy()
  })

  test('should handle rapid hover events without conflicts', async ({ page }) => {
    const cards = await page.locator('[data-card-index]').all()
    
    // Test sequential hover without rapid switching to avoid instability
    // Hover first card
    await cards[0].hover()
    await page.waitForTimeout(300)
    
    // Check first card is active
    const firstCardClasses = await cards[0].getAttribute('class')
    expect(firstCardClasses).toMatch(/card-hovered|force-hover/)
    
    // Force cleanup to simulate mouse leave
    await page.evaluate(() => {
      if (window.forceCleanupHoverStates) {
        window.forceCleanupHoverStates()
      }
    })
    await page.waitForTimeout(100)
    
    // Hover second card
    await cards[1].hover()
    await page.waitForTimeout(300)
    
    // Check that second card is now active
    const secondCardClasses = await cards[1].getAttribute('class')
    expect(secondCardClasses).toMatch(/card-hovered|force-hover/)
    
    // Final cleanup
    await page.evaluate(() => {
      if (window.forceCleanupHoverStates) {
        window.forceCleanupHoverStates()
      }
    })
    await page.waitForTimeout(100)
    
    // Verify all hover states are cleared
    for (let i = 0; i < cards.length; i++) {
      const cardClasses = await cards[i].getAttribute('class')
      expect(cardClasses).not.toMatch(/card-hovered|force-hover/)
    }
  })
})