import { parse } from '@babel/parser';
import MagicString from 'magic-string';

type AstNode = Record<string, any>;

const RAW_WHITESPACE_TAGS = new Set(['pre', 'code', 'textarea', 'script', 'style']);

const BLOCK_STRUCTURAL_TAGS = new Set([
  'div', 'section', 'header', 'footer', 'main', 'nav', 'aside', 'article',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot',
  'tr', 'td', 'th', 'caption', 'colgroup', 'col', 'form', 'fieldset', 'legend',
  'dialog', 'details', 'summary', 'figure', 'figcaption', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'p', 'hr', 'br', 'select', 'option', 'optgroup', 'datalist',
  'if', 'else-if', 'else', 'case', 'when', 'default', 'slot', 'template',
  'svg', 'g', 'defs', 'clippath', 'mask', 'lineargradient', 'radialgradient',
  'stop', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon',
]);

function isWs(code: number): boolean {
  return code === 32 || code === 9 || code === 10 || code === 13 || code === 12;
}

function escapeTemplateQuasi(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

function isNode(v: unknown): v is AstNode {
  return typeof v === 'object' && v !== null && typeof (v as any).type === 'string';
}

/**
 * Linear O(L) cross-quasi HTML/SVG template minifier.
 *
 * Preserves:
 * - Exact quasi count & interpolation order
 * - Verbatim whitespace inside <pre>, <code>, <textarea>, <script>, <style>
 * - Quoted attribute values verbatim
 * - Separating space after unquoted `attr=${expr}` before next attribute or `/>`
 * - Meaningful inline spacing (`<span>A</span> <span>B</span>`, `Hello ${name}`)
 * - Dynamic comments (`<!-- ${expr} -->`) while stripping static comments (`<!-- ... -->`)
 *
 * Returns `null` on unclosed raw tags or ambiguous markup (safe fallback).
 */
export function minifyHtmlQuasis(quasis: readonly string[]): string[] | null {
  const out: string[] = [];
  const rawTagStack: string[] = [];
  let inTag = false;
  let quoteChar = '';
  let inComment = false;
  let afterUnquotedAttrExpr = false;
  let lastClosedTag = '';
  let currentOpenTag = '';

  for (let q = 0; q < quasis.length; q++) {
    const src = quasis[q];
    const len = src.length;
    let buf = '';
    let i = 0;

    // If previous quasi ended with an unquoted `attr=` before `${expr}`,
    // protect separating whitespace at the start of this quasi before `/>` or next attr!
    if (afterUnquotedAttrExpr && inTag && !quoteChar && rawTagStack.length === 0) {
      let wsEnd = 0;
      while (wsEnd < len && isWs(src.charCodeAt(wsEnd))) wsEnd++;
      if (wsEnd > 0) {
        const nextCh = wsEnd < len ? src[wsEnd] : '';
        // Only safe to drop whitespace before plain `>`, NEVER before `/>` or another attribute
        if (nextCh === '>') {
          i = wsEnd;
        } else {
          buf += ' ';
          i = wsEnd;
        }
      }
      afterUnquotedAttrExpr = false;
    }

    while (i < len) {
      // 1. Inside dynamic comment that started in an earlier quasi
      if (inComment) {
        const closeIdx = src.indexOf('-->', i);
        if (closeIdx === -1) {
          buf += src.slice(i);
          i = len;
        } else {
          buf += src.slice(i, closeIdx + 3);
          i = closeIdx + 3;
          inComment = false;
        }
        continue;
      }

      // 2. Inside raw whitespace-sensitive tag (<pre>, <code>, <textarea>, <script>, <style>)
      if (rawTagStack.length > 0) {
        const expectedClose = rawTagStack[rawTagStack.length - 1];
        const lt = src.indexOf('<', i);
        if (lt === -1) {
          buf += src.slice(i);
          i = len;
          continue;
        }
        buf += src.slice(i, lt);
        i = lt;
        // Check for closing tag `</tag>` or nested opening `<tag` of same raw tag
        if (src[i + 1] === '/') {
          let nameEnd = i + 2;
          while (nameEnd < len && /[A-Za-z0-9-]/.test(src[nameEnd])) nameEnd++;
          const closeName = src.slice(i + 2, nameEnd).toLowerCase();
          const gt = src.indexOf('>', nameEnd);
          if (closeName === expectedClose && gt !== -1) {
            buf += src.slice(i, gt + 1);
            i = gt + 1;
            rawTagStack.pop();
            lastClosedTag = closeName;
            continue;
          }
        } else if (/[A-Za-z]/.test(src[i + 1] || '')) {
          let nameEnd = i + 1;
          while (nameEnd < len && /[A-Za-z0-9-]/.test(src[nameEnd])) nameEnd++;
          const openName = src.slice(i + 1, nameEnd).toLowerCase();
          if (RAW_WHITESPACE_TAGS.has(openName)) {
            const gt = src.indexOf('>', nameEnd);
            if (gt !== -1 && src[gt - 1] !== '/') {
              buf += src.slice(i, gt + 1);
              i = gt + 1;
              rawTagStack.push(openName);
              continue;
            }
          }
        }
        buf += src[i++];
        continue;
      }

      // 3. Inside quoted attribute value: preserve verbatim
      if (quoteChar) {
        const endQ = src.indexOf(quoteChar, i);
        if (endQ === -1) {
          buf += src.slice(i);
          i = len;
        } else {
          buf += src.slice(i, endQ + 1);
          i = endQ + 1;
          quoteChar = '';
        }
        continue;
      }

      // 4. Inside an opening/closing tag (outside quotes)
      if (inTag) {
        const ch = src[i];
        if (ch === '"' || ch === "'") {
          quoteChar = ch;
          buf += ch;
          i++;
          continue;
        }
        if (ch === '>') {
          // Remove trailing single space right before plain `>` (not `/>` after unquoted expr)
          if (buf.endsWith(' ') && !buf.endsWith('= ')) {
            buf = buf.slice(0, -1);
          }
          const selfClosing = buf.endsWith('/');
          buf += '>';
          i++;
          inTag = false;
          if (!selfClosing && RAW_WHITESPACE_TAGS.has(currentOpenTag)) {
            rawTagStack.push(currentOpenTag);
          }
          lastClosedTag = currentOpenTag;
          currentOpenTag = '';
          continue;
        }
        if (isWs(src.charCodeAt(i))) {
          let wsEnd = i + 1;
          while (wsEnd < len && isWs(src.charCodeAt(wsEnd))) wsEnd++;
          const nextCh = wsEnd < len ? src[wsEnd] : '';
          if (nextCh === '>') {
            // Safe to drop space before plain `>`
            i = wsEnd;
          } else if (wsEnd === len && q < quasis.length - 1) {
            // Whitespace right before `${expr}` inside tag:
            // Preserve one space (needed for `<if ${cond}>`, `<div ${...}>`, etc.)
            if (!buf.endsWith(' ') && !buf.endsWith('=')) buf += ' ';
            i = wsEnd;
          } else {
            if (!buf.endsWith(' ') && !buf.endsWith('<')) buf += ' ';
            i = wsEnd;
          }
          continue;
        }
        buf += ch;
        i++;
        continue;
      }

      // 5. Outside any tag (normal HTML text / markup)
      const ch = src[i];
      if (ch === '<') {
        // HTML comment
        if (src.startsWith('<!--', i)) {
          const closeIdx = src.indexOf('-->', i + 4);
          if (closeIdx !== -1) {
            // Static comment wholly within this quasi -> strip!
            i = closeIdx + 3;
            continue;
          }
          // Comment spans into next quasi (dynamic CommentPart) -> keep!
          inComment = true;
          buf += src.slice(i);
          i = len;
          continue;
        }
        if (/[A-Za-z!/?]/.test(src[i + 1] || '')) {
          inTag = true;
          if (src[i + 1] === '/') {
            let nameEnd = i + 2;
            while (nameEnd < len && /[A-Za-z0-9-]/.test(src[nameEnd])) nameEnd++;
            currentOpenTag = '';
            lastClosedTag = src.slice(i + 2, nameEnd).toLowerCase();
          } else if (/[A-Za-z]/.test(src[i + 1])) {
            let nameEnd = i + 1;
            while (nameEnd < len && /[A-Za-z0-9-]/.test(src[nameEnd])) nameEnd++;
            currentOpenTag = src.slice(i + 1, nameEnd).toLowerCase();
          } else {
            currentOpenTag = '';
          }
          buf += '<';
          i++;
          continue;
        }
        buf += ch;
        i++;
        continue;
      }

      if (isWs(src.charCodeAt(i))) {
        let wsEnd = i + 1;
        let hasNewline = src[i] === '\n' || src[i] === '\r';
        while (wsEnd < len && isWs(src.charCodeAt(wsEnd))) {
          if (src[wsEnd] === '\n' || src[wsEnd] === '\r') hasNewline = true;
          wsEnd++;
        }

        // Leading whitespace at the very beginning of template before a tag
        if (q === 0 && buf.length === 0 && wsEnd < len && src[wsEnd] === '<') {
          i = wsEnd;
          continue;
        }

        // Trailing whitespace at the very end of template after a tag
        if (q === quasis.length - 1 && wsEnd === len && buf.endsWith('>')) {
          i = wsEnd;
          continue;
        }

        // Formatting newline+indent strictly between two tags where at least one is block/structural
        if (hasNewline && buf.endsWith('>') && wsEnd < len && src[wsEnd] === '<') {
          // Peek next tag name
          let peekStart = wsEnd + 1;
          if (src[peekStart] === '/') peekStart++;
          let peekEnd = peekStart;
          while (peekEnd < len && /[A-Za-z0-9-]/.test(src[peekEnd])) peekEnd++;
          const nextTag = src.slice(peekStart, peekEnd).toLowerCase();
          if (
            src.startsWith('<!--', wsEnd) ||
            BLOCK_STRUCTURAL_TAGS.has(lastClosedTag) ||
            BLOCK_STRUCTURAL_TAGS.has(nextTag)
          ) {
            i = wsEnd;
            continue;
          }
        }

        // Collapse whitespace run to a single space (preserving inline spacing!)
        if (!buf.endsWith(' ')) buf += ' ';
        i = wsEnd;
        continue;
      }

      buf += ch;
      i++;
    }

    // Track whether this quasi ends in an unquoted `attr=` right before `${expr}`
    if (q < quasis.length - 1 && inTag && !quoteChar && !inComment && rawTagStack.length === 0) {
      if (buf.trimEnd().endsWith('=')) {
        afterUnquotedAttrExpr = true;
      }
    }

    out.push(buf);
  }

  // Safe fallback on unclosed raw tag or unclosed comment/quote
  if (rawTagStack.length > 0 || inComment || quoteChar !== '') {
    return null;
  }

  return out;
}

export type PartFactoryName =
  | '__pNode'
  | '__pAttr'
  | '__pBool'
  | '__pProp'
  | '__pClass'
  | '__pStyle'
  | '__pComment'
  | '__pEvent'
  | '__pKeyEvent'
  | '__pSpread'
  | '__pCtrl'
  | '__pIf'
  | '__pElseIf'
  | '__pCase'
  | '__pWhen';

export interface CompiledPartEntry {
  slot: number;
  valueIndex: number;
  factory: PartFactoryName;
  arg1?: any;
  arg2?: any;
}

export interface CompiledTemplateOutput {
  html: string;
  parts: CompiledPartEntry[];
  markerAttr: string;
  keyIndex: number;
  factories: Set<PartFactoryName>;
}

const RCDATA_RAW_TAGS = new Set([
  'textarea', 'title', 'style', 'script', 'xmp', 'iframe', 'noembed', 'noframes', 'plaintext',
]);

const VOID_HTML_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

const KEY_MODIFIER_MISUSE_WORDS = new Set([
  'once', 'prevent', 'preventdefault', 'stop', 'stoppropagation', 'capture', 'passive',
]);

function needsKeyboardTools(evName: string): boolean {
  const eventSpec = evName.split('|')[0];
  const base = eventSpec.split('.')[0].split(':')[0];
  if (
    (base === 'keydown' || base === 'keyup' || base === 'keypress') &&
    (eventSpec.includes('.') || eventSpec.includes(':'))
  ) {
    return true;
  }
  const dot = eventSpec.lastIndexOf('.');
  if (dot >= 0 && KEY_MODIFIER_MISUSE_WORDS.has(eventSpec.slice(dot + 1).toLowerCase())) {
    return true;
  }
  return false;
}

/**
 * Compile Snice template quasis at build time into clean static HTML with
 * deterministic slot markers plus an ordered list of tree-shakeable part factory
 * descriptors.
 *
 * Returns `null` on any invalid Snice syntax or RCDATA interpolation so the
 * callsite safely falls back to runtime `html\`...\`` (preserving exact errors
 * and runtime edge-case handling).
 */
export function precompileTemplateQuasis(
  quasis: readonly string[],
  isSvg = false
): CompiledTemplateOutput | null {
  const allText = quasis.join('');
  let markerAttr = 'data-s';
  let suffixNum = 0;
  while (allText.includes(markerAttr)) {
    markerAttr = `data-s${suffixNum++}`;
  }
  const nodePrefix = `${markerAttr}$`;
  const commentPrefix = `${markerAttr}c$`;

  // Cursor over (quasiIndex, charIndex)
  let q = 0;
  let pos = 0;
  const numQuasis = quasis.length;

  const atEnd = () => q >= numQuasis || (q === numQuasis - 1 && pos >= quasis[q].length);
  const atExpr = () => q < numQuasis - 1 && pos >= quasis[q].length;
  const consumeExpr = (): number => {
    const idx = q;
    q++;
    pos = 0;
    return idx;
  };
  const peek = (): string => (atExpr() || atEnd() ? '' : quasis[q][pos]);
  const peekAt = (offset: number): string => {
    if (atExpr() || atEnd()) return '';
    return pos + offset < quasis[q].length ? quasis[q][pos + offset] : '';
  };
  const startsWithInQuasi = (str: string): boolean => !atExpr() && !atEnd() && quasis[q].startsWith(str, pos);
  const advance = (n = 1): string => {
    const out = quasis[q].slice(pos, pos + n);
    pos += n;
    return out;
  };
  const skipWs = (): void => {
    while (!atEnd() && !atExpr() && isWs(quasis[q].charCodeAt(pos))) pos++;
  };

  let outHtml = '';
  const parts: CompiledPartEntry[] = [];
  const factories = new Set<PartFactoryName>();
  let nextSlot = 0;
  let keyIndex = -1;
  const tagStack: string[] = [];
  let svgDepth = isSvg ? 1 : 0;
  let rcdataTag: string | null = null;

  const addPart = (entry: CompiledPartEntry) => {
    parts.push(entry);
    factories.add(entry.factory);
  };

  while (!atEnd()) {
    // 1. Inside RCDATA / RAWTEXT element (<textarea>, <title>, <style>, <script>, ...)
    if (rcdataTag !== null) {
      if (atExpr()) {
        // Interpolations inside RCDATA/RAWTEXT fall back safely to runtime html``
        return null;
      }
      const src = quasis[q];
      const lt = src.indexOf('<', pos);
      if (lt === -1) {
        outHtml += src.slice(pos);
        pos = src.length;
        continue;
      }
      outHtml += src.slice(pos, lt);
      pos = lt;
      if (src[pos + 1] === '/') {
        let nameEnd = pos + 2;
        while (nameEnd < src.length && /[A-Za-z0-9-]/.test(src[nameEnd])) nameEnd++;
        const closeName = src.slice(pos + 2, nameEnd).toLowerCase();
        const gt = src.indexOf('>', nameEnd);
        if (closeName === rcdataTag && gt !== -1) {
          outHtml += src.slice(pos, gt + 1);
          pos = gt + 1;
          rcdataTag = null;
          continue;
        }
      }
      outHtml += advance(1);
      continue;
    }

    // 2. Node interpolation outside tags
    if (atExpr()) {
      if (tagStack[tagStack.length - 1] === 'case') return null;
      const exprIdx = consumeExpr();
      const slot = nextSlot++;
      outHtml += `<!--${nodePrefix}${slot}-->`;
      addPart({ slot, valueIndex: exprIdx, factory: '__pNode' });
      continue;
    }

    const ch = peek();

    // 3. HTML comment
    if (ch === '<' && startsWithInQuasi('<!--')) {
      advance(4);
      const commentStrings: string[] = [];
      const exprIndices: number[] = [];
      let seg = '';
      let closed = false;

      while (!atEnd()) {
        if (atExpr()) {
          commentStrings.push(seg);
          seg = '';
          exprIndices.push(consumeExpr());
          continue;
        }
        const closeIdx = quasis[q].indexOf('-->', pos);
        if (closeIdx === -1) {
          seg += quasis[q].slice(pos);
          pos = quasis[q].length;
        } else {
          seg += quasis[q].slice(pos, closeIdx);
          pos = closeIdx + 3;
          commentStrings.push(seg);
          closed = true;
          break;
        }
      }
      if (!closed) return null;

      if (exprIndices.length === 0) {
        outHtml += `<!--${commentStrings[0]}-->`;
      } else {
        if (tagStack[tagStack.length - 1] === 'case') return null;
        const slot = nextSlot++;
        outHtml += `<!--${commentPrefix}${slot}-->`;
        addPart({
          slot,
          valueIndex: exprIndices[0],
          factory: '__pComment',
          arg1: commentStrings,
        });
      }
      continue;
    }

    // 4. Closing tag `</tag>`
    if (ch === '<' && peekAt(1) === '/') {
      const startPos = pos;
      const gt = quasis[q].indexOf('>', pos + 2);
      if (gt === -1) return null; // expr or unclosed closing tag
      const rawClose = quasis[q].slice(startPos, gt + 1);
      pos = gt + 1;
      const closeName = rawClose.slice(2, -1).trim().toLowerCase();
      if (closeName === 'svg' && svgDepth > 0) svgDepth--;
      if (tagStack.length > 0 && tagStack[tagStack.length - 1] === closeName) {
        tagStack.pop();
      } else if (closeName === 'if' || closeName === 'case' || closeName === 'else-if' || closeName === 'when' || closeName === 'else' || closeName === 'default') {
        return null;
      }
      outHtml += rawClose;
      continue;
    }

    // 5. Declaration / PI (`<!...>` or `<?...>`)
    if (ch === '<' && (peekAt(1) === '!' || peekAt(1) === '?')) {
      const gt = quasis[q].indexOf('>', pos + 2);
      if (gt === -1) return null;
      outHtml += quasis[q].slice(pos, gt + 1);
      pos = gt + 1;
      continue;
    }

    // 6. Opening tag `<tagName ...>`
    if (ch === '<' && /[A-Za-z]/.test(peekAt(1))) {
      advance(1); // consume '<'
      let rawTagName = '';
      while (!atEnd() && !atExpr() && /[A-Za-z0-9:-]/.test(peek())) {
        rawTagName += advance(1);
      }
      if (!rawTagName || atExpr()) return null;
      const tagLower = rawTagName.toLowerCase();
      const parentTag = tagStack.length > 0 ? tagStack[tagStack.length - 1] : undefined;

      // Validate conditional nesting rules (fall back to runtime to throw exact errors)
      if ((tagLower === 'else' || tagLower === 'else-if') && parentTag !== 'if') return null;
      if ((tagLower === 'when' || tagLower === 'default') && parentTag !== 'case') return null;
      if (parentTag === 'case' && tagLower !== 'when' && tagLower !== 'default') return null;

      const isConditionalTag =
        tagLower === 'if' || tagLower === 'else-if' || tagLower === 'case' || tagLower === 'when';
      let sawCondExpr = false;

      const staticAttrs: string[] = [];
      const tagParts: Array<Omit<CompiledPartEntry, 'slot'>> = [];
      let selfClosing = false;
      let tagClosed = false;

      while (!atEnd()) {
        skipWs();
        if (atEnd()) return null;

        if (atExpr()) {
          // Bare `<if ${cond}>`, `<else-if ${cond}>`, `<case ${val}>`, `<when ${val}>`
          if (isConditionalTag && !sawCondExpr) {
            const exprIdx = consumeExpr();
            sawCondExpr = true;
            const factory: PartFactoryName =
              tagLower === 'if'
                ? '__pIf'
                : tagLower === 'else-if'
                  ? '__pElseIf'
                  : tagLower === 'case'
                    ? '__pCase'
                    : '__pWhen';
            tagParts.push({ valueIndex: exprIdx, factory });
            continue;
          }
          // Invalid opening-tag expression (`<div ${x}>`): fall back to runtime
          return null;
        }

        const c = peek();
        if (c === '>') {
          advance(1);
          tagClosed = true;
          break;
        }
        if (c === '/' && peekAt(1) === '>') {
          advance(2);
          selfClosing = true;
          tagClosed = true;
          break;
        }

        // Parse attribute name
        let attrName = '';
        while (!atEnd() && !atExpr()) {
          const ac = peek();
          if (isWs(ac.charCodeAt(0)) || ac === '=' || ac === '>' || (ac === '/' && peekAt(1) === '>')) {
            break;
          }
          attrName += advance(1);
        }
        if (!attrName || atExpr()) return null;

        skipWs();
        if (atEnd() || atExpr() || peek() !== '=') {
          // Static boolean attribute
          staticAttrs.push(attrName);
          continue;
        }

        // Consume '='
        advance(1);
        skipWs();
        if (atEnd()) return null;

        // Parse attribute value (quoted or unquoted)
        const attrStrings: string[] = [];
        const exprIndices: number[] = [];
        let rawStaticQuote = '';
        let seg = '';

        if (!atExpr() && (peek() === '"' || peek() === "'")) {
          rawStaticQuote = advance(1);
          let closedQuote = false;
          while (!atEnd()) {
            if (atExpr()) {
              attrStrings.push(seg);
              seg = '';
              exprIndices.push(consumeExpr());
              continue;
            }
            const endQ = quasis[q].indexOf(rawStaticQuote, pos);
            if (endQ === -1) {
              seg += quasis[q].slice(pos);
              pos = quasis[q].length;
            } else {
              seg += quasis[q].slice(pos, endQ);
              pos = endQ + 1;
              attrStrings.push(seg);
              closedQuote = true;
              break;
            }
          }
          if (!closedQuote) return null;
        } else {
          while (!atEnd()) {
            if (atExpr()) {
              attrStrings.push(seg);
              seg = '';
              exprIndices.push(consumeExpr());
              continue;
            }
            const vc = peek();
            if (isWs(vc.charCodeAt(0)) || vc === '>' || (vc === '/' && peekAt(1) === '>')) {
              break;
            }
            seg += advance(1);
          }
          attrStrings.push(seg);
        }

        if (exprIndices.length === 0) {
          // Static attribute
          const val = attrStrings[0];
          staticAttrs.push(
            rawStaticQuote ? `${attrName}=${rawStaticQuote}${val}${rawStaticQuote}` : `${attrName}=${val}`
          );
          continue;
        }

        // Dynamic attribute on conditional meta element (`<if value=${cond}>`, etc.)
        if (isConditionalTag && attrName.toLowerCase() === 'value') {
          if (sawCondExpr || exprIndices.length !== 1 || attrStrings[0] !== '' || attrStrings[1] !== '') {
            return null;
          }
          sawCondExpr = true;
          const factory: PartFactoryName =
            tagLower === 'if'
              ? '__pIf'
              : tagLower === 'else-if'
                ? '__pElseIf'
                : tagLower === 'case'
                  ? '__pCase'
                  : '__pWhen';
          tagParts.push({ valueIndex: exprIndices[0], factory });
          continue;
        }

        // Single-expression bindings: preserve runtime dev warnings by falling back if static text / >1 expr
        const isSingleExpr =
          /^@@?|^[.?]/.test(attrName) ||
          attrName.startsWith('...') ||
          attrName.startsWith('class:') ||
          attrName.startsWith('style:');
        if (isSingleExpr && (exprIndices.length > 1 || attrStrings.some((s) => s !== ''))) {
          return null;
        }

        if (attrName.startsWith('...')) {
          const spreadName = attrName.slice(3).toLowerCase();
          if (!['props', 'properties', 'attrs', 'attributes', 'events'].includes(spreadName)) {
            return null;
          }
          tagParts.push({ valueIndex: exprIndices[0], factory: '__pSpread', arg1: spreadName });
        } else if (attrName.startsWith('class:')) {
          const cls = attrName.slice(6);
          if (!cls) return null;
          tagParts.push({ valueIndex: exprIndices[0], factory: '__pClass', arg1: cls });
        } else if (attrName.startsWith('style:')) {
          const sty = attrName.slice(6);
          if (!sty) return null;
          tagParts.push({ valueIndex: exprIndices[0], factory: '__pStyle', arg1: sty });
        } else if (attrName.startsWith('@@')) {
          if (!attrName.slice(2).split('|')[0]) return null;
          const ev = attrName.slice(1);
          tagParts.push({
            valueIndex: exprIndices[0],
            factory: needsKeyboardTools(ev) ? '__pKeyEvent' : '__pEvent',
            arg1: ev,
          });
        } else if (attrName.startsWith('@')) {
          const ev = attrName.slice(1);
          if (!ev.split('|')[0]) return null;
          tagParts.push({
            valueIndex: exprIndices[0],
            factory: needsKeyboardTools(ev) ? '__pKeyEvent' : '__pEvent',
            arg1: ev,
          });
        } else if (attrName.startsWith('.')) {
          const prop = attrName.slice(1);
          if (!prop) return null;
          tagParts.push({ valueIndex: exprIndices[0], factory: '__pProp', arg1: prop });
        } else if (attrName.startsWith('?')) {
          const battr = attrName.slice(1);
          if (!battr) return null;
          tagParts.push({ valueIndex: exprIndices[0], factory: '__pBool', arg1: battr });
        } else if (
          attrName.toLowerCase() === 'controller' &&
          exprIndices.length === 1 &&
          attrStrings[0] === '' &&
          attrStrings[1] === ''
        ) {
          tagParts.push({ valueIndex: exprIndices[0], factory: '__pCtrl' });
        } else {
          const inSvgContext = svgDepth > 0 || tagLower === 'svg';
          const resolvedAttrName = inSvgContext ? attrName : attrName.toLowerCase();
          if (resolvedAttrName === 'key' && keyIndex === -1) {
            keyIndex = exprIndices[0];
          }
          const isInterpolated =
            attrStrings.length > 2 || attrStrings[0] !== '' || attrStrings[1] !== '';
          tagParts.push(
            isInterpolated
              ? { valueIndex: exprIndices[0], factory: '__pAttr', arg1: resolvedAttrName, arg2: attrStrings }
              : { valueIndex: exprIndices[0], factory: '__pAttr', arg1: resolvedAttrName }
          );
        }
      }

      if (!tagClosed) return null;

      // `<if>`, `<else-if>`, `<case>` require a dynamic expression
      if ((tagLower === 'if' || tagLower === 'else-if' || tagLower === 'case') && !sawCondExpr) {
        return null;
      }

      if (tagParts.length > 0) {
        const elSlot = nextSlot++;
        staticAttrs.push(`${markerAttr}="${elSlot}"`);
        for (const tp of tagParts) {
          addPart({ slot: elSlot, ...tp });
        }
      }

      outHtml += `<${rawTagName}${staticAttrs.length ? ' ' + staticAttrs.join(' ') : ''}${selfClosing ? ' />' : '>'}`;

      if (!selfClosing) {
        if (RCDATA_RAW_TAGS.has(tagLower)) {
          rcdataTag = tagLower;
        } else if (!VOID_HTML_TAGS.has(tagLower)) {
          tagStack.push(tagLower);
          if (tagLower === 'svg') svgDepth++;
        }
      }
      continue;
    }

    // 7. Plain text character
    if (tagStack[tagStack.length - 1] === 'case' && !isWs(ch.charCodeAt(0))) {
      return null;
    }
    outHtml += advance(1);
  }

  if (rcdataTag !== null) return null;

  return {
    html: outHtml,
    parts,
    markerAttr,
    keyIndex,
    factories,
  };
}

export interface TemplateTransformOptions {
  id: string;
  minifyTemplates: boolean;
  precompileTemplates: boolean;
}

export interface TemplateTransformResult {
  code: string;
  map: ReturnType<MagicString['generateMap']>;
}

function collectHtmlSvgBindings(ast: AstNode): {
  tagMap: Map<string, 'html' | 'svg'>;
  sniceSource: string | null;
} {
  const tagMap = new Map<string, 'html' | 'svg'>();
  let sniceSource: string | null = null;

  for (const stmt of ast.program?.body ?? []) {
    if (stmt.type === 'ImportDeclaration' && stmt.importKind !== 'type') {
      const src = stmt.source?.value;
      if (src === 'snice') {
        sniceSource = src;
        for (const spec of stmt.specifiers ?? []) {
          if (spec.type === 'ImportSpecifier' && spec.importKind !== 'type') {
            const imported =
              spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value;
            if (imported === 'html' || imported === 'svg') {
              tagMap.set(spec.local.name, imported);
            }
          }
        }
      }
    }
  }

  return { tagMap, sniceSource };
}

/**
 * Minify and/or pre-compile Snice `html\`...\`` and `svg\`...\`` tagged templates.
 */
export function transformTemplates(
  code: string,
  opts: TemplateTransformOptions
): TemplateTransformResult | null {
  if (!opts.minifyTemplates && !opts.precompileTemplates) return null;
  // Fast O(1) pre-filter
  if (!code.includes('`') || !code.includes('snice')) return null;

  const cleanId = opts.id.split('?')[0];
  const isTs = /\.[cm]?tsx?$/.test(cleanId);
  const isTsx = /\.[cm]?tsx$/.test(cleanId) || cleanId.endsWith('.jsx');

  let ast: AstNode;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: [
        'decorators',
        ...(isTs ? (['typescript'] as const) : []),
        ...(isTsx ? (['jsx'] as const) : []),
      ],
    }) as AstNode;
  } catch {
    return null;
  }

  const { tagMap, sniceSource } = collectHtmlSvgBindings(ast);
  if (tagMap.size === 0) return null;

  // Collect matching TaggedTemplateExpression nodes (post-order: inner before outer!)
  const matches: Array<{ node: AstNode; tagKind: 'html' | 'svg' }> = [];
  function visit(node: AstNode | null | undefined): void {
    if (!isNode(node)) return;
    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') continue;
      const val = node[key];
      if (Array.isArray(val)) {
        for (const item of val) {
          if (isNode(item)) visit(item);
        }
      } else if (isNode(val)) {
        visit(val);
      }
    }
    if (
      node.type === 'TaggedTemplateExpression' &&
      node.tag?.type === 'Identifier' &&
      tagMap.has(node.tag.name)
    ) {
      matches.push({ node, tagKind: tagMap.get(node.tag.name)! });
    }
  }
  visit(ast.program);

  if (matches.length === 0) return null;

  const s = new MagicString(code);
  const hoistedDecls: string[] = [];
  const usedFactories = new Set<PartFactoryName>();
  let changed = false;
  let needsPrecompiledHelper = false;
  let templateCounter = 0;

  for (const { node, tagKind } of matches) {
    const quasiNodes: AstNode[] = node.quasi?.quasis ?? [];
    const exprNodes: AstNode[] = node.quasi?.expressions ?? [];
    const cookedQuasis: string[] = [];
    let hasInvalidCooked = false;
    for (const qn of quasiNodes) {
      if (typeof qn.value?.cooked !== 'string') {
        hasInvalidCooked = true;
        break;
      }
      cookedQuasis.push(qn.value.cooked);
    }
    if (hasInvalidCooked) continue;

    let finalQuasis = cookedQuasis;
    let minified = false;
    if (opts.minifyTemplates) {
      const minRes = minifyHtmlQuasis(cookedQuasis);
      if (minRes !== null) {
        finalQuasis = minRes;
        minified = true;
      }
    }

    if (opts.precompileTemplates) {
      const compiled = precompileTemplateQuasis(finalQuasis, tagKind === 'svg');
      if (compiled !== null) {
        const idNum = templateCounter++;
        const stringsVar = `__st${idNum}`;
        const descVar = `__sc${idNum}`;
        for (const f of compiled.factories) usedFactories.add(f);

        const partTuples = compiled.parts.map((p) => {
          const items = [String(p.slot), String(p.valueIndex), p.factory];
          if (p.arg1 !== undefined) items.push(JSON.stringify(p.arg1));
          if (p.arg2 !== undefined) items.push(JSON.stringify(p.arg2));
          return `[${items.join(',')}]`;
        });
        const descFields = [
          `html:${JSON.stringify(compiled.html)}`,
          `parts:[${partTuples.join(',')}]`,
        ];
        if (compiled.markerAttr !== 'data-s') {
          descFields.push(`m:${JSON.stringify(compiled.markerAttr)}`);
        }
        if (compiled.keyIndex !== -1) {
          descFields.push(`k:${compiled.keyIndex}`);
        }

        // Unique per-callsite identity token for `isSameTemplate(strings)` without
        // duplicating the template HTML string in the bundle.
        hoistedDecls.push(`const ${stringsVar} = [];`);
        hoistedDecls.push(`const ${descVar} = {${descFields.join(',')}};`);
        needsPrecompiledHelper = true;

        // Replace callsite while preserving nested already-transformed expressions cleanly!
        const svgArg = tagKind === 'svg' ? ', true' : '';
        if (exprNodes.length === 0) {
          s.overwrite(node.start, node.end, `__sniceTemplate(${stringsVar}, [], ${descVar}${svgArg})`);
        } else {
          s.overwrite(node.start, exprNodes[0].start, `__sniceTemplate(${stringsVar}, [`);
          for (let e = 0; e < exprNodes.length - 1; e++) {
            s.overwrite(exprNodes[e].end, exprNodes[e + 1].start, ', ');
          }
          s.overwrite(
            exprNodes[exprNodes.length - 1].end,
            node.end,
            `], ${descVar}${svgArg})`
          );
        }
        changed = true;
        continue;
      }
    }

    // Standard minification (update individual quasi ranges — 100% disjoint from nested expressions!)
    if (minified) {
      for (let q = 0; q < quasiNodes.length; q++) {
        const qn = quasiNodes[q];
        const escaped = escapeTemplateQuasi(finalQuasis[q]);
        if (escaped !== qn.value.raw) {
          if (qn.end > qn.start) {
            s.overwrite(qn.start, qn.end, escaped);
          } else if (escaped.length > 0) {
            s.appendRight(qn.start, escaped);
          }
          changed = true;
        }
      }
    }
  }

  if (!changed) return null;

  if (needsPrecompiledHelper) {
    const sortedFactories = Array.from(usedFactories).sort();
    const imports = ['__sniceTemplate', ...sortedFactories].join(', ');
    const header =
      `import { ${imports} } from ${JSON.stringify(sniceSource ?? 'snice')};\n` +
      hoistedDecls.join('\n') +
      '\n';
    s.prepend(header);
  }

  return {
    code: s.toString(),
    map: s.generateMap({
      source: opts.id,
      includeContent: true,
      hires: 'boundary',
    }),
  };
}
