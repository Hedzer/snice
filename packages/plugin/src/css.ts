import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import MagicString from 'magic-string';

type AstNode = Record<string, any>;

const SNICE_SPECIFIERS = new Set(['snice', 'snice/index', 'snice/index.js']);
const THEME_CSS_ID_RE = /(?:^|[\\/])theme[\\/]theme\.css(?:\?.*)?$/;
const CALC_FN_NAMES = new Set(['calc', 'min', 'max', 'clamp']);
const SNICE_TOKEN_RE = /--snice-[a-zA-Z0-9_-]+/g;
const DYNAMIC_TOKEN_PREFIX_RE = /(--snice-[a-zA-Z0-9_-]+-)(?:\$\{|['"`]\s*\+)/g;

function isNode(v: unknown): v is AstNode {
  return typeof v === 'object' && v !== null && typeof (v as any).type === 'string';
}

function isWs(code: number): boolean {
  return code === 32 || code === 9 || code === 10 || code === 13 || code === 12;
}

function isIdentChar(code: number): boolean {
  return (
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    (code >= 48 && code <= 57) ||
    code === 45 || // -
    code === 95 || // _
    code >= 128
  );
}

function escapeTemplateQuasi(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

export function isThemeCssId(id: string): boolean {
  return THEME_CSS_ID_RE.test(id);
}

function isSniceImportSource(source: string): boolean {
  if (SNICE_SPECIFIERS.has(source)) return true;
  if (source.endsWith('/packages/core/src/index') || source.endsWith('/packages/core/src/index.ts')) return true;
  if (source.endsWith('/dist/index.esm.js') || source.endsWith('/dist/index.js')) return true;
  return false;
}

/**
 * Load the shipped Snice `theme.css` for fallback allowlist extraction when
 * `stripCssFallbacks: true` is explicitly set without importing `theme.css`.
 */
export function loadShippedThemeCss(): string | null {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // From dist/plugin/ or dist/plugin/_chunks/
    resolve(here, '../components/theme/theme.css'),
    resolve(here, '../../components/theme/theme.css'),
    // From packages/plugin/src/
    resolve(here, '../../components/src/theme/theme.css'),
    resolve(here, '../../../dist/components/theme/theme.css'),
    resolve(process.cwd(), 'dist/components/theme/theme.css'),
    resolve(process.cwd(), 'packages/components/src/theme/theme.css'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      return readFileSync(p, 'utf8');
    }
  }
  return null;
}

/**
 * Linear O(C) zero-dependency CSS minifier.
 * Preserves:
 * - Quoted strings ('...', "..." with backslash escapes) and data URIs verbatim
 * - Unquoted url(...) content verbatim
 * - calc()/min()/max()/clamp() operator spacing around + and -
 * - Custom property empty values (`--foo: ;`), :host(), ::part(), @media, @container
 * - Malformed unclosed comments/strings (safe passthrough)
 */
export function minifyCssText(css: string): string {
  const len = css.length;
  if (len === 0) return css;

  let out = '';
  let i = 0;
  let pendingSpace = false;
  // Track function parens to detect when we're inside calc/min/max/clamp
  const parenIsCalc: boolean[] = [];
  let calcDepth = 0;

  const peekNextNonWs = (pos: number): number => {
    while (pos < len) {
      if (isWs(css.charCodeAt(pos))) {
        pos++;
        continue;
      }
      if (css.charCodeAt(pos) === 47 && pos + 1 < len && css.charCodeAt(pos + 1) === 42) {
        const end = css.indexOf('*/', pos + 2);
        if (end === -1) return pos;
        pos = end + 2;
        continue;
      }
      return pos;
    }
    return len;
  };

  const getPrevWord = (): string => {
    let end = out.length;
    while (end > 0 && isIdentChar(out.charCodeAt(end - 1))) end--;
    return out.slice(end).toLowerCase();
  };

  while (i < len) {
    const ch = css.charCodeAt(i);

    // 1. Comments /* ... */
    if (ch === 47 && i + 1 < len && css.charCodeAt(i + 1) === 42) {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) {
        // Malformed unclosed comment: preserve verbatim to avoid corrupting anything
        if (pendingSpace && out.length > 0) out += ' ';
        out += css.slice(i);
        return out;
      }
      i = end + 2;
      pendingSpace = true;
      continue;
    }

    // 2. Quoted strings
    if (ch === 34 || ch === 39) {
      if (pendingSpace && out.length > 0) {
        const prev = out.charCodeAt(out.length - 1);
        if (prev !== 58 && prev !== 44 && prev !== 40 && prev !== 123 && prev !== 59 && prev !== 61) {
          out += ' ';
        }
      }
      pendingSpace = false;
      const quote = ch;
      let j = i + 1;
      while (j < len) {
        const c = css.charCodeAt(j);
        if (c === 92 && j + 1 < len) {
          j += 2;
          continue;
        }
        if (c === quote) {
          j++;
          break;
        }
        j++;
      }
      if (j === len && css.charCodeAt(len - 1) !== quote) {
        // Malformed unclosed string: safe passthrough
        out += css.slice(i);
        return out;
      }
      out += css.slice(i, j);
      i = j;
      continue;
    }

    // 3. Whitespace
    if (isWs(ch)) {
      pendingSpace = true;
      i++;
      continue;
    }

    // 4. url(...) literal handling
    if ((ch === 117 || ch === 85) && css.slice(i, i + 4).toLowerCase() === 'url(' && (i === 0 || !isIdentChar(css.charCodeAt(i - 1)))) {
      if (pendingSpace && out.length > 0) {
        const prev = out.charCodeAt(out.length - 1);
        if (prev !== 58 && prev !== 44 && prev !== 40 && prev !== 123 && prev !== 59) {
          out += ' ';
        }
      }
      pendingSpace = false;
      let j = i + 4;
      while (j < len && isWs(css.charCodeAt(j))) j++;
      if (j < len && (css.charCodeAt(j) === 34 || css.charCodeAt(j) === 39)) {
        // Quoted url("...") — scan string then closing )
        const q = css.charCodeAt(j);
        const qStart = j;
        j++;
        while (j < len) {
          const c = css.charCodeAt(j);
          if (c === 92 && j + 1 < len) { j += 2; continue; }
          if (c === q) { j++; break; }
          j++;
        }
        const qEnd = j;
        while (j < len && isWs(css.charCodeAt(j))) j++;
        if (j < len && css.charCodeAt(j) === 41) {
          out += 'url(' + css.slice(qStart, qEnd) + ')';
          i = j + 1;
          continue;
        }
      } else {
        // Unquoted url(...)
        const uStart = j;
        while (j < len && css.charCodeAt(j) !== 41) {
          if (css.charCodeAt(j) === 92 && j + 1 < len) { j += 2; continue; }
          j++;
        }
        if (j < len && css.charCodeAt(j) === 41) {
          out += 'url(' + css.slice(uStart, j).trim() + ')';
          i = j + 1;
          continue;
        }
      }
      // Malformed url(: passthrough remainder
      out += css.slice(i);
      return out;
    }

    // 5. Punctuation & operators
    // Track '(' and ')' for calc/min/max/clamp
    if (ch === 40) {
      // '('
      const prevWord = getPrevWord();
      const isCalcFn = !pendingSpace && CALC_FN_NAMES.has(prevWord);
      parenIsCalc.push(isCalcFn);
      if (isCalcFn) calcDepth++;

      if (pendingSpace && out.length > 0) {
        const prev = out.charCodeAt(out.length - 1);
        // Preserve space before '(' after keywords like `and`, `or`, `not`, `@media`, `@supports`, `@container`, or `+`/`-` in calc
        if (prev === 43 || prev === 45 || isIdentChar(prev) || prev === 41 || prev === 44) {
          if (prev !== 44) out += ' ';
        }
      }
      pendingSpace = false;
      out += '(';
      i++;
      continue;
    }

    if (ch === 41) {
      // ')'
      const wasCalc = parenIsCalc.pop();
      if (wasCalc) calcDepth = Math.max(0, calcDepth - 1);
      pendingSpace = false;
      out += ')';
      i++;
      continue;
    }

    // Drop trailing semicolon right before '}'
    if (ch === 59) {
      // ';'
      pendingSpace = false;
      const nextPos = peekNextNonWs(i + 1);
      if (nextPos < len && css.charCodeAt(nextPos) === 125) {
        i++;
        continue;
      }
      out += ';';
      i++;
      continue;
    }

    // Punctuation that swallows surrounding spaces: '{', '}', ',', '>', '~'
    if (ch === 123 || ch === 125 || ch === 44 || ch === 62 || ch === 126) {
      pendingSpace = false;
      out += css[i];
      i++;
      continue;
    }

    // '+' inside calc() MUST keep spaces around binary '+' operator; outside calc() it's an adjacent sibling combinator
    if (ch === 43) {
      if (calcDepth > 0) {
        const hadSpaceBefore = pendingSpace;
        const hasSpaceAfter = i + 1 < len && isWs(css.charCodeAt(i + 1));
        if (hadSpaceBefore && hasSpaceAfter) {
          if (out.length > 0 && out.charCodeAt(out.length - 1) !== 32) {
            out += ' ';
          }
          out += '+ ';
          pendingSpace = false;
          i++;
          continue;
        }
        if (pendingSpace && out.length > 0 && out.charCodeAt(out.length - 1) !== 32) {
          out += ' ';
        }
        pendingSpace = false;
        out += '+';
        i++;
        continue;
      }
      pendingSpace = false;
      out += '+';
      i++;
      continue;
    }

    // '-' inside calc(): preserve spaces around binary '-' operator
    if (ch === 45 && calcDepth > 0) {
      const hadSpaceBefore = pendingSpace;
      const hasSpaceAfter = i + 1 < len && isWs(css.charCodeAt(i + 1));
      if (hadSpaceBefore && hasSpaceAfter) {
        if (out.length > 0 && out.charCodeAt(out.length - 1) !== 32) out += ' ';
        out += '- ';
        pendingSpace = false;
        i++;
        continue;
      }
    }

    // ':' — preserve space BEFORE ':' (for descendant pseudo selectors like `.a :hover` or `.a ::part(x)`),
    // but never emit unnecessary space AFTER ':' unless empty custom property value (`--x: ;`).
    if (ch === 58) {
      if (pendingSpace && out.length > 0) {
        const prev = out.charCodeAt(out.length - 1);
        if (prev !== 123 && prev !== 59 && prev !== 44 && prev !== 40 && prev !== 58 && prev !== 62 && prev !== 43 && prev !== 126) {
          out += ' ';
        }
      }
      pendingSpace = false;
      out += ':';
      // Check for CSS empty custom property `--foo: ;` where space is syntactically significant
      if (i + 1 < len && isWs(css.charCodeAt(i + 1))) {
        const nextPos = peekNextNonWs(i + 1);
        if (nextPos < len && (css.charCodeAt(nextPos) === 59 || css.charCodeAt(nextPos) === 125)) {
          // Check if property started with `--`
          const lastSep = Math.max(out.lastIndexOf(';'), out.lastIndexOf('{'));
          const propName = out.slice(lastSep + 1, out.length - 1).trim();
          if (propName.startsWith('--')) {
            out += ' ';
          }
        }
      }
      i++;
      continue;
    }

    // Normal character: emit single space if pending and needed
    if (pendingSpace && out.length > 0) {
      const prev = out.charCodeAt(out.length - 1);
      const noSpaceAfter =
        prev === 123 || // {
        prev === 125 || // }
        prev === 59 ||  // ;
        prev === 58 ||  // :
        prev === 44 ||  // ,
        prev === 40 ||  // (
        prev === 62 ||  // >
        prev === 126 || // ~
        (prev === 43 && calcDepth === 0) || // + combinator
        prev === 32;    // already space
      if (!noSpaceAfter) {
        out += ' ';
      }
    }
    pendingSpace = false;
    out += css[i];
    i++;
  }

  return out.trim();
}

/**
 * Strip CSS comments from a selector string while preserving strings.
 */
function stripCssComments(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const ch = text.charCodeAt(i);
    if (ch === 34 || ch === 39) {
      const q = ch;
      let j = i + 1;
      while (j < text.length) {
        if (text.charCodeAt(j) === 92 && j + 1 < text.length) { j += 2; continue; }
        if (text.charCodeAt(j) === q) { j++; break; }
        j++;
      }
      out += text.slice(i, j);
      i = j;
      continue;
    }
    if (ch === 47 && i + 1 < text.length && text.charCodeAt(i + 1) === 42) {
      const end = text.indexOf('*/', i + 2);
      if (end === -1) break;
      i = end + 2;
      continue;
    }
    out += text[i++];
  }
  return out;
}

/**
 * Split a CSS declaration block body into individual declarations with full
 * quote, parenthesis, and comment awareness so `url("data:image/svg+xml;utf8,...")`
 * is NEVER split at `;`.
 */
export interface CssDeclaration {
  prop: string;
  value: string;
  raw: string;
}

export function splitCssDeclarations(body: string): CssDeclaration[] {
  const decls: CssDeclaration[] = [];
  const len = body.length;
  let i = 0;
  let start = 0;
  let parenDepth = 0;

  const pushSlice = (end: number) => {
    const raw = body.slice(start, end);
    const cleaned = stripCssComments(raw).trim();
    if (!cleaned) return;
    const colonIdx = cleaned.indexOf(':');
    if (colonIdx === -1) return;
    const prop = cleaned.slice(0, colonIdx).trim();
    const value = cleaned.slice(colonIdx + 1).trim();
    if (prop) {
      decls.push({ prop, value, raw: raw.trim() });
    }
  };

  while (i < len) {
    const ch = body.charCodeAt(i);
    if (ch === 47 && i + 1 < len && body.charCodeAt(i + 1) === 42) {
      const end = body.indexOf('*/', i + 2);
      if (end === -1) break;
      i = end + 2;
      continue;
    }
    if (ch === 34 || ch === 39) {
      const q = ch;
      i++;
      while (i < len) {
        if (body.charCodeAt(i) === 92 && i + 1 < len) { i += 2; continue; }
        if (body.charCodeAt(i) === q) { i++; break; }
        i++;
      }
      continue;
    }
    if (ch === 40) {
      parenDepth++;
      i++;
      continue;
    }
    if (ch === 41) {
      if (parenDepth > 0) parenDepth--;
      i++;
      continue;
    }
    if (ch === 59 && parenDepth === 0) {
      pushSlice(i);
      start = i + 1;
      i++;
      continue;
    }
    i++;
  }
  if (start < len) {
    pushSlice(len);
  }
  return decls;
}

interface CssBlockNode {
  kind: 'rule' | 'at-rule';
  header: string;
  body: string;
  children: CssBlockNode[];
}

/**
 * Quote/comment/paren-aware CSS block parser for `theme.css` (handles top-level
 * rules and nested `@media` / `@supports` / `@container` / `@layer` blocks).
 */
function parseCssBlocks(css: string): CssBlockNode[] {
  const nodes: CssBlockNode[] = [];
  const len = css.length;
  let i = 0;

  while (i < len) {
    // Skip whitespace & comments before header
    while (i < len) {
      if (isWs(css.charCodeAt(i))) { i++; continue; }
      if (css.charCodeAt(i) === 47 && i + 1 < len && css.charCodeAt(i + 1) === 42) {
        const end = css.indexOf('*/', i + 2);
        if (end === -1) return nodes;
        i = end + 2;
        continue;
      }
      break;
    }
    if (i >= len) break;

    const headerStart = i;
    let parenDepth = 0;
    let foundBrace = false;

    while (i < len) {
      const ch = css.charCodeAt(i);
      if (ch === 47 && i + 1 < len && css.charCodeAt(i + 1) === 42) {
        const end = css.indexOf('*/', i + 2);
        if (end === -1) return nodes;
        i = end + 2;
        continue;
      }
      if (ch === 34 || ch === 39) {
        const q = ch;
        i++;
        while (i < len) {
          if (css.charCodeAt(i) === 92 && i + 1 < len) { i += 2; continue; }
          if (css.charCodeAt(i) === q) { i++; break; }
          i++;
        }
        continue;
      }
      if (ch === 40) { parenDepth++; i++; continue; }
      if (ch === 41) { if (parenDepth > 0) parenDepth--; i++; continue; }
      if (ch === 59 && parenDepth === 0) {
        // Statement at-rule like @charset / @import — keep as raw node if needed
        const raw = stripCssComments(css.slice(headerStart, i + 1)).trim();
        if (raw) {
          nodes.push({ kind: 'at-rule', header: raw, body: '', children: [] });
        }
        i++;
        break;
      }
      if (ch === 123 && parenDepth === 0) {
        foundBrace = true;
        break;
      }
      i++;
    }

    if (!foundBrace) continue;

    const header = stripCssComments(css.slice(headerStart, i)).trim();
    i++; // consume '{'
    const bodyStart = i;
    let braceDepth = 1;
    let hasNestedBraces = false;

    while (i < len && braceDepth > 0) {
      const ch = css.charCodeAt(i);
      if (ch === 47 && i + 1 < len && css.charCodeAt(i + 1) === 42) {
        const end = css.indexOf('*/', i + 2);
        if (end === -1) return nodes;
        i = end + 2;
        continue;
      }
      if (ch === 34 || ch === 39) {
        const q = ch;
        i++;
        while (i < len) {
          if (css.charCodeAt(i) === 92 && i + 1 < len) { i += 2; continue; }
          if (css.charCodeAt(i) === q) { i++; break; }
          i++;
        }
        continue;
      }
      if (ch === 123) {
        braceDepth++;
        hasNestedBraces = true;
      } else if (ch === 125) {
        braceDepth--;
        if (braceDepth === 0) break;
      }
      i++;
    }

    if (braceDepth !== 0) break;
    const body = css.slice(bodyStart, i);
    i++; // consume '}'

    if (header.startsWith('@') && hasNestedBraces) {
      nodes.push({
        kind: 'at-rule',
        header,
        body,
        children: parseCssBlocks(body),
      });
    } else {
      nodes.push({
        kind: 'rule',
        header,
        body,
        children: [],
      });
    }
  }

  return nodes;
}

/**
 * Extract the guaranteed-defined `--snice-*` token allowlist STRICTLY from
 * top-level unconditional `:root { ... }` rules in `theme.css`.
 * Excludes conditional `@media print { :root { ... } }`, `@media (prefers-reduced-motion: reduce)`,
 * `[data-theme="dark"]`, etc.
 */
export function extractTopLevelRootAllowlist(themeCss: string): Set<string> {
  const allowlist = new Set<string>();
  const topBlocks = parseCssBlocks(themeCss);
  for (const block of topBlocks) {
    if (block.kind !== 'rule') continue;
    const selectors = block.header.split(',').map((s) => s.trim());
    if (!selectors.includes(':root')) continue;
    for (const decl of splitCssDeclarations(block.body)) {
      if (decl.prop.startsWith('--snice-')) {
        allowlist.add(decl.prop);
      }
    }
  }
  return allowlist;
}

/**
 * Linear O(C) balanced-parenthesis `var(--snice-*, fallback)` fallback stripper.
 *
 * - Pre-matches parentheses in a single O(C) pass skipping comments and quoted strings.
 * - Rewrites `var(--token, <fallback>)` -> `var(--token)` ONLY when `--token` is in `allowlist`.
 * - Preserves `, <fallback>` for non-allowlisted tokens while recursively processing nested `var(...)`.
 * - Safe passthrough on malformed CSS (unbalanced `var(`, unclosed quote/comment): never infinite-loops
 *   and never corrupts valid neighboring rules.
 */
export function stripVarFallbacks(css: string, allowlist: ReadonlySet<string>): string {
  if (allowlist.size === 0) return css;
  if (!css.includes('var(') && !css.includes('VAR(') && !css.includes('Var(')) return css;

  const len = css.length;
  // Pass 1: O(C) parenthesis & first-comma pairing, skipping strings and comments.
  const closeMap = new Map<number, number>();
  const firstCommaMap = new Map<number, number>();
  const stack: number[] = [];
  let i = 0;

  while (i < len) {
    const ch = css.charCodeAt(i);
    if (ch === 47 && i + 1 < len && css.charCodeAt(i + 1) === 42) {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) break;
      i = end + 2;
      continue;
    }
    if (ch === 34 || ch === 39) {
      const q = ch;
      i++;
      while (i < len) {
        if (css.charCodeAt(i) === 92 && i + 1 < len) { i += 2; continue; }
        if (css.charCodeAt(i) === q) { i++; break; }
        i++;
      }
      continue;
    }
    if (ch === 40) {
      stack.push(i);
      i++;
      continue;
    }
    if (ch === 44 && stack.length > 0) {
      const openPos = stack[stack.length - 1];
      if (!firstCommaMap.has(openPos)) {
        firstCommaMap.set(openPos, i);
      }
      i++;
      continue;
    }
    if (ch === 41) {
      if (stack.length > 0) {
        const openPos = stack.pop()!;
        closeMap.set(openPos, i);
      }
      i++;
      continue;
    }
    i++;
  }

  let changed = false;

  const processRange = (start: number, end: number): string => {
    let out = '';
    let pos = start;
    while (pos < end) {
      const ch = css.charCodeAt(pos);

      // Preserve comments verbatim
      if (ch === 47 && pos + 1 < end && css.charCodeAt(pos + 1) === 42) {
        const cEnd = css.indexOf('*/', pos + 2);
        if (cEnd === -1 || cEnd + 2 > end) {
          out += css.slice(pos, end);
          return out;
        }
        out += css.slice(pos, cEnd + 2);
        pos = cEnd + 2;
        continue;
      }

      // Preserve quoted strings verbatim (handles content: "var(...)" and url("data:..."))
      if (ch === 34 || ch === 39) {
        const q = ch;
        let j = pos + 1;
        while (j < end) {
          if (css.charCodeAt(j) === 92 && j + 1 < end) { j += 2; continue; }
          if (css.charCodeAt(j) === q) { j++; break; }
          j++;
        }
        out += css.slice(pos, j);
        pos = j;
        continue;
      }

      // Detect `var(` not preceded by an identifier character
      if (
        (ch === 118 || ch === 86) &&
        pos + 4 <= end &&
        (css.charCodeAt(pos + 1) === 97 || css.charCodeAt(pos + 1) === 65) &&
        (css.charCodeAt(pos + 2) === 114 || css.charCodeAt(pos + 2) === 82) &&
        css.charCodeAt(pos + 3) === 40 &&
        (pos === start || !isIdentChar(css.charCodeAt(pos - 1)))
      ) {
        const openParen = pos + 3;
        const closeParen = closeMap.get(openParen);
        if (closeParen === undefined || closeParen >= end) {
          // Malformed unbalanced `var(`: pass through `var(` untouched without corrupting neighbors
          out += css.slice(pos, pos + 4);
          pos += 4;
          continue;
        }
        const commaPos = firstCommaMap.get(openParen);
        if (commaPos === undefined || commaPos >= closeParen) {
          // No fallback argument: copy verbatim
          out += css.slice(pos, closeParen + 1);
          pos = closeParen + 1;
          continue;
        }
        const rawToken = stripCssComments(css.slice(openParen + 1, commaPos)).trim();
        if (allowlist.has(rawToken)) {
          out += `var(${rawToken})`;
          changed = true;
          pos = closeParen + 1;
          continue;
        }
        // Non-allowlisted token: keep `, <fallback>`, recursively process nested `var(...)` in fallback!
        out += css.slice(pos, commaPos + 1);
        out += processRange(commaPos + 1, closeParen);
        out += ')';
        pos = closeParen + 1;
        continue;
      }

      out += css[pos++];
    }
    return out;
  };

  const result = processRange(0, len);
  return changed ? result : css;
}

/**
 * Collect all `--snice-*` token references AND dynamic `--snice-...-` prefixes
 * (such as `--snice-color-accent-` from `getAccentPalette`) from any text blob.
 */
export function collectReferencedSniceTokens(
  text: string,
  tokensOut: Set<string>,
  prefixesOut: Set<string>
): void {
  if (!text.includes('--snice-')) return;
  for (const m of text.matchAll(SNICE_TOKEN_RE)) {
    tokensOut.add(m[0]);
  }
  for (const m of text.matchAll(DYNAMIC_TOKEN_PREFIX_RE)) {
    prefixesOut.add(m[1]);
  }
  // Also catch string-literal dynamic prefixes like `getPropertyValue("--snice-color-accent-"+`
  // or `'--snice-color-accent-'` ending with `-`
  for (const tok of tokensOut) {
    if (tok.endsWith('-')) {
      prefixesOut.add(tok);
    }
  }
}

/**
 * Prune unused `--snice-*` declarations from `theme.css` using O(T + E)
 * cross-block transitive dependency closure across ALL blocks (`:root`,
 * `[data-theme="dark"]`, `@media (prefers-color-scheme: dark)`, density,
 * print, motion). Removes empty blocks cleanly.
 */
export function pruneThemeCss(
  themeCss: string,
  referencedTokens: ReadonlySet<string>,
  dynamicPrefixes: ReadonlySet<string>,
  safelist: readonly (string | RegExp)[] = []
): string {
  const blocks = parseCssBlocks(themeCss);

  // 1. Collect all declared --snice-* tokens and build cross-block dependency edges
  const allDeclared = new Set<string>();
  const deps = new Map<string, Set<string>>();

  const visitCollect = (nodes: CssBlockNode[]) => {
    for (const node of nodes) {
      if (node.kind === 'at-rule' && node.children.length > 0) {
        visitCollect(node.children);
        continue;
      }
      if (node.kind !== 'rule') continue;
      for (const decl of splitCssDeclarations(node.body)) {
        if (!decl.prop.startsWith('--snice-')) continue;
        allDeclared.add(decl.prop);
        let edgeSet = deps.get(decl.prop);
        if (!edgeSet) {
          edgeSet = new Set<string>();
          deps.set(decl.prop, edgeSet);
        }
        if (decl.value.includes('--snice-')) {
          for (const m of decl.value.matchAll(SNICE_TOKEN_RE)) {
            if (m[0] !== decl.prop) {
              edgeSet.add(m[0]);
            }
          }
        }
      }
    }
  };
  visitCollect(blocks);

  // 2. Seed BFS queue from referenced tokens, dynamic prefixes, and safelist
  const kept = new Set<string>();
  const queue: string[] = [];
  const enqueue = (token: string) => {
    if (!kept.has(token)) {
      kept.add(token);
      queue.push(token);
    }
  };

  for (const tok of referencedTokens) {
    if (allDeclared.has(tok)) enqueue(tok);
  }
  for (const declTok of allDeclared) {
    for (const prefix of dynamicPrefixes) {
      if (declTok.startsWith(prefix)) {
        enqueue(declTok);
        break;
      }
    }
    for (const entry of safelist) {
      if (typeof entry === 'string') {
        if (declTok === entry) {
          enqueue(declTok);
          break;
        }
      } else if (entry instanceof RegExp) {
        entry.lastIndex = 0;
        if (entry.test(declTok)) {
          enqueue(declTok);
          break;
        }
      }
    }
  }

  // 3. O(T + E) transitive closure across all blocks
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const nexts = deps.get(curr);
    if (!nexts) continue;
    for (const dep of nexts) {
      if (!kept.has(dep)) {
        kept.add(dep);
        queue.push(dep);
      }
    }
  }

  // 4. Reconstruct pruned CSS, dropping unreferenced --snice-* decls and empty blocks
  const emitBlocks = (nodes: CssBlockNode[]): string => {
    const parts: string[] = [];
    for (const node of nodes) {
      if (node.kind === 'at-rule') {
        if (node.children.length === 0) {
          if (node.header) parts.push(node.header);
          continue;
        }
        const inner = emitBlocks(node.children);
        if (inner) {
          parts.push(`${node.header}{${inner}}`);
        }
        continue;
      }
      const decls = splitCssDeclarations(node.body);
      const keptDecls: string[] = [];
      for (const decl of decls) {
        if (decl.prop.startsWith('--snice-')) {
          if (kept.has(decl.prop)) {
            keptDecls.push(`${decl.prop}:${decl.value}`);
          }
        } else {
          keptDecls.push(`${decl.prop}:${decl.value}`);
        }
      }
      if (keptDecls.length > 0) {
        parts.push(`${node.header}{${keptDecls.join(';')}}`);
      }
    }
    return parts.join('');
  };

  return emitBlocks(blocks);
}

export interface TransformCssModuleOptions {
  id: string;
  minifyCss: boolean;
}

export interface TransformCssModuleResult {
  code: string;
  map: any;
}

/**
 * Per-module Pass C1:
 * - Minifies inline Snice `css\`...\`` tagged templates (import-binding verified)
 * - Folds static `.css?inline` imports used in `css\`${cssContent}\`` into static zero-interpolation `css\`...\``
 * - Folds pre-built `dist/components/` static `var cssContent = "..."` + `css\`${cssContent}\`` into static `css\`...\``
 */
export function transformCssModule(
  code: string,
  options: TransformCssModuleOptions
): TransformCssModuleResult | null {
  if (!code.includes('css')) return null;

  let ast: AstNode;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'jsx',
        ['decorators', { decoratorsBeforeExport: true }],
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'importAttributes',
      ],
    });
  } catch {
    return null;
  }

  // 1. Collect Snice `css` import local names, static `.css?inline` default imports,
  //    and static top-level string-literal bindings (`var cssContent = "..."`).
  const sniceCssBindings = new Set<string>();
  const inlineCssImports = new Map<string, { specifier: string; stmt: AstNode; cssText: string }>();
  const staticStringDecls = new Map<string, { value: string; decl: AstNode; stmt: AstNode }>();
  const mutatedBindings = new Set<string>();
  const identifierRefCounts = new Map<string, number>();

  for (const stmt of ast.program.body) {
    if (stmt.type === 'ImportDeclaration') {
      const src = stmt.source?.value;
      if (typeof src !== 'string') continue;
      if (isSniceImportSource(src)) {
        for (const spec of stmt.specifiers) {
          if (spec.type === 'ImportSpecifier') {
            const imported = spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value;
            if (imported === 'css') {
              sniceCssBindings.add(spec.local.name);
            }
          }
        }
      } else if (/\.css\?inline$/.test(src)) {
        const defSpec = stmt.specifiers.find((sp: AstNode) => sp.type === 'ImportDefaultSpecifier');
        if (defSpec && stmt.specifiers.length === 1) {
          const cssRelPath = src.replace(/\?inline$/, '');
          const absPath = resolve(dirname(options.id), cssRelPath);
          if (existsSync(absPath)) {
            inlineCssImports.set(defSpec.local.name, {
              specifier: src,
              stmt,
              cssText: readFileSync(absPath, 'utf8'),
            });
          }
        }
      }
    } else if (stmt.type === 'VariableDeclaration') {
      for (const decl of stmt.declarations) {
        if (decl.id?.type === 'Identifier' && decl.init) {
          if (decl.init.type === 'StringLiteral') {
            staticStringDecls.set(decl.id.name, {
              value: decl.init.value,
              decl,
              stmt,
            });
          } else if (
            decl.init.type === 'TemplateLiteral' &&
            decl.init.expressions.length === 0 &&
            decl.init.quasis.length === 1 &&
            typeof decl.init.quasis[0].value.cooked === 'string'
          ) {
            staticStringDecls.set(decl.id.name, {
              value: decl.init.quasis[0].value.cooked,
              decl,
              stmt,
            });
          }
        }
      }
    }
  }

  if (sniceCssBindings.size === 0) return null;

  // 2. Walk AST to count references to candidate CSS bindings, detect mutations,
  //    and collect Snice `css` TaggedTemplateExpressions.
  const cssTags: AstNode[] = [];

  const walk = (node: AstNode, parent: AstNode | null, key: string | null) => {
    if (!isNode(node)) return;

    // Detect mutations (assignments or update expressions)
    if (node.type === 'AssignmentExpression' && node.left?.type === 'Identifier') {
      mutatedBindings.add(node.left.name);
    } else if (node.type === 'UpdateExpression' && node.argument?.type === 'Identifier') {
      mutatedBindings.add(node.argument.name);
    }

    // Track references to candidate bindings (excluding binding declaration sites & member property names)
    if (node.type === 'Identifier') {
      const name = node.name;
      if (inlineCssImports.has(name) || staticStringDecls.has(name)) {
        const isDeclSite =
          (parent?.type === 'ImportDefaultSpecifier' && key === 'local') ||
          (parent?.type === 'VariableDeclarator' && key === 'id') ||
          (parent?.type === 'MemberExpression' && key === 'property' && !parent.computed) ||
          (parent?.type === 'ObjectProperty' && key === 'key' && !parent.computed);
        if (!isDeclSite) {
          identifierRefCounts.set(name, (identifierRefCounts.get(name) ?? 0) + 1);
        }
      }
    }

    if (
      node.type === 'TaggedTemplateExpression' &&
      node.tag?.type === 'Identifier' &&
      sniceCssBindings.has(node.tag.name)
    ) {
      cssTags.push(node);
    }

    for (const k of Object.keys(node)) {
      if (k === 'loc' || k === 'start' || k === 'end' || k === 'leadingComments' || k === 'trailingComments' || k === 'innerComments') {
        continue;
      }
      const val = node[k];
      if (Array.isArray(val)) {
        for (const item of val) {
          if (isNode(item)) walk(item, node, k);
        }
      } else if (isNode(val)) {
        walk(val, node, k);
      }
    }
  };

  walk(ast.program, null, null);
  if (cssTags.length === 0) return null;

  const s = new MagicString(code);
  let changed = false;
  const foldedUses = new Map<string, number>();

  for (const tagExpr of cssTags) {
    const quasiNode = tagExpr.quasi;
    const quasis: AstNode[] = quasiNode.quasis;
    const expressions: AstNode[] = quasiNode.expressions;

    // Pattern 1: Static fold `css\`${cssContent}\`` where cssContent is an unmutated `.css?inline` or static string decl
    if (
      expressions.length === 1 &&
      expressions[0].type === 'Identifier' &&
      quasis.length === 2 &&
      quasis[0].value.cooked === '' &&
      quasis[1].value.cooked === ''
    ) {
      const bindingName = expressions[0].name;
      if (!mutatedBindings.has(bindingName)) {
        const inlineInfo = inlineCssImports.get(bindingName);
        const strInfo = staticStringDecls.get(bindingName);
        const rawCss = inlineInfo ? inlineInfo.cssText : strInfo ? strInfo.value : null;
        if (rawCss !== null) {
          const finalCss = options.minifyCss ? minifyCssText(rawCss) : rawCss;
          s.overwrite(quasiNode.start, quasiNode.end, `\`${escapeTemplateQuasi(finalCss)}\``);
          foldedUses.set(bindingName, (foldedUses.get(bindingName) ?? 0) + 1);
          changed = true;
          continue;
        }
      }
    }

    // Pattern 2: Inline `css\`...\`` minification
    if (!options.minifyCss) continue;

    if (expressions.length === 0 && quasis.length === 1) {
      const cooked = quasis[0].value.cooked;
      if (typeof cooked !== 'string') continue;
      const minified = minifyCssText(cooked);
      if (minified !== cooked) {
        s.overwrite(quasiNode.start, quasiNode.end, `\`${escapeTemplateQuasi(minified)}\``);
        changed = true;
      }
      continue;
    }

    // Interpolated `css\`...\``: join with unique placeholders, minify, split back
    const cookedParts: string[] = [];
    let valid = true;
    for (const q of quasis) {
      if (typeof q.value.cooked !== 'string') { valid = false; break; }
      cookedParts.push(q.value.cooked);
    }
    if (!valid) continue;

    const placeholders: string[] = [];
    let joined = cookedParts[0];
    for (let idx = 0; idx < expressions.length; idx++) {
      const ph = `__SNICE_CSS_PH_${idx}__`;
      placeholders.push(ph);
      joined += ph + cookedParts[idx + 1];
    }
    const minifiedJoined = minifyCssText(joined);
    // Split back by placeholders in exact order
    const newParts: string[] = [];
    let cursor = 0;
    let splitOk = true;
    for (const ph of placeholders) {
      const found = minifiedJoined.indexOf(ph, cursor);
      if (found === -1) { splitOk = false; break; }
      newParts.push(minifiedJoined.slice(cursor, found));
      cursor = found + ph.length;
    }
    if (!splitOk) continue;
    newParts.push(minifiedJoined.slice(cursor));
    if (newParts.length !== quasis.length) continue;

    let anyDiff = false;
    for (let idx = 0; idx < quasis.length; idx++) {
      if (newParts[idx] !== cookedParts[idx]) {
        anyDiff = true;
        s.overwrite(quasis[idx].start, quasis[idx].end, escapeTemplateQuasi(newParts[idx]));
      }
    }
    if (anyDiff) changed = true;
  }

  // Remove unused folded `.css?inline` imports and single-declarator `var cssContent = "..."` statements
  for (const [name, usedCount] of foldedUses) {
    if ((identifierRefCounts.get(name) ?? 0) !== usedCount) continue;
    const inlineInfo = inlineCssImports.get(name);
    if (inlineInfo) {
      s.remove(inlineInfo.stmt.start, inlineInfo.stmt.end);
      continue;
    }
    const strInfo = staticStringDecls.get(name);
    if (strInfo && strInfo.stmt.declarations.length === 1) {
      s.remove(strInfo.stmt.start, strInfo.stmt.end);
    }
  }

  if (!changed) return null;
  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  };
}

/**
 * Pass C2 (order-independent `renderChunk` transform):
 * Parses emitted JS chunk AST and strips allowlisted `var(--snice-*, fallback)` fallbacks
 * STRICTLY on decoded JS strings and template quasis (never raw chunk text!), preserving
 * exact JS escaping and accurate sourcemaps.
 */
export function stripChunkCssFallbacks(
  code: string,
  allowlist: ReadonlySet<string>
): { code: string; map: any } | null {
  if (allowlist.size === 0 || !code.includes('var(--snice-')) return null;

  let ast: AstNode;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['importAttributes'],
    });
  } catch {
    return null;
  }

  const s = new MagicString(code);
  let changed = false;

  const looksLikeCssStylesheet = (val: string): boolean => {
    return val.includes('var(--snice-') && val.includes(':') && (val.includes('{') || val.includes(';') || val.includes('}'));
  };

  const walk = (node: AstNode, insideTaggedTemplate: boolean) => {
    if (!isNode(node)) return;

    if (node.type === 'TaggedTemplateExpression') {
      walk(node.tag, false);
      walk(node.quasi, true);
      return;
    }

    if (node.type === 'TemplateLiteral') {
      const isCssCandidate =
        insideTaggedTemplate ||
        node.quasis.some((q: AstNode) => typeof q.value?.cooked === 'string' && looksLikeCssStylesheet(q.value.cooked));
      if (isCssCandidate) {
        for (const q of node.quasis) {
          const cooked = q.value?.cooked;
          if (typeof cooked === 'string' && cooked.includes('var(--snice-')) {
            const stripped = stripVarFallbacks(cooked, allowlist);
            if (stripped !== cooked) {
              s.overwrite(q.start, q.end, escapeTemplateQuasi(stripped));
              changed = true;
            }
          }
        }
      }
      for (const expr of node.expressions) {
        walk(expr, false);
      }
      return;
    }

    if (node.type === 'StringLiteral') {
      const val = node.value;
      if (typeof val === 'string' && looksLikeCssStylesheet(val)) {
        const stripped = stripVarFallbacks(val, allowlist);
        if (stripped !== val) {
          s.overwrite(node.start, node.end, JSON.stringify(stripped));
          changed = true;
        }
      }
      return;
    }

    for (const k of Object.keys(node)) {
      if (k === 'loc' || k === 'start' || k === 'end') continue;
      const val = node[k];
      if (Array.isArray(val)) {
        for (const item of val) {
          if (isNode(item)) walk(item, false);
        }
      } else if (isNode(val)) {
        walk(val, false);
      }
    }
  };

  walk(ast.program, false);
  if (!changed) return null;
  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  };
}

/**
 * Re-hash an emitted asset filename (`assets/snice-theme-<oldHash>.css` -> `assets/snice-theme-<newHash>.css`)
 * and update all references across HTML, JS chunks, manifests, and `viteMetadata.importedCss`.
 */
export function rehashBundleAsset(
  bundle: Record<string, any>,
  oldFileName: string,
  newSource: string
): string {
  const asset = bundle[oldFileName];
  if (!asset) return oldFileName;

  const newHash = createHash('sha256').update(newSource).digest('hex').slice(0, 8);
  const hashPattern = /^(.+)-([A-Za-z0-9_-]{8})(\.[^./]+)$/;
  const newFileName = hashPattern.test(oldFileName)
    ? oldFileName.replace(hashPattern, `$1-${newHash}$3`)
    : oldFileName;

  asset.source = newSource;
  if (newFileName === oldFileName) return oldFileName;

  delete bundle[oldFileName];
  asset.fileName = newFileName;
  bundle[newFileName] = asset;

  const oldBase = oldFileName.split('/').pop()!;
  const newBase = newFileName.split('/').pop()!;

  for (const [key, item] of Object.entries(bundle)) {
    if (key === newFileName) continue;
    if (item.type === 'asset') {
      if (typeof item.source === 'string' && item.source.includes(oldBase)) {
        item.source = item.source.replaceAll(oldFileName, newFileName).replaceAll(oldBase, newBase);
      }
    } else if (item.type === 'chunk') {
      if (typeof item.code === 'string' && item.code.includes(oldBase)) {
        item.code = item.code.replaceAll(oldFileName, newFileName).replaceAll(oldBase, newBase);
      }
      if (item.viteMetadata?.importedCss instanceof Set) {
        if (item.viteMetadata.importedCss.has(oldFileName)) {
          item.viteMetadata.importedCss.delete(oldFileName);
          item.viteMetadata.importedCss.add(newFileName);
        }
      }
    }
  }

  return newFileName;
}
