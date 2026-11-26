import {
  composeObjectManualChunks,
  createSniceManualChunksController,
} from './chunking';
import { transformDecorators } from './decorators';
import { replaceSniceDevIdentifier } from './dev-define';
import { buildBundleReport, formatBuildReport } from './report';
import { TC39_RUNTIME_CODE, TC39_SPECIFIER, TC39_VIRTUAL_ID } from './tc39-fallback-runtime';
import { validateOptions, type SniceCachingOptions, type SnicePluginOptions } from './types';

export interface SniceRuntimeEnv {
  /** Whether Vite is driving this plugin (so Vite's `define` handles __SNICE_DEV__). */
  isVite: boolean;
  /** Whether Vite `build.lib` is enabled. */
  isLib: boolean;
  /** Resolved dev flag (updated by Vite configResolved; defaults to options.dev ?? false in Rollup). */
  isDev: boolean;
}

const SINGLE_FILE_FORMATS = new Set(['iife', 'umd']);

export function createSniceCorePlugin(
  rawOptions?: SnicePluginOptions,
  env?: SniceRuntimeEnv
): Record<string, any> {
  const options = validateOptions(rawOptions);
  const runtimeEnv: SniceRuntimeEnv = env ?? {
    isVite: false,
    isLib: false,
    isDev: options.dev ?? false,
  };

  const decoratorsEnabled = options.decorators !== false;
  const cachingEnabled = options.caching !== false;
  const cachingOptions: SniceCachingOptions | undefined =
    typeof options.caching === 'object' ? options.caching : undefined;
  const chunkController = cachingEnabled
    ? createSniceManualChunksController(cachingOptions)
    : null;

  return {
    name: 'snice',

    buildStart() {
      chunkController?.reset();
    },

    resolveId(id: string) {
      if (id === TC39_SPECIFIER || id === TC39_VIRTUAL_ID) {
        return TC39_VIRTUAL_ID;
      }
      return null;
    },

    load(id: string) {
      if (id === TC39_VIRTUAL_ID) {
        return TC39_RUNTIME_CODE;
      }
      return null;
    },

    transform(code: string, id: string) {
      if (id === TC39_VIRTUAL_ID || id.startsWith('\0')) return null;
      const cleanId = id.split('?')[0];
      if (!/\.(?:[cm]?[jt]sx?)$/.test(cleanId)) return null;

      let currentCode = code;
      let currentMap: any = null;
      let changed = false;

      // Pass A: Build-time Snice decorator lowering + TC39 2022-03 fallback
      // (and TS syntax erasure in pure Rollup builds).
      if (decoratorsEnabled) {
        const decResult = transformDecorators(currentCode, {
          stripTypeScript: !runtimeEnv.isVite,
          id: cleanId,
        });
        if (decResult) {
          currentCode = decResult.code;
          currentMap = decResult.map;
          changed = true;
        }
      }

      // Pass D: In pure Rollup, fold bare `__SNICE_DEV__` identifiers.
      // (In Vite, `config()` defines `__SNICE_DEV__` natively via Vite's define plugin.)
      if (!runtimeEnv.isVite) {
        const replaced = replaceSniceDevIdentifier(currentCode, runtimeEnv.isDev);
        if (replaced !== null) {
          currentCode = replaced;
          changed = true;
        }
      }

      if (!changed) return null;
      return { code: currentCode, map: currentMap ?? { mappings: '' } };
    },

    outputOptions(opts: Record<string, any>) {
      if (!chunkController) return opts;
      if (runtimeEnv.isLib) return opts;
      if (opts.format && SINGLE_FILE_FORMATS.has(opts.format)) return opts;
      if (opts.file) return opts;
      if (opts.inlineDynamicImports) return opts;

      // Treat any existing user/inline `manualChunks` function as authoritative
      // (including `snice doctor`'s inline `manualChunks: () => undefined`).
      if (typeof opts.manualChunks === 'function') {
        return opts;
      }

      if (opts.manualChunks && typeof opts.manualChunks === 'object') {
        return {
          ...opts,
          manualChunks: composeObjectManualChunks(
            opts.manualChunks as Record<string, string[]>,
            chunkController.manualChunks
          ),
        };
      }

      return {
        ...opts,
        manualChunks: chunkController.manualChunks,
      };
    },

    generateBundle(_outputOptions: Record<string, any>, bundle: Record<string, any>) {
      if (!options.report) return;
      const report = buildBundleReport(bundle);
      if (typeof options.report === 'function') {
        options.report(report);
      } else {
        console.log(formatBuildReport(report));
      }
    },
  };
}
