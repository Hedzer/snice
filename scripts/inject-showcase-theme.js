#!/usr/bin/env node
// Injects theme bootstrap into all full-showcase.html files
// so they pick up the user's theme when loaded in the More panel iframe.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(__dirname, '..', 'components');

const THEME_SCRIPT = `<script>
document.documentElement.setAttribute('data-theme', localStorage.getItem('snice-theme') || 'dark');
(function(){
  var p = localStorage.getItem('snice-theme-preset');
  var c = localStorage.getItem('snice-theme-custom');
  if (p) { var s = document.createElement('style'); s.id = 'snice-theme-preset'; s.textContent = p; document.head.appendChild(s); }
  if (c) { var s = document.createElement('style'); s.id = 'snice-theme-custom'; s.textContent = c; document.head.appendChild(s); }
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'snice-theme') document.documentElement.setAttribute('data-theme', e.data.theme);
  });
})();
</script>`;

let count = 0;

for (const entry of readdirSync(componentsDir)) {
  if (entry.startsWith('.') || entry.includes('.')) continue;
  const file = join(componentsDir, entry, 'full-showcase.html');
  if (!existsSync(file)) continue;

  let html = readFileSync(file, 'utf-8');

  // Skip if already injected
  if (html.includes('snice-theme-preset')) continue;

  // Add data-theme="dark" to <html> tag
  html = html.replace(/<html lang="en">/, '<html lang="en" data-theme="dark">');

  // Inject theme script right after <head> opening or after first <meta> charset
  if (html.includes('<head>')) {
    html = html.replace('<head>', '<head>\n' + THEME_SCRIPT);
  }

  writeFileSync(file, html);
  count++;
}

console.log(`Injected theme bootstrap into ${count} files`);
