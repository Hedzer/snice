#!/usr/bin/env node

import { main } from '../gauntlet/runner.js';

try {
  await main();
} catch (error) {
  console.error(`[gauntlet] ${error.message}`);
  process.exitCode = 1;
}
