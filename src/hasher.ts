import { createHash } from 'crypto';
import { readFileSync, statSync, readdirSync } from 'fs';
import { join, relative } from 'path';

export class Hasher {
  constructor(private rootDir: string) {}

  generateTaskHash(
    workspace: string,
    task: string,
    inputs: string[] = [],
    globalDeps: string[] = []
  ): string {
    const hash = createHash('sha256');

    // Add task name and workspace
    hash.update(`${task}:${workspace}`);

    // Hash workspace package.json
    const pkgPath = join(this.rootDir, workspace, 'package.json');
    if (this.fileExists(pkgPath)) {
      hash.update(readFileSync(pkgPath));
    }

    // Hash input files
    inputs.forEach(input => {
      const fullPath = join(this.rootDir, workspace, input);
      this.hashFileOrGlob(fullPath, hash);
    });

    // Hash global dependencies
    globalDeps.forEach(dep => {
      const fullPath = join(this.rootDir, dep);
      this.hashFileOrGlob(fullPath, hash);
    });

    return hash.digest('hex').slice(0, 16);
  }

  private hashFileOrGlob(path: string, hash: ReturnType<typeof createHash>) {
    try {
      const stats = statSync(path);
      if (stats.isDirectory()) {
        this.hashDirectory(path, hash);
      } else {
        hash.update(readFileSync(path));
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  }

  private hashDirectory(dir: string, hash: ReturnType<typeof createHash>) {
    const files = readdirSync(dir);
    files.sort().forEach(file => {
      const fullPath = join(dir, file);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        this.hashDirectory(fullPath, hash);
      } else {
        hash.update(readFileSync(fullPath));
      }
    });
  }

  private fileExists(path: string): boolean {
    try {
      return statSync(path).isFile();
    } catch {
      return false;
    }
  }
}
