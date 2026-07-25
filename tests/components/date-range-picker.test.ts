import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/date-range-picker/snice-date-range-picker';
import type { SniceDateRangePickerElement } from '../../packages/components/src/date-range-picker/snice-date-range-picker.types';

describe('snice-date-range-picker', () => {
  let picker: SniceDateRangePickerElement;
  let restoreAttachInternals: (() => void) | undefined;

  const getInput = () => queryShadow<HTMLInputElement>(picker as HTMLElement, '.input')!;
  const getToggle = () => queryShadow<HTMLButtonElement>(picker as HTMLElement, '.calendar-toggle')!;
  const getClear = () => queryShadow<HTMLButtonElement>(picker as HTMLElement, '.clear-button')!;
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
    if (picker && picker.isConnected) removeComponent(picker as HTMLElement);
    document.querySelectorAll('[data-range-test]').forEach(element => element.remove());
    document.querySelectorAll('[data-range-label-test]').forEach(element => element.remove());
    restoreAttachInternals?.();
    restoreAttachInternals = undefined;
  });

    it('should render', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      expect(picker).toBeTruthy();
      expect(picker.tagName).toBe('SNICE-DATE-RANGE-PICKER');
      expect((picker as HTMLElement).tabIndex).toBe(-1);
    });

    it('preserves an authored host tabindex', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', { tabindex: 0 });
      expect((picker as HTMLElement).tabIndex).toBe(0);
    });

  describe('existing public surface and presentation', () => {
    it('retains every default property and rendered control', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');

      expect(picker).toMatchObject({
        start: '',
        end: '',
        defaultStart: '',
        defaultEnd: '',
        size: 'medium',
        variant: 'outlined',
        format: 'mm/dd/yyyy',
        placeholder: '',
        disabled: false,
        readonly: false,
        loading: false,
        required: false,
        invalid: false,
        clearable: false,
        min: '',
        max: '',
        name: '',
        columns: 1,
        firstDayOfWeek: 0,
        showCalendar: false
      });
      expect(getInput()).toBeTruthy();
      expect(getToggle()).toBeTruthy();
      expect(queryShadow(picker as HTMLElement, '.calendar')).toBeTruthy();
    });

    it.each(['small', 'medium', 'large'] as const)('retains the %s size', async size => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', { size });
      expect(getInput().classList.contains(`input--${size}`)).toBe(true);
    });

    it.each(['outlined', 'filled', 'underlined'] as const)('retains the %s variant', async variant => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', { variant });
      expect(getInput().classList.contains(`input--${variant}`)).toBe(true);
    });

    it('retains custom placeholder, invalid styling, labels, helper text, and error text', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        placeholder: 'Choose travel dates',
        label: 'Travel dates',
        invalid: true,
        required: true,
        'helper-text': 'Both dates are required',
        'error-text': 'Range unavailable'
      });

      expect(getInput().placeholder).toBe('Choose travel dates');
      expect(getInput().classList.contains('input--invalid')).toBe(true);
      expect(getInput().getAttribute('aria-invalid')).toBe('true');
      expect(queryShadow(picker as HTMLElement, '.label')?.textContent).toContain('Travel dates');
      expect(queryShadow(picker as HTMLElement, '.label')?.classList.contains('label--required')).toBe(true);
      expect(queryShadow(picker as HTMLElement, '.error-text')?.textContent).toContain('Range unavailable');
      expect(queryShadow(picker as HTMLElement, '.helper-text')).toBeNull();
    });

    it('retains helper text when no error text is authored', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        'helper-text': 'Choose check-in and check-out'
      });
      expect(queryShadow(picker as HTMLElement, '.helper-text')?.textContent).toContain('Choose check-in');
    });

    it('retains Monday-first weekday ordering', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        'first-day-of-week': 1
      });
      const headers = Array.from((picker as HTMLElement).shadowRoot!.querySelectorAll('.weekday'))
        .map(header => header.textContent);
      expect(headers).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    });

    it('retains single- and dual-column calendar rendering', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', { columns: 2 });
      picker.open();
      await settle();
      expect((picker as HTMLElement).shadowRoot!.querySelectorAll('.month')).toHaveLength(2);

      picker.columns = 1;
      await settle();
      expect((picker as HTMLElement).shadowRoot!.querySelectorAll('.month')).toHaveLength(1);
    });
  });

  describe('external label and description lifecycle', () => {
    it('uses multiple associated labels for the one range field and names its calendar group', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        id: 'labelled-range',
        label: 'Internal range',
        'helper-text': 'Choose both endpoints.'
      });
      const primary = document.createElement('label');
      primary.dataset.rangeLabelTest = 'true';
      primary.htmlFor = picker.id;
      primary.textContent = 'Booking dates';
      const secondary = document.createElement('label');
      secondary.dataset.rangeLabelTest = 'true';
      secondary.htmlFor = picker.id;
      secondary.textContent = 'required';
      picker.before(primary, secondary);
      (picker as any).labelAssociation.sync();
      await settle();

      const descriptionId = getInput().getAttribute('aria-describedby')!;
      expect(Array.from(picker.labels || [], label => label.textContent)).toEqual(['Booking dates', 'required']);
      expect(getInput().getAttribute('aria-label')).toBe('Booking dates required');
      expect(queryShadow(picker as HTMLElement, '.calendar')?.getAttribute('aria-label')).toBe('Booking dates required calendar');
      expect(queryShadow(picker as HTMLElement, `#${descriptionId}`)?.textContent).toBe('Choose both endpoints.');
      expect(picker.shadowRoot?.querySelectorAll(`#${descriptionId}`)).toHaveLength(1);
    });

    it('focuses the range field without opening its calendar on label activation', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        id: 'focus-range'
      });
      const label = document.createElement('label');
      label.dataset.rangeLabelTest = 'true';
      label.htmlFor = picker.id;
      label.textContent = 'Travel window';
      picker.before(label);
      (picker as any).labelAssociation.sync();

      picker.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

      expect(picker.shadowRoot?.activeElement).toBe(getInput());
      expect(picker.showCalendar).toBe(false);
    });

    it('switches one shared description from helper to dynamic error text', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        label: 'Booking dates',
        'helper-text': 'Choose both endpoints.'
      });
      const descriptionId = getInput().getAttribute('aria-describedby')!;
      picker.invalid = true;
      picker.errorText = 'The selected range is unavailable.';
      await settle();

      expect(getInput().getAttribute('aria-label')).toBe('Booking dates');
      expect(getInput().getAttribute('aria-invalid')).toBe('true');
      expect(queryShadow(picker as HTMLElement, `#${descriptionId}`)?.textContent).toBe('The selected range is unavailable.');
      expect(queryShadow(picker as HTMLElement, `#${descriptionId}`)?.getAttribute('role')).toBe('alert');
      expect(queryShadow(picker as HTMLElement, '.helper-text')).toBeNull();
    });
  });

  describe('all documented formats and compatibility inputs', () => {
    const formats = [
      ['mm/dd/yyyy', '03/01/2026  —  03/15/2026'],
      ['dd/mm/yyyy', '01/03/2026  —  15/03/2026'],
      ['yyyy-mm-dd', '2026-03-01  —  2026-03-15'],
      ['yyyy/mm/dd', '2026/03/01  —  2026/03/15'],
      ['dd-mm-yyyy', '01-03-2026  —  15-03-2026'],
      ['mm-dd-yyyy', '03-01-2026  —  03-15-2026'],
      ['mmmm dd, yyyy', 'March 01, 2026  —  March 15, 2026']
    ] as const;

    it.each(formats)('renders %s without rewriting live or default values', async (format, display) => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        format,
        start: '2026-03-01',
        end: '2026-03-15'
      });

      expect(getInput().value).toBe(display);
      expect(picker.start).toBe('2026-03-01');
      expect(picker.end).toBe('2026-03-15');
      expect(picker.defaultStart).toBe('2026-03-01');
      expect(picker.defaultEnd).toBe('2026-03-15');
    });

    it.each([
      ['mm/dd/yyyy', '03-01-2026', '03-15-2026', '03/01/2026  —  03/15/2026'],
      ['dd/mm/yyyy', '01-03-2026', '15-03-2026', '01/03/2026  —  15/03/2026'],
      ['yyyy/mm/dd', '2026-03-01', '2026-03-15', '2026/03/01  —  2026/03/15'],
      ['dd-mm-yyyy', '01/03/2026', '15/03/2026', '01-03-2026  —  15-03-2026'],
      ['mm-dd-yyyy', '03/01/2026', '03/15/2026', '03-01-2026  —  03-15-2026']
    ] as const)('retains alternate numeric separators for %s', async (format, start, end, display) => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', { format });
      picker.start = start;
      picker.end = end;
      await settle();

      expect(picker.start).toBe(start);
      expect(picker.end).toBe(end);
      expect(getInput().value).toBe(display);
      expect(picker.checkValidity()).toBe(true);
    });

    it('changes display format without changing live values or authored defaults', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        start: '2026-03-01',
        end: '2026-03-15'
      });
      picker.start = '2026-04-10';
      picker.end = '2026-04-20';
      picker.format = 'mmmm dd, yyyy';
      await settle();

      expect(picker.start).toBe('2026-04-10');
      expect(picker.end).toBe('2026-04-20');
      expect(picker.defaultStart).toBe('2026-03-01');
      expect(picker.defaultEnd).toBe('2026-03-15');
      expect(picker.getAttribute('start')).toBe('2026-03-01');
      expect(picker.getAttribute('end')).toBe('2026-03-15');
      expect(getInput().value).toBe('April 10, 2026  —  April 20, 2026');
    });

    it('does not reparse the untouched endpoint after a display-format change', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        format: 'dd/mm/yyyy',
        start: '11/03/2026',
        end: '21/03/2026'
      });
      picker.format = 'mmmm dd, yyyy';
      picker.end = '';

      expect(picker.start).toBe('11/03/2026');
      expect(getInput().value).toBe('March 11, 2026');
      picker.end = 'March 21, 2026';
      expect(picker.checkValidity()).toBe(true);
      expect(getInput().value).toBe('March 11, 2026  —  March 21, 2026');
    });
  });

  describe('native live/default and form lifecycle', () => {
    it('keeps authored defaults separate from dirty live values and restores them', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        start: '2026-03-01',
        end: '2026-03-15'
      });
      picker.start = '2026-04-10';
      picker.end = '2026-04-20';
      picker.setAttribute('start', '2026-05-05');
      picker.setAttribute('end', '2026-05-25');

      expect(picker.start).toBe('2026-04-10');
      expect(picker.end).toBe('2026-04-20');
      expect(picker.defaultStart).toBe('2026-05-05');
      expect(picker.defaultEnd).toBe('2026-05-25');

      (picker as any).formResetCallback();
      expect(picker.start).toBe('2026-05-05');
      expect(picker.end).toBe('2026-05-25');
      expect(getInput().value).toBe('05/05/2026  —  05/25/2026');
    });

    it('tracks both authored defaults while the live range is pristine', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      picker.defaultStart = '2026-06-01';
      picker.defaultEnd = '2026-06-30';

      expect(picker.start).toBe('2026-06-01');
      expect(picker.end).toBe('2026-06-30');

      picker.start = '2026-07-01';
      picker.end = '2026-07-31';
      picker.defaultStart = '2026-08-01';
      picker.defaultEnd = '2026-08-31';
      expect(picker.start).toBe('2026-07-01');
      expect(picker.end).toBe('2026-07-31');
    });

    it('restores exact display-format state without dispatching customer events', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        format: 'dd/mm/yyyy'
      });
      const change = vi.fn();
      picker.addEventListener('daterange-change', change);

      (picker as any).formStateRestoreCallback(JSON.stringify(['10/03/2026', '20/03/2026']), 'restore');
      expect(picker.start).toBe('10/03/2026');
      expect(picker.end).toBe('20/03/2026');
      expect(getInput().value).toBe('10/03/2026  —  20/03/2026');
      expect(change).not.toHaveBeenCalled();
    });

    it('restores FormData state and rejects malformed restoration atomically', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        name: 'trip',
        start: '2026-03-01',
        end: '2026-03-15'
      });
      const state = new FormData();
      state.append('trip-start', '2026-04-01');
      state.append('trip-end', '2026-04-30');
      (picker as any).formStateRestoreCallback(state, 'restore');
      expect([picker.start, picker.end]).toEqual(['2026-04-01', '2026-04-30']);

      for (const malformed of [null, new File([], 'range.txt'), '{}', '["only-one"]', '[1,2]', 'not-json']) {
        (picker as any).formStateRestoreCallback(malformed, 'restore');
        expect([picker.start, picker.end]).toEqual(['2026-04-01', '2026-04-30']);
      }

      const fileState = new FormData();
      fileState.append('trip-start', new File([], 'start.txt'));
      fileState.append('trip-end', '2026-05-30');
      (picker as any).formStateRestoreCallback(fileState, 'restore');
      expect([picker.start, picker.end]).toEqual(['2026-04-01', '2026-04-30']);
    });

    it('restores a partial authored default and reports its validity after reset', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        start: '2026-03-10',
        required: true
      });
      picker.start = '2026-04-10';
      picker.end = '2026-04-20';
      expect(picker.checkValidity()).toBe(true);

      (picker as any).formResetCallback();

      expect([picker.start, picker.end]).toEqual(['2026-03-10', '']);
      // Happy DOM represents the proxy message as customError; real-browser
      // coverage below asserts the native badInput/valueMissing flags exactly.
      expect(picker.validity.badInput || picker.validity.valueMissing || picker.validity.customError).toBe(true);
      expect(picker.checkValidity()).toBe(false);
    });

    it('preserves impossible authored and restored text without rolling or changing its valid peer', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        start: '2026-02-31',
        end: '2026-03-10',
        required: true
      });

      expect([picker.start, picker.end]).toEqual(['2026-02-31', '2026-03-10']);
      expect([(picker as any).startDate, (picker as any).toCanonicalDate((picker as any).endDate)])
        .toEqual([null, '2026-03-10']);
      expect(getInput().value).toBe('');
      expect(picker.checkValidity()).toBe(false);

      picker.start = '2026-04-01';
      picker.end = '2026-04-10';
      (picker as any).formResetCallback();
      expect([picker.start, picker.end]).toEqual(['2026-02-31', '2026-03-10']);
      expect((picker as any).startDate).toBeNull();
      expect((picker as any).toCanonicalDate((picker as any).endDate)).toBe('2026-03-10');

      (picker as any).formStateRestoreCallback(
        JSON.stringify(['2024-02-30', '2024-02-29']),
        'restore'
      );
      expect([picker.start, picker.end]).toEqual(['2024-02-30', '2024-02-29']);
      expect((picker as any).startDate).toBeNull();
      expect((picker as any).toCanonicalDate((picker as any).endDate)).toBe('2024-02-29');
      expect(picker.checkValidity()).toBe(false);
    });

    it('submits the preserved two-field shape with canonical values', async () => {
      const { setFormValue } = installInternalsMock();
      const form = document.createElement('form');
      form.dataset.rangeTest = 'true';
      document.body.appendChild(form);
      picker = document.createElement('snice-date-range-picker') as SniceDateRangePickerElement;
      picker.setAttribute('name', 'trip');
      picker.setAttribute('format', 'dd/mm/yyyy');
      picker.setAttribute('start', '10/03/2026');
      picker.setAttribute('end', '20/03/2026');
      form.appendChild(picker);
      await (picker as any).ready;
      picker.start = picker.start;
      picker.end = picker.end;

      const submitted = setFormValue.mock.calls.at(-1)?.[0] as FormData;
      expect(Array.from(submitted.entries())).toEqual([
        ['trip-start', '2026-03-10'],
        ['trip-end', '2026-03-20']
      ]);
    });

    it('submits explicit empty endpoints for an optional empty range', async () => {
      const { setFormValue } = installInternalsMock();
      const form = document.createElement('form');
      form.dataset.rangeTest = 'true';
      document.body.appendChild(form);
      picker = document.createElement('snice-date-range-picker') as SniceDateRangePickerElement;
      picker.setAttribute('name', 'optional');
      form.appendChild(picker);
      await (picker as any).ready;
      picker.name = '';
      picker.name = 'optional';

      const submitted = setFormValue.mock.calls.at(-1)?.[0] as FormData;
      expect(Array.from(submitted.entries())).toEqual([
        ['optional-start', ''],
        ['optional-end', '']
      ]);
    });

    it('never submits malformed endpoint text as a valid date', async () => {
      const { internals, setFormValue } = installInternalsMock();
      const form = document.createElement('form');
      form.dataset.rangeTest = 'true';
      document.body.appendChild(form);
      picker = document.createElement('snice-date-range-picker') as SniceDateRangePickerElement;
      form.appendChild(picker);
      await (picker as any).ready;
      picker.name = 'trip';
      picker.start = 'not-a-date';
      picker.end = '2026-03-20';

      const submitted = setFormValue.mock.calls.at(-1)?.[0] as FormData;
      expect(Array.from(submitted.entries())).toEqual([
        ['trip-start', ''],
        ['trip-end', '2026-03-20']
      ]);
      expect(internals.setValidity.mock.calls.at(-1)?.[0]).toMatchObject({ badInput: true });
    });

    it('updates submission keys when name changes and removes them without a name', async () => {
      const { setFormValue } = installInternalsMock();
      const form = document.createElement('form');
      form.dataset.rangeTest = 'true';
      document.body.appendChild(form);
      picker = document.createElement('snice-date-range-picker') as SniceDateRangePickerElement;
      form.appendChild(picker);
      await (picker as any).ready;
      picker.start = '2026-03-01';
      picker.end = '2026-03-15';
      expect(setFormValue.mock.calls.at(-1)?.[0]).toBeNull();

      picker.name = 'window';
      const named = setFormValue.mock.calls.at(-1)?.[0] as FormData;
      expect(Array.from(named.keys())).toEqual(['window-start', 'window-end']);
      picker.name = '';
      expect(setFormValue.mock.calls.at(-1)?.[0]).toBeNull();
    });

    it('exposes form ownership, validation state, messages, and labels', async () => {
      const form = document.createElement('form');
      form.id = 'range-owner';
      form.dataset.rangeTest = 'true';
      const label = document.createElement('label');
      label.dataset.rangeTest = 'true';
      label.htmlFor = 'owned-range';
      document.body.append(form, label);
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', { required: true });
      picker.id = 'owned-range';
      picker.setAttribute('form', 'range-owner');

      expect(picker.form).toBe(form);
      expect(picker.validity).toBeTruthy();
      expect(typeof picker.validationMessage).toBe('string');
      expect(picker.willValidate).toBe(true);
      expect(picker.labels?.length ?? 0).toBeGreaterThanOrEqual(0);
    });

    it('keeps fieldset disabledness separate from authored disabled and re-enables cleanly', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        start: '2026-03-01',
        end: '2026-03-15',
        clearable: true
      });
      picker.open();
      (picker as any).formDisabledCallback(true);

      expect(picker.disabled).toBe(false);
      expect(picker.hasAttribute('disabled')).toBe(false);
      expect(picker.showCalendar).toBe(false);
      expect(getInput().disabled).toBe(true);
      expect(getToggle().disabled).toBe(true);
      expect(getClear().style.display).toBe('none');
      expect(picker.willValidate).toBe(false);

      (picker as any).formDisabledCallback(false);
      expect(getInput().disabled).toBe(false);
      expect(getToggle().disabled).toBe(false);
      expect(picker.willValidate).toBe(true);
    });
  });

  describe('range constraint validation', () => {
    it('round-trips every month end and Gregorian leap-year boundary in local calendar space', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      const accepted = [
        '2026-01-31', '2026-02-28', '2024-02-29', '2000-02-29',
        '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30',
        '2026-07-31', '2026-08-31', '2026-09-30', '2026-10-31',
        '2026-11-30', '2026-12-31'
      ];

      for (const value of accepted) {
        picker.start = value;
        picker.end = value;
        expect(picker.checkValidity(), value).toBe(true);
        expect((picker as any).toCanonicalDate((picker as any).startDate), value).toBe(value);
        expect((picker as any).toCanonicalDate((picker as any).endDate), value).toBe(value);
      }
    });

    it('rejects every calendar rollover boundary without mutating the other endpoint', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      const rejected = [
        '2026-01-32', '2026-02-29', '1900-02-29', '2024-02-30',
        '2026-03-32', '2026-04-31', '2026-05-32', '2026-06-31',
        '2026-07-32', '2026-08-32', '2026-09-31', '2026-10-32',
        '2026-11-31', '2026-12-32', '2026-00-10', '2026-13-01',
        '2026-01-00'
      ];

      for (const value of rejected) {
        picker.start = value;
        picker.end = '2026-12-31';

        expect(picker.start, value).toBe(value);
        expect(picker.end, value).toBe('2026-12-31');
        expect((picker as any).startDate, value).toBeNull();
        expect((picker as any).toCanonicalDate((picker as any).endDate), value).toBe('2026-12-31');
        expect(picker.checkValidity(), value).toBe(false);
        expect(picker.validity.badInput || picker.validity.customError, value).toBe(true);
        expect(getInput().value, value).toBe('');
      }
    });

    it.each([
      ['mm/dd/yyyy', '02/29/2026', '02/29/2024'],
      ['dd/mm/yyyy', '29/02/2026', '29/02/2024'],
      ['yyyy/mm/dd', '2026/02/29', '2024/02/29'],
      ['dd-mm-yyyy', '29-02-2026', '29-02-2024'],
      ['mm-dd-yyyy', '02-29-2026', '02-29-2024'],
      ['mmmm dd, yyyy', 'February 29, 2026', 'February 29, 2024']
    ] as const)('validates leap days strictly in %s', async (format, rejected, accepted) => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', { format });
      picker.start = rejected;
      picker.end = accepted;
      expect((picker as any).startDate).toBeNull();
      expect((picker as any).endDate).not.toBeNull();
      expect(picker.checkValidity()).toBe(false);

      picker.start = accepted;
      expect(picker.checkValidity()).toBe(true);
      expect([picker.start, picker.end]).toEqual([accepted, accepted]);
    });

    it('distinguishes optional empty, required empty, and partial ranges', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      expect(picker.checkValidity()).toBe(true);

      picker.required = true;
      expect(picker.checkValidity()).toBe(false);
      expect(picker.validity.valueMissing || picker.validity.customError).toBe(true);

      picker.start = '2026-03-01';
      expect(picker.checkValidity()).toBe(false);
      expect(picker.validity.badInput || picker.validity.customError).toBe(true);

      picker.end = '2026-03-15';
      expect(picker.checkValidity()).toBe(true);
    });

    it.each([
      ['not-a-date', '2026-03-15'],
      ['2026-03-01', 'not-a-date'],
      ['not-a-date', 'also-not-a-date']
    ])('rejects malformed endpoint pair %s / %s', async (start, end) => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      picker.start = start;
      picker.end = end;
      expect(picker.checkValidity()).toBe(false);
      expect(picker.validity.badInput || picker.validity.customError).toBe(true);
      expect([picker.start, picker.end]).toEqual([start, end]);
    });

    it('marks a reversed property range invalid without rewriting either endpoint', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      picker.start = '2026-03-20';
      picker.end = '2026-03-10';

      expect(picker.checkValidity()).toBe(false);
      expect(picker.validity.customError).toBe(true);
      expect(picker.validationMessage).toContain('End date');
      expect([picker.start, picker.end]).toEqual(['2026-03-20', '2026-03-10']);
    });

    it('enforces min and max against both endpoints and permits boundaries', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        min: '2026-03-10',
        max: '2026-03-20'
      });
      picker.start = '2026-03-09';
      picker.end = '2026-03-15';
      expect(picker.checkValidity()).toBe(false);
      expect(picker.validity.rangeUnderflow || picker.validity.customError).toBe(true);

      picker.start = '2026-03-10';
      picker.end = '2026-03-20';
      expect(picker.checkValidity()).toBe(true);

      picker.end = '2026-03-21';
      expect(picker.checkValidity()).toBe(false);
      expect(picker.validity.rangeOverflow || picker.validity.customError).toBe(true);
    });

    it('retains display-formatted min and max compatibility', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        format: 'dd/mm/yyyy',
        min: '10/03/2026',
        max: '20/03/2026'
      });
      picker.start = '10/03/2026';
      picker.end = '20/03/2026';
      expect(picker.checkValidity()).toBe(true);
      picker.end = '21/03/2026';
      expect(picker.checkValidity()).toBe(false);
    });

    it('ignores impossible min and max constraints instead of accepting their rolled dates', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        min: '2026-02-31',
        max: '2026-04-31'
      });
      picker.start = '2026-03-01';
      picker.end = '2026-05-02';

      expect(picker.checkValidity()).toBe(true);
      expect(picker.validity.rangeUnderflow).toBe(false);
      expect(picker.validity.rangeOverflow).toBe(false);
    });

    it('reacts immediately when required, min, and max change', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      picker.start = '2026-03-10';
      picker.end = '2026-03-20';
      expect(picker.checkValidity()).toBe(true);
      picker.min = '2026-03-11';
      expect(picker.checkValidity()).toBe(false);
      picker.min = '';
      picker.max = '2026-03-19';
      expect(picker.checkValidity()).toBe(false);
      picker.max = '';
      expect(picker.checkValidity()).toBe(true);
      picker.clear();
      picker.required = true;
      expect(picker.checkValidity()).toBe(false);
    });

    it('sets, replaces, and clears custom validity without losing the range', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        start: '2026-03-10',
        end: '2026-03-20'
      });
      picker.setCustomValidity('Booking window is closed');
      expect(picker.checkValidity()).toBe(false);
      expect(picker.validationMessage).toContain('Booking window is closed');
      expect([picker.start, picker.end]).toEqual(['2026-03-10', '2026-03-20']);
      picker.setCustomValidity('');
      expect(picker.checkValidity()).toBe(true);
    });

    it.each(['disabled', 'readonly', 'loading'] as const)('bars %s controls from validation without clearing values', async state => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', { required: true });
      (picker as any)[state] = true;
      await settle();
      expect(picker.checkValidity()).toBe(true);
      expect(picker.willValidate).toBe(false);
      expect([picker.start, picker.end]).toEqual(['', '']);
      expect(getInput().disabled).toBe(state !== 'readonly');
      expect(getToggle().disabled).toBe(true);
    });
  });

  describe('calendar, presets, events, and public methods', () => {
    beforeEach(async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        clearable: true
      });
    });

    it('opens from input, toggle, keyboard, and method and closes with Escape and close()', async () => {
      getInput().dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      expect(picker.showCalendar).toBe(true);
      picker.close();
      expect(picker.showCalendar).toBe(false);

      getToggle().dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      expect(picker.showCalendar).toBe(true);
      getToggle().dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      expect(picker.showCalendar).toBe(false);

      getInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
      expect(picker.showCalendar).toBe(true);
      getInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
      expect(picker.showCalendar).toBe(false);

      getInput().dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, composed: true }));
      expect(picker.showCalendar).toBe(true);
      picker.close();
      picker.open();
      expect(picker.showCalendar).toBe(true);
    });

    it.each(['disabled', 'readonly', 'loading'] as const)('does not open while %s', async state => {
      (picker as any)[state] = true;
      await settle();
      picker.open();
      expect(picker.showCalendar).toBe(false);
      getInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
      expect(picker.showCalendar).toBe(false);
    });

    it('selects a complete range through the real two-click calendar path', async () => {
      picker.start = '2026-03-01';
      picker.end = '2026-03-15';
      picker.open();
      await settle();
      const change = vi.fn();
      picker.addEventListener('daterange-change', change);

      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-05"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      expect([picker.start, picker.end]).toEqual(['03/05/2026', '']);
      expect(picker.checkValidity()).toBe(false);
      expect(picker.showCalendar).toBe(true);

      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-12"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      expect([picker.start, picker.end]).toEqual(['03/05/2026', '03/12/2026']);
      expect(picker.checkValidity()).toBe(true);
      expect(picker.showCalendar).toBe(false);
      expect(change).toHaveBeenCalledTimes(1);
      expect(change.mock.calls[0][0].detail).toMatchObject({
        startIso: '2026-03-05',
        endIso: '2026-03-12'
      });
    });

    it('retains the earlier-second-click behavior by restarting the start endpoint', async () => {
      picker.start = '2026-03-10';
      picker.end = '2026-03-20';
      picker.open();
      await settle();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-15"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-05"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      expect([picker.start, picker.end]).toEqual(['03/05/2026', '']);
      expect(picker.showCalendar).toBe(true);
    });

    it('preserves selectRange normalization, display, best-month view, and change detail', async () => {
      const change = vi.fn();
      picker.addEventListener('daterange-change', change);
      picker.selectRange(new Date(2026, 3, 20), new Date(2026, 2, 10));

      expect([picker.start, picker.end]).toEqual(['03/10/2026', '04/20/2026']);
      expect(getInput().value).toBe('03/10/2026  —  04/20/2026');
      expect(picker.checkValidity()).toBe(true);
      expect(change).toHaveBeenCalledTimes(1);
      expect(change.mock.calls[0][0].detail).toMatchObject({
        start: '03/10/2026',
        end: '04/20/2026',
        startIso: '2026-03-10',
        endIso: '2026-04-20'
      });
      expect(change.mock.calls[0][0].detail.dateRangePicker).toBe(picker);
    });

    it('ignores invalid selectRange dates atomically without emitting change', async () => {
      picker.start = '2026-03-10';
      picker.end = '2026-03-20';
      const change = vi.fn();
      picker.addEventListener('daterange-change', change);

      picker.selectRange(new Date(Number.NaN), new Date(2026, 2, 25));
      picker.selectRange(new Date(2026, 2, 5), new Date(Number.NaN));

      expect([picker.start, picker.end]).toEqual(['2026-03-10', '2026-03-20']);
      expect(getInput().value).toBe('03/10/2026  —  03/20/2026');
      expect(change).not.toHaveBeenCalled();
    });

    it('recovers safely when the live start becomes invalid between calendar clicks', async () => {
      picker.start = '2026-03-10';
      picker.end = '2026-03-20';
      picker.open();
      await settle();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-12"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      picker.start = 'not-a-date';

      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-18"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

      expect([picker.start, picker.end]).toEqual(['03/18/2026', '']);
      expect(picker.showCalendar).toBe(true);
      expect(picker.checkValidity()).toBe(false);
    });

    it('ignores presets containing invalid Date instances without closing or emitting', async () => {
      picker.presets = [{ label: 'Invalid', start: new Date(Number.NaN), end: new Date(2026, 2, 20) }];
      const preset = vi.fn();
      const change = vi.fn();
      picker.addEventListener('daterange-preset', preset);
      picker.addEventListener('daterange-change', change);
      picker.open();
      await settle();

      const presetButton = queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-preset="0"]')!;
      presetButton.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, composed: true }));
      presetButton.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

      expect([picker.start, picker.end]).toEqual(['', '']);
      expect(picker.showCalendar).toBe(true);
      expect(preset).not.toHaveBeenCalled();
      expect(change).not.toHaveBeenCalled();
    });

    it('ignores presets containing impossible date strings without previewing, mutating, or emitting', async () => {
      picker.start = '2026-03-10';
      picker.end = '2026-03-20';
      picker.presets = [{ label: 'Rolled', start: '2026-02-31', end: '2026-03-20' }];
      const preset = vi.fn();
      const change = vi.fn();
      picker.addEventListener('daterange-preset', preset);
      picker.addEventListener('daterange-change', change);
      picker.open();
      await settle();

      const presetButton = queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-preset="0"]')!;
      presetButton.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, composed: true }));
      expect((picker as any).presetPreviewStart).toBeNull();
      expect((picker as any).presetPreviewEnd).toBeNull();
      presetButton.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

      expect([picker.start, picker.end]).toEqual(['2026-03-10', '2026-03-20']);
      expect(picker.showCalendar).toBe(true);
      expect(preset).not.toHaveBeenCalled();
      expect(change).not.toHaveBeenCalled();
    });

    it('clears complete, partial, and malformed states with the existing event order', async () => {
      const order: string[] = [];
      picker.addEventListener('daterange-clear', () => order.push('clear'));
      picker.addEventListener('daterange-change', () => order.push('change'));
      for (const [start, end] of [
        ['2026-03-01', '2026-03-15'],
        ['2026-03-01', ''],
        ['bad-start', 'bad-end']
      ]) {
        picker.start = start;
        picker.end = end;
        picker.clear();
        expect([picker.start, picker.end]).toEqual(['', '']);
      }
      expect(order).toEqual(['clear', 'change', 'clear', 'change', 'clear', 'change']);
    });

    it('shows clear only for usable interaction states and preserves values while blocked', async () => {
      picker.start = '2026-03-01';
      await settle();
      expect(getClear().style.display).not.toBe('none');

      picker.readonly = true;
      await settle();
      await wait(10);
      expect(picker.readonly).toBe(true);
      expect(getClear().style.display).toBe('none');
      picker.readonly = false;
      picker.loading = true;
      await settle();
      await wait(10);
      expect(getClear().style.display).toBe('none');
      expect(picker.start).toBe('2026-03-01');
    });

    it('disables out-of-range days while leaving both boundaries selectable', async () => {
      picker.min = '2026-03-10';
      picker.max = '2026-03-20';
      picker.start = '2026-03-15';
      picker.end = '2026-03-16';
      picker.open();
      await settle();

      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-09"]')!.disabled).toBe(true);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-10"]')!.disabled).toBe(false);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-20"]')!.disabled).toBe(false);
      expect(queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-21"]')!.disabled).toBe(true);
    });

    it('retains hover range preview and clears it on calendar mouseout', async () => {
      picker.start = '2026-03-10';
      picker.end = '2026-03-20';
      picker.open();
      await settle();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-10"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      const hover = queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-date="2026-03-15"]')!;
      hover.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, composed: true }));
      await settle();
      expect(queryShadow(picker as HTMLElement, '[data-date="2026-03-15"]')?.classList.contains('day--range-preview')).toBe(true);
      queryShadow(picker as HTMLElement, '.calendar')!
        .dispatchEvent(new MouseEvent('mouseout', { bubbles: true, composed: true }));
      await settle();
      expect(queryShadow(picker as HTMLElement, '[data-date="2026-03-15"]')?.classList.contains('day--range-preview')).toBe(false);
    });

    it('selects Date and string presets and emits daterange-preset', async () => {
      picker.presets = [
        { label: 'March', start: new Date(2026, 2, 1), end: new Date(2026, 2, 31) },
        { label: 'April', start: '2026-04-01', end: '2026-04-30' }
      ];
      await settle();
      const preset = vi.fn();
      picker.addEventListener('daterange-preset', preset);
      picker.open();
      await settle();
      expect((picker as HTMLElement).shadowRoot!.querySelectorAll('[data-preset]')).toHaveLength(2);

      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-preset="1"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      expect([picker.start, picker.end]).toEqual(['04/01/2026', '04/30/2026']);
      expect(preset).toHaveBeenCalledTimes(1);
      expect(preset.mock.calls[0][0].detail).toMatchObject({ label: 'April' });
    });

    it('previews reversed presets in chronological order without mutating them', async () => {
      const authored = { label: 'Reverse', start: '2026-03-20', end: '2026-03-10' };
      picker.start = '2026-03-01';
      picker.end = '2026-03-02';
      picker.presets = [authored];
      await settle();
      const presetButton = queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-preset="0"]')!;
      presetButton.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, composed: true }));
      await settle();
      expect(queryShadow(picker as HTMLElement, '[data-date="2026-03-10"]')?.classList.contains('day--preset-preview-endpoint')).toBe(true);
      expect(queryShadow(picker as HTMLElement, '[data-date="2026-03-20"]')?.classList.contains('day--preset-preview-endpoint')).toBe(true);
      expect(authored).toEqual({ label: 'Reverse', start: '2026-03-20', end: '2026-03-10' });
    });

    it('retains month, year-range, year selection, and Today navigation', async () => {
      picker.start = '2026-03-10';
      picker.end = '2026-03-20';
      picker.open();
      await settle();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-nav="next-month"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await settle();
      expect(queryShadow(picker as HTMLElement, '.month-label')?.textContent).toContain('April');

      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-nav="show-years"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await settle();
      expect((picker as HTMLElement).shadowRoot!.querySelectorAll('[data-year]')).toHaveLength(12);
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-nav="next-years"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await settle();
      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-year="2030"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await settle();
      expect(queryShadow(picker as HTMLElement, '.year-button')?.textContent).toBe('2030');

      queryShadow<HTMLButtonElement>(picker as HTMLElement, '[data-nav="today"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await settle();
      const today = new Date();
      expect(queryShadow(picker as HTMLElement, '.year-button')?.textContent).toBe(String(today.getFullYear()));
    });

    it('retains focus, blur, open, close, focus/blur events, and open/close events', async () => {
      const events: string[] = [];
      for (const name of ['daterange-focus', 'daterange-blur', 'daterange-open', 'daterange-close']) {
        picker.addEventListener(name, () => events.push(name));
      }
      picker.focus();
      getInput().dispatchEvent(new FocusEvent('focus'));
      picker.open();
      picker.close();
      getInput().dispatchEvent(new FocusEvent('blur'));
      picker.blur();
      expect(events).toContain('daterange-focus');
      expect(events).toContain('daterange-open');
      expect(events).toContain('daterange-close');
      expect(events).toContain('daterange-blur');
    });
  });

  describe('@reconnect: outside-click closes calendar after reconnect', () => {
    it('outside-click closes the calendar on first connect', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      (picker as any).showCalendar = true;
      await wait(20);

      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((picker as any).showCalendar).toBe(false);
    });

    it('outside-click still closes the calendar after disconnect+reconnect', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      const parent = picker.parentNode!;

      parent.removeChild(picker);
      await wait(20);
      parent.appendChild(picker);
      await wait(20);

      (picker as any).showCalendar = true;
      await wait(20);
      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((picker as any).showCalendar).toBe(false);
    });

    it('does NOT respond to clicks after final dispose', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      (picker as any).showCalendar = true;
      await wait(20);

      const parent = picker.parentNode!;
      parent.removeChild(picker);
      await wait(20);

      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((picker as any).showCalendar).toBe(true);
    });

    it('document click listener is balanced across reconnect (not double-attached)', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');

      let net = 0;
      const origAdd = document.addEventListener;
      const origRemove = document.removeEventListener;
      document.addEventListener = ((type: string, h: any, opts?: any) => {
        if (type === 'click') net++;
        return (origAdd as any).call(document, type, h, opts);
      }) as any;
      document.removeEventListener = ((type: string, h: any, opts?: any) => {
        if (type === 'click') net--;
        return (origRemove as any).call(document, type, h, opts);
      }) as any;

      const parent = picker.parentNode!;
      const baseline = net;

      parent.removeChild(picker);
      await wait(20);
      const afterDispose = net;

      parent.appendChild(picker);
      await wait(20);
      const afterReconnect = net;

      document.addEventListener = origAdd;
      document.removeEventListener = origRemove;

      expect(afterDispose).toBeLessThan(baseline);
      expect(afterReconnect).toBe(baseline);
    });

    it('repositions an open popup on viewport changes and removes those listeners on dispose', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      const position = vi.spyOn(picker as any, 'positionCalendar');
      (picker as any).showCalendar = true;
      await settle();
      position.mockClear();

      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('scroll'));
      expect(position).toHaveBeenCalledTimes(2);

      const parent = picker.parentNode!;
      parent.removeChild(picker);
      await wait(20);
      position.mockClear();
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('scroll'));
      expect(position).not.toHaveBeenCalled();
    });
  });

  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/date-range-picker/snice-date-range-picker.css');

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

  describe('ARIA grid semantics', () => {
    it('exposes both month panels as grids of gridcells', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', { columns: 2 });
      (picker as any).showCalendar = true;
      await wait(30);

      const grids = picker.shadowRoot!.querySelectorAll('.calendar-days[role="grid"]');
      expect(grids.length).toBe(2);
      const cells = picker.shadowRoot!.querySelectorAll('.calendar-days [role="gridcell"]');
      const dayEls = picker.shadowRoot!.querySelectorAll('.calendar-days .day');
      expect(cells.length).toBe(dayEls.length);
    });

    it('marks range endpoints and in-range days aria-selected, today aria-current', async () => {
      const y = new Date().getFullYear() + 1;
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker', {
        start: `${y}-03-10`,
        end: `${y}-03-12`,
      });
      (picker as any).viewDate = new Date(y, 2, 1);
      (picker as any).showCalendar = true;
      await wait(30);

      const selected = picker.shadowRoot!.querySelectorAll('.calendar-days [aria-selected="true"]');
      expect(selected.length).toBe(3);

      removeComponent(picker as HTMLElement);
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      (picker as any).showCalendar = true;
      await wait(30);
      const current = picker.shadowRoot!.querySelectorAll('.calendar-days [aria-current="date"]');
      expect(current.length).toBe(1);
    });
  });
});