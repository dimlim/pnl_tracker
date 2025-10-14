# GitHub Repository Setup

## ✅ Git Repository Created!

Your code has been pushed to: **https://github.com/dimlim/pnl_tracker**

## 🌳 Branches Created

- ✅ `main` - Production branch
- ✅ `staging` - Preview/Testing branch  
- ✅ `develop` - Development branch (current)

## 🔧 Next Steps: Configure GitHub Settings

### 1. Set Default Branch to `develop`

1. Go to **Settings** → **Branches**
2. Change default branch from `main` to `develop`
3. Click **Update**

This ensures all new PRs target `develop` by default.

### 2. Set Up Branch Protection Rules

#### For `main` (Production):

1. Go to **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main`
3. Enable:
   - ✅ **Require a pull request before merging**
     - Required approvals: 1
   - ✅ **Require status checks to pass before merging**
     - Search and add: `lint-and-test`, `build`
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Include administrators**
   - ❌ **Allow force pushes** (keep disabled)
   - ❌ **Allow deletions** (keep disabled)
4. Click **Create**

#### For `staging` (Preview):

1. Add another rule
2. Branch name pattern: `staging`
3. Enable:
   - ✅ **Require status checks to pass before merging**
     - Add: `lint-and-test`, `build`
   - ✅ **Require branches to be up to date before merging**
   - ❌ **Allow force pushes** (keep disabled)
4. Click **Create**

#### For `develop` (Development):

1. Add another rule
2. Branch name pattern: `develop`
3. Enable:
   - ✅ **Require status checks to pass before merging**
     - Add: `lint-and-test`
   - ⚠️ **Require pull request** (optional - your choice)
4. Click **Create**

### 3. Add GitHub Secrets for CI/CD

Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PROD_SUPABASE_DB_URL
STAGING_SUPABASE_DB_URL
SUPABASE_ACCESS_TOKEN
```

**How to get these values:**

1. **Supabase URL & Keys**: 
   - Go to your Supabase project → Settings → API
   - Copy URL, anon key, and service_role key

2. **Database URLs**:
   - Format: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`
   - Get from Supabase → Settings → Database → Connection string

3. **Access Token**:
   - Go to Supabase Dashboard → Account → Access Tokens
   - Generate new token

### 4. Configure Vercel Integration

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm install && pnpm build --filter=web`
   - **Install Command**: `pnpm install`

5. Add Environment Variables in Vercel:
   - Production (main branch):
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-prod-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-key
     SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key
     ```
   - Preview (staging branch):
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-staging-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-key
     SUPABASE_SERVICE_ROLE_KEY=your-staging-service-key
     ```
   - Development (develop branch):
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-dev-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-key
     SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key
     ```

6. Configure branch deployments:
   - Production Branch: `main`
   - Enable automatic deployments for `staging` and `develop`

### 5. Enable GitHub Actions

The workflows are already configured in `.github/workflows/`:
- `ci.yml` - Runs on every push/PR
- `deploy.yml` - Runs on push to `main`

They will start running automatically once you push code.

## 📋 Workflow Summary

### Daily Development:

```bash
# 1. Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature

# 3. Create PR on GitHub to merge into develop
# 4. After approval, merge PR
# 5. Delete feature branch
```

### Deploying to Staging:

```bash
git checkout staging
git pull origin staging
git merge develop
git push origin staging
# → Triggers Vercel preview deployment
```

### Deploying to Production:

```bash
git checkout main
git pull origin main
git merge staging
git push origin main
# → Triggers production deployment
```

## 🎯 Current Status

- ✅ Repository created
- ✅ All branches pushed
- ✅ Currently on `develop` branch
- ⏳ Configure GitHub settings (follow steps above)
- ⏳ Set up Vercel integration
- ⏳ Add environment variables

## 📚 Additional Resources

- [Git Workflow Guide](./GIT_WORKFLOW.md)
- [Setup Instructions](./SETUP.md)
- [Quick Start](./QUICKSTART.md)

## 🆘 Need Help?

If you encounter issues:
1. Check GitHub Actions logs for CI failures
2. Verify environment variables are set correctly
3. Ensure Supabase projects are running
4. Review Vercel deployment logs

---

**Repository**: https://github.com/dimlim/pnl_tracker
**Current Branch**: `develop`
