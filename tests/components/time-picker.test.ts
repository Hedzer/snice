import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/time-picker/snice-time-picker';
import type { SniceTimePickerElement } from '../../packages/components/src/time-picker/snice-time-picker.types';

describe('snice-time-picker', () => {
  let picker: SniceTimePickerElement;
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
    if (picker && (picker as HTMLElement).isConnected) {
      removeComponent(picker as HTMLElement);
    }
    document.querySelectorAll('[data-time-picker-test]').forEach(element => element.remove());
    document.querySelectorAll('[data-time-label-test]').forEach(element => element.remove());
    restoreAttachInternals?.();
    restoreAttachInternals = undefined;
  });

  describe('12h formatting is order-independent (derives from this.value)', () => {
    // A real browser fires attributeChangedCallback for pre-connect setAttribute,
    // so parseValue can run while `format` is still 24h — leaving this.hours in
    // 24h-form with the default period. The input display must still be correct,
    // so getFormattedValue derives from this.value (canonical 24h), not those fields.
    it('formats 14:30 as 2:30 PM even if hours/period fields are stale', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { value: '14:30', format: '12h' });
      await wait(20);
      (picker as any).hours = 14;
      (picker as any).period = 'AM';
      expect((picker as any).getFormattedValue()).toBe('2:30 PM');
    });

    it('formats midnight as 12:00 AM even if hours/period fields are stale', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { value: '00:00', format: '12h' });
      await wait(20);
      (picker as any).hours = 0;
      (picker as any).period = 'PM';
      expect((picker as any).getFormattedValue()).toBe('12:00 AM');
    });

    it('formats noon as 12:00 PM even if hours/period fields are stale', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { value: '12:00', format: '12h' });
      await wait(20);
      (picker as any).hours = 0;
      (picker as any).period = 'AM';
      expect((picker as any).getFormattedValue()).toBe('12:00 PM');
    });
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

  describe('external label and composite naming lifecycle', () => {
    it('uses every associated label for one field, its controls, and one shared description', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        id: 'labelled-time-picker',
        label: 'Internal fallback',
        'helper-text': 'Times are local.',
        'show-seconds': true,
        format: '12h'
      });
      const primary = document.createElement('label');
      primary.dataset.timeLabelTest = 'true';
      primary.htmlFor = picker.id;
      primary.textContent = 'Appointment time';
      const secondary = document.createElement('label');
      secondary.dataset.timeLabelTest = 'true';
      secondary.htmlFor = picker.id;
      secondary.textContent = 'required';
      picker.before(primary, secondary);
      (picker as any).labelAssociation.sync();
      await settle();

      const input = getInput();
      const descriptionId = input.getAttribute('aria-describedby')!;
      expect(Array.from(picker.labels || [], label => label.textContent)).toEqual(['Appointment time', 'required']);
      expect(input.getAttribute('aria-label')).toBe('Appointment time required');
      expect(queryShadow(picker as HTMLElement, '.dropdown')?.getAttribute('aria-label')).toBe('Appointment time required controls');
      expect(Array.from(picker.shadowRoot!.querySelectorAll('[data-time-unit]'), group => group.getAttribute('aria-label')))
        .toEqual([
          'Appointment time required hours',
          'Appointment time required minutes',
          'Appointment time required seconds',
          'Appointment time required period'
        ]);
      expect(queryShadow(picker as HTMLElement, '.clock-toggle')?.getAttribute('aria-label'))
        .toBe('Appointment time required: open time picker');
      expect(queryShadow(picker as HTMLElement, `#${descriptionId}`)?.textContent).toBe('Times are local.');
      expect(picker.shadowRoot?.querySelectorAll(`#${descriptionId}`)).toHaveLength(1);
    });

    it('focuses explicit and wrapping dropdown labels without opening the picker', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        id: 'focus-time-picker'
      });
      const explicit = document.createElement('label');
      explicit.dataset.timeLabelTest = 'true';
      explicit.htmlFor = picker.id;
      explicit.textContent = 'Starts at';
      picker.before(explicit);
      (picker as any).labelAssociation.sync();

      explicit.click();
      expect(picker.shadowRoot?.activeElement).toBe(getInput());
      expect((picker as any).showDropdown).toBe(false);

      const wrapping = document.createElement('label');
      wrapping.dataset.timeLabelTest = 'true';
      wrapping.textContent = 'Wrapped time';
      picker.replaceWith(wrapping);
      wrapping.appendChild(picker as HTMLElement);
      picker.removeAttribute('id');
      (picker as any).labelAssociation.sync();
      getInput().blur();
      wrapping.click();
      expect(picker.shadowRoot?.activeElement).toBe(getInput());
      expect((picker as any).showDropdown).toBe(false);
    });

    it('uses the inline controls as the label target and keeps disabled inline controls inert', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        id: 'inline-time-picker',
        variant: 'inline',
        'helper-text': 'Choose a time.'
      });
      const label = document.createElement('label');
      label.dataset.timeLabelTest = 'true';
      label.htmlFor = picker.id;
      label.textContent = 'Inline appointment';
      picker.before(label);
      (picker as any).labelAssociation.sync();
      await settle();

      label.click();
      const panel = queryShadow<HTMLElement>(picker as HTMLElement, '.dropdown')!;
      expect(picker.shadowRoot?.activeElement).toBe(panel);
      expect(panel.getAttribute('aria-label')).toBe('Inline appointment controls');
      expect(panel.getAttribute('aria-describedby')).toMatch(/^snice-time-picker-desc-/);

      panel.blur();
      picker.disabled = true;
      await settle();
      label.click();
      picker.focus();
      expect(picker.shadowRoot?.activeElement).toBeNull();
    });

    it('updates external names and replaces helper text with one live error description', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        id: 'dynamic-time-picker',
        'helper-text': 'Initial help'
      });
      const label = document.createElement('label');
      label.dataset.timeLabelTest = 'true';
      label.htmlFor = picker.id;
      label.textContent = 'Begins';
      picker.before(label);
      (picker as any).labelAssociation.sync();

      label.textContent = 'Revised start time';
      picker.invalid = true;
      picker.errorText = 'Choose an available time.';
      await settle();
      (picker as any).labelAssociation.sync();

      const descriptionId = getInput().getAttribute('aria-describedby')!;
      expect(getInput().getAttribute('aria-label')).toBe('Revised start time');
      expect(getInput().getAttribute('aria-invalid')).toBe('true');
      expect(queryShadow(picker as HTMLElement, `#${descriptionId}`)?.textContent).toBe('Choose an available time.');
      expect(queryShadow(picker as HTMLElement, `#${descriptionId}`)?.getAttribute('role')).toBe('alert');
      expect(queryShadow(picker as HTMLElement, '.helper-text')).toBeNull();
    });

    it('rebinds label activation after moving and reconnecting the host', async () => {
      const first = document.createElement('div');
      const second = document.createElement('div');
      first.dataset.timeLabelTest = 'true';
      second.dataset.timeLabelTest = 'true';
      document.body.append(first, second);
      picker = document.createElement('snice-time-picker') as SniceTimePickerElement;
      picker.id = 'moved-time-picker';
      const label = document.createElement('label');
      label.dataset.timeLabelTest = 'true';
      label.htmlFor = picker.id;
      label.textContent = 'Moved time';
      first.append(label, picker as HTMLElement);
      await (picker as any).ready;

      second.append(label, picker as HTMLElement);
      await settle();
      (picker as any).labelAssociation.sync();
      label.click();

      expect(picker.shadowRoot?.activeElement).toBe(getInput());
      expect(Array.from(picker.labels || [])).toEqual([label]);
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

  describe('@reconnect: outside-click closes dropdown after reconnect', () => {
    it('outside-click closes dropdown on first connect', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      (picker as any).showDropdown = true;
      await wait(20);

      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((picker as any).showDropdown).toBe(false);
    });

    it('outside-click still closes dropdown after reconnect', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      const parent = picker.parentNode!;

      parent.removeChild(picker);
      await wait(20);
      parent.appendChild(picker);
      await wait(20);

      (picker as any).showDropdown = true;
      await wait(20);
      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((picker as any).showDropdown).toBe(false);
    });

    it('does not respond to clicks after final dispose', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      (picker as any).showDropdown = true;
      await wait(20);

      const parent = picker.parentNode!;
      parent.removeChild(picker);
      await wait(20);

      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((picker as any).showDropdown).toBe(true);
    });

    it('balances document and viewport listeners across reconnects', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
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

    it('repositions an open dropdown on resize and scroll but not after dispose', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');
      const position = vi.spyOn(picker as any, 'positionDropdown');
      (picker as any).showDropdown = true;
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

  describe('complete public surface and display compatibility', () => {
    it('exposes native-compatible defaults without removing picker features', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker');

      expect(picker).toMatchObject({
        value: '',
        defaultValue: '',
        type: 'time',
        format: '24h',
        step: 15,
        minTime: '',
        maxTime: '',
        showSeconds: false,
        loading: false,
        clearable: false,
        disabled: false,
        readonly: false,
        required: false,
        invalid: false,
        name: '',
        variant: 'dropdown',
        size: 'medium'
      });
      expect((picker as HTMLElement).tabIndex).toBe(-1);
      expect(queryShadow(picker as HTMLElement, '.clock-toggle')).toBeTruthy();
      expect((picker as HTMLElement).shadowRoot!.querySelectorAll('[data-hour]')).toHaveLength(24);
      expect((picker as HTMLElement).shadowRoot!.querySelectorAll('[data-minute]')).toHaveLength(4);
    });

    it('preserves an authored host tabindex', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { tabindex: 0 });
      expect((picker as HTMLElement).tabIndex).toBe(0);
    });

    it.each([
      ['24h', false, '14:05'],
      ['12h', false, '2:05 PM'],
      ['24h', true, '14:05:09'],
      ['12h', true, '2:05:09 PM']
    ] as const)('retains %s display with seconds=%s', async (format, showSeconds, display) => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '14:05:09',
        format,
        'show-seconds': showSeconds,
        step: 1
      });
      expect(getInput().value).toBe(display);
      expect(picker.value).toBe('14:05:09');
      expect(picker.defaultValue).toBe('14:05:09');
    });

    it.each([
      ['small', 'input--small'],
      ['medium', 'input--medium'],
      ['large', 'input--large']
    ] as const)('retains the %s size', async (size, className) => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { size });
      expect(getInput().classList.contains(className)).toBe(true);
    });

    it.each([1, 5, 10, 15, 30] as const)('retains step=%s for minute and second selectors', async step => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '10:00:00',
        step,
        'show-seconds': true
      });
      expect((picker as HTMLElement).shadowRoot!.querySelectorAll('[data-minute]')).toHaveLength(60 / step);
      expect((picker as HTMLElement).shadowRoot!.querySelectorAll('[data-second]')).toHaveLength(60 / step);
    });

    it('retains both dropdown and inline variants', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { value: '10:00' });
      expect(getInput()).toBeTruthy();
      expect(queryShadow(picker as HTMLElement, '.dropdown')?.hasAttribute('hidden')).toBe(true);

      picker.variant = 'inline';
      await settle();
      expect(queryShadow(picker as HTMLElement, '.input')).toBeNull();
      expect(queryShadow(picker as HTMLElement, '.dropdown')?.classList.contains('dropdown--inline')).toBe(true);
      expect(queryShadow(picker as HTMLElement, '.dropdown')?.hasAttribute('popover')).toBe(false);
    });

    it('changes presentation without rewriting the live value or reset default', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '14:05:09',
        'show-seconds': true,
        step: 1
      });
      picker.value = '16:25:45';
      picker.format = '12h';
      await settle();

      expect(getInput().value).toBe('4:25:45 PM');
      expect(picker.value).toBe('16:25:45');
      expect(picker.defaultValue).toBe('14:05:09');
      expect(picker.getAttribute('value')).toBe('14:05:09');
    });
  });

  describe('native live/default and form lifecycle', () => {
    it('keeps dirty live state separate from the authored reset default', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { value: '14:05', step: 1 });
      picker.value = '16:25';
      picker.setAttribute('value', '08:15');

      expect(picker.value).toBe('16:25');
      expect(picker.defaultValue).toBe('08:15');
      (picker as any).formResetCallback();
      expect(picker.value).toBe('08:15');
      expect(getInput().value).toBe('08:15');
    });

    it('tracks default mutations while pristine and stops after becoming dirty', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { step: 1 });
      picker.defaultValue = '14:05';
      expect(picker.value).toBe('14:05');

      picker.value = '16:25';
      picker.defaultValue = '08:15';
      expect(picker.value).toBe('16:25');
      expect(picker.defaultValue).toBe('08:15');
    });

    it('submits one canonical time and preserves exact visible restore text', async () => {
      const { setFormValue } = installInternalsMock();
      picker = document.createElement('snice-time-picker') as SniceTimePickerElement;
      picker.setAttribute('format', '12h');
      picker.setAttribute('value', '14:05');
      picker.setAttribute('step', '1');
      document.body.appendChild(picker);
      await (picker as any).ready;

      expect(setFormValue.mock.calls.at(-1)).toEqual(['14:05', '2:05 PM']);
    });

    it('uses deterministic minute and second submission precision', async () => {
      const { setFormValue } = installInternalsMock();
      picker = document.createElement('snice-time-picker') as SniceTimePickerElement;
      picker.setAttribute('value', '14:05:09');
      picker.setAttribute('step', '1');
      document.body.appendChild(picker);
      await (picker as any).ready;
      expect(setFormValue.mock.calls.at(-1)?.[0]).toBe('14:05');

      picker.showSeconds = true;
      expect(setFormValue.mock.calls.at(-1)?.[0]).toBe('14:05:09');
      expect(picker.value).toBe('14:05:09');
    });

    it('never submits malformed text as a valid time', async () => {
      const { internals, setFormValue } = installInternalsMock();
      picker = document.createElement('snice-time-picker') as SniceTimePickerElement;
      document.body.appendChild(picker);
      await (picker as any).ready;
      picker.value = '25:99';

      expect(picker.value).toBe('25:99');
      expect(getInput().value).toBe('25:99');
      expect(setFormValue.mock.calls.at(-1)?.[0]).toBe('');
      expect(internals.setValidity.mock.calls.at(-1)?.[0]).toMatchObject({ badInput: true });
    });

    it('restores display text, canonical text, and malformed partial state without events', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { format: '12h', step: 1 });
      const change = vi.fn();
      picker.addEventListener('time-change', change);

      (picker as any).formStateRestoreCallback('2:05 PM', 'restore');
      expect(picker.value).toBe('14:05');
      expect(getInput().value).toBe('2:05 PM');
      (picker as any).formStateRestoreCallback('16:25', 'restore');
      expect(picker.value).toBe('16:25');
      expect(getInput().value).toBe('4:25 PM');
      (picker as any).formStateRestoreCallback('4:', 'restore');
      expect(picker.value).toBe('4:');
      expect(getInput().value).toBe('4:');
      expect(picker.checkValidity()).toBe(false);
      expect(change).not.toHaveBeenCalled();
    });

    it('ignores non-string restore states atomically', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { value: '14:05', step: 1 });
      for (const state of [null, new File([], 'time.txt'), new FormData()]) {
        (picker as any).formStateRestoreCallback(state, 'restore');
        expect(picker.value).toBe('14:05');
      }
    });

    it('keeps inherited fieldset disabledness separate from authored disabledness', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '14:05',
        clearable: true,
        step: 1
      });
      picker.open();
      (picker as any).formDisabledCallback(true);
      await settle();

      expect(picker.disabled).toBe(false);
      expect(picker.hasAttribute('disabled')).toBe(false);
      expect(getInput().disabled).toBe(true);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '.clock-toggle')!.disabled).toBe(true);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '.clear-button')!.style.display).toBe('none');
      expect(Array.from((picker as HTMLElement).shadowRoot!.querySelectorAll<HTMLButtonElement>('.selector-item'))
        .every(button => button.disabled)).toBe(true);
      expect(picker.willValidate).toBe(false);

      (picker as any).formDisabledCallback(false);
      await settle();
      expect(getInput().disabled).toBe(false);
      expect(picker.willValidate).toBe(true);
    });

    it('exposes form ownership and the native validation surface', async () => {
      const form = document.createElement('form');
      form.id = 'time-owner';
      form.dataset.timePickerTest = 'true';
      document.body.appendChild(form);
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { required: true });
      picker.setAttribute('form', form.id);

      expect(picker.form).toBe(form);
      expect(picker.validity).toBeTruthy();
      expect(typeof picker.validationMessage).toBe('string');
      expect(picker.willValidate).toBe(true);
      expect(picker.labels?.length ?? 0).toBeGreaterThanOrEqual(0);
    });
  });

  describe('strict time input and validation', () => {
    it('accepts keyboard entry in 24-hour and 12-hour displays including spaces', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { step: 1 });
      getInput().value = '9:05';
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(picker.value).toBe('09:05');
      expect(picker.checkValidity()).toBe(true);

      picker.format = '12h';
      await settle();
      getInput().value = '2:15 PM';
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(picker.value).toBe('14:15');
      expect(getInput().value).toBe('2:15 PM');
      expect(picker.checkValidity()).toBe(true);

      getInput().dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
      expect((picker as any).showDropdown).toBe(false);
    });

    it.each([
      '24:00',
      '23:60',
      '23:59:60',
      '9:',
      '9:5',
      '-1:00',
      '2:30 XM',
      '13:30 PM',
      'not-a-time'
    ])('rejects malformed or impossible value %s without normalization', async value => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { step: 1 });
      picker.value = value;
      expect(picker.value).toBe(value);
      expect(picker.checkValidity()).toBe(false);
      expect(getInput().getAttribute('aria-invalid')).toBe('true');
    });

    it('distinguishes optional empty, required empty, malformed partial, and valid input', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { step: 1 });
      expect(picker.checkValidity()).toBe(true);
      picker.required = true;
      expect(picker.checkValidity()).toBe(false);

      getInput().value = '14:';
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(picker.checkValidity()).toBe(false);
      expect(picker.value).toBe('14:');

      getInput().value = '14:05';
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(picker.checkValidity()).toBe(true);
      expect(picker.value).toBe('14:05');
    });

    it('requires displayed seconds when show-seconds is enabled', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        'show-seconds': true,
        step: 1
      });
      getInput().value = '14:05';
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(picker.checkValidity()).toBe(false);
      getInput().value = '14:05:09';
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      expect(picker.checkValidity()).toBe(true);
      expect(picker.value).toBe('14:05:09');
    });

    it('enforces exact minute and second min/max boundaries', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        'min-time': '09:30:15',
        'max-time': '17:45:30',
        'show-seconds': true,
        step: 1
      });
      for (const value of ['09:30:15', '17:45:30']) {
        picker.value = value;
        expect(picker.checkValidity()).toBe(true);
      }
      picker.value = '09:30:14';
      expect(picker.checkValidity()).toBe(false);
      expect((picker as any).getValidityFlags().rangeUnderflow).toBe(true);
      picker.value = '17:45:31';
      expect(picker.checkValidity()).toBe(false);
      expect((picker as any).getValidityFlags().rangeOverflow).toBe(true);
    });

    it.each([1, 5, 10, 15, 30] as const)('enforces supported step=%s on minutes', async step => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { step });
      picker.value = `10:${step.toString().padStart(2, '0')}`;
      expect(picker.checkValidity()).toBe(true);
      if (step !== 1) {
        picker.value = '10:01';
        expect(picker.checkValidity()).toBe(false);
        expect((picker as any).getValidityFlags().stepMismatch).toBe(true);
      }
    });

    it('enforces step on displayed seconds without dropping minute enforcement', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        'show-seconds': true,
        step: 5
      });
      for (const value of ['10:05:10', '10:10:55']) {
        picker.value = value;
        expect(picker.checkValidity()).toBe(true);
      }
      for (const value of ['10:06:10', '10:05:11']) {
        picker.value = value;
        expect(picker.checkValidity()).toBe(false);
        expect((picker as any).getValidityFlags().stepMismatch).toBe(true);
      }
    });

    it('falls back safely for adversarial runtime step values without hanging', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { value: '10:15' });
      for (const value of [0, -1, 2, 60, Number.NaN, Number.POSITIVE_INFINITY]) {
        (picker as any).step = value;
        await settle();
        expect((picker as HTMLElement).shadowRoot!.querySelectorAll('[data-minute]')).toHaveLength(4);
        expect(picker.checkValidity()).toBe(true);
      }
    });

    it('ignores malformed min/max constraints and reacts to dynamic valid constraints', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { value: '14:05', step: 1 });
      picker.minTime = 'tomorrow';
      picker.maxTime = '25:00';
      expect(picker.checkValidity()).toBe(true);
      picker.minTime = '15:00';
      expect(picker.checkValidity()).toBe(false);
      picker.minTime = '';
      picker.maxTime = '14:00';
      expect(picker.checkValidity()).toBe(false);
      picker.maxTime = '';
      expect(picker.checkValidity()).toBe(true);
    });

    it('sets and clears custom validity without mutating the value', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { value: '14:05', step: 1 });
      picker.setCustomValidity('Scheduling is closed');
      expect(picker.checkValidity()).toBe(false);
      expect(picker.validity.customError).toBe(true);
      expect(picker.validationMessage).toContain('Scheduling is closed');
      expect(picker.value).toBe('14:05');
      picker.setCustomValidity('');
      expect(picker.checkValidity()).toBe(true);
    });

    it.each(['disabled', 'readonly', 'loading'] as const)('bars %s controls from validation without losing state', async state => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { required: true });
      (picker as any)[state] = true;
      await settle();
      expect(picker.checkValidity()).toBe(true);
      expect(picker.willValidate).toBe(false);
      expect(picker.value).toBe('');
      expect(getInput().disabled).toBe(state !== 'readonly');
    });
  });

  describe('selector, clear, and blocked interaction paths', () => {
    it('selects hour, minute, second, and period without losing any part', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '09:00:00',
        'show-seconds': true,
        format: '12h',
        step: 5
      });
      picker.open();
      await settle();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-hour="2"]')!.click();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-minute="30"]')!.click();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-second="45"]')!.click();
      const periods = Array.from((picker as HTMLElement).shadowRoot!.querySelectorAll<HTMLButtonElement>('.selector-column--period .selector-item'));
      periods.find(button => button.textContent?.trim() === 'PM')!.click();
      expect(picker.value).toBe('14:30:45');
      expect(getInput().value).toBe('2:30:45 PM');
    });

    it('disables only selector intervals wholly outside exact boundaries', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '09:30:15',
        'show-seconds': true,
        'min-time': '09:30:15',
        'max-time': '10:15:30',
        step: 15
      });
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-hour="8"]')!.disabled).toBe(true);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-hour="9"]')!.disabled).toBe(false);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-hour="10"]')!.disabled).toBe(false);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-hour="11"]')!.disabled).toBe(true);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-minute="15"]')!.disabled).toBe(true);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-minute="30"]')!.disabled).toBe(false);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-second="0"]')!.disabled).toBe(true);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-second="15"]')!.disabled).toBe(false);
    });

    it('disables period buttons that cannot intersect the range', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '14:00',
        format: '12h',
        'min-time': '13:00',
        'max-time': '17:00'
      });
      const periods = Array.from((picker as HTMLElement).shadowRoot!.querySelectorAll<HTMLButtonElement>('.selector-column--period .selector-item'));
      expect(periods.find(button => button.textContent?.trim() === 'AM')!.disabled).toBe(true);
      expect(periods.find(button => button.textContent?.trim() === 'PM')!.disabled).toBe(false);
    });

    it('clears valid and malformed values with the existing custom event order', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { value: '14:05', step: 1 });
      const events: string[] = [];
      picker.addEventListener('timepicker-clear', () => events.push('clear'));
      picker.addEventListener('time-change', () => events.push('change'));
      picker.clear();
      picker.value = 'partial';
      picker.clear();
      expect(picker.value).toBe('');
      expect(events).toEqual(['clear', 'change', 'clear', 'change']);
    });

    it.each(['disabled', 'readonly', 'loading'] as const)('blocks every user interaction path while %s', async state => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '14:05',
        clearable: true,
        step: 1
      });
      (picker as any)[state] = true;
      await settle();
      picker.open();
      expect((picker as any).showDropdown).toBe(false);
      getInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
      getInput().value = '16:25';
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '.clear-button')!.click();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-hour="16"]')!.click();
      expect(picker.value).toBe('14:05');
      expect(getInput().value).toBe('14:05');
    });

    it('blocks every interaction path under inherited fieldset disabledness', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', {
        value: '14:05',
        clearable: true,
        step: 1
      });
      (picker as any).formDisabledCallback(true);
      await settle();
      picker.open();
      getInput().value = '16:25';
      getInput().dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '.clear-button')!.click();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-hour="16"]')!.click();
      expect(picker.value).toBe('14:05');
      expect(getInput().value).toBe('14:05');
      expect((picker as any).showDropdown).toBe(false);
    });
  });
  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/time-picker/snice-time-picker.css');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });

  describe('ARIA listbox semantics', () => {
    it('exposes every selector column list as a listbox of options', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { value: '14:30' });
      await wait(30);

      const lists = picker.shadowRoot!.querySelectorAll('.selector-list');
      expect(lists.length).toBeGreaterThanOrEqual(2);
      for (const list of lists) {
        expect(list.getAttribute('role'), 'selector list role').toBe('listbox');
      }
      const items = picker.shadowRoot!.querySelectorAll('.selector-item');
      for (const item of items) {
        expect(item.getAttribute('role'), 'selector item role').toBe('option');
        expect(item.hasAttribute('aria-selected'), 'option carries aria-selected').toBe(true);
      }
    });

    it('marks exactly one selected option per visible column', async () => {
      picker = await createComponent<SniceTimePickerElement>('snice-time-picker', { value: '14:30' });
      await wait(30);

      const lists = picker.shadowRoot!.querySelectorAll('.selector-list');
      for (const list of lists) {
        const selected = list.querySelectorAll('[aria-selected="true"]');
        expect(selected.length, 'one selection per column').toBe(1);
      }
    });
  });
});
