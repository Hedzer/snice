import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait, triggerMouseEvent } from './test-utils';
import '../../components/radio/snice-radio';
import type { SniceRadioElement } from '../../components/radio/snice-radio.types';

describe('snice-radio', () => {
  let radio: SniceRadioElement;
  const radios: SniceRadioElement[] = [];

  afterEach(() => {
    if (radio) {
      removeComponent(radio as HTMLElement);
    }
    radios.forEach(r => removeComponent(r as HTMLElement));
    radios.length = 0;
  });

  describe('basic functionality', () => {
    it('should render radio element', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio');

      expect(radio).toBeTruthy();
      expect(radio.tagName).toBe('SNICE-RADIO');
    });

    it('should have default properties', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio');

      expect(radio.checked).toBe(false);
      expect(radio.disabled).toBe(false);
      expect(radio.required).toBe(false);
      expect(radio.invalid).toBe(false);
      expect(radio.size).toBe('medium');
      expect(radio.name).toBe('');
      expect(radio.value).toBe('');
      expect(radio.label).toBe('');
    });

    it('should render internal radio input', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio');
      await wait(10);

      const input = queryShadow(radio as HTMLElement, '.radio-input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('radio');
    });
  });

  describe('checked state', () => {
    it('should be unchecked by default', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio');
      await wait(10);

      expect(radio.checked).toBe(false);

      const input = queryShadow(radio as HTMLElement, '.radio-input') as HTMLInputElement;
      expect(input.checked).toBe(false);
    });

    it('should render as checked when attribute is set', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio', {
        checked: true
      });
      await wait(10);

      expect(radio.checked).toBe(true);

      const input = queryShadow(radio as HTMLElement, '.radio-input') as HTMLInputElement;
      expect(input.checked).toBe(true);
    });

    it('should dispatch radio-change event when checked', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio', {
        value: 'test'
      });
      await wait(10);

      let changeEvent: any = null;
      (radio as HTMLElement).addEventListener('radio-change', (e: Event) => {
        changeEvent = (e as CustomEvent).detail;
      });

      (radio as HTMLElement).click();
      await wait(10);

      expect(changeEvent).toBeTruthy();
      expect(changeEvent.checked).toBe(true);
      expect(changeEvent.value).toBe('test');
    });
  });

  describe('radio grouping - single selection', () => {
    it('should allow only one radio to be checked in a group when set programmatically', async () => {
      // Create 3 radios with the same name
      const radio1 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'test-group',
        value: 'option1'
      });
      const radio2 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'test-group',
        value: 'option2'
      });
      const radio3 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'test-group',
        value: 'option3'
      });
      radios.push(radio1, radio2, radio3);
      await wait(10);

      // Set first radio to checked
      radio1.checked = true;
      await wait(10);

      expect(radio1.checked).toBe(true);
      expect(radio2.checked).toBe(false);
      expect(radio3.checked).toBe(false);

      // Set second radio to checked
      radio2.checked = true;
      await wait(10);

      expect(radio1.checked).toBe(false);
      expect(radio2.checked).toBe(true);
      expect(radio3.checked).toBe(false);

      // Set third radio to checked
      radio3.checked = true;
      await wait(10);

      expect(radio1.checked).toBe(false);
      expect(radio2.checked).toBe(false);
      expect(radio3.checked).toBe(true);
    });

    it('should allow only one radio to be checked in a group when clicked', async () => {
      // Create 3 radios with the same name
      const radio1 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'click-group',
        value: 'option1'
      });
      const radio2 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'click-group',
        value: 'option2'
      });
      const radio3 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'click-group',
        value: 'option3'
      });
      radios.push(radio1, radio2, radio3);
      await wait(10);

      // Click first radio
      (radio1 as HTMLElement).click();
      await wait(10);

      expect(radio1.checked).toBe(true);
      expect(radio2.checked).toBe(false);
      expect(radio3.checked).toBe(false);

      // Click second radio
      (radio2 as HTMLElement).click();
      await wait(10);

      expect(radio1.checked).toBe(false);
      expect(radio2.checked).toBe(true);
      expect(radio3.checked).toBe(false);

      // Click third radio
      (radio3 as HTMLElement).click();
      await wait(10);

      expect(radio1.checked).toBe(false);
      expect(radio2.checked).toBe(false);
      expect(radio3.checked).toBe(true);
    });

    it('should maintain only one checked radio when rapidly setting multiple radios', async () => {
      // Create 4 radios with the same name
      const radio1 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'rapid-group',
        value: 'option1'
      });
      const radio2 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'rapid-group',
        value: 'option2'
      });
      const radio3 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'rapid-group',
        value: 'option3'
      });
      const radio4 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'rapid-group',
        value: 'option4'
      });
      radios.push(radio1, radio2, radio3, radio4);
      await wait(10);

      // Rapidly set multiple radios to checked
      radio1.checked = true;
      radio2.checked = true;
      radio3.checked = true;
      await wait(10);

      // Count how many are checked
      const checkedCount = [radio1, radio2, radio3, radio4].filter(r => r.checked).length;
      expect(checkedCount).toBe(1);

      // Last one set should be checked
      expect(radio3.checked).toBe(true);
    });

    it('should not affect radios in different groups', async () => {
      // Create radios in two different groups
      const group1Radio1 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'group1',
        value: 'a'
      });
      const group1Radio2 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'group1',
        value: 'b'
      });
      const group2Radio1 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'group2',
        value: 'x'
      });
      const group2Radio2 = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'group2',
        value: 'y'
      });
      radios.push(group1Radio1, group1Radio2, group2Radio1, group2Radio2);
      await wait(10);

      // Check one radio in each group
      group1Radio1.checked = true;
      group2Radio1.checked = true;
      await wait(10);

      expect(group1Radio1.checked).toBe(true);
      expect(group1Radio2.checked).toBe(false);
      expect(group2Radio1.checked).toBe(true);
      expect(group2Radio2.checked).toBe(false);

      // Check different radio in group1
      group1Radio2.checked = true;
      await wait(10);

      expect(group1Radio1.checked).toBe(false);
      expect(group1Radio2.checked).toBe(true);
      expect(group2Radio1.checked).toBe(true);
      expect(group2Radio2.checked).toBe(false);
    });
  });

  describe('disabled state', () => {
    it('should apply disabled attribute', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio', {
        disabled: true
      });
      await wait(10);

      const input = queryShadow(radio as HTMLElement, '.radio-input') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it('should not be clickable when disabled', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio', {
        disabled: true,
        name: 'disabled-test'
      });
      await wait(10);

      (radio as HTMLElement).click();
      await wait(10);

      expect(radio.checked).toBe(false);
    });

    it('should apply disabled class to wrapper', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio', {
        disabled: true
      });
      await wait(10);

      const wrapper = queryShadow(radio as HTMLElement, '.radio-wrapper');
      expect(wrapper?.classList.contains('radio-wrapper--disabled')).toBe(true);
    });
  });

  describe('required state', () => {
    it('should apply required attribute', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio', {
        required: true
      });
      await wait(10);

      const input = queryShadow(radio as HTMLElement, '.radio-input') as HTMLInputElement;
      expect(input.required).toBe(true);
    });

    it('should show required indicator in label', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio', {
        required: true,
        label: 'Required field'
      });
      await wait(10);

      const labelEl = queryShadow(radio as HTMLElement, '.radio-label');
      expect(labelEl?.classList.contains('radio-label--required')).toBe(true);
    });
  });

  describe('invalid state', () => {
    it('should apply invalid class', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio', {
        invalid: true
      });
      await wait(10);

      const radioEl = queryShadow(radio as HTMLElement, '.radio');
      expect(radioEl?.classList.contains('radio--invalid')).toBe(true);
    });

    it('should set aria-invalid attribute', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio', {
        invalid: true
      });
      await wait(10);

      const input = queryShadow(radio as HTMLElement, '.radio-input') as HTMLInputElement;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        radio = await createComponent<SniceRadioElement>('snice-radio', {
          size
        });
        await wait(10);

        const radioEl = queryShadow(radio as HTMLElement, '.radio');
        expect(radioEl?.classList.contains(`radio--${size}`)).toBe(true);
      });
    });
  });

  describe('label', () => {
    it('should render label when provided', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio', {
        label: 'Select option'
      });
      await wait(10);

      const labelEl = queryShadow(radio as HTMLElement, '.radio-label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent?.trim()).toBe('Select option');
    });

    it('should not render label element when label is empty', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio');
      await wait(10);

      const labelEl = queryShadow(radio as HTMLElement, '.radio-label');
      expect(labelEl).toBeNull();
    });
  });

  describe('form integration', () => {
    it('should set name attribute', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio', {
        name: 'preference'
      });
      await wait(10);

      const input = queryShadow(radio as HTMLElement, '.radio-input') as HTMLInputElement;
      expect(input.name).toBe('preference');
    });

    it('should set value attribute', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio', {
        value: 'yes'
      });
      await wait(10);

      const input = queryShadow(radio as HTMLElement, '.radio-input') as HTMLInputElement;
      expect(input.value).toBe('yes');
    });
  });

  describe('API methods', () => {
    it('should support select method', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio');
      await wait(10);

      if (radio.select) {
        radio.select();
        await wait(10);
        expect(radio.checked).toBe(true);

        // Calling select again should not change anything
        radio.select();
        await wait(10);
        expect(radio.checked).toBe(true);
      }
    });

    it('should support focus method', async () => {
      radio = await createComponent<SniceRadioElement>('snice-radio');
      await wait(10);

      if (radio.focus) {
        radio.focus();
        await wait(10);

        const input = queryShadow(radio as HTMLElement, '.radio-input') as HTMLInputElement;
        expect(document.activeElement).toBe(radio as HTMLElement);
      }
    });
  });
});
