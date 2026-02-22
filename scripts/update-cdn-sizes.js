#!/usr/bin/env node
/**
 * Updates hardcoded CDN size references in docs and website with actual build sizes.
 * Run after `npm run build:cdn`.
 */
import fs from 'fs';
import { gzipSync } from 'zlib';

const runtimeMin = 'dist/cdn/runtime/snice-runtime.min.js';

if (!fs.existsSync(runtimeMin)) {
  console.error('CDN build not found. Run `npm run build:cdn` first.');
  process.exit(1);
}

// Compute actual runtime gzip size
const runtimeBuf = fs.readFileSync(runtimeMin);
const runtimeGzKB = Math.round(gzipSync(runtimeBuf).length / 1024);

// Compute component size range from all CDN component .min.js files
const cdnDir = 'dist/cdn';
const componentSizes = [];
for (const entry of fs.readdirSync(cdnDir)) {
  if (entry === 'runtime') continue;
  const minFile = `${cdnDir}/${entry}/snice-${entry}.min.js`;
  if (fs.existsSync(minFile)) {
    const buf = fs.readFileSync(minFile);
    componentSizes.push(gzipSync(buf).length / 1024);
  }
}
const minComp = Math.floor(Math.min(...componentSizes));
const maxComp = Math.ceil(Math.max(...componentSizes));

console.log(`Runtime: ~${runtimeGzKB}KB gzip`);
console.log(`Components: ${minComp}-${maxComp}KB gzip (${componentSizes.length} components)`);

// Files to update with size patterns
const replacements = [
  {
    file: 'DEVELOPMENT.md',
    patterns: [
      [/Runtime ~\d+KB gzip, components ~\d+-\d+KB each/, `Runtime ~${runtimeGzKB}KB gzip, components ~${minComp}-${maxComp}KB each`],
    ]
  },
  {
    file: 'docs/ai/DEVELOPMENT.md',
    patterns: [
      [/Runtime ~\d+KB gzip, components ~\d+-\d+KB each/, `Runtime ~${runtimeGzKB}KB gzip, components ~${minComp}-${maxComp}KB each`],
    ]
  },
  {
    file: 'public/guide.html',
    patterns: [
      [/The runtime is ~\d+KB gzipped\. Each component adds ~\d+&ndash;\d+KB\./, `The runtime is ~${runtimeGzKB}KB gzipped. Each component adds ~${minComp}&ndash;${maxComp}KB.`],
    ]
  },
];

let updated = 0;
for (const { file, patterns } of replacements) {
  if (!fs.existsSync(file)) {
    console.warn(`  Skipping ${file} (not found)`);
    continue;
  }
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;
  for (const [pattern, replacement] of patterns) {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`  Updated ${file}`);
    updated++;
  } else {
    console.log(`  ${file} already up to date`);
  }
}
console.log(`Done. ${updated} file(s) updated.`);
