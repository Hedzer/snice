import React, { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../packages/components/src/checkbox/snice-checkbox';
import { Checkbox } from '../../adapters/react/checkbox';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('React checkbox native state adapter', () => {
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
    const onCheckboxChange = vi.fn();

    await act(async () => {
      root!.render(
        <Checkbox
          ref={ref}
          checked={true}
          defaultChecked={false}
          name="terms"
          value="accepted"
          onCheckboxChange={onCheckboxChange}
        />
      );
    });

    const checkbox = ref.current.element as any;
    await act(async () => {
      await checkbox.ready;
      await checkbox.rendered;
    });
    expect(checkbox.checked).toBe(true);
    expect(checkbox.defaultChecked).toBe(false);
    expect(checkbox.hasAttribute('checked')).toBe(false);
    expect(checkbox.name).toBe('terms');
    expect(checkbox.value).toBe('accepted');

    await act(async () => {
      root!.render(
        <Checkbox
          ref={ref}
          checked={false}
          defaultChecked={false}
          name="terms"
          value="accepted"
          onCheckboxChange={onCheckboxChange}
        />
      );
    });
    expect(checkbox.checked).toBe(false);
    expect(checkbox.defaultChecked).toBe(false);
    expect(checkbox.hasAttribute('checked')).toBe(false);

    const detail = { checked: true, indeterminate: false, checkbox };
    checkbox.dispatchEvent(new CustomEvent('checkbox-change', { detail }));
    expect(onCheckboxChange).toHaveBeenCalledTimes(1);
    expect(onCheckboxChange.mock.calls[0][0].detail).toBe(detail);
  });
});
