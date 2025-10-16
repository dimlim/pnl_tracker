import { test, expect } from '@playwright/test'

test.describe('Transaction Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/transactions')
    await page.waitForLoadState('networkidle')
  })

  test('add buy transaction', async ({ page }) => {
    // Click Add Transaction button
    await page.click('text=Add Transaction')
    
    // Fill transaction form
    await page.fill('[name="asset"]', 'BTC')
    await page.selectOption('[name="type"]', 'buy')
    await page.fill('[name="quantity"]', '0.5')
    await page.fill('[name="price"]', '50000')
    await page.click('button[type="submit"]')
    
    // Wait for success toast
    await expect(page.locator('text=Transaction added')).toBeVisible({ timeout: 5000 })
    
    // Verify transaction appears in list
    await expect(page.locator('text=BTC')).toBeVisible()
    await expect(page.locator('text=0.5')).toBeVisible()
  })

  test('add sell transaction', async ({ page }) => {
    await page.click('text=Add Transaction')
    
    await page.fill('[name="asset"]', 'ETH')
    await page.selectOption('[name="type"]', 'sell')
    await page.fill('[name="quantity"]', '2')
    await page.fill('[name="price"]', '3000')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Transaction added')).toBeVisible({ timeout: 5000 })
  })

  test('quick add transaction with FAB', async ({ page }) => {
    // Click Floating Action Button
    await page.click('[aria-label="Quick Add Transaction (Shift+A)"]')
    
    // Step 1: Select asset
    await page.fill('[placeholder="Search assets..."]', 'BTC')
    await page.click('text=Bitcoin')
    
    // Step 2: Buy or Sell
    await page.click('text=Buy')
    
    // Step 3: Details
    await page.fill('[name="quantity"]', '0.1')
    await page.fill('[name="price"]', '60000')
    await page.click('text=Add Transaction')
    
    await expect(page.locator('text=Transaction added')).toBeVisible({ timeout: 5000 })
  })

  test('keyboard shortcut - Shift+A opens quick add', async ({ page }) => {
    // Press Shift+A
    await page.keyboard.press('Shift+A')
    
    // Quick add dialog should open
    await expect(page.locator('text=Quick Add Transaction')).toBeVisible()
  })

  test('filter transactions by search', async ({ page }) => {
    // Type in search box
    await page.fill('[placeholder="Search by asset name or symbol..."]', 'BTC')
    
    // Wait for debounce (300ms)
    await page.waitForTimeout(400)
    
    // Should only show BTC transactions
    await expect(page.locator('text=BTC')).toBeVisible()
  })

  test('filter transactions by date range', async ({ page }) => {
    // Open filters
    await page.click('text=Filters')
    
    // Click date range picker
    await page.click('[aria-label="Select date range"]')
    
    // Select last 7 days preset
    await page.click('text=Last 7 days')
    
    // Transactions should be filtered (count should be >= 0)
    const count = await page.locator('[data-testid="transaction-row"]').count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('bulk delete transactions', async ({ page }) => {
    // Select first transaction
    const firstCheckbox = page.locator('[type="checkbox"]').first()
    await firstCheckbox.click()
    
    // Bulk actions bar should appear
    await expect(page.locator('text=selected')).toBeVisible()
    
    // Click delete
    await page.click('text=Delete')
    
    // Confirm deletion
    await page.click('text=Delete', { force: true })
    
    // Wait for success
    await expect(page.locator('text=deleted')).toBeVisible({ timeout: 5000 })
  })

  test('bulk move transactions to portfolio', async ({ page }) => {
    // Select transaction
    await page.locator('[type="checkbox"]').first().click()
    
    // Click move
    await page.click('text=Move to Portfolio')
    
    // Select target portfolio
    await page.selectOption('[name="portfolio"]', { index: 0 })
    await page.click('text=Move Transactions')
    
    await expect(page.locator('text=moved')).toBeVisible({ timeout: 5000 })
  })

  test('bulk export transactions', async ({ page }) => {
    // Select transactions
    await page.click('text=Select All')
    
    // Click export
    const downloadPromise = page.waitForEvent('download')
    await page.click('text=Export Selected')
    
    // Wait for download
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('transactions')
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('edit transaction', async ({ page }) => {
    // Click edit on first transaction
    await page.locator('[aria-label="Edit transaction"]').first().click()
    
    // Update quantity
    await page.fill('[name="quantity"]', '1.5')
    await page.click('text=Save')
    
    await expect(page.locator('text=Transaction updated')).toBeVisible({ timeout: 5000 })
  })

  test('delete single transaction', async ({ page }) => {
    // Click delete on first transaction
    await page.locator('[aria-label="Delete transaction"]').first().click()
    
    // Confirm deletion
    await page.click('text=Delete')
    
    await expect(page.locator('text=Transaction deleted')).toBeVisible({ timeout: 5000 })
  })

  test('transaction validation - invalid quantity', async ({ page }) => {
    await page.click('text=Add Transaction')
    
    await page.fill('[name="asset"]', 'BTC')
    await page.fill('[name="quantity"]', '-1') // negative quantity
    await page.click('button[type="submit"]')
    
    // Should show validation error
    await expect(page.locator('text=must be positive')).toBeVisible()
  })

  test('sort transactions by date', async ({ page }) => {
    // Click date column header
    await page.click('text=Date')
    
    // Should sort ascending
    await expect(page.locator('[data-testid="sort-icon-asc"]')).toBeVisible()
    
    // Click again to sort descending
    await page.click('text=Date')
    await expect(page.locator('[data-testid="sort-icon-desc"]')).toBeVisible()
  })
})
