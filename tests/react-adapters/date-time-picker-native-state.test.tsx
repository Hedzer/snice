import React, { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../packages/components/src/date-time-picker/snice-date-time-picker';
import { DateTimePicker } from '../../adapters/react/date-time-picker';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('React date-time-picker native state adapter', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(async () => {
    if (root) await act(async () => root!.unmount());
    container?.remove();
    root = null;
    container = null;
  });

  it('keeps the live local date-time separate from the reset default and forwards events', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const ref = createRef<any>();
    const onDatetimeChange = vi.fn();

    await act(async () => {
      root!.render(
        <DateTimePicker
          ref={ref}
          value="2026-03-15T14:30"
          defaultValue="2026-03-10T09:15"
          dateFormat="dd/mm/yyyy"
          timeFormat="12h"
          name="appointment"
          onDatetimeChange={onDatetimeChange}
        />
      );
    });

    const picker = ref.current.element as any;
    await act(async () => {
      await picker.ready;
      await picker.rendered;
    });
    expect(picker.value).toBe('2026-03-15T14:30');
    expect(picker.defaultValue).toBe('2026-03-10T09:15');
    expect(picker.getAttribute('value')).toBe('2026-03-10T09:15');
    expect(picker.shadowRoot.querySelector('.input').value).toBe('15/03/2026 2:30 PM');
    expect(picker.name).toBe('appointment');

    await act(async () => {
      root!.render(
        <DateTimePicker
          ref={ref}
          value="2026-03-20T16:45:30"
          defaultValue="2026-03-10T09:15"
          dateFormat="mmmm dd, yyyy"
          timeFormat="24h"
          showSeconds
          name="appointment"
          onDatetimeChange={onDatetimeChange}
        />
      );
      await picker.rendered;
    });
    expect(picker.value).toBe('2026-03-20T16:45:30');
    expect(picker.defaultValue).toBe('2026-03-10T09:15');
    expect(picker.getAttribute('value')).toBe('2026-03-10T09:15');
    expect(picker.shadowRoot.querySelector('.input').value).toBe('March 20, 2026 16:45:30');

    const detail = {
      value: '2026-03-20T16:45:30',
      date: new Date(2026, 2, 20, 16, 45, 30),
      formatted: 'March 20, 2026 16:45:30',
      dateTimePicker: picker
    };
    picker.dispatchEvent(new CustomEvent('datetime-change', { detail }));
    expect(onDatetimeChange).toHaveBeenCalledTimes(1);
    expect(onDatetimeChange.mock.calls[0][0].detail).toBe(detail);
  });
});
