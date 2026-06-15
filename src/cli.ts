#!/usr/bin/env bun

import { Orchestrator } from './orchestrator';
import { Logger } from './logger';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const task = args[1];
  const targets = args.slice(2);

  const rootDir = process.cwd();
  const orchestrator = new Orchestrator(rootDir);

  switch (command) {
    case 'run':
      if (!task) {
        Logger.errorWithContext('Error', 'Please specify a task to run');
        process.exit(1);
      }
      await orchestrator.run(task, targets);
      break;

    case 'clean':
      Logger.clearingCache();
      // Add cache cleanup
      break;

    default:
      Logger.help();
  }
}

main().catch(err => {
  Logger.errorWithContext('Error', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
