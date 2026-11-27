import { createSniceCorePlugin, type SniceRuntimeEnv } from './core';
import { createSniceManualChunks } from './chunking';
import { HMR_RUNTIME_CODE, HMR_SPECIFIER, HMR_VIRTUAL_ID, transformHmr } from './hmr';
import { composeSourceMaps } from './sourcemap';
import { validateOptions, type SnicePluginOptions } from './types';

export type {
  SnicePluginOptions,
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
} from './types';
export {
  createSniceManualChunks,
  createSniceAdvancedChunksGroups,
  DEFAULT_HEAVY_COMPONENTS,
  type RolldownChunkGroup,
} from './chunking';

/**
 * Official Snice Vite plugin (`snice/vite`).
 */
export function snice(options?: SnicePluginOptions): Record<string, any> {
  const validated = validateOptions(options);
  const env: SniceRuntimeEnv = {
    isVite: true,
    isLib: false,
    isDev: validated.dev === true,
  };
  let isServeMode = false;
  const hmrEnabled = validated.hmr !== false;

  const base = createSniceCorePlugin(validated, env);

  return {
    ...base,
    name: 'snice',
    enforce: 'pre' as const,

    config(userConfig: Record<string, any>, configEnv: { command?: string; mode?: string }) {
      isServeMode = configEnv?.command === 'serve' && configEnv?.mode !== 'test';
      const isServeOrDev =
        configEnv?.command === 'serve' ||
        configEnv?.mode === 'test' ||
        configEnv?.mode === 'development';
      env.isDev = typeof validated.dev === 'boolean' ? validated.dev : isServeOrDev;
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
      isServeMode = resolvedConfig?.command === 'serve' && resolvedConfig?.mode !== 'test';
      const isServeOrDev =
        resolvedConfig?.command === 'serve' ||
        resolvedConfig?.mode === 'test' ||
        resolvedConfig?.mode === 'development';
      env.isDev = typeof validated.dev === 'boolean' ? validated.dev : isServeOrDev;
      env.isLib = Boolean(resolvedConfig?.build?.lib);
      if (typeof resolvedConfig?.root === 'string') {
        env.projectRoot = resolvedConfig.root;
      }
    },

    resolveId(id: string, importer?: string) {
      if (isServeMode && hmrEnabled && (id === HMR_SPECIFIER || id === HMR_VIRTUAL_ID)) {
        return HMR_VIRTUAL_ID;
      }
      return base.resolveId.call(this, id, importer);
    },

    load(id: string) {
      if (isServeMode && hmrEnabled && id === HMR_VIRTUAL_ID) {
        return HMR_RUNTIME_CODE;
      }
      return base.load.call(this, id);
    },

    transform(code: string, id: string) {
      const baseRes = base.transform.call(this, code, id);
      if (!isServeMode || !hmrEnabled) return baseRes;
      if (id === HMR_VIRTUAL_ID || id.startsWith('\0')) return baseRes;
      const cleanId = id.split('?')[0];
      if (!/\.(?:[cm]?[jt]sx?)$/.test(cleanId) || cleanId.includes('/node_modules/')) {
        return baseRes;
      }
      const nextCode = baseRes ? baseRes.code : code;
      const hmrRes = transformHmr(nextCode, cleanId);
      if (!hmrRes) return baseRes;
      return {
        code: hmrRes.code,
        map: composeSourceMaps(baseRes?.map ?? null, hmrRes.map) ?? hmrRes.map,
      };
    },
  };
}

export const snicePlugin = snice;
export default snice;
