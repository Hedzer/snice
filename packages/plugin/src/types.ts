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
  /** Isolate statically reachable third-party node_modules into a `vendor` tier (default true). */
  vendor?: boolean;
  /**
   * Optional named component groups so subsets of Snice components stay in dedicated
   * cache chunks (e.g. `{ forms: ['input', 'select', 'checkbox'] }` -> `snice-forms-[hash].js`).
   */
  componentGroups?: Record<string, string[]>;
}

export type SniceChunkTier =
  | 'snice-runtime'
  | 'vendor-react'
  | 'vendor'
  | 'snice-theme'
  | 'snice-components'
  | 'snice-heavy'
  | 'app';

export interface SniceChunkReport {
  tier: SniceChunkTier;
  fileName: string;
  rawBytes: number;
  gzipBytes: number;
  brotliBytes: number;
  contentHash: string;
  cacheStatus?: 'STABLE' | 'CHANGED' | 'NEW';
}

export interface SniceBudgetRule {
  raw?: number;
  gzip?: number;
  brotli?: number;
}

export interface SniceBudgetViolation {
  target: string;
  metric: 'raw' | 'gzip' | 'brotli';
  actual: number;
  limit: number;
}

export interface SniceCacheDiffSummary {
  stable: number;
  changed: number;
  added: number;
  removed: string[];
}

export interface SniceReportOptions {
  /** Print formatted report to stdout (default true when onReport is omitted). */
  print?: boolean;
  /** Path to a previous build manifest JSON to compute STABLE vs CHANGED cache-hash diff. */
  compareWith?: string;
  /** Path to write the current build manifest JSON for future comparisons. */
  writeManifest?: string;
  /** Size budgets (in bytes) keyed by 'total', tier name, or chunk filename prefix. */
  budgets?: Record<string, SniceBudgetRule | undefined>;
  /** Throw a build error when any budget is exceeded (default true). */
  failOnBudget?: boolean;
  /** Optional callback receiving the structured build report. */
  onReport?: (report: SniceBuildReport) => void;
}

export interface SniceBuildReport {
  chunks: SniceChunkReport[];
  totalRawBytes: number;
  totalGzipBytes: number;
  totalBrotliBytes: number;
  cacheDiff?: SniceCacheDiffSummary;
  budgetViolations?: SniceBudgetViolation[];
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
  /** Emit build tier size report, cache-hash diff, and optional budgets (default false). */
  report?: boolean | ((report: SniceBuildReport) => void) | SniceReportOptions;
  /** Dev-server HMR for `@element` classes in Vite serve mode (default true in dev serve; 0 bytes in production). */
  hmr?: boolean;
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
  assertBooleanOrUndefined(opts.hmr, 'hmr');
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
    assertBooleanOrUndefined(caching.vendor, 'caching.vendor');
    if (
      caching.isolateComponents !== undefined &&
      (!Array.isArray(caching.isolateComponents) ||
        !caching.isolateComponents.every((c) => typeof c === 'string'))
    ) {
      throw new TypeError('snice plugin: "caching.isolateComponents" must be an array of strings.');
    }
    if (caching.componentGroups !== undefined) {
      if (
        typeof caching.componentGroups !== 'object' ||
        caching.componentGroups === null ||
        Array.isArray(caching.componentGroups)
      ) {
        throw new TypeError('snice plugin: "caching.componentGroups" must be a Record<string, string[]>.');
      }
      for (const [group, members] of Object.entries(caching.componentGroups as Record<string, unknown>)) {
        if (!Array.isArray(members) || !members.every((m) => typeof m === 'string')) {
          throw new TypeError(
            `snice plugin: "caching.componentGroups.${group}" must be an array of component names.`
          );
        }
      }
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
    if (typeof opts.report !== 'object' || opts.report === null || Array.isArray(opts.report)) {
      throw new TypeError('snice plugin: "report" must be a boolean, callback function, or SniceReportOptions object.');
    }
    const rep = opts.report as Record<string, unknown>;
    assertBooleanOrUndefined(rep.print, 'report.print');
    assertBooleanOrUndefined(rep.failOnBudget, 'report.failOnBudget');
    if (rep.compareWith !== undefined && typeof rep.compareWith !== 'string') {
      throw new TypeError('snice plugin: "report.compareWith" must be a file path string.');
    }
    if (rep.writeManifest !== undefined && typeof rep.writeManifest !== 'string') {
      throw new TypeError('snice plugin: "report.writeManifest" must be a file path string.');
    }
    if (rep.onReport !== undefined && typeof rep.onReport !== 'function') {
      throw new TypeError('snice plugin: "report.onReport" must be a function.');
    }
    if (rep.budgets !== undefined && (typeof rep.budgets !== 'object' || rep.budgets === null || Array.isArray(rep.budgets))) {
      throw new TypeError('snice plugin: "report.budgets" must be an object mapping tier/target names to budget rules.');
    }
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
