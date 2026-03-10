import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/grid/snice-grid';
import type { SniceGridElement } from '../../components/grid/snice-grid.types';

describe('snice-grid', () => {
  let el: SniceGridElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render grid element', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      expect(el).toBeTruthy();
      expect(el.tagName).toBe('SNICE-GRID');
    });

    it('should have default properties', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      expect(el.gap).toBe('1rem');
      expect(el.columnWidth).toBe(80);
      expect(el.rowHeight).toBe(80);
      expect(el.columns).toBe(0);
      expect(el.rows).toBe(0);
      expect(el.originLeft).toBe(true);
      expect(el.originTop).toBe(true);
      expect(el.transitionDuration).toBe('0.4s');
      expect(el.stagger).toBe(0);
      expect(el.resize).toBe(true);
    });

    it('should render slot element', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      const slot = el.shadowRoot?.querySelector('slot');
      expect(slot).toBeTruthy();
    });

    it('should render container with role=list', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      const container = el.shadowRoot?.querySelector('.grid');
      expect(container).toBeTruthy();
      expect(container?.getAttribute('role')).toBe('list');
    });

    it('should have part=base on container', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      const container = el.shadowRoot?.querySelector('[part="base"]');
      expect(container).toBeTruthy();
    });
  });

  describe('property reflection', () => {
    it('should reflect gap attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', { gap: '2rem' });
      expect(el.getAttribute('gap')).toBe('2rem');
      expect(el.gap).toBe('2rem');
    });

    it('should reflect column-width attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', { 'column-width': 100 });
      expect(el.columnWidth).toBe(100);
    });

    it('should reflect row-height attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', { 'row-height': 60 });
      expect(el.rowHeight).toBe(60);
    });

    it('should reflect columns attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', { columns: 5 });
      expect(el.columns).toBe(5);
    });

    it('should reflect rows attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', { rows: 4 });
      expect(el.rows).toBe(4);
    });

    it('should reflect origin-left attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', { 'origin-left': false });
      expect(el.originLeft).toBe(false);
    });

    it('should reflect origin-top attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', { 'origin-top': false });
      expect(el.originTop).toBe(false);
    });

    it('should reflect transition-duration attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', { 'transition-duration': '1s' });
      expect(el.transitionDuration).toBe('1s');
    });

    it('should reflect stagger attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', { stagger: 50 });
      expect(el.stagger).toBe(50);
    });

    it('should reflect resize attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', { resize: false });
      expect(el.resize).toBe(false);
    });
  });

  describe('API methods', () => {
    it('should expose layout() method', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      expect(typeof el.layout).toBe('function');
      el.layout();
    });

    it('should expose fit() method', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      expect(typeof el.fit).toBe('function');
    });

    it('should expose reloadItems() method', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      expect(typeof el.reloadItems).toBe('function');
      el.reloadItems();
    });

    it('should expose getItemElements() method', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      expect(typeof el.getItemElements).toBe('function');
      const items = el.getItemElements();
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(0);
    });

    it('should collect slotted items via getItemElements()', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      const item1 = document.createElement('div');
      item1.setAttribute('name', 'a');
      item1.setAttribute('grid-col', '0');
      item1.setAttribute('grid-row', '0');
      const item2 = document.createElement('div');
      item2.setAttribute('name', 'b');
      item2.setAttribute('grid-col', '1');
      item2.setAttribute('grid-row', '0');
      el.appendChild(item1);
      el.appendChild(item2);
      await wait(50);
      el.reloadItems();
      await wait(50);
      const items = el.getItemElements();
      expect(items).toHaveLength(2);
      expect(items).toContain(item1);
      expect(items).toContain(item2);
    });

    it('should position item at grid coordinates via fit()', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80, 'row-height': 80, gap: '0px'
      });
      const item = document.createElement('div');
      item.setAttribute('name', 'a');
      item.setAttribute('grid-col', '0');
      item.setAttribute('grid-row', '0');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();
      el.fit(item, 2, 3);
      expect(item.style.transform).toContain('160');
      expect(item.style.transform).toContain('240');
    });

    it('should ignore fit() on unknown elements', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      const outsider = document.createElement('div');
      el.fit(outsider, 1, 1);
    });
  });

  describe('grid positioning', () => {
    it('should position items based on grid-col and grid-row attributes', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 100, 'row-height': 50, gap: '10px'
      });
      const item = document.createElement('div');
      item.setAttribute('name', 'a');
      item.setAttribute('grid-col', '2');
      item.setAttribute('grid-row', '1');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();
      el.layout();
      expect(item.style.transform).toBe('translate(220px, 60px)');
    });

    it('should auto-size items to colspan x rowspan', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80, 'row-height': 80, gap: '8px'
      });
      const item = document.createElement('div');
      item.setAttribute('name', 'a');
      item.setAttribute('grid-col', '0');
      item.setAttribute('grid-row', '0');
      item.setAttribute('grid-colspan', '2');
      item.setAttribute('grid-rowspan', '3');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();
      el.layout();
      expect(item.style.width).toBe('168px');
      expect(item.style.height).toBe('256px');
    });

    it('should hide items with hidden attribute', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      const item = document.createElement('div');
      item.setAttribute('name', 'a');
      item.setAttribute('grid-col', '0');
      item.setAttribute('grid-row', '0');
      item.setAttribute('hidden', '');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();
      el.layout();
      expect(item.style.transform).toBe('');
    });
  });

  describe('collision resolution', () => {
    it('should push item right when position is occupied', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80, 'row-height': 80, gap: '0px'
      });
      const item1 = document.createElement('div');
      item1.setAttribute('name', 'a');
      item1.setAttribute('grid-col', '0');
      item1.setAttribute('grid-row', '0');
      const item2 = document.createElement('div');
      item2.setAttribute('name', 'b');
      item2.setAttribute('grid-col', '0');
      item2.setAttribute('grid-row', '0');
      el.appendChild(item1);
      el.appendChild(item2);
      await wait(50);
      el.reloadItems();
      el.layout();
      expect(item1.style.transform).toBe('translate(0px, 0px)');
      expect(item2.style.transform).toBe('translate(80px, 0px)');
    });

    it('should push to next row when row is full', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80, 'row-height': 80, gap: '0px', columns: 2
      });
      const items: HTMLElement[] = [];
      for (let i = 0; i < 3; i++) {
        const item = document.createElement('div');
        item.setAttribute('name', String.fromCharCode(97 + i));
        item.setAttribute('grid-col', '0');
        item.setAttribute('grid-row', '0');
        items.push(item);
        el.appendChild(item);
      }
      await wait(50);
      el.reloadItems();
      el.layout();
      expect(items[0].style.transform).toBe('translate(0px, 0px)');
      expect(items[1].style.transform).toBe('translate(80px, 0px)');
      expect(items[2].style.transform).toBe('translate(0px, 80px)');
    });

    it('should swap items when one is placed on another with different origin', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80, 'row-height': 80, gap: '0px'
      });
      // item1 at (0,0), item2 at (2,0)
      const item1 = document.createElement('div');
      item1.setAttribute('name', 'a');
      item1.setAttribute('grid-col', '0');
      item1.setAttribute('grid-row', '0');
      const item2 = document.createElement('div');
      item2.setAttribute('name', 'b');
      item2.setAttribute('grid-col', '2');
      item2.setAttribute('grid-row', '0');
      el.appendChild(item1);
      el.appendChild(item2);
      await wait(50);
      el.reloadItems();
      el.layout();

      // Verify initial positions
      expect(item1.style.transform).toBe('translate(0px, 0px)');
      expect(item2.style.transform).toBe('translate(160px, 0px)');

      // Now move item2 to (0,0) — should swap with item1
      item2.setAttribute('grid-col', '0');
      item2.setAttribute('grid-row', '0');
      el.layout();

      // item1 should swap to (2,0) where item2 came from
      // item2 should be at (0,0)
      expect(item1.style.transform).toBe('translate(160px, 0px)');
      expect(item2.style.transform).toBe('translate(0px, 0px)');
    });

    it('should handle colspan collision', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80, 'row-height': 80, gap: '0px', columns: 4
      });
      const item1 = document.createElement('div');
      item1.setAttribute('name', 'a');
      item1.setAttribute('grid-col', '0');
      item1.setAttribute('grid-row', '0');
      item1.setAttribute('grid-colspan', '2');
      const item2 = document.createElement('div');
      item2.setAttribute('name', 'b');
      item2.setAttribute('grid-col', '1');
      item2.setAttribute('grid-row', '0');
      el.appendChild(item1);
      el.appendChild(item2);
      await wait(50);
      el.reloadItems();
      el.layout();
      expect(item1.style.transform).toBe('translate(0px, 0px)');
      expect(item2.style.transform).toBe('translate(160px, 0px)');
    });
  });

  describe('layout persistence', () => {
    it('should return layout via getLayout()', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80, 'row-height': 80, gap: '0px'
      });
      const item = document.createElement('div');
      item.setAttribute('name', 'myitem');
      item.setAttribute('grid-col', '2');
      item.setAttribute('grid-row', '3');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();
      el.layout();
      const layout = el.getLayout();
      expect(layout['myitem']).toBeDefined();
      expect(layout['myitem'].col).toBe(2);
      expect(layout['myitem'].row).toBe(3);
      expect(layout['myitem'].order).toBe(0);
    });

    it('should restore layout via setLayout()', async () => {
      el = await createComponent<SniceGridElement>('snice-grid', {
        'column-width': 80, 'row-height': 80, gap: '0px'
      });
      const item = document.createElement('div');
      item.setAttribute('name', 'myitem');
      item.setAttribute('grid-col', '0');
      item.setAttribute('grid-row', '0');
      el.appendChild(item);
      await wait(50);
      el.reloadItems();
      el.setLayout({ myitem: { col: 3, row: 2, order: 0 } });
      expect(item.style.transform).toBe('translate(240px, 160px)');
    });
  });

  describe('events', () => {
    it('should fire grid-layout-complete on layout()', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      let eventFired = false;
      (el as HTMLElement).addEventListener('grid-layout-complete', () => { eventFired = true; });
      el.layout();
      expect(eventFired).toBe(true);
    });
  });

  describe('ready attribute', () => {
    it('should set ready attribute after initialization', async () => {
      el = await createComponent<SniceGridElement>('snice-grid');
      await wait(20);
      expect(el.hasAttribute('ready')).toBe(true);
    });
  });
});
