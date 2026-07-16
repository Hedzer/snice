// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const human = read('docs/components/key-value.md');
const ai = read('docs/ai/components/key-value.md');
const packageReadme = read('packages/components/src/key-value/README.md');
const source = read('packages/components/src/key-value/snice-key-value.ts');
const stories = read('packages/components/src/key-value/snice-key-value.stories.ts');
const card = read('website/showcases/key-value/card.html');
const showcase = read('website/showcases/key-value/full.html');
const reactGenerator = read('tooling/generators/generate-react-adapters.js');

describe('Key-value documentation alignment', () => {
  it.each([
    ['human', human],
    ['AI', ai],
  ])('%s reference defines the complete ordered form contract', (_name, doc) => {
    for (const term of [
      'defaultValue',
      'ordered JSON',
      'description',
      'duplicate',
      'Unicode',
      'FormData',
      'valueMissing',
      'badInput',
      'customError',
      'setCustomValidity',
      'fieldset',
      'readonly',
      'view',
      'snice-kv-pair',
      'kv-change',
    ]) {
      expect(doc).toContain(term);
    }
    expect(doc).toMatch(/empty editor[\s\S]{0,100}`?\[\]`?/i);
    expect(doc).toMatch(/duplicate[\s\S]{0,100}(preserv|retain)/i);
    expect(doc).toMatch(/non-(empty|whitespace)[\s\S]{0,100}key|key[\s\S]{0,100}non-whitespace/i);
    expect(doc).toMatch(/defaultValue[\s\S]{0,200}(attribute|reset)|(attribute|reset)[\s\S]{0,200}defaultValue/i);
  });

  it('keeps the component-local reference tied to serialization and lifecycle', () => {
    for (const term of ['defaultValue', 'ordered JSON', 'description', 'duplicate', 'Unicode', 'badInput']) {
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
    expect(source).toContain('setFormValue(this.valueState, this.valueState)');
    expect(source).toContain('valueMissing');
    expect(source).toContain('badInput');
    expect(source).toContain("get type(): 'key-value'");
    expect(source).toContain("@property({ type: Array, attribute: false })\n  placeholders");
  });

  it('gives Storybook controls and a complete native form story', () => {
    for (const property of ['value', 'defaultValue', 'name', 'required', 'rows', 'showDescription', 'showCopy']) {
      expect(stories).toMatch(new RegExp(`^\\s*${property}:\\s*\\{ control:`, 'm'));
      expect(stories).toContain(`args.${property}`);
    }
    for (const id of [
      'key-value-story-main',
      'key-value-story-readonly',
      'key-value-story-legend',
      'key-value-story-fieldset',
    ]) {
      expect(stories).toContain(id);
    }
    expect(stories).toContain("pairEl.setAttribute('key', pair.key)");
    expect(stories).toContain("pairEl.setAttribute('value', pair.value)");
    expect(stories).not.toContain("setAttribute('pair-key'");
    expect(stories).not.toContain("setAttribute('pair-value'");
  });

  it('demonstrates duplicates, Unicode, FormData, reset, and fieldsets on both website surfaces', () => {
    for (const text of [
      'showcase-key-value-form',
      'showcase-key-value-form-editor',
      'new FormData(form)',
      '東京 ✓',
      'Reset',
    ]) {
      expect(card).toContain(text);
    }
    for (const text of [
      'key-value-showcase-form',
      'key-value-showcase-editor',
      'key-value-showcase-legend',
      'key-value-showcase-fieldset',
      'new FormData(form)',
      '東京 ✓',
      'Reset defaults',
      'Disabled fieldset',
    ]) {
      expect(showcase).toContain(text);
    }
  });

  it('keeps the React surface strongly typed for new and existing capabilities', () => {
    expect(reactGenerator).toContain("'key-value': {");
    for (const property of ['value', 'defaultValue', 'placeholders', 'required', 'variant', 'mode']) {
      expect(reactGenerator).toMatch(new RegExp(`\\b${property}:`));
    }
    for (const event of ['onKvAdd', 'onKvRemove', 'onKvChange', 'onKvCopy']) {
      expect(reactGenerator).toContain(`${event}: 'CustomEvent<`);
    }
  });
});
