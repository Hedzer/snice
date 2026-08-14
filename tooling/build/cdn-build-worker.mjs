#!/usr/bin/env node
/**
 * Worker thread for the parallel CDN build: builds the CDN bundles for the
 * component names passed via workerData and reports each component's
 * resolved input files (its full import closure) back to the parent for the
 * skip-unchanged manifest.
 */
import { workerData, parentPort } from 'worker_threads';
import { rollup } from 'rollup';
import { createCdnBuild } from '../../rollup.config.cdn.js';

for (const name of workerData.components) {
  const inputFiles = new Set();
  const outputFiles = [];
  const configs = createCdnBuild(name, { minify: true });
  for (const config of configs) {
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
  parentPort.postMessage({ name, inputFiles: [...inputFiles], outputFiles });
}
