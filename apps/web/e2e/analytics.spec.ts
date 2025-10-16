import { test, expect } from '@playwright/test'

test.describe('Portfolio Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await page.waitForLoadState('networkidle')
  })

  test('displays key metrics', async ({ page }) => {
    // Check for metric cards
    await expect(page.locator('text=Total Value')).toBeVisible()
    await expect(page.locator('text=Total ROI')).toBeVisible()
    await expect(page.locator('text=Win Rate')).toBeVisible()
    await expect(page.locator('text=Avg Holding')).toBeVisible()
  })

  test('displays asset allocation chart', async ({ page }) => {
    // Check for pie chart
    await expect(page.locator('text=Asset Allocation')).toBeVisible()
    
    // Chart should be visible
    await expect(page.locator('[data-testid="pie-chart"]').or(page.locator('svg'))).toBeVisible()
  })

  test('displays performance chart', async ({ page }) => {
    await expect(page.locator('text=Performance Over Time')).toBeVisible()
    
    // Should have timeframe buttons
    await expect(page.locator('text=1W')).toBeVisible()
    await expect(page.locator('text=1M')).toBeVisible()
    await expect(page.locator('text=1Y')).toBeVisible()
  })

  test('displays best and worst performers', async ({ page }) => {
    await expect(page.locator('text=Best Performer')).toBeVisible()
    await expect(page.locator('text=Worst Performer')).toBeVisible()
  })

  test('displays risk analysis', async ({ page }) => {
    await expect(page.locator('text=Risk & Diversification Analysis')).toBeVisible()
    await expect(page.locator('text=Diversification')).toBeVisible()
    await expect(page.locator('text=Risk Level')).toBeVisible()
  })

  test('change performance timeframe', async ({ page }) => {
    // Click 1W button
    await page.click('text=1W')
    
    // Chart should update (wait for animation)
    await page.waitForTimeout(500)
    
    // Click 1Y button
    await page.click('text=1Y')
    await page.waitForTimeout(500)
    
    // Should still show chart
    await expect(page.locator('svg')).toBeVisible()
  })

  test('metrics show correct format', async ({ page }) => {
    // Total Value should show currency
    const totalValue = page.locator('text=Total Value').locator('..')
    await expect(totalValue.locator('text=/\\$[0-9,]+/')).toBeVisible()
    
    // ROI should show percentage
    const roi = page.locator('text=Total ROI').locator('..')
    await expect(roi.locator('text=/%/')).toBeVisible()
  })

  test('risk score displays correctly', async ({ page }) => {
    // Risk score should be between 1-10
    const riskScore = page.locator('text=Risk Level').locator('..')
    await expect(riskScore.locator('text=/[0-9]\\.[0-9]\\/10/')).toBeVisible()
  })

  test('diversification score displays correctly', async ({ page }) => {
    const diversificationScore = page.locator('text=Diversification').locator('..')
    await expect(diversificationScore.locator('text=/[0-9]\\/10/')).toBeVisible()
  })
})
