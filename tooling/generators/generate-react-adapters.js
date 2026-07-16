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
    properties: {
      columns: 'any[]',
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

/**
 * Extract properties from a component's TypeScript file
 */
export function extractPropertiesFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
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
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return { properties: [], events: {}, isFormAssociated: false };
  }
}

/**
 * Generate React component wrapper for a Snice component
 */
export function generateReactComponent(componentName, metadata) {
  const { properties, events, isFormAssociated } = metadata;
  const typeOverrides = reactTypeOverrides[componentName] || { properties: {}, events: {} };
  const tagName = `snice-${componentName}`;
  const componentClassName = componentName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const propsInterface = properties.length > 0
    ? properties.map(prop => `  ${prop}?: ${typeOverrides.properties[prop] || 'any'};`).join('\n')
    : '';

  const eventProps = Object.values(events).map(callback =>
    `  ${callback}?: (event: ${typeOverrides.events[callback] || 'any'}) => void;`
  ).join('\n');

  const basePropsType = isFormAssociated ? 'SniceFormProps' : 'SniceBaseProps';

  return `// GENERATED FILE — DO NOT EDIT.
// Source: components/${componentName}/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { ${basePropsType} } from './types';

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
 * import 'snice/components/${componentName}';
 * import { ${componentClassName} } from 'snice/react';
 *
 * function MyComponent() {
 *   return <${componentClassName} />;
 * }
 * \`\`\`
 */
export const ${componentClassName} = createReactAdapter<${componentClassName}Props>({
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

  const components = [];
  const items = fs.readdirSync(componentsDir);
  const wip = getWipComponents();

  for (const item of items) {
    if (wip.has(item)) continue;
    const componentDir = path.join(componentsDir, item);
    const stat = fs.statSync(componentDir);

    if (stat.isDirectory() && item !== 'theme') {
      const tsFile = path.join(componentDir, `snice-${item}.ts`);
      if (fs.existsSync(tsFile)) {
        console.log(`  Found: ${item}`);
        const metadata = extractPropertiesFromFile(tsFile);
        componentMetadata[item] = metadata;
        components.push(item);
      }
    }
  }

  console.log(`\n✨ Found ${components.length} components\n`);
  console.log('📝 Generating React adapters...\n');

  // Generate individual component files
  const componentExports = [];

  for (const componentName of components) {
    const metadata = componentMetadata[componentName];
    const componentCode = generateReactComponent(componentName, metadata);

    const componentClassName = componentName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

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

  // Remove the placeholder comment and add the export
  if (!indexContent.includes("export * from './components';")) {
    indexContent = indexContent.replace(
      /\/\*\*\s*\n\s*\* Instructions for generating.*?\*\//s,
      "// Auto-generated component exports\nexport * from './components';"
    );
    fs.writeFileSync(indexPath, indexContent);
    console.log('  Updated: index.ts\n');
  }

  console.log('✅ React adapters generated successfully!\n');
  console.log(`Generated ${components.length} component adapters\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) generateAdapters();
