import React, { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../packages/components/src/key-value/snice-key-value';
import { KeyValue } from '../../adapters/react/key-value';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const canonical = (items: Array<{ key: string; value: string; description?: string }>) => JSON.stringify(
  items.map(item => ({ key: item.key, value: item.value, description: item.description ?? '' }))
);

describe('React key-value native state adapter', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(async () => {
    if (root) await act(async () => root!.unmount());
    container?.remove();
    root = null;
    container = null;
  });

  it('keeps the controlled live array separate from the reset default and forwards exact events', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const ref = createRef<any>();
    const onKvChange = vi.fn();
    const initial = canonical([
      { key: 'tag', value: 'one', description: 'first' },
      { key: 'tag', value: '東京 ✓', description: 'second' },
    ]);
    const resetDefault = canonical([{ key: 'default', value: 'reset' }]);

    await act(async () => {
      root!.render(
        <KeyValue
          ref={ref}
          value={initial}
          defaultValue={resetDefault}
          name="metadata"
          label="Metadata"
          showDescription
          required
          placeholders={[{ key: 'Header', value: 'Value' }]}
          onKvChange={onKvChange}
        />
      );
    });

    const editor = ref.current.element as any;
    await act(async () => {
      await editor.ready;
      await editor.rendered;
    });
    expect(editor.value).toBe(initial);
    expect(editor.defaultValue).toBe(resetDefault);
    expect(editor.getAttribute('value')).toBe(resetDefault);
    expect(editor.getItems()).toEqual(JSON.parse(initial));
    expect(editor.name).toBe('metadata');
    expect(editor.required).toBe(true);
    expect(editor.showDescription).toBe(true);
    expect(editor.placeholders).toEqual([{ key: 'Header', value: 'Value' }]);

    const next = canonical([{ key: 'next', value: 'live', description: 'updated' }]);
    await act(async () => {
      root!.render(
        <KeyValue
          ref={ref}
          value={next}
          defaultValue={resetDefault}
          name="metadata"
          label="Metadata"
          showDescription
          required
          placeholders={[{ key: 'Header', value: 'Value' }]}
          onKvChange={onKvChange}
        />
      );
      await editor.rendered;
    });
    expect(editor.value).toBe(next);
    expect(editor.defaultValue).toBe(resetDefault);
    expect(editor.getAttribute('value')).toBe(resetDefault);

    const detail = { items: JSON.parse(next) };
    editor.dispatchEvent(new CustomEvent('kv-change', { detail }));
    expect(onKvChange).toHaveBeenCalledTimes(1);
    expect(onKvChange.mock.calls[0][0].detail).toBe(detail);

    await act(async () => {
      editor.formResetCallback();
      await editor.rendered;
    });
    expect(editor.value).toBe(resetDefault);
  });
});
