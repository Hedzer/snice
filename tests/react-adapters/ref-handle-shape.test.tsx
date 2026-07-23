import React, { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import '../../packages/components/src/checkbox/snice-checkbox';
import '../../packages/components/src/card/snice-card';
import { Checkbox } from '../../adapters/react/checkbox';
import { Card } from '../../adapters/react/card';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Runtime proof that the imperative handle an adapter places in the forwarded
 * ref matches the public SniceComponentRef/SniceFormRef contract:
 *
 * - the handle always carries `element` (the underlying custom element);
 * - form-associated adapters expose a live `value` getter/setter;
 * - non-form adapters do not expose `value` at all;
 * - no unconfigured method members exist on the handle.
 */
describe('React adapter ref handle shape', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(async () => {
    if (root) await act(async () => root!.unmount());
    container?.remove();
    root = null;
    container = null;
  });

  async function mount(element: React.ReactElement) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root!.render(element));
  }

  it('exposes element and a live value on a form-associated adapter', async () => {
    const ref = createRef<any>();
    await mount(<Checkbox ref={ref} name="terms" value="accepted" />);

    const handle = ref.current;
    expect(handle).toBeTruthy();
    expect(handle.element).toBeInstanceOf(HTMLElement);
    expect(handle.element.tagName.toLowerCase()).toBe('snice-checkbox');

    // The value accessor is live in both directions.
    expect('value' in handle).toBe(true);
    handle.element.value = 'from-element';
    expect(handle.value).toBe('from-element');
    handle.value = 'from-handle';
    expect(handle.element.value).toBe('from-handle');

    // No invented members: only element, value, and configured methods exist.
    expect(handle.reset).toBeUndefined();
    expect(handle.addEventListener).toBeUndefined();
  });

  it('exposes element but no value on a non-form adapter', async () => {
    const ref = createRef<any>();
    await mount(<Card ref={ref} variant="elevated" />);

    const handle = ref.current;
    expect(handle).toBeTruthy();
    expect(handle.element).toBeInstanceOf(HTMLElement);
    expect(handle.element.tagName.toLowerCase()).toBe('snice-card');

    expect('value' in handle).toBe(false);
    expect(handle.reset).toBeUndefined();
    expect(handle.addEventListener).toBeUndefined();
  });
});
