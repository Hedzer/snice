import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  collectComponentMetadata,
  createCustomElementsManifest,
  createHtmlCustomData,
  createTagNameDeclarations,
  generateComponentMetadata
} from '../tooling/generators/generate-component-metadata.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('generated custom-element metadata', () => {
  const declarations = collectComponentMetadata();

  it('discovers every released @element declaration exactly once', () => {
    expect(declarations.length).toBeGreaterThan(180);
    const tags = declarations.map(declaration => declaration.tagName);
    expect(new Set(tags).size).toBe(tags.length);
    expect(tags).toContain('snice-button');
    expect(tags).toContain('snice-table');
    expect(tags.some(tag => tag.includes('spreadsheet'))).toBe(false);
  });

  it('extracts public fields, attributes, methods, events, slots, parts and CSS properties', () => {
    const button = declarations.find(declaration => declaration.tagName === 'snice-button')!;
    expect(button.members).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'field', name: 'disabled', type: { text: 'boolean' } }),
      expect.objectContaining({ kind: 'method', name: 'setLoading' })
    ]));
    expect(button.members.some(member => member.name === 'button')).toBe(false);
    expect(button.attributes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'icon-placement', fieldName: 'iconPlacement' }),
      expect.objectContaining({ name: 'disabled', fieldName: 'disabled', reflects: true })
    ]));
    expect(button.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'button-click' })
    ]));
    expect(button.slots).toEqual(expect.arrayContaining([{ name: '' }, { name: 'icon' }]));
    expect(button.cssParts).toEqual(expect.arrayContaining([{ name: 'base' }, { name: 'label' }]));
    expect(button.cssProperties.length).toBeGreaterThan(0);
  });

  it('emits a deterministic Custom Elements Manifest with publishable module paths', () => {
    const manifest = createCustomElementsManifest(declarations);
    expect(manifest.schemaVersion).toBe('2.1.0');
    expect(manifest.modules.every(module => module.path.startsWith('dist/components/'))).toBe(true);
    const exportedTags = manifest.modules.flatMap(module => module.exports.map(entry => entry.name));
    expect([...exportedTags].sort()).toEqual(declarations.map(declaration => declaration.tagName));
  });

  it('emits editor completion values and a complete HTMLElementTagNameMap', () => {
    const editor = createHtmlCustomData(declarations);
    const button = editor.tags.find(tag => tag.name === 'snice-button')!;
    expect(button.attributes.find(attribute => attribute.name === 'variant')?.values).toEqual(
      expect.arrayContaining([{ name: 'primary' }, { name: 'danger' }])
    );

    const typings = createTagNameDeclarations(declarations);
    for (const declaration of declarations) {
      expect(typings).toContain(`'${declaration.tagName}': ${declaration.name};`);
    }
  });

  it('keeps checked-in generated files byte-for-byte current', () => {
    expect(() => generateComponentMetadata({ check: true })).not.toThrow();
    expect(JSON.parse(fs.readFileSync(path.join(root, 'custom-elements.json'), 'utf8')).schemaVersion).toBe('2.1.0');
    expect(JSON.parse(fs.readFileSync(path.join(root, 'vscode.html-custom-data.json'), 'utf8')).version).toBe(1.1);
  });
});
