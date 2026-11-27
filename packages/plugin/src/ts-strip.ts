/**
 * Lightweight AST-based TypeScript syntax erasure on top of a `@babel/parser`
 * AST and `MagicString`. Used by `snice/rollup` when compiling `.ts`/`.tsx`
 * directly without Vite's esbuild pass.
 */
import MagicString from 'magic-string';

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

function findKeywordSkippingComments(
  code: string,
  from: number,
  limit: number,
  keyword: string
): number {
  let i = from;
  while (i < limit) {
    const ch = code.charCodeAt(i);
    if (ch === 32 || ch === 9 || ch === 10 || ch === 13 || ch === 12) {
      i++;
      continue;
    }
    if (ch === 47 && i + 1 < limit) {
      const next = code.charCodeAt(i + 1);
      if (next === 47) {
        i += 2;
        while (i < limit && code.charCodeAt(i) !== 10 && code.charCodeAt(i) !== 13) i++;
        continue;
      }
      if (next === 42) {
        i += 2;
        while (i + 1 < limit && !(code.charCodeAt(i) === 42 && code.charCodeAt(i + 1) === 47)) i++;
        i += 2;
        continue;
      }
    }
    if (code.startsWith(keyword, i)) {
      const after = i + keyword.length;
      if (after >= limit || !/[A-Za-z0-9_$]/.test(code[after])) {
        return i;
      }
    }
    i++;
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
  const runtimeIdentifiers = new Set<string>();
  const deferredImports: AstNode[] = [];
  const deferredReexports: AstNode[] = [];

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
          deferredImports.push(node);
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
          if (node.source) {
            if (typeSpecs.length > 0) {
              const kept = specs
                .filter((sp) => sp.exportKind !== 'type')
                .map((sp) => {
                  const loc = sp.local.name;
                  const exp = sp.exported.name;
                  return loc === exp ? loc : `${loc} as ${exp}`;
                });
              const fromPart = ` from ${code.slice(node.source.start, node.source.end)}`;
              markOverwrite(node.start, node.end, `export { ${kept.join(', ')} }${fromPart};`);
            }
            return;
          }
          // Local `export { A, B }` — defer until we know which symbols are type-only
          deferredReexports.push(node);
          return;
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
        // strictly AFTER any decorators so we never overwrite decorator removals.
        let modStart = node.start;
        for (const d of node.decorators ?? []) {
          if (d.end > modStart) modStart = d.end;
        }
        const keyStart = node.computed
          ? code.lastIndexOf('[', node.key.start)
          : node.key.start;
        if (keyStart > modStart) {
          const prefix = code.slice(modStart, keyStart);
          const cleaned = prefix.replace(/\b(?:public|private|protected|readonly|override)\b\s*/g, '');
          if (cleaned !== prefix) {
            markOverwrite(modStart, keyStart, cleaned);
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

      case 'ClassAccessorProperty': {
        if (node.declare || node.abstract) {
          markRemove(node.start, node.end);
          return;
        }
        // Lower undecorated ES `accessor prop: T = init;` into an ES2022 private backing field
        // plus getter/setter so Rollup and ES2022 runtimes execute it natively.
        const isStatic = Boolean(node.static);
        const staticPrefix = isStatic ? 'static ' : '';
        let propName: string;
        let getterKey: string;
        if (node.computed) {
          propName = `__acc_${node.start}`;
          const keyMs = new MagicString(code);
          stripTypeScriptSyntax(node.key, code, keyMs);
          getterKey = `[${keyMs.slice(node.key.start, node.key.end)}]`;
        } else if (node.key?.type === 'Identifier') {
          propName = node.key.name;
          getterKey = propName;
        } else if (node.key?.type === 'StringLiteral') {
          propName = `__acc_${node.start}`;
          getterKey = JSON.stringify(node.key.value);
        } else {
          propName = `__acc_${node.start}`;
          getterKey = code.slice(node.key.start, node.key.end);
        }
        const backing = `#__snice_acc_${propName}`;
        let initCode = 'undefined';
        if (node.value) {
          const valMs = new MagicString(code);
          stripTypeScriptSyntax(node.value, code, valMs);
          initCode = valMs.slice(node.value.start, node.value.end);
        }
        markOverwrite(
          node.start,
          node.end,
          `${staticPrefix}${backing} = ${initCode}; ${staticPrefix}get ${getterKey}() { return this.${backing}; } ${staticPrefix}set ${getterKey}(__v) { this.${backing} = __v; }`
        );
        return;
      }

      case 'ClassMethod': {
        if (node.abstract) {
          markRemove(node.start, node.end);
          return;
        }
        let modStart = node.start;
        for (const d of node.decorators ?? []) {
          if (d.end > modStart) modStart = d.end;
        }
        const keyStart = node.computed
          ? code.lastIndexOf('[', node.key.start)
          : node.key.start;
        if (keyStart > modStart) {
          const prefix = code.slice(modStart, keyStart);
          const cleaned = prefix.replace(/\b(?:public|private|protected|override|abstract)\b\s*/g, '');
          if (cleaned !== prefix) {
            markOverwrite(modStart, keyStart, cleaned);
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
        runtimeIdentifiers.add(node.name);
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

      case 'TSAsExpression': {
        const asIdx = findKeywordSkippingComments(code, node.expression.end, node.typeAnnotation.start, 'as');
        markRemove(asIdx >= 0 ? asIdx : node.expression.end, node.end);
        visit(node.expression);
        return;
      }

      case 'TSSatisfiesExpression': {
        const satIdx = findKeywordSkippingComments(code, node.expression.end, node.typeAnnotation.start, 'satisfies');
        markRemove(satIdx >= 0 ? satIdx : node.expression.end, node.end);
        visit(node.expression);
        return;
      }

      case 'TSTypeAssertion': {
        const gtIdx = findNextChar(code, node.typeAnnotation.end, '>', node.end);
        markRemove(node.start, gtIdx >= 0 ? gtIdx + 1 : node.expression.start);
        visit(node.expression);
        return;
      }

      case 'TSNonNullExpression':
        markRemove(node.end - 1, node.end);
        visit(node.expression);
        return;

      case 'TSInstantiationExpression':
        if (node.typeParameters) {
          markRemove(node.typeParameters.start, node.typeParameters.end);
        } else {
          markRemove(node.expression.end, node.end);
        }
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

  // Collect locally-declared type names and *.types imports so local `export { Foo }`
  // doesn't emit runtime exports for type-only symbols.
  const declaredTypeOnlyNames = new Set<string>();
  const declaredRuntimeNames = new Set<string>();
  const bodyStmts: AstNode[] =
    ast.type === 'File'
      ? ast.program?.body ?? []
      : ast.type === 'Program'
        ? ast.body ?? []
        : [];
  for (const stmt of bodyStmts) {
    if (stmt.type === 'TSInterfaceDeclaration' || stmt.type === 'TSTypeAliasDeclaration') {
      if (stmt.id?.name) declaredTypeOnlyNames.add(stmt.id.name);
    } else if (stmt.type === 'ImportDeclaration') {
      for (const sp of stmt.specifiers ?? []) {
        if (stmt.importKind === 'type' || sp.importKind === 'type') {
          if (sp.local?.name) declaredTypeOnlyNames.add(sp.local.name);
        }
      }
    } else if (
      stmt.type === 'FunctionDeclaration' ||
      stmt.type === 'ClassDeclaration' ||
      stmt.type === 'TSEnumDeclaration'
    ) {
      if (stmt.id?.name && !stmt.declare) declaredRuntimeNames.add(stmt.id.name);
    } else if (stmt.type === 'VariableDeclaration' && !stmt.declare) {
      for (const d of stmt.declarations ?? []) {
        if (d.id?.type === 'Identifier') declaredRuntimeNames.add(d.id.name);
      }
    }
  }

  // Handle local `export { A, B }` statements
  for (const node of deferredReexports) {
    const specs: AstNode[] = node.specifiers ?? [];
    const keptSpecs = specs.filter((sp) => {
      if (sp.exportKind === 'type') return false;
      const loc = sp.local?.name;
      if (loc && declaredTypeOnlyNames.has(loc) && !declaredRuntimeNames.has(loc)) return false;
      return true;
    });
    for (const sp of keptSpecs) {
      if (sp.local?.name) runtimeIdentifiers.add(sp.local.name);
    }
    if (keptSpecs.length === 0) {
      markRemove(node.start, node.end);
    } else if (keptSpecs.length < specs.length) {
      const kept = keptSpecs.map((sp) => {
        const loc = sp.local.name;
        const exp = sp.exported.name;
        return loc === exp ? loc : `${loc} as ${exp}`;
      });
      markOverwrite(node.start, node.end, `export { ${kept.join(', ')} };`);
    }
  }

  // Also include identifiers referenced inside any skipped decorator subtrees (since lowered
  // decorators still reference their imported decorator names at runtime!).
  const collectSkipIds = (n: AstNode) => {
    if (!isNode(n)) return;
    if (n.type === 'Identifier') {
      runtimeIdentifiers.add(n.name);
      return;
    }
    for (const key of Object.keys(n)) {
      if (
        key === 'type' || key === 'start' || key === 'end' || key === 'loc' ||
        key === 'typeAnnotation' || key === 'typeParameters' || key === 'returnType' ||
        key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments'
      ) continue;
      const val = n[key];
      if (Array.isArray(val)) {
        for (const item of val) if (isNode(item)) collectSkipIds(item);
      } else if (isNode(val)) {
        collectSkipIds(val);
      }
    }
  };
  for (const skippedNode of skip) {
    collectSkipIds(skippedNode);
  }

  // Elide explicit `import type` specifiers AND unreferenced value-syntax type-only imports
  // (matching TypeScript's standard import elision, preserving runtime enums/consts from *.types).
  for (const node of deferredImports) {
    const specs: AstNode[] = node.specifiers ?? [];
    const keptSpecs = specs.filter((sp) => {
      if (sp.importKind === 'type') return false;
      const local = sp.local?.name;
      if (!local) return true;
      return runtimeIdentifiers.has(local);
    });
    if (keptSpecs.length === specs.length) continue;
    if (keptSpecs.length === 0) {
      markRemove(node.start, node.end);
      continue;
    }
    const defaultSpec = keptSpecs.find((sp) => sp.type === 'ImportDefaultSpecifier');
    const nsSpec = keptSpecs.find((sp) => sp.type === 'ImportNamespaceSpecifier');
    const namedSpecs = keptSpecs.filter((sp) => sp.type === 'ImportSpecifier');
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
  }

  return changed;
}
