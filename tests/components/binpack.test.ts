import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/binpack/snice-binpack';
import type { SniceBinpackElement } from '../../components/binpack/snice-binpack.types';

describe('snice-binpack', () => {
  let el: SniceBinpackElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render binpack element', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');
      expect(el).toBeTruthy();
      expect(el.tagName).toBe('SNICE-BINPACK');
    });

    it('should have default properties', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');
      expect(el.gap).toBe('1rem');
      expect(el.columnWidth).toBe(0);
      expect(el.rowHeight).toBe(0);
      expect(el.horizontal).toBe(false);
      expect(el.originLeft).toBe(true);
      expect(el.originTop).toBe(true);
      expect(el.transitionDuration).toBe('0.4s');
      expect(el.stagger).toBe(0);
      expect(el.resize).toBe(true);
    });

    it('should render slot element', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');
      const slot = el.shadowRoot?.querySelector('slot');
      expect(slot).toBeTruthy();
    });

    it('should render container with role=list', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');
      const container = el.shadowRoot?.querySelector('.binpack');
      expect(container).toBeTruthy();
      expect(container?.getAttribute('role')).toBe('list');
    });

    it('should have part=base on container', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');
      const container = el.shadowRoot?.querySelector('[part="base"]');
      expect(container).toBeTruthy();
    });
  });

  describe('property reflection', () => {
    it('should reflect gap attribute', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack', {
        gap: '2rem'
      });
      expect(el.getAttribute('gap')).toBe('2rem');
      expect(el.gap).toBe('2rem');
    });

    it('should reflect column-width attribute', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack', {
        'column-width': 80
      });
      expect(el.columnWidth).toBe(80);
    });

    it('should reflect row-height attribute', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack', {
        'row-height': 60
      });
      expect(el.rowHeight).toBe(60);
    });

    it('should reflect horizontal attribute', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack', {
        horizontal: true
      });
      expect(el.horizontal).toBe(true);
    });

    it('should reflect origin-left attribute', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack', {
        'origin-left': false
      });
      expect(el.originLeft).toBe(false);
    });

    it('should reflect origin-top attribute', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack', {
        'origin-top': false
      });
      expect(el.originTop).toBe(false);
    });

    it('should reflect transition-duration attribute', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack', {
        'transition-duration': '1s'
      });
      expect(el.transitionDuration).toBe('1s');
    });

    it('should reflect stagger attribute', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack', {
        stagger: 50
      });
      expect(el.stagger).toBe(50);
    });

    it('should reflect resize attribute', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack', {
        resize: false
      });
      expect(el.resize).toBe(false);
    });
  });

  describe('API methods', () => {
    it('should expose layout() method', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');
      expect(typeof el.layout).toBe('function');
      // Should not throw
      el.layout();
    });

    it('should expose fit() method', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');
      expect(typeof el.fit).toBe('function');
    });

    it('should expose reloadItems() method', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');
      expect(typeof el.reloadItems).toBe('function');
      el.reloadItems();
    });

    it('should expose stamp() and unstamp() methods', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');
      expect(typeof el.stamp).toBe('function');
      expect(typeof el.unstamp).toBe('function');
    });

    it('should expose getItemElements() method', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');
      expect(typeof el.getItemElements).toBe('function');
      const items = el.getItemElements();
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(0);
    });

    it('should collect slotted items via getItemElements()', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');

      const item1 = document.createElement('div');
      const item2 = document.createElement('div');
      el.appendChild(item1);
      el.appendChild(item2);
      await wait(50);

      // Reload to pick up new items
      el.reloadItems();
      await wait(50);

      const items = el.getItemElements();
      expect(items).toHaveLength(2);
      expect(items).toContain(item1);
      expect(items).toContain(item2);
    });

    it('should fit() a known item without error', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');

      const item = document.createElement('div');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();

      // Should not throw even in jsdom where dimensions are 0
      el.fit(item, 100, 50);
      expect(item.style.transform).toContain('100');
      expect(item.style.transform).toContain('50');
    });

    it('should ignore fit() on unknown elements', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');
      const outsider = document.createElement('div');
      // Should not throw
      el.fit(outsider, 10, 10);
    });

    it('should stamp and unstamp elements', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');

      const stamped = document.createElement('div');
      el.appendChild(stamped);
      await wait(50);

      el.stamp(stamped);
      // stamp() should not throw and layout should work
      el.layout();

      el.unstamp(stamped);
      el.layout();
    });
  });

  describe('events', () => {
    it('should fire binpack-layout-complete on layout()', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');

      let eventFired = false;
      (el as HTMLElement).addEventListener('binpack-layout-complete', () => {
        eventFired = true;
      });

      el.layout();
      expect(eventFired).toBe(true);
    });

    it('should fire binpack-fit-complete on fit()', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');

      const item = document.createElement('div');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();

      let eventFired = false;
      let eventDetail: any = null;
      (el as HTMLElement).addEventListener('binpack-fit-complete', ((e: CustomEvent) => {
        eventFired = true;
        eventDetail = e.detail;
      }) as EventListener);

      el.fit(item, 50, 50);
      expect(eventFired).toBe(true);
      expect(eventDetail.item).toBe(item);
    });
  });

  describe('ready attribute', () => {
    it('should set ready attribute after initialization', async () => {
      el = await createComponent<SniceBinpackElement>('snice-binpack');
      // ready is set with 10ms delay
      await wait(20);
      expect(el.hasAttribute('ready')).toBe(true);
    });
  });
});
