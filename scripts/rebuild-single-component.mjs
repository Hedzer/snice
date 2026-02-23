#!/usr/bin/env node
/**
 * Incrementally rebuild a single component (core + CDN + copy to public).
 * Usage: node scripts/rebuild-single-component.mjs <component-name>
 */
import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import fs from 'fs';
import path from 'path';
import CleanCSS from 'clean-css';
import { createCdnBuild } from '../rollup.config.cdn.js';

const componentName = process.argv[2];
if (!componentName) {
  console.error('Usage: node scripts/rebuild-single-component.mjs <component-name>');
  process.exit(1);
}

const componentDir = `components/${componentName}`;
if (!fs.existsSync(componentDir)) {
  console.error(`Component not found: ${componentDir}`);
  process.exit(1);
}

// Find component TS files (exclude .d.ts, .types.ts, demo, controller)
function findTsFiles(dir) {
  const files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      files.push(...findTsFiles(full));
    } else if (
      item.endsWith('.ts') &&
      !item.endsWith('.d.ts') &&
      !item.endsWith('.types.ts') &&
      !item.includes('demo') &&
      !item.includes('controller')
    ) {
      files.push(full);
    }
  }
  return files;
}

const tsFiles = findTsFiles(componentDir);
if (tsFiles.length === 0) {
  console.error(`No TS files in: ${componentDir}`);
  process.exit(1);
}

const inputs = {};
for (const file of tsFiles) {
  const rel = path.relative('components', file);
  inputs[rel.replace('.ts', '')] = file;
}

// CSS loader plugin (same as rollup.config.js)
const cssLoader = {
  name: 'css-loader',
  resolveId(id, importer) {
    if (id.endsWith('.css?inline')) {
      const cssPath = id.replace('?inline', '');
      if (importer) return path.resolve(path.dirname(importer), cssPath) + '?inline';
      return id;
    }
    return null;
  },
  load(id) {
    if (id.endsWith('.css?inline')) {
      const cssPath = id.replace('?inline', '');
      try {
        if (fs.existsSync(cssPath)) {
          const css = fs.readFileSync(cssPath, 'utf-8');
          const minified = new CleanCSS({ level: 2 }).minify(css).styles;
          return `export default ${JSON.stringify(minified)};`;
        }
      } catch {}
      return `export default '';`;
    }
    return null;
  }
};

// Step 1: Core build (TS → dist/components/)
const coreBundle = await rollup({
  input: inputs,
  external: ['snice', 'snice/symbols', 'snice/transitions', 'tslib'],
  plugins: [
    resolve(),
    cssLoader,
    typescript({
      tsconfig: './components/tsconfig.json',
      declaration: false,
      declarationMap: false,
    }),
  ],
});

await coreBundle.write({
  dir: 'dist/components',
  format: 'es',
  sourcemap: true,
  entryFileNames: '[name].js',
  preserveModules: false,
});
await coreBundle.close();

// Step 2: CDN build
const cdnConfigs = createCdnBuild(componentName, { minify: true });
for (const config of cdnConfigs) {
  const bundle = await rollup({
    input: config.input,
    external: config.external,
    plugins: config.plugins,
  });
  await bundle.write(config.output);
  await bundle.close();
}

// Step 3: Copy .min.js to public/components/
const src = `dist/cdn/${componentName}/snice-${componentName}.min.js`;
const dest = `public/components/snice-${componentName}.min.js`;
if (fs.existsSync(src) && fs.existsSync('public/components')) {
  fs.copyFileSync(src, dest);
}

// Step 4: Copy companion files (e.g. pdf.worker.min.mjs for pdf-viewer)
const companionFiles = {
  'pdf-viewer': ['pdf.worker.min.mjs'],
};
const companions = companionFiles[componentName] || [];
for (const file of companions) {
  const companionSrc = `components/${componentName}/${file}`;
  const companionDest = `public/components/${file}`;
  if (fs.existsSync(companionSrc) && fs.existsSync('public/components')) {
    fs.copyFileSync(companionSrc, companionDest);
  }
}
