import MagicString from 'magic-string';
import { parseModuleAst } from './parser';
import { TC39_SPECIFIER } from './tc39-fallback-runtime';
import { stripTypeScriptSyntax } from './ts-strip';

type AstNode = Record<string, any>;

const SNICE_CLASS_CALL_DECORATORS = new Set(['element', 'layout', 'page', 'controller']);
const SNICE_CLASS_BARE_DECORATORS = new Set(['daemon']);
const SNICE_FIELD_ASSIGN_DECORATORS = new Set(['property', 'state']);
const SNICE_FIELD_ACCESSOR_DECORATORS = new Set(['query', 'queryAll', 'contextProperty']);
const SNICE_FIELD_DECORATORS = new Set([
  ...SNICE_FIELD_ASSIGN_DECORATORS,
  ...SNICE_FIELD_ACCESSOR_DECORATORS,
]);
const SNICE_METHOD_DECORATORS = new Set([
  'render',
  'styles',
  'ready',
  'dispose',
  'reconnect',
  'moved',
  'adopted',
  'watch',
  'on',
  'observe',
  'respond',
  'context',
  'dispatch',
  'request',
  'debounce',
  'throttle',
  'once',
  'memoize',
]);

export interface DecoratorTransformOptions {
  /** Whether to also strip TypeScript-only syntax (true in Rollup, false in Vite). */
  stripTypeScript: boolean;
  /** File path / module ID for error diagnostics and sourcemaps. */
  id: string;
}

export interface DecoratorTransformResult {
  code: string;
  map: ReturnType<MagicString['generateMap']>;
}

function isNode(value: unknown): value is AstNode {
  return typeof value === 'object' && value !== null && typeof (value as any).type === 'string';
}

function getPropertyKeyName(node: AstNode): { literal: string; rawName: string } | null {
  if (node.computed) return null;
  const key = node.key;
  if (!key) return null;
  if (key.type === 'Identifier') {
    return { literal: JSON.stringify(key.name), rawName: key.name };
  }
  if (key.type === 'StringLiteral') {
    return { literal: JSON.stringify(key.value), rawName: key.value };
  }
  if (key.type === 'NumericLiteral') {
    return { literal: JSON.stringify(String(key.value)), rawName: String(key.value) };
  }
  return null;
}

function propAccess(target: string, rawName: string): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(rawName)) {
    return `${target}.${rawName}`;
  }
  return `${target}[${JSON.stringify(rawName)}]`;
}

function sliceExpr(node: AstNode, code: string, stripTs: boolean): string {
  if (!stripTs) return code.slice(node.start, node.end);
  const ms = new MagicString(code);
  stripTypeScriptSyntax(node, code, ms);
  return ms.slice(node.start, node.end);
}

/**
 * Collect local bindings imported from `'snice'` (including aliased imports)
 * and same-file `const { page } = Router(...)` bindings.
 */
function collectSniceBindings(ast: AstNode): {
  bindings: Map<string, string>;
  sniceSource: string | null;
} {
  const bindings = new Map<string, string>();
  let sniceSource: string | null = null;
  const routerLocals = new Set<string>();

  for (const stmt of ast.program?.body ?? []) {
    if (stmt.type === 'ImportDeclaration' && stmt.importKind !== 'type') {
      const src = stmt.source?.value;
      if (src === 'snice') {
        sniceSource = src;
        for (const spec of stmt.specifiers ?? []) {
          if (spec.type === 'ImportSpecifier' && spec.importKind !== 'type') {
            const imported =
              spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value;
            const local = spec.local.name;
            bindings.set(local, imported);
            if (imported === 'Router') routerLocals.add(local);
          }
        }
      }
    }
  }

  // Detect same-file `const { page } = Router(...)` or `const { page: p } = Router(...)`
  if (routerLocals.size > 0) {
    for (const stmt of ast.program?.body ?? []) {
      const decl =
        stmt.type === 'VariableDeclaration'
          ? stmt
          : stmt.type === 'ExportNamedDeclaration' && stmt.declaration?.type === 'VariableDeclaration'
            ? stmt.declaration
            : null;
      if (!decl) continue;
      for (const declarator of decl.declarations ?? []) {
        if (
          declarator.id?.type === 'ObjectPattern' &&
          declarator.init?.type === 'CallExpression' &&
          declarator.init.callee?.type === 'Identifier' &&
          routerLocals.has(declarator.init.callee.name)
        ) {
          for (const prop of declarator.id.properties ?? []) {
            if (
              prop.type === 'ObjectProperty' &&
              !prop.computed &&
              prop.key?.type === 'Identifier' &&
              prop.key.name === 'page' &&
              prop.value?.type === 'Identifier'
            ) {
              bindings.set(prop.value.name, 'page');
            }
          }
        }
      }
    }
  }

  return { bindings, sniceSource };
}

function classifySniceClassDecorator(
  dec: AstNode,
  bindings: ReadonlyMap<string, string>
): { exportedName: string; isBare: boolean } | null {
  const expr = dec.expression;
  if (!expr) return null;
  if (expr.type === 'Identifier') {
    const exp = bindings.get(expr.name);
    if (exp && SNICE_CLASS_BARE_DECORATORS.has(exp)) {
      return { exportedName: exp, isBare: true };
    }
    return null;
  }
  if (expr.type === 'CallExpression' && expr.callee?.type === 'Identifier') {
    const exp = bindings.get(expr.callee.name);
    if (exp && SNICE_CLASS_CALL_DECORATORS.has(exp)) {
      return { exportedName: exp, isBare: false };
    }
  }
  return null;
}

function classifySniceMemberDecorator(
  dec: AstNode,
  kind: 'field' | 'method',
  bindings: ReadonlyMap<string, string>
): string | null {
  const expr = dec.expression;
  if (!expr || expr.type !== 'CallExpression' || expr.callee?.type !== 'Identifier') {
    return null;
  }
  const exp = bindings.get(expr.callee.name);
  if (!exp) return null;
  if (kind === 'field' && SNICE_FIELD_DECORATORS.has(exp)) return exp;
  if (kind === 'method' && SNICE_METHOD_DECORATORS.has(exp)) return exp;
  return null;
}

function canLowerAsPureSnice(
  classNode: AstNode,
  bindings: ReadonlyMap<string, string>
): boolean {
  const classDecs: AstNode[] = classNode.decorators ?? [];
  for (const d of classDecs) {
    if (!classifySniceClassDecorator(d, bindings)) return false;
  }

  let hasAnyMemberDec = false;
  for (const member of classNode.body?.body ?? []) {
    const mDecs: AstNode[] = member.decorators ?? [];
    if (mDecs.length === 0) continue;
    hasAnyMemberDec = true;

    if (member.static) return false;
    const keyInfo = getPropertyKeyName(member);
    if (!keyInfo) return false;

    if (member.type === 'ClassProperty') {
      // Pure Snice field decorators are single-decorator fields
      for (const d of mDecs) {
        if (!classifySniceMemberDecorator(d, 'field', bindings)) return false;
      }
      if (mDecs.length > 1) return false;
    } else if (member.type === 'ClassMethod' && member.kind === 'method') {
      for (const d of mDecs) {
        if (!classifySniceMemberDecorator(d, 'method', bindings)) return false;
      }
    } else {
      // getter, setter, accessor, private property/method -> TC39 fallback
      return false;
    }
  }

  return classDecs.length > 0 || hasAnyMemberDec;
}

function classHasAnyDecorator(classNode: AstNode): boolean {
  if ((classNode.decorators?.length ?? 0) > 0) return true;
  for (const member of classNode.body?.body ?? []) {
    if ((member.decorators?.length ?? 0) > 0) return true;
  }
  return false;
}

/**
 * Find every `super(...)` CallExpression inside a constructor body without
 * descending into nested classes or non-arrow functions.
 */
function findSuperCalls(
  node: AstNode | null | undefined,
  parent: AstNode | null,
  results: Array<{ call: AstNode; parent: AstNode | null }>
): void {
  if (!isNode(node)) return;
  if (
    node.type === 'ClassDeclaration' ||
    node.type === 'ClassExpression' ||
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression'
  ) {
    return;
  }
  if (node.type === 'CallExpression' && node.callee?.type === 'Super') {
    results.push({ call: node, parent });
    return;
  }
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') continue;
    const val = node[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (isNode(item)) findSuperCalls(item, node, results);
      }
    } else if (isNode(val)) {
      findSuperCalls(val, node, results);
    }
  }
}

function injectConstructorPrologue(
  classNode: AstNode,
  s: MagicString,
  prologueStmts: string
): void {
  if (!prologueStmts) return;

  const ctor = (classNode.body?.body ?? []).find(
    (m: AstNode) => m.type === 'ClassMethod' && m.kind === 'constructor'
  );
  const hasSuper = Boolean(classNode.superClass);

  if (!ctor) {
    const synthetic = hasSuper
      ? ` constructor(...__sniceArgs) { super(...__sniceArgs); ${prologueStmts} } `
      : ` constructor() { ${prologueStmts} } `;
    s.appendRight(classNode.body.start + 1, synthetic);
    return;
  }

  if (!hasSuper) {
    s.appendRight(ctor.body.start + 1, ` ${prologueStmts} `);
    return;
  }

  const superCalls: Array<{ call: AstNode; parent: AstNode | null }> = [];
  findSuperCalls(ctor.body, null, superCalls);

  if (superCalls.length === 0) {
    s.appendRight(ctor.body.start + 1, ` ${prologueStmts} `);
    return;
  }

  for (const { call, parent } of superCalls) {
    if (parent && parent.type === 'ExpressionStatement') {
      s.appendRight(parent.end, ` ${prologueStmts}`);
    } else {
      s.prependLeft(call.start, '(');
      s.appendRight(call.end, `, (() => { ${prologueStmts} return this; })())`);
    }
  }
}

function removeDecoratorsRange(
  decorators: AstNode[],
  s: MagicString,
  skipInsideStart?: number,
  skipInsideEnd?: number
): void {
  if (!decorators || decorators.length === 0) return;
  for (const d of decorators) {
    if (
      skipInsideStart !== undefined &&
      skipInsideEnd !== undefined &&
      d.start >= skipInsideStart &&
      d.end <= skipInsideEnd
    ) {
      continue;
    }
    s.remove(d.start, d.end);
  }
}

function findClassKeywordIdx(code: string, classNode: AstNode): number {
  const decs: AstNode[] = classNode.decorators ?? [];
  let searchFrom = classNode.start;
  for (const d of decs) {
    if (d.end > searchFrom) searchFrom = d.end;
  }
  const idx = code.indexOf('class', searchFrom);
  return idx >= 0 ? idx : classNode.start;
}

function findEnclosingStatementStart(classNode: AstNode, parent: AstNode | null): number {
  if (
    parent &&
    (parent.type === 'ExportNamedDeclaration' || parent.type === 'ExportDefaultDeclaration')
  ) {
    return parent.start;
  }
  return classNode.start;
}

/**
 * Transform Snice decorators into compact registration calls and compile any
 * non-Snice / mixed decorators via the TC39 2022-03 fallback runtime.
 */
export function transformDecorators(
  code: string,
  opts: DecoratorTransformOptions
): DecoratorTransformResult | null {
  const cleanId = opts.id.split('?')[0];
  const isTs = /\.[cm]?tsx?$/.test(cleanId);
  const isTsx = /\.[cm]?tsx$/.test(cleanId) || cleanId.endsWith('.jsx');
  const hasAt = code.includes('@');

  // Fast O(1) pre-filter when no decorators AND no TS stripping needed
  if (!hasAt && (!opts.stripTypeScript || !isTs)) {
    return null;
  }

  let ast: AstNode;
  try {
    ast = parseModuleAst(code, cleanId);
  } catch (err: any) {
    const line = err?.loc?.line ?? 1;
    const col = err?.loc?.column ?? 0;
    throw new SyntaxError(`${opts.id}:${line}:${col}: ${err?.message || 'Syntax error'}`);
  }

  const s = new MagicString(code);
  const skipTsNodes = new Set<AstNode>();
  const { bindings, sniceSource } = collectSniceBindings(ast);

  // Collect all decorated classes (skipping classes inside other decorated classes? No, visit all)
  const decoratedClasses: Array<{ node: AstNode; parent: AstNode | null }> = [];
  function collectClasses(node: AstNode | null | undefined, parent: AstNode | null): void {
    if (!isNode(node)) return;
    if (
      (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') &&
      classHasAnyDecorator(node)
    ) {
      decoratedClasses.push({ node, parent });
      // Do not recurse into decorated class body to avoid overlapping edits;
      // nested decorated classes inside methods are extremely rare.
      return;
    }
    for (const key of Object.keys(node)) {
      if (key === 'type' || key === 'start' || key === 'end' || key === 'loc') continue;
      const val = node[key];
      if (Array.isArray(val)) {
        for (const item of val) {
          if (isNode(item)) collectClasses(item, node);
        }
      } else if (isNode(val)) {
        collectClasses(val, node);
      }
    }
  }
  collectClasses(ast.program, null);

  let needsSniceMeta = false;
  let needsSniceField = false;
  let needsSniceMethod = false;
  let needsTc39Runtime = false;
  let classCounter = 0;

  for (const { node: classNode, parent } of decoratedClasses) {
    const idx = classCounter++;
    const pureSnice = sniceSource !== null && canLowerAsPureSnice(classNode, bindings);

    const isExportDefault = parent?.type === 'ExportDefaultDeclaration';
    const isExportNamed = parent?.type === 'ExportNamedDeclaration';
    const isClassExpr = classNode.type === 'ClassExpression';
    const originalName = classNode.id?.name ?? null;
    const bindingName = originalName ?? `__SniceCls${idx}`;

    if (pureSnice) {
      // Lower class using compact Snice runtime helpers
      const metaVar = `__sm${idx}`;
      const initsVar = `__si${idx}`;
      const classDecs: AstNode[] = classNode.decorators ?? [];
      const postLines: string[] = [];
      const prologueParts: string[] = [];

      // Determine whether this class uses fields or methods
      const decoratedFields: Array<{
        member: AstNode;
        fieldVar: string;
        rawName: string;
        literal: string;
        decExpr: string;
        assignResult: boolean;
        initExpr: string;
      }> = [];
      const decoratedMethods: Array<{
        member: AstNode;
        rawName: string;
        literal: string;
        decExprs: string[];
      }> = [];

      let fieldIdx = 0;
      for (const member of classNode.body?.body ?? []) {
        const mDecs: AstNode[] = member.decorators ?? [];
        if (mDecs.length === 0) continue;
        const keyInfo = getPropertyKeyName(member)!;

        if (member.type === 'ClassProperty') {
          const dec = mDecs[0];
          const expName = classifySniceMemberDecorator(dec, 'field', bindings)!;
          const fieldVar = `__sf${idx}_${fieldIdx++}`;
          const decExpr = sliceExpr(dec.expression, code, opts.stripTypeScript);
          const initExpr = member.value
            ? sliceExpr(member.value, code, opts.stripTypeScript)
            : 'void 0';
          decoratedFields.push({
            member,
            fieldVar,
            rawName: keyInfo.rawName,
            literal: keyInfo.literal,
            decExpr,
            assignResult: SNICE_FIELD_ASSIGN_DECORATORS.has(expName),
            initExpr,
          });
          // Remove the decorated ClassProperty completely (no ES2022 shadowing!)
          s.remove(member.start, member.end);
          skipTsNodes.add(member);
        } else if (member.type === 'ClassMethod') {
          const decExprs = mDecs.map((d) => sliceExpr(d.expression, code, opts.stripTypeScript));
          decoratedMethods.push({
            member,
            rawName: keyInfo.rawName,
            literal: keyInfo.literal,
            decExprs,
          });
          removeDecoratorsRange(mDecs, s);
          for (const d of mDecs) skipTsNodes.add(d);
        }
      }

      // Remove class decorators (skip any already covered by export default overwrite)
      const classKeywordIdx = findClassKeywordIdx(code, classNode);
      if (isExportDefault) {
        const overwriteEnd = originalName ? classKeywordIdx : classKeywordIdx + 'class'.length;
        removeDecoratorsRange(classDecs, s, parent!.start, overwriteEnd);
      } else {
        removeDecoratorsRange(classDecs, s);
      }
      for (const d of classDecs) skipTsNodes.add(d);

      const usesMeta =
        decoratedFields.length > 0 ||
        decoratedMethods.length > 0 ||
        classDecs.some((d) => !classifySniceClassDecorator(d, bindings)!.isBare);

      if (usesMeta) {
        needsSniceMeta = true;
        postLines.push(`const ${metaVar} = __sniceMeta(${bindingName});`);
      }

      if (decoratedMethods.length > 0) {
        needsSniceMethod = true;
        postLines.push(`const ${initsVar} = [];`);
        prologueParts.push(
          `for (let __k = 0; __k < ${initsVar}.length; __k++) ${initsVar}[__k].call(this);`
        );
      }

      for (const f of decoratedFields) {
        needsSniceField = true;
        postLines.push(
          `const ${f.fieldVar} = __sniceField(${f.decExpr}, ${f.literal}, ${metaVar});`
        );
        if (f.assignResult) {
          prologueParts.push(`${propAccess('this', f.rawName)} = ${f.fieldVar}.call(this, ${f.initExpr});`);
        } else {
          prologueParts.push(`${f.fieldVar}.call(this, ${f.initExpr});`);
        }
      }

      for (const m of decoratedMethods) {
        postLines.push(
          `__sniceMethod(${bindingName}.prototype, ${m.literal}, [${m.decExprs.join(', ')}], ${initsVar}, ${metaVar});`
        );
      }

      // Apply class decorators bottom-to-top
      for (let i = classDecs.length - 1; i >= 0; i--) {
        const d = classDecs[i];
        const info = classifySniceClassDecorator(d, bindings)!;
        const decExpr = sliceExpr(d.expression, code, opts.stripTypeScript);
        const classNameJson = JSON.stringify(originalName ?? '');
        if (info.isBare) {
          postLines.push(`${decExpr}(${bindingName}, { kind: "class", name: ${classNameJson} });`);
        } else {
          postLines.push(
            `${decExpr}(${bindingName}, { kind: "class", name: ${classNameJson}, metadata: ${metaVar} });`
          );
        }
      }

      injectConstructorPrologue(classNode, s, prologueParts.join(' '));

      if (isClassExpr) {
        s.prependLeft(classKeywordIdx, `(() => { const ${bindingName} = `);
        s.appendRight(classNode.end, `; ${postLines.join(' ')} return ${bindingName}; })()`);
      } else if (isExportDefault) {
        // Rewrite `export default class [Name]` → `class BindingName` + postLines + `export default BindingName;`
        if (originalName) {
          s.remove(parent!.start, classKeywordIdx);
        } else {
          s.overwrite(parent!.start, classKeywordIdx + 'class'.length, `class ${bindingName}`);
        }
        s.appendRight(
          parent!.end,
          `\n${postLines.join('\n')}\nexport default ${bindingName};`
        );
      } else {
        // Plain `class Foo` or `export class Foo`
        s.appendRight(
          isExportNamed ? parent!.end : classNode.end,
          `\n${postLines.join('\n')}`
        );
      }
    } else {
      // Whole-class TC39 2022-03 fallback (handles non-Snice, mixed, cross-module @page, getters/setters/accessors)
      needsTc39Runtime = true;
      const decResVar = `__sd${idx}`;
      const classDecs: AstNode[] = classNode.decorators ?? [];
      const classDecExprs = classDecs.map((d) => sliceExpr(d.expression, code, opts.stripTypeScript));
      const memberSpecs: string[] = [];
      const instFieldStmts: string[] = [];
      const staticFieldStmts: string[] = [];

      for (const member of classNode.body?.body ?? []) {
        const mDecs: AstNode[] = member.decorators ?? [];
        if (mDecs.length === 0) continue;

        const keyInfo = getPropertyKeyName(member);
        const keyExpr = keyInfo
          ? keyInfo.literal
          : sliceExpr(member.key, code, opts.stripTypeScript);
        const isStatic = member.static ? 1 : 0;
        const decExprs = mDecs.map((d) => sliceExpr(d.expression, code, opts.stripTypeScript));

        if (member.type === 'ClassProperty' || member.type === 'ClassAccessorProperty') {
          const kind = member.type === 'ClassAccessorProperty' ? 'accessor' : 'field';
          memberSpecs.push(`[${JSON.stringify(kind)}, ${keyExpr}, ${isStatic}, [${decExprs.join(', ')}]]`);
          const initExpr = member.value
            ? sliceExpr(member.value, code, opts.stripTypeScript)
            : 'void 0';
          const slotKey = isStatic ? `"s:" + String(${keyExpr})` : `"i:" + String(${keyExpr})`;
          if (isStatic) {
            staticFieldStmts.push(
              `${bindingName}[${keyExpr}] = __tc39RunField(${bindingName}, ${decResVar}.f[${slotKey}], ${initExpr});`
            );
          } else {
            const lhs = keyInfo ? propAccess('this', keyInfo.rawName) : `this[${keyExpr}]`;
            instFieldStmts.push(
              `${lhs} = __tc39RunField(this, ${decResVar}.f[${slotKey}], ${initExpr});`
            );
          }
          s.remove(member.start, member.end);
          skipTsNodes.add(member);
        } else if (member.type === 'ClassMethod') {
          const kind =
            member.kind === 'get' ? 'getter' : member.kind === 'set' ? 'setter' : 'method';
          memberSpecs.push(`[${JSON.stringify(kind)}, ${keyExpr}, ${isStatic}, [${decExprs.join(', ')}]]`);
          removeDecoratorsRange(mDecs, s);
          for (const d of mDecs) skipTsNodes.add(d);
        }
      }

      const classKeywordIdx = findClassKeywordIdx(code, classNode);
      const stmtStart = findEnclosingStatementStart(classNode, parent);
      if (isClassExpr) {
        removeDecoratorsRange(classDecs, s);
      } else {
        removeDecoratorsRange(classDecs, s, stmtStart, classKeywordIdx);
      }
      for (const d of classDecs) skipTsNodes.add(d);

      const prologue = [
        `for (let __k = 0; __k < ${decResVar}.e.length; __k++) ${decResVar}.e[__k].call(this);`,
        ...instFieldStmts,
      ].join(' ');
      injectConstructorPrologue(classNode, s, prologue);

      const applyLines = [
        `const ${decResVar} = __tc39Apply(${bindingName}, [${classDecExprs.join(', ')}], [${memberSpecs.join(', ')}]);`,
        `${bindingName} = ${decResVar}.c;`,
        ...staticFieldStmts,
      ];

      if (isClassExpr) {
        s.prependLeft(classKeywordIdx, `(() => { let ${bindingName} = `);
        s.appendRight(classNode.end, `; ${applyLines.join(' ')} return ${bindingName}; })()`);
      } else if (isExportDefault) {
        s.overwrite(parent!.start, classKeywordIdx, `let ${bindingName} = `);
        s.appendRight(
          parent!.end,
          `;\n${applyLines.join('\n')}\nexport default ${bindingName};`
        );
      } else if (isExportNamed) {
        s.overwrite(parent!.start, classKeywordIdx, `let ${bindingName} = `);
        s.appendRight(
          parent!.end,
          `;\n${applyLines.join('\n')}\nexport { ${bindingName} };`
        );
      } else {
        if (classKeywordIdx > stmtStart) {
          s.overwrite(stmtStart, classKeywordIdx, `let ${bindingName} = `);
        } else {
          s.prependLeft(classKeywordIdx, `let ${bindingName} = `);
        }
        s.appendRight(classNode.end, `;\n${applyLines.join('\n')}`);
      }
    }
  }

  let tsChanged = false;
  if (opts.stripTypeScript && isTs) {
    tsChanged = stripTypeScriptSyntax(ast, code, s, skipTsNodes);
  }

  if (decoratedClasses.length === 0 && !tsChanged) {
    return null;
  }

  // Prepend only the runtime helper imports actually referenced in this module
  const importsToPrepend: string[] = [];
  const sniceHelpers: string[] = [];
  if (needsSniceMeta) sniceHelpers.push('__sniceMeta');
  if (needsSniceField) sniceHelpers.push('__sniceField');
  if (needsSniceMethod) sniceHelpers.push('__sniceMethod');
  if (sniceHelpers.length > 0) {
    importsToPrepend.push(
      `import { ${sniceHelpers.join(', ')} } from ${JSON.stringify(sniceSource ?? 'snice')};`
    );
  }
  if (needsTc39Runtime) {
    importsToPrepend.push(
      `import { __tc39Apply, __tc39RunField } from ${JSON.stringify(TC39_SPECIFIER)};`
    );
  }
  if (importsToPrepend.length > 0) {
    s.prepend(`${importsToPrepend.join('\n')}\n`);
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
