/**
 * Playwright Tests for MenuPage Mobile Modal Integration
 * 
 * Tests the integration of mobile-optimized modal animations
 * with the existing MenuPage component.
 * 
 * Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3
 */

import { test, expect } from '@playwright/test'

test.describe('MenuPage Mobile Modal Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the menu page
    await page.goto('/menu')
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="menu-container"]', { timeout: 10000 })
  })

  test.describe('Mobile Device Modal Animations', () => {
    test('should use mobile-optimized animations on mobile devices', async ({ page }) => {
      // Emulate mobile device
      await page.setViewportSize({ width: 375, height: 667 })
      await page.emulate({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      })
      
      await page.reload()
      await page.waitForSelector('[data-testid="menu-container"]')
      
      // Measure modal opening time on mobile
      const startTime = Date.now()
      
      // Click on About card (first card)
      const aboutCard = page.locator('[data-testid="menu-card"]').first()
      await aboutCard.tap()
      
      // Wait for modal to open
      await page.waitForSelector('.is-open', { timeout: 3000 })
      
      const endTime = Date.now()
      const animationDuration = endTime - startTime
      
      // Mobile animations should be faster
      expect(animationDuration).toBeLessThan(600) // Mobile should be < 600ms
      
      // Verify modal is fully open
      const modalElement = page.locator('.is-open')
      await expect(modalElement).toBeVisible()
    })

    test('should use desktop animations on desktop devices', async ({ page }) => {
      // Use desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      // Measure modal opening time on desktop
      const startTime = Date.now()
      
      // Click on About card
      const aboutCard = page.locator('[data-testid="menu-card"]').first()
      await aboutCard.click()
      
      // Wait for modal to open
      await page.waitForSelector('.is-open', { timeout: 4000 })
      
      const endTime = Date.now()
      const animationDuration = endTime - startTime
      
      // Desktop animations can be longer
      expect(animationDuration).toBeLessThan(800) // Desktop should be < 800ms
      
      // Verify modal is fully open
      const modalElement = page.locator('.is-open')
      await expect(modalElement).toBeVisible()
    })
  })

  test.describe('Staggered Content Animations', () => {
    test('should animate About modal content with stagger on mobile', async ({ page }) => {
      // Emulate mobile device
      await page.setViewportSize({ width: 375, height: 667 })
      await page.emulate({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      })
      
      await page.reload()
      await page.waitForSelector('[data-testid="menu-container"]')
      
      // Open About modal
      const aboutCard = page.locator('[data-testid="menu-card"]').first()
      await aboutCard.tap()
      
      await page.waitForSelector('.is-open')
      
      // Wait for stagger animations to complete
      await page.waitForTimeout(1000)
      
      // Check if About modal content is visible
      const aboutTitle = page.locator('.about-title, h2')
      const aboutText = page.locator('.about-text, p')
      const aboutPhoto = page.locator('.about-photo, img')
      
      await expect(aboutTitle.first()).toBeVisible()
      await expect(aboutText.first()).toBeVisible()
      
      // Photo should be visible if present
      const photoCount = await aboutPhoto.count()
      if (photoCount > 0) {
        await expect(aboutPhoto.first()).toBeVisible()
      }
    })

    test('should animate Projects modal content with stagger', async ({ page }) => {
      // Open Projects modal (second card)
      const projectsCard = page.locator('[data-testid="menu-card"]').nth(1)
      await projectsCard.click()
      
      await page.waitForSelector('.is-open')
      
      // Wait for stagger animations
      await page.waitForTimeout(1200)
      
      // Check if Projects modal content is visible
      const projectsTitle = page.locator('.projects-title, h2')
      const projectCards = page.locator('.project-card')
      
      await expect(projectsTitle.first()).toBeVisible()
      
      // Check if project cards are visible
      const cardCount = await projectCards.count()
      if (cardCount > 0) {
        // At least first few project cards should be visible
        for (let i = 0; i < Math.min(3, cardCount); i++) {
          await expect(projectCards.nth(i)).toBeVisible()
        }
      }
    })

    test('should animate Services modal content with pricing cards', async ({ page }) => {
      // Open Services modal (assuming it's the third card)
      const servicesCard = page.locator('[data-testid="menu-card"]').nth(2)
      await servicesCard.click()
      
      await page.waitForSelector('.is-open')
      
      // Wait for stagger animations
      await page.waitForTimeout(1200)
      
      // Check if Services modal content is visible
      const servicesTitle = page.locator('.services-title, .pricing-header h2, h2')
      const pricingCards = page.locator('.pricing-card')
      
      await expect(servicesTitle.first()).toBeVisible()
      
      // Check if pricing cards are visible
      const cardCount = await pricingCards.count()
      if (cardCount > 0) {
        // Pricing cards should be visible with stagger animation
        for (let i = 0; i < Math.min(3, cardCount); i++) {
          await expect(pricingCards.nth(i)).toBeVisible()
        }
      }
    })
  })

  test.describe('Performance Optimization', () => {
    test('should adapt animation quality on low performance devices', async ({ page }) => {
      // Simulate low performance device
      const client = await page.context().newCDPSession(page)
      await client.send('Emulation.setCPUThrottlingRate', { rate: 6 })
      
      // Emulate low-end mobile device
      await page.setViewportSize({ width: 320, height: 568 })
      await page.emulate({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15',
        viewport: { width: 320, height: 568 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true
      })
      
      await page.reload()
      await page.waitForSelector('[data-testid="menu-container"]')
      
      // Open modal on low performance device
      const aboutCard = page.locator('[data-testid="menu-card"]').first()
      await aboutCard.tap()
      
      await page.waitForSelector('.is-open', { timeout: 5000 })
      
      // Animation should still work but be simplified
      const modalElement = page.locator('.is-open')
      await expect(modalElement).toBeVisible()
      
      // Restore normal CPU
      await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    })

    test('should handle reduced motion preferences', async ({ page }) => {
      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' })
      
      await page.reload()
      await page.waitForSelector('[data-testid="menu-container"]')
      
      // Open modal with reduced motion
      const startTime = Date.now()
      
      const aboutCard = page.locator('[data-testid="menu-card"]').first()
      await aboutCard.click()
      
      await page.waitForSelector('.is-open')
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should be very fast with reduced motion
      expect(duration).toBeLessThan(200)
      
      // Modal should still be functional
      const modalElement = page.locator('.is-open')
      await expect(modalElement).toBeVisible()
    })
  })

  test.describe('Modal Closing Animations', () => {
    test('should close modal with mobile-optimized animation', async ({ page }) => {
      // Emulate mobile device
      await page.setViewportSize({ width: 375, height: 667 })
      await page.emulate({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      })
      
      await page.reload()
      await page.waitForSelector('[data-testid="menu-container"]')
      
      // Open modal first
      const aboutCard = page.locator('[data-testid="menu-card"]').first()
      await aboutCard.tap()
      await page.waitForSelector('.is-open')
      
      // Measure closing time
      const startTime = Date.now()
      
      // Close modal
      const closeButton = page.locator('.close-btn, [data-testid="close-button"]')
      await closeButton.tap()
      
      // Wait for modal to close
      await page.waitForSelector('.is-open', { state: 'detached', timeout: 3000 })
      
      const endTime = Date.now()
      const closeDuration = endTime - startTime
      
      // Mobile closing should be fast
      expect(closeDuration).toBeLessThan(400)
      
      // Verify modal is closed
      const openModals = page.locator('.is-open')
      await expect(openModals).toHaveCount(0)
    })

    test('should restore other cards after modal closes', async ({ page }) => {
      // Open modal
      const aboutCard = page.locator('[data-testid="menu-card"]').first()
      await aboutCard.click()
      await page.waitForSelector('.is-open')
      
      // Close modal
      const closeButton = page.locator('.close-btn, [data-testid="close-button"]')
      await closeButton.click()
      await page.waitForSelector('.is-open', { state: 'detached' })
      
      // Wait for cards to be restored
      await page.waitForTimeout(500)
      
      // All cards should be visible and interactive again
      const menuCards = page.locator('[data-testid="menu-card"]')
      const cardCount = await menuCards.count()
      
      for (let i = 0; i < cardCount; i++) {
        await expect(menuCards.nth(i)).toBeVisible()
        
        // Cards should be interactive (not disabled)
        const isEnabled = await menuCards.nth(i).isEnabled()
        expect(isEnabled).toBe(true)
      }
    })
  })

  test.describe('Background and Dither Effects', () => {
    test('should animate global dither background on modal open', async ({ page }) => {
      // Open modal
      const aboutCard = page.locator('[data-testid="menu-card"]').first()
      await aboutCard.click()
      
      await page.waitForSelector('.is-open')
      
      // Check if global dither is visible
      const globalDither = page.locator('.global-dither, [data-testid="global-dither"]')
      
      // Dither should be visible when modal is open
      if (await globalDither.count() > 0) {
        await expect(globalDither.first()).toBeVisible()
      }
    })

    test('should animate dither background out on modal close', async ({ page }) => {
      // Open modal first
      const aboutCard = page.locator('[data-testid="menu-card"]').first()
      await aboutCard.click()
      await page.waitForSelector('.is-open')
      
      // Close modal
      const closeButton = page.locator('.close-btn, [data-testid="close-button"]')
      await closeButton.click()
      
      // Wait for modal to close
      await page.waitForSelector('.is-open', { state: 'detached' })
      
      // Wait for dither animation to complete
      await page.waitForTimeout(500)
      
      // Dither should be hidden
      const globalDither = page.locator('.global-dither, [data-testid="global-dither"]')
      
      if (await globalDither.count() > 0) {
        const isVisible = await globalDither.first().isVisible()
        expect(isVisible).toBe(false)
      }
    })
  })

  test.describe('Error Handling and Fallbacks', () => {
    test('should handle missing modal content gracefully', async ({ page }) => {
      // Inject script to remove modal content
      await page.evaluate(() => {
        // Remove some modal content to test error handling
        const modalContent = document.querySelector('.about-modal-content, .modal-content')
        if (modalContent) {
          modalContent.innerHTML = ''
        }
      })
      
      // Open modal - should not throw errors
      const aboutCard = page.locator('[data-testid="menu-card"]').first()
      await aboutCard.click()
      
      await page.waitForSelector('.is-open')
      
      // Modal should still open even with missing content
      const modalElement = page.locator('.is-open')
      await expect(modalElement).toBeVisible()
    })

    test('should fallback to basic animation on animation errors', async ({ page }) => {
      // Inject script to cause animation errors
      await page.evaluate(() => {
        // Override GSAP to cause errors
        if (window.gsap) {
          const originalTo = window.gsap.to
          window.gsap.to = function(...args) {
            // Randomly fail some animations to test fallback
            if (Math.random() < 0.3) {
              throw new Error('Simulated animation error')
            }
            return originalTo.apply(this, args)
          }
        }
      })
      
      // Open modal - should use fallback animation
      const aboutCard = page.locator('[data-testid="menu-card"]').first()
      await aboutCard.click()
      
      await page.waitForSelector('.is-open', { timeout: 5000 })
      
      // Modal should still open with fallback
      const modalElement = page.locator('.is-open')
      await expect(modalElement).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should maintain focus management during mobile animations', async ({ page }) => {
      // Emulate mobile device
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Open modal
      const aboutCard = page.locator('[data-testid="menu-card"]').first()
      await aboutCard.tap()
      
      await page.waitForSelector('.is-open')
      
      // Focus should be managed properly
      const closeButton = page.locator('.close-btn, [data-testid="close-button"]')
      if (await closeButton.count() > 0) {
        await expect(closeButton.first()).toBeFocused()
      }
    })

    test('should support keyboard navigation with mobile optimizations', async ({ page }) => {
      // Navigate with keyboard
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab') // Focus on first card
      
      // Open modal with Enter
      await page.keyboard.press('Enter')
      await page.waitForSelector('.is-open')
      
      // Close with Escape
      await page.keyboard.press('Escape')
      await page.waitForSelector('.is-open', { state: 'detached' })
      
      // Should work smoothly even with mobile optimizations
      const openModals = page.locator('.is-open')
      await expect(openModals).toHaveCount(0)
    })
  })
})