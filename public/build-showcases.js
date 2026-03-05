#!/usr/bin/env node
// Assembles public/showcases/*.html fragments into public/components.html
// Component fragments are sorted alphabetically (default view).
// Category headers are emitted hidden; JS shows them when category sort is selected.
// Each comp-section gets data-category and data-cat-order attributes for JS sorting.
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getWipComponents } from '../scripts/wip-components.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, 'showcases');
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf-8'));
const wip = getWipComponents();

// Separate head, footer, categories, and component fragments
const headFile = manifest.files[0];                        // _head.html
const footerFile = manifest.files[manifest.files.length - 1]; // _footer.html
const middle = manifest.files.slice(1, -1);

const categories = [];  // { file, name, index }
const components = [];  // { file, catName, catIndex, orderInCat }

// Track which category each component belongs to
let currentCatName = null;
let currentCatIndex = -1;
let orderInCat = 0;
for (const file of middle) {
  if (file.startsWith('_cat-')) {
    // Extract category name from file content
    const content = readFileSync(join(dir, file), 'utf-8');
    const match = content.match(/>([^<]+)</);
    currentCatName = match ? match[1].trim() : file;
    currentCatIndex++;
    orderInCat = 0;
    categories.push({ file, name: currentCatName, index: currentCatIndex });
  } else {
    // Skip WIP components
    const compName = file.replace('.html', '');
    if (wip.has(compName)) continue;
    components.push({ file, catName: currentCatName, catIndex: currentCatIndex, orderInCat: orderInCat++ });
  }
}

// Sort components alphabetically by filename
components.sort((a, b) => a.file.localeCompare(b.file));

// Build output
let html = '';
function append(file) {
  const content = readFileSync(join(dir, file), 'utf-8');
  html += content;
  if (!content.endsWith('\n')) html += '\n';
}

// Head
append(headFile);

// Category headers (hidden by default since alpha is default sort)
for (const cat of categories) {
  const content = readFileSync(join(dir, cat.file), 'utf-8');
  html += content.replace(
    '<div class="comp-category">',
    `<div class="comp-category" data-cat-index="${cat.index}" style="display:none">`
  );
  if (!content.endsWith('\n')) html += '\n';
}

// Component fragments in alphabetical order, with data-category attributes
for (const comp of components) {
  let content = readFileSync(join(dir, comp.file), 'utf-8');
  // Inject data attributes into the first comp-section div
  content = content.replace(
    '<div class="comp-section"',
    `<div class="comp-section" data-category="${comp.catName}" data-cat-index="${comp.catIndex}" data-cat-order="${comp.orderInCat}"`
  );
  html += content;
  if (!content.endsWith('\n')) html += '\n';
}

// Pre-render sidebar links (alphabetical) so sidebar appears before JS runs
const sidebarLinks = [];
for (const comp of components) {
  const content = readFileSync(join(dir, comp.file), 'utf-8');
  const h3Match = content.match(/<h3>([^<]+)<\/h3>/);
  if (!h3Match) continue;
  // Skip hidden components (e.g. spreadsheet with style="display:none")
  if (content.includes('comp-section"') && content.includes('style="display:none"')) continue;
  const name = h3Match[1].trim();
  const id = 'comp-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  sidebarLinks.push({ name, id });
}
sidebarLinks.sort((a, b) => a.name.localeCompare(b.name));

// Inject pre-rendered links into the sidebar links wrapper
const sidebarHtml = sidebarLinks.map(l => `<a href="#${l.id}">${l.name}</a>`).join('');
html = html.replace(
  '<div class="comp-sidebar-links" id="comp-sidebar-links"></div>',
  `<div class="comp-sidebar-links" id="comp-sidebar-links">${sidebarHtml}</div>`
);

// Footer
append(footerFile);

writeFileSync(join(__dirname, 'components.html'), html);
console.log(`Built components.html from ${manifest.files.length} fragments`);
