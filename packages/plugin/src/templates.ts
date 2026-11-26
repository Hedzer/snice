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

export interface PrecompiledSlots {
  kinds: Array<0 | 1 | 2>;
  attrs: string[];
}

/**
 * Mirror `parts.ts`'s `scanTemplateQuasis` classifier at build time to compute
 * deterministic `(kinds, attrs)` descriptors without any random markers.
 * Returns `null` if the template contains invalid Snice syntax (so it safely
 * falls back to runtime `html\`...\`` and throws the exact runtime error).
 */
export function precompileTemplateQuasis(quasis: readonly string[]): PrecompiledSlots | null {
  const kinds: Array<0 | 1 | 2> = [];
  const attrs: string[] = [];

  let inTag = false;
  let inAttrValue = false;
  let inComment = false;
  let attrQuoteChar = '';
  let currentAttrName = '';

  for (let i = 0; i < quasis.length - 1; i++) {
    const str = quasis[i];
    for (let j = 0; j < str.length; j++) {
      const char = str[j];
      if (inComment) {
        if (char === '-' && str.startsWith('-->', j)) {
          inComment = false;
          j += 2;
        }
      } else if (!inTag) {
        if (char === '<') {
          if (str.startsWith('<!--', j)) {
            inComment = true;
            j += 3;
          } else if (/[A-Za-z!/?]/.test(str[j + 1] || '')) {
            inTag = true;
          }
        }
      } else if (!inAttrValue) {
        if (char === '>') {
          inTag = false;
        } else if (char === '"' || char === "'") {
          inAttrValue = true;
          attrQuoteChar = char;
        } else if (char === '=') {
          let attrStart = j - 1;
          while (attrStart >= 0 && /[\w\-\.@\?/:\+~|]/.test(str[attrStart])) {
            attrStart--;
          }
          currentAttrName = str.substring(attrStart + 1, j).trim();
        }
      } else {
        if (char === attrQuoteChar) {
          inAttrValue = false;
          attrQuoteChar = '';
        }
      }
    }

    if (inComment) {
      attrs.push('');
      kinds.push(1);
    } else if (inAttrValue) {
      attrs.push(currentAttrName);
      kinds.push(1);
    } else if (inTag) {
      const trimmed = str.trimEnd();
      if (trimmed.endsWith('=')) {
        let attrStart = trimmed.length - 2;
        while (attrStart >= 0 && /[\w\-\.@\?\/:\+~|]/.test(trimmed[attrStart])) {
          attrStart--;
        }
        currentAttrName = trimmed.substring(attrStart + 1, trimmed.length - 1).trim();
        // If this is an unknown spread binding, fall back to runtime so the runtime error fires
        if (currentAttrName.startsWith('...')) {
          const spreadName = currentAttrName.slice(3).toLowerCase();
          if (!['props', 'properties', 'attrs', 'attributes', 'events'].includes(spreadName)) {
            return null;
          }
        }
        attrs.push(currentAttrName);
        kinds.push(1);
      } else {
        const metaElementMatch = str.match(/<(if|else-if|case|when)\s*$/);
        if (metaElementMatch) {
          currentAttrName = 'value';
          attrs.push('value');
          kinds.push(2);
        } else {
          // Invalid opening-tag expression (`<div ${x}>`): fall back to runtime html``
          return null;
        }
      }
    } else {
      attrs.push('');
      kinds.push(0);
    }
  }

  return { kinds, attrs };
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
      const compiled = precompileTemplateQuasis(finalQuasis);
      if (compiled !== null) {
        // Emit hoisted module-scope constant strings & descriptor
        const idNum = templateCounter++;
        const stringsVar = `__st${idNum}`;
        const descVar = `__sc${idNum}`;
        const jsonArr = JSON.stringify(finalQuasis);
        hoistedDecls.push(
          `const ${stringsVar} = Object.assign(${jsonArr}, { raw: ${jsonArr} });`
        );
        hoistedDecls.push(
          `const ${descVar} = { kinds: ${JSON.stringify(compiled.kinds)}, attrs: ${JSON.stringify(compiled.attrs)} };`
        );
        needsPrecompiledHelper = true;

        // Replace callsite while preserving nested already-transformed expressions cleanly!
        // Because we visit inner-to-outer, overwrite only the outer shell (tag+quasi segments),
        // keeping expression sub-ranges intact in MagicString!
        const svgArg = tagKind === 'svg' ? ', true' : '';
        if (exprNodes.length === 0) {
          s.overwrite(node.start, node.end, `__sniceTemplate(${stringsVar}, [], ${descVar}${svgArg})`);
        } else {
          // Replace from node.start to exprNodes[0].start with `__sniceTemplate(__st, [`
          s.overwrite(node.start, exprNodes[0].start, `__sniceTemplate(${stringsVar}, [`);
          // Replace between exprNodes[i].end and exprNodes[i+1].start with `, `
          for (let e = 0; e < exprNodes.length - 1; e++) {
            s.overwrite(exprNodes[e].end, exprNodes[e + 1].start, ', ');
          }
          // Replace from last expr end to node.end with `], __sc)`
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
    const header =
      `import { __sniceTemplate } from ${JSON.stringify(sniceSource ?? 'snice')};\n` +
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
