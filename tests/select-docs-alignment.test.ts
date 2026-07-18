// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const human = read('docs/components/select.md');
const ai = read('docs/ai/components/select.md');
const source = read('packages/components/src/select/snice-select.ts');
const stories = read('packages/components/src/select/snice-select.stories.ts');
const showcase = read('website/showcases/select/full.html');

describe('Select documentation alignment', () => {
  it.each([
    ['human', human],
    ['AI', ai],
  ])('%s reference defines the external-label naming and focus contract', (_name, doc) => {
    for (const term of [
      '<label for',
      'wrapping',
      'document order',
      'helper',
      'error',
      'aria-invalid',
      'labels',
      'ElementInternals',
      'FormData',
    ]) {
      expect(doc).toContain(term);
    }
    expect(doc).toMatch(/external labels[\s\S]{0,160}(override|precedence|combined)/i);
    expect(doc).toMatch(/standard[\s\S]{0,160}focus[\s\S]{0,100}(without|does not)[\s\S]{0,40}open/i);
    expect(doc).toMatch(/editable[\s\S]{0,160}focus-to-open/i);
    expect(doc).toMatch(/(?:falls? back to|fallback[\s\S]{0,40}(?:name|order)[\s\S]{0,40}(?:is|:))[\s\S]{0,100}`?label`?[\s\S]{0,100}`?Select`?|`?label`?[\s\S]{0,100}fallback[\s\S]{0,100}`?Select`?/i);
    expect(doc).not.toMatch(/hidden native `<select>` for form submission/i);
  });

  it('keeps the public type and render surface tied to the documented contract', () => {
    expect(source).toContain('new FormLabelAssociation(');
    expect(source).toContain('get labels(): NodeList | null');
    expect(source).toContain('aria-label="${accessibleName}"');
    expect(source.match(/aria-describedby="\$\{\(this\.errorText \|\| this\.helperText\)/g)).toHaveLength(2);
    expect(source).toContain('const displayedInvalid = this.invalid || this.constraintInvalid;');
    expect(source.match(/aria-invalid="\$\{displayedInvalid/g)).toHaveLength(2);
  });

  it.each([
    ['Storybook', stories],
    ['full showcase', showcase],
  ])('%s demonstrates the complete external-label lifecycle', (_name, content) => {
    for (const phrase of [
      'External label lifecycle',
      'Shipping country',
      'Editable destination',
      'Unavailable destination',
      'Remove external labels',
      'Show error',
      'helper',
    ]) {
      expect(content.toLowerCase()).toContain(phrase.toLowerCase());
    }
    expect(content).toContain('required');
  });

  it('offers Storybook controls for both naming and description fallbacks', () => {
    for (const property of ['label', 'helperText', 'errorText', 'editable', 'allowFreeText']) {
      expect(stories).toMatch(new RegExp(`^\\s*${property}:\\s*\\{ control:`, 'm'));
      expect(stories).toContain(`args.${property}`);
    }
  });
});
