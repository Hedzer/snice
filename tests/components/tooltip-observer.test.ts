import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { wait, waitFor } from './test-utils';
import { useTooltips, cleanupTooltips } from '../../src/tooltip-observer';

function cleanupPortals() {
  document.querySelectorAll('.snice-tooltip').forEach(p => p.remove());
}

function cleanupElements() {
  document.querySelectorAll('[tooltip]').forEach(el => el.remove());
}

describe('useTooltips (intrinsic tooltips)', () => {

  beforeEach(() => {
    cleanupTooltips();
    cleanupPortals();
    cleanupElements();
  });

  afterEach(() => {
    cleanupTooltips();
    cleanupPortals();
    cleanupElements();
  });

  // --- Initialization ---

  describe('initialization', () => {
    it('should initialize without errors', () => {
      expect(() => useTooltips()).not.toThrow();
    });

    it('should be idempotent — calling twice does not throw', () => {
      useTooltips();
      expect(() => useTooltips()).not.toThrow();
    });

    it('should process existing [tooltip] elements on init', async () => {
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Hello');
      document.body.appendChild(btn);

      useTooltips();
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip');
      expect(portal).toBeTruthy();
    });

    it('should set globalThis.sniceTooltipsInitialized', () => {
      useTooltips();
      expect((globalThis as any).sniceTooltipsInitialized).toBe(true);
    });
  });

  // --- Cleanup ---

  describe('cleanupTooltips', () => {
    it('should disconnect observer and remove portals', async () => {
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Hello');
      document.body.appendChild(btn);
      useTooltips();
      await wait(50);

      // Show tooltip
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);
      expect(document.querySelector('.snice-tooltip')).toBeTruthy();

      cleanupTooltips();

      expect(document.querySelector('.snice-tooltip')).toBeFalsy();
      expect((globalThis as any).sniceTooltipsInitialized).toBe(false);
    });

    it('should allow re-initialization after cleanup', async () => {
      useTooltips();
      cleanupTooltips();

      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Re-init');
      document.body.appendChild(btn);

      useTooltips();
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip');
      expect(portal).toBeTruthy();
    });
  });

  // --- Hover trigger (default) ---

  describe('hover trigger', () => {
    it('should show tooltip on mouseenter', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Hover text');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip--visible');
      expect(portal).toBeTruthy();
    });

    it('should hide tooltip on mouseleave', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Hover text');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);
      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();

      btn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await wait(300);

      expect(document.querySelector('.snice-tooltip--visible')).toBeFalsy();
    });

    it('should show tooltip on focusin (accessibility)', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Focus text');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip--visible');
      expect(portal).toBeTruthy();
    });

    it('should hide tooltip on focusout', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Focus text');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await wait(100);
      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();

      btn.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      await wait(300);

      expect(document.querySelector('.snice-tooltip--visible')).toBeFalsy();
    });
  });

  // --- Focus trigger ---

  describe('focus trigger', () => {
    it('should show on focusin when trigger is focus', async () => {
      useTooltips();
      const input = document.createElement('input');
      input.setAttribute('tooltip', 'Enter email');
      input.style.setProperty('--tooltip-trigger', 'focus');
      document.body.appendChild(input);
      await wait(50);

      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await wait(100);

      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();
    });

    it('should hide on focusout when trigger is focus', async () => {
      useTooltips();
      const input = document.createElement('input');
      input.setAttribute('tooltip', 'Enter email');
      input.style.setProperty('--tooltip-trigger', 'focus');
      document.body.appendChild(input);
      await wait(50);

      input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await wait(100);
      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();

      input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
      await wait(300);

      expect(document.querySelector('.snice-tooltip--visible')).toBeFalsy();
    });

    it('should NOT show on mouseenter when trigger is focus', async () => {
      useTooltips();
      const input = document.createElement('input');
      input.setAttribute('tooltip', 'Enter email');
      input.style.setProperty('--tooltip-trigger', 'focus');
      document.body.appendChild(input);
      await wait(50);

      input.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      expect(document.querySelector('.snice-tooltip--visible')).toBeFalsy();
    });
  });

  // --- Click trigger ---

  describe('click trigger', () => {
    it('should show on click when trigger is click', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Click info');
      btn.style.setProperty('--tooltip-trigger', 'click');
      document.body.appendChild(btn);
      await wait(50);

      btn.click();
      await wait(100);

      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();
    });

    it('should hide on second click (toggle)', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Click info');
      btn.style.setProperty('--tooltip-trigger', 'click');
      document.body.appendChild(btn);
      await wait(50);

      btn.click();
      await wait(100);
      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();

      btn.click();
      await wait(300);

      expect(document.querySelector('.snice-tooltip--visible')).toBeFalsy();
    });

    it('should NOT show on mouseenter when trigger is click', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Click only');
      btn.style.setProperty('--tooltip-trigger', 'click');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      expect(document.querySelector('.snice-tooltip--visible')).toBeFalsy();
    });
  });

  // --- Portal creation ---

  describe('portal', () => {
    it('should create portal with role="tooltip"', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Test');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip');
      expect(portal?.getAttribute('role')).toBe('tooltip');
    });

    it('should set portal content from attribute', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'My tooltip text');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const content = document.querySelector('.snice-tooltip__content');
      expect(content?.textContent).toBe('My tooltip text');
    });

    it('should create arrow element by default', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'With arrow');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const arrow = document.querySelector('.snice-tooltip__arrow');
      expect(arrow).toBeTruthy();
    });

    it('should not create arrow when --tooltip-arrow is none', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'No arrow');
      btn.style.setProperty('--tooltip-arrow', 'none');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const arrow = document.querySelector('.snice-tooltip__arrow');
      expect(arrow).toBeFalsy();
    });

    it('should apply position class to portal', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Bottom');
      btn.style.setProperty('--tooltip-position', 'bottom');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip');
      expect(portal?.classList.contains('snice-tooltip--bottom')).toBe(true);
    });

    it('should apply z-index from CSS variable', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Z-index test');
      btn.style.setProperty('--tooltip-z-index', '5000');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip') as HTMLElement;
      expect(portal?.style.zIndex).toBe('5000');
    });

    it('should apply max-width from CSS variable', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Max width test');
      btn.style.setProperty('--tooltip-max-width', '400');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip') as HTMLElement;
      expect(portal?.style.maxWidth).toBe('400px');
    });

    it('should apply custom background from CSS variable', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Custom bg');
      btn.style.setProperty('--tooltip-bg', 'red');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip') as HTMLElement;
      expect(portal?.style.background).toBe('red');
    });

    it('should apply custom color from CSS variable', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Custom color');
      btn.style.setProperty('--tooltip-color', 'black');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip') as HTMLElement;
      expect(portal?.style.color).toBe('black');
    });

    it('should apply custom font-size from CSS variable', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Font size test');
      btn.style.setProperty('--tooltip-font-size', '16px');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip') as HTMLElement;
      expect(portal?.style.fontSize).toBe('16px');
    });

    it('should apply custom border-radius from CSS variable', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Radius test');
      btn.style.setProperty('--tooltip-radius', '12px');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip') as HTMLElement;
      expect(portal?.style.borderRadius).toBe('12px');
    });

    it('should apply custom padding from CSS variable', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Padding test');
      btn.style.setProperty('--tooltip-padding', '16px 24px');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip') as HTMLElement;
      expect(portal?.style.padding).toBe('16px 24px');
    });

    it('should not show portal when tooltip attribute is empty', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', '');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      expect(document.querySelector('.snice-tooltip--visible')).toBeFalsy();
    });
  });

  // --- MutationObserver: dynamic elements ---

  describe('dynamic elements', () => {
    it('should attach tooltip to dynamically added element', async () => {
      useTooltips();
      await wait(50);

      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Dynamic');
      document.body.appendChild(btn);
      await wait(50); // MutationObserver is async

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();
    });

    it('should attach tooltip to descendants of dynamically added parent', async () => {
      useTooltips();
      await wait(50);

      const container = document.createElement('div');
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Nested dynamic');
      container.appendChild(btn);
      document.body.appendChild(container);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();

      container.remove();
    });

    it('should clean up when element is removed from DOM', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Remove me');
      document.body.appendChild(btn);
      await wait(50);

      // Show tooltip
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);
      expect(document.querySelector('.snice-tooltip')).toBeTruthy();

      // Remove element — MutationObserver should clean up
      btn.remove();
      await wait(50);

      expect(document.querySelector('.snice-tooltip')).toBeFalsy();
    });

    it('should handle tooltip attribute added after element is in DOM', async () => {
      useTooltips();
      await wait(50);

      const btn = document.createElement('button');
      document.body.appendChild(btn);
      await wait(50);

      // Add tooltip attribute later
      btn.setAttribute('tooltip', 'Added later');
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();
      expect(document.querySelector('.snice-tooltip__content')?.textContent).toBe('Added later');
    });

    it('should handle tooltip attribute removal', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Will be removed');
      document.body.appendChild(btn);
      await wait(50);

      // Show tooltip
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);
      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();

      // Hide first
      btn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await wait(300);

      // Remove attribute
      btn.removeAttribute('tooltip');
      await wait(50);

      // Portal should be cleaned up
      expect(document.querySelector('.snice-tooltip')).toBeFalsy();

      // Hovering again should not create tooltip
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);
      expect(document.querySelector('.snice-tooltip--visible')).toBeFalsy();
    });

    it('should handle tooltip attribute value change', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Original');
      document.body.appendChild(btn);
      await wait(50);

      // Change tooltip text
      btn.setAttribute('tooltip', 'Updated');
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      expect(document.querySelector('.snice-tooltip__content')?.textContent).toBe('Updated');
    });
  });

  // --- Delay ---

  describe('delay', () => {
    it('should delay showing when --tooltip-delay is set', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Delayed');
      btn.style.setProperty('--tooltip-delay', '200');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      // Should not be visible yet
      await wait(50);
      expect(document.querySelector('.snice-tooltip--visible')).toBeFalsy();

      // Should be visible after delay
      await wait(250);
      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();
    });

    it('should delay hiding when --tooltip-hide-delay is set', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Hide delayed');
      btn.style.setProperty('--tooltip-hide-delay', '200');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);
      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();

      btn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

      // Should still be visible (hide delay not elapsed)
      await wait(50);
      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();

      // Should be hidden after delay + transition
      await wait(350);
      expect(document.querySelector('.snice-tooltip--visible')).toBeFalsy();
    });

    it('should cancel show on mouseleave before delay', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Cancel me');
      btn.style.setProperty('--tooltip-delay', '300');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(50);

      // Leave before delay fires
      btn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await wait(400);

      expect(document.querySelector('.snice-tooltip--visible')).toBeFalsy();
    });
  });

  // --- Multiple elements ---

  describe('multiple elements', () => {
    it('should handle multiple [tooltip] elements independently', async () => {
      useTooltips();

      const btn1 = document.createElement('button');
      btn1.setAttribute('tooltip', 'First');
      document.body.appendChild(btn1);

      const btn2 = document.createElement('button');
      btn2.setAttribute('tooltip', 'Second');
      document.body.appendChild(btn2);
      await wait(50);

      // Show first
      btn1.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portals = document.querySelectorAll('.snice-tooltip--visible');
      expect(portals.length).toBe(1);
      expect(document.querySelector('.snice-tooltip__content')?.textContent).toBe('First');

      // Hide first, show second
      btn1.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await wait(300);
      btn2.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const visiblePortals = document.querySelectorAll('.snice-tooltip--visible');
      expect(visiblePortals.length).toBe(1);

      btn2.remove();
    });

    it('should not double-attach if element already tracked', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'No duplicate');
      document.body.appendChild(btn);
      await wait(50);

      // Show tooltip
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      // Only one portal should exist
      expect(document.querySelectorAll('.snice-tooltip').length).toBe(1);
    });
  });

  // --- Portal reuse ---

  describe('portal reuse', () => {
    it('should reuse portal on repeated hover', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Reuse me');
      document.body.appendChild(btn);
      await wait(50);

      // First hover
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);
      btn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await wait(300);

      // Second hover
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      // Should still only have one portal
      expect(document.querySelectorAll('.snice-tooltip').length).toBe(1);
      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();
    });

    it('should update portal styling on re-show when CSS vars change', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Style update');
      document.body.appendChild(btn);
      await wait(50);

      // First show
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip') as HTMLElement;
      expect(portal?.style.background).not.toBe('blue');

      btn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      await wait(300);

      // Change CSS variable
      btn.style.setProperty('--tooltip-bg', 'blue');

      // Re-show
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      expect(portal?.style.background).toBe('blue');
    });
  });

  // --- Positioning ---

  describe('positioning', () => {
    it('should position tooltip below trigger for bottom position', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.textContent = 'Below me';
      btn.setAttribute('tooltip', 'Bottom test');
      btn.style.setProperty('--tooltip-position', 'bottom');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip') as HTMLElement;
      const triggerRect = btn.getBoundingClientRect();
      const portalTop = parseInt(portal?.style.top || '0');

      expect(portalTop).toBeGreaterThanOrEqual(triggerRect.bottom);
    });

    it('should apply strict positioning class without flipping', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Strict top');
      btn.style.setProperty('--tooltip-position', 'top');
      btn.style.setProperty('--tooltip-strict-positioning', 'true');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip');
      expect(portal?.classList.contains('snice-tooltip--top')).toBe(true);
    });

    it('should apply position class for left-end', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Left end');
      btn.style.setProperty('--tooltip-position', 'left-end');
      btn.style.setProperty('--tooltip-strict-positioning', 'true');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip');
      expect(portal?.classList.contains('snice-tooltip--left-end')).toBe(true);
    });

    it('should apply position class for right-start', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Right start');
      btn.style.setProperty('--tooltip-position', 'right-start');
      btn.style.setProperty('--tooltip-strict-positioning', 'true');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip');
      expect(portal?.classList.contains('snice-tooltip--right-start')).toBe(true);
    });
  });

  // --- Defaults ---

  describe('defaults', () => {
    it('should use top position by default', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Default pos');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip');
      // Default is top, but may flip due to viewport — just check a class exists
      expect(portal?.className).toContain('snice-tooltip--');
    });

    it('should use hover trigger by default', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Hover default');
      document.body.appendChild(btn);
      await wait(50);

      // Hover should work
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);
      expect(document.querySelector('.snice-tooltip--visible')).toBeTruthy();
    });

    it('should use default z-index of 10000', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Z default');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip') as HTMLElement;
      expect(portal?.style.zIndex).toBe('10000');
    });

    it('should use default max-width of 250', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Max width default');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip') as HTMLElement;
      expect(portal?.style.maxWidth).toBe('250px');
    });

    it('should use default font-size of 14px', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Font default');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip') as HTMLElement;
      expect(portal?.style.fontSize).toBe('14px');
    });

    it('should use default border-radius of 6px', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Radius default');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      const portal = document.querySelector('.snice-tooltip') as HTMLElement;
      expect(portal?.style.borderRadius).toBe('6px');
    });
  });

  // --- Edge cases ---

  describe('edge cases', () => {
    it('should handle element with no tooltip attribute gracefully', async () => {
      useTooltips();
      const btn = document.createElement('button');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(100);

      expect(document.querySelector('.snice-tooltip')).toBeFalsy();
    });

    it('should handle rapid mouseenter/mouseleave without errors', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Rapid');
      document.body.appendChild(btn);
      await wait(50);

      // Rapid enter/leave
      for (let i = 0; i < 10; i++) {
        btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        btn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      }
      await wait(300);

      // Should not throw, should be hidden
      expect(document.querySelector('.snice-tooltip--visible')).toBeFalsy();
    });

    it('should handle element removal during show delay', async () => {
      useTooltips();
      const btn = document.createElement('button');
      btn.setAttribute('tooltip', 'Removed early');
      btn.style.setProperty('--tooltip-delay', '500');
      document.body.appendChild(btn);
      await wait(50);

      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await wait(50);

      // Remove before delay fires
      btn.remove();
      await wait(600);

      // Should not throw, no visible portal
      expect(document.querySelector('.snice-tooltip--visible')).toBeFalsy();
    });

    it('should work on non-button elements', async () => {
      useTooltips();

      const elements = [
        document.createElement('span'),
        document.createElement('div'),
        document.createElement('a'),
        document.createElement('img'),
      ];

      for (const el of elements) {
        el.setAttribute('tooltip', `Tooltip on ${el.tagName}`);
        document.body.appendChild(el);
      }
      await wait(50);

      for (const el of elements) {
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await wait(100);

        const portal = document.querySelector('.snice-tooltip--visible');
        expect(portal, `Expected portal for <${el.tagName.toLowerCase()}>`).toBeTruthy();

        el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        await wait(300);
      }

      elements.forEach(el => el.remove());
    });

    it('should handle cleanupTooltips called before useTooltips', () => {
      expect(() => cleanupTooltips()).not.toThrow();
    });

    it('should handle detach on element that was never attached', async () => {
      useTooltips();
      const btn = document.createElement('button');
      // No tooltip attribute, just remove it — should not throw
      document.body.appendChild(btn);
      await wait(50);
      btn.remove();
      await wait(50);
      // No error
    });
  });
});
