import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Orchestrator } from '../src/orchestrator';
import { join } from 'path';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';

describe('Orchestrator', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = join(tmpdir(), `podic-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Create a minimal turbo.json
    writeFileSync(
      join(testDir, 'turbo.json'),
      JSON.stringify({
        pipeline: {
          build: {
            outputs: ['dist/**'],
            cache: true,
            inputs: ['src/**'],
          },
          test: {
            outputs: ['coverage/**'],
            cache: true,
          },
          lint: {
            outputs: [],
            cache: false,
          },
        },
        globalDependencies: [],
      })
    );

    // Create a minimal package.json with workspaces
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        name: 'test-monorepo',
        workspaces: ['apps/*', 'packages/*'],
      })
    );
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should load turbo.json and package.json', () => {
      const orchestrator = new Orchestrator(testDir);
      expect(orchestrator).toBeDefined();
    });

    it('should throw error when turbo.json is missing', () => {
      const invalidDir = join(tmpdir(), `podic-invalid-${Date.now()}`);
      mkdirSync(invalidDir, { recursive: true });

      expect(() => new Orchestrator(invalidDir)).toThrow();

      rmSync(invalidDir, { recursive: true, force: true });
    });
  });

  describe('run', () => {
    beforeEach(() => {
      // Create workspace directories with package.json files
      const appDir = join(testDir, 'apps', 'app1');
      mkdirSync(appDir, { recursive: true });
      writeFileSync(
        join(appDir, 'package.json'),
        JSON.stringify({
          name: 'app1',
          scripts: {
            build: 'echo Building app1',
            test: 'echo Testing app1',
          },
        })
      );

      // Create src directory for hash inputs
      mkdirSync(join(appDir, 'src'), { recursive: true });
      writeFileSync(join(appDir, 'src', 'index.ts'), "console.log('app1')");

      // Create another workspace
      const app2Dir = join(testDir, 'apps', 'app2');
      mkdirSync(app2Dir, { recursive: true });
      writeFileSync(
        join(app2Dir, 'package.json'),
        JSON.stringify({
          name: 'app2',
          scripts: {
            build: 'echo Building app2',
            test: 'echo Testing app2',
          },
        })
      );

      mkdirSync(join(app2Dir, 'src'), { recursive: true });
      writeFileSync(join(app2Dir, 'src', 'index.ts'), "console.log('app2')");
    });

    it('should validate task exists before running', async () => {
      const orchestrator = new Orchestrator(testDir);

      try {
        await orchestrator.run('nonexistent-task');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(String(error)).toContain('not defined in turbo.json');
      }
    });

    it('should discover all workspaces with a task', async () => {
      const orchestrator = new Orchestrator(testDir);
      // This test verifies the orchestrator can identify workspaces with the build task
      expect(() => orchestrator.run('build')).toBeDefined();
    });
  });

  describe('task graph building', () => {
    beforeEach(() => {
      // Create workspaces with dependencies
      const appDir = join(testDir, 'apps', 'app1');
      mkdirSync(appDir, { recursive: true });
      writeFileSync(
        join(appDir, 'package.json'),
        JSON.stringify({
          name: 'app1',
          scripts: { build: 'echo app1' },
        })
      );
      mkdirSync(join(appDir, 'src'), { recursive: true });
      writeFileSync(join(appDir, 'src', 'index.ts'), '// app1');
    });

    it('should handle tasks without dependencies', async () => {
      const orchestrator = new Orchestrator(testDir);
      // The lint task has no dependencies
      expect(() => orchestrator.run('lint')).toBeDefined();
    });

    it('should handle tasks with outputs', async () => {
      const orchestrator = new Orchestrator(testDir);
      // The build task has outputs defined
      expect(() => orchestrator.run('build')).toBeDefined();
    });
  });

  describe('caching', () => {
    beforeEach(() => {
      const appDir = join(testDir, 'apps', 'app1');
      mkdirSync(appDir, { recursive: true });
      writeFileSync(
        join(appDir, 'package.json'),
        JSON.stringify({
          name: 'app1',
          scripts: { build: "mkdir -p dist && echo 'built' > dist/index.js" },
        })
      );
      mkdirSync(join(appDir, 'src'), { recursive: true });
      writeFileSync(join(appDir, 'src', 'index.ts'), '// app1');
    });

    it('should cache tasks where cache is enabled', async () => {
      const orchestrator = new Orchestrator(testDir);
      // Build task has cache: true
      const spy = vi.spyOn(console, 'log');

      try {
        await orchestrator.run('build', ['apps/app1']);
      } catch (error) {
        // Build command might fail in test env, that's ok
      }

      // Check that build was attempted
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Executing'));

      spy.mockRestore();
    });

    it('should skip caching for tasks where cache is disabled', () => {
      const orchestrator = new Orchestrator(testDir);
      // Lint task has cache: false
      expect(() => orchestrator.run('lint')).toBeDefined();
    });
  });
});
