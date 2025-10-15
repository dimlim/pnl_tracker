# 🔐 GitHub Secrets Setup Guide

## Необхідні Secrets для CI/CD

Щоб GitHub Actions працював коректно, потрібно додати наступні secrets в репозиторій.

---

## 📝 Як додати Secrets

1. Відкрийте ваш репозиторій на GitHub: https://github.com/dimlim/pnl_tracker
2. Перейдіть в **Settings** → **Secrets and variables** → **Actions**
3. Натисніть **New repository secret**
4. Додайте кожен secret з списку нижче

---

## 🔑 Список Secrets

### 1. DEV Environment (для develop гілки)

#### `DEV_SUPABASE_URL`
```
https://mabkfometbozulapznak.supabase.co
```

#### `DEV_SUPABASE_ANON_KEY`
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYmtmb21ldGJvenVsYXB6bmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDgyNTMsImV4cCI6MjA3NjAyNDI1M30.mX5-vf6Ll1RtdNJ87DWLeiO57X3HmqGEhHWBpdLdTrA
```

#### `DEV_SUPABASE_SERVICE_ROLE_KEY`
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYmtmb21ldGJvenVsYXB6bmFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ0ODI1MywiZXhwIjoyMDc2MDI0MjUzfQ.a-Sl77cnBXURrP9irgr2n9cuh8tIQ7qzzdjKte6WOe8
```

---

### 2. PROD Environment (для main гілки)

#### `PROD_SUPABASE_URL`
```
https://ypwwjsvwmwoksmtyqgjy.supabase.co
```

#### `PROD_SUPABASE_ANON_KEY`
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwd3dqc3Z3bXdva3NtdHlxZ2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDgwMDAsImV4cCI6MjA3NjAyNDAwMH0.EQcdWy6hyqoJACnGvWPV9o3HPSFV-RMNKDl2ChESj8A
```

#### `PROD_SUPABASE_SERVICE_ROLE_KEY`
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwd3dqc3Z3bXdva3NtdHlxZ2p5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQ0ODAwMCwiZXhwIjoyMDc2MDI0MDAwfQ.ByUsAgGOFHg0vZKJmayutU90YHBINMlGjGnwhL1UL34
```

#### `PROD_SUPABASE_DB_URL`
```
postgresql://postgres.ypwwjsvwmwoksmtyqgjy:YOUR_DB_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```
⚠️ **Важливо**: Замініть `YOUR_DB_PASSWORD` на реальний пароль від вашої PROD бази даних

---

### 3. Encryption & Other

#### `ENCRYPTION_MASTER_KEY_B64`
```
EA3lA0lwI1zKffEtWAF2xWwd/Ty4QvnQ7wHWn1uMTUI=
```

#### `SUPABASE_ACCESS_TOKEN` (опціонально, для міграцій)
Отримайте з Supabase Dashboard → Settings → Access Tokens

---

## ✅ Перевірка

Після додавання всіх secrets:

1. Зробіть новий commit і push:
   ```bash
   git add .
   git commit -m "ci: update GitHub Actions secrets configuration"
   git push origin develop
   ```

2. Перейдіть в **Actions** tab на GitHub
3. Перевірте, чи проходить CI успішно

---

## 🔒 Безпека

⚠️ **ВАЖЛИВО**:
- **НІКОЛИ** не комітьте secrets в код
- Secrets видимі тільки в GitHub Actions
- Service Role Keys дають повний доступ до БД - тримайте їх в секреті
- Регулярно ротуйте ключі (кожні 3-6 місяців)

---

## 📚 Додаткові ресурси

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Створено**: 2025-01-15  
**Оновлено**: 2025-01-15
