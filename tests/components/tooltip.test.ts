import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, trackRenders } from './test-utils';
import '../../components/tooltip/snice-tooltip';
import type { SniceTooltipElement } from '../../components/tooltip/snice-tooltip.types';

describe('snice-tooltip', () => {
  let tooltip: SniceTooltipElement;

  afterEach(() => {
    if (tooltip) {
      removeComponent(tooltip as HTMLElement);
    }
    // Clean up any portal elements
    const portals = document.querySelectorAll('.snice-tooltip');
    portals.forEach(p => p.remove());
  });

  it('should render tooltip element', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(tooltip).toBeTruthy();
  });

  it('should have empty content by default', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(tooltip.content).toBe('');
  });

  it('should support content property', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.content = 'Tooltip text';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.content).toBe('Tooltip text');
  });

  it('should have default position of top', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(tooltip.position).toBe('top');
  });

  it('should support bottom position', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.position = 'bottom';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.position).toBe('bottom');
  });

  it('should support left position', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.position = 'left';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.position).toBe('left');
  });

  it('should support right position', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.position = 'right';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.position).toBe('right');
  });

  it('should support top-start position', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.position = 'top-start';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.position).toBe('top-start');
  });

  it('should support top-end position', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.position = 'top-end';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.position).toBe('top-end');
  });

  it('should support bottom-start position', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.position = 'bottom-start';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.position).toBe('bottom-start');
  });

  it('should support bottom-end position', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.position = 'bottom-end';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.position).toBe('bottom-end');
  });

  it('should support left-start position', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.position = 'left-start';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.position).toBe('left-start');
  });

  it('should support left-end position', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.position = 'left-end';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.position).toBe('left-end');
  });

  it('should support right-start position', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.position = 'right-start';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.position).toBe('right-start');
  });

  it('should support right-end position', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.position = 'right-end';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.position).toBe('right-end');
  });

  it('should have default trigger of hover', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(tooltip.trigger).toBe('hover');
  });

  it('should support click trigger', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.trigger = 'click';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.trigger).toBe('click');
  });

  it('should support focus trigger', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.trigger = 'focus';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.trigger).toBe('focus');
  });

  it('should support manual trigger', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.trigger = 'manual';
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.trigger).toBe('manual');
  });

  it('should have default delay of 0', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(tooltip.delay).toBe(0);
  });

  it('should support custom delay', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.delay = 500;
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.delay).toBe(500);
  });

  it('should have default hideDelay of 0', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(tooltip.hideDelay).toBe(0);
  });

  it('should support custom hideDelay', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.hideDelay = 300;
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.hideDelay).toBe(300);
  });

  it('should have default offset of 12', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(tooltip.offset).toBe(12);
  });

  it('should support custom offset', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.offset = 20;
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.offset).toBe(20);
  });

  it('should show arrow by default', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(tooltip.arrow).toBe(true);
  });

  it('should support hiding arrow', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.arrow = false;
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.arrow).toBe(false);
  });

  it('should be closed by default', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(tooltip.open).toBe(false);
  });

  it('should support open property', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.open = true;
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.open).toBe(true);
  });

  it('should have default maxWidth of 250', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(tooltip.maxWidth).toBe(250);
  });

  it('should support custom maxWidth', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.maxWidth = 300;
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.maxWidth).toBe(300);
  });

  it('should have default zIndex of 10000', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(tooltip.zIndex).toBe(10000);
  });

  it('should support custom zIndex', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.zIndex = 9999;
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(tooltip.zIndex).toBe(9999);
  });

  it('should have shadow root', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(tooltip.shadowRoot).toBeTruthy();
  });

  it('should render trigger element', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    const trigger = queryShadow(tooltip as HTMLElement, '.tooltip-trigger');
    expect(trigger).toBeTruthy();
  });

  it('should have show() method', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(typeof tooltip.show).toBe('function');
  });

  it('should have hide() method', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(typeof tooltip.hide).toBe('function');
  });

  it('should have toggle() method', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(typeof tooltip.toggle).toBe('function');
  });

  it('should have updatePosition() method', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    expect(typeof tooltip.updatePosition).toBe('function');
  });

  it('should show tooltip when show() is called with content', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test tooltip';

    tooltip.show();
    await new Promise(resolve => setTimeout(resolve, 100));

    const portal = document.querySelector('.snice-tooltip');
    expect(portal).toBeTruthy();
  });

  it('should not show tooltip when show() is called without content', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');

    tooltip.show();
    await new Promise(resolve => setTimeout(resolve, 100));

    const portal = document.querySelector('.snice-tooltip--visible');
    expect(portal).toBeFalsy();
  });

  it('should hide tooltip when hide() is called', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test tooltip';

    tooltip.show();
    await new Promise(resolve => setTimeout(resolve, 100));

    let portal = document.querySelector('.snice-tooltip--visible');
    expect(portal).toBeTruthy();

    tooltip.hide();
    await new Promise(resolve => setTimeout(resolve, 100));

    portal = document.querySelector('.snice-tooltip--visible');
    expect(portal).toBeFalsy();
  });

  it('should toggle tooltip visibility', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test tooltip';

    tooltip.toggle();
    await new Promise(resolve => setTimeout(resolve, 100));

    let portal = document.querySelector('.snice-tooltip--visible');
    expect(portal).toBeTruthy();

    tooltip.toggle();
    await new Promise(resolve => setTimeout(resolve, 100));

    portal = document.querySelector('.snice-tooltip--visible');
    expect(portal).toBeFalsy();
  });

  it('should create portal element with content', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test content';

    tooltip.show();
    await new Promise(resolve => setTimeout(resolve, 100));

    const portal = document.querySelector('.snice-tooltip');
    const content = portal?.querySelector('.snice-tooltip__content');
    expect(content?.textContent).toBe('Test content');
  });

  it('should create portal with arrow when enabled', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test';
    tooltip.arrow = true;

    tooltip.show();
    await new Promise(resolve => setTimeout(resolve, 100));

    const portal = document.querySelector('.snice-tooltip');
    const arrow = portal?.querySelector('.snice-tooltip__arrow');
    expect(arrow).toBeTruthy();
  });

  it('should apply role="tooltip" to portal', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test';

    tooltip.show();
    await new Promise(resolve => setTimeout(resolve, 100));

    const portal = document.querySelector('.snice-tooltip');
    expect(portal?.getAttribute('role')).toBe('tooltip');
  });

  it('should apply custom zIndex to portal', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test';
    tooltip.zIndex = 5000;

    tooltip.show();
    await new Promise(resolve => setTimeout(resolve, 100));

    const portal = document.querySelector('.snice-tooltip') as HTMLElement;
    expect(portal?.style.zIndex).toBe('5000');
  });

  it('should apply custom maxWidth to portal', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test';
    tooltip.maxWidth = 400;

    tooltip.show();
    await new Promise(resolve => setTimeout(resolve, 100));

    const portal = document.querySelector('.snice-tooltip') as HTMLElement;
    expect(portal?.style.maxWidth).toBe('400px');
  });

  it('should show on manual open when trigger is manual', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test';
    tooltip.trigger = 'manual';

    tooltip.open = true;
    await new Promise(resolve => setTimeout(resolve, 100));

    const portal = document.querySelector('.snice-tooltip--visible');
    expect(portal).toBeTruthy();
  });

  it('should hide on manual close when trigger is manual', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test';
    tooltip.trigger = 'manual';
    tooltip.open = true;
    await new Promise(resolve => setTimeout(resolve, 100));

    tooltip.open = false;
    await new Promise(resolve => setTimeout(resolve, 300));

    const portal = document.querySelector('.snice-tooltip--visible');
    expect(portal).toBeFalsy();
  });

  it('should clean up portal on disposal', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test';
    tooltip.show();
    await new Promise(resolve => setTimeout(resolve, 100));

    let portal = document.querySelector('.snice-tooltip');
    expect(portal).toBeTruthy();

    removeComponent(tooltip as HTMLElement);
    tooltip = null as any;

    portal = document.querySelector('.snice-tooltip');
    expect(portal).toBeFalsy();
  });

  it('should update content when changed', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Initial';
    tooltip.show();
    await new Promise(resolve => setTimeout(resolve, 100));

    tooltip.content = 'Updated';
    tooltip.hide();
    await new Promise(resolve => setTimeout(resolve, 300));
    tooltip.show(); // Re-show to update portal content
    await new Promise(resolve => setTimeout(resolve, 100));

    const portal = document.querySelector('.snice-tooltip');
    const content = portal?.querySelector('.snice-tooltip__content');
    expect(content?.textContent).toBe('Updated');
  });

  // Note: Skipping positioning test as trigger is at viewport top in test environment
  it.skip('should position tooltip above trigger for top position', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test';
    tooltip.position = 'top';

    tooltip.show();
    await new Promise(resolve => setTimeout(resolve, 100));

    const portal = document.querySelector('.snice-tooltip') as HTMLElement;
    const triggerRect = tooltip.getBoundingClientRect();
    const portalTop = parseInt(portal?.style.top || '0');

    expect(portalTop).toBeLessThan(triggerRect.top);
  });

  it('should position tooltip below trigger for bottom position', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test';
    tooltip.position = 'bottom';

    tooltip.show();
    await new Promise(resolve => setTimeout(resolve, 100));

    const portal = document.querySelector('.snice-tooltip') as HTMLElement;
    const triggerRect = tooltip.getBoundingClientRect();
    const portalTop = parseInt(portal?.style.top || '0');

    expect(portalTop).toBeGreaterThan(triggerRect.bottom);
  });

  it('should apply position class to portal', async () => {
    tooltip = await createComponent<SniceTooltipElement>('snice-tooltip');
    tooltip.content = 'Test';
    tooltip.position = 'bottom';

    tooltip.show();
    await new Promise(resolve => setTimeout(resolve, 100));

    const portal = document.querySelector('.snice-tooltip');
    expect(portal?.classList.contains('snice-tooltip--bottom')).toBe(true);
  });
});
