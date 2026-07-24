import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, triggerMouseEvent, triggerKeyboardEvent, wait } from './test-utils';
import '../../packages/components/src/accordion/snice-accordion-item';
import type { SniceAccordionItemElement } from '../../packages/components/src/accordion/snice-accordion.types';

const itemCssPath = resolve(process.cwd(), 'packages/components/src/accordion/snice-accordion-item.css');

describe('snice-accordion-item', () => {
  let accordionItem: SniceAccordionItemElement;

  afterEach(() => {
    if (accordionItem) {
      removeComponent(accordionItem as HTMLElement);
    }
  });

  it('should render accordion item element', async () => {
    accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item');
    expect(accordionItem).toBeTruthy();
  });

  it('should have a header button', async () => {
    accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item');
    const header = queryShadow(accordionItem as HTMLElement, '.accordion-item__header');
    expect(header).toBeTruthy();
    expect(header?.tagName).toBe('BUTTON');
  });

  it('should have content area', async () => {
    accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item');
    const content = queryShadow(accordionItem as HTMLElement, '.accordion-item__content');
    expect(content).toBeTruthy();
  });

  describe('open/closed state', () => {
    it('should start closed by default', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item');
      expect(accordionItem.open).toBe(false);
      const header = queryShadow(accordionItem as HTMLElement, '.accordion-item__header');
      expect(header?.getAttribute('aria-expanded')).toBe('false');
    });

    it('should open when open property is set', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item', { open: true });
      expect(accordionItem.open).toBe(true);
      const header = queryShadow(accordionItem as HTMLElement, '.accordion-item__header');
      expect(header?.getAttribute('aria-expanded')).toBe('true');
    });

    it('should toggle when clicked', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item');
      const header = queryShadow(accordionItem as HTMLElement, '.accordion-item__header');

      expect(accordionItem.open).toBe(false);

      triggerMouseEvent(header as HTMLElement, 'click');

      expect(accordionItem.open).toBe(true);
    });

    it('should toggle with Enter key', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item');
      const header = queryShadow(accordionItem as HTMLElement, '.accordion-item__header');

      expect(accordionItem.open).toBe(false);

      triggerKeyboardEvent(header as HTMLElement, 'Enter', 'keydown');

      expect(accordionItem.open).toBe(true);
    });

    it('should toggle with Space key', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item');
      const header = queryShadow(accordionItem as HTMLElement, '.accordion-item__header');

      expect(accordionItem.open).toBe(false);

      triggerKeyboardEvent(header as HTMLElement, ' ', 'keydown');

      expect(accordionItem.open).toBe(true);
    });
  });

  describe('disabled state', () => {
    it('should respect disabled property', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item', { disabled: true });

      const header = queryShadow(accordionItem as HTMLElement, '.accordion-item__header') as HTMLButtonElement;
      expect(header?.disabled).toBe(true);
    });

    it('should not toggle when disabled', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item', { disabled: true });
      const header = queryShadow(accordionItem as HTMLElement, '.accordion-item__header');

      expect(accordionItem.open).toBe(false);

      triggerMouseEvent(header as HTMLElement, 'click');

      expect(accordionItem.open).toBe(false);
    });
  });

  describe('API methods', () => {
    it('should toggle() method work', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item');

      expect(accordionItem.open).toBe(false);

      // First toggle: open
      accordionItem.expand(false); // No animation for tests
      expect(accordionItem.open).toBe(true);

      // Second toggle: close
      accordionItem.collapse(false); // No animation for tests
      expect(accordionItem.open).toBe(false);
    });

    it('should expand() method work', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item');

      accordionItem.expand(false); // No animation
      expect(accordionItem.open).toBe(true);
    });

    it('should collapse() method work', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item', { open: true });

      accordionItem.collapse(false); // No animation
      expect(accordionItem.open).toBe(false);
    });
  });

  describe('programmatic open property', () => {
    it('should dispatch accordion-item-toggle when open is set programmatically', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item', { 'item-id': 'prog-1' });

      let eventDetail: any = null;
      (accordionItem as HTMLElement).addEventListener('accordion-item-toggle', (e: Event) => {
        eventDetail = (e as CustomEvent).detail;
      });

      accordionItem.open = true;
      await wait(20);

      expect(eventDetail).toBeTruthy();
      expect(eventDetail.itemId).toBe('prog-1');
      expect(eventDetail.open).toBe(true);
    });

    it('should dispatch accordion-item-toggle when open is unset programmatically', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item', { 'item-id': 'prog-2', open: true });

      let eventDetail: any = null;
      (accordionItem as HTMLElement).addEventListener('accordion-item-toggle', (e: Event) => {
        eventDetail = (e as CustomEvent).detail;
      });

      accordionItem.open = false;
      await wait(20);

      expect(eventDetail).toBeTruthy();
      expect(eventDetail.itemId).toBe('prog-2');
      expect(eventDetail.open).toBe(false);
    });

    it('should update aria-expanded when open is set programmatically', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item', { 'item-id': 'prog-3' });

      accordionItem.open = true;
      await wait(20);

      const header = queryShadow(accordionItem as HTMLElement, '.accordion-item__header');
      expect(header?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('accessibility wiring', () => {
    it('should label the content region with the header button id', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item', { 'item-id': 'a11y-1' });

      const header = queryShadow(accordionItem as HTMLElement, '.accordion-item__header');
      const content = queryShadow(accordionItem as HTMLElement, '.accordion-item__content');
      const labelledby = content?.getAttribute('aria-labelledby');

      expect(labelledby).toBeTruthy();
      expect(header?.id).toBe(labelledby);
    });
  });

  describe('stylesheet contracts', () => {
    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(itemCssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(itemCssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });

  describe('events', () => {
    it('should dispatch accordion-item-toggle event', async () => {
      accordionItem = await createComponent<SniceAccordionItemElement>('snice-accordion-item', { 'item-id': 'test-1' });

      let eventDetail: any = null;
      (accordionItem as HTMLElement).addEventListener('accordion-item-toggle', (e: Event) => {
        eventDetail = (e as CustomEvent).detail;
      });

      accordionItem.toggle();

      expect(eventDetail).toBeTruthy();
      expect(eventDetail.itemId).toBe('test-1');
      expect(eventDetail.open).toBe(true);
    });
  });
});
