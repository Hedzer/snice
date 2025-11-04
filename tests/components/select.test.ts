import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, trackRenders } from './test-utils';
import '../../components/select/snice-select';
import '../../components/select/snice-option';
import type { SniceSelectElement } from '../../components/select/snice-select.types';

describe('snice-select', () => {
  let container: HTMLElement;

  afterEach(() => {
    if (container) {
      removeComponent(container);
    }
  });

  // Helper to create a select with options
  async function createSelectWithOptions(options: {
    optionCount?: number;
    selected?: number;
    multiple?: boolean;
    searchable?: boolean;
    clearable?: boolean;
    disabled?: boolean;
  } = {}) {
    const { optionCount = 3, selected, multiple = false, searchable = false, clearable = false, disabled = false } = options;

    container = document.createElement('div');
    document.body.appendChild(container);

    const select = document.createElement('snice-select') as SniceSelectElement;
    if (multiple) select.multiple = true;
    if (searchable) select.searchable = true;
    if (clearable) select.clearable = true;
    if (disabled) select.disabled = disabled;

    for (let i = 0; i < optionCount; i++) {
      const option = document.createElement('snice-option');
      option.setAttribute('value', `option${i + 1}`);
      option.setAttribute('label', `Option ${i + 1}`);
      if (selected === i) option.setAttribute('selected', '');
      select.appendChild(option);
    }

    container.appendChild(select);
    await select.ready;

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 50));

    return select;
  }

  it('should render select element', async () => {
    const select = await createSelectWithOptions();
    expect(select).toBeTruthy();
  });

  it('should have empty value by default', async () => {
    const select = await createSelectWithOptions();
    expect(select.value).toBe('');
  });

  it('should not be disabled by default', async () => {
    const select = await createSelectWithOptions();
    expect(select.disabled).toBe(false);
  });

  it('should support disabled state', async () => {
    const select = await createSelectWithOptions();
    const tracker = trackRenders(select as HTMLElement);

    select.disabled = true;
    await tracker.next();

    expect(select.disabled).toBe(true);

    const trigger = queryShadow(select as HTMLElement, '.select-trigger') as HTMLButtonElement;
    expect(trigger?.classList.contains('select-trigger--disabled')).toBe(true);
  });

  it('should not be required by default', async () => {
    const select = await createSelectWithOptions();
    expect(select.required).toBe(false);
  });

  it('should support required state', async () => {
    const select = await createComponent<SniceSelectElement>('snice-select', { required: true });
    expect(select.required).toBe(true);
  });

  it('should not be invalid by default', async () => {
    const select = await createSelectWithOptions();
    expect(select.invalid).toBe(false);
  });

  it('should support invalid state', async () => {
    const select = await createComponent<SniceSelectElement>('snice-select', { invalid: true });
    expect(select.invalid).toBe(true);
  });

  it('should not be readonly by default', async () => {
    const select = await createSelectWithOptions();
    expect(select.readonly).toBe(false);
  });

  it('should support readonly state', async () => {
    const select = await createComponent<SniceSelectElement>('snice-select', { readonly: true });
    expect(select.readonly).toBe(true);
  });

  it('should not be multiple by default', async () => {
    const select = await createSelectWithOptions();
    expect(select.multiple).toBe(false);
  });

  it('should support multiple selection', async () => {
    const select = await createSelectWithOptions({ multiple: true });
    expect(select.multiple).toBe(true);
  });

  it('should not be searchable by default', async () => {
    const select = await createSelectWithOptions();
    expect(select.searchable).toBe(false);
  });

  it('should support searchable state', async () => {
    const select = await createSelectWithOptions({ searchable: true });
    expect(select.searchable).toBe(true);

    select.open = true;
    await new Promise(resolve => setTimeout(resolve, 50));

    const searchContainer = queryShadow(select as HTMLElement, '.select-search');
    expect(searchContainer?.hasAttribute('hidden')).toBe(false);

    // Test non-searchable
    const select2 = await createComponent<SniceSelectElement>('snice-select');
    select2.open = true;
    await new Promise(resolve => setTimeout(resolve, 50));

    const searchContainer2 = queryShadow(select2 as HTMLElement, '.select-search');
    expect(searchContainer2?.hasAttribute('hidden')).toBe(true);
  });

  it('should not be clearable by default', async () => {
    const select = await createSelectWithOptions();
    expect(select.clearable).toBe(false);
  });

  it('should support clearable state', async () => {
    const select = await createSelectWithOptions({ clearable: true });
    expect(select.clearable).toBe(true);
  });

  it('should be closed by default', async () => {
    const select = await createSelectWithOptions();
    expect(select.open).toBe(false);
  });

  it('should have default size of medium', async () => {
    const select = await createSelectWithOptions();
    expect(select.size).toBe('medium');
  });

  it('should support small size', async () => {
    const select = await createComponent<SniceSelectElement>('snice-select', { size: 'small' });
    expect(select.size).toBe('small');
  });

  it('should support large size', async () => {
    const select = await createComponent<SniceSelectElement>('snice-select', { size: 'large' });
    expect(select.size).toBe('large');
  });

  it('should support name attribute', async () => {
    const select = await createComponent<SniceSelectElement>('snice-select', { name: 'myselect' });
    expect(select.name).toBe('myselect');
  });

  it('should support label property', async () => {
    const select = await createComponent<SniceSelectElement>('snice-select', { label: 'Choose option' });
    expect(select.label).toBe('Choose option');
  });

  it('should support placeholder property', async () => {
    const select = await createComponent<SniceSelectElement>('snice-select', { placeholder: 'Pick one' });
    expect(select.placeholder).toBe('Pick one');
  });

  it('should render trigger button', async () => {
    const select = await createSelectWithOptions();

    const trigger = queryShadow(select as HTMLElement, '.select-trigger');
    expect(trigger).toBeTruthy();
  });

  it('should render dropdown container', async () => {
    const select = await createSelectWithOptions();

    const dropdown = queryShadow(select as HTMLElement, '.select-dropdown');
    expect(dropdown).toBeTruthy();
  });

  it('should open dropdown when trigger clicked', async () => {
    const select = await createSelectWithOptions();

    expect(select.open).toBe(false);

    const trigger = queryShadow(select as HTMLElement, '.select-trigger') as HTMLButtonElement;
    trigger.click();

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(select.open).toBe(true);
  });

  it('should close dropdown when trigger clicked again', async () => {
    const select = await createSelectWithOptions();

    const trigger = queryShadow(select as HTMLElement, '.select-trigger') as HTMLButtonElement;

    trigger.click();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(select.open).toBe(true);

    trigger.click();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(select.open).toBe(false);
  });

  it('should dispatch select-change event when option selected', async () => {
    const select = await createSelectWithOptions({ optionCount: 3 });

    let eventDetail: any = null;
    (select as HTMLElement).addEventListener('select-change', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    select.selectOption('option2');
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.value).toBe('option2');
  });

  it('should update value when option selected', async () => {
    const select = await createSelectWithOptions({ optionCount: 3 });

    select.selectOption('option2');
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(select.value).toBe('option2');
  });

  it('should close dropdown after selecting option in single mode', async () => {
    const select = await createSelectWithOptions({ optionCount: 3 });

    select.open = true;
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(select.open).toBe(true);

    select.selectOption('option1');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(select.open).toBe(false);
  });

  it('should keep dropdown open in multiple mode', async () => {
    const select = await createSelectWithOptions({ optionCount: 3, multiple: true });

    select.open = true;
    await new Promise(resolve => setTimeout(resolve, 50));

    select.selectOption('option1');
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(select.open).toBe(true);
  });

  it('should support multiple selection values', async () => {
    const select = await createSelectWithOptions({ optionCount: 3, multiple: true });

    select.selectOption('option1');
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(select.value).toBe('option1');

    select.selectOption('option2');
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(select.value).toBe('option1,option2');
  });

  it('should deselect option when clicked again in multiple mode', async () => {
    const select = await createSelectWithOptions({ optionCount: 3, multiple: true });

    select.selectOption('option1');
    select.selectOption('option2');
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(select.value).toBe('option1,option2');

    select.selectOption('option1');
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(select.value).toBe('option2');
  });

  it('should have clear() method', async () => {
    const select = await createSelectWithOptions({ optionCount: 3 });

    select.selectOption('option1');
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(select.value).toBe('option1');

    select.clear();
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(select.value).toBe('');
  });

  it('should have openDropdown() method', async () => {
    const select = await createSelectWithOptions();

    expect(select.open).toBe(false);
    select.openDropdown();
    expect(select.open).toBe(true);
  });

  it('should have closeDropdown() method', async () => {
    const select = await createSelectWithOptions();

    select.open = true;
    expect(select.open).toBe(true);

    select.closeDropdown();
    expect(select.open).toBe(false);
  });

  it('should have toggleDropdown() method', async () => {
    const select = await createSelectWithOptions();

    expect(select.open).toBe(false);
    select.toggleDropdown();
    expect(select.open).toBe(true);

    select.toggleDropdown();
    expect(select.open).toBe(false);
  });

  it('should have focus() method', async () => {
    const select = await createSelectWithOptions();

    expect(typeof select.focus).toBe('function');
    select.focus(); // Should not throw
  });

  it('should have blur() method', async () => {
    const select = await createSelectWithOptions();

    expect(typeof select.blur).toBe('function');
    select.blur(); // Should not throw
  });

  it('should dispatch select-open event when opened', async () => {
    const select = await createSelectWithOptions();

    let eventFired = false;
    (select as HTMLElement).addEventListener('select-open', () => {
      eventFired = true;
    });

    select.openDropdown();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(eventFired).toBe(true);
  });

  it('should dispatch select-close event when closed', async () => {
    const select = await createSelectWithOptions();

    let eventFired = false;
    (select as HTMLElement).addEventListener('select-close', () => {
      eventFired = true;
    });

    select.open = true;
    await new Promise(resolve => setTimeout(resolve, 10));

    select.closeDropdown();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(eventFired).toBe(true);
  });

  it('should not open when disabled', async () => {
    const select = await createSelectWithOptions({ disabled: true });

    select.openDropdown();
    expect(select.open).toBe(false);
  });

  it('should not open when readonly', async () => {
    const select = await createComponent<SniceSelectElement>('snice-select', { readonly: true });

    select.openDropdown();
    expect(select.open).toBe(false);
  });

  it('should update value dynamically', async () => {
    const select = await createSelectWithOptions({ optionCount: 3 });
    const tracker = trackRenders(select as HTMLElement);

    select.value = 'option2';
    await tracker.next();

    expect(select.value).toBe('option2');
  });

  it('should close dropdown when disabled is set to true', async () => {
    const select = await createSelectWithOptions();
    const tracker = trackRenders(select as HTMLElement);

    select.open = true;
    await tracker.next();
    expect(select.open).toBe(true);

    select.disabled = true;
    await tracker.next();

    expect(select.open).toBe(false);
  });
});

describe('snice-option', () => {
  let option: any;

  afterEach(() => {
    if (option) {
      removeComponent(option as HTMLElement);
    }
  });

  it('should render option element', async () => {
    option = await createComponent('snice-option');
    expect(option).toBeTruthy();
  });

  it('should have empty value by default', async () => {
    option = await createComponent('snice-option');
    expect(option.value).toBe('');
  });

  it('should support value attribute', async () => {
    option = await createComponent('snice-option', { value: 'test' });
    expect(option.value).toBe('test');
  });

  it('should have empty label by default', async () => {
    option = await createComponent('snice-option');
    expect(option.label).toBe('');
  });

  it('should support label attribute', async () => {
    option = await createComponent('snice-option', { label: 'Test Option' });
    expect(option.label).toBe('Test Option');
  });

  it('should not be disabled by default', async () => {
    option = await createComponent('snice-option');
    expect(option.disabled).toBe(false);
  });

  it('should support disabled attribute', async () => {
    option = await createComponent('snice-option', { disabled: true });
    expect(option.disabled).toBe(true);
  });

  it('should not be selected by default', async () => {
    option = await createComponent('snice-option');
    expect(option.selected).toBe(false);
  });

  it('should support selected attribute', async () => {
    option = await createComponent('snice-option', { selected: true });
    expect(option.selected).toBe(true);
  });

  it('should support icon property', async () => {
    option = await createComponent('snice-option', { icon: 'icon.png' });
    expect(option.icon).toBe('icon.png');
  });

  it('should use text content as label when label is empty', async () => {
    option = document.createElement('snice-option');
    option.textContent = 'Text Content';
    document.body.appendChild(option);
    await option.ready;

    expect(option.label).toBe('Text Content');
  });

  it('should use label as value when value is empty', async () => {
    option = document.createElement('snice-option');
    option.setAttribute('label', 'My Label');
    document.body.appendChild(option);
    await option.ready;

    expect(option.value).toBe('My Label');
  });

  it('should have optionData getter', async () => {
    option = await createComponent('snice-option', {
      value: 'test',
      label: 'Test',
      disabled: true,
      selected: true
    });

    const data = option.optionData;
    expect(data.value).toBe('test');
    expect(data.label).toBe('Test');
    expect(data.disabled).toBe(true);
    expect(data.selected).toBe(true);
  });
});
