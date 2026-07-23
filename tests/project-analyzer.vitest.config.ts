import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'tests/project-analyzer.test.ts',
      'tests/analyzer-contracts.test.ts'
    ],
    pool: 'forks',
    minWorkers: 1,
    maxWorkers: 1
  }
});
