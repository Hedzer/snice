import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  composeObjectManualChunks,
  createSniceAdvancedChunksGroups,
  createSniceManualChunksController,
} from './chunking';
import {
  collectReferencedSniceTokens,
  extractTopLevelRootAllowlist,
  getBaseThemeSliceKind,
  getPlatformThemeCssName,
  isThemeCssId,
  loadPlatformThemeCss,
  loadShippedThemeCss,
  pruneThemeCss,
  pruneThemeFeatureBlocks,
  rehashBundleAsset,
  stripChunkCssFallbacks,
  stripVarFallbacks,
  transformCssModule,
} from './css';
import { transformDecorators } from './decorators';
import { replaceSniceDevIdentifier, replaceSnicePlatformIdentifier } from './dev-define';
import { buildBundleReport, formatBuildReport } from './report';
import { composeSourceMaps } from './sourcemap';
import {
  generateModularTableEntry,
  isSniceTableEntrySpecifier,
  resolveAutoTableStripConfig,
  resolveTableStripConfig,
  VIRTUAL_TABLE_ID,
  type ResolvedTableStripConfig,
} from './table-strip';
import { TC39_RUNTIME_CODE, TC39_SPECIFIER, TC39_VIRTUAL_ID } from './tc39-fallback-runtime';
import { transformTemplates } from './templates';
import {
  validateOptions,
  type SniceCachingOptions,
  type SnicePlatform,
  type SnicePluginOptions,
  type SniceSkinPlatform,
} from './types';

export interface SniceRuntimeEnv {
  /** Whether Vite is driving this plugin (so Vite's `define` handles __SNICE_DEV__). */
  isVite: boolean;
  /** Whether Vite `build.lib` is enabled. */
  isLib: boolean;
  /** Resolved dev flag (updated by Vite configResolved; defaults to options.dev ?? false in Rollup). */
  isDev: boolean;
  /** Optional project root directory (populated by Vite configResolved). */
  projectRoot?: string;
}

function findNearestProjectRoot(importer?: string): string {
  if (importer) {
    let dir = dirname(importer.split('?')[0]);
    for (let i = 0; i < 8; i++) {
      if (existsSync(join(dir, 'package.json'))) return dir;
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return dirname(importer.split('?')[0]);
  }
  return process.cwd();
}

const SINGLE_FILE_FORMATS = new Set(['iife', 'umd']);
const PLATFORM_BEHAVIOR_MODULE_RE =
  /(?:^|[\\/])(?:snice[\\/](?:dist[\\/])?components|packages[\\/]components[\\/]src)[\\/]platform-behaviors[\\/][^/\\]+\.(?:[cm]?[jt]s)$/;

function asSkinPlatform(p: SnicePluginOptions['platform']): SniceSkinPlatform | null {
  if (p === 'ios' || p === 'material' || p === 'windows' || p === 'macos') return p;
  return null;
}

function asConcretePlatform(p: SnicePluginOptions['platform']): SnicePlatform | null {
  if (p === 'default' || p === 'ios' || p === 'material' || p === 'windows' || p === 'macos') {
    return p;
  }
  return null;
}

/**
 * Clean up auto-injected platform CSS markers in an emitted CSS asset:
 * - If the user explicitly imported `theme/platforms/<p>.css`, drop all auto-injected blocks.
 * - Else if both `core` and `dark` auto-injected blocks exist, drop the earlier `core` copy
 *   and keep the later `dark` copy (so platform dark overrides stay after `dark.css`).
 * - Always strip the `/*!snice-pf-...*\/` sentinel comments themselves.
 */
function reconcileAutoInjectedPlatformCss(
  cssText: string,
  explicitImported: boolean
): string {
  if (!cssText.includes('snice-pf-start:')) return cssText;

  const blockRe = /\/\*!snice-pf-start:(theme|core|dark)\*\/[\s\S]*?\/\*!snice-pf-end:\1\*\//g;
  if (explicitImported) {
    return cssText.replace(blockRe, '');
  }

  const hasDarkBlock = cssText.includes('/*!snice-pf-start:dark*/');
  const hasThemeBlock = cssText.includes('/*!snice-pf-start:theme*/');
  return cssText.replace(blockRe, (match, kind: string) => {
    if (kind === 'core' && (hasDarkBlock || hasThemeBlock)) {
      return '';
    }
    return match
      .replace(`/*!snice-pf-start:${kind}*/`, '')
      .replace(`/*!snice-pf-end:${kind}*/`, '');
  });
}

export function createSniceCorePlugin(
  rawOptions?: SnicePluginOptions,
  env?: SniceRuntimeEnv
): Record<string, any> {
  const options = validateOptions(rawOptions);
  const runtimeEnv: SniceRuntimeEnv = env ?? {
    isVite: false,
    isLib: false,
    isDev: options.dev === true,
  };

  const decoratorsEnabled = options.decorators !== false;
  const cachingEnabled = options.caching !== false;
  const cachingOptions: SniceCachingOptions | undefined =
    typeof options.caching === 'object' ? options.caching : undefined;
  const chunkController = cachingEnabled
    ? createSniceManualChunksController(cachingOptions)
    : null;

  const activeSkinPlatform = asSkinPlatform(options.platform);
  const concretePlatform = asConcretePlatform(options.platform);

  // Per-instance build-scoped CSS/theme and table-stripping state (reset in buildStart)
  let sniceThemeDetected = false;
  let fullThemeAtImportDetected = false;
  let explicitPlatformThemeImported = false;
  let themeAllowlist: Set<string> | null = null;
  let shippedAllowlistCache: Set<string> | null = null;
  let tableStripConfig: ResolvedTableStripConfig | null = null;
  let tableAutoEvaluated = false;
  let lastTableImporter: string | undefined;

  function addToThemeAllowlist(source: string): boolean {
    const extracted = extractTopLevelRootAllowlist(source);
    if (extracted.size === 0) return false;
    if (!themeAllowlist) themeAllowlist = new Set<string>();
    for (const token of extracted) {
      themeAllowlist.add(token);
    }
    return true;
  }

  function recordThemeCss(id: string, cssSource?: string): void {
    sniceThemeDetected = true;
    let source = cssSource;
    if (!source) {
      const cleanPath = id.split('?')[0];
      if (existsSync(cleanPath)) {
        try {
          source = readFileSync(cleanPath, 'utf8');
        } catch {
          // ignore
        }
      }
    }
    if (source) {
      addToThemeAllowlist(source);
    }
  }

  function recordCustomThemeCss(id: string, cssSource?: string): void {
    if (id.includes('?inline')) return;
    let source = cssSource;
    if (!source || !source.includes('--snice-')) {
      const cleanPath = id.split('?')[0];
      if (existsSync(cleanPath)) {
        try {
          const disk = readFileSync(cleanPath, 'utf8');
          if (disk.includes('--snice-')) source = disk;
        } catch {
          // ignore
        }
      }
    }
    if (source && source.includes('--snice-')) {
      addToThemeAllowlist(source);
    }
  }

  function resolveEffectiveFallbackAllowlist(): Set<string> | null {
    const mode = options.stripCssFallbacks ?? 'auto';
    if (mode === false) return null;
    if (mode === 'auto') {
      if (runtimeEnv.isDev) return null;
      if (themeAllowlist && themeAllowlist.size > 0) return themeAllowlist;
      // Only fall back to full shipped theme.css in 'auto' mode if full theme.css was
      // pulled via CSS @import without hitting our load/transform hooks.
      // Never broaden partial slice imports (e.g. core.css without effects.css).
      if (fullThemeAtImportDetected) {
        if (!shippedAllowlistCache) {
          const shipped = loadShippedThemeCss();
          shippedAllowlistCache = shipped ? extractTopLevelRootAllowlist(shipped) : new Set();
        }
        return shippedAllowlistCache.size > 0 ? shippedAllowlistCache : null;
      }
      return null;
    }
    // Explicit stripCssFallbacks: true
    if (themeAllowlist && themeAllowlist.size > 0) return themeAllowlist;
    if (!shippedAllowlistCache) {
      const shipped = loadShippedThemeCss();
      shippedAllowlistCache = shipped ? extractTopLevelRootAllowlist(shipped) : new Set();
    }
    return shippedAllowlistCache.size > 0 ? shippedAllowlistCache : null;
  }

  function isThemeCssAsset(fileName: string, cssContent: string): boolean {
    if (/(?:^|\/)snice-theme(?:-[^/]+)?\.css$/.test(fileName)) return true;
    if (/(?:^|\/)(?:theme|core|dark|accents|effects|density|motion|print|ios|material|windows|macos|default)(?:-scoped)?\.css$/.test(fileName) && sniceThemeDetected) {
      return true;
    }
    if (
      sniceThemeDetected &&
      (cssContent.includes('--snice-color-gray-50:') ||
        cssContent.includes('--snice-shadow-glow-primary:') ||
        cssContent.includes('--snice-color-accent-1:') ||
        cssContent.includes('[data-density=') ||
        cssContent.includes('[data-motion='))
    ) {
      return true;
    }
    return false;
  }

  return {
    name: 'snice',

    buildStart() {
      chunkController?.reset();
      sniceThemeDetected = false;
      fullThemeAtImportDetected = false;
      explicitPlatformThemeImported = false;
      themeAllowlist = null;
      lastTableImporter = undefined;
      tableAutoEvaluated = false;
      // Validate and normalize options.table eagerly so typos fail fast at buildStart.
      tableStripConfig = resolveTableStripConfig(options.table);
    },

    resolveId(id: string, importer?: string) {
      if (id === TC39_SPECIFIER || id === TC39_VIRTUAL_ID) {
        return TC39_VIRTUAL_ID;
      }
      if (options.table === 'auto' && !tableAutoEvaluated && importer !== VIRTUAL_TABLE_ID && isSniceTableEntrySpecifier(id)) {
        tableAutoEvaluated = true;
        const rootDir = runtimeEnv.projectRoot ?? findNearestProjectRoot(importer);
        tableStripConfig = resolveAutoTableStripConfig(rootDir);
      }
      if (tableStripConfig) {
        if (id === VIRTUAL_TABLE_ID) return VIRTUAL_TABLE_ID;
        if (importer === VIRTUAL_TABLE_ID && id.startsWith('snice/')) {
          return (this as any).resolve?.(id, lastTableImporter, { skipSelf: true }) ?? null;
        }
        if (importer !== VIRTUAL_TABLE_ID && isSniceTableEntrySpecifier(id)) {
          if (importer) lastTableImporter = importer;
          return VIRTUAL_TABLE_ID;
        }
      }
      if (isThemeCssId(id)) {
        sniceThemeDetected = true;
        if (activeSkinPlatform && getPlatformThemeCssName(id) === activeSkinPlatform) {
          explicitPlatformThemeImported = true;
        }
      }
      return null;
    },

    load(id: string) {
      if (id === TC39_VIRTUAL_ID) {
        return TC39_RUNTIME_CODE;
      }
      if (id === VIRTUAL_TABLE_ID && tableStripConfig) {
        return generateModularTableEntry(tableStripConfig);
      }
      if (isThemeCssId(id)) {
        recordThemeCss(id);
        if (activeSkinPlatform && getPlatformThemeCssName(id) === activeSkinPlatform) {
          explicitPlatformThemeImported = true;
        }
      } else if (id.split('?')[0].endsWith('.css')) {
        recordCustomThemeCss(id);
      }
      return null;
    },

    transform(code: string, id: string) {
      if (id === TC39_VIRTUAL_ID || id.startsWith('\0')) return null;
      const cleanId = id.split('?')[0];

      // Track Snice theme slices & user custom theme CSS in the module graph
      if (isThemeCssId(id)) {
        const looksRawCss =
          code.includes('--snice-') ||
          code.includes('@media') ||
          code.includes('[data-');
        recordThemeCss(id, looksRawCss ? code : undefined);

        if (activeSkinPlatform) {
          if (getPlatformThemeCssName(id) === activeSkinPlatform) {
            explicitPlatformThemeImported = true;
          } else if (looksRawCss && !id.includes('?inline')) {
            const sliceKind = getBaseThemeSliceKind(id);
            if (sliceKind) {
              const platformCss = loadPlatformThemeCss(activeSkinPlatform, cleanId);
              if (platformCss) {
                addToThemeAllowlist(platformCss);
                const tagged = `\n/*!snice-pf-start:${sliceKind}*/\n${platformCss}\n/*!snice-pf-end:${sliceKind}*/\n`;
                return { code: code + tagged, map: null };
              }
            }
          }
        }
        return null;
      }
      if (cleanId.endsWith('.css')) {
        if (/@import\s+['"][^'"]*theme\/theme\.css['"]/.test(code)) {
          sniceThemeDetected = true;
          fullThemeAtImportDetected = true;
        } else if (
          /@import\s+['"][^'"]*theme\/(?:core|dark|accents|effects|density|motion|print)\.css['"]/.test(code)
        ) {
          sniceThemeDetected = true;
        }
        recordCustomThemeCss(id, code);
        return null;
      }

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
          currentMap = composeSourceMaps(currentMap, decResult.map);
          changed = true;
        }
      }

      // Pass B: Build-time html`` / svg`` template minification, unused data-platform-only
      // element stripping, & opt-in pre-compilation.
      const shouldMinifyTemplates =
        options.minifyTemplates !== undefined ? options.minifyTemplates : !runtimeEnv.isDev;
      const shouldPrecompileTemplates = options.precompileTemplates === true;
      if (shouldMinifyTemplates || shouldPrecompileTemplates || concretePlatform) {
        const tmplResult = transformTemplates(currentCode, {
          id: cleanId,
          minifyTemplates: shouldMinifyTemplates,
          precompileTemplates: shouldPrecompileTemplates,
          platform: options.platform,
        });
        if (tmplResult) {
          currentCode = tmplResult.code;
          currentMap = composeSourceMaps(currentMap, tmplResult.map);
          changed = true;
        }
      }

      // Pass C1: Inline css`` minification, static .css?inline folding, & colocated
      // component platform CSS folding above `@layer snice-base`.
      const shouldMinifyCss =
        options.minifyCss !== undefined ? options.minifyCss : !runtimeEnv.isDev;
      const cssResult = transformCssModule(currentCode, {
        id: cleanId,
        minifyCss: shouldMinifyCss,
        platform: activeSkinPlatform ?? undefined,
      });
      if (cssResult) {
        currentCode = cssResult.code;
        currentMap = composeSourceMaps(currentMap, cssResult.map);
        changed = true;
      }

      // Pass D: In pure Rollup, fold bare `__SNICE_DEV__` and `__SNICE_PLATFORM__`
      // identifiers unless `'preserve'` is set (library builds keep them intact).
      if (!runtimeEnv.isVite && options.dev !== 'preserve') {
        const devRes = replaceSniceDevIdentifier(currentCode, runtimeEnv.isDev, cleanId);
        if (devRes !== null) {
          currentCode = devRes.code;
          currentMap = composeSourceMaps(currentMap, devRes.map);
          changed = true;
        }
      }
      if (!runtimeEnv.isVite && options.platform !== 'preserve') {
        const platRes = replaceSnicePlatformIdentifier(
          currentCode,
          options.platform ?? 'multi',
          cleanId
        );
        if (platRes !== null) {
          currentCode = platRes.code;
          currentMap = composeSourceMaps(currentMap, platRes.map);
          changed = true;
        }
      }

      const isPlatformBehaviorMod = PLATFORM_BEHAVIOR_MODULE_RE.test(cleanId);
      if (!changed) {
        if (isPlatformBehaviorMod) {
          return { code: currentCode, map: null, moduleSideEffects: false };
        }
        return null;
      }
      return {
        code: currentCode,
        map: currentMap ?? { mappings: '' },
        ...(isPlatformBehaviorMod ? { moduleSideEffects: false } : {}),
      };
    },

    renderChunk(code: string, chunk?: { fileName?: string }) {
      // Pass C2: Order-independent decoded-JS-string var(--snice-*, fallback) stripping.
      // Runs after ALL modules (including theme.css in any import order) are loaded.
      const allowlist = resolveEffectiveFallbackAllowlist();
      if (!allowlist) return null;
      return stripChunkCssFallbacks(code, allowlist, chunk?.fileName);
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

      // Rolldown / Vite 6+ codeSplitting / advancedChunks support
      const isRolldown = Boolean((this as any)?.meta?.rolldownVersion);
      if (opts.codeSplitting !== undefined) {
        if (opts.codeSplitting === false) return opts;
        const existingGroups = Array.isArray(opts.codeSplitting?.groups)
          ? opts.codeSplitting.groups
          : [];
        return {
          ...opts,
          codeSplitting: {
            ...opts.codeSplitting,
            groups: [...existingGroups, ...createSniceAdvancedChunksGroups(cachingOptions)],
          },
        };
      }
      if (opts.advancedChunks !== undefined || (isRolldown && !opts.manualChunks)) {
        if (opts.advancedChunks === false) return opts;
        const existingGroups = Array.isArray(opts.advancedChunks?.groups)
          ? opts.advancedChunks.groups
          : [];
        return {
          ...opts,
          advancedChunks: {
            ...(typeof opts.advancedChunks === 'object' && opts.advancedChunks !== null
              ? opts.advancedChunks
              : {}),
            groups: [...existingGroups, ...createSniceAdvancedChunksGroups(cachingOptions)],
          },
        };
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

    generateBundle: {
      order: 'post' as const,
      handler(_outputOptions: Record<string, any>, bundle: Record<string, any>) {
        // 1. Strip allowlisted fallbacks in standalone non-theme CSS assets if active
        const allowlist = resolveEffectiveFallbackAllowlist();
        const themeAssetNames: string[] = [];

        for (const [fileName, item] of Object.entries(bundle)) {
          if (item.type !== 'asset' || !fileName.endsWith('.css')) continue;
          let cssText = typeof item.source === 'string'
            ? item.source
            : Buffer.from(item.source).toString('utf8');

          let currentFileName = fileName;
          const reconciled = reconcileAutoInjectedPlatformCss(
            cssText,
            explicitPlatformThemeImported
          );
          if (reconciled !== cssText) {
            currentFileName = rehashBundleAsset(bundle, currentFileName, reconciled);
            cssText = reconciled;
          }

          if (isThemeCssAsset(currentFileName, cssText)) {
            themeAssetNames.push(currentFileName);
            continue;
          }

          if (allowlist) {
            const stripped = stripVarFallbacks(cssText, allowlist);
            if (stripped !== cssText) {
              rehashBundleAsset(bundle, currentFileName, stripped);
            }
          }
        }

        // 2. Optional theme feature-block pruning (`theme: { dark, density, motion, print }`)
        //    followed by opt-in transitive token pruning (`theme.prune` / `pruneTheme`).
        //    Re-hashes emitted asset & updates references cleanly; preserves custom [data-theme="..."] blocks.
        const themeOpts = options.theme;
        const hasFeaturePruning = Boolean(
          themeOpts &&
            (themeOpts.dark === false ||
              themeOpts.dark === 'auto' ||
              themeOpts.dark === 'manual' ||
              themeOpts.density === false ||
              themeOpts.motion === false ||
              themeOpts.print === false)
        );
        const shouldPruneTokens = (themeOpts?.prune ?? options.pruneTheme) === true;
        const mergedSafelist = [
          ...(options.themeSafelist ?? []),
          ...(themeOpts?.safelist ?? []),
        ];

        if ((hasFeaturePruning || shouldPruneTokens) && !runtimeEnv.isDev && themeAssetNames.length > 0) {
          const referencedTokens = new Set<string>();
          const dynamicPrefixes = new Set<string>();

          if (shouldPruneTokens) {
            const themeSet = new Set(themeAssetNames);
            for (const [fileName, item] of Object.entries(bundle)) {
              if (themeSet.has(fileName)) continue;
              if (item.type === 'chunk' && typeof item.code === 'string') {
                collectReferencedSniceTokens(item.code, referencedTokens, dynamicPrefixes);
              } else if (item.type === 'asset') {
                const src = typeof item.source === 'string'
                  ? item.source
                  : Buffer.from(item.source).toString('utf8');
                collectReferencedSniceTokens(src, referencedTokens, dynamicPrefixes);
              }
            }
          }

          for (const themeFile of themeAssetNames) {
            const asset = bundle[themeFile];
            if (!asset) continue;
            const cssText = typeof asset.source === 'string'
              ? asset.source
              : Buffer.from(asset.source).toString('utf8');
            let nextCss = cssText;
            if (hasFeaturePruning && themeOpts) {
              nextCss = pruneThemeFeatureBlocks(nextCss, themeOpts);
            }
            if (shouldPruneTokens) {
              nextCss = pruneThemeCss(
                nextCss,
                referencedTokens,
                dynamicPrefixes,
                mergedSafelist
              );
            }
            if (nextCss !== cssText) {
              rehashBundleAsset(bundle, themeFile, nextCss);
            }
          }
        }

        // 3. Emit build tier report after all CSS/theme mutations have settled
        if (!options.report) return;
        const reportOpts =
          typeof options.report === 'object' ? options.report : undefined;
        const report = buildBundleReport(bundle, reportOpts);

        if (typeof options.report === 'function') {
          options.report(report);
        } else if (reportOpts) {
          reportOpts.onReport?.(report);
          if (reportOpts.print ?? !reportOpts.onReport) {
            console.log(formatBuildReport(report));
          }
          if (
            reportOpts.failOnBudget !== false &&
            report.budgetViolations &&
            report.budgetViolations.length > 0
          ) {
            const summary = report.budgetViolations
              .map(
                (v) =>
                  `${v.target} (${v.metric}): ${v.actual} B > ${v.limit} B`
              )
              .join('; ');
            throw new Error(`snice plugin: bundle size budget exceeded — ${summary}`);
          }
        } else {
          console.log(formatBuildReport(report));
        }
      },
    },
  };
}
