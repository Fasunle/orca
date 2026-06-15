# @fasunle/bun-cache

Local caching for monorepos using Bun - a Turbo-inspired task orchestrator with zero-config caching.

![Test Status](https://github.com/fasunle/bun-cache/workflows/Test/badge.svg)
![Publish Status](https://github.com/fasunle/bun-cache/workflows/Publish%20to%20NPM/badge.svg)
[![npm version](https://badge.fury.io/js/%40fasunle%2Fbun-cache.svg)](https://www.npmjs.com/package/@fasunle/bun-cache)

## 📦 Installation

### Global (Recommended)

```bash
npm install -g @fasunle/bun-cache
```

Then use in any monorepo:

```bash
bun-cache run build
bun-cache run test
```

### Local Project

```bash
npm install --save-dev @fasunle/bun-cache
```

Then use via npx:

```bash
npx bun-cache run build
npx bun-cache run test
```

### Bun Global

If you prefer using Bun:

```bash
bun install -g @fasunle/bun-cache
```

## 🚀 Usage

### Basic Commands

```bash
# Run a task across all workspaces
bun-cache run build

# Run a task for specific workspaces
bun-cache run build apps/web apps/api

# Run tests
bun-cache run test

# Clear cache
bun-cache clean
```

### Configuration

Create a `turbo.json` file in your monorepo root:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": true,
      "inputs": ["src/**", "package.json"]
    },
    "test": {
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "cache": false
    }
  },
  "globalDependencies": ["tsconfig.json", ".eslintrc"]
}
```

### Pipeline Configuration

Each task in the pipeline can have:

- **`dependsOn`** - Dependencies that must run first
  - `"^build"` - Same task in dependency packages
  - `"workspace#task"` - Specific workspace task
- **`outputs`** - Files/folders to cache
  - Glob patterns supported
  - Relative to workspace root

- **`cache`** - Enable/disable caching (default: `true`)

- **`inputs`** - Files to consider for cache hash
  - Changes invalidate cache
  - Defaults to all source files

- **`globalDependencies`** - Root-level files affecting the cache

## 🏗️ Monorepo Structure

Expected structure:

```
project-root/
├── package.json              # Contains workspaces
├── turbo.json                # Task configuration
├── tsconfig.json             # Root config (in globalDependencies)
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── src/
│   │   └── dist/            # Cached output
│   └── api/
│       ├── package.json
│       ├── src/
│       └── dist/
└── packages/
    ├── ui/
    │   ├── package.json
    │   ├── src/
    │   └── dist/
    └── utils/
        ├── package.json
        ├── src/
        └── dist/
```

## 💾 Caching

Caching works by:

1. **Hash Calculation** - Combines task name, workspace, inputs, and dependencies
2. **Cache Storage** - Stores output metadata in `node_modules/.bun-cache`
3. **Validation** - Checks if inputs changed before using cache
4. **Restoration** - Copies cached outputs back to workspace

### Cache Hits Speed Up Builds

- First build: Full execution
- Subsequent builds (same inputs): ~100ms cache restore
- Changed inputs: Automatic invalidation and rebuild

## 🔄 Dependency Management

### Cross-Workspace Dependencies

Build dependencies between workspaces:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"] // Waits for deps to build first
    }
  }
}
```

### Task-Specific Dependencies

```json
{
  "pipeline": {
    "deploy": {
      "dependsOn": ["build", "test"] // Requires build and test first
    }
  }
}
```

## 📊 Performance

Compared to sequential execution:

- **No Cache**: Sequential execution
- **With Cache**: Parallel execution + cache hits
- **Typical Speedup**: 2-5x faster builds

Example with 3 apps:

```
Sequential:  app1-build (5s) → app2-build (5s) → app3-build (5s) = 15s
Parallel:    app1-build (5s)                                   = 5s
  +Cache:    app1-cache (0.1s) + app2-cache (0.1s) + app3-cache (0.1s) = 0.3s
```

## 🛠️ Development

### Local Testing

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Build CLI
bun run build

# Test locally
./dist/cli.js run build
```

### Running Tests

```bash
# Watch mode (development)
bun run test

# Run once (CI)
bun run test:run

# With UI dashboard
bun run test:ui
```

## 📚 Examples

### Example 1: React Monorepo

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "inputs": ["src/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### Example 2: Node Backend Monorepo

```json
{
  "pipeline": {
    "compile": {
      "outputs": ["lib/**"],
      "inputs": ["src/**"]
    },
    "lint": {
      "cache": false
    },
    "test": {
      "dependsOn": ["compile"],
      "outputs": ["coverage/**"]
    },
    "build": {
      "dependsOn": ["^build", "test"],
      "outputs": ["dist/**"]
    }
  }
}
```

## 🤝 Contributing

Contributions welcome! See [Contributing Guide](CONTRIBUTING.md)

## 📄 License

MIT

## 🐛 Issues & Support

- 🐛 [Report bugs](https://github.com/fasunle/bun-cache/issues)
- 💬 [Discussions](https://github.com/fasunle/bun-cache/discussions)
- 📖 [Documentation](https://github.com/fasunle/bun-cache)

## 🙏 Acknowledgments

Inspired by [Turbo](https://turbo.build/) - Task orchestration and monorepo management.

---

**Happy caching! 🚀**
