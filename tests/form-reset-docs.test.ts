import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const metadata = JSON.parse(read('custom-elements.json')) as {
  modules: Array<{
    declarations?: Array<{
      tagName?: string;
      members?: Array<{ name: string }>;
      attributes?: Array<{ name: string; fieldName?: string }>;
    }>;
  }>;
};

function declaration(tagName: string) {
  const result = metadata.modules
    .flatMap(module => module.declarations ?? [])
    .find(candidate => candidate.tagName === tagName);
  if (!result) throw new Error(`Missing custom-elements declaration for ${tagName}`);
  return result;
}

const scalar = ['input', 'textarea', 'select', 'color-picker', 'step-input', 'slider'] as const;

describe('authored reset-default documentation', () => {
  for (const component of scalar) {
    it(`${component} documents live value and defaultValue in human and AI references`, () => {
      for (const prefix of ['docs/components', 'docs/ai/components']) {
        const content = read(`${prefix}/${component}.md`);
        expect(content).toContain('defaultValue');
        expect(content).toMatch(/`value` (?:content )?attribute|value attribute/i);
        expect(content).toMatch(/form\.reset\(\)|form-reset|reset default/i);
        expect(content).toMatch(/silent|do not emit/i);
        expect(content).toMatch(/fieldset/i);
      }
    });
  }

  it('tag input documents JSON defaults and successful values', () => {
    for (const prefix of ['docs/components', 'docs/ai/components']) {
      const content = read(`${prefix}/tag-input.md`);
      expect(content).toContain('defaultValue');
      expect(content).toMatch(/JSON/);
      expect(content).toMatch(/silent/i);
      expect(content).toMatch(/fieldset/i);
    }
  });

  it('switch documents native checked/defaultChecked separation', () => {
    for (const prefix of ['docs/components', 'docs/ai/components']) {
      const content = read(`${prefix}/switch.md`);
      expect(content).toContain('defaultChecked');
      expect(content).toContain('checked` content attribute');
      expect(content).toMatch(/silent/i);
      expect(content).toMatch(/fieldset/i);
    }
  });

  it('range slider documents both independent authored endpoints', () => {
    for (const prefix of ['docs/components', 'docs/ai/components']) {
      const content = read(`${prefix}/range-slider.md`);
      expect(content).toContain('defaultValueLow');
      expect(content).toContain('defaultValueHigh');
      expect(content).toContain('value-low');
      expect(content).toContain('value-high');
      expect(content).toContain('"low,high"');
    }
  });

  it('file upload explicitly documents the native empty-default contract', () => {
    for (const prefix of ['docs/components', 'docs/ai/components']) {
      const content = read(`${prefix}/file-upload.md`);
      expect(content).toMatch(/no authorable non-empty default|cannot have an authored non-empty default/i);
      expect(content).toContain('FormData');
      expect(content).toMatch(/silent/i);
      expect(content).toMatch(/fieldset/i);
    }
  });

  it('checkbox and radio retain their existing checked-default contract', () => {
    for (const component of ['checkbox', 'radio']) {
      for (const prefix of ['docs/components', 'docs/ai/components']) {
        const content = read(`${prefix}/${component}.md`);
        expect(content).toContain('defaultChecked');
        expect(content).toMatch(/reset/i);
        expect(content).toMatch(/dirty|clean|independent/i);
      }
    }
  });

  it('publishes live and reset-default properties in generated editor metadata', () => {
    for (const component of scalar) {
      const element = declaration(`snice-${component}`);
      expect(element.members?.map(member => member.name)).toEqual(
        expect.arrayContaining(['value', 'defaultValue'])
      );
      expect(element.attributes).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'value', fieldName: 'defaultValue' })
      ]));
    }

    const tags = declaration('snice-tag-input');
    expect(tags.members?.map(member => member.name)).toEqual(
      expect.arrayContaining(['value', 'defaultValue'])
    );
    expect(tags.attributes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'value', fieldName: 'defaultValue' })
    ]));

    const switchElement = declaration('snice-switch');
    expect(switchElement.members?.map(member => member.name)).toEqual(
      expect.arrayContaining(['checked', 'defaultChecked'])
    );
    expect(switchElement.attributes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'checked', fieldName: 'defaultChecked' })
    ]));

    const range = declaration('snice-range-slider');
    expect(range.members?.map(member => member.name)).toEqual(
      expect.arrayContaining(['valueLow', 'valueHigh', 'defaultValueLow', 'defaultValueHigh'])
    );
    expect(range.attributes).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'value-low', fieldName: 'defaultValueLow' }),
      expect.objectContaining({ name: 'value-high', fieldName: 'defaultValueHigh' })
    ]));

    expect(declaration('snice-file-upload').members?.map(member => member.name)).toContain('files');
  });
});
