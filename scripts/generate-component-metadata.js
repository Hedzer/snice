#!/usr/bin/env node

/**
 * Generate standards-compatible custom-element metadata from component source.
 *
 * Outputs are deterministic and intentionally derived from the TypeScript AST,
 * not a hand-maintained component list:
 *   - custom-elements.json (Custom Elements Manifest)
 *   - vscode.html-custom-data.json (HTML editor completion)
 *   - components/custom-elements.d.ts (HTMLElementTagNameMap)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { getWipComponents } from './wip-components.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentsRoot = path.join(projectRoot, 'components');

function posix(value) {
  return value.split(path.sep).join('/');
}

function kebab(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase();
}

function decoratorsOf(node) {
  return ts.canHaveDecorators(node) ? ts.getDecorators(node) || [] : [];
}

function decoratorCall(node, name) {
  for (const decorator of decoratorsOf(node)) {
    const expression = decorator.expression;
    if (ts.isCallExpression(expression) && ts.isIdentifier(expression.expression) && expression.expression.text === name) {
      return expression;
    }
    if (ts.isIdentifier(expression) && expression.text === name) return expression;
  }
  return undefined;
}

function literal(node) {
  if (!node) return undefined;
  if (ts.isStringLiteralLike(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  return undefined;
}

function objectOptions(node) {
  const result = new Map();
  if (!node || !ts.isObjectLiteralExpression(node)) return result;
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const name = property.name && (ts.isIdentifier(property.name) || ts.isStringLiteralLike(property.name))
      ? property.name.text
      : undefined;
    if (name) result.set(name, property.initializer);
  }
  return result;
}

function hasModifier(node, kind) {
  return !!node.modifiers?.some(modifier => modifier.kind === kind);
}

function descriptionOf(node, source) {
  const ranges = ts.getLeadingCommentRanges(source.text, node.getFullStart()) || [];
  const jsdoc = [...ranges].reverse().find(range => source.text.slice(range.pos, range.end).startsWith('/**'));
  if (!jsdoc) return undefined;
  const text = source.text.slice(jsdoc.pos + 3, jsdoc.end - 2)
    .split('\n')
    .map(line => line.replace(/^\s*\* ?/, '').trimEnd())
    .filter(line => !line.trimStart().startsWith('@'))
    .join('\n')
    .trim();
  return text || undefined;
}

function memberName(member) {
  return member.name && (ts.isIdentifier(member.name) || ts.isStringLiteralLike(member.name))
    ? member.name.text
    : undefined;
}

function inferType(member, source, aliases = new Map()) {
  if (member.type) {
    const text = member.type.getText(source);
    return aliases.get(text) || text;
  }
  const initializer = member.initializer;
  if (!initializer) return 'unknown';
  if (initializer.kind === ts.SyntaxKind.TrueKeyword || initializer.kind === ts.SyntaxKind.FalseKeyword) return 'boolean';
  if (ts.isStringLiteralLike(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) return 'string';
  if (ts.isNumericLiteral(initializer)) return 'number';
  if (ts.isArrayLiteralExpression(initializer)) return 'unknown[]';
  if (ts.isObjectLiteralExpression(initializer)) return 'Record<string, unknown>';
  if (ts.isNewExpression(initializer) && ts.isIdentifier(initializer.expression)) {
    const name = initializer.expression.text;
    if (name === 'Map') return 'Map<unknown, unknown>';
    if (name === 'Set') return 'Set<unknown>';
    return name;
  }
  return 'unknown';
}

function decoratorType(options, fallback) {
  const typeNode = options.get('type');
  if (!typeNode || !ts.isIdentifier(typeNode)) return fallback;
  const types = new Map([
    ['String', 'string'],
    ['Number', 'number'],
    ['Boolean', 'boolean'],
    ['Array', 'unknown[]'],
    ['Object', 'Record<string, unknown>'],
    ['Date', 'Date'],
    ['BigInt', 'bigint']
  ]);
  return types.get(typeNode.text) || fallback;
}

function defaultValue(member, source) {
  return member.initializer ? member.initializer.getText(source) : undefined;
}

function methodParameters(member, source) {
  return member.parameters.map(parameter => ({
    name: parameter.name.getText(source),
    type: parameter.type?.getText(source) || 'unknown',
    optional: !!parameter.questionToken || !!parameter.initializer,
    ...(parameter.dotDotDotToken ? { rest: true } : {})
  }));
}

function collectMarkupMetadata(sourceText) {
  const slots = new Set();
  const parts = new Set();
  for (const match of sourceText.matchAll(/<slot(?:\s[^>]*?\bname\s*=\s*["']([^"']+)["'])?[^>]*>/g)) {
    slots.add(match[1] || '');
  }
  for (const match of sourceText.matchAll(/\bpart\s*=\s*["']([^"']+)["']/g)) {
    for (const part of match[1].trim().split(/\s+/)) if (part) parts.add(part);
  }
  return {
    slots: [...slots].sort().map(name => ({ name })),
    cssParts: [...parts].sort().map(name => ({ name }))
  };
}

function collectCssProperties(sourcePath) {
  const cssPath = sourcePath.replace(/\.ts$/, '.css');
  if (!fs.existsSync(cssPath)) return [];
  const css = fs.readFileSync(cssPath, 'utf8');
  const names = new Set();
  for (const match of css.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)) names.add(match[1]);
  return [...names].sort().map(name => ({ name }));
}

function findSourceFiles() {
  const wip = getWipComponents();
  const files = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (directory === componentsRoot && wip.has(entry.name)) continue;
        visit(full);
      } else if (
        entry.name.endsWith('.ts') &&
        !entry.name.endsWith('.d.ts') &&
        !entry.name.endsWith('.types.ts') &&
        !entry.name.endsWith('.stories.ts') &&
        !entry.name.includes('demo') &&
        !entry.name.includes('controller')
      ) {
        files.push(full);
      }
    }
  };
  visit(componentsRoot);
  return files.sort();
}

function eventFromCall(call, source) {
  if (!ts.isNewExpression(call) || !ts.isIdentifier(call.expression) || call.expression.text !== 'CustomEvent') {
    return undefined;
  }
  const name = literal(call.arguments?.[0]);
  if (typeof name !== 'string') return undefined;
  return {
    name,
    type: call.typeArguments?.[0]?.getText(source) || 'CustomEvent<unknown>'
  };
}

function collectEvents(classNode, source) {
  const events = new Map();
  for (const member of classNode.members) {
    const dispatchCall = decoratorCall(member, 'dispatch');
    if (dispatchCall && ts.isCallExpression(dispatchCall)) {
      const name = literal(dispatchCall.arguments[0]);
      if (typeof name === 'string') {
        const returned = member.type?.getText(source);
        events.set(name, {
          name,
          type: returned && returned !== 'void' ? `CustomEvent<${returned}>` : 'CustomEvent<unknown>',
          description: descriptionOf(member, source)
        });
      }
    }
  }
  const visit = node => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'dispatchEvent' &&
      node.arguments[0] &&
      ts.isNewExpression(node.arguments[0])
    ) {
      const event = eventFromCall(node.arguments[0], source);
      if (event && !events.has(event.name)) events.set(event.name, event);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(classNode, visit);
  return [...events.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function parseComponentFile(sourcePath) {
  const text = fs.readFileSync(sourcePath, 'utf8');
  const source = ts.createSourceFile(sourcePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const aliases = new Map();
  const aliasFiles = [sourcePath, sourcePath.replace(/\.ts$/, '.types.ts')].filter(file => fs.existsSync(file));
  for (const aliasFile of aliasFiles) {
    const aliasSource = aliasFile === sourcePath
      ? source
      : ts.createSourceFile(aliasFile, fs.readFileSync(aliasFile, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    for (const statement of aliasSource.statements) {
      if (ts.isTypeAliasDeclaration(statement)) aliases.set(statement.name.text, statement.type.getText(aliasSource));
    }
  }
  const declarations = [];
  const componentPath = posix(path.relative(componentsRoot, sourcePath).replace(/\.ts$/, '.js'));
  const modulePath = `dist/components/${componentPath}`;

  for (const statement of source.statements) {
    if (!ts.isClassDeclaration(statement) || !statement.name) continue;
    const elementCall = decoratorCall(statement, 'element');
    if (!elementCall || !ts.isCallExpression(elementCall)) continue;
    const tagName = literal(elementCall.arguments[0]);
    if (typeof tagName !== 'string') continue;

    const className = statement.name.text;
    const superclass = statement.heritageClauses
      ?.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword)
      ?.types[0]?.expression.getText(source) || 'HTMLElement';
    const kebabAttributes = superclass === 'SniceElement';
    const members = [];
    const attributes = [];

    for (const member of statement.members) {
      const name = memberName(member);
      if (!name || hasModifier(member, ts.SyntaxKind.PrivateKeyword) || hasModifier(member, ts.SyntaxKind.ProtectedKeyword)) continue;

      const propertyCall = decoratorCall(member, 'property');
      const stateCall = decoratorCall(member, 'state');
      if (propertyCall && ts.isPropertyDeclaration(member)) {
        const options = ts.isCallExpression(propertyCall) ? objectOptions(propertyCall.arguments[0]) : new Map();
        const type = decoratorType(options, inferType(member, source, aliases));
        const field = {
          kind: 'field',
          name,
          type: { text: type },
          ...(defaultValue(member, source) !== undefined ? { default: defaultValue(member, source) } : {}),
          ...(descriptionOf(member, source) ? { description: descriptionOf(member, source) } : {})
        };
        members.push(field);

        const configuredAttribute = literal(options.get('attribute'));
        if (configuredAttribute !== false) {
          const attributeName = typeof configuredAttribute === 'string'
            ? configuredAttribute
            : kebabAttributes ? kebab(name) : name.toLowerCase();
          attributes.push({
            name: attributeName,
            fieldName: name,
            type: { text: type },
            ...(literal(options.get('reflect')) === false ? {} : { reflects: true }),
            ...(descriptionOf(member, source) ? { description: descriptionOf(member, source) } : {})
          });
        }
        continue;
      }

      if (stateCall) continue;
      if (ts.isMethodDeclaration(member) && !hasModifier(member, ts.SyntaxKind.StaticKeyword)) {
        if (['render', 'styles', 'connectedCallback', 'disconnectedCallback', 'attributeChangedCallback'].includes(name)) continue;
        members.push({
          kind: 'method',
          name,
          parameters: methodParameters(member, source),
          return: { type: { text: member.type?.getText(source) || 'unknown' } },
          ...(descriptionOf(member, source) ? { description: descriptionOf(member, source) } : {})
        });
      }
    }

    const markup = collectMarkupMetadata(text);
    declarations.push({
      kind: 'class',
      name: className,
      tagName,
      customElement: true,
      superclass: { name: superclass },
      ...(descriptionOf(statement, source) ? { description: descriptionOf(statement, source) } : {}),
      members: members.sort((a, b) => a.name.localeCompare(b.name)),
      attributes: attributes.sort((a, b) => a.name.localeCompare(b.name)),
      events: collectEvents(statement, source),
      slots: markup.slots,
      cssParts: markup.cssParts,
      cssProperties: collectCssProperties(sourcePath),
      modulePath,
      componentPath,
      sourcePath
    });
  }
  return declarations;
}

function publicDeclaration(declaration) {
  const { modulePath: _modulePath, componentPath: _componentPath, sourcePath: _sourcePath, ...result } = declaration;
  return result;
}

export function collectComponentMetadata() {
  return findSourceFiles()
    .flatMap(parseComponentFile)
    .sort((a, b) => a.tagName.localeCompare(b.tagName));
}

export function createCustomElementsManifest(declarations = collectComponentMetadata()) {
  const grouped = new Map();
  for (const declaration of declarations) {
    const list = grouped.get(declaration.modulePath) || [];
    list.push(declaration);
    grouped.set(declaration.modulePath, list);
  }
  return {
    schemaVersion: '2.1.0',
    readme: 'README.md',
    modules: [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([modulePath, entries]) => ({
      kind: 'javascript-module',
      path: modulePath,
      declarations: entries.map(publicDeclaration),
      exports: entries.map(entry => ({
        kind: 'custom-element-definition',
        name: entry.tagName,
        declaration: { name: entry.name, module: modulePath }
      }))
    }))
  };
}

function unionValues(type) {
  const values = [];
  for (const match of type.matchAll(/(?:^|\|)\s*['"]([^'"]+)['"]\s*(?=\||$)/g)) values.push({ name: match[1] });
  return values;
}

export function createHtmlCustomData(declarations = collectComponentMetadata()) {
  return {
    version: 1.1,
    tags: declarations.map(declaration => ({
      name: declaration.tagName,
      description: declaration.description || `${declaration.name} custom element.`,
      attributes: declaration.attributes.map(attribute => {
        const values = unionValues(attribute.type.text);
        return {
          name: attribute.name,
          description: attribute.description || `${attribute.fieldName}: ${attribute.type.text}`,
          ...(values.length ? { values } : {})
        };
      })
    }))
  };
}

export function createTagNameDeclarations(declarations = collectComponentMetadata()) {
  const imports = declarations.map(declaration => {
    const relative = './' + declaration.componentPath;
    return `import type { ${declaration.name} } from '${relative}';`;
  });
  const mappings = declarations.map(declaration => `    '${declaration.tagName}': ${declaration.name};`);
  return `// GENERATED FILE — DO NOT EDIT.\n// Source: components/** + scripts/generate-component-metadata.js\n// Rebuild: npm run generate:metadata\n\n${imports.join('\n')}\n\ndeclare global {\n  interface HTMLElementTagNameMap {\n${mappings.join('\n')}\n  }\n}\n\nexport {};\n`;
}

export function generateComponentMetadata({ check = false } = {}) {
  const declarations = collectComponentMetadata();
  const outputs = new Map([
    [path.join(projectRoot, 'custom-elements.json'), JSON.stringify(createCustomElementsManifest(declarations), null, 2) + '\n'],
    [path.join(projectRoot, 'vscode.html-custom-data.json'), JSON.stringify(createHtmlCustomData(declarations), null, 2) + '\n'],
    [path.join(componentsRoot, 'custom-elements.d.ts'), createTagNameDeclarations(declarations)]
  ]);
  const stale = [];
  for (const [file, content] of outputs) {
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : undefined;
    if (current === content) continue;
    stale.push(posix(path.relative(projectRoot, file)));
    if (!check) fs.writeFileSync(file, content);
  }
  if (check && stale.length) {
    throw new Error(`Generated component metadata is stale: ${stale.join(', ')}. Run npm run generate:metadata.`);
  }
  return { componentCount: declarations.length, changed: stale };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const result = generateComponentMetadata({ check: process.argv.includes('--check') });
    console.log(`${result.componentCount} custom elements; ${result.changed.length ? `updated ${result.changed.join(', ')}` : 'metadata is current'}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
