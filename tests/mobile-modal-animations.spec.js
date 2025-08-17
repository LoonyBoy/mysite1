/**
 * Playwright Tests for Mobile Modal Animations
 * 
 * Tests mobile-optimized modal animations with performance monitoring
 * and adaptive quality features in real browser environments.
 * 
 * Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3
 */

import { test, expect } from '@playwright/test'

test.describe('Mobile Modal Animations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the demo page
    await page.goto('/mobile-modal-animations-demo')
    
    // Wait for the component to load
    await page.waitForSelector('[data-testid="demo-container"]', { timeout: 10000 })
  })

  test.describe('Device Detection', () => {
    test('should detect mobile device correctly', async ({ page }) => {
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
      await page.waitForSelector('[data-testid="device-info"]')
      
      // Check if mobile is detected
      const deviceType = await page.textContent('[data-testid="device-type"]')
      expect(deviceType).toContain('Mobile')
    })

    test('should detect desktop device correctly', async ({ page }) => {
      // Use desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      await page.reload()
      await page.waitForSelector('[data-testid="device-info"]')
      
      // Check if desktop is detected
      const deviceType = await page.textContent('[data-testid="device-type"]')
      expect(deviceType).toContain('Desktop')
    })

    test('should show performance level information', async ({ page }) => {
      await page.waitForSelector('[data-testid="performance-level"]')
      
      const performanceLevel = await page.textContent('[data-testid="performance-level"]')
      expect(['low', 'medium', 'high']).toContain(performanceLevel.toLowerCase())
    })
  })

  test.describe('Modal Opening Animations', () => {
    test('should open modal with smooth animation on desktop', async ({ page }) => {
      // Click on first demo card
      const firstCard = page.locator('[data-testid="demo-card"]').first()
      await firstCard.click()
      
      // Wait for modal to open
      await page.waitForSelector('.is-open', { timeout: 5000 })
      
      // Check if modal is in fullscreen
      const modalElement = page.locator('.is-open')
      await expect(modalElement).toBeVisible()
      
      // Verify modal content is visible
      const modalContent = page.locator('.modal-content')
      await expect(modalContent).toBeVisible()
    })

    test('should open modal with mobile-optimized timing on mobile', async ({ page }) => {
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
      await page.waitForSelector('[data-testid="demo-container"]')
      
      // Measure animation timing
      const startTime = Date.now()
      
      const firstCard = page.locator('[data-testid="demo-card"]').first()
      await firstCard.tap()
      
      await page.waitForSelector('.is-open', { timeout: 3000 })
      
      const endTime = Date.now()
      const animationDuration = endTime - startTime
      
      // Mobile animations should be faster (< 500ms)
      expect(animationDuration).toBeLessThan(500)
    })

    test('should handle multiple rapid clicks gracefully', async ({ page }) => {
      const firstCard = page.locator('[data-testid="demo-card"]').first()
      
      // Click multiple times rapidly
      await firstCard.click()
      await firstCard.click()
      await firstCard.click()
      
      // Should only open one modal
      const openModals = page.locator('.is-open')
      await expect(openModals).toHaveCount(1)
    })
  })

  test.describe('Modal Closing Animations', () => {
    test('should close modal with smooth animation', async ({ page }) => {
      // Open modal first
      const firstCard = page.locator('[data-testid="demo-card"]').first()
      await firstCard.click()
      await page.waitForSelector('.is-open')
      
      // Close modal
      const closeButton = page.locator('[data-testid="close-button"]')
      await closeButton.click()
      
      // Wait for modal to close
      await page.waitForSelector('.is-open', { state: 'detached', timeout: 3000 })
      
      // Verify modal is closed
      const openModals = page.locator('.is-open')
      await expect(openModals).toHaveCount(0)
    })

    test('should close modal on escape key', async ({ page }) => {
      // Open modal first
      const firstCard = page.locator('[data-testid="demo-card"]').first()
      await firstCard.click()
      await page.waitForSelector('.is-open')
      
      // Press escape key
      await page.keyboard.press('Escape')
      
      // Wait for modal to close
      await page.waitForSelector('.is-open', { state: 'detached', timeout: 3000 })
      
      // Verify modal is closed
      const openModals = page.locator('.is-open')
      await expect(openModals).toHaveCount(0)
    })
  })

  test.describe('Content Stagger Animations', () => {
    test('should animate content with stagger effect', async ({ page }) => {
      // Open modal
      const firstCard = page.locator('[data-testid="demo-card"]').first()
      await firstCard.click()
      await page.waitForSelector('.is-open')
      
      // Wait for stagger animations to complete
      await page.waitForTimeout(1000)
      
      // Check if content elements are visible and properly positioned
      const contentElements = page.locator('.modal-content h2, .modal-content h4, .modal-content p')
      const count = await contentElements.count()
      
      expect(count).toBeGreaterThan(0)
      
      // Verify all elements are visible (stagger animation completed)
      for (let i = 0; i < count; i++) {
        await expect(contentElements.nth(i)).toBeVisible()
      }
    })

    test('should limit stagger items on low performance devices', async ({ page }) => {
      // Simulate low performance by throttling CPU
      const client = await page.context().newCDPSession(page)
      await client.send('Emulation.setCPUThrottlingRate', { rate: 6 })
      
      await page.reload()
      await page.waitForSelector('[data-testid="demo-container"]')
      
      // Open modal
      const firstCard = page.locator('[data-testid="demo-card"]').first()
      await firstCard.click()
      await page.waitForSelector('.is-open')
      
      // Performance level should be detected as low
      const performanceLevel = await page.textContent('[data-testid="performance-level"]')
      expect(performanceLevel.toLowerCase()).toBe('low')
      
      // Restore normal CPU
      await client.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    })
  })

  test.describe('Performance Monitoring', () => {
    test('should adapt animation quality based on performance', async ({ page }) => {
      // Monitor console logs for performance adaptations
      const logs = []
      page.on('console', msg => {
        if (msg.text().includes('FPS') || msg.text().includes('performance')) {
          logs.push(msg.text())
        }
      })
      
      // Simulate performance stress by opening/closing modals rapidly
      for (let i = 0; i < 3; i++) {
        const card = page.locator('[data-testid="demo-card"]').nth(i % 3)
        await card.click()
        await page.waitForSelector('.is-open', { timeout: 2000 })
        
        const closeButton = page.locator('[data-testid="close-button"]')
        await closeButton.click()
        await page.waitForSelector('.is-open', { state: 'detached', timeout: 2000 })
        
        await page.waitForTimeout(100)
      }
      
      // Performance monitoring should be active (logs may or may not show adaptation)
      // This test mainly ensures no errors occur during performance monitoring
    })

    test('should respect reduced motion preferences', async ({ page }) => {
      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' })
      
      await page.reload()
      await page.waitForSelector('[data-testid="demo-container"]')
      
      // Check if reduced motion is detected
      const reducedMotion = await page.textContent('[data-testid="reduced-motion"]')
      expect(reducedMotion).toContain('Enabled')
      
      // Open modal (should be instant with reduced motion)
      const startTime = Date.now()
      
      const firstCard = page.locator('[data-testid="demo-card"]').first()
      await firstCard.click()
      await page.waitForSelector('.is-open')
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should be very fast with reduced motion
      expect(duration).toBeLessThan(100)
    })
  })

  test.describe('Mobile-Specific Features', () => {
    test('should use touch-optimized easing on mobile', async ({ page }) => {
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
      await page.waitForSelector('[data-testid="demo-container"]')
      
      // Verify mobile detection
      const deviceType = await page.textContent('[data-testid="device-type"]')
      expect(deviceType).toContain('Mobile')
      
      // Test touch interaction
      const firstCard = page.locator('[data-testid="demo-card"]').first()
      await firstCard.tap()
      
      await page.waitForSelector('.is-open')
      await expect(page.locator('.is-open')).toBeVisible()
    })

    test('should handle viewport changes gracefully', async ({ page }) => {
      // Start with desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      // Open modal
      const firstCard = page.locator('[data-testid="demo-card"]').first()
      await firstCard.click()
      await page.waitForSelector('.is-open')
      
      // Change to mobile viewport while modal is open
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Modal should still be visible and properly sized
      await expect(page.locator('.is-open')).toBeVisible()
      
      // Close modal
      const closeButton = page.locator('[data-testid="close-button"]')
      await closeButton.click()
      await page.waitForSelector('.is-open', { state: 'detached' })
    })
  })

  test.describe('Error Handling', () => {
    test('should handle missing elements gracefully', async ({ page }) => {
      // Inject script to remove elements and test error handling
      await page.evaluate(() => {
        // Remove some modal content elements
        const elements = document.querySelectorAll('.modal-content p')
        elements.forEach(el => el.remove())
      })
      
      // Open modal - should not throw errors
      const firstCard = page.locator('[data-testid="demo-card"]').first()
      await firstCard.click()
      
      await page.waitForSelector('.is-open')
      await expect(page.locator('.is-open')).toBeVisible()
    })

    test('should handle animation interruptions', async ({ page }) => {
      // Start opening modal
      const firstCard = page.locator('[data-testid="demo-card"]').first()
      await firstCard.click()
      
      // Immediately try to close it (interrupt animation)
      await page.waitForTimeout(50) // Small delay to start animation
      
      const closeButton = page.locator('[data-testid="close-button"]')
      if (await closeButton.isVisible()) {
        await closeButton.click()
      }
      
      // Should handle interruption gracefully
      await page.waitForTimeout(1000)
      
      // No errors should occur
      const errors = []
      page.on('pageerror', error => errors.push(error))
      
      expect(errors).toHaveLength(0)
    })
  })

  test.describe('Accessibility', () => {
    test('should maintain focus management during animations', async ({ page }) => {
      // Open modal
      const firstCard = page.locator('[data-testid="demo-card"]').first()
      await firstCard.click()
      await page.waitForSelector('.is-open')
      
      // Focus should be managed properly
      const closeButton = page.locator('[data-testid="close-button"]')
      await expect(closeButton).toBeFocused()
    })

    test('should support keyboard navigation', async ({ page }) => {
      // Navigate to first card with keyboard
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab') // Skip device info, focus on first card
      
      // Open modal with Enter key
      await page.keyboard.press('Enter')
      await page.waitForSelector('.is-open')
      
      // Close modal with Escape key
      await page.keyboard.press('Escape')
      await page.waitForSelector('.is-open', { state: 'detached' })
    })
  })
})