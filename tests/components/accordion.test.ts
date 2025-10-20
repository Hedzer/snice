import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/accordion/snice-accordion';
import '../../components/accordion/snice-accordion-item';
import type { SniceAccordionElement } from '../../components/accordion/snice-accordion.types';

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
});
