import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

/**
 * The component feature-combination matrices — the deliberate fuzz tier.
 *
 * Every component's matrix lives at `tests/matrix/<component>/`, and
 * `vitest.config.ts` excludes all of it except each directory's
 * `smoke.test.ts`. This config is the only way the full matrix runs, and it
 * must be asked for explicitly: `npm run test:matrix`, or the "matrix suite"
 * stage of `npm test`. Smoke slices run in both tiers, which is intended.
 *
 * Everything else — aliases, the SWC decorator transform, happy-dom, and the
 * `css: true` setting the component tests depend on — is inherited unchanged.
 */
const MATRIX_EXCLUDE = 'tests/matrix/**/!(smoke).test.ts';

const matrixConfig = mergeConfig(baseConfig, defineConfig({
  test: {
    include: ['tests/matrix/**/*.test.ts'],
  },
}));

// mergeConfig CONCATENATES arrays, so inheriting `exclude` would keep the very
// entry that hides these suites. Replace the list with the base one minus that
// entry: every other exclusion (node_modules, dist, tests/live, …) still
// applies, and only the files this config exists to run are restored.
const baseExclude = baseConfig.test?.exclude ?? [];
if (!baseExclude.includes(MATRIX_EXCLUDE)) {
  throw new Error(
    `vitest.config.ts no longer excludes "${MATRIX_EXCLUDE}"; the matrix would run twice. `
    + 'Delete this config, or realign it with the base exclude list.',
  );
}
matrixConfig.test!.exclude = baseExclude.filter(pattern => pattern !== MATRIX_EXCLUDE);

export default matrixConfig;
