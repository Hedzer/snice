import {
  composeObjectManualChunks,
  createSniceManualChunksController,
} from './chunking';
import { replaceSniceDevIdentifier } from './dev-define';
import { buildBundleReport, formatBuildReport } from './report';
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

    transform(code: string, id: string) {
      // In Vite, `config()` defines `__SNICE_DEV__` natively via Vite's define plugin.
      // In pure Rollup, perform lightweight identifier replacement here.
      if (runtimeEnv.isVite) return null;
      if (!/\.(?:[cm]?[jt]sx?)(?:\?.*)?$/.test(id)) return null;
      const replaced = replaceSniceDevIdentifier(code, runtimeEnv.isDev);
      if (replaced === null) return null;
      return { code: replaced, map: { mappings: '' } };
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
