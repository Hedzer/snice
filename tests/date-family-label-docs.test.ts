// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

const components = [
  { name: 'date-picker', fallback: 'Date' },
  { name: 'date-range-picker', fallback: 'Date range' },
  { name: 'date-time-picker', fallback: 'Date and time' }
] as const;

describe('Date-family label documentation alignment', () => {
  it.each(components)('$name human and AI references define the complete live label contract', component => {
    for (const path of [
      `docs/components/${component.name}.md`,
      `docs/ai/components/${component.name}.md`
    ]) {
      const doc = read(path);
      for (const term of [
        '<label for',
        'wrapping',
        'multiple labels',
        'document order',
        'labels',
        'aria-describedby',
        'role="alert"',
        'aria-invalid',
        'without opening',
        component.fallback
      ]) {
        expect(doc).toContain(term);
      }
      expect(doc).toMatch(/error[\s\S]{0,100}replaces helper/i);
      expect(doc).toMatch(/disabled[\s\S]{0,80}inert/i);
    }
  });

  it.each(components)('$name source exposes the shared association, description, and live labels surface', component => {
    const source = read(`packages/components/src/${component.name}/snice-${component.name}.ts`);
    expect(source).toContain("import { FormLabelAssociation } from '../form-label-association';");
    expect(source).toContain('new FormLabelAssociation(');
    expect(source).toContain('get labels(): NodeList | null');
    expect(source).toContain('return this.labelAssociation.labels;');
    expect(source).toContain('aria-describedby="${describedBy}"');
    expect(source).toContain('role="alert"');
    expect(source).toContain('@click=${() => this.focus()}');
  });

  it.each(components)('$name Storybook and public showcase expose a controllable lifecycle example', component => {
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

  it('documents and implements unambiguous composite names', () => {
    const rangeSource = read('packages/components/src/date-range-picker/snice-date-range-picker.ts');
    const dateTimeSource = read('packages/components/src/date-time-picker/snice-date-time-picker.ts');
    const rangeDocs = read('docs/components/date-range-picker.md');
    const dateTimeDocs = read('docs/components/date-time-picker.md');
    expect(rangeSource).toContain('`${name} calendar`');
    expect(rangeDocs).toContain('one range field');
    for (const suffix of ['controls', 'date', 'hours', 'minutes', 'seconds', 'period']) {
      expect(dateTimeSource).toContain(suffix);
      expect(dateTimeDocs).toContain(suffix);
    }
  });
});
