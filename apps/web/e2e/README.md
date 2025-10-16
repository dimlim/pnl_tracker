# E2E Tests

End-to-end tests for Crypto PnL Tracker using Playwright.

## Setup

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

```bash
# Run all tests (headless)
pnpm test:e2e

# Run tests with UI mode (recommended for development)
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Debug tests
pnpm test:e2e:debug

# Run specific test file
npx playwright test e2e/portfolios.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Structure

### `portfolios.spec.ts`
- Create, edit, delete portfolios
- Test different PnL methods (FIFO/LIFO/AVG)
- Duplicate portfolios
- Validation tests
- Stats display

### `transactions.spec.ts`
- Add buy/sell transactions
- Quick add with FAB
- Keyboard shortcuts (Shift+A)
- Search and filter
- Bulk operations (delete, move, export)
- Edit and delete single transactions
- Validation tests
- Sorting

### `analytics.spec.ts`
- Key metrics display
- Asset allocation chart
- Performance chart with timeframes
- Best/worst performers
- Risk & diversification analysis
- Metric formatting

### `dashboard.spec.ts`
- Main dashboard elements
- Skeleton loaders
- Navigation
- FAB functionality
- PnL chart timeframes
- Portfolio cards
- Responsive design

## Test Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:3001`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Retries**: 2 on CI, 0 locally
- **Timeout**: 30s per test
- **Screenshots**: On failure
- **Traces**: On first retry

## CI/CD

Tests run automatically on:
- Pull requests
- Push to main/develop branches

## Writing Tests

### Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for network idle** before assertions
3. **Use explicit waits** for dynamic content
4. **Test user flows**, not implementation
5. **Keep tests independent** - no shared state
6. **Use descriptive test names**

### Example Test

```typescript
test('create portfolio', async ({ page }) => {
  await page.goto('/dashboard/portfolios')
  await page.waitForLoadState('networkidle')
  
  await page.click('text=New Portfolio')
  await page.fill('[name="name"]', 'Test Portfolio')
  await page.selectOption('[name="pnlMethod"]', 'fifo')
  await page.click('button[type="submit"]')
  
  await expect(page.locator('text=Portfolio created')).toBeVisible()
  await expect(page.locator('text=Test Portfolio')).toBeVisible()
})
```

## Debugging

### Visual Debugging

```bash
# Open Playwright Inspector
pnpm test:e2e:debug

# Open UI Mode
pnpm test:e2e:ui
```

### Screenshots & Videos

Failed tests automatically capture:
- Screenshots
- Videos (on CI)
- Traces

View in `test-results/` directory or Playwright HTML report.

### Common Issues

**Test timeout:**
- Increase timeout in test or config
- Check if server is running
- Look for network issues

**Element not found:**
- Check selector specificity
- Wait for element to be visible
- Use `page.waitForSelector()`

**Flaky tests:**
- Add explicit waits
- Check for race conditions
- Use `waitForLoadState('networkidle')`

## Reports

After running tests:

```bash
# View HTML report
npx playwright show-report
```

Report includes:
- Test results
- Screenshots
- Videos
- Traces
- Execution timeline

## Coverage

Tests cover:
- ✅ Portfolio management
- ✅ Transaction operations
- ✅ Bulk operations
- ✅ Search & filters
- ✅ Analytics
- ✅ Dashboard
- ✅ Navigation
- ✅ Keyboard shortcuts
- ✅ Responsive design
- ✅ Loading states
- ✅ Validation
- ✅ Error handling

## Future Tests

- [ ] Authentication flows
- [ ] Real-time price updates
- [ ] Export/Import
- [ ] Settings
- [ ] Performance tests
- [ ] Accessibility tests
