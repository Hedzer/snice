// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const human = read('docs/components/date-time-picker.md');
const ai = read('docs/ai/components/date-time-picker.md');
const packageReadme = read('packages/components/src/date-time-picker/README.md');
const source = read('packages/components/src/date-time-picker/snice-date-time-picker.ts');
const stories = read('packages/components/src/date-time-picker/snice-date-time-picker.stories.ts');
const card = read('website/showcases/date-time-picker/card.html');
const showcase = read('website/showcases/date-time-picker/full.html');

describe('Date-time-picker documentation alignment', () => {
  it.each([
    ['human', human],
    ['AI', ai]
  ])('%s reference documents the complete local datetime form contract', (_name, doc) => {
    for (const term of [
      'defaultValue',
      'YYYY-MM-DDTHH:mm',
      'showSeconds',
      'FormData',
      'badInput',
      'rangeUnderflow',
      'rangeOverflow',
      'setCustomValidity',
      'fieldset',
      'readonly',
      'loading',
      'datetime-change'
    ]) {
      expect(doc).toContain(term);
    }
    expect(doc).toMatch(/local[\s\S]{0,100}(no time zone|never converts to UTC|never convert to UTC)/i);
    expect(doc).toMatch(/defaultValue[\s\S]{0,300}(attribute|reset)|(attribute|reset)[\s\S]{0,300}defaultValue/i);
    expect(doc).toMatch(/dateFormat[\s\S]*(display|presentation)[\s\S]*(canonical|form)/i);
    expect(doc).toMatch(/invalid[\s\S]*(visual|presentation)/i);
  });

  it('keeps the component-local reference tied to canonical values and live/default state', () => {
    for (const term of ['defaultValue', 'YYYY-MM-DDTHH:mm', 'badInput', 'local wall times']) {
      expect(packageReadme).toContain(term);
    }
  });

  it('keeps the native lifecycle explicit in implementation source', () => {
    expect(source).toContain("@property({ attribute: 'value' })");
    expect(source).toContain('defaultValue');
    expect(source).toContain('formAssociatedCallback()');
    expect(source).toContain('formResetCallback()');
    expect(source).toContain('formDisabledCallback(disabled: boolean)');
    expect(source).toContain('formStateRestoreCallback(');
    expect(source).toContain('setFormValue(canonical, this.inputValue)');
    expect(source).toContain('badInput');
    expect(source).toContain('rangeUnderflow');
    expect(source).toContain('rangeOverflow');
    expect(source).toContain("get type(): 'datetime-local'");
  });

  it('gives Storybook controls and a complete native form story', () => {
    for (const property of ['value', 'defaultValue', 'name', 'required', 'min', 'max', 'showSeconds']) {
      expect(stories).toMatch(new RegExp(`^\\s*${property}:\\s*\\{ control:`, 'm'));
      expect(stories).toContain(`args.${property}`);
    }
    for (const id of [
      'date-time-picker-story-appointment',
      'date-time-picker-story-readonly',
      'date-time-picker-story-legend',
      'date-time-picker-story-fieldset'
    ]) {
      expect(stories).toContain(id);
    }
  });

  it('demonstrates canonical FormData and reset on both public website surfaces', () => {
    for (const text of [
      'showcase-date-time-form',
      'showcase-date-time-form-picker',
      'new FormData(form)',
      'appointment',
      'Reset'
    ]) {
      expect(card).toContain(text);
    }
    for (const text of [
      'date-time-picker-showcase-form',
      'date-time-picker-showcase-appointment',
      'new FormData(form)',
      'YYYY-MM-DDTHH:mm:ss',
      'Reset defaults',
      'Disabled fieldset'
    ]) {
      expect(showcase).toContain(text);
    }
  });
});
