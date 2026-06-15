#!/usr/bin/env bun

import { Orchestrator } from './orchestrator';
import { join } from 'path';

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
        console.error('Please specify a task to run');
        process.exit(1);
      }
      await orchestrator.run(task, targets);
      break;

    case 'clean':
      console.log('Clearing cache...');
      // Add cache cleanup
      break;

    default:
      console.log(`
bun-cache - Local caching for monorepos

Usage:
  bun-cache run <task> [targets...]
  bun-cache clean
      `);
  }
}

main().catch(console.error);
