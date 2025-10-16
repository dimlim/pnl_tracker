import { test, expect } from '@playwright/test'

test.describe('Portfolio Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to portfolios page
    await page.goto('/dashboard/portfolios')
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('create, edit, and delete portfolio', async ({ page }) => {
    // Create portfolio
    await page.click('text=New Portfolio')
    await page.fill('[name="name"]', 'Trading Portfolio')
    await page.selectOption('[name="pnlMethod"]', 'lifo')
    await page.click('button[type="submit"]')
    
    // Wait for toast notification
    await expect(page.locator('text=Portfolio created')).toBeVisible({ timeout: 5000 })
    
    // Verify created
    await expect(page.locator('text=Trading Portfolio')).toBeVisible()
    
    // Edit portfolio
    await page.click('[aria-label="Portfolio options"]')
    await page.click('text=Edit')
    await page.fill('[name="name"]', 'Updated Portfolio')
    await page.click('text=Save')
    
    // Wait for update confirmation
    await expect(page.locator('text=Portfolio updated')).toBeVisible({ timeout: 5000 })
    
    // Verify updated
    await expect(page.locator('text=Updated Portfolio')).toBeVisible()
    
    // Delete portfolio
    await page.click('[aria-label="Portfolio options"]')
    await page.click('text=Delete')
    await page.click('text=Confirm') // confirmation dialog
    
    // Wait for delete confirmation
    await expect(page.locator('text=Portfolio deleted')).toBeVisible({ timeout: 5000 })
    
    // Verify deleted
    await expect(page.locator('text=Updated Portfolio')).not.toBeVisible()
  })

  test('create portfolio with different PnL methods', async ({ page }) => {
    const methods = [
      { value: 'fifo', label: 'FIFO Portfolio' },
      { value: 'lifo', label: 'LIFO Portfolio' },
      { value: 'avg', label: 'AVG Portfolio' },
    ]

    for (const method of methods) {
      await page.click('text=New Portfolio')
      await page.fill('[name="name"]', method.label)
      await page.selectOption('[name="pnlMethod"]', method.value)
      await page.click('button[type="submit"]')
      
      // Verify created
      await expect(page.locator(`text=${method.label}`)).toBeVisible()
    }
  })

  test('duplicate portfolio', async ({ page }) => {
    // Assuming at least one portfolio exists
    const firstPortfolio = page.locator('[data-testid="portfolio-card"]').first()
    await firstPortfolio.locator('[aria-label="Portfolio options"]').click()
    await page.click('text=Duplicate')
    
    // Wait for duplicate confirmation
    await expect(page.locator('text=Portfolio duplicated')).toBeVisible({ timeout: 5000 })
    
    // Verify duplicate exists (should have "Copy" in name)
    await expect(page.locator('text=Copy')).toBeVisible()
  })

  test('portfolio validation - empty name', async ({ page }) => {
    await page.click('text=New Portfolio')
    await page.click('button[type="submit"]')
    
    // Should show validation error
    await expect(page.locator('text=Name is required')).toBeVisible()
  })

  test('portfolio stats display correctly', async ({ page }) => {
    // Check if portfolio cards show stats
    const portfolioCard = page.locator('[data-testid="portfolio-card"]').first()
    
    // Should show value
    await expect(portfolioCard.locator('text=/\\$[0-9,]+/')).toBeVisible()
    
    // Should show P&L
    await expect(portfolioCard.locator('text=P&L')).toBeVisible()
  })
})
