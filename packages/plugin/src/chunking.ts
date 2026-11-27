import type { SniceCachingOptions } from './types';

export const DEFAULT_HEAVY_COMPONENTS: readonly string[] = [
  'table',
  'pdf-viewer',
  'qr-reader',
  'chart',
  'calendar',
  'code-block',
  'flow',
  'kanban',
];

export interface ManualChunkMeta {
  getModuleInfo: (id: string) => {
    isEntry?: boolean;
    importedIds?: readonly string[];
    dynamicallyImportedIds?: readonly string[];
  } | null;
  getModuleIds: () => IterableIterator<string>;
}

export type SniceManualChunksFn = (id: string, meta: ManualChunkMeta) => string | undefined;

export function normalizeModuleId(id: string): string {
  return id.replace(/\\/g, '/');
}

interface ResolvedCachingConfig {
  isolateHeavy: boolean;
  heavySet: Set<string>;
  vendor: boolean;
  componentGroupMap: Map<string, string>;
}

function resolveCachingConfig(options?: SniceCachingOptions): ResolvedCachingConfig {
  const isolateHeavy = options?.isolateHeavy !== false;
  const heavySet = isolateHeavy
    ? new Set([...(options?.replaceDefaults ? [] : DEFAULT_HEAVY_COMPONENTS), ...(options?.isolateComponents ?? [])])
    : new Set<string>();
  const vendor = options?.vendor !== false;
  const componentGroupMap = new Map<string, string>();
  if (options?.componentGroups) {
    for (const [groupName, members] of Object.entries(options.componentGroups)) {
      const normalizedGroup = groupName.startsWith('snice-') ? groupName : `snice-${groupName}`;
      for (const comp of members) {
        componentGroupMap.set(comp, normalizedGroup);
      }
    }
  }
  return { isolateHeavy, heavySet, vendor, componentGroupMap };
}

/**
 * Compute the set of modules statically reachable from entry points (following
 * only static `importedIds`, never `dynamicallyImportedIds`). Any module only
 * reachable through a dynamic `import()` stays out of all eager cache tiers.
 */
function computeStaticReachable(meta: ManualChunkMeta): Set<string> | null {
  if (!meta || typeof meta.getModuleIds !== 'function' || typeof meta.getModuleInfo !== 'function') {
    return null;
  }

  const reachable = new Set<string>();
  const queue: string[] = [];

  for (const modId of meta.getModuleIds()) {
    const info = meta.getModuleInfo(modId);
    if (info?.isEntry) {
      reachable.add(modId);
      queue.push(modId);
    }
  }

  if (queue.length === 0) return null;

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const info = meta.getModuleInfo(current);
    if (!info?.importedIds) continue;
    for (const dep of info.importedIds) {
      if (!reachable.has(dep)) {
        reachable.add(dep);
        queue.push(dep);
      }
    }
  }

  return reachable;
}

/**
 * Classify a statically reachable module ID into its deterministic cache tier.
 */
export function classifyModuleTier(
  rawId: string,
  isolateHeavy: boolean,
  heavySet: ReadonlySet<string>,
  vendor = true,
  componentGroupMap?: ReadonlyMap<string, string>
): string | undefined {
  if (!rawId || rawId.startsWith('\0')) return undefined;

  const normalized = normalizeModuleId(rawId);
  const queryIdx = normalized.indexOf('?');
  const cleanPath = queryIdx >= 0 ? normalized.slice(0, queryIdx) : normalized;
  const query = queryIdx >= 0 ? normalized.slice(queryIdx) : '';
  const isInlineQuery = query.includes('inline');

  // Tier 3: snice-theme (standalone theme/*.css stylesheets)
  if (
    !isInlineQuery &&
    /(?:^|\/)(?:snice\/dist\/components|packages\/components\/src)\/theme\/[^/]+\.css$/.test(cleanPath)
  ) {
    return 'snice-theme';
  }

  // Tier 1: snice-runtime (core framework + tslib + pica-route)
  if (
    /(?:^|\/)snice\/dist\/(?:index\.esm\.js$|_core\/|symbols(?:\.esm)?\.js$|transitions(?:\.esm)?\.js$)/.test(cleanPath) ||
    /(?:^|\/)packages\/core\/src\//.test(cleanPath) ||
    /(?:^|\/)node_modules\/(?:tslib|pica-route)\//.test(cleanPath)
  ) {
    return 'snice-runtime';
  }

  // Tier 2a: vendor-react (React runtime packages)
  if (/(?:^|\/)node_modules\/(?:react|react-dom|scheduler)\//.test(cleanPath)) {
    return 'vendor-react';
  }

  // Tier 4: snice-components, user component groups, and isolated heavy standalone families
  const hasGroups = Boolean(componentGroupMap && componentGroupMap.size > 0);
  const sharedCompChunk = hasGroups ? 'snice-shared' : 'snice-components';

  const compMatch = /(?:^|\/)(?:snice\/dist\/components|packages\/components\/src)\/([^/]+)\//.exec(cleanPath);
  if (compMatch) {
    const dir = compMatch[1];
    if (dir === 'icons') {
      return sharedCompChunk;
    }
    const grouped = componentGroupMap?.get(dir);
    if (grouped) {
      return grouped;
    }
    if (isolateHeavy && heavySet.has(dir)) {
      return `snice-${dir}`;
    }
    return 'snice-components';
  }

  // Shared top-level component helpers (utils.js, theme-utils.js, transitions.js, etc.)
  if (/(?:^|\/)(?:snice\/dist\/components|packages\/components\/src)\/[^/]+\.(?:js|ts|mjs)$/.test(cleanPath)) {
    return sharedCompChunk;
  }

  // Snice React adapters / dist/react stay with snice-components (not generic vendor)
  if (/(?:^|\/)snice\/(?:adapters\/react|dist\/react)\//.test(cleanPath)) {
    return 'snice-components';
  }

  // Tier 2b: vendor (statically reachable third-party node_modules packages)
  if (vendor && /(?:^|\/)node_modules\//.test(cleanPath) && !/(?:^|\/)node_modules\/snice\//.test(cleanPath)) {
    return 'vendor';
  }

  return undefined;
}

export interface SniceManualChunksController {
  manualChunks: SniceManualChunksFn;
  reset: () => void;
}

export function createSniceManualChunksController(
  options?: SniceCachingOptions
): SniceManualChunksController {
  const { isolateHeavy, heavySet, vendor, componentGroupMap } = resolveCachingConfig(options);
  let cachedReachable: Set<string> | null | undefined = undefined;

  const manualChunks: SniceManualChunksFn = (id, meta) => {
    if (cachedReachable === undefined) {
      cachedReachable = computeStaticReachable(meta);
    }
    if (cachedReachable !== null && !cachedReachable.has(id)) {
      return undefined;
    }
    return classifyModuleTier(id, isolateHeavy, heavySet, vendor, componentGroupMap);
  };

  return {
    manualChunks,
    reset() {
      cachedReachable = undefined;
    },
  };
}

/**
 * Create a standalone composable Rollup `manualChunks` function implementing
 * Snice's deterministic volatility-tiered caching strategy.
 */
export function createSniceManualChunks(options?: SniceCachingOptions): SniceManualChunksFn {
  const { isolateHeavy, heavySet, vendor, componentGroupMap } = resolveCachingConfig(options);
  const reachableByMeta = new WeakMap<object, Set<string> | null>();

  return (id, meta) => {
    let reachable: Set<string> | null = null;
    if (meta && typeof meta === 'object') {
      if (reachableByMeta.has(meta)) {
        reachable = reachableByMeta.get(meta)!;
      } else {
        reachable = computeStaticReachable(meta);
        reachableByMeta.set(meta, reachable);
      }
    }
    if (reachable !== null && !reachable.has(id)) {
      return undefined;
    }
    return classifyModuleTier(id, isolateHeavy, heavySet, vendor, componentGroupMap);
  };
}

/**
 * Rolldown `advancedChunks.groups` / `codeSplitting.groups` entry shape.
 */
export interface RolldownChunkGroup {
  name: string;
  priority: number;
  test: (id: string) => boolean;
}

/**
 * Create Rolldown-compatible `advancedChunks.groups` / `codeSplitting.groups`
 * implementing Snice's deterministic volatility-tiered caching strategy for
 * Vite 6+ / Rolldown builds.
 */
export function createSniceAdvancedChunksGroups(
  options?: SniceCachingOptions
): RolldownChunkGroup[] {
  const { isolateHeavy, heavySet, vendor, componentGroupMap } = resolveCachingConfig(options);
  const groups: RolldownChunkGroup[] = [];

  const matchTier = (expectedTier: string) => (id: string): boolean =>
    classifyModuleTier(id, isolateHeavy, heavySet, vendor, componentGroupMap) === expectedTier;

  groups.push({ name: 'snice-theme', priority: 60, test: matchTier('snice-theme') });
  groups.push({ name: 'snice-runtime', priority: 50, test: matchTier('snice-runtime') });
  groups.push({ name: 'vendor-react', priority: 45, test: matchTier('vendor-react') });

  const emittedGroups = new Set<string>();
  for (const groupName of componentGroupMap.values()) {
    if (emittedGroups.has(groupName)) continue;
    emittedGroups.add(groupName);
    groups.push({ name: groupName, priority: 40, test: matchTier(groupName) });
  }

  if (componentGroupMap.size > 0) {
    groups.push({ name: 'snice-shared', priority: 38, test: matchTier('snice-shared') });
  }

  if (isolateHeavy) {
    for (const dir of heavySet) {
      const heavyName = `snice-${dir}`;
      if (emittedGroups.has(heavyName)) continue;
      groups.push({ name: heavyName, priority: 35, test: matchTier(heavyName) });
    }
  }

  groups.push({ name: 'snice-components', priority: 25, test: matchTier('snice-components') });

  if (vendor) {
    groups.push({ name: 'vendor', priority: 10, test: matchTier('vendor') });
  }

  return groups;
}

/**
 * Compose a Rollup object-form `manualChunks` map (`{ vendor: ['lodash'] }`)
 * with Snice's chunk classifier, preserving all user object assignments first.
 */
export function composeObjectManualChunks(
  userMap: Record<string, string[]>,
  fallback: SniceManualChunksFn
): SniceManualChunksFn {
  const entries = Object.entries(userMap).map(([chunkName, patterns]) => ({
    chunkName,
    patterns: patterns.map((p) => normalizeModuleId(p)),
  }));

  return (id, meta) => {
    const normalized = normalizeModuleId(id);
    const cleanPath = normalized.split('?')[0];

    for (const { chunkName, patterns } of entries) {
      for (const pattern of patterns) {
        if (cleanPath === pattern) return chunkName;
        const stripped = pattern.replace(/^\.\//, '');
        if (cleanPath.endsWith(`/${stripped}`)) return chunkName;
        if (!pattern.startsWith('.') && !pattern.startsWith('/')) {
          // Bare package or subpath specifier (e.g., 'lodash' or 'snice/symbols')
          if (
            cleanPath.includes(`/node_modules/${pattern}/`) ||
            cleanPath.endsWith(`/node_modules/${pattern}.js`) ||
            cleanPath.endsWith(`/node_modules/${pattern}/index.js`)
          ) {
            return chunkName;
          }
        }
      }
    }

    return fallback(id, meta);
  };
}
