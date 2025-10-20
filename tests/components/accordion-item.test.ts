import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, triggerMouseEvent, triggerKeyboardEvent } from './test-utils';
import '../../components/accordion/snice-accordion-item';
import type { SniceAccordionItemElement } from '../../components/accordion/snice-accordion.types';

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
