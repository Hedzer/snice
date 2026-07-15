// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const human = read('docs/components/checkbox.md');
const ai = read('docs/ai/components/checkbox.md');
const source = read('packages/components/src/checkbox/snice-checkbox.ts');
const stories = read('packages/components/src/checkbox/snice-checkbox.stories.ts');
const showcase = read('website/showcases/checkbox/full.html');

describe('Checkbox documentation alignment', () => {
  it.each([
    ['human', human],
    ['AI', ai]
  ])('%s reference documents the native state and form model', (_name, doc) => {
    for (const term of [
      'defaultChecked',
      'FormData',
      'valueMissing',
      'setCustomValidity',
      'fieldset',
      'external',
      'indeterminate',
      'input',
      'change',
      'checkbox-change'
    ]) {
      expect(doc).toContain(term);
    }
    expect(doc).toMatch(/checked[\s\S]*live|live[\s\S]*checked/i);
    expect(doc).toMatch(/checked[^\n]*attribute[^\n]*reset default|reset default[^\n]*checked[^\n]*attribute/i);
    expect(doc).toMatch(/input[\s\S]*change[\s\S]*checkbox-change/i);
    expect(doc).toMatch(/invalid[\s\S]*(visual|presentation)[\s\S]*(only|not)/i);
  });

  it('keeps the implementation contract explicit in generated metadata source', () => {
    expect(source).toContain("@property({ type: Boolean, attribute: 'checked' })");
    expect(source).toContain("@dispatch('checkbox-change'");
    expect(source).toContain("this.internals.setFormValue(");
    expect(source).toContain("this.internals.setValidity({ valueMissing, customError }");
    expect(source).toContain("this.dispatchEvent(new Event('change'");
  });

  it('gives Storybook controls for live state, reset default, and form fields', () => {
    for (const property of ['checked', 'defaultChecked', 'name', 'value']) {
      expect(stories).toMatch(new RegExp(`^\\s*${property}:\\s*\\{ control:`, 'm'));
      expect(stories).toContain(`args.${property}`);
    }
    for (const id of [
      'checkbox-story-terms',
      'checkbox-story-digest',
      'checkbox-story-legend',
      'checkbox-story-fieldset'
    ]) {
      expect(stories).toContain(id);
    }
  });

  it('demonstrates validation, reset, fieldset, FormData, and event order publicly', () => {
    for (const id of [
      'checkbox-form-contract',
      'checkbox-showcase-terms',
      'checkbox-showcase-digest',
      'checkbox-showcase-legend',
      'checkbox-showcase-fieldset',
      'checkbox-event-contract'
    ]) {
      expect(showcase).toContain(id);
    }
    expect(showcase).toContain('new FormData(form)');
    expect(showcase).toContain('Reset defaults');
    expect(showcase).toContain('input → change → checkbox-change');
  });
});
