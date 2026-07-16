// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const components = [
  { name: 'time-picker', fallback: 'Time' },
  { name: 'color-picker', fallback: 'Color' }
] as const;

describe('Time and color label documentation alignment', () => {
  it.each(components)('$name human, AI, and package references define the live label contract', component => {
    for (const path of [
      `docs/components/${component.name}.md`,
      `docs/ai/components/${component.name}.md`,
      `packages/components/src/${component.name}/README.md`
    ]) {
      const doc = read(path);
      for (const term of [
        '<label for',
        'wrapping',
        'multiple labels',
        'labels',
        'aria-describedby',
        'role="alert"',
        component.fallback
      ]) {
        expect(doc.toLowerCase()).toContain(term.toLowerCase());
      }
      expect(doc).toMatch(/error[\s\S]{0,100}replac(?:es|ing) helper/i);
    }
  });

  it.each(components)('$name source exposes shared association and a live labels surface', component => {
    const source = read(`packages/components/src/${component.name}/snice-${component.name}.ts`);
    expect(source).toContain("import { FormLabelAssociation } from '../form-label-association';");
    expect(source).toContain('new FormLabelAssociation(');
    expect(source).toContain('get labels(): NodeList | null');
    expect(source).toContain('return this.labelAssociation.labels;');
    expect(source).toContain('aria-describedby="${describedBy}"');
    expect(source).toContain('role="alert"');
    expect(source).toContain('@click=${() => this.focus()}');
  });

  it.each(components)('$name Storybook and public showcase expose the label lifecycle', component => {
    const story = read(`packages/components/src/${component.name}/snice-${component.name}.stories.ts`);
    const showcase = read(`website/showcases/${component.name}/full.html`);
    for (const surface of [story, showcase]) {
      expect(surface.toLowerCase()).toContain('external label lifecycle');
      expect(surface).toContain('Change label');
      expect(surface).toContain('Show error');
      expect(surface).toContain('Remove external labels');
      expect(surface).toContain('helper-text');
      expect(surface).toContain('required');
    }
  });

  it('documents and implements unambiguous time composite names', () => {
    const source = read('packages/components/src/time-picker/snice-time-picker.ts');
    const docs = read('docs/components/time-picker.md');
    for (const suffix of ['controls', 'hours', 'minutes', 'seconds', 'period']) {
      expect(source).toContain(suffix);
      expect(docs).toContain(suffix);
    }
  });

  it('keeps the native color input unnamed and documents distinct swatch and preset names', () => {
    const source = read('packages/components/src/color-picker/snice-color-picker.ts');
    const docs = read('docs/components/color-picker.md');
    expect(source).not.toMatch(/class="native-input"[\s\S]{0,300}\bname=/);
    expect(source).toContain('`${name} color chooser`');
    expect(source).toContain('`Set ${name} to ${preset.dataset.color}`');
    expect(docs).toContain('hidden native color input');
    expect(docs).toContain('duplicate form field');
  });
});
