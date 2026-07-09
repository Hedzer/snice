#!/usr/bin/env node
/**
 * CDN bundle size report.
 *
 *   node scripts/size-report.js --baseline   # snapshot current sizes to .size-baseline.json
 *   node scripts/size-report.js              # markdown table: baseline vs current, with deltas
 *
 * Measures raw and gzip bytes of every dist/cdn <name>/snice-<name>.min.js
 * (IIFE, the file served from cdn.snice.dev) plus the shared runtime.
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CDN_DIR = path.join(ROOT, 'dist', 'cdn');
const BASELINE_FILE = path.join(ROOT, '.size-baseline.json');

function collect() {
  const out = {};
  for (const dir of fs.readdirSync(CDN_DIR).sort()) {
    const full = path.join(CDN_DIR, dir);
    if (!fs.statSync(full).isDirectory()) continue;
    const file = path.join(full, `snice-${dir}.min.js`);
    if (!fs.existsSync(file)) continue;
    const buf = fs.readFileSync(file);
    out[dir] = { raw: buf.length, gzip: zlib.gzipSync(buf, { level: 9 }).length };
  }
  return out;
}

function fmt(n) {
  return n.toLocaleString('en-US');
}

function pct(before, after) {
  if (!before) return '—';
  const d = ((after - before) / before) * 100;
  return `${d > 0 ? '+' : ''}${d.toFixed(1)}%`;
}

const current = collect();

if (process.argv.includes('--baseline')) {
  fs.writeFileSync(BASELINE_FILE, JSON.stringify({ date: new Date().toISOString(), sizes: current }, null, 2));
  const totalRaw = Object.values(current).reduce((s, v) => s + v.raw, 0);
  const totalGz = Object.values(current).reduce((s, v) => s + v.gzip, 0);
  console.log(`Baseline written: ${Object.keys(current).length} bundles, total raw ${fmt(totalRaw)} B, gzip ${fmt(totalGz)} B`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE_FILE)) {
  console.error('No .size-baseline.json — run with --baseline first.');
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')).sizes;
const names = [...new Set([...Object.keys(baseline), ...Object.keys(current)])].sort();

let bRaw = 0, cRaw = 0, bGz = 0, cGz = 0;
const rows = [];
for (const name of names) {
  const b = baseline[name];
  const c = current[name];
  if (b) { bRaw += b.raw; bGz += b.gzip; }
  if (c) { cRaw += c.raw; cGz += c.gzip; }
  rows.push({
    name,
    bRaw: b ? b.raw : 0,
    cRaw: c ? c.raw : 0,
  });
}

// sort by biggest current raw, show all
rows.sort((a, z) => z.cRaw - a.cRaw);

console.log('| bundle | baseline raw | current raw | Δ raw |');
console.log('|--------|-------------:|------------:|------:|');
for (const r of rows) {
  console.log(`| ${r.name} | ${fmt(r.bRaw)} | ${fmt(r.cRaw)} | ${pct(r.bRaw, r.cRaw)} |`);
}
console.log(`| **TOTAL** | **${fmt(bRaw)}** | **${fmt(cRaw)}** | **${pct(bRaw, cRaw)}** |`);
console.log(`\nGzip total: baseline ${fmt(bGz)} B → current ${fmt(cGz)} B (${pct(bGz, cGz)})`);
