import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/time-picker/snice-time-picker';
import type { SniceTimePickerElement } from '../../components/time-picker/snice-time-picker.types';

describe('snice-time-picker', () => {
  let picker: SniceTimePickerElement;

  afterEach(() => {
    if (picker) {
      removeComponent(picker as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render time-picker element', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');

      expect(picker).toBeTruthy();
      expect(picker.tagName).toBe('SNICE-TIME-PICKER');
    });

    it('should have default properties', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');

      expect(picker.value).toBe('');
      expect(picker.format).toBe('24h');
      expect(picker.step).toBe(15);
      expect(picker.showSeconds).toBe(false);
      expect(picker.disabled).toBe(false);
      expect(picker.readonly).toBe(false);
      expect(picker.required).toBe(false);
      expect(picker.invalid).toBe(false);
      expect(picker.variant).toBe('dropdown');
    });

    it('should render internal input element', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      await wait(50);

      const inputEl = queryShadow(picker as HTMLElement, '.input');
      expect(inputEl).toBeTruthy();
      expect(inputEl?.tagName).toBe('INPUT');
    });

    it('should render clock toggle button', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      await wait(50);

      const toggleBtn = queryShadow(picker as HTMLElement, '.clock-toggle');
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn?.tagName).toBe('BUTTON');
    });
  });

  describe('value handling', () => {
    it('should accept HH:MM value', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '14:30'
      });
      await wait(50);

      expect(picker.value).toBe('14:30');
      const inputEl = queryShadow(picker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.value).toBe('14:30');
    });

    it('should accept HH:MM:SS value when show-seconds enabled', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '14:30:45',
        'show-seconds': true
      });
      await wait(50);

      expect(picker.value).toBe('14:30:45');
    });

    it('should format time in 12h format', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '14:30',
        format: '12h'
      });
      await wait(50);

      const inputEl = queryShadow(picker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.value).toBe('2:30 PM');
    });

    it('should format midnight in 12h format', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '00:00',
        format: '12h'
      });
      await wait(50);

      const inputEl = queryShadow(picker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.value).toBe('12:00 AM');
    });

    it('should format noon in 12h format', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '12:00',
        format: '12h'
      });
      await wait(50);

      const inputEl = queryShadow(picker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.value).toBe('12:00 PM');
    });
  });

  describe('step', () => {
    it('should accept step property', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        step: 5
      });

      expect(picker.step).toBe(5);
    });

    it('should accept 30-minute step', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        step: 30
      });

      expect(picker.step).toBe(30);
    });
  });

  describe('disabled state', () => {
    it('should apply disabled attribute to input', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        disabled: true
      });
      await wait(50);

      const inputEl = queryShadow(picker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.disabled).toBe(true);
    });

    it('should disable clock toggle button', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        disabled: true
      });
      await wait(50);

      const toggleBtn = queryShadow(picker as HTMLElement, '.clock-toggle') as HTMLButtonElement;
      expect(toggleBtn?.disabled).toBe(true);
    });
  });

  describe('readonly state', () => {
    it('should apply readonly attribute to input', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        readonly: true
      });
      await wait(50);

      const inputEl = queryShadow(picker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.readOnly).toBe(true);
    });
  });

  describe('required state', () => {
    it('should show required indicator on label', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        label: 'Time',
        required: true
      });
      await wait(50);

      const labelEl = queryShadow(picker as HTMLElement, '.label');
      expect(labelEl?.classList.contains('label--required')).toBe(true);
    });
  });

  describe('dropdown functionality', () => {
    it('should open dropdown when toggle button clicked', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      await wait(50);

      const toggleBtn = queryShadow(picker as HTMLElement, '.clock-toggle') as HTMLButtonElement;
      toggleBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(10);

      const dropdown = queryShadow(picker as HTMLElement, '.dropdown');
      expect(dropdown?.hasAttribute('hidden')).toBe(false);
    });

    it('should close dropdown when close method called', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      await wait(50);

      picker.open();
      picker.close();

      const dropdown = queryShadow(picker as HTMLElement, '.dropdown');
      expect(dropdown?.hasAttribute('hidden')).toBe(true);
    });

    it('should render hour and minute selector columns', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      await wait(50);

      picker.open();
      await wait(10);

      const columns = picker.shadowRoot?.querySelectorAll('.selector-column');
      expect(columns?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('inline variant', () => {
    it('should render inline dropdown', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        variant: 'inline'
      });
      await wait(50);

      const dropdown = queryShadow(picker as HTMLElement, '.dropdown');
      expect(dropdown?.classList.contains('dropdown--inline')).toBe(true);
    });

    it('should not render input for inline variant', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        variant: 'inline'
      });
      await wait(50);

      const inputEl = queryShadow(picker as HTMLElement, '.input');
      expect(inputEl).toBeNull();
    });
  });

  describe('events', () => {
    it('should dispatch time-change event', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      await wait(50);

      let changeDetail: any = null;
      (picker as HTMLElement).addEventListener('time-change', (e: Event) => {
        changeDetail = (e as CustomEvent).detail;
      });

      picker.value = '10:30';
      // Trigger internal update by opening/clicking
      picker.open();
      await wait(10);

      const hourBtn = picker.shadowRoot?.querySelector('[data-hour="10"]') as HTMLButtonElement;
      if (hourBtn) {
        hourBtn.click();
        await wait(10);
        expect(changeDetail).toBeTruthy();
      }
    });

    it('should dispatch open event', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      await wait(50);

      let openFired = false;
      (picker as HTMLElement).addEventListener('timepicker-open', () => {
        openFired = true;
      });

      picker.open();
      expect(openFired).toBe(true);
    });

    it('should dispatch close event', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      await wait(50);

      let closeFired = false;
      (picker as HTMLElement).addEventListener('timepicker-close', () => {
        closeFired = true;
      });

      picker.open();
      picker.close();
      expect(closeFired).toBe(true);
    });
  });

  describe('label and helper text', () => {
    it('should render label', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        label: 'Start Time'
      });
      await wait(50);

      const labelEl = queryShadow(picker as HTMLElement, '.label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent).toContain('Start Time');
    });

    it('should render helper text', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        'helper-text': 'Select a time'
      });
      await wait(50);

      const helperEl = queryShadow(picker as HTMLElement, '.helper-text');
      expect(helperEl).toBeTruthy();
      expect(helperEl?.textContent).toContain('Select a time');
    });

    it('should render error text', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        'error-text': 'Invalid time'
      });
      await wait(50);

      const errorEl = queryShadow(picker as HTMLElement, '.error-text');
      expect(errorEl).toBeTruthy();
      expect(errorEl?.textContent).toContain('Invalid time');
    });
  });

  describe('API methods', () => {
    it('should support focus method', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      expect(() => picker.focus()).not.toThrow();
    });

    it('should support blur method', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      expect(() => picker.blur()).not.toThrow();
    });

    it('should support open method', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      await wait(50);

      picker.open();
      const dropdown = queryShadow(picker as HTMLElement, '.dropdown');
      expect(dropdown?.hasAttribute('hidden')).toBe(false);
    });

    it('should support close method', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      await wait(50);

      picker.open();
      picker.close();
      const dropdown = queryShadow(picker as HTMLElement, '.dropdown');
      expect(dropdown?.hasAttribute('hidden')).toBe(true);
    });
  });
});
