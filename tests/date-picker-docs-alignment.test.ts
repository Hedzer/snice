// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const human = read('docs/components/date-picker.md');
const ai = read('docs/ai/components/date-picker.md');
const packageReadme = read('packages/components/src/date-picker/README.md');
const source = read('packages/components/src/date-picker/snice-date-picker.ts');
const stories = read('packages/components/src/date-picker/snice-date-picker.stories.ts');
const card = read('website/showcases/date-picker/card.html');
const showcase = read('website/showcases/date-picker/full.html');

describe('Date-picker documentation alignment', () => {
  it.each([
    ['human', human],
    ['AI', ai],
    ['component', packageReadme]
  ])('%s reference documents canonical live state and native form lifecycle', (_name, doc) => {
    for (const term of [
      'defaultValue',
      'YYYY-MM-DD',
      'FormData',
      'badInput',
      'setCustomValidity',
      'fieldset',
      'readonly',
      'loading',
      'datepicker-input',
      'datepicker-change'
    ]) {
      expect(doc).toContain(term);
    }
    expect(doc).toMatch(/value[\s\S]*canonical|canonical[\s\S]*value/i);
    expect(doc).toMatch(/value[^\n]*attribute[^\n]*reset default|reset default[^\n]*value[^\n]*attribute/i);
    expect(doc).toMatch(/format[\s\S]*(display|visible)[\s\S]*(submitted|canonical|value)/i);
    expect(doc).toMatch(/invalid[\s\S]*(visual|presentation)[\s\S]*(only|not)/i);
  });

  it('keeps canonical form state and validity explicit in implementation source', () => {
    expect(source).toContain("@property({ attribute: 'value' })");
    expect(source).toContain('defaultValue');
    expect(source).toContain('this.internals.setFormValue(this.value, this.inputValue)');
    expect(source).toContain('formResetCallback()');
    expect(source).toContain('formDisabledCallback(disabled: boolean)');
    expect(source).toContain('formStateRestoreCallback(');
    expect(source).toContain('badInput');
    expect(source).toContain("this.validationInput.type = 'date'");
  });

  it('gives Storybook controls for live state, reset default, and form fields', () => {
    for (const property of ['value', 'defaultValue', 'name', 'required', 'min', 'max']) {
      expect(stories).toMatch(new RegExp(`^\\s*${property}:\\s*\\{ control:`, 'm'));
      expect(stories).toContain(`args.${property}`);
    }
    for (const id of [
      'date-picker-story-delivery',
      'date-picker-story-readonly',
      'date-picker-story-legend',
      'date-picker-story-fieldset'
    ]) {
      expect(stories).toContain(id);
    }
  });

  it('demonstrates canonical FormData and reset on both public website surfaces', () => {
    for (const text of ['date-card-form', 'new FormData(form)', '2026-03-15', 'Reset']) {
      expect(card).toContain(text);
    }
    for (const id of [
      'date-picker-form-contract',
      'date-picker-showcase-form',
      'date-picker-showcase-delivery',
      'date-picker-showcase-readonly',
      'date-picker-showcase-legend',
      'date-picker-showcase-fieldset'
    ]) {
      expect(showcase).toContain(id);
    }
    expect(showcase).toContain('new FormData(form)');
    expect(showcase).toContain('Reset defaults');
    expect(showcase).toContain('submitted as YYYY-MM-DD');
  });
});
