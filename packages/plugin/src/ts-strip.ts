/**
 * Lightweight AST-based TypeScript syntax erasure on top of a `@babel/parser`
 * AST and `MagicString`. Used by `snice/rollup` when compiling `.ts`/`.tsx`
 * directly without Vite's esbuild pass.
 */
import type MagicString from 'magic-string';

type AstNode = Record<string, any>;

function isNode(value: unknown): value is AstNode {
  return typeof value === 'object' && value !== null && typeof (value as any).type === 'string';
}

function getSkipSet(skipNodes?: ReadonlySet<AstNode>): ReadonlySet<AstNode> {
  return skipNodes ?? new Set();
}

function removeRange(s: MagicString, start: number, end: number): void {
  if (end > start) {
    s.remove(start, end);
  }
}

function findNextChar(code: string, from: number, ch: string, limit: number): number {
  for (let i = from; i < limit; i++) {
    if (code[i] === ch) return i;
  }
  return -1;
}

function stripOptionalModifier(code: string, s: MagicString, node: AstNode): void {
  if (node.optional && typeof node.name === 'string') {
    const nameEnd = node.start + node.name.length;
    const qIdx = findNextChar(code, nameEnd, '?', node.end);
    if (qIdx >= 0 && (!node.typeAnnotation || qIdx < node.typeAnnotation.start)) {
      removeRange(s, qIdx, qIdx + 1);
    }
  }
}

function emitEnum(code: string, node: AstNode): string {
  const name = node.id.name;
  const members: string[] = [];
  let nextNumeric = 0;
  let hasNumericAuto = true;

  for (const m of node.members ?? []) {
    const keyName =
      m.id.type === 'Identifier'
        ? m.id.name
        : m.id.type === 'StringLiteral'
          ? m.id.value
          : String(m.id.value ?? '');
    const keyJson = JSON.stringify(keyName);
    if (m.initializer) {
      const initSrc = code.slice(m.initializer.start, m.initializer.end);
      if (m.initializer.type === 'NumericLiteral') {
        nextNumeric = m.initializer.value + 1;
        hasNumericAuto = true;
        members.push(`${name}[${name}[${keyJson}] = ${initSrc}] = ${keyJson};`);
      } else if (m.initializer.type === 'StringLiteral') {
        hasNumericAuto = false;
        members.push(`${name}[${keyJson}] = ${initSrc};`);
      } else {
        hasNumericAuto = false;
        members.push(`${name}[${keyJson}] = ${initSrc};`);
      }
    } else if (hasNumericAuto) {
      const val = nextNumeric++;
      members.push(`${name}[${name}[${keyJson}] = ${val}] = ${keyJson};`);
    } else {
      members.push(`${name}[${keyJson}] = undefined;`);
    }
  }

  return `var ${name}; (function (${name}) { ${members.join(' ')} })(${name} || (${name} = {}));`;
}

/**
 * Erase TypeScript-only syntax from `ast` into `s`, skipping any AST subtrees
 * already removed/rewritten by the decorator lowering pass (`skipNodes`).
 */
export function stripTypeScriptSyntax(
  ast: AstNode,
  code: string,
  s: MagicString,
  skipNodes?: ReadonlySet<AstNode>
): boolean {
  const skip = getSkipSet(skipNodes);
  let changed = false;

  const markRemove = (start: number, end: number) => {
    if (end > start) {
      s.remove(start, end);
      changed = true;
    }
  };

  const markOverwrite = (start: number, end: number, text: string) => {
    s.overwrite(start, end, text);
    changed = true;
  };

  function stripParams(params: AstNode[]): Array<{ name: string }> {
    const paramProps: Array<{ name: string }> = [];
    if (!params || params.length === 0) return paramProps;

    // Strip TS fake `this: Type` first parameter
    if (params[0]?.type === 'Identifier' && params[0].name === 'this') {
      const p0 = params[0];
      let end = p0.end;
      if (params.length > 1) {
        const comma = findNextChar(code, p0.end, ',', params[1].start);
        if (comma >= 0) end = comma + 1;
      }
      markRemove(p0.start, end);
    }

    for (const p of params) {
      if (p.type === 'Identifier' && p.name === 'this') continue;
      if (p.type === 'TSParameterProperty') {
        const inner = p.parameter;
        // Remove accessibility / readonly keywords before the inner parameter
        markRemove(p.start, inner.start);
        const paramName =
          inner.type === 'Identifier'
            ? inner.name
            : inner.type === 'AssignmentPattern' && inner.left?.type === 'Identifier'
              ? inner.left.name
              : null;
        if (paramName) paramProps.push({ name: paramName });
        visit(inner);
      } else {
        visit(p);
      }
    }
    return paramProps;
  }

  function visit(node: AstNode | null | undefined): void {
    if (!isNode(node) || skip.has(node)) return;

    switch (node.type) {
      case 'TSInterfaceDeclaration':
      case 'TSTypeAliasDeclaration':
      case 'TSDeclareFunction':
      case 'TSDeclareMethod':
      case 'TSModuleDeclaration':
      case 'TSImportEqualsDeclaration':
        markRemove(node.start, node.end);
        return;

      case 'TSEnumDeclaration':
        if (node.declare) {
          markRemove(node.start, node.end);
        } else {
          markOverwrite(node.start, node.end, emitEnum(code, node));
        }
        return;

      case 'VariableDeclaration':
        if (node.declare) {
          markRemove(node.start, node.end);
          return;
        }
        break;

      case 'ImportDeclaration': {
        if (node.importKind === 'type') {
          markRemove(node.start, node.end);
          return;
        }
        const specs: AstNode[] = node.specifiers ?? [];
        if (specs.length > 0) {
          const typeSpecs = specs.filter((sp) => sp.importKind === 'type');
          if (typeSpecs.length === specs.length) {
            markRemove(node.start, node.end);
            return;
          }
          if (typeSpecs.length > 0) {
            // Rebuild import specifiers without `type` specifiers
            const defaultSpec = specs.find((sp) => sp.type === 'ImportDefaultSpecifier');
            const nsSpec = specs.find((sp) => sp.type === 'ImportNamespaceSpecifier');
            const namedSpecs = specs.filter(
              (sp) => sp.type === 'ImportSpecifier' && sp.importKind !== 'type'
            );
            const parts: string[] = [];
            if (defaultSpec) parts.push(defaultSpec.local.name);
            if (nsSpec) parts.push(`* as ${nsSpec.local.name}`);
            if (namedSpecs.length > 0) {
              const items = namedSpecs.map((sp) => {
                const imported =
                  sp.imported.type === 'Identifier' ? sp.imported.name : JSON.stringify(sp.imported.value);
                return imported === sp.local.name ? imported : `${imported} as ${sp.local.name}`;
              });
              parts.push(`{ ${items.join(', ')} }`);
            }
            const src = code.slice(node.source.start, node.source.end);
            markOverwrite(node.start, node.end, `import ${parts.join(', ')} from ${src};`);
            return;
          }
        }
        return;
      }

      case 'ExportNamedDeclaration': {
        if (node.exportKind === 'type') {
          markRemove(node.start, node.end);
          return;
        }
        if (
          node.declaration &&
          (node.declaration.type === 'TSInterfaceDeclaration' ||
            node.declaration.type === 'TSTypeAliasDeclaration' ||
            node.declaration.type === 'TSDeclareFunction' ||
            node.declaration.type === 'TSModuleDeclaration' ||
            node.declaration.declare)
        ) {
          markRemove(node.start, node.end);
          return;
        }
        if (node.declaration?.type === 'TSEnumDeclaration') {
          markOverwrite(
            node.start,
            node.end,
            `export ${emitEnum(code, node.declaration)}`
          );
          return;
        }
        const specs: AstNode[] = node.specifiers ?? [];
        if (specs.length > 0) {
          const typeSpecs = specs.filter((sp) => sp.exportKind === 'type');
          if (typeSpecs.length === specs.length) {
            markRemove(node.start, node.end);
            return;
          }
          if (typeSpecs.length > 0) {
            const kept = specs
              .filter((sp) => sp.exportKind !== 'type')
              .map((sp) => {
                const loc = sp.local.name;
                const exp = sp.exported.name;
                return loc === exp ? loc : `${loc} as ${exp}`;
              });
            const fromPart = node.source
              ? ` from ${code.slice(node.source.start, node.source.end)}`
              : '';
            markOverwrite(node.start, node.end, `export { ${kept.join(', ')} }${fromPart};`);
            return;
          }
        }
        break;
      }

      case 'ExportAllDeclaration':
        if (node.exportKind === 'type') {
          markRemove(node.start, node.end);
          return;
        }
        return;

      case 'ExportDefaultDeclaration':
        if (
          node.declaration?.type === 'TSInterfaceDeclaration' ||
          node.declaration?.type === 'TSDeclareFunction' ||
          node.declaration?.declare
        ) {
          markRemove(node.start, node.end);
          return;
        }
        break;

      case 'ClassDeclaration':
      case 'ClassExpression': {
        if (node.declare) {
          markRemove(node.start, node.end);
          return;
        }
        if (node.abstract) {
          const idx = code.indexOf('abstract', node.start);
          if (idx >= 0 && idx < node.end) {
            markRemove(idx, idx + 'abstract'.length);
          }
        }
        if (node.typeParameters) {
          markRemove(node.typeParameters.start, node.typeParameters.end);
        }
        if (node.superTypeParameters) {
          markRemove(node.superTypeParameters.start, node.superTypeParameters.end);
        }
        if (node.implements && node.implements.length > 0) {
          const firstImpl = node.implements[0];
          const lastImpl = node.implements[node.implements.length - 1];
          const implKeywordIdx = code.lastIndexOf('implements', firstImpl.start);
          if (implKeywordIdx >= node.start) {
            markRemove(implKeywordIdx, lastImpl.end);
          }
        }
        break;
      }

      case 'ClassProperty': {
        if (node.declare || node.abstract) {
          markRemove(node.start, node.end);
          return;
        }
        // Remove TS modifiers (`public`, `private`, `protected`, `readonly`, `override`)
        const keyStart = node.computed
          ? code.lastIndexOf('[', node.key.start)
          : node.key.start;
        if (keyStart > node.start) {
          const prefix = code.slice(node.start, keyStart);
          const cleaned = prefix.replace(/\b(?:public|private|protected|readonly|override)\b\s*/g, '');
          if (cleaned !== prefix) {
            markOverwrite(node.start, keyStart, cleaned);
          }
        }
        // Remove optional `?` or definite `!` after key
        const afterKey = node.computed
          ? findNextChar(code, node.key.end, ']', node.end) + 1
          : node.key.end;
        const limit = node.typeAnnotation
          ? node.typeAnnotation.start
          : node.value
            ? node.value.start
            : node.end;
        for (let i = afterKey; i < limit; i++) {
          if (code[i] === '?' || code[i] === '!') {
            markRemove(i, i + 1);
            break;
          }
        }
        if (node.typeAnnotation) {
          markRemove(node.typeAnnotation.start, node.typeAnnotation.end);
        }
        if (node.value) visit(node.value);
        if (node.computed) visit(node.key);
        return;
      }

      case 'ClassMethod': {
        if (node.abstract) {
          markRemove(node.start, node.end);
          return;
        }
        const keyStart = node.computed
          ? code.lastIndexOf('[', node.key.start)
          : node.key.start;
        if (keyStart > node.start) {
          const prefix = code.slice(node.start, keyStart);
          const cleaned = prefix.replace(/\b(?:public|private|protected|override|abstract)\b\s*/g, '');
          if (cleaned !== prefix) {
            markOverwrite(node.start, keyStart, cleaned);
          }
        }
        if (node.optional) {
          const afterKey = node.computed
            ? findNextChar(code, node.key.end, ']', node.end) + 1
            : node.key.end;
          const qIdx = findNextChar(code, afterKey, '?', node.end);
          if (qIdx >= 0 && qIdx < (node.body?.start ?? node.end)) {
            markRemove(qIdx, qIdx + 1);
          }
        }
        if (node.typeParameters) markRemove(node.typeParameters.start, node.typeParameters.end);
        if (node.returnType) markRemove(node.returnType.start, node.returnType.end);
        const paramProps = stripParams(node.params);
        if (node.kind === 'constructor' && paramProps.length > 0 && node.body) {
          const assigns = paramProps.map((p) => `this.${p.name} = ${p.name};`).join(' ');
          // Insert right after super(...) if present, else at start of constructor body
          let insertedAfterSuper = false;
          for (const stmt of node.body.body ?? []) {
            if (
              stmt.type === 'ExpressionStatement' &&
              stmt.expression?.type === 'CallExpression' &&
              stmt.expression.callee?.type === 'Super'
            ) {
              s.appendRight(stmt.end, ` ${assigns}`);
              changed = true;
              insertedAfterSuper = true;
              break;
            }
          }
          if (!insertedAfterSuper) {
            s.appendRight(node.body.start + 1, ` ${assigns} `);
            changed = true;
          }
        }
        if (node.computed) visit(node.key);
        visit(node.body);
        return;
      }

      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
      case 'ObjectMethod':
        if (node.typeParameters) markRemove(node.typeParameters.start, node.typeParameters.end);
        if (node.returnType) markRemove(node.returnType.start, node.returnType.end);
        stripParams(node.params);
        if (node.computed && node.key) visit(node.key);
        visit(node.body);
        return;

      case 'Identifier':
        stripOptionalModifier(code, s, node);
        if (node.typeAnnotation) {
          markRemove(node.typeAnnotation.start, node.typeAnnotation.end);
        }
        return;

      case 'ObjectPattern':
      case 'ArrayPattern':
      case 'RestElement':
        if (node.optional) {
          const qIdx = findNextChar(code, node.start, '?', node.typeAnnotation?.start ?? node.end);
          if (qIdx >= 0) markRemove(qIdx, qIdx + 1);
        }
        if (node.typeAnnotation) {
          markRemove(node.typeAnnotation.start, node.typeAnnotation.end);
        }
        break;

      case 'CallExpression':
      case 'OptionalCallExpression':
      case 'NewExpression':
      case 'TaggedTemplateExpression':
        if (node.typeParameters) {
          markRemove(node.typeParameters.start, node.typeParameters.end);
        }
        break;

      case 'TSAsExpression':
      case 'TSSatisfiesExpression':
        markRemove(node.expression.end, node.end);
        visit(node.expression);
        return;

      case 'TSTypeAssertion':
        markRemove(node.start, node.expression.start);
        visit(node.expression);
        return;

      case 'TSNonNullExpression':
        markRemove(node.expression.end, node.end);
        visit(node.expression);
        return;

      case 'TSInstantiationExpression':
        markRemove(node.expression.end, node.end);
        visit(node.expression);
        return;
    }

    for (const key of Object.keys(node)) {
      if (
        key === 'type' ||
        key === 'start' ||
        key === 'end' ||
        key === 'loc' ||
        key === 'typeAnnotation' ||
        key === 'typeParameters' ||
        key === 'superTypeParameters' ||
        key === 'returnType' ||
        key === 'implements' ||
        key === 'leadingComments' ||
        key === 'trailingComments' ||
        key === 'innerComments'
      ) {
        continue;
      }
      const val = node[key];
      if (Array.isArray(val)) {
        for (const item of val) {
          if (isNode(item)) visit(item);
        }
      } else if (isNode(val)) {
        visit(val);
      }
    }
  }

  visit(ast);
  return changed;
}
