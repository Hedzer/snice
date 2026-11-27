import fs from 'node:fs';
import path from 'node:path';
import CleanCSS from 'clean-css';

export const SKIN_PLATFORMS = ['ios', 'material', 'windows', 'macos'];

/**
 * Split a comma-separated CSS selector list while respecting parens/brackets/quotes.
 */
function splitSelectorList(selectorText) {
  const parts = [];
  let current = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  let quote = null;

  for (let i = 0; i < selectorText.length; i++) {
    const ch = selectorText[i];
    if (quote) {
      current += ch;
      if (ch === '\\' && i + 1 < selectorText.length) {
        current += selectorText[++i];
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);

    if (ch === ',' && parenDepth === 0 && bracketDepth === 0) {
      const trimmed = current.trim();
      if (trimmed) parts.push(trimmed);
      current = '';
    } else {
      current += ch;
    }
  }
  const trimmed = current.trim();
  if (trimmed) parts.push(trimmed);
  return parts;
}

/**
 * Linear O(C) CSS block rewriter preserving comments, quoted strings, url(...),
 * @media, @supports, @container, @layer, and leaving @keyframes untouched.
 */
function rewriteCssRules(cssText, rewriteSelectorList) {
  const stripped = cssText.replace(/\/\*[\s\S]*?\*\//g, '');

  const walk = (text, inKeyframes = false, inDarkMedia = false) => {
    let out = '';
    let i = 0;
    const len = text.length;

    while (i < len) {
      while (i < len && /\s/.test(text[i])) i++;
      if (i >= len) break;

      const start = i;
      let quote = null;
      let parenDepth = 0;
      while (i < len) {
        const ch = text[i];
        if (quote) {
          if (ch === '\\') { i += 2; continue; }
          if (ch === quote) quote = null;
          i++;
          continue;
        }
        if (ch === '"' || ch === "'") { quote = ch; i++; continue; }
        if (ch === '(') parenDepth++;
        else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
        if (parenDepth === 0 && (ch === '{' || ch === ';')) break;
        i++;
      }

      if (i >= len) {
        out += text.slice(start);
        break;
      }

      const prelude = text.slice(start, i).trim();
      const delim = text[i++];

      if (delim === ';') {
        out += `${prelude};`;
        continue;
      }

      const bodyStart = i;
      let braceDepth = 1;
      quote = null;
      while (i < len && braceDepth > 0) {
        const ch = text[i];
        if (quote) {
          if (ch === '\\') { i += 2; continue; }
          if (ch === quote) quote = null;
          i++;
          continue;
        }
        if (ch === '"' || ch === "'") { quote = ch; i++; continue; }
        if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth--;
        i++;
      }
      const body = text.slice(bodyStart, i - 1);

      if (inKeyframes) {
        out += `${prelude}{${body}}`;
        continue;
      }

      if (prelude.startsWith('@')) {
        const atName = prelude.slice(1).split(/[\s(]/)[0].toLowerCase();
        if (atName === 'keyframes' || atName === '-webkit-keyframes') {
          out += `${prelude}{${body}}`;
        } else if (
          atName === 'media' ||
          atName === 'supports' ||
          atName === 'layer' ||
          atName === 'container'
        ) {
          const nextDarkMedia =
            inDarkMedia || (atName === 'media' && /prefers-color-scheme\s*:\s*dark/i.test(prelude));
          const rewrittenBody = walk(body, false, nextDarkMedia);
          if (rewrittenBody.trim()) {
            out += `${prelude}{${rewrittenBody}}`;
          }
        } else {
          out += `${prelude}{${body}}`;
        }
        continue;
      }

      const selectors = splitSelectorList(prelude);
      const rewritten = rewriteSelectorList(selectors, inDarkMedia);
      if (rewritten.length > 0 && body.trim()) {
        out += `${rewritten.join(',')}{${body}}`;
      }
    }

    return out;
  };

  return walk(stripped);
}

/**
 * Rewrite Layer 1 platform token CSS (`theme/platforms/<p>.css`) strictly under
 * `[data-platform="<p>"]` with ZERO bare `:root` selectors.
 */
export function scopePlatformTokenCss(tokenCss, platform) {
  const scope = `[data-platform="${platform}"]`;

  return rewriteCssRules(tokenCss, (selectors, inDarkMedia) => {
    const out = [];
    for (const raw of selectors) {
      const s = raw.trim();
      if (!s) continue;

      if (s === ':root') {
        out.push(scope);
        continue;
      }

      if (s === '[data-theme="dark"]') {
        out.push(`${scope}[data-theme="dark"]`, `[data-theme="dark"] ${scope}`);
        continue;
      }

      if (inDarkMedia && (s === ':root:not([data-theme])' || s === ':root[data-theme="auto"]')) {
        if (s === ':root:not([data-theme])') {
          out.push(
            `${scope}:not([data-theme])`,
            `:root:not([data-theme]) ${scope}:not([data-theme])`
          );
        } else {
          out.push(
            `${scope}[data-theme="auto"]`,
            `[data-theme="auto"] ${scope}:not([data-theme])`
          );
        }
        continue;
      }

      if (s.startsWith(':root')) {
        const rest = s.slice(5);
        out.push(`${scope}${rest}`);
        continue;
      }

      if (s.startsWith('[data-motion=') || s.startsWith('[data-density=')) {
        out.push(`${scope}${s}`, `${s} ${scope}`);
        continue;
      }

      if (s.includes('[data-platform=')) {
        out.push(s);
        continue;
      }

      out.push(`${scope} ${s}`, `${scope}${s}`);
    }
    return [...new Set(out)];
  });
}

/**
 * Build cross-browser donut-scoped selectors for `[data-platform="<p>"]` that work
 * identically in Chromium, Firefox, and WebKit without `:host-context()` or `@scope`.
 *
 * Guarantees inner nested `[data-platform="B"]` inside `[data-platform="A"]` always
 * overrides outer `A` regardless of stylesheet load order, with zero outward OR inward
 * property leakage across 3 levels of nesting plus direct self-attribute scoping.
 */
function buildDonutScopedVariants(platform, hostTag, hostQualifier, partSuffix) {
  const p = `[data-platform="${platform}"]`;
  const dp = '[data-platform]';
  const q = hostQualifier || '';
  const tail = partSuffix || '';

  return [
    // Direct attribute on the custom element itself
    `${hostTag}${p}${q}${tail}`,
    // Depth 1: inside [data-platform="<p>"], not inside any nested [data-platform]
    `${p} ${hostTag}${q}:not(${dp}):not(${dp} ${dp} *)${tail}`,
    // Depth 2: nested [data-platform="<p>"] inside an outer [data-platform]
    `${dp} ${p} ${hostTag}${q}:not(${dp}):not(${dp} ${dp} ${dp} *)${tail}`,
    // Depth 3: triply nested [data-platform="<p>"]
    `${dp} ${dp} ${p} ${hostTag}${q}:not(${dp})${tail}`,
  ];
}

const HOST_AND_PART_PARSE_RE =
  /^:host(?:\(([^)]*)\))?((?::[a-zA-Z-]+(?:\([^)]*\))?)*)\s+((?:\[part~=["']?[a-zA-Z0-9_-]+["']?\])+)(.*)$/;
const PART_ONLY_PARSE_RE =
  /^((?:\[part~=["']?[a-zA-Z0-9_-]+["']?\])+)(.*)$/;
const HOST_ONLY_PARSE_RE =
  /^:host(?:\(([^)]*)\))?(.*)$/;
const SINGLE_PART_TOKEN_RE = /\[part~=["']?([a-zA-Z0-9_-]+)["']?\]/g;

function extractPartNames(partCluster) {
  const names = [];
  let match;
  SINGLE_PART_TOKEN_RE.lastIndex = 0;
  while ((match = SINGLE_PART_TOKEN_RE.exec(partCluster)) !== null) {
    names.push(match[1]);
  }
  return names.join(' ');
}

/**
 * Rewrite Layer 2 component platform CSS (`<comp>/<p>.css`) 1:1 from `:host` / `[part~="..."]`
 * into donut-scoped `[data-platform="<p>"] snice-<comp>...::part(...)` rules.
 */
export function scopeComponentPlatformCss(compCss, tagName, platform) {
  return rewriteCssRules(compCss, (selectors) => {
    const out = [];
    for (const raw of selectors) {
      const s = raw.trim();
      if (!s) continue;

      let m = HOST_AND_PART_PARSE_RE.exec(s);
      if (m) {
        const [, hostCond = '', hostPseudos = '', partCluster, partTail = ''] = m;
        const hostQual = `${hostCond}${hostPseudos}`;
        const partNames = extractPartNames(partCluster);
        out.push(...buildDonutScopedVariants(platform, tagName, hostQual, `::part(${partNames})${partTail}`));
        continue;
      }

      m = PART_ONLY_PARSE_RE.exec(s);
      if (m) {
        const [, partCluster, partTail = ''] = m;
        const partNames = extractPartNames(partCluster);
        out.push(...buildDonutScopedVariants(platform, tagName, '', `::part(${partNames})${partTail}`));
        continue;
      }

      m = HOST_ONLY_PARSE_RE.exec(s);
      if (m) {
        const [, hostCond = '', hostRest = ''] = m;
        // Split any trailing pseudo-element (`::before`, `::after`) so `:not(...)` stays before it
        const pseudoElIdx = hostRest.indexOf('::');
        const hostQual = pseudoElIdx >= 0 ? `${hostCond}${hostRest.slice(0, pseudoElIdx)}` : `${hostCond}${hostRest}`;
        const pseudoTail = pseudoElIdx >= 0 ? hostRest.slice(pseudoElIdx) : '';
        out.push(...buildDonutScopedVariants(platform, tagName, hostQual, pseudoTail));
        continue;
      }
    }
    return out;
  });
}

/**
 * Compile a complete self-contained `[data-platform="<p>"]` scoped CSS stylesheet
 * from Layer 1 token CSS + all Layer 2 component platform stylesheets.
 */
export function compileScopedPlatformCss(platform, tokenCss, componentEntries = [], options = {}) {
  const { minify = true } = options;
  const sections = [];

  if (tokenCss && tokenCss.trim()) {
    sections.push(scopePlatformTokenCss(tokenCss, platform));
  }

  // Deterministic sorted order by tagName
  const sorted = [...componentEntries].sort((a, b) => a.tagName.localeCompare(b.tagName));
  for (const entry of sorted) {
    if (!entry.css || !entry.css.trim()) continue;
    sections.push(scopeComponentPlatformCss(entry.css, entry.tagName, platform));
  }

  const combined = sections.filter(Boolean).join('\n');
  if (!minify || !combined.trim()) return combined;

  // CleanCSS collapses spaces inside functional pseudo-elements like `::part(a b)` -> `::part(ab)`.
  // Preserve multi-part space separators across CleanCSS minification.
  const PART_SP = '__SNICE_PART_SP__';
  const protectedCss = combined.replace(/::part\(([^)]+)\)/g, (_, inner) =>
    `::part(${inner.trim().replace(/\s+/g, PART_SP)})`
  );
  const minified = new CleanCSS({ level: 1 }).minify(protectedCss).styles;
  return minified.replaceAll(PART_SP, ' ');
}

/**
 * Build all `dist/components/theme/platforms/<p>-scoped.css` stylesheets from source.
 */
export function compileAllScopedPlatforms(componentSourceDir, destDir, wipSet = new Set()) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const results = {};
  for (const platform of SKIN_PLATFORMS) {
    const tokenPath = path.join(componentSourceDir, 'theme', 'platforms', `${platform}.css`);
    const tokenCss = fs.existsSync(tokenPath) ? fs.readFileSync(tokenPath, 'utf8') : '';

    const componentEntries = [];
    const compDirs = fs
      .readdirSync(componentSourceDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== 'theme' && d.name !== 'platform-behaviors' && !wipSet.has(d.name))
      .map((d) => d.name)
      .sort();

    for (const comp of compDirs) {
      const compDir = path.join(componentSourceDir, comp);
      const files = fs.readdirSync(compDir).sort();
      for (const file of files) {
        if (file === `${platform}.css`) {
          componentEntries.push({
            tagName: `snice-${comp}`,
            css: fs.readFileSync(path.join(compDir, file), 'utf8'),
          });
        } else if (file.endsWith(`.${platform}.css`)) {
          const base = file.slice(0, -(platform.length + 5));
          const tagName = base.startsWith('snice-') ? base : `snice-${base}`;
          componentEntries.push({
            tagName,
            css: fs.readFileSync(path.join(compDir, file), 'utf8'),
          });
        }
      }
    }

    const compiled = compileScopedPlatformCss(platform, tokenCss, componentEntries, { minify: true });
    const outPath = path.join(destDir, `${platform}-scoped.css`);
    fs.writeFileSync(outPath, compiled, 'utf8');
    results[platform] = { outPath, bytes: Buffer.byteLength(compiled, 'utf8'), components: componentEntries.length };
  }

  return results;
}
