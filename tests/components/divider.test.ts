import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, trackRenders } from './test-utils';
import '../../components/divider/snice-divider';
import type { SniceDividerElement } from '../../components/divider/snice-divider.types';

describe('snice-divider', () => {
  let divider: SniceDividerElement;

  afterEach(() => {
    if (divider) {
      removeComponent(divider as HTMLElement);
    }
  });

  it('should render divider element', async () => {
    divider = await createComponent<SniceDividerElement>('snice-divider');
    expect(divider).toBeTruthy();
  });

  it('should render simple horizontal divider by default', async () => {
    divider = await createComponent<SniceDividerElement>('snice-divider');
    const divEl = queryShadow(divider as HTMLElement, '.divider');
    expect(divEl).toBeTruthy();
    expect(divEl?.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('should render with text when provided', async () => {
    divider = await createComponent<SniceDividerElement>('snice-divider', { text: 'OR' });

    const container = queryShadow(divider as HTMLElement, '.divider-container');
    expect(container).toBeTruthy();

    const textEl = queryShadow(divider as HTMLElement, '.divider-text');
    expect(textEl?.textContent).toBe('OR');
  });

  it('should show text only for horizontal orientation', async () => {
    divider = await createComponent<SniceDividerElement>('snice-divider', { text: 'Test', orientation: 'vertical' });

    const container = queryShadow(divider as HTMLElement, '.divider-container');
    expect(container).toBeFalsy(); // No container for vertical with text

    const divEl = queryShadow(divider as HTMLElement, '.divider');
    expect(divEl).toBeTruthy(); // Just simple divider
  });

  it('should update text dynamically', async () => {
    divider = await createComponent<SniceDividerElement>('snice-divider', { text: 'First' });

    let textEl = queryShadow(divider as HTMLElement, '.divider-text');
    expect(textEl?.textContent).toBe('First');

    const tracker = trackRenders(divider as HTMLElement);
    divider.text = 'Second';
    await tracker.next();

    textEl = queryShadow(divider as HTMLElement, '.divider-text');
    expect(textEl?.textContent).toBe('Second');
  });

  it('should apply custom text background', async () => {
    divider = await createComponent<SniceDividerElement>('snice-divider');

    divider.textBackground = '#fff';

    const style = (divider as HTMLElement).style.getPropertyValue('--divider-text-bg');
    expect(style).toBe('#fff');
  });

  it('should apply custom color', async () => {
    divider = await createComponent<SniceDividerElement>('snice-divider');

    divider.color = '#ff0000';

    const style = (divider as HTMLElement).style.getPropertyValue('--divider-color');
    expect(style).toBe('#ff0000');
  });
});
