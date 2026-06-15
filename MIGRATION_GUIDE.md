# Migration Guide

Guide for migrating to `@fasunle/bun-cache` from other build systems.

## Table of Contents

- [From Turbo](#from-turbo)
- [From npm workspaces scripts](#from-npm-workspaces-scripts)
- [From Lerna](#from-lerna)
- [From Rush](#from-rush)
- [From custom scripts](#from-custom-scripts)
- [Troubleshooting migration](#troubleshooting-migration)

---

## From Turbo

### Compatibility

bun-cache uses the **same `turbo.json` format** as Turbo, so migration is very simple!

### Step 1: Install bun-cache

```bash
npm install -g @fasunle/bun-cache
# or
npm install --save-dev @fasunle/bun-cache
```

### Step 2: Keep your turbo.json

No changes needed! Your existing `turbo.json` works as-is.

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

### Step 3: Update package.json scripts

Replace `turbo` with `bun-cache`:

**Before:**

```json
{
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "dev": "turbo run dev"
  }
}
```

**After:**

```json
{
  "scripts": {
    "build": "bun-cache run build",
    "test": "bun-cache run test",
    "dev": "bun-cache run dev"
  }
}
```

### Step 4: Update CI/CD

Replace turbo in GitHub Actions:

**Before:**

```yaml
- name: Build
  run: npx turbo run build
```

**After:**

```yaml
- name: Build
  run: npm install -g @fasunle/bun-cache && bun-cache run build
```

### What's the same?

✅ `turbo.json` format  
✅ Task configuration (dependsOn, outputs, cache)  
✅ Caching behavior  
✅ Execution order

### What's different?

- bun-cache is smaller and faster
- Focused specifically on caching
- Simpler command interface
- Better with Bun runtime

### Migration time

**Expected:** 5-10 minutes

---

## From npm workspaces scripts

### Setup

If you're using npm workspaces with manual scripts:

```json
{
  "scripts": {
    "build": "npm -w packages/ui run build && npm -w apps/web run build"
  }
}
```

### Step 1: Create turbo.json

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

### Step 2: Install bun-cache

```bash
npm install -g @fasunle/bun-cache
```

### Step 3: Replace scripts

**Before:**

```json
{
  "scripts": {
    "build": "npm -w packages/ui run build && npm -w apps/web run build"
  }
}
```

**After:**

```json
{
  "scripts": {
    "build": "bun-cache run build"
  }
}
```

### Benefits

✅ Automatic dependency resolution  
✅ Parallel execution for independent tasks  
✅ Caching across builds  
✅ Cleaner scripts

### Example before/after

**Before:**

```bash
# Manual dependency management
npm -w packages/types run build
npm -w packages/utils run build  # Must wait for types
npm -w packages/ui run build     # Must wait for utils
npm -w apps/web run build        # Must wait for ui
```

**After:**

```bash
bun-cache run build
# Automatically handles dependency order & parallelization
```

### Migration time

**Expected:** 15-20 minutes

---

## From Lerna

### Lerna to bun-cache

Lerna manages versioning and publishing. bun-cache focuses on caching.

### Step 1: Keep Lerna for versioning

If you use Lerna for:

- Version management
- Publishing to npm
- Creating releases

Keep those in Lerna.

### Step 2: Replace Lerna scripts with bun-cache

Lerna config:

```json
{
  "packages": ["packages/*", "apps/*"],
  "version": "independent",
  "command": {
    "publish": {
      "ignoreScripts": true
    }
  }
}
```

Add to root `package.json`:

```json
{
  "scripts": {
    "build": "bun-cache run build",
    "test": "bun-cache run test"
  }
}
```

### Step 3: Create turbo.json

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### Step 4: Update CI/CD

Add bun-cache before Lerna publish:

```yaml
- name: Build
  run: bun-cache run build

- name: Test
  run: bun-cache run test

- name: Publish
  run: lerna publish from-package
```

### Hybrid setup

Keep Lerna + add bun-cache:

```bash
# Build with caching
bun-cache run build

# Test with caching
bun-cache run test

# Publish with Lerna
lerna publish
```

### Migration time

**Expected:** 20-30 minutes

---

## From Rush

### Rush to bun-cache

Rush provides:

- Monorepo management
- Dependency resolution
- Change detection

bun-cache adds caching layer.

### Step 1: Understand your rush.json

```json
{
  "projects": [
    {
      "packageName": "@company/ui",
      "projectFolder": "packages/ui"
    }
  ]
}
```

### Step 2: Create turbo.json

Translate Rush commands to turbo.json:

**Before (rush.json):**

```json
{
  "command": {
    "build": {
      "enableParallelism": true,
      "ignoreMissingScript": true
    },
    "test": {
      "enableParallelism": true,
      "ignoreMissingScript": true
    }
  }
}
```

**After (turbo.json):**

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### Step 3: Migrate commands

Replace Rush commands with bun-cache:

**Before:**

```bash
rush build
rush test
rush rebuild
```

**After:**

```bash
bun-cache run build
bun-cache run test
bun-cache clean && bun-cache run build
```

### Step 4: Update package scripts

```json
{
  "scripts": {
    "build": "bun-cache run build",
    "test": "bun-cache run test",
    "clean": "bun-cache clean"
  }
}
```

### Why bun-cache with Rush?

- Caching layer (faster rebuilds)
- Simpler configuration
- Better Bun support
- Can use alongside Rush

### Migration time

**Expected:** 30-45 minutes

---

## From custom scripts

### Manual scripting

If you have custom scripts:

```json
{
  "scripts": {
    "build": "npm -w packages/a run build && npm -w packages/b run build && npm -w apps/web run build",
    "test": "npm -w packages/a run test && npm -w packages/b run test"
  }
}
```

### Step 1: Analyze dependencies

Map out your task dependencies:

```
build:
  packages/a → (no deps)
  packages/b → packages/a
  apps/web → packages/a, packages/b

test:
  packages/a → build
  packages/b → build
  apps/web → build
```

### Step 2: Create turbo.json

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "lib/**"],
      "inputs": ["src/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "inputs": ["test/**"]
    },
    "lint": {
      "cache": false,
      "inputs": ["src/**"]
    }
  }
}
```

### Step 3: Replace scripts

**Before:**

```json
{
  "scripts": {
    "build": "npm -w packages/a run build && npm -w packages/b run build && npm -w apps/web run build",
    "test": "npm -w packages/a run test && npm -w packages/b run test"
  }
}
```

**After:**

```json
{
  "scripts": {
    "build": "bun-cache run build",
    "test": "bun-cache run test"
  }
}
```

### Step 4: Add caching

Get automatic caching:

```bash
# First run: 30 seconds
npm run build

# Second run: 0.5 seconds (56x faster!)
npm run build
```

### Benefits

✅ Automatic parallelization  
✅ Dependency resolution  
✅ Caching  
✅ Simpler maintenance

### Migration time

**Expected:** 15-25 minutes

---

## Troubleshooting migration

### Issue: "turbo.json not found"

**Solution:**
Create turbo.json in project root:

```bash
touch turbo.json
```

Add basic config:

```json
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**"]
    }
  }
}
```

### Issue: Tasks run sequentially instead of parallel

**Check:** `dependsOn` configuration

Make sure independent tasks don't have dependencies:

```json
{
  "lint": {
    // No dependsOn - runs in parallel with others
  },
  "test": {
    "dependsOn": ["build"] // Explicitly depends on build
  }
}
```

### Issue: Cache not working after migration

**Check:**

1. `outputs` is defined:

   ```json
   {
     "build": {
       "outputs": ["dist/**"] // ✅ Required
     }
   }
   ```

2. Files actually created:
   ```bash
   npm -w packages/a run build
   ls packages/a/dist/  # Should have files
   ```

### Issue: Different package manager commands

**From:** npm workspaces:

```bash
npm -w packages/ui run build
```

**To:** bun-cache (package-agnostic):

```bash
bun-cache run build apps/ui
```

### Issue: Environment-specific configuration

If you have environment-specific builds, use shell variables:

```bash
NODE_ENV=production bun-cache run build
NODE_ENV=development bun-cache run build
```

### Issue: Custom build outputs

If your scripts create multiple output locations:

```json
{
  "build": {
    "outputs": ["dist/**", "build/**", ".next/**", "coverage/**"]
  }
}
```

---

## Post-Migration Checklist

- [ ] Installed bun-cache globally or locally
- [ ] Created/updated turbo.json
- [ ] Updated package.json scripts
- [ ] Updated CI/CD configuration
- [ ] Tested locally: `bun-cache run build`
- [ ] Tested caching: Run twice, verify cache hit
- [ ] Updated team documentation
- [ ] Committed changes to git
- [ ] Deployed to staging
- [ ] Monitored for issues
- [ ] Updated development docs

---

## Performance Expectations

### Migration impact on build time

| Scenario        | Before | After | Speedup |
| --------------- | ------ | ----- | ------- |
| First build     | 45s    | 45s   | 1x      |
| Cached build    | 45s    | 0.8s  | 56x     |
| One file change | 45s    | 12s   | 3.75x   |
| Config change   | 45s    | 28s   | 1.6x    |

### CI/CD savings

Typical monorepo (6 services, 4 packages):

```
Before: Each build runs full pipeline = 50s
After:  First CI/CD = 50s, Subsequent = 0.8s

Monthly savings (100 CI runs):
- First 2 runs: 100s
- Remaining 98 runs: 78s
Total: 178s vs 5000s = 96% faster!
```

---

## Getting Help

If migration issues arise:

1. **Check FAQ:** [FAQ.md](./FAQ.md)
2. **Review examples:** [EXAMPLES.md](./EXAMPLES.md)
3. **Read documentation:** [CONFIGURATION.md](./CONFIGURATION.md)
4. **Open GitHub issue:** [GitHub Issues](https://github.com/fasunle/bun-cache/issues)

---

## Rollback Plan

If you need to rollback to your previous setup:

```bash
# 1. Keep your old scripts in git history
git log --oneline package.json

# 2. Revert if needed
git checkout <commit> -- package.json turbo.json

# 3. Reinstall your previous tool
npm install -g turbo  # or lerna, rush, etc.
```

---

**Migration complete! Your builds should now be significantly faster.**

For questions, see [FAQ.md](./FAQ.md) or open an issue on GitHub.
