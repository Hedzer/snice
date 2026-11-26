import { createSniceCorePlugin, type SniceRuntimeEnv } from './core';
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
 * Official Snice Vite plugin (`snice/vite`).
 */
export function snice(options?: SnicePluginOptions): Record<string, any> {
  const validated = validateOptions(options);
  const env: SniceRuntimeEnv = {
    isVite: true,
    isLib: false,
    isDev: validated.dev ?? false,
  };

  const base = createSniceCorePlugin(validated, env);

  return {
    ...base,
    name: 'snice',
    enforce: 'pre' as const,

    config(userConfig: Record<string, any>, configEnv: { command?: string; mode?: string }) {
      const isServeOrDev =
        configEnv?.command === 'serve' ||
        configEnv?.mode === 'test' ||
        configEnv?.mode === 'development';
      env.isDev = validated.dev !== undefined ? validated.dev : isServeOrDev;
      env.isLib = Boolean(userConfig?.build?.lib);

      const patch: Record<string, any> = {};

      const userDefine = userConfig?.define;
      const hasUserDevDefine =
        userDefine && Object.prototype.hasOwnProperty.call(userDefine, '__SNICE_DEV__');
      if (!hasUserDevDefine) {
        patch.define = {
          __SNICE_DEV__: JSON.stringify(env.isDev),
        };
      }

      if (validated.target !== false && userConfig?.build?.target === undefined) {
        patch.build = {
          target: typeof validated.target === 'string' ? validated.target : 'es2022',
        };
      }

      return patch;
    },

    configResolved(resolvedConfig: Record<string, any>) {
      const isServeOrDev =
        resolvedConfig?.command === 'serve' ||
        resolvedConfig?.mode === 'test' ||
        resolvedConfig?.mode === 'development';
      env.isDev = validated.dev !== undefined ? validated.dev : isServeOrDev;
      env.isLib = Boolean(resolvedConfig?.build?.lib);
    },
  };
}

export const snicePlugin = snice;
export default snice;
