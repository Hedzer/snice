import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/date-time-picker/snice-date-time-picker';
import type { SniceDateTimePickerElement } from '../../packages/components/src/date-time-picker/snice-date-time-picker.types';

describe('snice-date-time-picker', () => {
  let picker: SniceDateTimePickerElement;
  let restoreAttachInternals: (() => void) | undefined;

  const getInput = () => queryShadow<HTMLInputElement>(picker as HTMLElement, '.input')!;
  const settle = async () => {
    await (picker as any).rendered;
    await Promise.resolve();
  };
  const installInternalsMock = () => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'attachInternals');
    const setFormValue = vi.fn();
    const internals = {
      form: null,
      labels: null,
      validity: { valid: true },
      validationMessage: '',
      willValidate: true,
      setFormValue,
      setValidity: vi.fn(),
      checkValidity: vi.fn(() => true),
      reportValidity: vi.fn(() => true)
    };
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
      configurable: true,
      value: () => internals
    });
    restoreAttachInternals = () => {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, 'attachInternals', descriptor);
      else delete (HTMLElement.prototype as any).attachInternals;
    };
    return { internals, setFormValue };
  };

  afterEach(() => {
    if (picker) {
      if ((picker as HTMLElement).isConnected) removeComponent(picker as HTMLElement);
    }
    document.querySelectorAll('[data-date-time-test]').forEach(element => element.remove());
    document.querySelectorAll('[data-date-time-label-test]').forEach(element => element.remove());
    restoreAttachInternals?.();
    restoreAttachInternals = undefined;
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

  describe('external label and composite naming lifecycle', () => {
    it('names the dropdown field, composite panel, and individual time groups without duplicating its description', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        id: 'labelled-date-time',
        label: 'Internal fallback',
        'helper-text': 'Times are shown locally.',
        'show-seconds': true,
        'time-format': '12h'
      });
      const primary = document.createElement('label');
      primary.dataset.dateTimeLabelTest = 'true';
      primary.htmlFor = picker.id;
      primary.textContent = 'Appointment';
      const secondary = document.createElement('label');
      secondary.dataset.dateTimeLabelTest = 'true';
      secondary.htmlFor = picker.id;
      secondary.textContent = 'required';
      picker.before(primary, secondary);
      (picker as any).labelAssociation.sync();
      await settle();

      const input = getInput();
      const descriptionId = input.getAttribute('aria-describedby')!;
      expect(Array.from(picker.labels || [], label => label.textContent)).toEqual(['Appointment', 'required']);
      expect(input.getAttribute('aria-label')).toBe('Appointment required');
      expect(queryShadow(picker as HTMLElement, '.panel')?.getAttribute('aria-label')).toBe('Appointment required controls');
      expect(queryShadow(picker as HTMLElement, '.panel-calendar')?.getAttribute('aria-label')).toBe('Appointment required date');
      expect(Array.from(picker.shadowRoot!.querySelectorAll('.time-column'), column => column.getAttribute('aria-label')))
        .toEqual([
          'Appointment required hours',
          'Appointment required minutes',
          'Appointment required seconds',
          'Appointment required period'
        ]);
      expect(queryShadow(picker as HTMLElement, `#${descriptionId}`)?.textContent).toBe('Times are shown locally.');
      expect(picker.shadowRoot?.querySelectorAll(`#${descriptionId}`)).toHaveLength(1);
    });

    it('focuses the dropdown field without opening its panel on label activation', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        id: 'focus-date-time'
      });
      const label = document.createElement('label');
      label.dataset.dateTimeLabelTest = 'true';
      label.htmlFor = picker.id;
      label.textContent = 'Starts at';
      picker.before(label);
      (picker as any).labelAssociation.sync();

      picker.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

      expect(picker.shadowRoot?.activeElement).toBe(getInput());
      expect((picker as any).showPanel).toBe(false);
    });

    it('uses the inline composite group as the label focus target', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        id: 'inline-date-time',
        variant: 'inline',
        label: 'Schedule',
        'helper-text': 'Choose a date and time.'
      });
      const label = document.createElement('label');
      label.dataset.dateTimeLabelTest = 'true';
      label.htmlFor = picker.id;
      label.textContent = 'Inline appointment';
      picker.before(label);
      (picker as any).labelAssociation.sync();
      await settle();

      picker.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

      const panel = queryShadow<HTMLElement>(picker as HTMLElement, '.panel')!;
      expect(picker.shadowRoot?.activeElement).toBe(panel);
      expect(panel.getAttribute('aria-label')).toBe('Inline appointment controls');
      expect(panel.getAttribute('aria-describedby')).toMatch(/^snice-date-time-picker-desc-/);
    });

    it('keeps a disabled inline composite inert on label activation and focus()', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        id: 'disabled-inline-date-time',
        variant: 'inline',
        disabled: true
      });
      const label = document.createElement('label');
      label.dataset.dateTimeLabelTest = 'true';
      label.htmlFor = picker.id;
      label.textContent = 'Disabled inline appointment';
      picker.before(label);
      (picker as any).labelAssociation.sync();
      await settle();

      label.click();
      picker.focus();

      expect(picker.shadowRoot?.activeElement).toBeNull();
      expect((picker as any).showPanel).toBe(false);
    });

    it('updates the external name and shared error description dynamically', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        id: 'dynamic-date-time',
        'helper-text': 'Initial help'
      });
      const label = document.createElement('label');
      label.dataset.dateTimeLabelTest = 'true';
      label.htmlFor = picker.id;
      label.textContent = 'Begins';
      picker.before(label);
      (picker as any).labelAssociation.sync();
      label.textContent = 'Revised start';
      picker.invalid = true;
      picker.errorText = 'Choose an available time.';
      await settle();
      (picker as any).labelAssociation.sync();

      const descriptionId = getInput().getAttribute('aria-describedby')!;
      expect(getInput().getAttribute('aria-label')).toBe('Revised start');
      expect(getInput().getAttribute('aria-invalid')).toBe('true');
      expect(queryShadow(picker as HTMLElement, `#${descriptionId}`)?.textContent).toBe('Choose an available time.');
      expect(queryShadow(picker as HTMLElement, `#${descriptionId}`)?.getAttribute('role')).toBe('alert');
      expect(queryShadow(picker as HTMLElement, '.helper-text')).toBeNull();
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

  describe('complete public surface and display compatibility', () => {
    it('exposes native-compatible defaults without removing picker features', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');

      expect(picker).toMatchObject({
        value: '',
        defaultValue: '',
        type: 'datetime-local',
        dateFormat: 'yyyy-mm-dd',
        timeFormat: '24h',
        size: 'medium',
        min: '',
        max: '',
        showSeconds: false,
        loading: false,
        clearable: false,
        disabled: false,
        readonly: false,
        required: false,
        invalid: false,
        name: '',
        variant: 'dropdown'
      });
      expect((picker as HTMLElement).tabIndex).toBe(-1);
      expect(queryShadow(picker as HTMLElement, '.panel-calendar')).toBeTruthy();
      expect(queryShadow(picker as HTMLElement, '.panel-time')).toBeTruthy();
    });

    it('preserves an authored host tabindex', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', { tabindex: 0 });
      expect((picker as HTMLElement).tabIndex).toBe(0);
    });

    it.each([
      ['yyyy-mm-dd', '2026-03-10 14:05'],
      ['mm/dd/yyyy', '03/10/2026 14:05'],
      ['dd/mm/yyyy', '10/03/2026 14:05'],
      ['yyyy/mm/dd', '2026/03/10 14:05'],
      ['dd-mm-yyyy', '10-03-2026 14:05'],
      ['mm-dd-yyyy', '03-10-2026 14:05'],
      ['mmmm dd, yyyy', 'March 10, 2026 14:05']
    ] as const)('retains the %s date display format', async (format, display) => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        'date-format': format,
        value: '2026-03-10T14:05'
      });
      expect(getInput().value).toBe(display);
      expect(picker.value).toBe('2026-03-10T14:05');
      expect(picker.defaultValue).toBe('2026-03-10T14:05');
    });

    it('retains 12-hour display, seconds, every size, and both variants', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2026-03-10T14:05:09',
        'time-format': '12h',
        'show-seconds': true,
        size: 'large'
      });
      expect(getInput().value).toBe('2026-03-10 2:05:09 PM');
      expect(getInput().classList.contains('input--large')).toBe(true);
      expect((picker as HTMLElement).shadowRoot!.querySelectorAll('[data-second]')).toHaveLength(12);

      picker.variant = 'inline';
      await settle();
      expect(queryShadow(picker as HTMLElement, '.input')).toBeNull();
      expect(queryShadow(picker as HTMLElement, '.panel')?.classList.contains('panel--inline')).toBe(true);
    });

    it('changes presentation formats without rewriting the live value or reset default', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2026-03-10T14:05:09',
        'show-seconds': true
      });
      picker.value = '2026-04-20T16:25:45';
      picker.dateFormat = 'mmmm dd, yyyy';
      picker.timeFormat = '12h';
      await settle();

      expect(getInput().value).toBe('April 20, 2026 4:25:45 PM');
      expect(picker.value).toBe('2026-04-20T16:25:45');
      expect(picker.defaultValue).toBe('2026-03-10T14:05:09');
      expect(picker.getAttribute('value')).toBe('2026-03-10T14:05:09');
    });
  });

  describe('native live/default and form lifecycle', () => {
    it('keeps dirty live state separate from the authored reset default', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2026-03-10T14:05'
      });
      picker.value = '2026-04-20T16:25';
      picker.setAttribute('value', '2026-05-30T08:15');

      expect(picker.value).toBe('2026-04-20T16:25');
      expect(picker.defaultValue).toBe('2026-05-30T08:15');
      (picker as any).formResetCallback();
      expect(picker.value).toBe('2026-05-30T08:15');
      expect(getInput().value).toBe('2026-05-30 08:15');
    });

    it('tracks default mutations while pristine and stops after becoming dirty', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      picker.defaultValue = '2026-03-10T14:05';
      expect(picker.value).toBe('2026-03-10T14:05');

      picker.value = '2026-04-20T16:25';
      picker.defaultValue = '2026-05-30T08:15';
      expect(picker.value).toBe('2026-04-20T16:25');
    });

    it('submits one canonical local datetime and preserves exact restore text', async () => {
      const { setFormValue } = installInternalsMock();
      picker = document.createElement('snice-date-time-picker') as SniceDateTimePickerElement;
      picker.setAttribute('date-format', 'mm/dd/yyyy');
      picker.setAttribute('time-format', '12h');
      picker.setAttribute('value', '2026-03-10 14:05');
      document.body.appendChild(picker);
      await (picker as any).ready;

      expect(setFormValue.mock.calls.at(-1)).toEqual(['2026-03-10T14:05', '03/10/2026 2:05 PM']);
    });

    it('uses deterministic second precision when show-seconds changes', async () => {
      const { setFormValue } = installInternalsMock();
      picker = document.createElement('snice-date-time-picker') as SniceDateTimePickerElement;
      picker.setAttribute('value', '2026-03-10T14:05:09');
      document.body.appendChild(picker);
      await (picker as any).ready;
      expect(setFormValue.mock.calls.at(-1)?.[0]).toBe('2026-03-10T14:05');

      picker.showSeconds = true;
      expect(setFormValue.mock.calls.at(-1)?.[0]).toBe('2026-03-10T14:05:09');
      expect(picker.value).toBe('2026-03-10T14:05:09');
    });

    it('never submits malformed text as a valid datetime', async () => {
      const { internals, setFormValue } = installInternalsMock();
      picker = document.createElement('snice-date-time-picker') as SniceDateTimePickerElement;
      document.body.appendChild(picker);
      await (picker as any).ready;
      picker.value = '2026-02-30T25:99';

      expect(picker.value).toBe('2026-02-30T25:99');
      expect(getInput().value).toBe('2026-02-30T25:99');
      expect(setFormValue.mock.calls.at(-1)?.[0]).toBe('');
      expect(internals.setValidity.mock.calls.at(-1)?.[0]).toMatchObject({ badInput: true });
    });

    it('restores display text, canonical text, and malformed partial state without events', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        'date-format': 'dd/mm/yyyy'
      });
      const change = vi.fn();
      picker.addEventListener('datetime-change', change);

      (picker as any).formStateRestoreCallback('10/03/2026 14:05', 'restore');
      expect(picker.value).toBe('2026-03-10T14:05');
      expect(getInput().value).toBe('10/03/2026 14:05');
      (picker as any).formStateRestoreCallback('2026-04-20T16:25', 'restore');
      expect(picker.value).toBe('2026-04-20T16:25');
      (picker as any).formStateRestoreCallback('20/04/2026 16:', 'restore');
      expect(picker.value).toBe('20/04/2026 16:');
      expect(picker.checkValidity()).toBe(false);
      expect(change).not.toHaveBeenCalled();
    });

    it('ignores non-string restore states atomically', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2026-03-10T14:05'
      });
      for (const state of [null, new File([], 'time.txt'), new FormData()]) {
        (picker as any).formStateRestoreCallback(state, 'restore');
        expect(picker.value).toBe('2026-03-10T14:05');
      }
    });

    it('keeps inherited fieldset disabledness separate from authored disabledness', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2026-03-10T14:05',
        clearable: true
      });
      picker.open();
      (picker as any).formDisabledCallback(true);
      await settle();

      expect(picker.disabled).toBe(false);
      expect(picker.hasAttribute('disabled')).toBe(false);
      expect(getInput().disabled).toBe(true);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '.toggle-button')!.disabled).toBe(true);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '.clear-button')!.style.display).toBe('none');
      expect(picker.willValidate).toBe(false);

      (picker as any).formDisabledCallback(false);
      await settle();
      expect(getInput().disabled).toBe(false);
      expect(picker.willValidate).toBe(true);
    });

    it('exposes form ownership and the native validation surface', async () => {
      const form = document.createElement('form');
      form.id = 'date-time-owner';
      form.dataset.dateTimeTest = 'true';
      document.body.appendChild(form);
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', { required: true });
      picker.setAttribute('form', form.id);

      expect(picker.form).toBe(form);
      expect(picker.validity).toBeTruthy();
      expect(typeof picker.validationMessage).toBe('string');
      expect(picker.willValidate).toBe(true);
      expect(picker.labels?.length ?? 0).toBeGreaterThanOrEqual(0);
    });
  });

  describe('strict local datetime input and validation', () => {
    it('round-trips every month end and Gregorian leap boundary as a local wall time', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      const accepted = [
        '2026-01-31', '2026-02-28', '2024-02-29', '2000-02-29',
        '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30',
        '2026-07-31', '2026-08-31', '2026-09-30', '2026-10-31',
        '2026-11-30', '2026-12-31'
      ];

      for (const date of accepted) {
        const value = `${date}T23:59`;
        picker.value = value;
        expect(picker.value, value).toBe(value);
        expect(picker.checkValidity(), value).toBe(true);
        expect((picker as any).getISOValue(), value).toBe(value);
      }
    });

    it('rejects every calendar rollover boundary without normalizing its date or time', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      const rejectedDates = [
        '2026-01-32', '2026-02-29', '1900-02-29', '2024-02-30',
        '2026-03-32', '2026-04-31', '2026-05-32', '2026-06-31',
        '2026-07-32', '2026-08-32', '2026-09-31', '2026-10-32',
        '2026-11-31', '2026-12-32', '2026-00-10', '2026-13-01',
        '2026-01-00'
      ];

      for (const date of rejectedDates) {
        const value = `${date}T10:15`;
        picker.value = value;
        expect(picker.value, value).toBe(value);
        expect(getInput().value, value).toBe(value);
        expect((picker as any).getISOValue(), value).toBe('');
        expect(picker.checkValidity(), value).toBe(false);
      }
    });

    it('accepts keyboard entry in 24-hour, 12-hour, and long-date displays', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      getInput().value = '2026-03-10 14:05';
      getInput().dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      expect(picker.value).toBe('2026-03-10T14:05');
      expect(picker.checkValidity()).toBe(true);

      picker.dateFormat = 'mm/dd/yyyy';
      picker.timeFormat = '12h';
      await settle();
      getInput().value = '03/11/2026 2:15 PM';
      getInput().dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      expect(picker.value).toBe('2026-03-11T14:15');

      picker.dateFormat = 'mmmm dd, yyyy';
      await settle();
      getInput().value = 'March 12, 2026 9:30 AM';
      getInput().dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      expect(picker.value).toBe('2026-03-12T09:30');
    });

    it.each([
      '2026-02-30T10:00',
      '2026-13-01T10:00',
      '2026-03-10T24:00',
      '2026-03-10T23:60',
      '2026-03-10T23:59:60',
      '2026-03-10 14:',
      'not-a-datetime'
    ])('rejects malformed or impossible local value %s without normalization', async value => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      picker.value = value;
      expect(picker.value).toBe(value);
      expect(picker.checkValidity()).toBe(false);
      expect(getInput().getAttribute('aria-invalid')).toBe('true');
    });

    it.each([
      ['mm/dd/yyyy', '02/29/2026 10:15', '02/29/2024 10:15'],
      ['dd/mm/yyyy', '29/02/2026 10:15', '29/02/2024 10:15'],
      ['yyyy/mm/dd', '2026/02/29 10:15', '2024/02/29 10:15'],
      ['dd-mm-yyyy', '29-02-2026 10:15', '29-02-2024 10:15'],
      ['mm-dd-yyyy', '02-29-2026 10:15', '02-29-2024 10:15'],
      ['mmmm dd, yyyy', 'February 29, 2026 10:15', 'February 29, 2024 10:15']
    ] as const)('validates typed leap days strictly in %s', async (dateFormat, rejected, accepted) => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        'date-format': dateFormat
      });
      getInput().value = rejected;
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(picker.value).toBe(rejected);
      expect((picker as any).getISOValue()).toBe('');
      expect(picker.checkValidity()).toBe(false);

      getInput().value = accepted;
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(picker.value).toBe('2024-02-29T10:15');
      expect((picker as any).getISOValue()).toBe('2024-02-29T10:15');
      expect(picker.checkValidity()).toBe(true);
    });

    it('accepts exact time boundaries and rejects every one-step overflow', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        'show-seconds': true
      });
      for (const value of ['2026-01-01T00:00:00', '2026-12-31T23:59:59']) {
        picker.value = value;
        expect(picker.checkValidity(), value).toBe(true);
        expect((picker as any).getISOValue(), value).toBe(value);
      }
      for (const value of [
        '2026-01-01T24:00:00',
        '2026-01-01T23:60:00',
        '2026-01-01T23:59:60'
      ]) {
        picker.value = value;
        expect(picker.value, value).toBe(value);
        expect((picker as any).getISOValue(), value).toBe('');
        expect(picker.checkValidity(), value).toBe(false);
      }
    });

    it('treats local wall-clock values without UTC or DST conversion', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      for (const value of ['2026-03-08T02:30', '2026-11-01T01:30', '2026-01-01T00:00', '2026-12-31T23:59']) {
        picker.value = value;
        expect(picker.value).toBe(value);
        expect(picker.checkValidity()).toBe(true);
        expect((picker as any).getISOValue()).toBe(value);
      }
    });

    it('distinguishes optional empty, required empty, and malformed partial input', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      expect(picker.checkValidity()).toBe(true);
      picker.required = true;
      expect(picker.checkValidity()).toBe(false);

      getInput().value = '2026-03-10 14:';
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(picker.checkValidity()).toBe(false);
      expect(picker.value).toBe('2026-03-10 14:');

      getInput().value = '2026-03-10 14:05';
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(picker.checkValidity()).toBe(true);
      expect(picker.value).toBe('2026-03-10T14:05');
    });

    it('requires displayed seconds when show-seconds is enabled', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        'show-seconds': true
      });
      getInput().value = '2026-03-10 14:05';
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(picker.checkValidity()).toBe(false);
      getInput().value = '2026-03-10 14:05:09';
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(picker.checkValidity()).toBe(true);
      expect(picker.value).toBe('2026-03-10T14:05:09');
    });

    it('preserves impossible restored display text as bad input without a submitted datetime', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        'date-format': 'mm/dd/yyyy',
        required: true
      });
      (picker as any).formStateRestoreCallback('02/31/2026 10:15', 'restore');

      expect(picker.value).toBe('02/31/2026 10:15');
      expect(getInput().value).toBe('02/31/2026 10:15');
      expect((picker as any).getISOValue()).toBe('');
      expect(picker.checkValidity()).toBe(false);
      expect(picker.validity.badInput || picker.validity.customError).toBe(true);
    });

    it('enforces exact datetime and date-only min/max boundaries', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        min: '2026-03-10T09:30',
        max: '2026-03-20T17:45'
      });
      for (const value of ['2026-03-10T09:30', '2026-03-20T17:45']) {
        picker.value = value;
        expect(picker.checkValidity()).toBe(true);
      }
      picker.value = '2026-03-10T09:29';
      expect(picker.checkValidity()).toBe(false);
      picker.value = '2026-03-20T17:46';
      expect(picker.checkValidity()).toBe(false);

      picker.min = '2026-03-10';
      picker.max = '2026-03-20';
      picker.value = '2026-03-20T23:59';
      expect(picker.checkValidity()).toBe(true);
    });

    it('ignores impossible min and max constraints instead of comparing rolled datetimes', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2026-05-02T10:15',
        min: '2026-02-31T00:00',
        max: '2026-04-31T23:59'
      });

      expect(picker.checkValidity()).toBe(true);
      expect(picker.validity.rangeUnderflow).toBe(false);
      expect(picker.validity.rangeOverflow).toBe(false);
    });

    it('reacts immediately to dynamic required, min, max, and custom validity', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2026-03-10T14:05'
      });
      picker.min = '2026-03-11T00:00';
      expect(picker.checkValidity()).toBe(false);
      picker.min = '';
      picker.max = '2026-03-09T23:59';
      expect(picker.checkValidity()).toBe(false);
      picker.max = '';
      expect(picker.checkValidity()).toBe(true);

      picker.setCustomValidity('Scheduling is closed');
      expect(picker.checkValidity()).toBe(false);
      expect(picker.validationMessage).toContain('Scheduling is closed');
      expect(picker.value).toBe('2026-03-10T14:05');
      picker.setCustomValidity('');
      expect(picker.checkValidity()).toBe(true);
    });

    it.each(['disabled', 'readonly', 'loading'] as const)('bars %s controls from validation without losing state', async state => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', { required: true });
      (picker as any)[state] = true;
      await settle();
      expect(picker.checkValidity()).toBe(true);
      expect(picker.willValidate).toBe(false);
      expect(picker.value).toBe('');
      expect(getInput().disabled).toBe(state !== 'readonly');
    });
  });

  describe('calendar, time, clear, and blocked interaction paths', () => {
    it('keeps time selection before date selection working', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      picker.open();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-hour="14"]')!.click();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-minute="30"]')!.click();
      expect(picker.value).toBe('');

      const day = (picker as HTMLElement).shadowRoot!.querySelector<HTMLButtonElement>('.day:not(.day--empty):not(.day--disabled)')!;
      day.click();
      expect(picker.value.endsWith('T14:30')).toBe(true);
    });

    it('selects date, hour, minute, second, and period without losing any part', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2026-03-10T09:00:00',
        'show-seconds': true,
        'time-format': '12h'
      });
      picker.open();
      await settle();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-15"]')!.click();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-hour="2"]')!.click();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-minute="30"]')!.click();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-second="45"]')!.click();
      const periodButtons = Array.from((picker as HTMLElement).shadowRoot!.querySelectorAll<HTMLButtonElement>('.time-column--period .time-item'));
      periodButtons.find(button => button.textContent?.trim() === 'PM')!.click();
      expect(picker.value).toBe('2026-03-15T14:30:45');
    });

    it('disables only days wholly outside a datetime range', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2026-03-15T12:00',
        min: '2026-03-10T12:30',
        max: '2026-03-20T08:00'
      });
      picker.open();
      await settle();
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-09"]')!.disabled).toBe(true);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-10"]')!.disabled).toBe(false);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-20"]')!.disabled).toBe(false);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-21"]')!.disabled).toBe(true);
    });

    it('clears valid and malformed values with the existing custom event order', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2026-03-10T14:05'
      });
      const events: string[] = [];
      picker.addEventListener('datetimepicker-clear', () => events.push('clear'));
      picker.addEventListener('datetime-change', () => events.push('change'));
      picker.clear();
      picker.value = 'partial';
      picker.clear();
      expect(picker.value).toBe('');
      expect(events).toEqual(['clear', 'change', 'clear', 'change']);
    });

    it.each(['disabled', 'readonly', 'loading'] as const)('blocks every user interaction path while %s', async state => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker', {
        value: '2026-03-10T14:05',
        clearable: true
      });
      (picker as any)[state] = true;
      await settle();
      picker.open();
      expect((picker as any).showPanel).toBe(false);
      getInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '.clear-button')!.click();
      expect(picker.value).toBe('2026-03-10T14:05');
    });
  });

  describe('@reconnect: outside-click survives reconnect', () => {
    it('outside-click closes panel on first connect', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      (picker as any).showPanel = true;
      await wait(20);

      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((picker as any).showPanel).toBe(false);
    });

    it('outside-click still closes panel after disconnect+reconnect', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      const parent = picker.parentNode!;

      parent.removeChild(picker);
      await wait(20);
      parent.appendChild(picker);
      await wait(20);

      (picker as any).showPanel = true;
      await wait(20);
      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((picker as any).showPanel).toBe(false);
    });

    it('does not respond to clicks after final dispose', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      (picker as any).showPanel = true;
      await wait(20);

      const parent = picker.parentNode!;
      parent.removeChild(picker);
      await wait(20);

      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((picker as any).showPanel).toBe(true);
    });

    it('balances document and viewport listeners across reconnects', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      let documentNet = 0;
      let windowNet = 0;
      const documentAdd = document.addEventListener;
      const documentRemove = document.removeEventListener;
      const windowAdd = window.addEventListener;
      const windowRemove = window.removeEventListener;
      document.addEventListener = ((type: string, handler: any, options?: any) => {
        if (type === 'click') documentNet++;
        return (documentAdd as any).call(document, type, handler, options);
      }) as any;
      document.removeEventListener = ((type: string, handler: any, options?: any) => {
        if (type === 'click') documentNet--;
        return (documentRemove as any).call(document, type, handler, options);
      }) as any;
      window.addEventListener = ((type: string, handler: any, options?: any) => {
        if (type === 'resize' || type === 'scroll') windowNet++;
        return (windowAdd as any).call(window, type, handler, options);
      }) as any;
      window.removeEventListener = ((type: string, handler: any, options?: any) => {
        if (type === 'resize' || type === 'scroll') windowNet--;
        return (windowRemove as any).call(window, type, handler, options);
      }) as any;

      const parent = picker.parentNode!;
      parent.removeChild(picker);
      await wait(20);
      const afterDispose = [documentNet, windowNet];
      parent.appendChild(picker);
      await wait(20);
      const afterReconnect = [documentNet, windowNet];

      document.addEventListener = documentAdd;
      document.removeEventListener = documentRemove;
      window.addEventListener = windowAdd;
      window.removeEventListener = windowRemove;
      expect(afterDispose).toEqual([-1, -2]);
      expect(afterReconnect).toEqual([0, 0]);
    });

    it('repositions an open panel on resize and scroll but not after dispose', async () => {
      picker = await createComponent<SniceDateTimePickerElement>('snice-date-time-picker');
      const position = vi.spyOn(picker as any, 'positionPanel');
      (picker as any).showPanel = true;
      await settle();
      position.mockClear();
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('scroll'));
      expect(position).toHaveBeenCalledTimes(2);

      picker.remove();
      await wait(20);
      position.mockClear();
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('scroll'));
      expect(position).not.toHaveBeenCalled();
    });
  });
});
