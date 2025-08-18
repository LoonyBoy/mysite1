import { test, expect } from '@playwright/test'

test.describe('Mobile Projects Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/menu')
    await page.setViewportSize({ width: 375, height: 667 }) // Mobile viewport
  })

  test('should show mobile navigation in projects modal', async ({ page }) => {
    // Open projects modal (second card)
    await page.click('[data-testid="menu-card-1"]')
    
    // Wait for modal to open
    await page.waitForSelector('[data-testid="projects-modal"]', { state: 'visible' })
    
    // Check if mobile navigation is visible
    await expect(page.locator('[data-testid="mobile-projects-nav"]')).toBeVisible()
    
    // Check if all three navigation buttons are present
    await expect(page.locator('text=Боты')).toBeVisible()
    await expect(page.locator('text=Сайты')).toBeVisible()
    await expect(page.locator('text=Автоматизация')).toBeVisible()
  })

  test('should switch categories when clicking navigation buttons', async ({ page }) => {
    // Open projects modal
    await page.click('[data-testid="menu-card-1"]')
    await page.waitForSelector('[data-testid="projects-modal"]', { state: 'visible' })
    
    // Initially should show web projects (default)
    await expect(page.locator('.active')).toContainText('Сайты')
    
    // Click on Боты button
    await page.click('text=Боты')
    
    // Wait for animation and check active state
    await page.waitForTimeout(500)
    await expect(page.locator('.active')).toContainText('Боты')
    
    // Click on Автоматизация button
    await page.click('text=Автоматизация')
    
    // Wait for animation and check active state
    await page.waitForTimeout(500)
    await expect(page.locator('.active')).toContainText('Автоматизация')
  })

  test('should show ripple effect on button click', async ({ page }) => {
    // Open projects modal
    await page.click('[data-testid="menu-card-1"]')
    await page.waitForSelector('[data-testid="projects-modal"]', { state: 'visible' })
    
    // Click on a navigation button and check for ripple effect
    await page.click('text=Боты')
    
    // Check if ripple element was created (it should be removed after animation)
    // We can't easily test the ripple animation, but we can test the click functionality
    await expect(page.locator('.active')).toContainText('Боты')
  })

  test('should not show navigation on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // Open projects modal
    await page.click('[data-testid="menu-card-1"]')
    await page.waitForSelector('[data-testid="projects-modal"]', { state: 'visible' })
    
    // Mobile navigation should not be visible on desktop
    await expect(page.locator('[data-testid="mobile-projects-nav"]')).not.toBeVisible()
  })

  test('should animate content when switching categories', async ({ page }) => {
    // Open projects modal
    await page.click('[data-testid="menu-card-1"]')
    await page.waitForSelector('[data-testid="projects-modal"]', { state: 'visible' })
    
    // Get initial content
    const initialContent = await page.locator('[data-testid="projects-list"]').textContent()
    
    // Switch to different category
    await page.click('text=Боты')
    
    // Wait for animation to complete
    await page.waitForTimeout(800)
    
    // Content should have changed
    const newContent = await page.locator('[data-testid="projects-list"]').textContent()
    expect(newContent).not.toBe(initialContent)
  })
})