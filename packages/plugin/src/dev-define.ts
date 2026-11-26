/**
 * Lightweight, comment- and string-safe replacement of bare `__SNICE_DEV__`
 * identifiers for pure Rollup builds (where Vite's `define` is not active).
 */

function isIdentChar(code: number): boolean {
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    code === 95 || // _
    code === 36 // $
  );
}

const TARGET = '__SNICE_DEV__';

export function replaceSniceDevIdentifier(code: string, isDev: boolean): string | null {
  if (!code.includes(TARGET)) return null;

  const replacement = isDev ? 'true' : 'false';
  const len = code.length;
  let out = '';
  let lastEmit = 0;
  let changed = false;
  let i = 0;

  while (i < len) {
    const ch = code.charCodeAt(i);

    // Single-line comment
    if (ch === 47 && i + 1 < len && code.charCodeAt(i + 1) === 47) {
      i += 2;
      while (i < len && code.charCodeAt(i) !== 10 && code.charCodeAt(i) !== 13) i++;
      continue;
    }

    // Block comment
    if (ch === 47 && i + 1 < len && code.charCodeAt(i + 1) === 42) {
      i += 2;
      while (i + 1 < len && !(code.charCodeAt(i) === 42 && code.charCodeAt(i + 1) === 47)) i++;
      i += 2;
      continue;
    }

    // Quoted strings (' or ")
    if (ch === 39 || ch === 34) {
      const quote = ch;
      i++;
      while (i < len) {
        const c = code.charCodeAt(i);
        if (c === 92) {
          i += 2;
          continue;
        }
        if (c === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // Check bare `__SNICE_DEV__` match
    if (
      ch === 95 && // '_'
      code.startsWith(TARGET, i)
    ) {
      const before = i > 0 ? code.charCodeAt(i - 1) : 0;
      const after = i + TARGET.length < len ? code.charCodeAt(i + TARGET.length) : 0;
      // Skip if part of a larger identifier or property access (`.__SNICE_DEV__`)
      if (!isIdentChar(before) && before !== 46 && !isIdentChar(after)) {
        out += code.slice(lastEmit, i) + replacement;
        i += TARGET.length;
        lastEmit = i;
        changed = true;
        continue;
      }
    }

    i++;
  }

  if (!changed) return null;
  return out + code.slice(lastEmit);
}
