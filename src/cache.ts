import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

export class CacheManager {
  private cacheDir: string;

  constructor(rootDir: string) {
    this.cacheDir = join(rootDir, 'node_modules', '.bun-cache');
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  get(hash: string): boolean {
    const metaPath = join(this.cacheDir, `${hash}.json`);
    if (!existsSync(metaPath)) return false;

    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));

    // Verify outputs still exist and are valid
    const allOutputsExist = meta.outputs.every((output: string) => existsSync(output));

    return allOutputsExist;
  }

  save(hash: string, outputs: string[]): void {
    const meta = {
      timestamp: Date.now(),
      outputs: outputs.map(o => join(process.cwd(), o)),
    };

    const metaPath = join(this.cacheDir, `${hash}.json`);
    writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  }

  restore(hash: string): void {
    const metaPath = join(this.cacheDir, `${hash}.json`);
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));

    // Copy cached outputs back to workspace
    meta.outputs.forEach((output: string) => {
      const cachedPath = join(this.cacheDir, hash, 'outputs', output);
      if (existsSync(cachedPath)) {
        execSync(`cp -r "${cachedPath}" "${output}"`);
      }
    });
  }

  clean(): void {
    rmSync(this.cacheDir, { recursive: true, force: true });
  }
}
