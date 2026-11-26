import { gzipSync } from 'node:zlib';
import type { SniceBuildReport, SniceChunkReport } from './types';

function classifyReportTier(fileName: string): SniceChunkReport['tier'] {
  const base = fileName.replace(/\\/g, '/').split('/').pop() || fileName;
  if (/^snice-runtime(?:[-.]|$)/.test(base)) return 'snice-runtime';
  if (/^vendor-react(?:[-.]|$)/.test(base)) return 'vendor-react';
  if (/^snice-theme(?:[-.]|$)/.test(base)) return 'snice-theme';
  if (/^snice-components(?:[-.]|$)/.test(base)) return 'snice-components';
  if (/^snice-[a-z0-9-]+(?:[-.]|$)/.test(base)) return 'snice-heavy';
  return 'app';
}

export function buildBundleReport(bundle: Record<string, any>): SniceBuildReport {
  const chunks: SniceChunkReport[] = [];
  let totalRawBytes = 0;
  let totalGzipBytes = 0;

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

    const rawBytes = buf.length;
    const gzipBytes = gzipSync(buf).length;
    totalRawBytes += rawBytes;
    totalGzipBytes += gzipBytes;
    chunks.push({
      tier: classifyReportTier(fileName),
      fileName,
      rawBytes,
      gzipBytes,
    });
  }

  chunks.sort((a, b) => a.fileName.localeCompare(b.fileName));
  return { chunks, totalRawBytes, totalGzipBytes };
}

export function formatBuildReport(report: SniceBuildReport): string {
  const lines = ['[snice] Bundle report:'];
  for (const chunk of report.chunks) {
    const rawKb = (chunk.rawBytes / 1024).toFixed(2);
    const gzKb = (chunk.gzipBytes / 1024).toFixed(2);
    lines.push(`  [${chunk.tier}] ${chunk.fileName} — ${rawKb} kB (${gzKb} kB gzip)`);
  }
  lines.push(
    `  Total: ${(report.totalRawBytes / 1024).toFixed(2)} kB (${(report.totalGzipBytes / 1024).toFixed(2)} kB gzip)`
  );
  return lines.join('\n');
}
