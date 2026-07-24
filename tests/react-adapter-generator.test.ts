// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  REACT_INDEX_DOC,
  discoverComponentElements,
  extractPropertiesFromFile,
  generateReactComponent
} from '../tooling/generators/generate-react-adapters.js';

const component = (name: string) => join(
  process.cwd(),
  'packages',
  'components',
  'src',
  name,
  `snice-${name}.ts`
);

describe('React adapter generator', () => {
  it('publishes checkbox live accessors, decorated properties, events, and form association', () => {
    const metadata = extractPropertiesFromFile(component('checkbox'));
    expect(metadata.properties).toEqual(expect.arrayContaining([
      'checked',
      'defaultChecked',
      'indeterminate',
      'disabled',
      'required',
      'name',
      'value'
    ]));
    expect(metadata.events).toEqual({ 'checkbox-change': 'onCheckboxChange' });
    expect(metadata.isFormAssociated).toBe(true);

    const generated = generateReactComponent('checkbox', metadata);
    expect(generated).toContain('extends SniceFormProps');
    expect(generated).toContain('formAssociated: true');
    expect(generated).toContain('"checked"');
    expect(generated).toContain('"defaultChecked"');
  });

  it('does not classify an ordinary component as form-associated', () => {
    const metadata = extractPropertiesFromFile(component('card'));
    expect(metadata.isFormAssociated).toBe(false);
    expect(generateReactComponent('card', metadata)).toContain('extends SniceBaseProps');
  });

  it('discovers every released custom element, including all nested authoring elements', () => {
    const elements = discoverComponentElements();
    const primary = elements.filter(element => element.isPrimary);
    const nested = elements.filter(element => !element.isPrimary);

    expect(elements).toHaveLength(191);
    expect(primary).toHaveLength(135);
    expect(nested).toHaveLength(56);
    expect(new Set(elements.map(element => element.tagName)).size).toBe(elements.length);
    expect(new Set(elements.map(element => element.outputName)).size).toBe(elements.length);
    expect(new Set(elements.map(element => element.className)).size).toBe(elements.length);

    expect(nested.map(element => element.tagName)).toEqual(expect.arrayContaining([
      'snice-accordion-item',
      'snice-activity-item',
      'snice-option',
      'snice-tab',
      'snice-tab-panel',
      'snice-toast-container',
      'snice-tree-item',
      'snice-cell-actions',
      'snice-table-progress',
    ]));
    expect(elements.some(element => element.tagName === 'snice-spreadsheet')).toBe(false);
  });

  it('generates one deterministic typed React export for every discovered tag', () => {
    const elements = discoverComponentElements();
    const barrel = readFileSync(join(process.cwd(), 'adapters', 'react', 'components.ts'), 'utf8');

    for (const element of elements) {
      const adapterPath = join(process.cwd(), 'adapters', 'react', `${element.outputName}.tsx`);
      expect(existsSync(adapterPath), `${element.tagName} adapter`).toBe(true);
      const adapter = readFileSync(adapterPath, 'utf8');

      expect(adapter).toContain(`export interface ${element.className}Props`);
      expect(adapter).toContain(`export const ${element.className}: SniceReactComponent<${element.className}Props, Snice`);
      expect(adapter).toContain(`tagName: '${element.tagName}'`);
      expect(adapter).toContain(`import '${element.registrationPath}';`);
      expect(barrel).toContain(`export { ${element.className} } from './${element.outputName}';`);
      expect(barrel).toContain(`export type { ${element.className}Props } from './${element.outputName}';`);
    }
  });

  it('documents the generated Input event contract, never native onChange', () => {
    const index = readFileSync(join(process.cwd(), 'adapters', 'react', 'index.ts'), 'utf8');
    const docblock = index.slice(0, index.indexOf('*/') + 2);

    // The generator owns the index.ts docblock; drift means someone edited output by hand.
    expect(index.startsWith(REACT_INDEX_DOC)).toBe(true);

    for (const docs of [REACT_INDEX_DOC, docblock]) {
      expect(docs).not.toMatch(/<Input[\s\S]*?onChange\s*=/);
      expect(docs).toContain('onInputInput={(event) => setValue(event.detail.value)}');
    }
  });

  it('teaches the Input event contract on every public documentation surface, never native onChange', () => {
    // build-website.js embeds its JSX example HTML-escaped with syntax-highlight
    // <span> wrappers; normalize so the same JSX assertions apply to every surface.
    const normalize = (source: string) => source
      .replace(/<\/?span[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    const surfaces = [
      'README.md',
      'DEVELOPMENT.md',
      join('tooling', 'website', 'build-website.js'),
    ];

    for (const surface of surfaces) {
      const docs = normalize(readFileSync(join(process.cwd(), surface), 'utf8'));
      expect(docs, `${surface} teaches native onChange on <Input>`).not.toMatch(
        /<Input\b[^>]*\bonChange\s*=/
      );
      expect(docs, `${surface} must teach onInputInput reading event.detail.value`).toMatch(
        /<Input\b[^>]*\bonInputInput\s*=\s*\{\s*\(\w+\)\s*=>\s*\w+\(\w+\.detail\.value\)\s*\}/
      );
    }
  });

  it('keeps nested property/event contracts and declarative attributes authorable in JSX', () => {
    const tab = readFileSync(join(process.cwd(), 'adapters', 'react', 'tab.tsx'), 'utf8');
    expect(tab).toContain('disabled?: any;');
    expect(tab).toContain('closable?: any;');
    expect(tab).toContain('onTabClose?: (event: any) => void;');
    expect(tab).toContain('onTabSelect?: (event: any) => void;');

    const option = readFileSync(join(process.cwd(), 'adapters', 'react', 'option.tsx'), 'utf8');
    expect(option).toContain('value?: any;');
    expect(option).toContain('selected?: any;');

    const plan = readFileSync(join(process.cwd(), 'adapters', 'react', 'plan.tsx'), 'utf8');
    expect(plan).toContain(`'annual-price'?: string | number;`);
    expect(plan).toContain(`'highlighted'?: boolean;`);
    expect(plan).toContain(`import 'snice/components/pricing-table/snice-pricing-table';`);
  });

  it('uses the released table column contract instead of accepting arbitrary React renderers', () => {
    const table = readFileSync(join(process.cwd(), 'adapters', 'react', 'table.tsx'), 'utf8');
    expect(table).toContain(
      "import type { ColumnDefinition } from '../../dist/components/table/snice-table.types';"
    );
    expect(table).toContain('columns?: ColumnDefinition[];');
    expect(table).not.toContain('columns?: any[];');
  });

  it('annotates generated exports with the exact ref handle type, never RefAttributes<any>', () => {
    const formAdapter = readFileSync(join(process.cwd(), 'adapters', 'react', 'button.tsx'), 'utf8');
    const plainAdapter = readFileSync(join(process.cwd(), 'adapters', 'react', 'card.tsx'), 'utf8');

    expect(formAdapter).toContain('SniceReactComponent<ButtonProps, SniceFormRef>');
    expect(plainAdapter).toContain('SniceReactComponent<CardProps, SniceComponentRef>');
    for (const adapter of [formAdapter, plainAdapter]) {
      expect(adapter).not.toContain('Ref<any>');
    }
  });

  it('re-exports the useRequestHandler types from the snice/react root as documented', () => {
    const declaration = readFileSync(join(process.cwd(), 'adapters', 'react', 'index.d.ts'), 'utf8');
    expect(declaration).toContain(
      "export type { UseRequestRoute, UseRequestRouteMap, UseRequestHandlerOptions } from './useRequestHandler';"
    );
  });

  it('emits the exact ref handle type in built declarations, never RefAttributes<any>', () => {
    const formDeclaration = readFileSync(join(process.cwd(), 'adapters', 'react', 'button.d.ts'), 'utf8');
    const plainDeclaration = readFileSync(join(process.cwd(), 'adapters', 'react', 'card.d.ts'), 'utf8');

    expect(formDeclaration).toContain('SniceReactComponent<ButtonProps, SniceFormRef>');
    expect(plainDeclaration).toContain('SniceReactComponent<CardProps, SniceComponentRef>');
    for (const declaration of [formDeclaration, plainDeclaration]) {
      expect(declaration).not.toContain('RefAttributes<any>');
    }
  });
});
