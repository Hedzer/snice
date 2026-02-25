import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, trackRenders } from './test-utils';
import '../../components/switch/snice-switch';
import type { SniceSwitchElement } from '../../components/switch/snice-switch.types';

describe('snice-switch', () => {
  let switchEl: SniceSwitchElement;

  afterEach(() => {
    if (switchEl) {
      removeComponent(switchEl as HTMLElement);
    }
  });

  it('should render switch element', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch');
    expect(switchEl).toBeTruthy();
  });

  it('should have unchecked state by default', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch');
    expect(switchEl.checked).toBe(false);
  });

  it('should support checked state', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { checked: true });
    expect(switchEl.checked).toBe(true);

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    expect(input?.checked).toBe(true);
  });

  it('should support disabled state', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { disabled: true });
    expect(switchEl.disabled).toBe(true);

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    expect(input?.disabled).toBe(true);
  });

  it('should support required state', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { required: true });
    expect(switchEl.required).toBe(true);

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    expect(input?.required).toBe(true);
  });

  it('should support invalid state', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { invalid: true });
    expect(switchEl.invalid).toBe(true);

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    expect(input?.getAttribute('aria-invalid')).toBe('true');
  });

  it('should support name attribute', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { name: 'notifications' });
    expect(switchEl.name).toBe('notifications');

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    expect(input?.name).toBe('notifications');
  });

  it('should support value attribute', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { value: 'enabled' });
    expect(switchEl.value).toBe('enabled');

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    expect(input?.value).toBe('enabled');
  });

  it('should display label', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { label: 'Enable notifications' });
    expect(switchEl.label).toBe('Enable notifications');

    const label = queryShadow(switchEl as HTMLElement, '.switch-label');
    expect(label?.textContent?.trim()).toBe('Enable notifications');
  });

  it('should display on/off state labels', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch');
    const tracker = trackRenders(switchEl as HTMLElement);

    switchEl.labelOn = 'ON';
    switchEl.labelOff = 'OFF';
    await tracker.next();

    const onLabel = queryShadow(switchEl as HTMLElement, '.switch-state-label--on');
    const offLabel = queryShadow(switchEl as HTMLElement, '.switch-state-label--off');

    expect(onLabel?.textContent).toBe('ON');
    expect(offLabel?.textContent).toBe('OFF');
  });

  it('should support small size', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { size: 'small' });
    expect(switchEl.size).toBe('small');

    const track = queryShadow(switchEl as HTMLElement, '.switch-track');
    expect(track?.classList.contains('switch-track--small')).toBe(true);
  });

  it('should support medium size (default)', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch');
    expect(switchEl.size).toBe('medium');

    const track = queryShadow(switchEl as HTMLElement, '.switch-track');
    expect(track?.classList.contains('switch-track--medium')).toBe(true);
  });

  it('should support large size', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { size: 'large' });
    expect(switchEl.size).toBe('large');

    const track = queryShadow(switchEl as HTMLElement, '.switch-track');
    expect(track?.classList.contains('switch-track--large')).toBe(true);
  });

  it('should toggle on click', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch');
    expect(switchEl.checked).toBe(false);

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    input.click();

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(switchEl.checked).toBe(true);
  });

  it('should dispatch change event', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch');

    let eventDetail: any = null;
    (switchEl as HTMLElement).addEventListener('switch-change', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    input.click();

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.checked).toBe(true);
    expect(eventDetail.switch).toBe(switchEl);
  });

  it('should have toggle() method', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { checked: false });

    switchEl.toggle();
    expect(switchEl.checked).toBe(true);

    switchEl.toggle();
    expect(switchEl.checked).toBe(false);
  });

  it('should have focus() method', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch');

    // Verify focus method exists and can be called
    expect(typeof switchEl.focus).toBe('function');
    switchEl.focus(); // Should not throw
  });

  it('should update checked state when property changes', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { checked: false });
    const tracker = trackRenders(switchEl as HTMLElement);

    switchEl.checked = true;
    await tracker.next();

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    expect(input?.checked).toBe(true);
  });

  it('should update disabled state when property changes', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { disabled: false });
    const tracker = trackRenders(switchEl as HTMLElement);

    switchEl.disabled = true;
    await tracker.next();

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    expect(input?.disabled).toBe(true);
  });

  it('should update label when property changes', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { label: 'Initial' });
    const tracker = trackRenders(switchEl as HTMLElement);

    switchEl.label = 'Updated';
    await tracker.next();

    const label = queryShadow(switchEl as HTMLElement, '.switch-label');
    expect(label?.textContent).toBe('Updated');
  });

  it('should have correct ARIA attributes', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { checked: true });

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    expect(input?.getAttribute('role')).toBe('switch');
    expect(input?.getAttribute('aria-checked')).toBe('true');
  });

  it('should update ARIA attributes when state changes', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { checked: false, invalid: false });
    const tracker = trackRenders(switchEl as HTMLElement);

    switchEl.checked = true;
    switchEl.invalid = true;
    await tracker.next();

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    expect(input?.getAttribute('aria-checked')).toBe('true');
    expect(input?.getAttribute('aria-invalid')).toBe('true');
  });

  it('should not toggle when disabled', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { disabled: true, checked: false });

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    input.click();

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(switchEl.checked).toBe(false); // Should remain unchecked
  });

  it('should have click() method that triggers input click', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { checked: false });

    switchEl.click();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(switchEl.checked).toBe(true);
  });

  it('should update name attribute dynamically', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { name: 'initial' });
    const tracker = trackRenders(switchEl as HTMLElement);

    switchEl.name = 'updated';
    await tracker.next();

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    expect(input?.name).toBe('updated');
  });

  it('should update value attribute dynamically', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch', { value: 'initial' });
    const tracker = trackRenders(switchEl as HTMLElement);

    switchEl.value = 'updated';
    await tracker.next();

    const input = queryShadow(switchEl as HTMLElement, '.switch-input') as HTMLInputElement;
    expect(input?.value).toBe('updated');
  });

  // Note: happy-dom does not support ElementInternals/attachInternals,
  // so FormData integration cannot be tested here. The form-associated
  // setup is verified structurally below.

  it('should be form-associated', async () => {
    switchEl = await createComponent<SniceSwitchElement>('snice-switch');
    const ctor = (switchEl as any).constructor;
    expect(ctor.formAssociated).toBe(true);
  });
});
