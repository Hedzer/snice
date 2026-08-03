// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const human = read('docs/components/time-picker.md');
const ai = read('docs/ai/components/time-picker.md');
const packageReadme = read('packages/components/src/time-picker/README.md');
const source = read('packages/components/src/time-picker/snice-time-picker.ts');
const stories = read('packages/components/src/time-picker/snice-time-picker.stories.ts');
const card = read('website/showcases/time-picker/card.html');
const showcase = read('website/showcases/time-picker/full.html');

describe('Time-picker documentation alignment', () => {
  it.each([
    ['human', human],
    ['AI', ai]
  ])('%s reference documents the complete local-time form contract', (_name, doc) => {
    for (const term of [
      'defaultValue',
      'HH:mm',
      'HH:mm:ss',
      'showSeconds',
      'FormData',
      'badInput',
      'valueMissing',
      'rangeUnderflow',
      'rangeOverflow',
      'stepMismatch',
      'setCustomValidity',
      'fieldset',
      'readonly',
      'loading',
      'time-change'
    ]) {
      expect(doc).toContain(term);
    }
    expect(doc).toMatch(/local[\s\S]{0,100}(no date|no time zone|UTC conversion)/i);
    expect(doc).toMatch(/defaultValue[\s\S]{0,300}(attribute|reset)|(attribute|reset)[\s\S]{0,300}defaultValue/i);
    expect(doc).toMatch(/format[\s\S]*(display|presentation)[\s\S]*(canonical|form)/i);
    expect(doc).toMatch(/invalid[\s\S]*(visual|presentation)/i);
    expect(doc).toMatch(/step[\s\S]{0,300}minute[\s\S]{0,300}second/i);
  });

  it('keeps the component-local reference tied to canonical and live/default state', () => {
    for (const term of ['defaultValue', 'HH:mm', 'HH:mm:ss', 'badInput', 'local wall times']) {
      expect(packageReadme).toContain(term);
    }
  });

  it('keeps the complete native lifecycle explicit in source', () => {
    expect(source).toContain("@property({ attribute: 'value' })");
    expect(source).toContain('defaultValue');
    expect(source).toContain('formAssociatedCallback()');
    expect(source).toContain('formResetCallback()');
    expect(source).toContain('formDisabledCallback(disabled: boolean)');
    expect(source).toContain('formStateRestoreCallback(');
    expect(source).toContain('applyElementInternalsFormValue(this.internals, canonical, this.inputValue)');
    expect(source).toContain('badInput');
    expect(source).toContain('rangeUnderflow');
    expect(source).toContain('rangeOverflow');
    expect(source).toContain('stepMismatch');
    expect(source).toContain("get type(): 'time'");
    expect(source).toContain(".popover=${isInline ? null : 'manual'}");
  });

  it('gives Storybook controls and a complete native form story', () => {
    for (const property of ['value', 'defaultValue', 'name', 'required', 'minTime', 'maxTime', 'step', 'showSeconds']) {
      expect(stories).toMatch(new RegExp(`^\\s*${property}:\\s*\\{ control:`, 'm'));
      expect(stories).toContain(`args.${property}`);
    }
    for (const id of [
      'time-picker-story-appointment',
      'time-picker-story-readonly',
      'time-picker-story-legend',
      'time-picker-story-fieldset'
    ]) {
      expect(stories).toContain(id);
    }
  });

  it('demonstrates canonical FormData and reset on both public website surfaces', () => {
    for (const text of [
      'showcase-time-form',
      'showcase-time-form-picker',
      'new FormData(form)',
      'appointment',
      'Reset'
    ]) {
      expect(card).toContain(text);
    }
    for (const text of [
      'time-picker-showcase-form',
      'time-picker-showcase-appointment',
      'new FormData(form)',
      'HH:mm:ss',
      'Reset defaults',
      'Disabled fieldset'
    ]) {
      expect(showcase).toContain(text);
    }
  });
});
