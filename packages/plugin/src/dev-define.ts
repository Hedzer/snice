import MagicString from 'magic-string';
import { parseModuleAst, type AstNode } from './parser';

const DEV_TARGET = '__SNICE_DEV__';
const PLATFORM_TARGET = '__SNICE_PLATFORM__';

export interface DevDefineResult {
  code: string;
  map: ReturnType<MagicString['generateMap']>;
}

function isNode(v: unknown): v is AstNode {
  return typeof v === 'object' && v !== null && typeof (v as any).type === 'string';
}

/**
 * AST-accurate, sourcemap-preserving replacement of a bare global identifier
 * (immune to regex literals, division, nested template literals, comments,
 * strings, property keys, and member access).
 */
export function replaceSniceGlobalIdentifier(
  code: string,
  target: string,
  replacement: string,
  id?: string
): DevDefineResult | null {
  if (!code.includes(target)) return null;

  let ast: AstNode;
  try {
    ast = parseModuleAst(code, id ?? 'module.js');
  } catch {
    return null;
  }

  const s = new MagicString(code);
  let changed = false;

  const walk = (node: AstNode | null | undefined, parent: AstNode | null, key: string | null) => {
    if (!isNode(node)) return;

    if (node.type === 'Identifier' && node.name === target) {
      const isNonValueRef =
        (parent?.type === 'MemberExpression' && key === 'property' && !parent.computed) ||
        (parent?.type === 'OptionalMemberExpression' && key === 'property' && !parent.computed) ||
        (parent?.type === 'ObjectProperty' && key === 'key' && !parent.computed && !parent.shorthand) ||
        (parent?.type === 'ClassProperty' && key === 'key' && !parent.computed) ||
        (parent?.type === 'ClassMethod' && key === 'key' && !parent.computed) ||
        (parent?.type === 'ObjectMethod' && key === 'key' && !parent.computed) ||
        (parent?.type === 'VariableDeclarator' && key === 'id') ||
        (parent?.type === 'FunctionDeclaration' && key === 'id') ||
        (parent?.type === 'ClassDeclaration' && key === 'id') ||
        (parent?.type === 'ImportSpecifier' && (key === 'imported' || key === 'local')) ||
        (parent?.type === 'ExportSpecifier' && key === 'exported') ||
        parent?.type === 'LabeledStatement';

      if (!isNonValueRef) {
        if (parent?.type === 'ObjectProperty' && parent.shorthand && key === 'value') {
          s.overwrite(node.start, node.end, `${target}: ${replacement}`);
        } else if (parent?.type === 'ObjectProperty' && parent.shorthand && key === 'key') {
          return;
        } else {
          s.overwrite(node.start, node.end, replacement);
        }
        changed = true;
      }
      return;
    }

    for (const k of Object.keys(node)) {
      if (k === 'type' || k === 'start' || k === 'end' || k === 'loc' || k === 'leadingComments' || k === 'trailingComments' || k === 'innerComments') {
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
  if (!changed) return null;

  return {
    code: s.toString(),
    map: s.generateMap({
      source: id,
      includeContent: true,
      hires: 'boundary',
    }),
  };
}

/**
 * AST-accurate, sourcemap-preserving replacement of bare `__SNICE_DEV__`
 * identifiers for pure Rollup builds.
 */
export function replaceSniceDevIdentifier(
  code: string,
  isDev: boolean,
  id?: string
): DevDefineResult | null {
  return replaceSniceGlobalIdentifier(code, DEV_TARGET, isDev ? 'true' : 'false', id);
}

/**
 * AST-accurate, sourcemap-preserving replacement of bare `__SNICE_PLATFORM__`
 * identifiers so unselected platform behavior modules dead-code-eliminate to 0 bytes.
 */
export function replaceSnicePlatformIdentifier(
  code: string,
  platform: string,
  id?: string
): DevDefineResult | null {
  return replaceSniceGlobalIdentifier(code, PLATFORM_TARGET, JSON.stringify(platform), id);
}
