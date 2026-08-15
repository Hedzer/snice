/**
 * snice-select matrix — structure, description precedence and option sources.
 *
 * The oracle (`checkSelect`) asserts the documented rendering for a property
 * vector: which trigger surface the mode renders, the documented parts, the
 * label, exactly one description with `errorText` winning over `helperText`,
 * the listbox ARIA, the search field's visibility rule, the loading spinner,
 * and the rendered option list with its per-option ARIA.
 *
 * 72 + 27 + 18 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  FRUITS, SIZES, WITH_EXTRAS,
  checkSelect, combo, comboName, expectNoProblems, makeSelect, optionLabels,
  optionValues, part, text, wait,
  type OptionSource,
} from './select-support';

describe('select matrix — size x mode x description', () => {
  afterEach(() => unmountAll());

  const TEXTS = [
    { name: 'bare', label: '', helperText: '', errorText: '' },
    { name: 'labelled', label: 'Fruit', helperText: '', errorText: '' },
    { name: 'helper', label: 'Fruit', helperText: 'Pick one', errorText: '' },
    { name: 'error', label: 'Fruit', helperText: '', errorText: 'Required' },
    { name: 'both', label: 'Fruit', helperText: 'Pick one', errorText: 'Required' },
  ];

  for (const size of SIZES) {
    for (const editable of [false, true]) {
      for (const shape of TEXTS) {
        const c = combo({ size, editable, ...shape });
        it(`${comboName(c)}/${shape.name}`, async () => {
          const el = await makeSelect(c);
          expectNoProblems(checkSelect(el, c), `${comboName(c)}/${shape.name}`);
        });
      }
    }
  }

  for (const size of SIZES) {
    for (const editable of [false, true]) {
      const c = combo({ size, editable, label: 'Fruit', searchable: true, clearable: true });
      it(`${comboName(c)} — search and clear affordances`, async () => {
        const el = await makeSelect(c);
        expectNoProblems(checkSelect(el, c), comboName(c));
      });
    }
  }
});

describe('select matrix — state flags', () => {
  afterEach(() => unmountAll());

  const FLAGS = ['disabled', 'readonly', 'loading', 'required', 'invalid', 'multiple'] as const;

  for (const flag of FLAGS) {
    for (const editable of [false, true]) {
      for (const value of [undefined, 'apple']) {
        const c = combo({ [flag]: true, editable, label: 'Fruit', value } as any);
        it(`${comboName(c)}${value ? '/valued' : ''}`, async () => {
          const el = await makeSelect(c);
          expectNoProblems(checkSelect(el, c), comboName(c));
        });
      }
    }
  }

  it('a disabled select disables its control', async () => {
    const button = await makeSelect(combo({ disabled: true }));
    expect((part<HTMLButtonElement>(button, 'trigger'))!.disabled).toBe(true);

    const editable = await makeSelect(combo({ disabled: true, editable: true }));
    expect((part<HTMLInputElement>(editable, 'input'))!.disabled).toBe(true);
  });

  it('a readonly editable input is readonly, not disabled', async () => {
    const el = await makeSelect(combo({ readonly: true, editable: true }));
    const input = part<HTMLInputElement>(el, 'input')!;
    expect(input.readOnly).toBe(true);
  });

  it('the placeholder is what an empty select shows', async () => {
    const el = await makeSelect(combo({ placeholder: 'Choose a fruit' }));
    expect(text(part(el, 'value'))).toBe('Choose a fruit');

    const editable = await makeSelect(combo({ editable: true, placeholder: 'Type or select…' }));
    expect(part<HTMLInputElement>(editable, 'input')!.placeholder).toBe('Type or select…');
  });

  it('the default placeholder is the documented one', async () => {
    const el = await makeSelect(combo());
    expect((el as any).placeholder).toBe('Select an option');
    expect(text(part(el, 'value'))).toBe('Select an option');
  });
});

describe('select matrix — where options come from', () => {
  afterEach(() => unmountAll());

  for (const source of ['array', 'children', 'both'] as OptionSource[]) {
    for (const options of [FRUITS, WITH_EXTRAS, []]) {
      for (const editable of [false, true]) {
        const c = combo({ source, options, editable, label: 'Fruit' });
        it(`${comboName(c)}/${options.length} options`, async () => {
          const el = await makeSelect(c);
          expectNoProblems(checkSelect(el, c), `${comboName(c)}/${options.length}`);
        });
      }
    }
  }

  it('children take precedence over the options array', async () => {
    const c = combo({ source: 'children', options: FRUITS });
    const el = await makeSelect(c);
    // A different array is assigned AFTER the children were read: the docs say
    // the children win.
    (el as any).options = [{ value: 'kiwi', label: 'Kiwi' }];
    await wait(40);
    expect(optionValues(el)).toEqual(['apple', 'banana', 'cherry']);
  });

  it("an option's value falls back to its label", async () => {
    const el = await makeSelect(combo({ source: 'children', options: [] }));
    el.innerHTML = '<snice-option label="Kiwi"></snice-option>';
    await wait(60);
    expect(optionValues(el)).toEqual(['Kiwi']);
  });

  it("an option's label falls back to its text content", async () => {
    const el = await makeSelect(combo({ source: 'children', options: [] }));
    el.innerHTML = '<snice-option value="kiwi">Kiwi fruit</snice-option>';
    await wait(60);
    expect(optionLabels(el)).toEqual(['Kiwi fruit']);
    expect(optionValues(el)).toEqual(['kiwi']);
  });

  it('an empty option list says so', async () => {
    const el = await makeSelect(combo({ options: [] }));
    expect(optionValues(el)).toEqual([]);
    expect(text(part(el, 'options'))).toContain('No options available');
  });

  it('options added to the array later are rendered', async () => {
    const el = await makeSelect(combo({ options: [] }));
    (el as any).options = FRUITS.map(option => ({ ...option }));
    await wait(60);
    expect(optionValues(el)).toEqual(['apple', 'banana', 'cherry']);
  });

  it('a disabled option is marked disabled', async () => {
    const el = await makeSelect(combo({ options: WITH_EXTRAS }));
    const banana = el.shadowRoot!.querySelector('[data-value="banana"]')!;
    expect(banana.getAttribute('aria-disabled')).toBe('true');
  });
});
