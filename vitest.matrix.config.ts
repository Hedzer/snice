import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

/**
 * The table feature-combination matrix — the deliberate fuzz tier.
 *
 * `vitest.config.ts` excludes `tests/components/table-matrix` so the everyday
 * loop does not pay its ~100s. This config is the only way the suite runs, and
 * it must be asked for explicitly: `npm run test:matrix`, or the "table matrix
 * suite" stage of `npm test`.
 *
 * Everything else — aliases, the SWC decorator transform, happy-dom, and the
 * `css: true` setting the component tests depend on — is inherited unchanged.
 */
const MATRIX_DIR = 'tests/components/table-matrix';

const matrixConfig = mergeConfig(baseConfig, defineConfig({
  test: {
    include: [`${MATRIX_DIR}/**/*.test.ts`],
  },
}));

// mergeConfig CONCATENATES arrays, so inheriting `exclude` would keep the very
// entry that hides this suite. Replace the list with the base one minus the
// matrix directory: every other exclusion (node_modules, dist, tests/live, …)
// still applies, and only the directory this config exists to run is restored.
const baseExclude = baseConfig.test?.exclude ?? [];
if (!baseExclude.includes(MATRIX_DIR)) {
  throw new Error(
    `vitest.config.ts no longer excludes "${MATRIX_DIR}"; the matrix would run twice. `
    + 'Delete this config, or realign it with the base exclude list.',
  );
}
matrixConfig.test!.exclude = baseExclude.filter(pattern => pattern !== MATRIX_DIR);

export default matrixConfig;
