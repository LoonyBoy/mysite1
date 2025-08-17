import { test, expect } from '@playwright/test'

test.describe('Device Detection System', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to a page that uses device detection
        await page.goto('/')
    })

    test('should detect device capabilities on desktop', async ({ page }) => {
        // Set desktop viewport first
        await page.setViewportSize({ width: 1920, height: 1080 })

        // Test desktop device detection
        const deviceInfo = await page.evaluate(() => {
            // Import and test device detection
            return new Promise((resolve) => {
                import('/src/utils/deviceDetection.js').then(({ default: deviceDetection }) => {
                    // Clear cache to ensure fresh detection
                    deviceDetection.cache.clear()
                    const capabilities = deviceDetection.detectCapabilities()
                    resolve({
                        deviceType: capabilities.deviceType,
                        isPrimaryTouch: capabilities.isPrimaryTouch,
                        isPrimaryMouse: capabilities.isPrimaryMouse,
                        hasTouch: capabilities.hasTouch,
                        hasMouse: capabilities.hasMouse,
                        screenWidth: capabilities.screenSize.width,
                        screenHeight: capabilities.screenSize.height
                    })
                })
            })
        })

        // Desktop should be detected correctly
        expect(deviceInfo.deviceType).toBe('desktop')
        expect(deviceInfo.screenWidth).toBeGreaterThan(1000)
    })

    test('should detect mobile device on mobile viewport', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 })

        const deviceInfo = await page.evaluate(() => {
            return new Promise((resolve) => {
                import('/src/utils/deviceDetection.js').then(({ default: deviceDetection }) => {
                    // Clear cache to re-detect with new viewport
                    deviceDetection.cache.clear()
                    const capabilities = deviceDetection.detectCapabilities()
                    resolve({
                        deviceType: capabilities.deviceType,
                        isPrimaryTouch: capabilities.isPrimaryTouch,
                        isPrimaryMouse: capabilities.isPrimaryMouse,
                        screenWidth: capabilities.screenSize.width,
                        screenHeight: capabilities.screenSize.height,
                        orientation: capabilities.orientation
                    })
                })
            })
        })

        // Mobile viewport should be detected as mobile
        expect(deviceInfo.deviceType).toBe('mobile')
        expect(deviceInfo.screenWidth).toBeLessThan(500)
        expect(deviceInfo.orientation).toBe('portrait')
    })

    test('should detect tablet device on tablet viewport', async ({ page }) => {
        // Set tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 })

        const deviceInfo = await page.evaluate(() => {
            return new Promise((resolve) => {
                import('/src/utils/deviceDetection.js').then(({ default: deviceDetection }) => {
                    // Clear cache to re-detect with new viewport
                    deviceDetection.cache.clear()
                    const capabilities = deviceDetection.detectCapabilities()
                    resolve({
                        deviceType: capabilities.deviceType,
                        screenWidth: capabilities.screenSize.width,
                        screenHeight: capabilities.screenSize.height,
                        orientation: capabilities.orientation
                    })
                })
            })
        })

        // Tablet viewport should be detected as tablet
        expect(deviceInfo.deviceType).toBe('tablet')
        expect(deviceInfo.screenWidth).toBe(768)
        expect(deviceInfo.screenHeight).toBe(1024)
        expect(deviceInfo.orientation).toBe('portrait')
    })

    test('should detect orientation correctly', async ({ page }) => {
        // Set landscape viewport
        await page.setViewportSize({ width: 1024, height: 768 })

        const deviceInfo = await page.evaluate(() => {
            return new Promise((resolve) => {
                import('/src/utils/deviceDetection.js').then(({ default: deviceDetection }) => {
                    // Clear cache to re-detect with new viewport
                    deviceDetection.cache.clear()
                    const capabilities = deviceDetection.detectCapabilities()
                    resolve({
                        orientation: capabilities.orientation,
                        screenWidth: capabilities.screenSize.width,
                        screenHeight: capabilities.screenSize.height,
                        innerWidth: window.innerWidth,
                        innerHeight: window.innerHeight
                    })
                })
            })
        })

        // Check that viewport dimensions are correct
        expect(deviceInfo.innerWidth).toBe(1024)
        expect(deviceInfo.innerHeight).toBe(768)
        expect(deviceInfo.screenWidth).toBe(1024)
        expect(deviceInfo.screenHeight).toBe(768)

        // Check that width is greater than height (landscape)
        expect(deviceInfo.screenWidth).toBeGreaterThan(deviceInfo.screenHeight)

        // The orientation should be landscape when width > height
        expect(deviceInfo.orientation).toBe('landscape')
    })

    test('should handle touch simulation', async ({ page }) => {
        // Test touch event simulation
        await page.evaluate(() => {
            // Add touch event simulation
            if (!('ontouchstart' in window)) {
                window.ontouchstart = null
            }
        })

        const touchSupport = await page.evaluate(() => {
            return new Promise((resolve) => {
                import('/src/utils/deviceDetection.js').then(({ default: deviceDetection }) => {
                    deviceDetection.cache.clear()
                    const capabilities = deviceDetection.detectCapabilities()
                    resolve({
                        hasTouch: capabilities.hasTouch,
                        supportsPointerEvents: capabilities.supportsPointerEvents
                    })
                })
            })
        })

        expect(touchSupport.hasTouch).toBe(true)
    })

    test('should detect performance capabilities', async ({ page }) => {
        const performanceInfo = await page.evaluate(() => {
            return new Promise((resolve) => {
                import('/src/utils/deviceDetection.js').then(({ default: deviceDetection }) => {
                    const capabilities = deviceDetection.getCapabilities()
                    const performanceLevel = deviceDetection.getPerformanceLevel()
                    resolve({
                        performanceLevel,
                        deviceMemory: capabilities.deviceMemory,
                        hardwareConcurrency: capabilities.hardwareConcurrency,
                        deviceType: capabilities.deviceType
                    })
                })
            })
        })

        expect(performanceInfo.performanceLevel).toMatch(/^(low|medium|high)$/)
        expect(performanceInfo.hardwareConcurrency).toBeGreaterThan(0)
    })

    test('should handle capability listeners', async ({ page }) => {
        const listenerTest = await page.evaluate(() => {
            return new Promise((resolve) => {
                import('/src/utils/deviceDetection.js').then(({ default: deviceDetection }) => {
                    let listenerCalled = false

                    const testListener = (capabilities) => {
                        listenerCalled = true
                    }

                    // Add listener
                    deviceDetection.addCapabilityListener(testListener)

                    // Trigger capability change
                    deviceDetection.notifyListeners({ test: true })

                    // Remove listener
                    deviceDetection.removeCapabilityListener(testListener)

                    resolve({ listenerCalled })
                })
            })
        })

        expect(listenerTest.listenerCalled).toBe(true)
    })

    test('should handle errors gracefully', async ({ page }) => {
        const errorHandling = await page.evaluate(() => {
            return new Promise((resolve) => {
                import('/src/utils/deviceDetection.js').then(({ DeviceDetection }) => {
                    // Create new instance to test error handling
                    const detector = new DeviceDetection()

                    // Mock console.warn to capture warnings
                    const originalWarn = console.warn
                    const warnings = []
                    console.warn = (...args) => warnings.push(args)

                    // Test error in listener
                    const errorListener = () => {
                        throw new Error('Test error')
                    }

                    detector.addCapabilityListener(errorListener)
                    detector.notifyListeners({ test: true })

                    // Restore console.warn
                    console.warn = originalWarn

                    resolve({
                        warningsCount: warnings.length,
                        hasErrorWarning: warnings.some(w =>
                            w[0] && w[0].includes('Error in capability change listener')
                        )
                    })
                })
            })
        })

        expect(errorHandling.warningsCount).toBeGreaterThan(0)
        expect(errorHandling.hasErrorWarning).toBe(true)
    })
})

// TouchInteractionHandler tests will be added in integration tests
// For now, we focus on device detection which is the core functionality