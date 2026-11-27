import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import type {
  SniceBudgetRule,
  SniceBudgetViolation,
  SniceBuildReport,
  SniceCacheDiffSummary,
  SniceChunkReport,
  SniceChunkTier,
  SniceReportOptions,
} from './types';

function classifyReportTier(fileName: string): SniceChunkTier {
  const base = fileName.replace(/\\/g, '/').split('/').pop() || fileName;
  if (/^snice-runtime(?:[-.]|$)/.test(base)) return 'snice-runtime';
  if (/^vendor-react(?:[-.]|$)/.test(base)) return 'vendor-react';
  if (/^vendor(?:[-.]|$)/.test(base)) return 'vendor';
  if (/^snice-theme(?:[-.]|$)/.test(base)) return 'snice-theme';
  if (/^snice-components(?:[-.]|$)/.test(base)) return 'snice-components';
  if (/^snice-[a-z0-9-]+(?:[-.]|$)/.test(base)) return 'snice-heavy';
  return 'app';
}

/**
 * Normalize a content-hashed chunk/asset filename (e.g. `assets/snice-runtime-Ab12Cd34.js`)
 * to its stable logical key (`assets/snice-runtime.js`) for cross-build cache diffing.
 */
export function logicalChunkKey(fileName: string, bundleItem?: any): string {
  const norm = fileName.replace(/\\/g, '/');
  const slashIdx = norm.lastIndexOf('/');
  const dir = slashIdx >= 0 ? norm.slice(0, slashIdx + 1) : '';
  const base = slashIdx >= 0 ? norm.slice(slashIdx + 1) : norm;
  const dotIdx = base.lastIndexOf('.');
  const ext = dotIdx >= 0 ? base.slice(dotIdx) : '';

  if (bundleItem?.type === 'chunk' && typeof bundleItem.name === 'string' && bundleItem.name) {
    return `${dir}${bundleItem.name}${ext}`;
  }
  if (bundleItem?.type === 'asset' && typeof bundleItem.name === 'string' && bundleItem.name) {
    const assetBase = bundleItem.name.replace(/\\/g, '/').split('/').pop() || bundleItem.name;
    return `${dir}${assetBase}`;
  }
  // Fallback: strip a trailing 8-char content hash (`name-Ab12Cd34.ext`) without eating hyphenated prefixes
  const stem = dotIdx >= 0 ? base.slice(0, dotIdx) : base;
  const stripped = stem.replace(/-[A-Za-z0-9_-]{8}$/, '');
  return `${dir}${stripped}${ext}`;
}

export interface SniceReportManifestEntry {
  fileName: string;
  tier: SniceChunkTier;
  contentHash: string;
  rawBytes: number;
  gzipBytes: number;
  brotliBytes: number;
}

export interface SniceReportManifest {
  version: 1;
  chunks: Record<string, SniceReportManifestEntry>;
}

export function buildBundleReport(
  bundle: Record<string, any>,
  options?: SniceReportOptions
): SniceBuildReport {
  const chunks: SniceChunkReport[] = [];
  let totalRawBytes = 0;
  let totalGzipBytes = 0;
  let totalBrotliBytes = 0;

  const logicalKeyByFile = new Map<string, string>();
  for (const [fileName, item] of Object.entries(bundle)) {
    if (fileName.endsWith('.map')) continue;
    let buf: Buffer | null = null;
    if (item.type === 'chunk' && typeof item.code === 'string') {
      buf = Buffer.from(item.code, 'utf8');
    } else if (item.type === 'asset' && item.source !== undefined) {
      buf = typeof item.source === 'string'
        ? Buffer.from(item.source, 'utf8')
        : Buffer.from(item.source);
    }
    if (!buf) continue;

    logicalKeyByFile.set(fileName, logicalChunkKey(fileName, item));
    const rawBytes = buf.length;
    const gzipBytes = gzipSync(buf).length;
    const brotliBytes = brotliCompressSync(buf).length;
    const contentHash = createHash('sha256').update(buf).digest('hex').slice(0, 12);

    totalRawBytes += rawBytes;
    totalGzipBytes += gzipBytes;
    totalBrotliBytes += brotliBytes;
    chunks.push({
      tier: classifyReportTier(fileName),
      fileName,
      rawBytes,
      gzipBytes,
      brotliBytes,
      contentHash,
    });
  }

  chunks.sort((a, b) => a.fileName.localeCompare(b.fileName));

  // Optional previous-build manifest cache-hash diffing
  let cacheDiff: SniceCacheDiffSummary | undefined;
  if (options?.compareWith && existsSync(options.compareWith)) {
    try {
      const prev = JSON.parse(readFileSync(options.compareWith, 'utf8')) as SniceReportManifest;
      if (prev && prev.chunks && typeof prev.chunks === 'object') {
        const seenKeys = new Set<string>();
        let stable = 0;
        let changed = 0;
        let added = 0;

        for (const chunk of chunks) {
          const key = logicalKeyByFile.get(chunk.fileName) ?? logicalChunkKey(chunk.fileName);
          seenKeys.add(key);
          const prevEntry = prev.chunks[key];
          if (!prevEntry) {
            chunk.cacheStatus = 'NEW';
            added++;
          } else if (prevEntry.contentHash === chunk.contentHash && prevEntry.fileName === chunk.fileName) {
            chunk.cacheStatus = 'STABLE';
            stable++;
          } else {
            chunk.cacheStatus = 'CHANGED';
            changed++;
          }
        }

        const removed = Object.keys(prev.chunks)
          .filter((k) => !seenKeys.has(k))
          .sort();
        cacheDiff = { stable, changed, added, removed };
      }
    } catch {
      // Ignore corrupt/unreadable previous manifest
    }
  }

  // Optional manifest persistence for next build's comparison
  if (options?.writeManifest) {
    const manifest: SniceReportManifest = {
      version: 1,
      chunks: {},
    };
    for (const chunk of chunks) {
      const key = logicalKeyByFile.get(chunk.fileName) ?? logicalChunkKey(chunk.fileName);
      manifest.chunks[key] = {
        fileName: chunk.fileName,
        tier: chunk.tier,
        contentHash: chunk.contentHash,
        rawBytes: chunk.rawBytes,
        gzipBytes: chunk.gzipBytes,
        brotliBytes: chunk.brotliBytes,
      };
    }
    mkdirSync(dirname(options.writeManifest), { recursive: true });
    writeFileSync(options.writeManifest, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  }

  // Optional budget checks
  let budgetViolations: SniceBudgetViolation[] | undefined;
  if (options?.budgets) {
    budgetViolations = evaluateBudgets(
      { chunks, totalRawBytes, totalGzipBytes, totalBrotliBytes },
      options.budgets
    );
  }

  return {
    chunks,
    totalRawBytes,
    totalGzipBytes,
    totalBrotliBytes,
    ...(cacheDiff ? { cacheDiff } : {}),
    ...(budgetViolations ? { budgetViolations } : {}),
  };
}

function evaluateBudgets(
  totals: { chunks: SniceChunkReport[]; totalRawBytes: number; totalGzipBytes: number; totalBrotliBytes: number },
  budgets: Record<string, SniceBudgetRule | undefined>
): SniceBudgetViolation[] {
  const violations: SniceBudgetViolation[] = [];

  const checkRule = (
    target: string,
    actual: { raw: number; gzip: number; brotli: number },
    rule: SniceBudgetRule
  ) => {
    if (typeof rule.raw === 'number' && actual.raw > rule.raw) {
      violations.push({ target, metric: 'raw', actual: actual.raw, limit: rule.raw });
    }
    if (typeof rule.gzip === 'number' && actual.gzip > rule.gzip) {
      violations.push({ target, metric: 'gzip', actual: actual.gzip, limit: rule.gzip });
    }
    if (typeof rule.brotli === 'number' && actual.brotli > rule.brotli) {
      violations.push({ target, metric: 'brotli', actual: actual.brotli, limit: rule.brotli });
    }
  };

  for (const [target, rule] of Object.entries(budgets)) {
    if (!rule) continue;
    if (target === 'total') {
      checkRule(
        'total',
        { raw: totals.totalRawBytes, gzip: totals.totalGzipBytes, brotli: totals.totalBrotliBytes },
        rule
      );
      continue;
    }

    const matching = totals.chunks.filter((c) => {
      if (c.tier === target) return true;
      const base = c.fileName.replace(/\\/g, '/').split('/').pop() || c.fileName;
      return base === target || base.startsWith(`${target}-`) || base.startsWith(`${target}.`);
    });
    if (matching.length === 0) continue;

    const sum = matching.reduce(
      (acc, c) => ({
        raw: acc.raw + c.rawBytes,
        gzip: acc.gzip + c.gzipBytes,
        brotli: acc.brotli + c.brotliBytes,
      }),
      { raw: 0, gzip: 0, brotli: 0 }
    );
    checkRule(target, sum, rule);
  }

  return violations;
}

export function formatBuildReport(report: SniceBuildReport): string {
  const lines = ['[snice] Bundle report:'];
  for (const chunk of report.chunks) {
    const rawKb = (chunk.rawBytes / 1024).toFixed(2);
    const gzKb = (chunk.gzipBytes / 1024).toFixed(2);
    const brKb = (chunk.brotliBytes / 1024).toFixed(2);
    const status = chunk.cacheStatus ? ` [${chunk.cacheStatus}]` : '';
    lines.push(
      `  [${chunk.tier}]${status} ${chunk.fileName} — ${rawKb} kB (${gzKb} kB gzip / ${brKb} kB brotli)`
    );
  }
  lines.push(
    `  Total: ${(report.totalRawBytes / 1024).toFixed(2)} kB (` +
      `${(report.totalGzipBytes / 1024).toFixed(2)} kB gzip / ` +
      `${(report.totalBrotliBytes / 1024).toFixed(2)} kB brotli)`
  );
  if (report.cacheDiff) {
    const { stable, changed, added, removed } = report.cacheDiff;
    lines.push(
      `  Cache diff: ${stable} STABLE, ${changed} CHANGED, ${added} NEW` +
        (removed.length > 0 ? `, ${removed.length} REMOVED` : '')
    );
  }
  if (report.budgetViolations && report.budgetViolations.length > 0) {
    lines.push('  Budget violations:');
    for (const v of report.budgetViolations) {
      lines.push(
        `    - ${v.target} (${v.metric}): ${(v.actual / 1024).toFixed(2)} kB exceeds ${(v.limit / 1024).toFixed(2)} kB`
      );
    }
  }
  return lines.join('\n');
}
