import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/popover/snice-popover';
import type { SnicePopoverElement } from '../../components/popover/snice-popover.types';

describe('snice-popover', () => {
  let popover: SnicePopoverElement;

  afterEach(() => {
    if (popover) {
      removeComponent(popover as HTMLElement);
    }
  });

  it('should render', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover');
    expect(popover).toBeTruthy();
  });

  it('should have default properties', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover');
    expect(popover.open).toBe(false);
    expect(popover.placement).toBe('top');
    expect(popover.trigger).toBe('click');
    expect(popover.showArrow).toBe(true);
    expect(popover.closeOnClickOutside).toBe(true);
    expect(popover.closeOnEscape).toBe(true);
  });

  it('should support different placements', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover', {
      placement: 'bottom'
    });
    expect(popover.placement).toBe('bottom');
  });

  it('should support different triggers', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover', {
      trigger: 'hover'
    });
    expect(popover.trigger).toBe('hover');
  });

  it('should show popover', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover');
    popover.show();
    await wait();
    expect(popover.open).toBe(true);
  });

  it('should hide popover', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover');
    popover.show();
    await wait();
    popover.hide();
    await wait();
    expect(popover.open).toBe(false);
  });

  it('should toggle popover', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover');
    expect(popover.open).toBe(false);

    popover.toggle();
    await wait();
    expect(popover.open).toBe(true);

    popover.toggle();
    await wait();
    expect(popover.open).toBe(false);
  });

  it('should support custom distance', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover', {
      distance: 16
    });
    expect(popover.distance).toBe(16);
  });

  it('should support hiding arrow', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover', {
      'show-arrow': false
    });
    expect(popover.showArrow).toBe(false);
  });

  it('should support closeOnClickOutside', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover', {
      'close-on-click-outside': false
    });
    expect(popover.closeOnClickOutside).toBe(false);
  });

  it('should support closeOnEscape', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover', {
      'close-on-escape': false
    });
    expect(popover.closeOnEscape).toBe(false);
  });

  it('should support hover delay', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover', {
      'hover-delay': 500
    });
    expect(popover.hoverDelay).toBe(500);
  });

  it('should support target selector', async () => {
    popover = await createComponent<SnicePopoverElement>('snice-popover', {
      'target-selector': '#my-button'
    });
    expect(popover.targetSelector).toBe('#my-button');
  });
});
