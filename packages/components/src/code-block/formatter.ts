/**
 * Declarative grammar-based code formatter for snice-code-block.
 *
 * Rules are defined in grammar JSON files under "formatters" section.
 * The engine scans code char by char, tracks string/comment context,
 * and applies newline/space/indent rules based on regex char classes.
 *
 * Semantics: a code display formats authored code — it does not re-flow it.
 * Author line breaks are preserved; rule-driven newlines fire only where
 * they do not duplicate an author break and are suppressed inside
 * parentheses/bracket depth. Leading indentation is renormalized from the
 * indent/dedent char-class depth.
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
  const skipStrings = rules.skipStrings ?? true;
  const skipComments = rules.skipComments ?? true;

  const newlineAfter = rules.newlineAfter ? new RegExp(rules.newlineAfter) : null;
  const newlineBefore = rules.newlineBefore ? new RegExp(rules.newlineBefore) : null;
  const spaceAfter = rules.spaceAfter ? new RegExp(rules.spaceAfter) : null;
  const spaceBefore = rules.spaceBefore ? new RegExp(rules.spaceBefore) : null;
  const spaceAround = rules.spaceAround ? new RegExp(rules.spaceAround) : null;
  const indentRe = rules.indent ? new RegExp(rules.indent) : null;
  const dedentRe = rules.dedent ? new RegExp(rules.dedent) : null;

  // Chars whose newline rules stay active inside […] depth: JSON-style
  // structural brackets and separators must keep exploding one-liners.
  const bracketExemptRe = /[[\],]/;

  const lines: string[] = [];
  let line = '';
  let lineHasContent = false;
  let needIndent = false;
  // True while the current line begins inside a string/block comment: its
  // content is emitted verbatim, never re-indented or rule-processed.
  let inContinuation = false;
  let pendingSpace = false;
  let depth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  // One flag per open indent group: did a line break occur inside it? A
  // closing char only starts its own line when the group it closes is
  // multi-line, so `import { a } from 'x'` never breaks.
  const brokenGroups: boolean[] = [];

  let inString: string | null = null;
  let inBlockComment = false;
  let inLineComment = false;

  /** Rule-driven newlines are suppressed inside () or (for non-bracket
   *  chars) inside [], so `({ ... })`, `f([a, b])` and `for (;;)` never
   *  explode. */
  const newlineSuppressed = (ch: string): boolean => {
    if (parenDepth > 0) return true;
    if (bracketDepth > 0 && !bracketExemptRe.test(ch)) return true;
    return false;
  };

  const beginLine = (): void => {
    line = '';
    lineHasContent = false;
    needIndent = true;
    pendingSpace = false;
    inContinuation = inString !== null || inBlockComment;
    if (brokenGroups.length > 0) brokenGroups[brokenGroups.length - 1] = true;
  };

  const endLine = (): void => {
    lines.push(line.replace(/[ \t]+$/, ''));
    beginLine();
  };

  const appendContent = (ch: string): void => {
    if (needIndent) {
      needIndent = false;
      // Current depth, not a line-start snapshot: a dedent char re-indents
      // its own line (the closing brace drops back before being written).
      if (!inContinuation) line += indentUnit.repeat(depth);
    }
    if (pendingSpace) {
      line += ' ';
      pendingSpace = false;
    }
    line += ch;
    lineHasContent = true;
  };

  beginLine();

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = i + 1 < code.length ? code[i + 1] : '';

    // Line comment content: verbatim until the author newline
    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
        endLine();
      } else {
        appendContent(ch);
      }
      continue;
    }

    // Block comment content: verbatim, may span lines
    if (inBlockComment) {
      if (ch === '\n') {
        endLine();
        continue;
      }
      appendContent(ch);
      if (ch === '/' && code[i - 1] === '*') inBlockComment = false;
      continue;
    }

    // String content: verbatim, may span lines (template literals)
    if (inString) {
      if (ch === '\n') {
        endLine();
        continue;
      }
      appendContent(ch);
      if (ch === inString && code[i - 1] !== '\\') inString = null;
      continue;
    }

    // Entering a string
    if (skipStrings && (ch === '"' || ch === "'" || ch === '`')) {
      inString = ch;
      appendContent(ch);
      continue;
    }

    // Entering a comment
    if (skipComments) {
      if (ch === '/' && next === '/') {
        inLineComment = true;
        appendContent(ch);
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        appendContent(ch);
        continue;
      }
    }

    // Author newline: preserved
    if (ch === '\n') {
      endLine();
      continue;
    }
    if (ch === '\r') {
      if (next !== '\n') endLine();
      continue;
    }

    // Whitespace within a line: collapsed to a single pending space;
    // leading indentation is dropped (renormalized from depth)
    if (ch === ' ' || ch === '\t') {
      if (lineHasContent) pendingSpace = true;
      continue;
    }

    // Bracket/paren depth (outside strings/comments)
    if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);

    // Dedent before the char; a closer pops its group's multi-line flag
    let closesBrokenGroup = false;
    if (dedentRe && dedentRe.test(ch)) {
      depth = Math.max(0, depth - 1);
      closesBrokenGroup = brokenGroups.pop() ?? false;
    }

    // Newline before (only where it does not duplicate an author break, and
    // for closers only when the group being closed is multi-line)
    if (
      newlineBefore && newlineBefore.test(ch) && lineHasContent &&
      !newlineSuppressed(ch) && (!dedentRe || !dedentRe.test(ch) || closesBrokenGroup)
    ) {
      endLine();
    }

    // Space before (including spaceAround). A rule char glued to a
    // preceding operator char is a compound operator (`+=`, `===`), not a
    // fresh token — it keeps its left side.
    const prevRaw = i > 0 ? code[i - 1] : '';
    const partOfOperator = prevRaw !== '' && !/[ \t\n\r]/.test(prevRaw) && /[+\-*/%=<>!&|^~?:]/.test(prevRaw);
    if (
      ((spaceBefore && spaceBefore.test(ch)) || (spaceAround && spaceAround.test(ch))) &&
      lineHasContent && !partOfOperator
    ) {
      pendingSpace = true;
    }

    appendContent(ch);

    // Indent after the char
    if (indentRe && indentRe.test(ch)) {
      depth++;
      brokenGroups.push(false);
    }

    // Space after (including spaceAround). An `=` directly followed by
    // another `=` is an equality chain and `=>` is an arrow — not two tokens.
    if ((spaceAfter && spaceAfter.test(ch)) || (spaceAround && spaceAround.test(ch))) {
      const continuesOperator = ch === '=' && (next === '=' || next === '>');
      if (next && next !== ' ' && next !== '\t' && next !== '\n' && next !== '\r' && !continuesOperator) {
        pendingSpace = true;
      }
    }

    // Newline after: fires only where it does not duplicate an author
    // break or detach a same-line trailing comment
    if (newlineAfter && newlineAfter.test(ch) && !newlineSuppressed(ch)) {
      let j = i + 1;
      while (j < code.length && (code[j] === ' ' || code[j] === '\t')) j++;
      const ahead = j < code.length ? code[j] : '';
      const atAuthorBreak = ahead === '' || ahead === '\n' || ahead === '\r';
      const atTrailingComment = ahead === '/' && (code[j + 1] === '/' || code[j + 1] === '*');
      if (!atAuthorBreak && !atTrailingComment) {
        endLine();
      }
    }
  }

  lines.push(line.replace(/[ \t]+$/, ''));

  // Post-processing
  let out = lines;

  if (rules.trimTrailing ?? true) {
    out = out.map(l => l.replace(/[ \t]+$/, ''));
  }

  if (rules.collapseBlankLines !== undefined) {
    out = collapseBlankLinesArr(out, rules.collapseBlankLines);
  }

  // Trim leading/trailing blank lines
  while (out.length > 0 && out[0].trim() === '') out.shift();
  while (out.length > 0 && out[out.length - 1].trim() === '') out.pop();

  return out.join('\n');
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
