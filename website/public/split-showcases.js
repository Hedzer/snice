#!/usr/bin/env node
// One-time script: splits components.html into individual showcase files
// Uses a simple line-by-line state machine approach
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, 'components.html'), 'utf-8');
const lines = src.split('\n');
const out = join(__dirname, 'showcases');
mkdirSync(out, { recursive: true });

// Map h3 titles to filenames
const titleMap = {
  'Button': 'button', 'Input': 'input', 'Select': 'select', 'Card': 'card',
  'Modal': 'modal', 'Alert': 'alert', 'Checkbox, Radio &amp; Switch': 'checkbox-radio-switch',
  'Textarea': 'textarea', 'Tabs': 'tabs', 'Table': 'table', 'Badge': 'badge',
  'QR Code': 'qr-code', 'Breadcrumbs': 'breadcrumbs', 'Pagination': 'pagination',
  'Link': 'link', 'Menu': 'menu', 'Drawer': 'drawer', 'Tooltip': 'tooltip',
  'Chip': 'chip', 'Progress &amp; Spinner': 'progress-spinner', 'Toast': 'toast',
  'Banner': 'banner', 'Color Picker': 'color-picker', 'Avatar': 'avatar',
  'Skeleton': 'skeleton', 'Divider': 'divider', 'Accordion': 'accordion',
  'Empty State': 'empty-state', 'Timeline': 'timeline', 'Image': 'image',
  'Command Palette': 'command-palette', 'Chart &amp; Sparkline': 'chart-sparkline',
  'Date Picker': 'date-picker', 'Slider': 'slider', 'File Upload': 'file-upload',
  'File Gallery': 'file-gallery', 'Stepper': 'stepper', 'Code Block': 'code-block',
  'Terminal': 'terminal', 'Carousel': 'carousel', 'Calendar': 'calendar',
  'Split Pane': 'split-pane', 'Draw': 'draw', 'Color Display': 'color-display',
  'Kanban': 'kanban', 'Chat': 'chat', 'Camera': 'camera', 'QR Reader': 'qr-reader',
  'Audio Recorder': 'audio-recorder', 'Music Player': 'music-player',
  'Location': 'location', 'Timer': 'timer', 'CDN Build': 'cdn-build',
  'React Adapter': 'react-adapter',
};

// Map component IDs/names to their init script component name
const initScriptMapping = {
  'breadcrumbs': ['demo-bc-default', 'demo-bc-icons', 'demo-bc-collapsed', 'demo-bc-small', 'demo-bc-large'],
  'stepper': ['demo-stepper'],
  'chart-sparkline': ['line-chart', 'bar-chart', 'spark1', 'spark2', 'spark3'],
  'calendar': ['demo-calendar'],
  'table': ['demo-table'],
  'timeline': ['demo-timeline-left', 'demo-timeline-alt', 'demo-timeline-right', 'demo-timeline-horiz'],
  'kanban': ['demo-kanban'],
  'command-palette': ['cmd-palette'],
  'terminal': ['demo-terminal'],
  'chat': ['demo-chat'],
  'music-player': ['demo-music'],
  'banner': ['showDemoBanner'],
  'camera': ['camera-modal'],
  'qr-reader': ['qr-reader-modal'],
};

// Step 1: Find the head section (up to first comp-category or comp-section)
let headEnd = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('comp-category') || lines[i].includes('<!-- ── 1.')) {
    headEnd = i;
    break;
  }
}
// Back up to include trailing blank lines in head
while (headEnd > 0 && lines[headEnd - 1].trim() === '') headEnd--;

// Step 2: Find the footer start (comp-list div or after last comp-section)
let footerStart = lines.length;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('class="comp-list"')) {
    // Back up to find the div that contains it
    footerStart = i;
    // Check for blank lines before
    while (footerStart > 0 && lines[footerStart - 1].trim() === '') footerStart--;
    break;
  }
}

// Step 3: Find the big init script block in the footer
let bigScriptStart = -1;
let bigScriptEnd = -1;
for (let i = footerStart; i < lines.length; i++) {
  if (lines[i].includes('<script>') && i + 1 < lines.length && lines[i + 1].includes('Banner demo')) {
    bigScriptStart = i;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '</script>') {
        bigScriptEnd = j;
        break;
      }
    }
    break;
  }
}

// Extract init script content and parse into blocks per component
const initBlocks = new Map();
if (bigScriptStart >= 0) {
  const scriptLines = lines.slice(bigScriptStart + 1, bigScriptEnd);
  const scriptText = scriptLines.join('\n');

  // Split on top-level comment lines (// Initialize ...)
  const blockPattern = /(?=\s*\/\/ (?:Initialize|Banner demo|Start ))/g;
  const blocks = scriptText.split(blockPattern).filter(b => b.trim());

  for (const block of blocks) {
    // Determine which component this belongs to
    let matched = false;
    for (const [compName, ids] of Object.entries(initScriptMapping)) {
      for (const id of ids) {
        if (block.includes(id)) {
          const existing = initBlocks.get(compName) || '';
          if (!existing.includes(block.trim())) {
            initBlocks.set(compName, (existing ? existing + '\n\n' : '') + block.trim());
          }
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    if (!matched) {
      console.log('WARNING: Unmatched init block:', block.substring(0, 60).replace(/\n/g, ' '));
    }
  }
}

console.log('Init scripts mapped to:', [...initBlocks.keys()].join(', '));

// Step 4: Parse the middle section into fragments
const middle = lines.slice(headEnd, footerStart);
const fragments = []; // { type: 'category'|'section', name, lines }

let current = null; // { type, name, startLine }
let accumLines = [];

for (let i = 0; i < middle.length; i++) {
  const line = middle[i];

  // Category divider
  const catMatch = line.match(/<div class="comp-category">([^<]+)<\/div>/);
  if (catMatch) {
    // Flush current
    if (current) {
      fragments.push({ ...current, lines: [...accumLines] });
    }
    // Collect category block (includes surrounding comments)
    const catLines = [];
    // Look backward for comment block
    let backIdx = i - 1;
    while (backIdx >= 0 && middle[backIdx].trim().startsWith('<!--')) {
      backIdx--;
    }
    // Include blank line before comments
    const catStart = backIdx + 1;
    // Remove those lines from previous fragment
    if (fragments.length > 0 || accumLines.length > 0) {
      const prevFrag = current ? accumLines : (fragments.length > 0 ? fragments[fragments.length - 1].lines : null);
      if (prevFrag) {
        while (prevFrag.length > 0 && (prevFrag[prevFrag.length - 1].trim().startsWith('<!--') || prevFrag[prevFrag.length - 1].trim() === '')) {
          prevFrag.pop();
        }
      }
    }

    for (let j = catStart; j <= i; j++) {
      catLines.push(middle[j]);
    }

    fragments.push({
      type: 'category',
      name: catMatch[1].trim(),
      lines: catLines
    });
    current = null;
    accumLines = [];
    continue;
  }

  // Section start: comment marker
  if (line.match(/<!-- ── \d+\./)) {
    // Flush current
    if (current) {
      // Trim trailing blank lines
      while (accumLines.length > 0 && accumLines[accumLines.length - 1].trim() === '') {
        accumLines.pop();
      }
      fragments.push({ ...current, lines: [...accumLines] });
    }
    current = { type: 'section', name: '__pending__' };
    accumLines = [line];
    continue;
  }

  // Section start: <div class="comp-section"> followed by <h3>
  if (line.includes('<div class="comp-section">') && !current) {
    if (accumLines.length > 0 && current) {
      while (accumLines.length > 0 && accumLines[accumLines.length - 1].trim() === '') {
        accumLines.pop();
      }
      fragments.push({ ...current, lines: [...accumLines] });
    }
    current = { type: 'section', name: '__pending__' };
    accumLines = [line];
    continue;
  }

  // If we see a <div class="comp-section"> and we have a current section,
  // this is a new section (no comment marker)
  if (line.includes('<div class="comp-section">') && current && current.name !== '__pending__') {
    while (accumLines.length > 0 && accumLines[accumLines.length - 1].trim() === '') {
      accumLines.pop();
    }
    fragments.push({ ...current, lines: [...accumLines] });
    current = { type: 'section', name: '__pending__' };
    accumLines = [line];
    continue;
  }

  // h3 gives us the section name
  const h3Match = line.match(/<h3>(.+?)<\/h3>/);
  if (h3Match && current && current.name === '__pending__') {
    current.name = h3Match[1].trim();
  }

  if (current) {
    accumLines.push(line);
  }
}

// Flush last
if (current) {
  while (accumLines.length > 0 && accumLines[accumLines.length - 1].trim() === '') {
    accumLines.pop();
  }
  fragments.push({ ...current, lines: [...accumLines] });
}

// Step 5: Write files
const manifest = ['_head.html'];

// Write head
writeFileSync(join(out, '_head.html'), lines.slice(0, headEnd).join('\n') + '\n');
console.log(`_head.html: ${headEnd} lines`);

// Category counter for dedup
const catCounts = {};

for (const frag of fragments) {
  if (frag.type === 'category') {
    const slug = frag.name.toLowerCase().replace(/\s+/g, '-');
    catCounts[slug] = (catCounts[slug] || 0) + 1;
    const suffix = catCounts[slug] > 1 ? `-${catCounts[slug]}` : '';
    const fileName = `_cat-${slug}${suffix}.html`;
    writeFileSync(join(out, fileName), '\n' + frag.lines.join('\n') + '\n');
    manifest.push(fileName);
    console.log(`${fileName}: category "${frag.name}"`);
  } else {
    const fileName = titleMap[frag.name];
    if (!fileName) {
      console.log(`WARNING: No mapping for section "${frag.name}"`);
      continue;
    }

    let content = frag.lines.join('\n');

    // Add init script if this component has one and doesn't already have an inline <script>
    const initScript = initBlocks.get(fileName);
    if (initScript) {
      // Check if the content already has this init script inline
      const hasInlineScript = content.includes('<script>') &&
        Object.values(initScriptMapping).flat().some(id =>
          initScript.includes(id) && content.includes(id));

      if (!hasInlineScript) {
        content += '\n<script>\n' + initScript + '\n</script>';
      }
    }

    writeFileSync(join(out, fileName + '.html'), content + '\n');
    manifest.push(fileName + '.html');
    console.log(`${fileName}.html: "${frag.name}" (${frag.lines.length} lines${initScript ? ' + init' : ''})`);
  }
}

// Write footer WITHOUT the big init script block
const footerLines = lines.slice(footerStart);
let footerContent = footerLines.join('\n');
if (bigScriptStart >= 0 && bigScriptEnd >= 0) {
  // Remove the init script block from footer
  const initBlockContent = lines.slice(bigScriptStart, bigScriptEnd + 1).join('\n');
  footerContent = footerContent.replace(initBlockContent, '');
  // Clean up extra blank lines
  footerContent = footerContent.replace(/\n{3,}/g, '\n\n');
}
writeFileSync(join(out, '_footer.html'), '\n' + footerContent);
manifest.push('_footer.html');
console.log(`_footer.html: footer`);

// Write manifest
writeFileSync(join(out, 'manifest.json'), JSON.stringify({ files: manifest }, null, 2) + '\n');
console.log(`\nmanifest.json: ${manifest.length} files`);
