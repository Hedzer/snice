import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/date-picker/snice-date-picker';
import type { SniceDatePickerElement } from '../../components/date-picker/snice-date-picker.types';

describe('snice-date-picker', () => {
  let datePicker: SniceDatePickerElement;

  afterEach(() => {
    if (datePicker) {
      removeComponent(datePicker as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render date-picker element', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker');

      expect(datePicker).toBeTruthy();
      expect(datePicker.tagName).toBe('SNICE-DATE-PICKER');
    });

    it('should have default properties', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker');

      expect(datePicker.size).toBe('medium');
      expect(datePicker.variant).toBe('outlined');
      expect(datePicker.value).toBe('');
      expect(datePicker.format).toBe('mm/dd/yyyy');
      expect(datePicker.disabled).toBe(false);
      expect(datePicker.readonly).toBe(false);
      expect(datePicker.required).toBe(false);
      expect(datePicker.invalid).toBe(false);
      expect(datePicker.clearable).toBe(false);
      expect(datePicker.showCalendar).toBe(false);
    });

    it('should render internal input element', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker');
      await wait(50);

      const inputEl = queryShadow(datePicker as HTMLElement, '.input');
      expect(inputEl).toBeTruthy();
      expect(inputEl?.tagName).toBe('INPUT');
    });

    it('should render calendar toggle button', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker');
      await wait(50);

      const toggleBtn = queryShadow(datePicker as HTMLElement, '.calendar-toggle');
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn?.tagName).toBe('BUTTON');
    });
  });

  describe('size variants', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
          size
        });
        await wait(50);

        const inputEl = queryShadow(datePicker as HTMLElement, '.input');
        expect(inputEl?.classList.contains(`input--${size}`)).toBe(true);
      });
    });
  });

  describe('variant styles', () => {
    const variants = ['outlined', 'filled', 'underlined'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant class`, async () => {
        datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
          variant
        });
        await wait(50);

        const inputEl = queryShadow(datePicker as HTMLElement, '.input');
        expect(inputEl?.classList.contains(`input--${variant}`)).toBe(true);
      });
    });
  });

  describe('date formats', () => {
    it('should format date as mm/dd/yyyy by default', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
        value: '2024-01-15'
      });
      await wait(50);

      const inputEl = queryShadow(datePicker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.value).toBe('01/15/2024');
    });

    it('should format date as dd/mm/yyyy', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
        value: '2024-01-15',
        format: 'dd/mm/yyyy'
      });
      await wait(50);

      const inputEl = queryShadow(datePicker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.value).toBe('15/01/2024');
    });

    it('should format date as yyyy-mm-dd', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
        value: '2024-01-15',
        format: 'yyyy-mm-dd'
      });
      await wait(50);

      const inputEl = queryShadow(datePicker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.value).toBe('2024-01-15');
    });
  });

  describe('disabled state', () => {
    it('should apply disabled attribute to input', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
        disabled: true
      });
      await wait(50);

      const inputEl = queryShadow(datePicker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.disabled).toBe(true);
    });

    it('should disable calendar toggle button', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
        disabled: true
      });
      await wait(50);

      const toggleBtn = queryShadow(datePicker as HTMLElement, '.calendar-toggle') as HTMLButtonElement;
      expect(toggleBtn?.disabled).toBe(true);
    });
  });

  describe('readonly state', () => {
    it('should apply readonly attribute to input', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
        readonly: true
      });
      await wait(50);

      const inputEl = queryShadow(datePicker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.readOnly).toBe(true);
    });
  });

  describe('required state', () => {
    it('should apply required attribute to input', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
        required: true
      });
      await wait(50);

      const inputEl = queryShadow(datePicker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.required).toBe(true);
    });

    it('should show required indicator on label', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
        label: 'Date',
        required: true
      });
      await wait(50);

      const labelEl = queryShadow(datePicker as HTMLElement, '.label');
      expect(labelEl?.classList.contains('label--required')).toBe(true);
    });
  });

  describe('calendar functionality', () => {
    it('should open calendar when toggle button clicked', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker');
      await wait(50);

      const toggleBtn = queryShadow(datePicker as HTMLElement, '.calendar-toggle') as HTMLButtonElement;
      toggleBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(10);

      expect(datePicker.showCalendar).toBe(true);
    });

    it('should close calendar when close method called', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker');
      await wait(50);

      datePicker.open();
      expect(datePicker.showCalendar).toBe(true);

      datePicker.close();
      expect(datePicker.showCalendar).toBe(false);
    });

    it('should render calendar days grid', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker');
      await wait(50);

      datePicker.open();

      const calendarDays = queryShadow(datePicker as HTMLElement, '.calendar-days');
      expect(calendarDays).toBeTruthy();
    });
  });

  describe('clearable functionality', () => {
    it('should show clear button when clearable and has value', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
        clearable: true,
        value: '2024-01-15'
      });
      await wait(50);

      const clearBtn = queryShadow(datePicker as HTMLElement, '.clear-button') as HTMLButtonElement;
      expect(clearBtn).toBeTruthy();
      expect(clearBtn?.style.display).not.toBe('none');
    });

    it('should clear value when clear button clicked', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
        clearable: true,
        value: '2024-01-15'
      });
      await wait(50);

      datePicker.clear();

      expect(datePicker.value).toBe('');
    });
  });

  describe('events', () => {
    it('should dispatch change event when value changes', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker');
      await wait(50);

      let changeDetail: any = null;
      (datePicker as HTMLElement).addEventListener('@snice/datepicker-change', (e: Event) => {
        changeDetail = (e as CustomEvent).detail;
      });

      // Simulate actual user input change event
      const inputEl = queryShadow(datePicker as HTMLElement, '.input') as HTMLInputElement;
      inputEl.value = '01/15/2024';
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      await wait(10);

      expect(changeDetail).toBeTruthy();
    });

    it('should dispatch open event when calendar opens', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker');
      await wait(50);

      let openFired = false;
      (datePicker as HTMLElement).addEventListener('@snice/datepicker-open', () => {
        openFired = true;
      });

      datePicker.open();

      expect(openFired).toBe(true);
    });

    it('should dispatch close event when calendar closes', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker');
      await wait(50);

      let closeFired = false;
      (datePicker as HTMLElement).addEventListener('@snice/datepicker-close', () => {
        closeFired = true;
      });

      datePicker.open();
      datePicker.close();

      expect(closeFired).toBe(true);
    });
  });

  describe('API methods', () => {
    let tracker: any;

    beforeEach(async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker');
      tracker = wait(datePicker as HTMLElement);
    });

    it('should support focus method', () => {
      expect(() => datePicker.focus()).not.toThrow();
    });

    it('should support blur method', () => {
      expect(() => datePicker.blur()).not.toThrow();
    });

    it('should support open method', async () => {
      datePicker.open();
      expect(datePicker.showCalendar).toBe(true);
    });

    it('should support close method', async () => {
      datePicker.open();
      datePicker.close();
      expect(datePicker.showCalendar).toBe(false);
    });

    it('should support clear method', async () => {
      datePicker.value = '2024-01-15';
      datePicker.clear();
      expect(datePicker.value).toBe('');
    });

    it('should support selectDate method', async () => {
      const date = new Date(2024, 0, 15);
      datePicker.selectDate(date);
      expect(datePicker.value).toBeTruthy();
    });
  });

  describe('label and helper text', () => {
    it('should render label when provided', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
        label: 'Select Date'
      });
      await wait(50);

      const labelEl = queryShadow(datePicker as HTMLElement, '.label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent).toContain('Select Date');
    });

    it('should render helper text when provided', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
        'helper-text': 'Choose a date'
      });
      await wait(50);

      const helperEl = queryShadow(datePicker as HTMLElement, '.helper-text');
      expect(helperEl).toBeTruthy();
      expect(helperEl?.textContent).toContain('Choose a date');
    });

    it('should render error text when provided', async () => {
      datePicker = await createComponent<SniceDatePickerElement>('snice-date-picker', {
        'error-text': 'Invalid date'
      });
      await wait(50);

      const errorEl = queryShadow(datePicker as HTMLElement, '.error-text');
      expect(errorEl).toBeTruthy();
      expect(errorEl?.textContent).toContain('Invalid date');
    });
  });
});
