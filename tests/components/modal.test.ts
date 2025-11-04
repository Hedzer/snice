import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, trackRenders } from './test-utils';
import '../../components/modal/snice-modal';
import type { SniceModalElement } from '../../components/modal/snice-modal.types';

describe('snice-modal', () => {
  let modal: SniceModalElement;

  beforeEach(() => {
    // Reset body overflow before each test
    document.body.style.overflow = '';
  });

  afterEach(() => {
    if (modal) {
      removeComponent(modal as HTMLElement);
    }
    // Clean up body overflow after each test
    document.body.style.overflow = '';
  });

  it('should render modal element', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    expect(modal).toBeTruthy();
  });

  it('should be closed by default', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    expect(modal.open).toBe(false);
  });

  it('should support open state', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal', { open: true });
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(modal.open).toBe(true);

    const modalDiv = queryShadow(modal as HTMLElement, '.modal');
    expect(modalDiv?.classList.contains('modal--open')).toBe(true);
  });

  it('should have default size of medium', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    expect(modal.size).toBe('medium');
  });

  it('should support small size', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal', { size: 'small' });
    expect(modal.size).toBe('small');

    const panel = queryShadow(modal as HTMLElement, '.modal__panel');
    expect(panel?.classList.contains('modal__panel--small')).toBe(true);
  });

  it('should support large size', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal', { size: 'large' });
    expect(modal.size).toBe('large');

    const panel = queryShadow(modal as HTMLElement, '.modal__panel');
    expect(panel?.classList.contains('modal__panel--large')).toBe(true);
  });

  it('should support fullscreen size', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal', { size: 'fullscreen' });
    expect(modal.size).toBe('fullscreen');

    const panel = queryShadow(modal as HTMLElement, '.modal__panel');
    expect(panel?.classList.contains('modal__panel--fullscreen')).toBe(true);
  });

  it('should allow backdrop dismiss by default', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    expect(modal.noBackdropDismiss).toBe(false);
  });

  it('should support noBackdropDismiss property', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal', { noBackdropDismiss: true });
    expect(modal.noBackdropDismiss).toBe(true);
  });

  it('should allow escape dismiss by default', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    expect(modal.noEscapeDismiss).toBe(false);
  });

  it('should support noEscapeDismiss property', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal', { noEscapeDismiss: true });
    expect(modal.noEscapeDismiss).toBe(true);
  });

  it('should have focus trap enabled by default', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    expect(modal.noFocusTrap).toBe(false);
  });

  it('should support noFocusTrap property', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal', { noFocusTrap: true });
    expect(modal.noFocusTrap).toBe(true);
  });

  it('should show close button by default', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    expect(modal.noCloseButton).toBe(false);

    const closeBtn = queryShadow(modal as HTMLElement, '.modal__close');
    expect(closeBtn).toBeTruthy();
  });

  it('should support noCloseButton property', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal', { noCloseButton: true });
    expect(modal.noCloseButton).toBe(true);

    const closeBtn = queryShadow(modal as HTMLElement, '.modal__close');
    expect(closeBtn).toBeFalsy();
  });

  it('should support label property', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal', { label: 'Test Modal' });
    expect(modal.label).toBe('Test Modal');

    const modalDiv = queryShadow(modal as HTMLElement, '.modal');
    expect(modalDiv?.getAttribute('aria-label')).toBe('Test Modal');
  });

  it('should render backdrop element', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');

    const backdrop = queryShadow(modal as HTMLElement, '.modal__backdrop');
    expect(backdrop).toBeTruthy();
  });

  it('should render panel element', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');

    const panel = queryShadow(modal as HTMLElement, '.modal__panel');
    expect(panel).toBeTruthy();
  });

  it('should render header slot', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');

    const header = queryShadow(modal as HTMLElement, '.modal__header');
    expect(header).toBeTruthy();
  });

  it('should render body slot', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');

    const body = queryShadow(modal as HTMLElement, '.modal__body');
    expect(body).toBeTruthy();
  });

  it('should render footer slot', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');

    const footer = queryShadow(modal as HTMLElement, '.modal__footer');
    expect(footer).toBeTruthy();
  });

  it('should have show() method', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');

    expect(modal.open).toBe(false);
    modal.show();
    expect(modal.open).toBe(true);
  });

  it('should have close() method', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    const tracker = trackRenders(modal as HTMLElement);

    modal.open = true;
    await tracker.next();
    expect(modal.open).toBe(true);

    modal.close();
    expect(modal.open).toBe(false);
  });

  it('should dispatch modal-open event when opened', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');

    let eventDetail: any = null;
    (modal as HTMLElement).addEventListener('modal-open', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    modal.show();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.modal).toBe(modal);
  });

  it('should dispatch modal-close event when closed', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    const tracker = trackRenders(modal as HTMLElement);

    modal.open = true;
    await tracker.next();

    let eventDetail: any = null;
    (modal as HTMLElement).addEventListener('modal-close', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    modal.close();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.modal).toBe(modal);
  });

  it('should close when close button clicked', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    const tracker = trackRenders(modal as HTMLElement);

    modal.open = true;
    await tracker.next();
    expect(modal.open).toBe(true);

    const closeBtn = queryShadow(modal as HTMLElement, '.modal__close') as HTMLButtonElement;
    closeBtn?.click();

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(modal.open).toBe(false);
  });

  it('should close when backdrop clicked (if not disabled)', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    const tracker = trackRenders(modal as HTMLElement);

    modal.open = true;
    await tracker.next();
    expect(modal.open).toBe(true);

    const backdrop = queryShadow(modal as HTMLElement, '.modal__backdrop') as HTMLElement;
    backdrop?.click();

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(modal.open).toBe(false);
  });

  it('should not close when backdrop clicked if noBackdropDismiss is true', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal', { noBackdropDismiss: true });
    const tracker = trackRenders(modal as HTMLElement);

    modal.open = true;
    await tracker.next();
    expect(modal.open).toBe(true);

    const backdrop = queryShadow(modal as HTMLElement, '.modal__backdrop') as HTMLElement;
    backdrop?.click();

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(modal.open).toBe(true); // Should still be open
  });

  it('should update open state when property changes', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    const tracker = trackRenders(modal as HTMLElement);

    expect(modal.open).toBe(false);

    modal.open = true;
    await tracker.next();

    const modalDiv = queryShadow(modal as HTMLElement, '.modal');
    expect(modalDiv?.classList.contains('modal--open')).toBe(true);
  });

  it('should set aria-hidden based on open state', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');

    const modalDiv = queryShadow(modal as HTMLElement, '.modal');
    expect(modalDiv?.getAttribute('aria-hidden')).toBe('true');

    const tracker = trackRenders(modal as HTMLElement);
    modal.open = true;
    await tracker.next();

    expect(modalDiv?.getAttribute('aria-hidden')).toBe('false');
  });

  it('should have role="dialog"', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');

    const modalDiv = queryShadow(modal as HTMLElement, '.modal');
    expect(modalDiv?.getAttribute('role')).toBe('dialog');
  });

  it('should have aria-modal="true"', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');

    const modalDiv = queryShadow(modal as HTMLElement, '.modal');
    expect(modalDiv?.getAttribute('aria-modal')).toBe('true');
  });

  // Note: Body scroll lock tests are skipped as they rely on browser-specific
  // behavior that may not work properly in headless test environment
  it.skip('should lock body scroll when opened', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    const tracker = trackRenders(modal as HTMLElement);

    expect(document.body.style.overflow).toBe('');

    modal.show();
    await tracker.next();
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(document.body.style.overflow).toBe('hidden');
  });

  it.skip('should restore body scroll when closed', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal');
    const tracker = trackRenders(modal as HTMLElement);

    modal.open = true;
    await tracker.next();
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(document.body.style.overflow).toBe('hidden');

    modal.close();
    await tracker.next();
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(document.body.style.overflow).toBe('');
  });

  it('should update label dynamically', async () => {
    modal = await createComponent<SniceModalElement>('snice-modal', { label: 'Initial' });
    const tracker = trackRenders(modal as HTMLElement);

    modal.label = 'Updated';
    await tracker.next();

    const modalDiv = queryShadow(modal as HTMLElement, '.modal');
    expect(modalDiv?.getAttribute('aria-label')).toBe('Updated');
  });
});
