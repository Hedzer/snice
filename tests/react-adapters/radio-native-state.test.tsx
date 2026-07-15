import React, { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../packages/components/src/radio/snice-radio';
import { Radio } from '../../adapters/react/radio';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('React radio native state adapter', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(async () => {
    if (root) await act(async () => root!.unmount());
    container?.remove();
    root = null;
    container = null;
  });

  it('writes checked as live state without rewriting the reset default and forwards events', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const ref = createRef<any>();
    const onRadioChange = vi.fn();

    await act(async () => {
      root!.render(
        <Radio
          ref={ref}
          checked={true}
          defaultChecked={false}
          name="plan"
          value="pro"
          onRadioChange={onRadioChange}
        />
      );
    });

    const radio = ref.current.element as any;
    await act(async () => {
      await radio.ready;
      await radio.rendered;
    });
    expect(radio.checked).toBe(true);
    expect(radio.defaultChecked).toBe(false);
    expect(radio.hasAttribute('checked')).toBe(false);
    expect(radio.name).toBe('plan');
    expect(radio.value).toBe('pro');

    await act(async () => {
      root!.render(
        <Radio
          ref={ref}
          checked={false}
          defaultChecked={false}
          name="plan"
          value="pro"
          onRadioChange={onRadioChange}
        />
      );
    });
    expect(radio.checked).toBe(false);
    expect(radio.defaultChecked).toBe(false);
    expect(radio.hasAttribute('checked')).toBe(false);

    const detail = { checked: true, value: 'pro', radio };
    radio.dispatchEvent(new CustomEvent('radio-change', { detail }));
    expect(onRadioChange).toHaveBeenCalledTimes(1);
    expect(onRadioChange.mock.calls[0][0].detail).toBe(detail);
  });
});
