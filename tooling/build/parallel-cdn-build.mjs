#!/usr/bin/env node
/**
 * Parallel CDN build with a skip-unchanged cache.
 *
 * The shared runtime builds first, then components fan out across worker
 * threads running the same createCdnBuild() configs through the rollup API.
 *
 * Cache: a manifest maps each component to the content hashes of its full
 * resolved input closure (every file rollup pulled into the bundle, so
 * cross-component imports are covered transitively) plus its output files.
 * A component is skipped only when every closure file is unchanged AND all
 * of its outputs still exist; anything else rebuilds. The manifest lives in
 * node_modules/.cache so wiping dist/ just causes a clean rebuild.
 */
import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { rollup } from 'rollup';
import { buildCdnRuntime, discoverComponents } from '../../rollup.config.cdn.js';

const start = Date.now();
const workerScript = path.join(path.dirname(fileURLToPath(import.meta.url)), 'cdn-build-worker.mjs');
const manifestPath = 'node_modules/.cache/snice-cdn-build-manifest.json';

function hashFile(file) {
  try {
    return createHash('sha1').update(fs.readFileSync(file)).digest('hex');
  } catch {
    return null;
  }
}

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    return {};
  }
}

function isCurrent(entry) {
  if (!entry?.inputs || !entry?.outputs) return false;
  if (!entry.outputs.every(file => fs.existsSync(file))) return false;
  return Object.entries(entry.inputs).every(([file, hash]) => hashFile(file) === hash);
}

function toEntry({ inputFiles, outputFiles }) {
  const inputs = {};
  for (const file of inputFiles) {
    const hash = hashFile(file);
    if (hash) inputs[file] = hash;
  }
  return { inputs, outputs: outputFiles };
}

const manifest = loadManifest();

// Shared runtime — same skip rules, keyed separately from components.
if (!isCurrent(manifest['//runtime'])) {
  const inputFiles = new Set();
  const outputFiles = [];
  for (const config of buildCdnRuntime()) {
    const bundle = await rollup({
      input: config.input,
      external: config.external,
      plugins: config.plugins,
    });
    for (const file of bundle.watchFiles) {
      // CSS enters the graph as `file.css?inline` — strip queries so the
      // manifest records the real on-disk path.
      if (!file.startsWith('\0')) inputFiles.add(file.split('?', 1)[0]);
    }
    const outputs = Array.isArray(config.output) ? config.output : [config.output];
    for (const output of outputs) {
      await bundle.write(output);
      if (output.file) outputFiles.push(output.file);
    }
    await bundle.close();
  }
  manifest['//runtime'] = toEntry({ inputFiles: [...inputFiles], outputFiles });
}

const components = discoverComponents();
const stale = components.filter(name => !isCurrent(manifest[name]));
const skipped = components.length - stale.length;

if (stale.length > 0) {
  const workerCount = Math.min(16, cpus().length, stale.length);
  const chunks = Array.from({ length: workerCount }, () => []);
  stale.forEach((name, i) => chunks[i % workerCount].push(name));

  console.log(`Building CDN versions for ${stale.length} of ${components.length} components (${skipped} unchanged) across ${workerCount} worker threads...`);

  const results = await Promise.all(chunks.map(chunk => new Promise((resolvePromise) => {
    const worker = new Worker(workerScript, { workerData: { components: chunk } });
    worker.on('message', (built) => { manifest[built.name] = toEntry(built); });
    worker.on('error', (error) => {
      console.error(`[cdn-build] chunk ${chunk.join(',')} failed: ${error?.message ?? error}`);
      resolvePromise(1);
    });
    worker.on('exit', (code) => resolvePromise(code ?? 1));
  })));

  if (results.some(code => code !== 0)) process.exit(1);
} else {
  console.log(`CDN bundles unchanged (${components.length} components) — nothing to build.`);
}

fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, JSON.stringify(manifest));

console.log(`CDN build complete in ${((Date.now() - start) / 1000).toFixed(1)}s.`);
