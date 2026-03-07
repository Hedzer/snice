#!/usr/bin/env node
// Builds the deploy artifact in dist/site/
// 1. Copies public/ → dist/site/
// 2. Copies components/<name>/full-showcase.html → dist/site/showcase/<name>.html
//    with .ts imports rewritten to CDN <script> tags
// 3. Stamps all HTML in dist/site/

import { cpSync, mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const componentsDir = join(root, 'components');
const siteDir = join(root, 'dist', 'site');

// Read .wip exclusions
const wipPath = join(componentsDir, '.wip');
const wipList = existsSync(wipPath)
  ? readFileSync(wipPath, 'utf-8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  : [];

// 1. Clean and copy public/ → dist/site/
console.log('Copying public/ → dist/site/...');
rmSync(siteDir, { recursive: true, force: true });
cpSync(publicDir, siteDir, { recursive: true });

// 2. Copy and transform full-showcase pages
console.log('Building showcase pages...');
const showcaseDir = join(siteDir, 'showcase');
mkdirSync(showcaseDir, { recursive: true });

for (const entry of readdirSync(componentsDir)) {
  if (entry.startsWith('.') || entry.includes('.')) continue;
  if (wipList.includes(entry)) continue;
  const srcFile = join(componentsDir, entry, 'full-showcase.html');
  if (!existsSync(srcFile)) continue;

  let html = readFileSync(srcFile, 'utf-8');

  // Rewrite theme.css path (various relative patterns)
  html = html.replace(
    /href="[^"]*theme\/theme\.css"/g,
    'href="/theme/theme.css"'
  );

  // Rewrite <script type="module"> blocks containing .ts imports → CDN script tags
  html = html.replace(
    /<script type="module">([\s\S]*?)<\/script>/g,
    (match, content) => {
      // Collect all .ts component imports
      const imports = new Set();
      // import './snice-<name>.ts'
      content.replace(/import\s+['"]\.\/snice-([^'"]+)\.ts['"]/g, (_, name) => { imports.add(name); });
      // import '../<dir>/snice-<name>.ts'
      content.replace(/import\s+['"]\.\.\/([^/]+)\/snice-([^'"]+)\.ts['"]/g, (_, dir, name) => { imports.add(name); });
      // import '../../components/<dir>/snice-<name>.ts'
      content.replace(/import\s+['"]\.\.\/\.\.\/components\/([^/]+)\/snice-([^'"]+)\.ts['"]/g, (_, dir, name) => { imports.add(name); });
      // import './snice-<name>-item.ts' etc (sub-components in same dir)
      content.replace(/import\s+['"]\.\/snice-([^'"]+)\.ts['"]/g, (_, name) => { imports.add(name); });

      if (imports.size === 0) return match;

      // Build CDN script tags
      let scripts = '<script src="/components/snice-runtime.min.js"></script>\n';
      for (const comp of imports) {
        scripts += `  <script src="/components/snice-${comp}.min.js"></script>\n`;
      }

      // Keep non-import JS code as a separate script block
      const nonImportLines = content.split('\n').filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        if (trimmed.startsWith('import ')) return false;
        if (trimmed.startsWith('await import(')) return false;
        return true;
      });
      if (nonImportLines.length > 0 && nonImportLines.some(l => l.trim())) {
        // Escape $ in code to prevent regex replacement interpretation
        const code = nonImportLines.join('\n').replace(/\$/g, '$$$$');
        scripts += '  <script>\n' + code + '\n  </script>\n';
      }

      return scripts;
    }
  );

  writeFileSync(join(showcaseDir, entry + '.html'), html);
}

const showcaseCount = readdirSync(showcaseDir).length;
console.log(`  ${showcaseCount} showcase pages built`);

// 3. Stamp everything
console.log('Stamping assets...');
execSync(`node scripts/stamp-assets.js --dir ${siteDir}`, { stdio: 'inherit', cwd: root });

console.log(`Deploy artifact ready at dist/site/ (${showcaseCount} showcases)`);
