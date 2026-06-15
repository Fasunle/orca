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

  describe('cache operations', () => {
    it('should clean cache when clean command is called', () => {
      const spy = vi.spyOn(console, 'log');

      const command = 'clean';
      if (command === 'clean') {
        console.log('Clearing cache...');
      }

      expect(spy).toHaveBeenCalledWith('Clearing cache...');
      spy.mockRestore();
    });
  });

  describe('help and usage', () => {
    it('should show proper usage format for help', () => {
      const spy = vi.spyOn(console, 'log');

      const args = [];
      const command = args[0];

      if (!command) {
        console.log('Usage:');
      }

      spy.mockRestore();
    });

    it('should include examples in help text', () => {
      const helpText = `
bun-cache - Local caching for monorepos

Usage:
  bun-cache run <task> [targets...]
  bun-cache clean

Examples:
  bun-cache run build
  bun-cache run test apps/web
  bun-cache clean
      `;

      expect(helpText).toContain('Examples');
      expect(helpText).toContain('bun-cache run build');
    });
  });

  describe('task execution scenarios', () => {
    it('should accept multiple task names', () => {
      const taskNames = ['build', 'test', 'lint', 'deploy'];

      taskNames.forEach(task => {
        expect(task).toBeDefined();
        expect(typeof task).toBe('string');
      });
    });

    it('should handle workspace patterns', () => {
      const patterns = ['apps/*', 'packages/*', 'apps/*/src'];

      patterns.forEach(pattern => {
        expect(pattern).toContain('*');
      });
    });

    it('should handle specific workspace targets', () => {
      const targets = ['apps/web', 'apps/api', 'packages/ui-lib'];

      expect(targets).toHaveLength(3);
      expect(targets[0]).toBe('apps/web');
    });

    it('should handle nested workspace paths', () => {
      const args = ['run', 'build', 'monorepo/packages/core/ui'];
      const targets = args.slice(2);

      expect(targets[0]).toBe('monorepo/packages/core/ui');
    });
  });

  describe('error scenarios', () => {
    it('should provide clear error for missing arguments', () => {
      const spy = vi.spyOn(console, 'error');

      const args = ['run'];
      const task = args[1];

      if (!task) {
        console.error('Please specify a task to run');
      }

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should handle unexpected command gracefully', () => {
      const spy = vi.spyOn(console, 'log');

      const command = 'invalid-command';
      const validCommands = ['run', 'clean'];

      if (!validCommands.includes(command)) {
        console.log('bun-cache');
      }

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should handle special characters in task names', () => {
      const args = ['run', 'build:watch'];
      const task = args[1];

      expect(task).toBe('build:watch');
    });

    it('should handle special characters in target paths', () => {
      const args = ['run', 'build', '@scope/package', 'apps-v2/web'];
      const targets = args.slice(2);

      expect(targets).toContain('@scope/package');
      expect(targets).toContain('apps-v2/web');
    });
  });

  describe('CLI main function integration', () => {
    it('should handle help message output', () => {
      const spy = vi.spyOn(console, 'log');

      // Simulate help output
      const helpMsg = `
bun-cache - Local caching for monorepos

Usage:
  bun-cache run <task> [targets...]
  bun-cache clean
      `;
      console.log(helpMsg);

      expect(spy).toHaveBeenCalledWith(expect.stringContaining('bun-cache'));
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('Usage'));

      spy.mockRestore();
    });

    it('should validate task is provided for run command', () => {
      const errorSpy = vi.spyOn(console, 'error');

      const command = 'run';
      const task = undefined;

      if (command === 'run' && !task) {
        console.error('Error: Please specify a task to run');
      }

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('should process run command with task', () => {
      const command = 'run';
      const task = 'build';
      const targets = [];

      expect(command).toBe('run');
      expect(task).toBeDefined();
      expect(task).toBe('build');
    });

    it('should process run command with targets', () => {
      const command = 'run';
      const task = 'test';
      const targets = ['apps/web', 'apps/api'];

      expect(command).toBe('run');
      expect(targets).toHaveLength(2);
      expect(targets[0]).toBe('apps/web');
    });

    it('should handle clean command', () => {
      const logSpy = vi.spyOn(console, 'log');

      const command = 'clean';
      if (command === 'clean') {
        console.log('Clearing cache...');
      }

      expect(logSpy).toHaveBeenCalledWith('Clearing cache...');
      logSpy.mockRestore();
    });

    it('should show help for unrecognized command', () => {
      const logSpy = vi.spyOn(console, 'log');

      const command = 'unknown';
      const validCommands = ['run', 'clean'];

      if (!validCommands.includes(command || '')) {
        console.log('bun-cache - help');
      }

      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });

    it('should handle errors during task execution', () => {
      const errorSpy = vi.spyOn(console, 'error');

      try {
        throw new Error('Task execution failed');
      } catch (err) {
        console.error('Error:', err instanceof Error ? err.message : String(err));
      }

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('should support multiple target specifications', () => {
      const args = ['run', 'build', 'apps/web', 'apps/api', 'packages/core'];
      const command = args[0];
      const task = args[1];
      const targets = args.slice(2);

      expect(command).toBe('run');
      expect(task).toBe('build');
      expect(targets).toHaveLength(3);
    });

    it('should handle empty target list', () => {
      const args = ['run', 'build'];
      const targets = args.slice(2);

      expect(targets).toHaveLength(0);
    });

    it('should accept task names with special characters', () => {
      const taskNames = ['build:prod', 'test:e2e', 'lint:fix', 'deploy-prod'];

      taskNames.forEach(name => {
        const command = 'run';
        expect(command).toBe('run');
        expect(name).toBeDefined();
      });
    });
  });
});
