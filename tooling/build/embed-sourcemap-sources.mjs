#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const roots = process.argv.slice(2).map(value => resolve(projectRoot, value));
if (!roots.length) throw new Error('usage: embed-sourcemap-sources <directory> [...]');

function mapsUnder(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return mapsUnder(path);
    return entry.name.endsWith('.map') ? [path] : [];
  });
}

function sourceCandidates(mapPath, source) {
  const clean = source.replace(/[?#].*$/, '');
  const candidates = [
    resolve(dirname(mapPath), clean),
    resolve(projectRoot, clean)
  ];
  const nodeModules = clean.match(/(?:^|\/)node_modules\/(.+)$/);
  if (nodeModules) candidates.push(join(projectRoot, 'node_modules', nodeModules[1]));
  const components = clean.match(/(?:^|\/)components\/(.+)$/);
  if (components) candidates.push(join(projectRoot, 'packages', 'components', 'src', components[1]));
  const core = clean.match(/(?:^|\/)src\/(.+)$/);
  if (core) candidates.push(join(projectRoot, 'packages', 'core', 'src', core[1]));
  const react = clean.match(/(?:^|\/)src\/react\/(.+)$/);
  if (react) candidates.push(join(projectRoot, 'packages', 'react', 'src', react[1]));
  if (mapPath.includes(`${join('adapters', 'react')}`)) {
    candidates.push(join(projectRoot, 'adapters', 'react', clean));
  }
  return [...new Set(candidates)];
}

let maps = 0;
let embedded = 0;
for (const root of roots) {
  for (const mapPath of mapsUnder(root)) {
    const map = JSON.parse(readFileSync(mapPath, 'utf8'));
    if (!Array.isArray(map.sources)) continue;
    map.sourcesContent ??= Array(map.sources.length).fill(null);
    let changed = false;
    map.sources.forEach((source, index) => {
      if (map.sourcesContent[index] != null) return;
      const path = sourceCandidates(mapPath, source).find(candidate =>
        existsSync(candidate) && statSync(candidate).isFile()
      );
      if (!path) return;
      map.sourcesContent[index] = readFileSync(path, 'utf8');
      embedded++;
      changed = true;
    });
    if (changed) writeFileSync(mapPath, JSON.stringify(map));
    maps++;
  }
}

console.log(`Embedded ${embedded} missing source(s) across ${maps} map(s): ${roots.map(root => relative(projectRoot, root)).join(', ')}`);
