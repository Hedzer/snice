/**
 * Zero-dependency indent normalizer for snice-code-block
 *
 * Re-indents code by tracking brace/bracket/paren nesting depth.
 * Useful for quick formatting without external dependencies.
 *
 * @example
 * ```typescript
 * import { createIndentFormatter } from './formatters/indent';
 *
 * const formatter = createIndentFormatter({ tabSize: 2 });
 * codeBlock.setFormatter(formatter);
 * codeBlock.format = true;
 * ```
 */

import type { FormatterFunction } from '../snice-code-block.types';

export interface IndentFormatterOptions {
  tabSize?: number;
  useTabs?: boolean;
}

const OPEN_CHARS: Record<string, string> = { '{': '}', '[': ']', '(': ')' };
const CLOSE_CHARS = new Set(['}', ']', ')']);

/**
 * Create an indent normalizer formatter.
 * Strips existing indentation, then re-indents based on nesting.
 */
export function createIndentFormatter(options?: IndentFormatterOptions): FormatterFunction {
  const tabSize = options?.tabSize ?? 2;
  const useTabs = options?.useTabs ?? false;
  const indentUnit = useTabs ? '\t' : ' '.repeat(tabSize);

  return (code: string, language: string) => {
    const lines = code.split('\n');
    const result: string[] = [];
    let depth = 0;

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        result.push('');
        continue;
      }

      // Count close chars at start of line to dedent before printing
      const leadingCloses = countLeadingCloses(trimmed);
      depth = Math.max(0, depth - leadingCloses);

      result.push(indentUnit.repeat(depth) + trimmed);

      // Track nesting changes for next line
      depth += netDepthChange(trimmed, language);
      depth = Math.max(0, depth);
    }

    return result.join('\n');
  };
}

function countLeadingCloses(line: string): number {
  let count = 0;
  for (const ch of line) {
    if (CLOSE_CHARS.has(ch)) count++;
    else break;
  }
  return count;
}

function netDepthChange(line: string, language: string): number {
  let change = 0;
  let inString: string | null = null;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const prev = i > 0 ? line[i - 1] : '';

    // Skip escaped characters
    if (prev === '\\') continue;

    // Track strings
    if (inString) {
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }
    if (ch === '`') {
      inString = '`';
      continue;
    }

    // Skip single-line comments
    if (ch === '/' && i + 1 < line.length && line[i + 1] === '/') break;
    // Skip HTML comments
    if (language === 'html' && ch === '<' && line.slice(i, i + 4) === '<!--') break;

    if (OPEN_CHARS[ch]) change++;
    else if (CLOSE_CHARS.has(ch)) change--;
  }

  return change;
}
