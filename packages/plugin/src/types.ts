export interface SniceCachingOptions {
  /** Isolate heavy standalone component families into named chunks (default true). */
  isolateHeavy?: boolean;
  /**
   * Additional or override component directory names to isolate into `snice-<name>` chunks.
   * Default list: ['table', 'pdf-viewer', 'qr-reader', 'chart', 'calendar', 'code-block', 'flow', 'kanban'].
   * When provided, replaces the default list if `replaceDefaults: true`, otherwise merges with defaults.
   */
  isolateComponents?: string[];
  /** Replace default isolated heavy component list instead of merging (default false). */
  replaceDefaults?: boolean;
}

export interface SniceChunkReport {
  tier: 'snice-runtime' | 'vendor-react' | 'snice-theme' | 'snice-components' | 'snice-heavy' | 'app';
  fileName: string;
  rawBytes: number;
  gzipBytes: number;
}

export interface SniceBuildReport {
  chunks: SniceChunkReport[];
  totalRawBytes: number;
  totalGzipBytes: number;
}

export interface SniceTableOptions {
  cells?: string[];
  features?: string[];
}

export type SniceTableOption = false | 'auto' | SniceTableOptions;

export interface SnicePluginOptions {
  /** Build-time Snice decorator lowering + TC39 2022-03 fallback (BS-06, default true). */
  decorators?: boolean;
  /** Build-time html``/svg`` whitespace & comment minification (BS-07, default true in prod, false in dev). */
  minifyTemplates?: boolean;
  /** Opt-in build-time pre-compiled template descriptors (BS-07, default false). */
  precompileTemplates?: boolean;
  /** Build-time inline css`` minification (BS-08, default true in prod, false in dev). */
  minifyCss?: boolean;
  /** Allowlisted var(--snice-*, fallback) stripping (BS-08, default 'auto'). */
  stripCssFallbacks?: 'auto' | boolean;
  /** Opt-in unused theme.css token pruning (BS-08, default false). */
  pruneTheme?: boolean;
  /** Token names or patterns kept when pruneTheme is true (BS-08, default []). */
  themeSafelist?: (string | RegExp)[];
  /** Dev diagnostics flag: sets __SNICE_DEV__ (default: true in Vite serve/Vitest, false in prod builds; 'preserve' leaves __SNICE_DEV__ untouched for library builds). */
  dev?: boolean | 'preserve';
  /** Deterministic volatility-tiered caching chunks (default true for code-splitting builds). */
  caching?: boolean | SniceCachingOptions;
  /** Default Vite build.target when user has not set build.target (default 'es2022'; false disables). */
  target?: string | false;
  /** Emit build tier size report (default false). */
  report?: boolean | ((report: SniceBuildReport) => void);
  /** Optional snice-table cell/feature stripping: explicit allowlist, 'auto' conservative static detection, or false to disable. */
  table?: SniceTableOption;
}

function assertBooleanOrUndefined(value: unknown, name: string): void {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new TypeError(`snice plugin: "${name}" must be a boolean, received ${typeof value}.`);
  }
}

export function validateOptions(options: unknown): SnicePluginOptions {
  if (options === undefined || options === null) return {};
  if (typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError(`snice plugin: options must be an object, received ${typeof options}.`);
  }

  const opts = options as Record<string, unknown>;
  assertBooleanOrUndefined(opts.decorators, 'decorators');
  assertBooleanOrUndefined(opts.minifyTemplates, 'minifyTemplates');
  assertBooleanOrUndefined(opts.precompileTemplates, 'precompileTemplates');
  assertBooleanOrUndefined(opts.minifyCss, 'minifyCss');
  assertBooleanOrUndefined(opts.pruneTheme, 'pruneTheme');
  if (opts.dev !== undefined && typeof opts.dev !== 'boolean' && opts.dev !== 'preserve') {
    throw new TypeError(`snice plugin: "dev" must be a boolean or "preserve", received ${typeof opts.dev}.`);
  }

  if (
    opts.stripCssFallbacks !== undefined &&
    opts.stripCssFallbacks !== 'auto' &&
    typeof opts.stripCssFallbacks !== 'boolean'
  ) {
    throw new TypeError(
      `snice plugin: "stripCssFallbacks" must be "auto" or a boolean, received ${JSON.stringify(opts.stripCssFallbacks)}.`
    );
  }

  if (opts.themeSafelist !== undefined) {
    if (
      !Array.isArray(opts.themeSafelist) ||
      !opts.themeSafelist.every((item) => typeof item === 'string' || item instanceof RegExp)
    ) {
      throw new TypeError('snice plugin: "themeSafelist" must be an array of strings or RegExp.');
    }
  }

  if (opts.caching !== undefined && typeof opts.caching !== 'boolean') {
    if (typeof opts.caching !== 'object' || opts.caching === null || Array.isArray(opts.caching)) {
      throw new TypeError('snice plugin: "caching" must be a boolean or a SniceCachingOptions object.');
    }
    const caching = opts.caching as Record<string, unknown>;
    assertBooleanOrUndefined(caching.isolateHeavy, 'caching.isolateHeavy');
    assertBooleanOrUndefined(caching.replaceDefaults, 'caching.replaceDefaults');
    if (
      caching.isolateComponents !== undefined &&
      (!Array.isArray(caching.isolateComponents) ||
        !caching.isolateComponents.every((c) => typeof c === 'string'))
    ) {
      throw new TypeError('snice plugin: "caching.isolateComponents" must be an array of strings.');
    }
  }

  if (opts.target !== undefined && opts.target !== false && typeof opts.target !== 'string') {
    throw new TypeError('snice plugin: "target" must be a string or false.');
  }

  if (
    opts.report !== undefined &&
    typeof opts.report !== 'boolean' &&
    typeof opts.report !== 'function'
  ) {
    throw new TypeError('snice plugin: "report" must be a boolean or a callback function.');
  }

  if (opts.table !== undefined && opts.table !== false && opts.table !== 'auto') {
    if (typeof opts.table !== 'object' || opts.table === null || Array.isArray(opts.table)) {
      throw new TypeError(
        'snice plugin: "table" must be false, "auto", or an object with optional "cells" and "features" arrays.'
      );
    }
    const table = opts.table as Record<string, unknown>;
    if (
      table.cells !== undefined &&
      (!Array.isArray(table.cells) || !table.cells.every((c) => typeof c === 'string'))
    ) {
      throw new TypeError('snice plugin: "table.cells" must be an array of strings.');
    }
    if (
      table.features !== undefined &&
      (!Array.isArray(table.features) || !table.features.every((f) => typeof f === 'string'))
    ) {
      throw new TypeError('snice plugin: "table.features" must be an array of strings.');
    }
  }

  return opts as SnicePluginOptions;
}
