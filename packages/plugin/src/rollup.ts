import { createSniceCorePlugin } from './core';
import { createSniceManualChunks } from './chunking';
import { validateOptions, type SnicePluginOptions } from './types';

export type {
  SnicePluginOptions,
  SniceCachingOptions,
  SniceBuildReport,
  SniceChunkReport,
  SniceTableOptions,
} from './types';
export { createSniceManualChunks, DEFAULT_HEAVY_COMPONENTS } from './chunking';

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
