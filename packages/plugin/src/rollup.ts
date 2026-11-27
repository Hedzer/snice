import { createSniceCorePlugin } from './core';
import { createSniceManualChunks } from './chunking';
import { validateOptions, type SnicePluginOptions } from './types';

export type {
  SnicePluginOptions,
  SnicePlatform,
  SniceSkinPlatform,
  SnicePlatformOption,
  SniceCachingOptions,
  SniceBuildReport,
  SniceChunkReport,
  SniceChunkTier,
  SniceReportOptions,
  SniceBudgetRule,
  SniceBudgetViolation,
  SniceCacheDiffSummary,
  SniceTableOptions,
  SniceTableOption,
  SniceThemeOptions,
} from './types';
export { SNICE_PLATFORMS, SNICE_PLATFORM_OPTIONS } from './types';
export {
  createSniceManualChunks,
  createSniceAdvancedChunksGroups,
  DEFAULT_HEAVY_COMPONENTS,
  type RolldownChunkGroup,
} from './chunking';

/**
 * Official Snice Rollup plugin (`snice/rollup`).
 * Zero runtime dependency on `vite`.
 */
export function snice(options?: SnicePluginOptions): Record<string, any> {
  const validated = validateOptions(options);
  return createSniceCorePlugin(validated, {
    isVite: false,
    isLib: false,
    isDev: validated.dev === true,
  });
}

export const snicePlugin = snice;
export default snice;
