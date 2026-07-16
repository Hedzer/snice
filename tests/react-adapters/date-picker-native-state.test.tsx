import React, { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../packages/components/src/date-picker/snice-date-picker';
import { DatePicker } from '../../adapters/react/date-picker';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('React date-picker native state adapter', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(async () => {
    if (root) await act(async () => root!.unmount());
    container?.remove();
    root = null;
    container = null;
  });

  it('keeps the live canonical value separate from the reset default and forwards events', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const ref = createRef<any>();
    const onDatepickerChange = vi.fn();

    await act(async () => {
      root!.render(
        <DatePicker
          ref={ref}
          value="2026-03-15"
          defaultValue="2026-03-10"
          format="dd/mm/yyyy"
          name="delivery-date"
          onDatepickerChange={onDatepickerChange}
        />
      );
    });

    const picker = ref.current.element as any;
    await act(async () => {
      await picker.ready;
      await picker.rendered;
    });
    expect(picker.value).toBe('2026-03-15');
    expect(picker.defaultValue).toBe('2026-03-10');
    expect(picker.getAttribute('value')).toBe('2026-03-10');
    expect(picker.shadowRoot.querySelector('.input').value).toBe('15/03/2026');
    expect(picker.name).toBe('delivery-date');

    await act(async () => {
      root!.render(
        <DatePicker
          ref={ref}
          value="2026-03-20"
          defaultValue="2026-03-10"
          format="mmmm dd, yyyy"
          name="delivery-date"
          onDatepickerChange={onDatepickerChange}
        />
      );
      await picker.rendered;
    });
    expect(picker.value).toBe('2026-03-20');
    expect(picker.defaultValue).toBe('2026-03-10');
    expect(picker.getAttribute('value')).toBe('2026-03-10');
    expect(picker.shadowRoot.querySelector('.input').value).toBe('March 20, 2026');

    const detail = {
      value: '2026-03-20',
      date: new Date(2026, 2, 20),
      formatted: 'March 20, 2026',
      iso: '2026-03-20',
      datePicker: picker
    };
    picker.dispatchEvent(new CustomEvent('datepicker-change', { detail }));
    expect(onDatepickerChange).toHaveBeenCalledTimes(1);
    expect(onDatepickerChange.mock.calls[0][0].detail).toBe(detail);
  });
});
