#!/usr/bin/env node
// Strip entity-encoded <script></script> wrappers from showcase code-blocks.
// Keeps the inner JS and dedents it so it sits flush with the surrounding HTML.
// Skips <script src="..."> (single-line CDN examples).

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, '..', 'public', 'showcases');
const files = readdirSync(dir).filter(f => f.endsWith('.html'));

// Matches a multi-line <script>...</script> block in entity-encoded form.
// Handles cases where `&lt;/script&gt;` is followed on the same line by
// other content (e.g. </snice-code-block>).
const re = /([ \t]*)&lt;script&gt;\n([\s\S]*?)\n([ \t]*)&lt;\/script&gt;/g;

let changed = 0;
for (const f of files) {
  const path = join(dir, f);
  const orig = readFileSync(path, 'utf8');

  const next = orig.replace(re, (_match, _openIndent, body, _closeIndent) => {
    const lines = body.split('\n');
    const nonEmpty = lines.filter(l => l.trim().length > 0);
    if (nonEmpty.length === 0) return '';
    const minIndent = Math.min(
      ...nonEmpty.map(l => (l.match(/^[ \t]*/)?.[0].length ?? 0))
    );
    return lines.map(l => l.slice(minIndent)).join('\n');
  });

  if (next !== orig) {
    writeFileSync(path, next);
    changed++;
    console.log(`stripped: ${f}`);
  }
}

console.log(`\n${changed} files updated`);
