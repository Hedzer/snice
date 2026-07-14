/**
 * Declarative grammar-based code formatter for snice-code-block.
 *
 * Rules are defined in grammar JSON files under "formatters" section.
 * The engine scans code char by char, tracks string/comment context,
 * and applies newline/space/indent rules based on regex char classes.
 */

export interface FormatRules {
  tabSize?: number;
  useTabs?: boolean;
  newlineAfter?: string;
  newlineBefore?: string;
  spaceAfter?: string;
  spaceBefore?: string;
  spaceAround?: string;
  indent?: string;
  dedent?: string;
  trimTrailing?: boolean;
  collapseBlankLines?: number;
  skipStrings?: boolean;
  skipComments?: boolean;
}

/**
 * Format code using declarative rules.
 */
export function formatCode(code: string, rules: FormatRules): string {
  const tabSize = rules.tabSize ?? 2;
  const useTabs = rules.useTabs ?? false;
  const indentUnit = useTabs ? '\t' : ' '.repeat(tabSize);
  const trimTrailing = rules.trimTrailing ?? true;
  const skipStrings = rules.skipStrings ?? true;
  const skipComments = rules.skipComments ?? true;

  const newlineAfter = rules.newlineAfter ? new RegExp(rules.newlineAfter) : null;
  const newlineBefore = rules.newlineBefore ? new RegExp(rules.newlineBefore) : null;
  const spaceAfter = rules.spaceAfter ? new RegExp(rules.spaceAfter) : null;
  const spaceBefore = rules.spaceBefore ? new RegExp(rules.spaceBefore) : null;
  const spaceAround = rules.spaceAround ? new RegExp(rules.spaceAround) : null;
  const indentRe = rules.indent ? new RegExp(rules.indent) : null;
  const dedentRe = rules.dedent ? new RegExp(rules.dedent) : null;

  // Strip existing formatting: collapse whitespace outside strings/comments
  const stripped = stripWhitespace(code, skipStrings, skipComments);

  // Build formatted output
  let result = '';
  let depth = 0;
  let lineStart = true;
  let inString: string | null = null;
  let inComment = false; // block comment
  let inLineComment = false;

  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    const prev = i > 0 ? stripped[i - 1] : '';
    const next = i + 1 < stripped.length ? stripped[i + 1] : '';

    // Track string context
    if (!inComment && !inLineComment && skipStrings) {
      if (inString) {
        result += ch;
        if (ch === inString && prev !== '\\') {
          inString = null;
        }
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        inString = ch;
        if (lineStart) {
          result += indentUnit.repeat(depth);
          lineStart = false;
        }
        result += ch;
        continue;
      }
    }

    // Track comment context
    if (skipComments) {
      if (inLineComment) {
        result += ch;
        if (ch === '\n') {
          inLineComment = false;
          lineStart = true;
        }
        continue;
      }
      if (inComment) {
        result += ch;
        if (ch === '/' && prev === '*') {
          inComment = false;
        }
        continue;
      }
      if (ch === '/' && next === '/') {
        if (lineStart) {
          result += indentUnit.repeat(depth);
          lineStart = false;
        }
        inLineComment = true;
        result += ch;
        continue;
      }
      if (ch === '/' && next === '*') {
        if (lineStart) {
          result += indentUnit.repeat(depth);
          lineStart = false;
        }
        inComment = true;
        result += ch;
        continue;
      }
    }

    // Dedent before the char
    if (dedentRe && dedentRe.test(ch)) {
      depth = Math.max(0, depth - 1);
    }

    // Newline before
    if (newlineBefore && newlineBefore.test(ch)) {
      if (!lineStart) {
        result = trimTrailingSpaces(result);
        result += '\n';
        lineStart = true;
      }
    }

    // Space before (including spaceAround)
    if ((spaceBefore && spaceBefore.test(ch)) || (spaceAround && spaceAround.test(ch))) {
      if (!lineStart && result.length > 0 && result[result.length - 1] !== ' ' && result[result.length - 1] !== '\n') {
        result += ' ';
      }
    }

    // Write indent if at line start
    if (lineStart && ch !== '\n') {
      result += indentUnit.repeat(depth);
      lineStart = false;
    }

    result += ch;

    // Indent after the char
    if (indentRe && indentRe.test(ch)) {
      depth++;
    }

    // Space after (including spaceAround)
    if ((spaceAfter && spaceAfter.test(ch)) || (spaceAround && spaceAround.test(ch))) {
      if (next && next !== '\n' && next !== ' ') {
        result += ' ';
      }
    }

    // Newline after
    if (newlineAfter && newlineAfter.test(ch)) {
      result = trimTrailingSpaces(result);
      result += '\n';
      lineStart = true;
    }
  }

  // Post-processing
  let lines = result.split('\n');

  if (trimTrailing) {
    lines = lines.map(l => l.replace(/\s+$/, ''));
  }

  if (rules.collapseBlankLines !== undefined) {
    lines = collapseBlankLinesArr(lines, rules.collapseBlankLines);
  }

  // Trim leading/trailing blank lines
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

  return lines.join('\n');
}

/**
 * Strip existing whitespace: replace runs of whitespace (outside strings/comments)
 * with a single space, and remove all newlines.
 */
function stripWhitespace(code: string, skipStrings: boolean, skipComments: boolean): string {
  let result = '';
  let inString: string | null = null;
  let inComment = false;
  let inLineComment = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const prev = i > 0 ? code[i - 1] : '';
    const next = i + 1 < code.length ? code[i + 1] : '';

    // Track strings
    if (!inComment && !inLineComment && skipStrings) {
      if (inString) {
        result += ch;
        if (ch === inString && prev !== '\\') {
          inString = null;
        }
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        inString = ch;
        result += ch;
        continue;
      }
    }

    // Track comments
    if (skipComments) {
      if (inLineComment) {
        if (ch === '\n') {
          inLineComment = false;
          // Emit the newline so line comments stay separate
          result += ch;
        } else {
          result += ch;
        }
        continue;
      }
      if (inComment) {
        result += ch;
        if (ch === '/' && prev === '*') {
          inComment = false;
        }
        continue;
      }
      if (ch === '/' && next === '/') {
        inLineComment = true;
        result += ch;
        continue;
      }
      if (ch === '/' && next === '*') {
        inComment = true;
        result += ch;
        continue;
      }
    }

    // Collapse whitespace
    if (/\s/.test(ch)) {
      if (result.length > 0 && !/\s/.test(result[result.length - 1])) {
        result += ' ';
      }
    } else {
      result += ch;
    }
  }

  return result;
}

function trimTrailingSpaces(s: string): string {
  let end = s.length;
  while (end > 0 && s[end - 1] === ' ') end--;
  return s.slice(0, end);
}

function collapseBlankLinesArr(lines: string[], max: number): string[] {
  const result: string[] = [];
  let blankCount = 0;

  for (const line of lines) {
    if (line.trim() === '') {
      blankCount++;
      if (blankCount <= max) {
        result.push(line);
      }
    } else {
      blankCount = 0;
      result.push(line);
    }
  }

  return result;
}
