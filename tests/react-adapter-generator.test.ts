// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { join } from 'path';
import {
  extractPropertiesFromFile,
  generateReactComponent
} from '../tooling/generators/generate-react-adapters.js';

const component = (name: string) => join(
  process.cwd(),
  'packages',
  'components',
  'src',
  name,
  `snice-${name}.ts`
);

describe('React adapter generator', () => {
  it('publishes checkbox live accessors, decorated properties, events, and form association', () => {
    const metadata = extractPropertiesFromFile(component('checkbox'));
    expect(metadata.properties).toEqual(expect.arrayContaining([
      'checked',
      'defaultChecked',
      'indeterminate',
      'disabled',
      'required',
      'name',
      'value'
    ]));
    expect(metadata.events).toEqual({ 'checkbox-change': 'onCheckboxChange' });
    expect(metadata.isFormAssociated).toBe(true);

    const generated = generateReactComponent('checkbox', metadata);
    expect(generated).toContain('extends SniceFormProps');
    expect(generated).toContain('formAssociated: true');
    expect(generated).toContain('"checked"');
    expect(generated).toContain('"defaultChecked"');
  });

  it('does not classify an ordinary component as form-associated', () => {
    const metadata = extractPropertiesFromFile(component('card'));
    expect(metadata.isFormAssociated).toBe(false);
    expect(generateReactComponent('card', metadata)).toContain('extends SniceBaseProps');
  });
});
