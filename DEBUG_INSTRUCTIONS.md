# Інструкції для діагностики проблеми з графіком

## Крок 1: Перевірити серверні логи в Vercel

1. Відкрий https://vercel.com/dims-projects-53d47b5e/pnl-tracker-web
2. Перейди на вкладку **Logs** (Runtime Logs)
3. Відфільтруй логи за останні 5 хвилин
4. Шукай логи з емодзі:
   - 🌐 COINGECKO API REQUEST
   - 📊 PROCESSED DATA
   - ⚠️ WARNING
   - ❌ ERROR

## Крок 2: Перевірити CoinGecko API вручну

Відкрий в браузері (або через curl):
```
https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=7
```

**Очікуваний результат:**
```json
{
  "prices": [[timestamp, price], ...],
  "market_caps": [...],
  "total_volumes": [...]
}
```

**Якщо бачиш помилку 429:**
- CoinGecko заблокував через rate limiting
- Потрібно зачекати або використати fallback

## Крок 3: Очистити кеш

### В браузері:
1. Відкрий DevTools (F12)
2. Правий клік на кнопці Refresh
3. Вибери "Empty Cache and Hard Reload"

### Або через консоль:
```javascript
// Вставити в консоль браузера
localStorage.clear()
sessionStorage.clear()
location.reload(true)
```

## Крок 4: Локальне тестування

Якщо проблема залишається, запусти локально:

```bash
cd /Users/dimpriadka/Downloads/old_doc_july_2025/Local\ App\ \&\ Web/pnl_tracker
pnpm install
pnpm dev
```

Відкрий http://localhost:3001/dashboard/markets/ethereum

## Що шукати в логах:

### ✅ Успішний запит:
```
🌐 ========== COINGECKO API REQUEST ==========
📍 URL: https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=7
📡 Response status: 200 OK
📊 ========== PROCESSED DATA ==========
📈 Data points: 168
⏱️ Time range: { days: "7.00" }
```

### ❌ Rate Limiting:
```
📡 Response status: 429 Too Many Requests
⚠️ Rate limited, waiting 2s and retrying...
```

### ⚠️ Недостатньо даних:
```
⚠️ WARNING: Insufficient data range!
Expected ~7 days, but got only 1.02 days
```

## Можливі рішення:

### Рішення 1: Зачекати (якщо rate limiting)
CoinGecko Free API має ліміт ~10-30 запитів/хвилину. Зачекай 1-2 хвилини.

### Рішення 2: Збільшити TTL кешу
Якщо часто натрапляєш на rate limiting, збільш час кешування.

### Рішення 3: Використати CoinCap fallback
Вже реалізовано в коді - має автоматично перемикатися при 429 помилці.

### Рішення 4: Перейти на CoinGecko Pro
Якщо потрібно більше запитів: https://www.coingecko.com/en/api/pricing
