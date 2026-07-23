#!/usr/bin/env node

/**
 * Generate React adapters for all Snice components
 *
 * This script scans the components directory and generates React wrapper
 * components for each Snice web component, making them easy to use in React apps.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getWipComponents } from '../shared/wip-components.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// Module docblock written to adapters/react/index.ts on every generation run.
// The example must use the generated event props (e.g. Input's onInputInput
// reading event.detail) — never native onChange, which Snice inputs don't fire.
export const REACT_INDEX_DOC = `/**
 * Snice React Adapters
 *
 * This package provides React adapters for all Snice web components,
 * allowing seamless integration with React 17, 18, and 19.
 *
 * @example
 * \`\`\`tsx
 * import { Button, Input } from 'snice/react';
 * // or from CDN builds:
 * import Button from './cdn/button/react';
 *
 * function MyComponent() {
 *   const [value, setValue] = useState('');
 *
 *   return (
 *     <div>
 *       <Input
 *         value={value}
 *         onInputInput={(event) => setValue(event.detail.value)}
 *         placeholder="Enter text..."
 *       />
 *       <Button variant="primary" onClick={() => alert('Clicked!')}>
 *         Submit
 *       </Button>
 *     </div>
 *   );
 * }
 * \`\`\`
 *
 * @module snice/react
 */`;

// Component metadata - maps component names to their interfaces
const componentMetadata = {
  // Will be populated by scanning component files
};

// Component-specific public types that cannot be recovered from the lightweight
// decorator regex alone. Keep these inline so generated adapters remain
// publishable without referring back to the unshipped TypeScript source tree.
const reactTypeOverrides = {
  'key-value': {
    properties: {
      value: 'string',
      defaultValue: 'string',
      label: 'string',
      autoExpand: 'boolean',
      rows: 'number',
      showDescription: 'boolean',
      keyPlaceholder: 'string',
      valuePlaceholder: 'string',
      placeholders: 'Array<{ key: string; value: string }>',
      disabled: 'boolean',
      readonly: 'boolean',
      required: 'boolean',
      name: 'string',
      variant: "'default' | 'compact'",
      mode: "'edit' | 'view'",
      showCopy: 'boolean',
    },
    events: {
      onKvAdd: 'CustomEvent<{ item: { key: string; value: string; description?: string }; index: number }>',
      onKvRemove: 'CustomEvent<{ item: { key: string; value: string; description?: string }; index: number }>',
      onKvChange: 'CustomEvent<{ items: Array<{ key: string; value: string; description?: string }> }>',
      onKvCopy: 'CustomEvent<{ items: Array<{ key: string; value: string; description?: string }> }>',
    },
  },
  table: {
    imports: ["import type { ColumnDefinition } from '../../dist/components/table/snice-table.types';"],
    properties: {
      columns: 'ColumnDefinition[]',
      data: 'any[]',
      pageSizes: 'number[]',
      currentSort: "Array<{ column: string; direction: 'asc' | 'desc' }>",
      selectedRows: 'number[]',
      selectionMode: "'none' | 'single' | 'multiple'",
      groupBy: 'string | string[]',
      groupDefaults: '{ expanded?: boolean }',
    },
    events: {
      onSelectionChanged: 'CustomEvent<{ selectedRows: number[]; rows: any[] }>',
      onGroupToggle: 'CustomEvent<{ key: string; value: any; expanded: boolean }>',
    },
  },
};

// A small number of declarative child elements intentionally expose plain HTML
// attributes instead of reactive @property fields. Keep those attributes as
// attributes in React (rather than assigning same-named JavaScript properties)
// because their parent components read them with getAttribute()/hasAttribute().
const declarativeAttributeOverrides = {
  'app-tile': {
    name: 'string',
    icon: 'string',
    color: 'string',
    href: 'string',
    badge: 'string | number',
  },
  comment: {
    author: 'string',
    avatar: 'string',
    timestamp: 'string',
    likes: 'string | number',
    liked: 'boolean',
  },
  plan: {
    name: 'string',
    price: 'string | number',
    'annual-price': 'string | number',
    highlighted: 'boolean',
    badge: 'string',
    cta: 'string',
    period: 'string',
    currency: 'string',
    description: 'string',
  },
  feature: {
    excluded: 'boolean',
    value: 'string',
  },
};

function classMetadata(filePath, className) {
  const content = fs.readFileSync(filePath, 'utf8');
  const declaration = new RegExp(`export\\s+class\\s+${className}\\b`).exec(content);
  if (!declaration) {
    throw new Error(`Could not find ${className} in ${filePath}`);
  }
  const decoratorStart = content.lastIndexOf('@element(', declaration.index);
  if (decoratorStart === -1) {
    throw new Error(`Could not find @element for ${className} in ${filePath}`);
  }

  // Restrict the established decorator extractor to one class. This matters
  // for modules that register both a container and declarative child elements.
  const bodyStart = content.indexOf('{', declaration.index + declaration[0].length);
  const bodyEnd = findClosingBrace(content, bodyStart);
  const classText = content.slice(decoratorStart, bodyEnd + 1);
  return extractPropertiesFromSource(classText);
}

function findClosingBrace(source, openingBrace) {
  let depth = 0;
  let quote = '';
  let lineComment = false;
  let blockComment = false;

  for (let index = openingBrace; index < source.length; index++) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (character === '\\') {
        index++;
      } else if (character === quote) {
        quote = '';
      }
      continue;
    }
    if (character === '/' && next === '/') {
      lineComment = true;
      index++;
      continue;
    }
    if (character === '/' && next === '*') {
      blockComment = true;
      index++;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') depth++;
    if (character === '}' && --depth === 0) return index;
  }

  throw new Error('Unclosed custom-element class body');
}

/**
 * Discover every released @element declaration and the source module that
 * registers it. The old directory-name convention only found container
 * components and silently skipped nested public elements.
 */
export function discoverComponentElements(componentsDir = path.join(projectRoot, 'packages', 'components', 'src')) {
  const wip = getWipComponents();
  const elements = [];

  for (const directory of fs.readdirSync(componentsDir).sort()) {
    if (wip.has(directory) || directory === 'theme') continue;
    const componentDir = path.join(componentsDir, directory);
    if (!fs.statSync(componentDir).isDirectory()) continue;

    for (const filename of fs.readdirSync(componentDir).sort()) {
      if (!filename.endsWith('.ts') || filename.endsWith('.d.ts') || filename.includes('.stories.') || filename.includes('.test.')) {
        continue;
      }

      const filePath = path.join(componentDir, filename);
      const source = fs.readFileSync(filePath, 'utf8');
      const elementPattern = /@element\(\s*['"]([^'"]+)['"](?:\s*,[\s\S]*?)?\s*\)\s*export\s+class\s+(\w+)/g;
      let match;
      while ((match = elementPattern.exec(source)) !== null) {
        const tagName = match[1];
        const sourceClassName = match[2];
        const outputName = tagName.replace(/^snice-/, '');
        const isPrimary = tagName === `snice-${directory}`;
        const establishedClassName = outputName
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join('');
        elements.push({
          directory,
          filename,
          filePath,
          tagName,
          outputName,
          // Keep every original directory adapter's public export byte-for-byte
          // compatible (notably QrCode/QrReader and SplitPane). Nested wrappers
          // use the declared custom-element class name.
          className: isPrimary ? establishedClassName : sourceClassName.replace(/^Snice/, ''),
          sourceClassName,
          registrationPath: `snice/components/${directory}/${filename.replace(/\.ts$/, '')}`,
          isPrimary,
        });
      }
    }
  }

  elements.sort((a, b) => a.outputName.localeCompare(b.outputName));

  const seenTags = new Set();
  const seenOutputs = new Set();
  const seenClasses = new Set();
  for (const element of elements) {
    if (seenTags.has(element.tagName)) throw new Error(`Duplicate custom element tag: ${element.tagName}`);
    if (seenOutputs.has(element.outputName)) throw new Error(`React adapter filename collision: ${element.outputName}`);
    if (seenClasses.has(element.className)) throw new Error(`React adapter export collision: ${element.className}`);
    seenTags.add(element.tagName);
    seenOutputs.add(element.outputName);
    seenClasses.add(element.className);
  }

  return elements;
}

function extractPropertiesFromSource(content) {
  const properties = [];
  const events = {};

  // Look for @property decorators. private/protected reactive state is
  // internal — it must not leak into the public React props surface.
  const propertyRegex = /@property\(\s*(?:{[^}]*})?\s*\)\s+(?:(private|protected)\s+|public\s+)?(?:readonly\s+)?(\w+)/g;
  let match;
  while ((match = propertyRegex.exec(content)) !== null) {
    if (match[1]) continue; // private or protected
    properties.push(match[2]);
  }

  // A native-compatible live property may need a custom accessor instead of
  // @property's field storage (for example checkbox.checked must notice even
  // same-value assignments). Explicitly documented writable accessors are
  // still React properties and must not fall through as string attributes.
  const publicAccessorRegex = /\/\*\*[\s\S]*?@public[\s\S]*?\*\/\s*get\s+(\w+)\s*\(/g;
  while ((match = publicAccessorRegex.exec(content)) !== null) {
    const propertyName = match[1];
    const setterRegex = new RegExp(`\\bset\\s+${propertyName}\\s*\\(`);
    if (setterRegex.test(content) && !properties.includes(propertyName)) {
      properties.push(propertyName);
    }
  }

  // Look for @dispatch decorators (custom events)
  // Matches both @dispatch('name') and @dispatch('name', { options })
  const dispatchRegex = /@dispatch\(\s*['"]([^'"]+)['"]/g;
  while ((match = dispatchRegex.exec(content)) !== null) {
    const eventName = match[1];
    const callbackName = 'on' + eventName.split('-').map(part =>
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('');
    events[eventName] = callbackName;
  }

  // Also catch inline dispatchEvent(new CustomEvent('name', ...)) calls
  const inlineRegex = /dispatchEvent\(\s*new\s+CustomEvent\(\s*['"]([^'"]+)['"]/g;
  while ((match = inlineRegex.exec(content)) !== null) {
    const eventName = match[1];
    if (!events[eventName]) {
      const callbackName = 'on' + eventName.split('-').map(part =>
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join('');
      events[eventName] = callbackName;
    }
  }

  // Detect if form-associated
  const decoratorFormAssociated = /@element\(\s*['"][^'"]+['"]\s*,\s*\{[^}]*\bformAssociated\s*:\s*true\b[^}]*\}\s*\)/
    .test(content);
  const isFormAssociated = content.includes('static formAssociated = true') || decoratorFormAssociated;

  return { properties, events, isFormAssociated };
}

/**
 * Extract properties from a component's TypeScript file
 */
export function extractPropertiesFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return extractPropertiesFromSource(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return { properties: [], events: {}, isFormAssociated: false };
  }
}

/**
 * Generate React component wrapper for a Snice component
 */
export function generateReactComponent(componentName, metadata, options = {}) {
  const { properties, events, isFormAssociated } = metadata;
  const typeOverrides = reactTypeOverrides[componentName] || { properties: {}, events: {} };
  const extraImports = typeOverrides.imports?.length
    ? `${typeOverrides.imports.join('\n')}\n`
    : '';
  const attributeOverrides = declarativeAttributeOverrides[componentName] || {};
  const tagName = options.tagName || `snice-${componentName}`;
  const componentClassName = options.className || componentName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const registrationPath = options.registrationPath || `snice/components/${componentName}/snice-${componentName}`;
  const sourceDirectory = options.sourceDirectory || componentName;

  const propsInterface = [
    ...properties.map(prop => `  ${prop}?: ${typeOverrides.properties[prop] || 'any'};`),
    ...Object.entries(attributeOverrides).map(([attribute, type]) => `  '${attribute}'?: ${type};`),
  ].join('\n');

  const eventProps = Object.values(events).map(callback =>
    `  ${callback}?: (event: ${typeOverrides.events[callback] || 'any'}) => void;`
  ).join('\n');

  const basePropsType = isFormAssociated ? 'SniceFormProps' : 'SniceBaseProps';
  const refType = isFormAssociated ? 'SniceFormRef' : 'SniceComponentRef';

  return `// GENERATED FILE — DO NOT EDIT.
// Source: components/${sourceDirectory}/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { ${basePropsType}, ${refType} } from './types';
${extraImports}

/**
 * Props for the ${componentClassName} component
 */
export interface ${componentClassName}Props extends ${basePropsType} {
${propsInterface}
${eventProps}
}

/**
 * ${componentClassName} - React adapter for ${tagName}
 *
 * This is an auto-generated React wrapper for the Snice ${componentName} component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * \`\`\`tsx
 * import '${registrationPath}';
 * import { ${componentClassName} } from 'snice/react';
 *
 * function MyComponent() {
 *   return <${componentClassName} />;
 * }
 * \`\`\`
 */
export const ${componentClassName}: SniceReactComponent<${componentClassName}Props, ${refType}> = createReactAdapter<${componentClassName}Props, ${isFormAssociated}>({
  tagName: '${tagName}',
  properties: ${JSON.stringify(properties)},
  events: ${JSON.stringify(events)},
  formAssociated: ${isFormAssociated}
});
`;
}

/**
 * Scan components directory and generate adapters
 */
export function generateAdapters() {
  const componentsDir = path.join(projectRoot, 'packages', 'components', 'src');
  const reactDir = path.join(projectRoot, 'adapters', 'react');
  const componentsFile = path.join(reactDir, 'components.ts');

  if (!fs.existsSync(componentsDir)) {
    console.error('❌ Components directory not found');
    process.exit(1);
  }

  console.log('🔍 Scanning components directory...\n');

  const elements = discoverComponentElements(componentsDir);
  for (const element of elements) {
    console.log(`  Found: ${element.tagName}`);
    // Preserve the exact established API extraction for the original 135
    // directory adapters. Nested declarations are isolated to their class.
    const metadata = element.isPrimary
      ? extractPropertiesFromFile(element.filePath)
      : classMetadata(element.filePath, element.sourceClassName);
    componentMetadata[element.outputName] = metadata;
  }

  console.log(`\n✨ Found ${elements.length} custom elements\n`);
  console.log('📝 Generating React adapters...\n');

  // Remove adapters left behind when a component becomes WIP or is deleted.
  const released = new Set(elements.map(element => element.outputName));
  for (const filename of fs.readdirSync(reactDir).filter(name => name.endsWith('.tsx'))) {
    const componentName = filename.slice(0, -4);
    const source = fs.readFileSync(path.join(reactDir, filename), 'utf8');
    if (!source.startsWith('// GENERATED FILE') || released.has(componentName)) continue;
    for (const suffix of ['.tsx', '.js', '.js.map', '.d.ts', '.d.ts.map']) {
      const stalePath = path.join(reactDir, `${componentName}${suffix}`);
      if (fs.existsSync(stalePath)) fs.unlinkSync(stalePath);
    }
    console.log(`  Removed stale adapter: ${componentName}`);
  }

  // Generate individual component files
  const componentExports = [];

  for (const element of elements) {
    const componentName = element.outputName;
    const metadata = componentMetadata[componentName];
    const componentClassName = element.className;
    const componentCode = generateReactComponent(componentName, metadata, {
      tagName: element.tagName,
      className: componentClassName,
      registrationPath: element.registrationPath,
      sourceDirectory: element.directory,
    });

    componentExports.push({
      name: componentClassName,
      import: `export { ${componentClassName} } from './${componentName}';`,
      type: `export type { ${componentClassName}Props } from './${componentName}';`
    });

    const outputPath = path.join(reactDir, `${componentName}.tsx`);
    fs.writeFileSync(outputPath, componentCode);
    console.log(`  Created: ${componentName}.tsx`);
  }

  // Generate components.ts with all exports
  const componentsContent = `/**
 * Auto-generated React adapters for all Snice components
 *
 * This file is generated by scripts/generate-react-adapters.js
 * Do not edit manually - run \`npm run generate:react-adapters\` to regenerate
 */

${componentExports.map(c => c.import).join('\n')}

${componentExports.map(c => c.type).join('\n')}
`;

  fs.writeFileSync(componentsFile, componentsContent);
  console.log(`\n  Created: components.ts\n`);

  // Update index.ts to export from components.ts
  const indexPath = path.join(reactDir, 'index.ts');
  let indexContent = fs.readFileSync(indexPath, 'utf-8');
  const originalIndexContent = indexContent;

  // Remove the placeholder comment and add the export
  if (!indexContent.includes("export * from './components';")) {
    indexContent = indexContent.replace(
      /\/\*\*\s*\n\s*\* Instructions for generating.*?\*\//s,
      "// Auto-generated component exports\nexport * from './components';"
    );
  }

  // The module docblock is generated: rewrite it so hand edits (or stale
  // examples) can't drift from the generated event-prop contracts.
  indexContent = indexContent.startsWith('/**')
    ? REACT_INDEX_DOC + indexContent.slice(indexContent.indexOf('*/') + 2)
    : `${REACT_INDEX_DOC}\n\n${indexContent}`;

  if (indexContent !== originalIndexContent) {
    fs.writeFileSync(indexPath, indexContent);
    console.log('  Updated: index.ts\n');
  }

  console.log('✅ React adapters generated successfully!\n');
  console.log(`Generated ${elements.length} custom-element adapters\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) generateAdapters();
