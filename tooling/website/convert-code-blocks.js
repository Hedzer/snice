#!/usr/bin/env node
/**
 * Convert all <pre><code class="language-xxx"> blocks to <snice-code-block> with text slot.
 * Also converts bare <pre><code> blocks used in decorators/guide pages.
 */
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const publicDir = join(root, 'website', 'public');

const GRAMMAR_MAP = {
  'html': 'grammars/html.json',
  'javascript': 'grammars/typescript.json',
  'js': 'grammars/typescript.json',
  'typescript': 'grammars/typescript.json',
  'css': 'grammars/css.json',
  'json': 'grammars/json.json',
  'snice': 'grammars/snice.json',
};

let totalConverted = 0;

function convertFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let count = 0;

  // Pattern 1: <pre><code class="language-xxx">...content...</code></pre>
  content = content.replace(
    /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
    (match, lang, code) => {
      const grammar = GRAMMAR_MAP[lang];
      const grammarAttr = grammar ? ` grammar="${grammar}"` : '';
      count++;
      return `<snice-code-block language="${lang}"${grammarAttr}>${code}</snice-code-block>`;
    }
  );

  // Pattern 2: <pre class="..."><code>...content...</code></pre> (index.html hero)
  content = content.replace(
    /<pre class="([^"]*)"([^>]*)><code>([\s\S]*?)<\/code><\/pre>/g,
    (match, cls, rest, code) => {
      count++;
      return `<snice-code-block language="snice" grammar="grammars/snice.json" class="${cls}"${rest}>${code}</snice-code-block>`;
    }
  );

  if (count > 0) {
    writeFileSync(filePath, content);
    console.log(`  ${count} blocks in ${filePath.replace(root + '/', '')}`);
    totalConverted += count;
  }
  return count;
}

// Process source showcase cards. Full showcases are standalone applications and
// intentionally retain their own code presentation.
const showcaseDir = join(root, 'website', 'showcases');
for (const entry of readdirSync(showcaseDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'shared') continue;
  const card = join(showcaseDir, entry.name, 'card.html');
  if (existsSync(card)) convertFile(card);
}
const sharedDir = join(showcaseDir, 'shared');
for (const file of readdirSync(sharedDir)) {
  if (file.endsWith('.html') && !file.startsWith('_')) convertFile(join(sharedDir, file));
}

// Process standalone pages
for (const page of ['index.html', 'guide.html']) {
  convertFile(join(publicDir, page));
}

console.log(`\nConverted ${totalConverted} code blocks total`);
