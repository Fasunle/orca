import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hasher } from '../src/hasher';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Hasher', () => {
  let testDir: string;
  let hasher: Hasher;

  beforeEach(() => {
    testDir = join(tmpdir(), `podic-hasher-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    hasher = new Hasher(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('generateTaskHash', () => {
    beforeEach(() => {
      // Create workspace structure
      const wsDir = join(testDir, 'workspace1');
      mkdirSync(wsDir, { recursive: true });
      writeFileSync(
        join(wsDir, 'package.json'),
        JSON.stringify({ name: 'workspace1', version: '1.0.0' })
      );

      mkdirSync(join(wsDir, 'src'), { recursive: true });
      writeFileSync(join(wsDir, 'src', 'index.ts'), "console.log('test')");
    });

    it('should generate a hash for a task', () => {
      const hash = hasher.generateTaskHash('workspace1', 'build');

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(16); // SHA256 slice to 16 chars
    });

    it('should generate consistent hashes for same inputs', () => {
      const hash1 = hasher.generateTaskHash('workspace1', 'build');
      const hash2 = hasher.generateTaskHash('workspace1', 'build');

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different workspaces', () => {
      const wsDir2 = join(testDir, 'workspace2');
      mkdirSync(wsDir2, { recursive: true });
      writeFileSync(join(wsDir2, 'package.json'), JSON.stringify({ name: 'workspace2' }));

      const hash1 = hasher.generateTaskHash('workspace1', 'build');
      const hash2 = hasher.generateTaskHash('workspace2', 'build');

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for different tasks', () => {
      const hash1 = hasher.generateTaskHash('workspace1', 'build');
      const hash2 = hasher.generateTaskHash('workspace1', 'test');

      expect(hash1).not.toBe(hash2);
    });

    it('should include input files in hash', () => {
      const hash1 = hasher.generateTaskHash('workspace1', 'build', ['src']);

      // Modify a source file
      writeFileSync(join(testDir, 'workspace1', 'src', 'index.ts'), "console.log('modified')");

      const hash2 = hasher.generateTaskHash('workspace1', 'build', ['src']);

      expect(hash1).not.toBe(hash2);
    });

    it('should include global dependencies in hash', () => {
      const hash1 = hasher.generateTaskHash('workspace1', 'build', [], ['tsconfig.json']);

      // Create the global dependency
      writeFileSync(join(testDir, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }));

      const hash2 = hasher.generateTaskHash('workspace1', 'build', [], ['tsconfig.json']);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle missing input files gracefully', () => {
      expect(() => {
        hasher.generateTaskHash('workspace1', 'build', ['nonexistent/**']);
      }).not.toThrow();
    });

    it('should handle missing global dependencies gracefully', () => {
      expect(() => {
        hasher.generateTaskHash('workspace1', 'build', [], ['nonexistent.json']);
      }).not.toThrow();
    });

    it('should handle package.json in workspace', () => {
      const hash = hasher.generateTaskHash('workspace1', 'build');

      // Modify package.json
      writeFileSync(
        join(testDir, 'workspace1', 'package.json'),
        JSON.stringify({ name: 'workspace1', version: '2.0.0' })
      );

      const hashAfter = hasher.generateTaskHash('workspace1', 'build');

      expect(hash).not.toBe(hashAfter);
    });
  });

  describe('directory hashing', () => {
    beforeEach(() => {
      const wsDir = join(testDir, 'workspace-complex');
      mkdirSync(wsDir, { recursive: true });
      writeFileSync(join(wsDir, 'package.json'), JSON.stringify({ name: 'workspace-complex' }));

      // Create nested directory structure
      mkdirSync(join(wsDir, 'src', 'utils'), { recursive: true });
      mkdirSync(join(wsDir, 'src', 'components'), { recursive: true });

      writeFileSync(join(wsDir, 'src', 'index.ts'), '// main');
      writeFileSync(join(wsDir, 'src', 'utils', 'helper.ts'), '// helper');
      writeFileSync(join(wsDir, 'src', 'components', 'Button.ts'), '// button');
    });

    it('should hash entire directories', () => {
      const hash1 = hasher.generateTaskHash('workspace-complex', 'build', ['src']);

      // Modify a nested file
      writeFileSync(
        join(testDir, 'workspace-complex', 'src', 'utils', 'helper.ts'),
        '// modified helper'
      );

      const hash2 = hasher.generateTaskHash('workspace-complex', 'build', ['src']);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle sorted file order for consistent hashing', () => {
      const hash1 = hasher.generateTaskHash('workspace-complex', 'build', ['src']);
      const hash2 = hasher.generateTaskHash('workspace-complex', 'build', ['src']);

      expect(hash1).toBe(hash2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty inputs array', () => {
      const wsDir = join(testDir, 'empty-ws');
      mkdirSync(wsDir, { recursive: true });
      writeFileSync(join(wsDir, 'package.json'), JSON.stringify({ name: 'empty-ws' }));

      expect(() => {
        hasher.generateTaskHash('empty-ws', 'build', []);
      }).not.toThrow();
    });

    it('should handle undefined globalDeps', () => {
      const wsDir = join(testDir, 'no-deps-ws');
      mkdirSync(wsDir, { recursive: true });
      writeFileSync(join(wsDir, 'package.json'), JSON.stringify({ name: 'no-deps-ws' }));

      expect(() => {
        hasher.generateTaskHash('no-deps-ws', 'build', [], undefined);
      }).not.toThrow();
    });

    it('should generate valid hash format', () => {
      const wsDir = join(testDir, 'valid-ws');
      mkdirSync(wsDir, { recursive: true });
      writeFileSync(join(wsDir, 'package.json'), JSON.stringify({ name: 'valid-ws' }));

      const hash = hasher.generateTaskHash('valid-ws', 'build');

      // Should be hexadecimal
      expect(hash).toMatch(/^[a-f0-9]{16}$/);
    });
  });
});
