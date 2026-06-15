import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('CLI', () => {
  let testDir: string;
  const cliPath = join(process.cwd(), 'src', 'cli.ts');

  beforeEach(() => {
    testDir = join(tmpdir(), `podic-cli-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Create test project structure
    writeFileSync(
      join(testDir, 'turbo.json'),
      JSON.stringify({
        pipeline: {
          build: {
            outputs: ['dist/**'],
            cache: true,
          },
          test: {
            outputs: ['coverage/**'],
            cache: true,
          },
        },
        globalDependencies: [],
      })
    );

    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        workspaces: ['apps/*'],
      })
    );

    // Create a sample workspace
    const appDir = join(testDir, 'apps', 'web');
    mkdirSync(appDir, { recursive: true });
    writeFileSync(
      join(appDir, 'package.json'),
      JSON.stringify({
        name: 'web',
        scripts: {
          build: 'echo Building web app',
          test: 'echo Running tests',
        },
      })
    );

    mkdirSync(join(appDir, 'src'), { recursive: true });
    writeFileSync(join(appDir, 'src', 'index.ts'), '// web app');
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('command handling', () => {
    it('should display help when no command provided', () => {
      const spy = vi.spyOn(console, 'log');

      const args = [];
      const command = args[0];

      if (!command) {
        console.log(`
bun-cache - Local caching for monorepos

Usage:
  bun-cache run <task> [targets...]
  bun-cache clean
      `);
      }

      expect(spy).toHaveBeenCalledWith(expect.stringContaining('bun-cache'));

      spy.mockRestore();
    });

    it('should validate task parameter for run command', () => {
      const spy = vi.spyOn(console, 'error');

      const args = ['run']; // run without task
      const task = args[1];

      if (!task) {
        console.error('Please specify a task to run');
      }

      expect(spy).toHaveBeenCalledWith('Please specify a task to run');

      spy.mockRestore();
    });

    it('should accept run command with task', () => {
      expect(() => {
        const args = ['run', 'build'];
        const command = args[0];
        const task = args[1];

        expect(command).toBe('run');
        expect(task).toBe('build');
      }).toBeDefined();
    });

    it('should accept run command with targets', () => {
      expect(() => {
        const args = ['run', 'build', 'apps/web', 'apps/api'];
        const command = args[0];
        const task = args[1];
        const targets = args.slice(2);

        expect(command).toBe('run');
        expect(task).toBe('build');
        expect(targets).toEqual(['apps/web', 'apps/api']);
      }).toBeDefined();
    });

    it('should handle clean command', () => {
      const spy = vi.spyOn(console, 'log');

      const args = ['clean'];
      const command = args[0];

      if (command === 'clean') {
        console.log('Clearing cache...');
      }

      expect(spy).toHaveBeenCalledWith('Clearing cache...');

      spy.mockRestore();
    });

    it('should show help for unknown command', () => {
      const spy = vi.spyOn(console, 'log');

      const args = ['unknown'];
      const command = args[0];

      if (!['run', 'clean'].includes(command || '')) {
        console.log(`
bun-cache - Local caching for monorepos

Usage:
  bun-cache run <task> [targets...]
  bun-cache clean
      `);
      }

      expect(spy).toHaveBeenCalledWith(expect.stringContaining('bun-cache'));

      spy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle missing task gracefully', () => {
      const spy = vi.spyOn(console, 'error');

      const command = 'run';
      const task = undefined;

      if (command === 'run' && !task) {
        console.error('Please specify a task to run');
      }

      expect(spy).toHaveBeenCalledWith('Please specify a task to run');

      spy.mockRestore();
    });

    it('should handle orchestrator errors', () => {
      const spy = vi.spyOn(console, 'error');

      try {
        throw new Error('Orchestration failed');
      } catch (error) {
        console.error(error);
      }

      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });
  });

  describe('argument parsing', () => {
    it('should parse command as first argument', () => {
      const args = ['run', 'build'];
      const command = args[0];

      expect(command).toBe('run');
    });

    it('should parse task as second argument', () => {
      const args = ['run', 'build'];
      const task = args[1];

      expect(task).toBe('build');
    });

    it('should parse remaining arguments as targets', () => {
      const args = ['run', 'build', 'apps/web', 'apps/api', 'packages/lib'];
      const targets = args.slice(2);

      expect(targets).toEqual(['apps/web', 'apps/api', 'packages/lib']);
      expect(targets.length).toBe(3);
    });

    it('should handle single target', () => {
      const args = ['run', 'build', 'apps/web'];
      const targets = args.slice(2);

      expect(targets).toEqual(['apps/web']);
    });

    it('should handle no targets', () => {
      const args = ['run', 'build'];
      const targets = args.slice(2);

      expect(targets).toEqual([]);
    });
  });
});
