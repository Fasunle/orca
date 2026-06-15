# Code Coverage

This project uses Vitest with v8 code coverage provider to measure test coverage across the codebase.

## Overview

Code coverage helps ensure that the package is thoroughly tested and reliable. Every release includes a code coverage report that users can review to gauge test quality.

## Running Coverage

### Generate Coverage Report

To generate a complete coverage report with HTML visualization:

```bash
bun run coverage
```

This command:

1. Runs all tests with coverage instrumentation
2. Generates coverage reports in multiple formats (HTML, JSON, text)
3. Creates a `coverage-summary.md` with a formatted summary table

### View Coverage Reports

#### Summary Report

View the generated markdown summary:

```bash
cat coverage-summary.md
```

#### HTML Report

Open the interactive HTML report in a browser:

```bash
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

The HTML report shows:

- File-by-file coverage breakdown
- Detailed coverage for each source file
- Line-by-line coverage highlighting
- Branch and function coverage analysis

## Coverage Configuration

### Settings

Coverage is configured in [vitest.config.ts](vitest.config.ts):

- **Provider**: v8 (built-in code coverage via V8 JavaScript engine)
- **Include**: `src/**/*.ts` (all TypeScript source files)
- **Exclude**: Test files (`*.test.ts`, `*.spec.ts`)
- **Reporters**:
  - `text` - Console table output
  - `text-summary` - One-line summary
  - `json` - Machine-readable coverage data
  - `json-summary` - Compact summary JSON
  - `html` - Interactive HTML report

### Directory Structure

```
coverage/
├── index.html              # Main HTML report
├── cache.ts.html           # File-specific coverage
├── cli.ts.html
├── hasher.ts.html
├── logger.ts.html
├── orchestrator.ts.html
├── types.ts.html
├── coverage-final.json     # Raw v8 coverage data
└── coverage-summary.json   # Summary statistics
```

## Coverage Metrics Explained

### Statements

Percentage of code statements that are executed during tests.

### Branches

Percentage of conditional branches (if/else, switch cases) covered by tests.

### Functions

Percentage of function definitions that are called by tests.

### Lines

Percentage of source code lines executed during tests.

## Coverage Targets

| File            | Target | Status                |
| --------------- | ------ | --------------------- |
| logger.ts       | 100%   | ✅ Met                |
| hasher.ts       | 90%+   | ✅ Met                |
| orchestrator.ts | 70%+   | ✅ Met                |
| cache.ts        | 70%+   | ⚠️ In Progress        |
| cli.ts          | 70%+   | ⚠️ In Progress        |
| types.ts        | N/A    | Type definitions only |

## Coverage in CI/CD

### Publish Workflow

During the publish workflow (`.github/workflows/publish.yml`):

1. Tests are run with coverage enabled
2. Coverage report is generated
3. Summary is appended to `CHANGELOG.md`
4. Users can view coverage metrics in release notes

### Local Testing

To check coverage before committing:

```bash
# Run tests with coverage
bun run coverage

# Review the summary
cat coverage-summary.md

# Check specific file coverage
cat coverage/cache.ts.html | grep -o "coverage-[0-9]*"
```

## Improving Coverage

### Adding Tests

1. **Identify uncovered lines** in the HTML report
2. **Create test cases** in the corresponding `.test.ts` file
3. **Run coverage** to verify improvement
4. **Commit changes** with clear test descriptions

### Coverage Legend

- ✅ **100%** - Excellent coverage
- ⚠️ **80%+** - Good coverage
- ❌ **<80%** - Needs improvement

## Continuous Improvement

Coverage reports are automatically generated with each release. Over time, as the project matures:

- Edge cases get discovered and tested
- More branch conditions get exercised
- Coverage percentages should increase
- Users gain confidence in package reliability

## Resources

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage)
- [V8 Code Coverage Guide](https://v8.dev/blog/code-coverage-for-javascript)
- [Testing Best Practices](https://testing-library.com/docs/)
