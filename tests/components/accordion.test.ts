import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/accordion/snice-accordion';
import '../../packages/components/src/accordion/snice-accordion-item';
import type { SniceAccordionElement, SniceAccordionItemElement } from '../../packages/components/src/accordion/snice-accordion.types';

const accordionCssPath = resolve(process.cwd(), 'packages/components/src/accordion/snice-accordion.css');

async function createAccordionWithItems(
  itemConfigs: Array<{ id: string; open?: boolean; disabled?: boolean }>,
  accordionAttrs: Record<string, any> = {}
): Promise<{ accordion: SniceAccordionElement; items: SniceAccordionItemElement[] }> {
  const accordion = document.createElement('snice-accordion') as SniceAccordionElement;
  for (const [key, value] of Object.entries(accordionAttrs)) {
    if (value === true) accordion.setAttribute(key, '');
    else if (value !== false) accordion.setAttribute(key, String(value));
  }

  const items = itemConfigs.map(config => {
    const item = document.createElement('snice-accordion-item') as SniceAccordionItemElement;
    item.setAttribute('item-id', config.id);
    if (config.open) item.setAttribute('open', '');
    if (config.disabled) item.setAttribute('disabled', '');
    accordion.appendChild(item);
    return item;
  });

  document.body.appendChild(accordion);
  await (accordion as any).ready;
  await Promise.all(items.map(item => (item as any).ready));
  await wait(50);

  return { accordion, items };
}


describe('snice-accordion', () => {
  let accordion: SniceAccordionElement;

  afterEach(() => {
    if (accordion) {
      removeComponent(accordion as HTMLElement);
    }
  });

  it('should render accordion element', async () => {
    accordion = await createComponent<SniceAccordionElement>('snice-accordion');
    expect(accordion).toBeTruthy();
  });

  it('should support multiple=false by default', async () => {
    accordion = await createComponent<SniceAccordionElement>('snice-accordion');
    expect(accordion.multiple).toBe(false);
  });

  it('should support multiple=true', async () => {
    accordion = await createComponent<SniceAccordionElement>('snice-accordion', { multiple: true });
    expect(accordion.multiple).toBe(true);
  });

  it('should have accordion items as light DOM children', async () => {
    accordion = document.createElement('snice-accordion') as SniceAccordionElement;
    const item1 = document.createElement('snice-accordion-item');
    const item2 = document.createElement('snice-accordion-item');

    accordion.appendChild(item1);
    accordion.appendChild(item2);
    document.body.appendChild(accordion);

    await (accordion as any).ready;
    await wait(50);

    const items = accordion.querySelectorAll('snice-accordion-item');
    expect(items.length).toBe(2);
  });

  describe('API methods', () => {
    it('should openItem() work', async () => {
      accordion = document.createElement('snice-accordion') as SniceAccordionElement;
      const item = document.createElement('snice-accordion-item');
      item.setAttribute('item-id', 'test-1');

      accordion.appendChild(item);
      document.body.appendChild(accordion);

      await (accordion as any).ready;
      await wait(50);

      accordion.openItem('test-1');
      await wait(50);

      expect((item as any).open).toBe(true);
    });

    it('should closeItem() work', async () => {
      accordion = document.createElement('snice-accordion') as SniceAccordionElement;
      const item = document.createElement('snice-accordion-item');
      item.setAttribute('item-id', 'test-1');
      (item as any).open = true;

      accordion.appendChild(item);
      document.body.appendChild(accordion);

      await (accordion as any).ready;
      await wait(50);

      accordion.closeItem('test-1');
      await wait(50);

      expect((item as any).open).toBe(false);
    });

    it('should toggleItem() work', async () => {
      accordion = document.createElement('snice-accordion') as SniceAccordionElement;
      const item = document.createElement('snice-accordion-item');
      item.setAttribute('item-id', 'test-1');

      accordion.appendChild(item);
      document.body.appendChild(accordion);

      await (accordion as any).ready;
      await wait(50);

      accordion.toggleItem('test-1');
      await wait(50);

      expect((item as any).open).toBe(true);
    });

    it('should closeAll() work', async () => {
      accordion = document.createElement('snice-accordion') as SniceAccordionElement;
      accordion.setAttribute('multiple', 'true');

      const item1 = document.createElement('snice-accordion-item');
      item1.setAttribute('item-id', 'item-1');
      (item1 as any).open = true;

      const item2 = document.createElement('snice-accordion-item');
      item2.setAttribute('item-id', 'item-2');
      (item2 as any).open = true;

      accordion.appendChild(item1);
      accordion.appendChild(item2);
      document.body.appendChild(accordion);

      await (accordion as any).ready;
      await wait(50);

      accordion.closeAll();
      await wait(50);

      expect((item1 as any).open).toBe(false);
      expect((item2 as any).open).toBe(false);
    });

    it('should close the other item in single mode when one is toggled', async () => {
      const { accordion: acc, items } = await createAccordionWithItems([
        { id: 'sm-1', open: true },
        { id: 'sm-2' }
      ]);
      accordion = acc;

      items[1].toggle();
      await wait(50);

      expect(items[1].open).toBe(true);
      expect(items[0].open).toBe(false);
    });

    it('should close the other item in single mode when open is set programmatically', async () => {
      const { accordion: acc, items } = await createAccordionWithItems([
        { id: 'sp-1', open: true },
        { id: 'sp-2' }
      ]);
      accordion = acc;

      items[1].open = true;
      await wait(50);

      expect(items[1].open).toBe(true);
      expect(items[0].open).toBe(false);
    });

    it('should openAll() work in multiple mode', async () => {
      accordion = document.createElement('snice-accordion') as SniceAccordionElement;
      accordion.setAttribute('multiple', 'true');

      const item1 = document.createElement('snice-accordion-item');
      item1.setAttribute('item-id', 'item-1');

      const item2 = document.createElement('snice-accordion-item');
      item2.setAttribute('item-id', 'item-2');

      accordion.appendChild(item1);
      accordion.appendChild(item2);
      document.body.appendChild(accordion);

      await (accordion as any).ready;
      await wait(50);

      accordion.openAll();
      await wait(50);

      expect((item1 as any).open).toBe(true);
      expect((item2 as any).open).toBe(true);
    });
  });

  // Keyboard navigation (ArrowUp/Down, Home, End) is covered in
  // tests/live/components/accordion/accordion.spec.ts — happy-dom does not
  // propagate slotted light-DOM events into the shadow tree, so those paths
  // need a real browser.

  describe('stylesheet contracts', () => {
    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(accordionCssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(accordionCssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});
