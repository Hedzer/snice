// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const human = read('docs/components/date-range-picker.md');
const ai = read('docs/ai/components/date-range-picker.md');
const packageReadme = read('packages/components/src/date-range-picker/README.md');
const source = read('packages/components/src/date-range-picker/snice-date-range-picker.ts');
const stories = read('packages/components/src/date-range-picker/snice-date-range-picker.stories.ts');
const card = read('website/showcases/date-range-picker/card.html');
const showcase = read('website/showcases/date-range-picker/full.html');

describe('Date-range-picker documentation alignment', () => {
  it.each([
    ['human', human],
    ['AI', ai],
    ['component', packageReadme]
  ])('%s reference documents live/default state and the complete native form contract', (_name, doc) => {
    for (const term of [
      'defaultStart',
      'defaultEnd',
      'YYYY-MM-DD',
      'FormData',
      'booking-start',
      'booking-end',
      'badInput',
      'setCustomValidity',
      'fieldset',
      'readonly',
      'loading',
      'invalid',
      'daterange-change'
    ]) {
      expect(doc).toContain(term);
    }
    expect(doc).toMatch(/start[\s\S]*end[\s\S]*(live|current)|live[\s\S]*start[\s\S]*end/i);
    expect(doc).toMatch(/defaultStart[\s\S]{0,300}(attribute|reset)|(attribute|reset)[\s\S]{0,300}defaultStart/i);
    expect(doc).toMatch(/defaultEnd[\s\S]{0,300}(attribute|reset)|(attribute|reset)[\s\S]{0,300}defaultEnd/i);
    expect(doc).toMatch(/format[\s\S]*(display|visible)[\s\S]*(submitted|canonical|form)/i);
    expect(doc).toMatch(/invalid[\s\S]*(visual|presentation)[\s\S]*(only|not)/i);
    expect(doc).toMatch(/reversed[\s\S]*(preserv|not silently|without silently)/i);
  });

  it('keeps the two-field canonical lifecycle explicit in implementation source', () => {
    expect(source).toContain("@property({ attribute: 'start' })");
    expect(source).toContain("@property({ attribute: 'end' })");
    expect(source).toContain('defaultStart');
    expect(source).toContain('defaultEnd');
    expect(source).toContain('formData.append(`${this.name}-start`');
    expect(source).toContain('formData.append(`${this.name}-end`');
    expect(source).toContain('formResetCallback()');
    expect(source).toContain('formDisabledCallback(disabled: boolean)');
    expect(source).toContain('formStateRestoreCallback(');
    expect(source).toContain('badInput');
    expect(source).toContain('rangeUnderflow');
    expect(source).toContain('rangeOverflow');
    expect(source).toContain('End date must be on or after start date.');
  });

  it('gives Storybook controls for live state, reset defaults, and form constraints', () => {
    for (const property of [
      'start', 'end', 'defaultStart', 'defaultEnd', 'name', 'required', 'min', 'max'
    ]) {
      expect(stories).toMatch(new RegExp(`^\\s*${property}:\\s*\\{ control:`, 'm'));
      expect(stories).toContain(`args.${property}`);
    }
    for (const id of [
      'date-range-picker-story-booking',
      'date-range-picker-story-readonly',
      'date-range-picker-story-legend',
      'date-range-picker-story-fieldset'
    ]) {
      expect(stories).toContain(id);
    }
  });

  it('demonstrates canonical FormData and reset on both public website surfaces', () => {
    for (const text of [
      'showcase-range-form',
      'showcase-range-form-picker',
      'new FormData(form)',
      'booking-start',
      'booking-end',
      'Reset'
    ]) {
      expect(card).toContain(text);
    }
    for (const text of [
      'drp-form',
      'drp-form-picker',
      'new FormData(form)',
      'booking-start',
      'booking-end',
      'YYYY-MM-DD',
      'Reset defaults'
    ]) {
      expect(showcase).toContain(text);
    }
  });
});
