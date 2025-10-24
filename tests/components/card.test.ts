import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, triggerMouseEvent, triggerKeyboardEvent, trackRenders } from './test-utils';
import '../../components/card/snice-card';
import type { SniceCardElement } from '../../components/card/snice-card.types';

describe('snice-card', () => {
  let card: SniceCardElement;

  afterEach(() => {
    if (card) {
      removeComponent(card as HTMLElement);
    }
  });

  it('should render card element', async () => {
    card = await createComponent<SniceCardElement>('snice-card');
    expect(card).toBeTruthy();
  });

  it('should have default elevated variant', async () => {
    card = await createComponent<SniceCardElement>('snice-card');
    expect(card.variant).toBe('elevated');
  });

  it('should support different variants', async () => {
    card = await createComponent<SniceCardElement>('snice-card', { variant: 'outlined' });
    expect(card.variant).toBe('outlined');
  });

  it('should render default slot for body content', async () => {
    card = document.createElement('snice-card') as SniceCardElement;
    card.textContent = 'Card body content';
    document.body.appendChild(card);
    await (card as any).ready;

    const body = queryShadow(card as HTMLElement, '.card-body');
    expect(body).toBeTruthy();
  });

  it('should render header slot when provided', async () => {
    card = document.createElement('snice-card') as SniceCardElement;
    const header = document.createElement('div');
    header.setAttribute('slot', 'header');
    header.textContent = 'Card Header';
    card.appendChild(header);
    document.body.appendChild(card);
    await (card as any).ready;

    const headerSlot = queryShadow(card as HTMLElement, 'slot[name="header"]') as HTMLSlotElement;
    expect(headerSlot).toBeTruthy();
    expect(headerSlot?.assignedNodes().length).toBeGreaterThan(0);
  });

  it('should render footer slot when provided', async () => {
    card = document.createElement('snice-card') as SniceCardElement;
    const footer = document.createElement('div');
    footer.setAttribute('slot', 'footer');
    footer.textContent = 'Card Footer';
    card.appendChild(footer);

    document.body.appendChild(card);
    await (card as any).ready;

    // Wait for microtask queue to flush (for queueMicrotask in onReady)
    await new Promise(resolve => setTimeout(resolve, 0));

    const footerElement = queryShadow(card as HTMLElement, '.card-footer');
    expect(footerElement).toBeTruthy();
    expect(footerElement?.hasAttribute('hidden')).toBe(false);
  });

  it('should hide header when no header slot content', async () => {
    card = await createComponent<SniceCardElement>('snice-card');
    const header = queryShadow(card as HTMLElement, '.card-header');
    expect(header?.hasAttribute('hidden')).toBe(true);
  });

  it('should hide footer when no footer slot content', async () => {
    card = await createComponent<SniceCardElement>('snice-card');
    const footer = queryShadow(card as HTMLElement, '.card-footer');
    expect(footer?.hasAttribute('hidden')).toBe(true);
  });

  it('should support clickable property', async () => {
    card = await createComponent<SniceCardElement>('snice-card', { clickable: true });
    expect(card.clickable).toBe(true);

    const cardElement = queryShadow(card as HTMLElement, '.card');
    expect(cardElement?.getAttribute('role')).toBe('button');
  });

  it('should toggle selected state when clickable card is clicked', async () => {
    card = await createComponent<SniceCardElement>('snice-card', { clickable: true });
    const cardElement = queryShadow(card as HTMLElement, '.card') as HTMLElement;

    expect(card.selected).toBe(false);

    triggerMouseEvent(cardElement, 'click');

    expect(card.selected).toBe(true);

    triggerMouseEvent(cardElement, 'click');

    expect(card.selected).toBe(false);
  });

  it('should not toggle selected when disabled', async () => {
    card = await createComponent<SniceCardElement>('snice-card', { clickable: true, disabled: true });
    const cardElement = queryShadow(card as HTMLElement, '.card') as HTMLElement;

    expect(card.selected).toBe(false);

    triggerMouseEvent(cardElement, 'click');

    expect(card.selected).toBe(false);
  });

  it('should dispatch card-click event when clicked', async () => {
    card = await createComponent<SniceCardElement>('snice-card', { clickable: true });

    let eventDetail: any = null;
    (card as HTMLElement).addEventListener('card-click', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    const cardElement = queryShadow(card as HTMLElement, '.card') as HTMLElement;
    triggerMouseEvent(cardElement, 'click');

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.selected).toBe(true);
  });

  it('should support keyboard activation with Enter key', async () => {
    card = await createComponent<SniceCardElement>('snice-card', { clickable: true });
    const cardElement = queryShadow(card as HTMLElement, '.card') as HTMLElement;

    expect(card.selected).toBe(false);

    triggerKeyboardEvent(cardElement, 'Enter');

    expect(card.selected).toBe(true);
  });

  it('should support keyboard activation with Space key', async () => {
    card = await createComponent<SniceCardElement>('snice-card', { clickable: true });
    const cardElement = queryShadow(card as HTMLElement, '.card') as HTMLElement;

    expect(card.selected).toBe(false);

    triggerKeyboardEvent(cardElement, ' ');

    expect(card.selected).toBe(true);
  });

  it('should have tabindex 0 when clickable and not disabled', async () => {
    card = await createComponent<SniceCardElement>('snice-card', { clickable: true });
    const cardElement = queryShadow(card as HTMLElement, '.card');
    expect(cardElement?.getAttribute('tabindex')).toBe('0');
  });

  it('should have tabindex -1 when disabled', async () => {
    card = await createComponent<SniceCardElement>('snice-card', { clickable: true, disabled: true });
    const cardElement = queryShadow(card as HTMLElement, '.card');
    expect(cardElement?.getAttribute('tabindex')).toBe('-1');
  });

  it('should support different sizes', async () => {
    card = await createComponent<SniceCardElement>('snice-card', { size: 'large' });
    expect(card.size).toBe('large');
  });
});
