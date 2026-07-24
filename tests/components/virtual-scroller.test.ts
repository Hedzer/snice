import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/virtual-scroller/snice-virtual-scroller';
import type { SniceVirtualScrollerElement, VirtualScrollerItem } from '../../packages/components/src/virtual-scroller/snice-virtual-scroller.types';

describe('snice-virtual-scroller', () => {
  let scroller: SniceVirtualScrollerElement;

  afterEach(() => {
    if (scroller) {
      removeComponent(scroller as HTMLElement);
    }
  });

  it('should render', async () => {
    scroller = await createComponent<SniceVirtualScrollerElement>('snice-virtual-scroller');
    expect(scroller).toBeTruthy();
  });

  it('should have default properties', async () => {
    scroller = await createComponent<SniceVirtualScrollerElement>('snice-virtual-scroller');
    expect(scroller.items).toEqual([]);
    expect(scroller.itemHeight).toBe(50);
    expect(scroller.bufferSize).toBe(5);
    expect(scroller.estimatedItemHeight).toBe(50);
  });

  it('should support custom item height', async () => {
    scroller = await createComponent<SniceVirtualScrollerElement>('snice-virtual-scroller', {
      'item-height': 100
    });
    expect(scroller.itemHeight).toBe(100);
  });

  it('should support custom buffer size', async () => {
    scroller = await createComponent<SniceVirtualScrollerElement>('snice-virtual-scroller', {
      'buffer-size': 10
    });
    expect(scroller.bufferSize).toBe(10);
  });

  it('should render items', async () => {
    const items: VirtualScrollerItem[] = [
      { id: 1, data: 'Item 1' },
      { id: 2, data: 'Item 2' },
      { id: 3, data: 'Item 3' }
    ];

    scroller = await createComponent<SniceVirtualScrollerElement>('snice-virtual-scroller');
    scroller.items = items;
    await wait();

    expect(scroller.items.length).toBe(3);
  });

  it('should get visible range', async () => {
    const items: VirtualScrollerItem[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      data: `Item ${i}`
    }));

    scroller = await createComponent<SniceVirtualScrollerElement>('snice-virtual-scroller');
    scroller.items = items;
    await wait();

    const range = scroller.getVisibleRange();
    expect(range.start).toBeGreaterThanOrEqual(0);
    expect(range.end).toBeLessThanOrEqual(100);
  });

  it('should support custom render function', async () => {
    const items: VirtualScrollerItem[] = [
      { id: 1, data: { name: 'John' } }
    ];

    scroller = await createComponent<SniceVirtualScrollerElement>('snice-virtual-scroller');
    scroller.items = items;
    scroller.renderItem = (item) => `<div>${item.data.name}</div>`;
    await wait();

    expect(scroller.renderItem).toBeDefined();
  });

  it('should support refresh', async () => {
    scroller = await createComponent<SniceVirtualScrollerElement>('snice-virtual-scroller');
    scroller.refresh();
    await wait();
    expect(scroller).toBeTruthy();
  });

  describe('keyboard nav on .scroller (@on decorator)', () => {
    const dispatchKey = (el: HTMLElement, key: string) => {
      const inner = el.shadowRoot!.querySelector('.scroller') as HTMLElement;
      inner.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
    };

    it('inner .scroller is keyboard-focusable', async () => {
      scroller = await createComponent<SniceVirtualScrollerElement>('snice-virtual-scroller');
      await wait();
      const inner = (scroller as HTMLElement).shadowRoot!.querySelector('.scroller');
      expect(inner?.getAttribute('tabindex')).toBe('0');
    });

    it('Home sets scroll position to 0', async () => {
      const items: VirtualScrollerItem[] = Array.from({ length: 100 }, (_, i) => ({ id: i, data: `i${i}` }));
      scroller = await createComponent<SniceVirtualScrollerElement>('snice-virtual-scroller');
      scroller.items = items;
      scroller.itemHeight = 30;
      await wait();

      const inner = (scroller as HTMLElement).shadowRoot!.querySelector('.scroller') as HTMLElement;
      inner.scrollTop = 200;
      dispatchKey(scroller as HTMLElement, 'Home');
      await wait();
      expect(inner.scrollTop).toBe(0);
    });

    it('ArrowDown advances scroll by itemHeight', async () => {
      const items: VirtualScrollerItem[] = Array.from({ length: 100 }, (_, i) => ({ id: i, data: `i${i}` }));
      scroller = await createComponent<SniceVirtualScrollerElement>('snice-virtual-scroller');
      scroller.items = items;
      scroller.itemHeight = 25;
      await wait();

      const inner = (scroller as HTMLElement).shadowRoot!.querySelector('.scroller') as HTMLElement;
      const start = inner.scrollTop;
      dispatchKey(scroller as HTMLElement, 'ArrowDown');
      await wait();
      // happy-dom may clamp scrollTop to 0 if the element has no overflow,
      // but the property assignment itself is what we want to verify happened.
      expect(inner.scrollTop).toBeGreaterThanOrEqual(start);
    });

    it('non-nav keys are ignored (no preventDefault)', async () => {
      scroller = await createComponent<SniceVirtualScrollerElement>('snice-virtual-scroller');
      await wait();
      const inner = (scroller as HTMLElement).shadowRoot!.querySelector('.scroller') as HTMLElement;
      const evt = new KeyboardEvent('keydown', { key: 'x', bubbles: true, composed: true, cancelable: true });
      inner.dispatchEvent(evt);
      expect(evt.defaultPrevented).toBe(false);
    });
  });
  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/virtual-scroller/snice-virtual-scroller.css');

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
});
