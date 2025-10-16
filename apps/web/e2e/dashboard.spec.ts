import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('displays main dashboard elements', async ({ page }) => {
    // Header
    await expect(page.locator('text=Dashboard')).toBeVisible()
    
    // Stats cards
    await expect(page.locator('text=Total Value')).toBeVisible()
    await expect(page.locator('text=Total P&L')).toBeVisible()
    await expect(page.locator('text=ROI')).toBeVisible()
    
    // PnL Chart
    await expect(page.locator('text=Portfolio Performance')).toBeVisible()
  })

  test('skeleton loaders appear during loading', async ({ page }) => {
    // Reload page to see skeletons
    await page.reload()
    
    // Should show skeleton loaders briefly
    await expect(page.locator('[class*="animate-pulse"]')).toBeVisible({ timeout: 1000 })
  })

  test('navigation works correctly', async ({ page }) => {
    // Click Portfolios link
    await page.click('text=Portfolios')
    await expect(page).toHaveURL(/.*portfolios/)
    
    // Click Transactions link
    await page.click('text=Transactions')
    await expect(page).toHaveURL(/.*transactions/)
    
    // Click Analytics link
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*analytics/)
    
    // Click Dashboard link
    await page.click('text=Dashboard')
    await expect(page).toHaveURL(/.*dashboard$/)
  })

  test('FAB is visible and clickable', async ({ page }) => {
    // Floating Action Button should be visible
    const fab = page.locator('[aria-label="Quick Add Transaction (Shift+A)"]')
    await expect(fab).toBeVisible()
    
    // Click FAB
    await fab.click()
    
    // Quick add dialog should open
    await expect(page.locator('text=Quick Add Transaction')).toBeVisible()
  })

  test('PnL chart timeframe buttons work', async ({ page }) => {
    // Click 1W
    await page.click('button:has-text("1W")')
    await page.waitForTimeout(500)
    
    // Click 1M
    await page.click('button:has-text("1M")')
    await page.waitForTimeout(500)
    
    // Chart should still be visible
    await expect(page.locator('svg')).toBeVisible()
  })

  test('portfolio cards display correctly', async ({ page }) => {
    // Should show portfolio cards
    const portfolioCards = page.locator('[data-testid="portfolio-card"]')
    await expect(portfolioCards.first()).toBeVisible()
    
    // Each card should show value
    await expect(portfolioCards.first().locator('text=/\\$[0-9,]+/')).toBeVisible()
  })

  test('top performers section displays', async ({ page }) => {
    await expect(page.locator('text=Top Performers')).toBeVisible()
  })

  test('responsive design - mobile view', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Dashboard should still be visible
    await expect(page.locator('text=Dashboard')).toBeVisible()
    
    // FAB should be visible on mobile
    await expect(page.locator('[aria-label="Quick Add Transaction (Shift+A)"]')).toBeVisible()
  })

  test('stats show loading state', async ({ page }) => {
    // Reload to see loading
    await page.reload()
    
    // Should show skeleton stats
    await expect(page.locator('[class*="skeleton"]').or(page.locator('[class*="animate-pulse"]'))).toBeVisible({ timeout: 1000 })
  })
})
