import React, { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../packages/components/src/time-picker/snice-time-picker';
import { TimePicker } from '../../adapters/react/time-picker';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('React time-picker native state adapter', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(async () => {
    if (root) await act(async () => root!.unmount());
    container?.remove();
    root = null;
    container = null;
  });

  it('keeps live time separate from the reset default and forwards events', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const ref = createRef<any>();
    const onTimeChange = vi.fn();

    await act(async () => {
      root!.render(
        <TimePicker
          ref={ref}
          value="14:30"
          defaultValue="09:15"
          format="12h"
          step={5}
          name="appointment"
          onTimeChange={onTimeChange}
        />
      );
    });

    const picker = ref.current.element as any;
    await act(async () => {
      await picker.ready;
      await picker.rendered;
    });
    expect(picker.value).toBe('14:30');
    expect(picker.defaultValue).toBe('09:15');
    expect(picker.getAttribute('value')).toBe('09:15');
    expect(picker.shadowRoot.querySelector('.input').value).toBe('2:30 PM');
    expect(picker.name).toBe('appointment');

    await act(async () => {
      root!.render(
        <TimePicker
          ref={ref}
          value="16:45:30"
          defaultValue="09:15"
          format="24h"
          step={5}
          showSeconds
          name="appointment"
          onTimeChange={onTimeChange}
        />
      );
      await picker.rendered;
    });
    expect(picker.value).toBe('16:45:30');
    expect(picker.defaultValue).toBe('09:15');
    expect(picker.getAttribute('value')).toBe('09:15');
    expect(picker.shadowRoot.querySelector('.input').value).toBe('16:45:30');

    const detail = {
      value: '16:45:30',
      hours: 16,
      minutes: 45,
      seconds: 30,
      formatted: '16:45:30',
      timePicker: picker
    };
    picker.dispatchEvent(new CustomEvent('time-change', { detail }));
    expect(onTimeChange).toHaveBeenCalledTimes(1);
    expect(onTimeChange.mock.calls[0][0].detail).toBe(detail);
  });
});
