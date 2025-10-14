# Git Workflow & Branching Strategy

## 🌳 Branch Structure

```
main (production)
  ↑
staging (preview/testing)
  ↑
develop (active development)
  ↑
feature/* (feature branches)
```

## 📋 Branch Descriptions

### `main` - Production
- **Purpose**: Production-ready code
- **Deploys to**: Vercel Production
- **Protection**: Requires PR approval, CI must pass
- **Merges from**: `staging` only

### `staging` - Preview/Testing
- **Purpose**: Pre-production testing
- **Deploys to**: Vercel Preview (staging environment)
- **Protection**: Requires CI to pass
- **Merges from**: `develop` or hotfix branches

### `develop` - Development
- **Purpose**: Active development, integration branch
- **Deploys to**: Vercel Preview (dev environment)
- **Merges from**: `feature/*` branches
- **Default branch**: Yes

### `feature/*` - Feature Branches
- **Purpose**: Individual features or fixes
- **Naming**: `feature/add-charts`, `feature/fix-auth`, `bugfix/transaction-error`
- **Merges to**: `develop`

## 🚀 Deployment Flow

```
feature/xyz → develop → staging → main
     ↓           ↓          ↓        ↓
   Local      Dev Env   Staging   Production
```

## 📝 Common Workflows

### 1. Starting New Feature

```bash
# Make sure you're on develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature
git add .
git commit -m "feat: add your feature"

# Push to remote
git push origin feature/your-feature-name

# Create PR to develop on GitHub
```

### 2. Merging Feature to Develop

```bash
# After PR is approved and merged
git checkout develop
git pull origin develop

# Delete local feature branch
git branch -d feature/your-feature-name
```

### 3. Promoting Develop to Staging

```bash
# When ready to test in staging
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# This triggers Vercel preview deployment
```

### 4. Promoting Staging to Production

```bash
# After testing in staging is successful
git checkout main
git pull origin main
git merge staging
git push origin main

# This triggers production deployment
```

### 5. Hotfix for Production

```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/critical-bug

# Fix the bug
git add .
git commit -m "fix: critical bug description"

# Merge to main
git checkout main
git merge hotfix/critical-bug
git push origin main

# Also merge to staging and develop
git checkout staging
git merge hotfix/critical-bug
git push origin staging

git checkout develop
git merge hotfix/critical-bug
git push origin develop

# Delete hotfix branch
git branch -d hotfix/critical-bug
```

## 🏷️ Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

Examples:
```bash
git commit -m "feat: add portfolio creation dialog"
git commit -m "fix: resolve auth redirect issue"
git commit -m "docs: update setup instructions"
git commit -m "refactor: optimize PnL calculation"
```

## 🔒 Branch Protection Rules (GitHub)

### For `main`:
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass (CI)
- ✅ Require branches to be up to date
- ✅ Include administrators
- ❌ Allow force pushes

### For `staging`:
- ✅ Require status checks to pass (CI)
- ✅ Require branches to be up to date
- ❌ Allow force pushes

### For `develop`:
- ✅ Require status checks to pass (CI)
- ❌ Require pull request reviews (optional)

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Create feature | `git checkout -b feature/name` |
| Commit changes | `git commit -m "type: message"` |
| Push feature | `git push origin feature/name` |
| Update from develop | `git pull origin develop` |
| Switch branches | `git checkout branch-name` |
| View branches | `git branch -a` |
| Delete local branch | `git branch -d branch-name` |

## 🔄 Syncing Forks (if applicable)

```bash
# Add upstream remote (once)
git remote add upstream https://github.com/original/repo.git

# Sync with upstream
git fetch upstream
git checkout develop
git merge upstream/develop
git push origin develop
```

## 📊 Vercel Integration

Each branch deploys to different environments:

- `main` → **Production** (cryptopnl.com)
- `staging` → **Staging** (staging.cryptopnl.com)
- `develop` → **Development** (dev.cryptopnl.com)
- `feature/*` → **Preview** (feature-xyz.cryptopnl.com)

## 🐛 Troubleshooting

### Merge conflicts

```bash
# Pull latest changes
git pull origin develop

# Resolve conflicts in your editor
# Then:
git add .
git commit -m "merge: resolve conflicts"
git push
```

### Accidentally committed to wrong branch

```bash
# If not pushed yet
git reset HEAD~1  # Undo last commit, keep changes
git stash        # Save changes
git checkout correct-branch
git stash pop    # Apply changes
```

### Need to undo last commit

```bash
# Undo commit, keep changes
git reset --soft HEAD~1

# Undo commit, discard changes
git reset --hard HEAD~1
```
