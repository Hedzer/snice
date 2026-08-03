// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const human = read('docs/components/radio.md');
const ai = read('docs/ai/components/radio.md');
const source = read('packages/components/src/radio/snice-radio.ts');
const stories = read('packages/components/src/radio/snice-radio.stories.ts');
const showcase = read('website/showcases/radio/full.html');

describe('Radio documentation alignment', () => {
  it.each([
    ['human', human],
    ['AI', ai]
  ])('%s reference documents the native state, group, and form model', (_name, doc) => {
    for (const term of [
      'defaultChecked',
      'FormData',
      'valueMissing',
      'setCustomValidity',
      'fieldset',
      'form owner',
      'shadow root',
      'external',
      'input',
      'change',
      'radio-change'
    ]) {
      expect(doc).toContain(term);
    }
    expect(doc).toMatch(/checked[\s\S]*live|live[\s\S]*checked/i);
    expect(doc).toMatch(/checked[^\n]*attribute[^\n]*reset default|reset default[^\n]*checked[^\n]*attribute/i);
    expect(doc).toMatch(/input[\s\S]*change[\s\S]*radio-change/i);
    expect(doc).toMatch(/invalid[\s\S]*(visual|presentation)[\s\S]*(only|not)/i);
    expect(doc).toMatch(/name[\s\S]*form owner[\s\S]*(root|shadow)/i);
  });

  it('keeps the implementation contract explicit in metadata source', () => {
    expect(source).toContain("@property({ type: Boolean, attribute: 'checked' })");
    expect(source).toContain("@dispatch('radio-change'");
    expect(source).toContain('applyElementInternalsFormValue(');
    expect(source).toContain('applyElementInternalsValidity(');
    expect(source).toContain('{ valueMissing, customError }');
    expect(source).toContain("this.dispatchEvent(new Event('change'");
    expect(source).toContain("root.querySelectorAll('snice-radio')");
  });

  it('gives Storybook controls for live state, reset default, and form fields', () => {
    for (const property of ['checked', 'defaultChecked', 'name', 'value']) {
      expect(stories).toMatch(new RegExp(`^\\s*${property}:\\s*\\{ control:`, 'm'));
      expect(stories).toContain(`args.${property}`);
    }
    for (const id of [
      'radio-story-basic',
      'radio-story-pro',
      'radio-story-legend',
      'radio-story-fieldset'
    ]) {
      expect(stories).toContain(id);
    }
  });

  it('demonstrates validation, reset, fieldset, FormData, labels, and event order publicly', () => {
    for (const id of [
      'radio-form-contract',
      'radio-showcase-basic',
      'radio-showcase-pro',
      'radio-showcase-legend',
      'radio-showcase-fieldset',
      'radio-event-contract',
      'radio-showcase-event-a',
      'radio-showcase-event-b'
    ]) {
      expect(showcase).toContain(id);
    }
    expect(showcase).toContain('new FormData(form)');
    expect(showcase).toContain('Reset defaults');
    expect(showcase).toContain('input → change → radio-change');
    expect(showcase).toContain('external label');
  });
});
