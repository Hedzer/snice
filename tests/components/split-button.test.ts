import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, trackRenders } from './test-utils';
import '../../components/split-button/snice-split-button';
import type { SniceSplitButtonElement, SplitButtonAction } from '../../components/split-button/snice-split-button.types';

describe('snice-split-button', () => {
  let el: SniceSplitButtonElement;

  const defaultActions: SplitButtonAction[] = [
    { value: 'save-draft', label: 'Save as Draft' },
    { value: 'save-template', label: 'Save as Template' },
    { value: 'discard', label: 'Discard', disabled: true },
  ];

  async function createSplitButton(attrs: Record<string, any> = {}) {
    el = await createComponent<SniceSplitButtonElement>('snice-split-button', {
      label: attrs.label || 'Save',
      ...attrs,
    });
    el.actions = attrs.actions || defaultActions;
    await new Promise(resolve => setTimeout(resolve, 50));
    return el;
  }

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  it('should render split button element', async () => {
    await createSplitButton();
    expect(el).toBeTruthy();
  });

  it('should render primary button with label', async () => {
    await createSplitButton({ label: 'Send' });
    const primary = queryShadow(el as HTMLElement, '.split-button__primary');
    expect(primary).toBeTruthy();
    expect(el.label).toBe('Send');
  });

  it('should render toggle button', async () => {
    await createSplitButton();
    const toggle = queryShadow(el as HTMLElement, '.split-button__toggle');
    expect(toggle).toBeTruthy();
  });

  it('should render menu container', async () => {
    await createSplitButton();
    const menu = queryShadow(el as HTMLElement, '.split-button__menu');
    expect(menu).toBeTruthy();
  });

  it('should not be disabled by default', async () => {
    await createSplitButton();
    expect(el.disabled).toBe(false);
  });

  it('should support disabled state', async () => {
    await createSplitButton({ disabled: true });
    expect(el.disabled).toBe(true);
    const primary = queryShadow(el as HTMLElement, '.split-button__primary') as HTMLButtonElement;
    expect(primary?.disabled).toBe(true);
  });

  it('should have default variant', async () => {
    await createSplitButton();
    expect(el.variant).toBe('default');
  });

  it('should support primary variant', async () => {
    await createSplitButton({ variant: 'primary' });
    expect(el.variant).toBe('primary');
  });

  it('should support success variant', async () => {
    await createSplitButton({ variant: 'success' });
    expect(el.variant).toBe('success');
  });

  it('should support danger variant', async () => {
    await createSplitButton({ variant: 'danger' });
    expect(el.variant).toBe('danger');
  });

  it('should have default size of medium', async () => {
    await createSplitButton();
    expect(el.size).toBe('medium');
  });

  it('should support small size', async () => {
    await createSplitButton({ size: 'small' });
    expect(el.size).toBe('small');
  });

  it('should support large size', async () => {
    await createSplitButton({ size: 'large' });
    expect(el.size).toBe('large');
  });

  it('should open menu on toggle click', async () => {
    await createSplitButton();

    const toggle = queryShadow(el as HTMLElement, '.split-button__toggle') as HTMLButtonElement;
    toggle.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    const menu = queryShadow(el as HTMLElement, '.split-button__menu');
    expect(menu?.classList.contains('split-button__menu--open')).toBe(true);
  });

  it('should close menu on second toggle click', async () => {
    await createSplitButton();

    const toggle = queryShadow(el as HTMLElement, '.split-button__toggle') as HTMLButtonElement;
    toggle.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    toggle.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    const menu = queryShadow(el as HTMLElement, '.split-button__menu');
    expect(menu?.classList.contains('split-button__menu--open')).toBe(false);
  });

  it('should dispatch primary-click event on primary button click', async () => {
    await createSplitButton();

    let eventFired = false;
    (el as HTMLElement).addEventListener('primary-click', () => {
      eventFired = true;
    });

    const primary = queryShadow(el as HTMLElement, '.split-button__primary') as HTMLButtonElement;
    primary.click();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(eventFired).toBe(true);
  });

  it('should dispatch action-click event on action click', async () => {
    await createSplitButton();

    let eventDetail: any = null;
    (el as HTMLElement).addEventListener('action-click', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    // Open menu first
    const toggle = queryShadow(el as HTMLElement, '.split-button__toggle') as HTMLButtonElement;
    toggle.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Click first action
    const actions = queryShadowAll(el as HTMLElement, '.split-button__action');
    (actions[0] as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.value).toBe('save-draft');
  });

  it('should close menu after action click', async () => {
    await createSplitButton();

    const toggle = queryShadow(el as HTMLElement, '.split-button__toggle') as HTMLButtonElement;
    toggle.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    const actions = queryShadowAll(el as HTMLElement, '.split-button__action');
    (actions[0] as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 50));

    const menu = queryShadow(el as HTMLElement, '.split-button__menu');
    expect(menu?.classList.contains('split-button__menu--open')).toBe(false);
  });

  it('should not fire action-click for disabled actions', async () => {
    await createSplitButton();

    let eventFired = false;
    (el as HTMLElement).addEventListener('action-click', () => {
      eventFired = true;
    });

    const toggle = queryShadow(el as HTMLElement, '.split-button__toggle') as HTMLButtonElement;
    toggle.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    // Third action is disabled
    const actions = queryShadowAll(el as HTMLElement, '.split-button__action');
    (actions[2] as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(eventFired).toBe(false);
  });

  it('should accept actions array', async () => {
    await createSplitButton();
    expect(el.actions).toHaveLength(3);
  });

  it('should update actions dynamically', async () => {
    await createSplitButton();
    el.actions = [
      { value: 'a', label: 'Action A' },
      { value: 'b', label: 'Action B' },
    ];
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(el.actions).toHaveLength(2);
  });

  it('should have correct ARIA attributes on toggle', async () => {
    await createSplitButton();
    const toggle = queryShadow(el as HTMLElement, '.split-button__toggle');
    expect(toggle?.getAttribute('aria-haspopup')).toBe('true');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
  });

  it('should close menu on primary click if open', async () => {
    await createSplitButton();

    const toggle = queryShadow(el as HTMLElement, '.split-button__toggle') as HTMLButtonElement;
    toggle.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    const primary = queryShadow(el as HTMLElement, '.split-button__primary') as HTMLButtonElement;
    primary.click();
    await new Promise(resolve => setTimeout(resolve, 50));

    const menu = queryShadow(el as HTMLElement, '.split-button__menu');
    expect(menu?.classList.contains('split-button__menu--open')).toBe(false);
  });
});
