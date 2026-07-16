import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/color-picker/snice-color-picker';
import type { SniceColorPickerElement } from '../../packages/components/src/color-picker/snice-color-picker.types';

describe('snice-color-picker', () => {
  let colorPicker: SniceColorPickerElement;
  const settle = async () => {
    await (colorPicker as any).rendered;
    await Promise.resolve();
  };

  afterEach(() => {
    if (colorPicker && (colorPicker as HTMLElement).isConnected) {
      removeComponent(colorPicker as HTMLElement);
    }
    document.querySelectorAll('[data-color-label-test]').forEach(element => element.remove());
  });

  describe('basic functionality', () => {
    it('should render color picker element', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      expect(colorPicker).toBeTruthy();
      expect(colorPicker.tagName).toBe('SNICE-COLOR-PICKER');
    });

    it('should have default properties', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      expect(colorPicker.size).toBe('medium');
      expect(colorPicker.value).toBe('#000000');
      expect(colorPicker.format).toBe('hex');
      expect(colorPicker.disabled).toBe(false);
      expect(colorPicker.required).toBe(false);
      expect(colorPicker.invalid).toBe(false);
      expect(colorPicker.showInput).toBe(true);
      expect(colorPicker.showPresets).toBe(false);
    });

    it('should render color swatch', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      const swatch = queryShadow(colorPicker as HTMLElement, '.color-swatch');
      expect(swatch).toBeTruthy();
    });

    it('should render color input when showInput is true', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input');
      expect(input).toBeTruthy();
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
          size
        });
        await wait(50);

        const swatch = queryShadow(colorPicker as HTMLElement, '.color-swatch');
        expect(swatch?.classList.contains(`color-swatch--${size}`)).toBe(true);
      });
    });
  });

  describe('value', () => {
    it('should set initial value', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        value: '#ff0000'
      });
      await wait(50);

      expect(colorPicker.value).toBe('#ff0000');
    });

    it('should update value dynamically', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      colorPicker.value = '#00ff00';

      expect(colorPicker.value).toBe('#00ff00');
    });
  });

  describe('formats', () => {
    it('should support hex format', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        value: '#ff0000',
        format: 'hex'
      });
      await wait(50);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input') as HTMLInputElement;
      expect(input?.value).toBe('#ff0000');
    });

    it('should support rgb format', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        value: '#ff0000',
        format: 'rgb'
      });
      await wait(50);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input') as HTMLInputElement;
      expect(input?.value).toBe('rgb(255, 0, 0)');
    });

    it('should support hsl format', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        value: '#ff0000',
        format: 'hsl'
      });
      await wait(50);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input') as HTMLInputElement;
      expect(input?.value).toBe('hsl(0, 100%, 50%)');
    });
  });

  describe('label', () => {
    it('should render label when provided', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        label: 'Choose Color'
      });
      await wait(50);

      const labelEl = queryShadow(colorPicker as HTMLElement, '.label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent).toContain('Choose Color');
    });

    it('should show required indicator', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        label: 'Color',
        required: true
      });
      await wait(50);

      const labelEl = queryShadow(colorPicker as HTMLElement, '.label');
      expect(labelEl?.classList.contains('label--required')).toBe(true);
    });
  });

  describe('external label and coherent control naming lifecycle', () => {
    it('names one text field plus distinct chooser and preset affordances from every associated label', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        id: 'labelled-color-picker',
        label: 'Internal fallback',
        'helper-text': 'Use an approved brand color.',
        'show-presets': true
      });
      const primary = document.createElement('label');
      primary.dataset.colorLabelTest = 'true';
      primary.htmlFor = colorPicker.id;
      primary.textContent = 'Brand color';
      const secondary = document.createElement('label');
      secondary.dataset.colorLabelTest = 'true';
      secondary.htmlFor = colorPicker.id;
      secondary.textContent = 'required';
      colorPicker.before(primary, secondary);
      (colorPicker as any).labelAssociation.sync();
      await settle();

      const input = queryShadow<HTMLInputElement>(colorPicker as HTMLElement, '.color-input')!;
      const swatch = queryShadow<HTMLElement>(colorPicker as HTMLElement, '.color-swatch')!;
      const native = queryShadow<HTMLInputElement>(colorPicker as HTMLElement, '.native-input')!;
      const firstPreset = queryShadow<HTMLElement>(colorPicker as HTMLElement, '[data-color]')!;
      const descriptionId = input.getAttribute('aria-describedby')!;
      expect(Array.from(colorPicker.labels || [], label => label.textContent)).toEqual(['Brand color', 'required']);
      expect(input.getAttribute('aria-label')).toBe('Brand color required');
      expect(swatch.getAttribute('aria-label')).toBe('Brand color required color chooser');
      expect(firstPreset.getAttribute('aria-label')).toBe(`Set Brand color required to ${firstPreset.dataset.color}`);
      expect(native.hasAttribute('name')).toBe(false);
      expect(native.getAttribute('aria-hidden')).toBe('true');
      expect(queryShadow(colorPicker as HTMLElement, `#${descriptionId}`)?.textContent)
        .toBe('Use an approved brand color.');
      expect(colorPicker.shadowRoot?.querySelectorAll(`#${descriptionId}`)).toHaveLength(1);
    });

    it('focuses explicit and wrapping labels on the visible text field', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        id: 'focus-color-picker'
      });
      const explicit = document.createElement('label');
      explicit.dataset.colorLabelTest = 'true';
      explicit.htmlFor = colorPicker.id;
      explicit.textContent = 'Accent color';
      colorPicker.before(explicit);
      (colorPicker as any).labelAssociation.sync();
      explicit.click();
      expect(colorPicker.shadowRoot?.activeElement)
        .toBe(queryShadow(colorPicker as HTMLElement, '.color-input'));

      const wrapping = document.createElement('label');
      wrapping.dataset.colorLabelTest = 'true';
      wrapping.textContent = 'Wrapped color';
      colorPicker.replaceWith(wrapping);
      wrapping.appendChild(colorPicker as HTMLElement);
      colorPicker.removeAttribute('id');
      (colorPicker as any).labelAssociation.sync();
      queryShadow<HTMLInputElement>(colorPicker as HTMLElement, '.color-input')!.blur();
      wrapping.click();
      expect(colorPicker.shadowRoot?.activeElement)
        .toBe(queryShadow(colorPicker as HTMLElement, '.color-input'));
    });

    it('uses the swatch as the single primary target when the text field is hidden', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        id: 'swatch-only-color-picker',
        'show-input': false,
        'helper-text': 'Open the native chooser.'
      });
      const label = document.createElement('label');
      label.dataset.colorLabelTest = 'true';
      label.htmlFor = colorPicker.id;
      label.textContent = 'Swatch color';
      colorPicker.before(label);
      (colorPicker as any).labelAssociation.sync();
      await settle();

      label.click();
      const swatch = queryShadow<HTMLElement>(colorPicker as HTMLElement, '.color-swatch')!;
      expect(colorPicker.shadowRoot?.activeElement).toBe(swatch);
      expect(swatch.getAttribute('aria-label')).toBe('Swatch color');
      expect(swatch.getAttribute('aria-describedby')).toMatch(/^snice-color-picker-desc-/);
      expect(queryShadow(colorPicker as HTMLElement, '.color-input')).toBeNull();
    });

    it('updates all related names and replaces helper text with one live error description', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        id: 'dynamic-color-picker',
        'helper-text': 'Initial help',
        'show-presets': true
      });
      const label = document.createElement('label');
      label.dataset.colorLabelTest = 'true';
      label.htmlFor = colorPicker.id;
      label.textContent = 'Surface';
      colorPicker.before(label);
      (colorPicker as any).labelAssociation.sync();

      label.textContent = 'Revised surface color';
      colorPicker.invalid = true;
      colorPicker.errorText = 'This color does not meet contrast requirements.';
      await settle();
      (colorPicker as any).labelAssociation.sync();

      const input = queryShadow<HTMLInputElement>(colorPicker as HTMLElement, '.color-input')!;
      const descriptionId = input.getAttribute('aria-describedby')!;
      expect(input.getAttribute('aria-label')).toBe('Revised surface color');
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(queryShadow(colorPicker as HTMLElement, '.color-swatch')?.getAttribute('aria-label'))
        .toBe('Revised surface color color chooser');
      expect(queryShadow(colorPicker as HTMLElement, '[data-color]')?.getAttribute('aria-label'))
        .toContain('Set Revised surface color to');
      expect(queryShadow(colorPicker as HTMLElement, `#${descriptionId}`)?.textContent)
        .toBe('This color does not meet contrast requirements.');
      expect(queryShadow(colorPicker as HTMLElement, `#${descriptionId}`)?.getAttribute('role')).toBe('alert');
      expect(queryShadow(colorPicker as HTMLElement, '.helper-text')).toBeNull();
    });

    it.each(['disabled', 'loading', 'fieldset'] as const)('keeps %s label activation and every chooser path inert', async state => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        id: `blocked-color-picker-${state}`,
        'show-input': false,
        'show-presets': true
      });
      const label = document.createElement('label');
      label.dataset.colorLabelTest = 'true';
      label.htmlFor = colorPicker.id;
      label.textContent = 'Blocked color';
      colorPicker.before(label);
      if (state === 'fieldset') (colorPicker as any).formDisabledCallback(true);
      else (colorPicker as any)[state] = true;
      await settle();
      (colorPicker as any).labelAssociation.sync();
      const native = queryShadow<HTMLInputElement>(colorPicker as HTMLElement, '.native-input')!;
      let nativeClicks = 0;
      native.addEventListener('click', () => nativeClicks++);

      label.click();
      colorPicker.focus();
      queryShadow<HTMLElement>(colorPicker as HTMLElement, '.color-swatch')!.click();
      queryShadow<HTMLElement>(colorPicker as HTMLElement, '[data-color]')!.click();

      expect(colorPicker.shadowRoot?.activeElement).toBeNull();
      expect(nativeClicks).toBe(0);
      expect(native.disabled).toBe(true);
      expect(colorPicker.value).toBe('#000000');
      if (state === 'fieldset') {
        expect(colorPicker.disabled).toBe(false);
        expect(colorPicker.hasAttribute('disabled')).toBe(false);
      }
    });

    it('rebinds labels after a move and reconnect without duplicating activation', async () => {
      const first = document.createElement('div');
      const second = document.createElement('div');
      first.dataset.colorLabelTest = 'true';
      second.dataset.colorLabelTest = 'true';
      document.body.append(first, second);
      colorPicker = document.createElement('snice-color-picker') as SniceColorPickerElement;
      colorPicker.id = 'moved-color-picker';
      const label = document.createElement('label');
      label.dataset.colorLabelTest = 'true';
      label.htmlFor = colorPicker.id;
      label.textContent = 'Moved color';
      first.append(label, colorPicker as HTMLElement);
      await (colorPicker as any).ready;

      second.append(label, colorPicker as HTMLElement);
      await settle();
      (colorPicker as any).labelAssociation.sync();
      label.click();

      expect(colorPicker.shadowRoot?.activeElement)
        .toBe(queryShadow(colorPicker as HTMLElement, '.color-input'));
      expect(Array.from(colorPicker.labels || [])).toEqual([label]);
    });
  });

  describe('helper and error text', () => {
    it('should show helper text', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        'helper-text': 'Select a color'
      });
      await wait(50);

      const helperEl = queryShadow(colorPicker as HTMLElement, '.helper-text');
      expect(helperEl?.textContent).toContain('Select a color');
    });

    it('should show error text', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        'error-text': 'Invalid color'
      });
      await wait(50);

      const errorEl = queryShadow(colorPicker as HTMLElement, '.error-text');
      expect(errorEl?.textContent).toContain('Invalid color');
    });
  });

  describe('states', () => {
    it('should apply disabled state', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        disabled: true
      });
      await wait(50);

      const swatch = queryShadow(colorPicker as HTMLElement, '.color-swatch');
      expect(swatch?.classList.contains('color-swatch--disabled')).toBe(true);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input') as HTMLInputElement;
      expect(input?.disabled).toBe(true);
    });

    it('should apply invalid class', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        invalid: true
      });
      await wait(50);

      const swatch = queryShadow(colorPicker as HTMLElement, '.color-swatch');
      expect(swatch?.classList.contains('color-swatch--invalid')).toBe(true);
    });
  });

  describe('show input', () => {
    it('should show input by default', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input');
      expect(input).toBeTruthy();
    });

    it('should hide input when showInput is false', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        'show-input': false
      });
      await wait(50);

      const input = queryShadow(colorPicker as HTMLElement, '.color-input');
      expect(input).toBeFalsy();
    });
  });

  describe('presets', () => {
    it('should not show presets by default', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      const presets = queryShadow(colorPicker as HTMLElement, '.presets');
      expect(presets).toBeFalsy();
    });

    it('should show presets when showPresets is true', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker', {
        'show-presets': true
      });
      await wait(50);

      const presets = queryShadow(colorPicker as HTMLElement, '.presets');
      expect(presets).toBeTruthy();
    });
  });

  describe('API methods', () => {
    it('should support focus method', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      expect(() => colorPicker.focus()).not.toThrow();
    });

    it('should support blur method', async () => {
      colorPicker = await createComponent<SniceColorPickerElement>('snice-color-picker');
      await wait(50);

      expect(() => colorPicker.blur()).not.toThrow();
    });
  });
});
