import React, { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../packages/components/src/date-range-picker/snice-date-range-picker';
import { DateRangePicker } from '../../adapters/react/date-range-picker';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('React date-range-picker native state adapter', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(async () => {
    if (root) await act(async () => root!.unmount());
    container?.remove();
    root = null;
    container = null;
  });

  it('keeps both live strings separate from reset defaults and forwards range events', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const ref = createRef<any>();
    const onDaterangeChange = vi.fn();

    await act(async () => {
      root!.render(
        <DateRangePicker
          ref={ref}
          start="12/03/2026"
          end="22/03/2026"
          defaultStart="2026-03-10"
          defaultEnd="2026-03-20"
          format="dd/mm/yyyy"
          name="booking"
          onDaterangeChange={onDaterangeChange}
        />
      );
    });

    const picker = ref.current.element as any;
    await act(async () => {
      await picker.ready;
      await picker.rendered;
    });
    expect([picker.start, picker.end]).toEqual(['12/03/2026', '22/03/2026']);
    expect([picker.defaultStart, picker.defaultEnd]).toEqual(['2026-03-10', '2026-03-20']);
    expect([picker.getAttribute('start'), picker.getAttribute('end')]).toEqual(['2026-03-10', '2026-03-20']);
    expect(picker.shadowRoot.querySelector('.input').value).toBe('12/03/2026  —  22/03/2026');
    expect(picker.name).toBe('booking');

    await act(async () => {
      root!.render(
        <DateRangePicker
          ref={ref}
          start="March 14, 2026"
          end="March 24, 2026"
          defaultStart="2026-03-10"
          defaultEnd="2026-03-20"
          format="mmmm dd, yyyy"
          name="booking"
          onDaterangeChange={onDaterangeChange}
        />
      );
      await picker.rendered;
    });
    expect([picker.start, picker.end]).toEqual(['March 14, 2026', 'March 24, 2026']);
    expect([picker.defaultStart, picker.defaultEnd]).toEqual(['2026-03-10', '2026-03-20']);
    expect([picker.getAttribute('start'), picker.getAttribute('end')]).toEqual(['2026-03-10', '2026-03-20']);
    expect(picker.shadowRoot.querySelector('.input').value).toBe('March 14, 2026  —  March 24, 2026');

    const detail = {
      start: 'March 14, 2026',
      end: 'March 24, 2026',
      startDate: new Date(2026, 2, 14),
      endDate: new Date(2026, 2, 24),
      startIso: '2026-03-14',
      endIso: '2026-03-24',
      dateRangePicker: picker
    };
    picker.dispatchEvent(new CustomEvent('daterange-change', { detail }));
    expect(onDaterangeChange).toHaveBeenCalledTimes(1);
    expect(onDaterangeChange.mock.calls[0][0].detail).toBe(detail);
  });
});
