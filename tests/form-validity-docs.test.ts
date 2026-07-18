// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const controls = [
  'checkbox', 'color-picker', 'date-picker', 'date-range-picker',
  'date-time-picker', 'file-upload', 'input', 'key-value', 'radio',
  'range-slider', 'select', 'slider', 'step-input', 'switch', 'tag-input',
  'textarea', 'time-picker'
] as const;

describe('form validity documentation', () => {
  it.each(controls)('%s exposes the customer-facing native form surface in human and AI docs', component => {
    for (const prefix of ['docs/components', 'docs/ai/components']) {
      const content = read(`${prefix}/${component}.md`);
      for (const term of [
        'FormData', 'validity', 'validationMessage',
        'willValidate', 'labels', 'checkValidity', 'reportValidity',
        'setCustomValidity', 'disabled'
      ]) {
        expect(content, `${prefix}/${component}.md: ${term}`).toContain(term);
      }
    }
  });

  it.each([
    ['input', [/required/i, /valueMissing/, /typeMismatch/, /patternMismatch/]],
    ['textarea', [/valueMissing/, /tooShort/, /tooLong/]],
    ['select', [/required/i, /valueMissing/]],
    ['switch', [/required/i, /valueMissing/]],
    ['file-upload', [/required/i, /max(?:-?size|Size)/, /max(?:-?files|Files)/]],
    ['color-picker', [/required/i, /valueMissing/, /badInput/]],
    ['slider', [/(?:step lattice starts at .{0,2}min|min.{0,3}based)/, /setCustomValidity/]],
    ['range-slider', [/min.{0,3}based/, /setCustomValidity/]],
    ['step-input', [/min.{0,3}based/, /setCustomValidity/]],
    ['tag-input', [/tooLong/, /duplicate/i]]
  ] as const)('%s documents its component-specific validity rules in both references', (component, terms) => {
    for (const prefix of ['docs/components', 'docs/ai/components']) {
      const content = read(`${prefix}/${component}.md`);
      for (const term of terms) {
        expect(content, `${prefix}/${component}.md: ${term}`).toMatch(term);
      }
    }
  });

  it.each(['input', 'textarea', 'select', 'switch', 'file-upload', 'color-picker', 'slider'])(
    '%s distinguishes authored invalid presentation from native validity',
    component => {
      for (const prefix of ['docs/components', 'docs/ai/components']) {
        const content = read(`${prefix}/${component}.md`);
        expect(content).toMatch(/invalid[\s\S]{0,160}(?:presentation|visual|does not)/i);
      }
    }
  );

  it.each(['checkbox', 'date-picker', 'radio'])(
    '%s preserves validation participation while loading',
    component => {
      for (const prefix of ['docs/components', 'docs/ai/components']) {
        const content = read(`${prefix}/${component}.md`);
        expect(content).toMatch(/loading[\s\S]{0,160}(?:validation|form participation)/i);
        expect(content).toMatch(/loading[\s\S]{0,160}(?:does not|participates|participation|still)/i);
      }
    }
  );
});
