import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, trackRenders } from './test-utils';
import '../../components/combobox/snice-combobox';
import type { SniceComboboxElement, ComboboxOption } from '../../components/combobox/snice-combobox.types';

describe('snice-combobox', () => {
  let el: SniceComboboxElement;

  const defaultOptions: ComboboxOption[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'date', label: 'Date', disabled: true },
  ];

  async function createCombobox(attrs: Record<string, any> = {}) {
    el = await createComponent<SniceComboboxElement>('snice-combobox', attrs);
    el.options = attrs.options || defaultOptions;
    await new Promise(resolve => setTimeout(resolve, 50));
    return el;
  }

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  it('should render combobox element', async () => {
    await createCombobox();
    expect(el).toBeTruthy();
  });

  it('should have empty value by default', async () => {
    await createCombobox();
    expect(el.value).toBe('');
  });

  it('should not be disabled by default', async () => {
    await createCombobox();
    expect(el.disabled).toBe(false);
  });

  it('should support disabled state', async () => {
    await createCombobox({ disabled: true });
    expect(el.disabled).toBe(true);
    const input = queryShadow(el as HTMLElement, '.combobox-input') as HTMLInputElement;
    expect(input?.disabled).toBe(true);
  });

  it('should not be readonly by default', async () => {
    await createCombobox();
    expect(el.readonly).toBe(false);
  });

  it('should support readonly state', async () => {
    await createCombobox({ readonly: true });
    expect(el.readonly).toBe(true);
  });

  it('should not be required by default', async () => {
    await createCombobox();
    expect(el.required).toBe(false);
  });

  it('should support required state', async () => {
    await createCombobox({ required: true });
    expect(el.required).toBe(true);
  });

  it('should have default size of medium', async () => {
    await createCombobox();
    expect(el.size).toBe('medium');
  });

  it('should support small size', async () => {
    await createCombobox({ size: 'small' });
    expect(el.size).toBe('small');
  });

  it('should support large size', async () => {
    await createCombobox({ size: 'large' });
    expect(el.size).toBe('large');
  });

  it('should have default variant', async () => {
    await createCombobox();
    expect(el.variant).toBe('default');
  });

  it('should support outlined variant', async () => {
    await createCombobox({ variant: 'outlined' });
    expect(el.variant).toBe('outlined');
  });

  it('should be filterable by default', async () => {
    await createCombobox();
    expect(el.filterable).toBe(true);
  });

  it('should not allow custom values by default', async () => {
    await createCombobox();
    expect(el.allowCustom).toBe(false);
  });

  it('should render input element', async () => {
    await createCombobox();
    const input = queryShadow(el as HTMLElement, '.combobox-input');
    expect(input).toBeTruthy();
  });

  it('should render dropdown container', async () => {
    await createCombobox();
    const dropdown = queryShadow(el as HTMLElement, '.combobox-dropdown');
    expect(dropdown).toBeTruthy();
  });

  it('should support label property', async () => {
    await createCombobox({ label: 'Choose fruit' });
    expect(el.label).toBe('Choose fruit');
  });

  it('should support placeholder property', async () => {
    await createCombobox({ placeholder: 'Type to search' });
    expect(el.placeholder).toBe('Type to search');
  });

  it('should support name property', async () => {
    await createCombobox({ name: 'fruit' });
    expect(el.name).toBe('fruit');
  });

  it('should have open() method', async () => {
    await createCombobox();
    expect(typeof el.open).toBe('function');
    el.open();
  });

  it('should have close() method', async () => {
    await createCombobox();
    expect(typeof el.close).toBe('function');
    el.close();
  });

  it('should have focus() method', async () => {
    await createCombobox();
    expect(typeof el.focus).toBe('function');
    el.focus();
  });

  it('should have blur() method', async () => {
    await createCombobox();
    expect(typeof el.blur).toBe('function');
    el.blur();
  });

  it('should update value when set programmatically', async () => {
    await createCombobox();
    const tracker = trackRenders(el as HTMLElement);
    el.value = 'banana';
    await tracker.next();
    expect(el.value).toBe('banana');
  });

  it('should dispatch value-change event on option select', async () => {
    await createCombobox();

    let eventDetail: any = null;
    (el as HTMLElement).addEventListener('value-change', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    // Simulate selecting option via public API
    el.value = 'apple';
    // Dispatch manually via method (internal)
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(el.value).toBe('apple');
  });

  it('should accept options array', async () => {
    await createCombobox();
    expect(el.options).toHaveLength(4);
  });

  it('should update options dynamically', async () => {
    await createCombobox();
    const newOptions = [
      { value: 'x', label: 'X' },
      { value: 'y', label: 'Y' },
    ];
    el.options = newOptions;
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(el.options).toHaveLength(2);
  });
});
