import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait, triggerKeyboardEvent } from './test-utils';
import '../../components/action-bar/snice-action-bar';
import type { SniceActionBarElement } from '../../components/action-bar/snice-action-bar.types';

describe('snice-action-bar', () => {
  let el: SniceActionBarElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render action-bar element', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar');
      expect(el).toBeTruthy();
      expect(el.tagName).toBe('SNICE-ACTION-BAR');
    });

    it('should have default properties', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar');
      expect(el.open).toBe(false);
      expect(el.position).toBe('bottom');
      expect(el.size).toBe('medium');
      expect(el.variant).toBe('default');
      expect(el.noAnimation).toBe(false);
      expect(el.noEscapeDismiss).toBe(false);
    });

    it('should render toolbar container', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar');
      await wait(50);

      const toolbar = queryShadow(el as HTMLElement, '.action-bar');
      expect(toolbar).toBeTruthy();
      expect(toolbar?.getAttribute('role')).toBe('toolbar');
    });

    it('should render slotted content', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar');
      await wait(50);

      const slot = queryShadow(el as HTMLElement, 'slot');
      expect(slot).toBeTruthy();
    });
  });

  describe('open state', () => {
    it('should reflect open attribute', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar', {
        open: true
      });
      await wait(50);

      expect(el.open).toBe(true);
      expect(el.hasAttribute('open')).toBe(true);
    });

    it('should remove open attribute when closed', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar', {
        open: true
      });
      await wait(50);

      el.open = false;
      await wait(50);

      expect(el.hasAttribute('open')).toBe(false);
    });

    it('should dispatch action-bar-open event when opened', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar');
      await wait(50);

      let eventFired = false;
      (el as HTMLElement).addEventListener('action-bar-open', () => {
        eventFired = true;
      });

      el.open = true;
      await wait(50);

      expect(eventFired).toBe(true);
    });

    it('should dispatch action-bar-close event when closed', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar', {
        open: true
      });
      await wait(50);

      let eventFired = false;
      (el as HTMLElement).addEventListener('action-bar-close', () => {
        eventFired = true;
      });

      el.open = false;
      await wait(50);

      expect(eventFired).toBe(true);
    });
  });

  describe('API methods', () => {
    it('should support show method', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar');
      await wait(50);

      el.show();
      expect(el.open).toBe(true);
    });

    it('should support hide method', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar', {
        open: true
      });
      await wait(50);

      el.hide();
      expect(el.open).toBe(false);
    });

    it('should support toggle method', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar');
      await wait(50);

      el.toggle();
      expect(el.open).toBe(true);

      el.toggle();
      expect(el.open).toBe(false);
    });
  });

  describe('position', () => {
    const positions = ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];

    positions.forEach(position => {
      it(`should support ${position} position`, async () => {
        el = await createComponent<SniceActionBarElement>('snice-action-bar', {
          position
        });
        expect(el.position).toBe(position);
        expect(el.getAttribute('position')).toBe(position);
      });
    });
  });

  describe('variant', () => {
    it('should apply pill variant', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar', {
        variant: 'pill'
      });
      expect(el.variant).toBe('pill');
      expect(el.getAttribute('variant')).toBe('pill');
    });
  });

  describe('size', () => {
    it('should apply small size', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar', {
        size: 'small'
      });
      expect(el.size).toBe('small');
      expect(el.getAttribute('size')).toBe('small');
    });
  });

  describe('no-animation mode', () => {
    it('should be always visible when no-animation is set', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar', {
        'no-animation': true
      });
      await wait(50);

      expect(el.noAnimation).toBe(true);
      expect(el.hasAttribute('no-animation')).toBe(true);
    });
  });

  describe('keyboard navigation', () => {
    it('should close on Escape key', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar', {
        open: true
      });
      await wait(50);

      triggerKeyboardEvent(el as HTMLElement, 'Escape');
      await wait(50);

      expect(el.open).toBe(false);
    });

    it('should not close on Escape when no-escape-dismiss is set', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar', {
        open: true,
        'no-escape-dismiss': true
      });
      await wait(50);

      triggerKeyboardEvent(el as HTMLElement, 'Escape');
      await wait(50);

      expect(el.open).toBe(true);
    });

    it('should navigate between focusable children with arrow keys', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar', {
        open: true
      });

      const btn1 = document.createElement('button');
      btn1.textContent = 'Action 1';
      const btn2 = document.createElement('button');
      btn2.textContent = 'Action 2';
      const btn3 = document.createElement('button');
      btn3.textContent = 'Action 3';

      el.appendChild(btn1);
      el.appendChild(btn2);
      el.appendChild(btn3);
      await wait(100);

      btn1.focus();
      expect(document.activeElement).toBe(btn1);

      triggerKeyboardEvent(el as HTMLElement, 'ArrowRight');
      await wait(50);
      expect(document.activeElement).toBe(btn2);

      triggerKeyboardEvent(el as HTMLElement, 'ArrowRight');
      await wait(50);
      expect(document.activeElement).toBe(btn3);

      // Should wrap around
      triggerKeyboardEvent(el as HTMLElement, 'ArrowRight');
      await wait(50);
      expect(document.activeElement).toBe(btn1);
    });

    it('should navigate to first/last with Home/End', async () => {
      el = await createComponent<SniceActionBarElement>('snice-action-bar', {
        open: true
      });

      const btn1 = document.createElement('button');
      btn1.textContent = 'Action 1';
      const btn2 = document.createElement('button');
      btn2.textContent = 'Action 2';
      const btn3 = document.createElement('button');
      btn3.textContent = 'Action 3';

      el.appendChild(btn1);
      el.appendChild(btn2);
      el.appendChild(btn3);
      await wait(100);

      btn1.focus();

      triggerKeyboardEvent(el as HTMLElement, 'End');
      await wait(50);
      expect(document.activeElement).toBe(btn3);

      triggerKeyboardEvent(el as HTMLElement, 'Home');
      await wait(50);
      expect(document.activeElement).toBe(btn1);
    });
  });
});
