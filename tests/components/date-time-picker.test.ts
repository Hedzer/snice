import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/date-time-picker/snice-date-time-picker';
import type { SniceDateTimePickerElement } from '../../components/date-time-picker/snice-date-time-picker.types';

describe('snice-date-time-picker', () => {
  let picker: SniceDateTimePickerElement;

  afterEach(() => {
    if (picker) {
      removeComponent(picker as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render date-time-picker element', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');

      expect(picker).toBeTruthy();
      expect(picker.tagName).toBe('SNICE-DATE-TIME-PICKER');
    });

    it('should have default properties', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');

      expect(picker.value).toBe('');
      expect(picker.dateFormat).toBe('yyyy-mm-dd');
      expect(picker.timeFormat).toBe('24h');
      expect(picker.showSeconds).toBe(false);
      expect(picker.disabled).toBe(false);
      expect(picker.readonly).toBe(false);
      expect(picker.required).toBe(false);
      expect(picker.invalid).toBe(false);
      expect(picker.variant).toBe('dropdown');
    });

    it('should render internal input element', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      await wait(50);

      const inputEl = queryShadow(picker as HTMLElement, '.input');
      expect(inputEl).toBeTruthy();
      expect(inputEl?.tagName).toBe('INPUT');
    });

    it('should render toggle button', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      await wait(50);

      const toggleBtn = queryShadow(picker as HTMLElement, '.toggle-button');
      expect(toggleBtn).toBeTruthy();
      expect(toggleBtn?.tagName).toBe('BUTTON');
    });
  });

  describe('value handling', () => {
    it('should accept ISO datetime value', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2024-12-25T14:30'
      });
      await wait(50);

      expect(picker.value).toBe('2024-12-25T14:30');
    });

    it('should accept value with seconds', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2024-12-25T14:30:45',
        'show-seconds': true
      });
      await wait(50);

      expect(picker.value).toBe('2024-12-25T14:30:45');
    });

    it('should display formatted value in input', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2024-12-25T14:30'
      });
      await wait(50);

      const inputEl = queryShadow(picker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.value).toContain('2024-12-25');
      expect(inputEl?.value).toContain('14:30');
    });

    it('should display 12h time format', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2024-12-25T14:30',
        'time-format': '12h'
      });
      await wait(50);

      const inputEl = queryShadow(picker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.value).toContain('2:30 PM');
    });
  });

  describe('disabled state', () => {
    it('should apply disabled attribute to input', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        disabled: true
      });
      await wait(50);

      const inputEl = queryShadow(picker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.disabled).toBe(true);
    });

    it('should disable toggle button', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        disabled: true
      });
      await wait(50);

      const toggleBtn = queryShadow(picker as HTMLElement, '.toggle-button') as HTMLButtonElement;
      expect(toggleBtn?.disabled).toBe(true);
    });
  });

  describe('readonly state', () => {
    it('should apply readonly attribute to input', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        readonly: true
      });
      await wait(50);

      const inputEl = queryShadow(picker as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.readOnly).toBe(true);
    });
  });

  describe('required state', () => {
    it('should show required indicator on label', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        label: 'DateTime',
        required: true
      });
      await wait(50);

      const labelEl = queryShadow(picker as HTMLElement, '.label');
      expect(labelEl?.classList.contains('label--required')).toBe(true);
    });
  });

  describe('panel functionality', () => {
    it('should open panel when toggle button clicked', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      await wait(50);

      const toggleBtn = queryShadow(picker as HTMLElement, '.toggle-button') as HTMLButtonElement;
      toggleBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await wait(10);

      const panel = queryShadow(picker as HTMLElement, '.panel');
      expect(panel?.hasAttribute('hidden')).toBe(false);
    });

    it('should close panel when close method called', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      await wait(50);

      picker.open();
      picker.close();

      const panel = queryShadow(picker as HTMLElement, '.panel');
      expect(panel?.hasAttribute('hidden')).toBe(true);
    });

    it('should render calendar and time selectors', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      await wait(50);

      picker.open();
      await wait(10);

      const calendarDays = queryShadow(picker as HTMLElement, '.calendar-days');
      const timeSelectors = queryShadow(picker as HTMLElement, '.time-selectors');
      expect(calendarDays).toBeTruthy();
      expect(timeSelectors).toBeTruthy();
    });

    it('should render navigation buttons', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      await wait(50);

      picker.open();
      await wait(10);

      const navButtons = picker.shadowRoot?.querySelectorAll('.nav-button');
      expect(navButtons?.length).toBe(2);
    });
  });

  describe('inline variant', () => {
    it('should render inline panel', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        variant: 'inline'
      });
      await wait(50);

      const panel = queryShadow(picker as HTMLElement, '.panel');
      expect(panel?.classList.contains('panel--inline')).toBe(true);
    });

    it('should not render input for inline variant', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        variant: 'inline'
      });
      await wait(50);

      const inputEl = queryShadow(picker as HTMLElement, '.input');
      expect(inputEl).toBeNull();
    });
  });

  describe('events', () => {
    it('should dispatch datetime-change event when day selected', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      await wait(50);

      let changeDetail: any = null;
      (picker as HTMLElement).addEventListener('datetime-change', (e: Event) => {
        changeDetail = (e as CustomEvent).detail;
      });

      picker.open();
      await wait(10);

      // Click a day button
      const dayBtn = picker.shadowRoot?.querySelector('.day:not(.day--empty):not(.day--disabled)') as HTMLButtonElement;
      if (dayBtn) {
        dayBtn.click();
        await wait(10);
        expect(changeDetail).toBeTruthy();
        expect(changeDetail.value).toBeTruthy();
      }
    });

    it('should dispatch open event', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      await wait(50);

      let openFired = false;
      (picker as HTMLElement).addEventListener('datetimepicker-open', () => {
        openFired = true;
      });

      picker.open();
      expect(openFired).toBe(true);
    });

    it('should dispatch close event', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      await wait(50);

      let closeFired = false;
      (picker as HTMLElement).addEventListener('datetimepicker-close', () => {
        closeFired = true;
      });

      picker.open();
      picker.close();
      expect(closeFired).toBe(true);
    });
  });

  describe('label and helper text', () => {
    it('should render label', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        label: 'Appointment'
      });
      await wait(50);

      const labelEl = queryShadow(picker as HTMLElement, '.label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent).toContain('Appointment');
    });

    it('should render helper text', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        'helper-text': 'Select date and time'
      });
      await wait(50);

      const helperEl = queryShadow(picker as HTMLElement, '.helper-text');
      expect(helperEl).toBeTruthy();
      expect(helperEl?.textContent).toContain('Select date and time');
    });

    it('should render error text', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        'error-text': 'Invalid selection'
      });
      await wait(50);

      const errorEl = queryShadow(picker as HTMLElement, '.error-text');
      expect(errorEl).toBeTruthy();
      expect(errorEl?.textContent).toContain('Invalid selection');
    });
  });

  describe('API methods', () => {
    it('should support focus method', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      expect(() => picker.focus()).not.toThrow();
    });

    it('should support blur method', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      expect(() => picker.blur()).not.toThrow();
    });

    it('should support open method', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      await wait(50);

      picker.open();
      const panel = queryShadow(picker as HTMLElement, '.panel');
      expect(panel?.hasAttribute('hidden')).toBe(false);
    });

    it('should support close method', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      await wait(50);

      picker.open();
      picker.close();
      const panel = queryShadow(picker as HTMLElement, '.panel');
      expect(panel?.hasAttribute('hidden')).toBe(true);
    });
  });
});
