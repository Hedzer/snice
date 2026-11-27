/**
 * Extracts CSS shadow part names from component source text.
 *
 * Templates interpolate part values, so a naive `part\s*=\s*["']([^"']+)["']`
 * scrape truncates at the first quote inside a `${...}` hole and emits garbage
 * (`${isActive`, `?`, `${{`, `added:`). This reader keeps holes intact and
 * collapses them to the part-shaped string literals they can produce.
 *
 * Handled shapes:
 *   - `part="a b"`                          -> a, b
 *   - `part="a${on ? ' a-on' : ''}"`        -> a, a-on
 *   - `part="a ${on ? 'a-on' : ''}"`        -> a, a-on
 *   - `part=${expression}`                  -> every part-shaped literal inside
 *   - `part="${{a: 'x-a'}[value]}"`         -> x-a
 *   - `part="${ownPart}"`                   -> one hop through a local binding
 *   - `exportparts="base: x-base, label"`   -> x-base, label (exported names)
 *   - `el.setAttribute('part', 'a b')`      -> a, b (imperative templates)
 *
 * Deliberately NOT a part: the CSS attribute-selector form `[part="header"]`,
 * with or without whitespace (`[ part = "x" ]`). Inline `css\`` blocks and
 * `@query('[part="x"]')` selectors *consume* parts; they never expose one.
 * Counting them made a component's own dead stylesheet rule advertise a part
 * that nothing in the template ever renders.
 *
 * Also not a part: anything inside a comment. A `part="x"` that someone
 * commented out renders nothing, but the docs-alignment test would still demand
 * a doc entry for it — an undocumentable part name. See `stripComments` for the
 * (deliberately conservative) rule and its limits.
 */

/** A CSS shadow part name: lowercase kebab-case, nothing else. */
export const PART_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** String literals that may carry part names. Anything else is not a part list. */
const PART_LITERAL = /^[a-z0-9\s-]+$/;

/** `exportparts` values additionally carry the `inner: outer, inner: outer` grammar. */
const EXPORTPARTS_LITERAL = /^[a-z0-9\s:,-]+$/;

/**
 * Blank out comments so a commented-out `part="x"` stops advertising a part.
 *
 * Source text here is a mix of TypeScript and the HTML/CSS living inside its
 * template literals, and this reader has no parser for either — so the rule is
 * deliberately conservative and anchored to the start of a line:
 *
 *   - a line whose first non-whitespace is `//` is blanked whole;
 *   - a `/* ... *\/` block whose opener is the first non-whitespace on its line
 *     is blanked through its closer.
 *
 * Anchoring to line start is what keeps string and template literals safe: a
 * URL's `//`, a `'a // b'` literal, and the repo-wide `html/*html*\/\`` marker
 * all sit mid-line, so none of them are touched.
 *
 * The limitation is the mirror image: a trailing `// part="x"` after code on the
 * same line, and a block comment opened mid-line, are NOT stripped, so a part
 * commented out that way is still counted. Put such a comment on its own line.
 * Blanking preserves length and newlines, so nothing else here shifts.
 */
function stripComments(source) {
  const lines = source.split('\n');
  const blank = line => ' '.repeat(line.length);
  let inBlock = false;
  return lines.map((line, index) => {
    if (inBlock) {
      const close = line.indexOf('*/');
      if (close === -1) return blank(line);
      inBlock = false;
      return blank(line.slice(0, close + 2)) + line.slice(close + 2);
    }
    const trimmed = line.trimStart();
    if (trimmed.startsWith('//')) return blank(line);
    if (!trimmed.startsWith('/*')) return line;
    const start = line.length - trimmed.length;
    const close = line.indexOf('*/', start + 2);
    if (close !== -1) return blank(line.slice(0, close + 2)) + line.slice(close + 2);
    // Unterminated on this line: only open a block if it really closes later.
    if (!lines.slice(index + 1).some(rest => rest.includes('*/'))) return line;
    inBlock = true;
    return blank(line);
  }).join('\n');
}

/** Index of the closer matching the opener at `start`, or -1. */
function scanBalanced(source, start, open, close) {
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (char === '\\') { i++; continue; }
    if (char === open) depth++;
    else if (char === close && --depth === 0) return i;
  }
  return -1;
}

/**
 * Read a quoted attribute value starting at `start`, keeping `${...}` holes
 * intact. The holes may contain quotes of the same kind, so a plain
 * "scan to the next quote" would truncate `part="a ${x ? 'b' : ''}"`.
 */
function readQuotedValue(source, start, quote) {
  let value = '';
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (char === '\\') { value += source.slice(i, i + 2); i++; continue; }
    if (char === quote) return { value, end: i };
    if (char === '$' && source[i + 1] === '{') {
      const end = scanBalanced(source, i + 1, '{', '}');
      if (end === -1) return null;
      value += source.slice(i, end + 1);
      i = end;
      continue;
    }
    value += char;
  }
  return null;
}

/** True when the attribute name at `start` is opened by `[`, whitespace aside. */
function openedByBracket(source, start) {
  let i = start - 1;
  while (i >= 0 && /\s/.test(source[i])) i--;
  return source[i] === '[';
}

/** Every string literal in an expression whose content can name parts. */
function stringLiterals(expression, allowed) {
  const literals = [];
  const pattern = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  let match;
  while ((match = pattern.exec(expression))) {
    const text = match[2];
    if (text.length > 0 && allowed.test(text)) literals.push(text);
  }
  return literals;
}

/** Single-line `const`/`let`/`var` initializers, for one hop of name resolution. */
function localBindings(source) {
  const bindings = new Map();
  const pattern = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=([^\n]*)/g;
  let match;
  while ((match = pattern.exec(source))) {
    if (!bindings.has(match[1])) bindings.set(match[1], match[2]);
  }
  return bindings;
}

/**
 * Collapse an attribute value to plain text: static text survives as written,
 * and every `${...}` hole becomes the string literals it can produce. A hole
 * that holds no literal of its own (`part="message ${ownPart}"`) is resolved
 * one hop through a local binding in the same source.
 */
function flattenAttributeValue(raw, allowed, bindings) {
  let flat = '';
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '$' && raw[i + 1] === '{') {
      const end = scanBalanced(raw, i + 1, '{', '}');
      if (end === -1) break;
      const expression = raw.slice(i + 2, end);
      const literals = stringLiterals(expression, allowed);
      if (literals.length === 0) {
        for (const identifier of expression.match(/[A-Za-z_$][\w$]*/g) ?? []) {
          const initializer = bindings.get(identifier);
          if (initializer) literals.push(...stringLiterals(initializer, allowed));
        }
      }
      flat += ` ${literals.join(' ')} `;
      i = end;
      continue;
    }
    flat += raw[i];
  }
  return flat;
}

/**
 * Part tokens a component's own source exposes to page CSS. Every returned
 * token is a valid kebab-case part name; interpolation syntax never leaks.
 *
 * @param {string} source component source text
 * @returns {Set<string>} part names
 */
export function extractPartTokens(rawSource) {
  const source = stripComments(rawSource);
  const tokens = new Set();
  const bindings = localBindings(source);

  const addParts = raw => {
    for (const token of flattenAttributeValue(raw, PART_LITERAL, bindings).split(/\s+/)) {
      if (PART_NAME.test(token)) tokens.add(token);
    }
  };

  const addExportedParts = raw => {
    for (const entry of flattenAttributeValue(raw, EXPORTPARTS_LITERAL, bindings).split(',')) {
      const exported = (entry.includes(':') ? entry.slice(entry.indexOf(':') + 1) : entry).trim();
      if (PART_NAME.test(exported)) tokens.add(exported);
    }
  };

  const attribute = /(?:^|([^\w-]))(exportparts|part)\s*=\s*/g;
  let match;
  while ((match = attribute.exec(source))) {
    // `[part="header"]` is a selector matching a part, not a declaration of one.
    // Scan back past whitespace so the spaced form `[ part = "x" ]` skips too.
    if (openedByBracket(source, match.index + (match[1] === undefined ? 0 : 1))) continue;
    const at = match.index + match[0].length;
    const add = match[2] === 'part' ? addParts : addExportedParts;
    const char = source[at];
    if (char === '"' || char === "'") {
      const quoted = readQuotedValue(source, at + 1, char);
      if (quoted) { add(quoted.value); attribute.lastIndex = quoted.end; }
    } else if (char === '$' && source[at + 1] === '{') {
      const end = scanBalanced(source, at + 1, '{', '}');
      if (end !== -1) { add(source.slice(at, end + 1)); attribute.lastIndex = end; }
    }
  }

  const call = /setAttribute\(\s*(['"])(part|exportparts)\1\s*,/g;
  while ((match = call.exec(source))) {
    const openParen = source.indexOf('(', match.index);
    const end = scanBalanced(source, openParen, '(', ')');
    if (end === -1) continue;
    const argument = source.slice(match.index + match[0].length, end);
    const isPart = match[2] === 'part';
    const literals = stringLiterals(argument, isPart ? PART_LITERAL : EXPORTPARTS_LITERAL).join(' ');
    if (isPart) addParts(literals); else addExportedParts(literals);
    call.lastIndex = end;
  }

  return tokens;
}
