import { createSniceCorePlugin, type SniceRuntimeEnv } from './core';
import { createSniceManualChunks } from './chunking';
import { HMR_RUNTIME_CODE, HMR_SPECIFIER, HMR_VIRTUAL_ID, transformHmr } from './hmr';
import { composeSourceMaps } from './sourcemap';
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
 * Hoist emitted `snice-theme-*.css` stylesheet `<link>` tags ahead of app
 * stylesheets in Vite-generated HTML so base Snice theme tokens never override
 * user `:root` seed overrides or custom `[data-theme="..."]` blocks.
 */
export function reorderThemeStylesheetsInHtml(html: string): string {
  if (!html.includes('snice-theme')) return html;

  const linkRe = /<link\b[^>]*>/gi;
  const links: Array<{ start: number; end: number; tag: string; isSniceTheme: boolean }> = [];
  let match: RegExpExecArray | null;
  while ((match = linkRe.exec(html)) !== null) {
    const tag = match[0];
    if (!/\brel\s*=\s*["']?stylesheet["']?(?=[\s/>])/i.test(tag)) continue;
    const isSniceTheme = /\bhref\s*=\s*["'][^"']*\/?snice-theme(?:-[^"'./]+)?\.css(?:\?[^"']*)?["']/i.test(tag);
    links.push({ start: match.index, end: match.index + tag.length, tag, isSniceTheme });
  }

  const firstAppIdx = links.findIndex((l) => !l.isSniceTheme);
  if (firstAppIdx === -1) return html;
  const misplacedTheme = links.filter((l, idx) => l.isSniceTheme && idx > firstAppIdx);
  if (misplacedTheme.length === 0) return html;

  const firstApp = links[firstAppIdx];
  const lineStart = html.lastIndexOf('\n', firstApp.start) + 1;
  const indent = html.slice(lineStart, firstApp.start).match(/^[ \t]*/)?.[0] ?? '';

  let result = html;
  for (let i = misplacedTheme.length - 1; i >= 0; i--) {
    const entry = misplacedTheme[i];
    let rmStart = entry.start;
    let rmEnd = entry.end;
    const ls = result.lastIndexOf('\n', rmStart);
    const beforeOnLine = result.slice(ls + 1, rmStart);
    if (/^[ \t]*$/.test(beforeOnLine)) {
      rmStart = ls + 1;
      if (result[rmEnd] === '\r' && result[rmEnd + 1] === '\n') rmEnd += 2;
      else if (result[rmEnd] === '\n') rmEnd += 1;
    }
    result = result.slice(0, rmStart) + result.slice(rmEnd);
  }

  const hoistedBlock = misplacedTheme.map((l) => `${l.tag}\n${indent}`).join('');
  return result.slice(0, firstApp.start) + hoistedBlock + result.slice(firstApp.start);
}

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
      const hasUserPlatformDefine =
        userDefine && Object.prototype.hasOwnProperty.call(userDefine, '__SNICE_PLATFORM__');
      const definePatch: Record<string, string> = {};
      if (!hasUserDevDefine && validated.dev !== 'preserve') {
        definePatch.__SNICE_DEV__ = JSON.stringify(env.isDev);
      }
      if (!hasUserPlatformDefine && validated.platform !== 'preserve') {
        definePatch.__SNICE_PLATFORM__ = JSON.stringify(validated.platform ?? 'multi');
      }
      if (Object.keys(definePatch).length > 0) {
        patch.define = definePatch;
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

    transformIndexHtml: {
      order: 'post' as const,
      handler(html: string) {
        return reorderThemeStylesheetsInHtml(html);
      },
    },
  };
}

export const snicePlugin = snice;
export default snice;
