#!/usr/bin/env node

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(scriptPath), '../..');
const outputPath = resolve(projectRoot, 'bin/analyzer-contracts.js');

export function buildAnalyzerContracts(root = projectRoot) {
  const manifestPath = resolve(root, 'custom-elements.json');
  const coreIndexPath = resolve(root, 'packages/core/src/index.ts');
  const coreTypesPath = resolve(root, 'packages/core/src/types');
  const reactIndexPath = resolve(root, 'adapters/react/index.d.ts');
  const reactComponentsPath = resolve(root, 'adapters/react/components.ts');
  const reactDirectory = resolve(root, 'adapters/react');
  const componentSourcePath = resolve(root, 'packages/components/src');

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.schemaVersion !== '2.1.0' || !Array.isArray(manifest.modules)) {
    throw new Error(`Unsupported custom-elements manifest schema: ${manifest.schemaVersion ?? 'missing'}`);
  }
  const components = {};

  for (const module of [...manifest.modules].sort((left, right) => left.path.localeCompare(right.path))) {
    const definitions = new Map(
      (module.exports ?? [])
        .filter(export_ => export_.kind === 'custom-element-definition')
        .map(export_ => [export_.name, export_])
    );
    for (const declaration of module.declarations ?? []) {
      if (!declaration.customElement || !declaration.tagName) continue;
      if (components[declaration.tagName]) throw new Error(`Duplicate custom-element tag: ${declaration.tagName}`);
      const definition = definitions.get(declaration.tagName);
      if (
        !definition ||
        definition.declaration?.name !== declaration.name ||
        definition.declaration?.module !== module.path
      ) {
        throw new Error(`Broken custom-element definition link: ${declaration.tagName}`);
      }
      const attributes = {};
      const attributeByField = new Map();
      for (const attribute of [...(declaration.attributes ?? [])].sort((left, right) => left.name.localeCompare(right.name))) {
        const type = attribute.type?.text ?? 'unknown';
        attributes[attribute.name] = {
          property: attribute.fieldName ?? attribute.name,
          type,
          literals: extractStringLiteralUnion(type)
        };
        attributeByField.set(attribute.fieldName ?? attribute.name, attribute.name);
      }

      const properties = {};
      for (const member of [...(declaration.members ?? [])]
        .filter(member => member.kind === 'field')
        .sort((left, right) => left.name.localeCompare(right.name))) {
        const type = member.type?.text ?? 'unknown';
        properties[member.name] = {
          type,
          attribute: attributeByField.get(member.name) ?? null,
          structured: isStructuredType(type)
        };
      }

      const events = [...(declaration.events ?? [])]
        .map(event => ({ name: event.name, type: event.type ?? 'CustomEvent<unknown>' }))
        .sort((left, right) => left.name.localeCompare(right.name));
      const slots = [...(declaration.slots ?? [])]
        .map(slot => slot.name ?? '')
        .sort();
      const modulePath = toPackageModulePath(module.path);
      const publicProperties = collectDecoratedProperties(
        resolve(componentSourcePath, module.path.slice('dist/components/'.length, -'.js'.length) + '.ts'),
        declaration.name
      );
      components[declaration.tagName] = {
        tagName: declaration.tagName,
        className: declaration.name,
        modulePath,
        sourceModule: module.path,
        family: module.path.split('/')[2],
        attributes,
        properties,
        structuredProperties: Object.entries(properties)
          .filter(([name, property]) => property.structured && publicProperties.has(name))
          .map(([name]) => name),
        events,
        slots
      };
    }
  }

  const rootExports = collectRootExports(coreIndexPath, coreTypesPath);
  const reactWrappers = collectReactWrappers(reactComponentsPath, reactDirectory, components);
  const reactExports = collectReactExports(reactIndexPath, reactComponentsPath, Object.keys(reactWrappers));
  const componentModulePaths = [...new Set(Object.values(components).map(component => component.modulePath))].sort();
  const componentTypeModulePaths = walkFiles(componentSourcePath)
    .filter(path => path.endsWith('.types.ts'))
    .map(path => {
      const sourceRelative = relative(componentSourcePath, path).replaceAll('\\', '/');
      return `snice/components/${sourceRelative.slice(0, -3)}`;
    })
    .sort();

  return {
    schemaVersion: 1,
    generatedFrom: [
      'custom-elements.json',
      'packages/core/src/index.ts',
      'packages/core/src/types/*.ts',
      'adapters/react/index.d.ts',
      'adapters/react/components.ts',
      'adapters/react/*.tsx',
      'packages/components/src/**/*.types.ts'
    ],
    stats: {
      customElements: Object.keys(components).length,
      componentFamilies: new Set(Object.values(components).map(component => component.family)).size,
      componentModules: componentModulePaths.length,
      reactWrappers: Object.keys(reactWrappers).length,
      rootExports: rootExports.length
    },
    rootExports,
    componentModulePaths,
    componentTypeModulePaths,
    components: sortObject(components),
    react: {
      exports: reactExports,
      wrappers: sortObject(reactWrappers)
    }
  };
}

export function renderAnalyzerContracts(contracts) {
  return `// GENERATED FILE — DO NOT EDIT.
// Source: tooling/generators/generate-analyzer-contracts.js
// Rebuild: node tooling/generators/generate-analyzer-contracts.js

export const ANALYZER_CONTRACTS = ${JSON.stringify(contracts, null, 2)};
`;
}

export function generateAnalyzerContracts({ check = false, root = projectRoot } = {}) {
  const target = resolve(root, 'bin/analyzer-contracts.js');
  const output = renderAnalyzerContracts(buildAnalyzerContracts(root));
  if (check) {
    if (!existsSync(target) || readFileSync(target, 'utf8') !== output) {
      throw new Error('bin/analyzer-contracts.js is stale; run node tooling/generators/generate-analyzer-contracts.js');
    }
    return { changed: false, target };
  }
  const previous = existsSync(target) ? readFileSync(target, 'utf8') : '';
  if (previous !== output) writeFileSync(target, output);
  return { changed: previous !== output, target };
}

function collectRootExports(indexPath, typesDirectory) {
  const exports = new Set();
  const indexSource = readFileSync(indexPath, 'utf8');
  for (const match of indexSource.matchAll(/export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g)) {
    addExportList(exports, match[1]);
  }
  const typesIndexSource = readFileSync(resolve(typesDirectory, 'index.ts'), 'utf8');
  const publicTypeFiles = [...typesIndexSource.matchAll(/export \* from ['"]\.\/([^'"]+)['"]/g)]
    .map(match => resolve(typesDirectory, `${match[1]}.ts`));
  for (const path of publicTypeFiles) {
    const source = readFileSync(path, 'utf8');
    for (const match of source.matchAll(/export\s+(?:declare\s+)?(?:abstract\s+)?(?:interface|type|class|enum|const|function)\s+([A-Za-z_$][\w$]*)/g)) {
      exports.add(match[1]);
    }
  }
  return [...exports].sort();
}

function collectReactExports(indexPath, componentsPath, wrapperNames) {
  const exports = new Set(wrapperNames);
  for (const source of [readFileSync(indexPath, 'utf8'), readFileSync(componentsPath, 'utf8')]) {
    for (const match of source.matchAll(/export\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g)) {
      addExportList(exports, match[1]);
    }
  }
  return [...exports].sort();
}

function collectReactWrappers(componentsPath, reactDirectory, components) {
  const source = readFileSync(componentsPath, 'utf8');
  const wrappers = {};
  for (const match of source.matchAll(/^export \{ ([A-Za-z_$][\w$]*) \} from '\.\/([^']+)'/gm)) {
    const [, exportName, moduleName] = match;
    const wrapperSource = readFileSync(resolve(reactDirectory, `${moduleName}.tsx`), 'utf8');
    const tagName = wrapperSource.match(/\btagName:\s*['"]([^'"]+)['"]/)?.[1];
    if (!tagName || !components[tagName]) {
      throw new Error(`Unable to map React wrapper ${exportName} to a released custom element`);
    }
    const propertiesSource = wrapperSource.match(/\bproperties:\s*(\[[^\n]*\])/s)?.[1] ?? '[]';
    const eventsSource = wrapperSource.match(/\bevents:\s*(\{[^\n]*\})/s)?.[1] ?? '{}';
    const properties = JSON.parse(propertiesSource);
    const events = JSON.parse(eventsSource);
    // The generated Props interface is the complete authorable surface: it
    // adds declarative attribute overrides (e.g. Plan's 'annual-price') that
    // never appear in the runtime config's properties array.
    const interfaceBody = wrapperSource.match(
      new RegExp(`export\\s+interface\\s+${exportName}Props\\s+extends\\s+\\w+\\s*\\{([\\s\\S]*?)\\n\\}`)
    )?.[1] ?? '';
    const interfaceProps = [...interfaceBody.matchAll(/^\s*(?:'([^']+)'|([A-Za-z_$][\w$]*))\?:/gm)]
      .map(match => match[1] ?? match[2]);
    for (const property of properties) {
      if (!components[tagName].properties[property]) {
        throw new Error(`React wrapper ${exportName} references unknown ${tagName}.${property}`);
      }
    }
    const componentEvents = new Set(components[tagName].events.map(event => event.name));
    for (const event of Object.keys(events)) {
      if (!componentEvents.has(event)) {
        throw new Error(`React wrapper ${exportName} references unknown ${tagName} event ${event}`);
      }
    }
    wrappers[exportName] = {
      exportName,
      module: `snice/react/${moduleName}`,
      tagName,
      family: components[tagName].family,
      componentModulePath: components[tagName].modulePath,
      properties,
      events,
      interfaceProps,
      formAssociated: /\bformAssociated:\s*true\b/.test(wrapperSource)
    };
  }
  return wrappers;
}

function addExportList(target, list) {
  for (const raw of list.split(',')) {
    const item = raw.trim().replace(/^type\s+/, '');
    if (!item) continue;
    const alias = item.split(/\s+as\s+/);
    target.add((alias[1] ?? alias[0]).trim());
  }
}

function extractStringLiteralUnion(type) {
  const literals = [];
  const residue = type.replace(/'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"/g, (_, single, double) => {
    literals.push(single ?? double);
    return '';
  }).replaceAll('|', '').trim();
  return literals.length && !residue ? literals : [];
}

function isStructuredType(type) {
  const compact = type.replace(/\s+/g, ' ').trim();
  return (
    /\[\](?:\s*\||$)/.test(compact) ||
    /\b(?:Array|ReadonlyArray|Record|Map|Set|WeakMap|WeakSet)<.+>/.test(compact) ||
    /^\[.*\]$/.test(compact) ||
    /^\{.*\}$/.test(compact)
  );
}

function toPackageModulePath(modulePath) {
  if (!modulePath.startsWith('dist/components/') || !modulePath.endsWith('.js')) {
    throw new Error(`Unexpected custom-elements module path: ${modulePath}`);
  }
  return `snice/${modulePath.slice('dist/'.length, -'.js'.length)}`;
}

function walkFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = resolve(directory, entry);
    if (statSync(path).isDirectory()) files.push(...walkFiles(path));
    else files.push(path);
  }
  return files;
}

function collectDecoratedProperties(sourcePath, className) {
  if (!existsSync(sourcePath)) throw new Error(`Missing component source for analyzer contract: ${sourcePath}`);
  const source = ts.createSourceFile(
    sourcePath,
    readFileSync(sourcePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const properties = new Set();
  const visit = node => {
    if (ts.isClassDeclaration(node) && node.name?.text === className) {
      for (const member of node.members) {
        if (!ts.isPropertyDeclaration(member) || !member.name || !ts.isIdentifier(member.name)) continue;
        const decorators = ts.canHaveDecorators(member) ? ts.getDecorators(member) ?? [] : [];
        if (decorators.some(decorator => {
          const expression = decorator.expression;
          return (
            (ts.isCallExpression(expression) && ts.isIdentifier(expression.expression) && expression.expression.text === 'property') ||
            (ts.isIdentifier(expression) && expression.text === 'property')
          );
        })) properties.add(member.name.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return properties;
}

function sortObject(object) {
  return Object.fromEntries(Object.entries(object).sort(([left], [right]) => left.localeCompare(right)));
}

if (resolve(process.argv[1] ?? '') === scriptPath) {
  const arguments_ = process.argv.slice(2);
  if (arguments_.some(argument => argument !== '--check') || arguments_.filter(argument => argument === '--check').length > 1) {
    console.error('Usage: node tooling/generators/generate-analyzer-contracts.js [--check]');
    process.exitCode = 1;
  } else {
    try {
      const result = generateAnalyzerContracts({ check: arguments_.includes('--check') });
      console.log(arguments_.includes('--check')
        ? 'Analyzer contracts are current.'
        : `${result.changed ? 'Generated' : 'Unchanged'} ${relative(projectRoot, result.target)}.`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
