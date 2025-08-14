import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, query, queryAll } from '../src/element';

describe('Query Light vs Shadow DOM', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('@query decorator', () => {
    it('should query shadow DOM by default', () => {
      @element('test-shadow-query')
      class TestShadowQuery extends HTMLElement {
        @query('.shadow-element')
        shadowEl?: HTMLElement;

        @query('.light-element')
        lightEl?: HTMLElement;

        html() {
          return '<div class="shadow-element">Shadow</div>';
        }
      }

      const el = document.createElement('test-shadow-query') as any;
      const lightDiv = document.createElement('div');
      lightDiv.className = 'light-element';
      lightDiv.textContent = 'Light';
      el.appendChild(lightDiv);
      
      container.appendChild(el);

      // Should find shadow DOM element
      expect(el.shadowEl).toBeDefined();
      expect(el.shadowEl?.textContent).toBe('Shadow');

      // Should not find light DOM element when querying shadow
      expect(el.lightEl).toBeNull();
    });

    it('should query light DOM when search:"light" is specified', () => {
      @element('test-light-query')
      class TestLightQuery extends HTMLElement {
        @query('.light-element', { light: true, shadow: false })
        lightEl?: HTMLElement;

        @query('.shadow-element', { light: true, shadow: false })
        shadowEl?: HTMLElement;

        html() {
          return '<div class="shadow-element">Shadow</div>';
        }
      }

      const el = document.createElement('test-light-query') as any;
      const lightDiv = document.createElement('div');
      lightDiv.className = 'light-element';
      lightDiv.textContent = 'Light';
      el.appendChild(lightDiv);
      
      container.appendChild(el);

      // Should find light DOM element
      expect(el.lightEl).toBeDefined();
      expect(el.lightEl?.textContent).toBe('Light');

      // Should not find shadow DOM element when querying light
      expect(el.shadowEl).toBeNull();
    });

    it('should handle slotted content with light DOM query', () => {
      @element('test-slot-query')
      class TestSlotQuery extends HTMLElement {
        @query('slot[name="content"]')
        slot?: HTMLSlotElement;

        @query('[slot="content"]', { light: true, shadow: false })
        slottedContent?: HTMLElement;

        html() {
          return '<slot name="content"></slot>';
        }
      }

      const el = document.createElement('test-slot-query') as any;
      const slotted = document.createElement('div');
      slotted.setAttribute('slot', 'content');
      slotted.textContent = 'Slotted';
      el.appendChild(slotted);
      
      container.appendChild(el);

      // Should find slot in shadow DOM
      expect(el.slot).toBeDefined();
      expect(el.slot?.name).toBe('content');

      // Should find slotted content in light DOM
      expect(el.slottedContent).toBeDefined();
      expect(el.slottedContent?.textContent).toBe('Slotted');
    });
  });

  describe('@queryAll decorator', () => {
    it('should query all in shadow DOM by default', () => {
      @element('test-shadow-query-all')
      class TestShadowQueryAll extends HTMLElement {
        @queryAll('.item')
        shadowItems?: NodeListOf<HTMLElement>;

        html() {
          return `
            <div class="item">Shadow 1</div>
            <div class="item">Shadow 2</div>
            <div class="item">Shadow 3</div>
          `;
        }
      }

      const el = document.createElement('test-shadow-query-all') as any;
      
      // Add light DOM items
      for (let i = 1; i <= 2; i++) {
        const item = document.createElement('div');
        item.className = 'item';
        item.textContent = `Light ${i}`;
        el.appendChild(item);
      }
      
      container.appendChild(el);

      // Should find shadow DOM items only
      expect(el.shadowItems).toBeDefined();
      expect(el.shadowItems?.length).toBe(3);
      expect(el.shadowItems?.[0].textContent).toBe('Shadow 1');
      expect(el.shadowItems?.[2].textContent).toBe('Shadow 3');
    });

    it('should query all in light DOM when search:"light" is specified', () => {
      @element('test-light-query-all')
      class TestLightQueryAll extends HTMLElement {
        @queryAll('.item', { light: true, shadow: false })
        lightItems?: NodeListOf<HTMLElement>;

        html() {
          return `
            <div class="item">Shadow 1</div>
            <div class="item">Shadow 2</div>
          `;
        }
      }

      const el = document.createElement('test-light-query-all') as any;
      
      // Add light DOM items
      for (let i = 1; i <= 3; i++) {
        const item = document.createElement('div');
        item.className = 'item';
        item.textContent = `Light ${i}`;
        el.appendChild(item);
      }
      
      container.appendChild(el);

      // Should find light DOM items only
      expect(el.lightItems).toBeDefined();
      expect(el.lightItems?.length).toBe(3);
      expect(el.lightItems?.[0].textContent).toBe('Light 1');
      expect(el.lightItems?.[2].textContent).toBe('Light 3');
    });

    it('should handle complex selectors in light DOM', () => {
      @element('test-complex-selector')
      class TestComplexSelector extends HTMLElement {
        @queryAll('div[data-tab][aria-selected="true"]', { light: true, shadow: false })
        selectedTabs?: NodeListOf<HTMLElement>;

        @queryAll('div.panel:not([hidden])', { light: true, shadow: false })
        visiblePanels?: NodeListOf<HTMLElement>;

        html() {
          return '<div>Shadow Content</div>';
        }
      }

      const el = document.createElement('test-complex-selector') as any;
      
      // Add tabs
      for (let i = 1; i <= 3; i++) {
        const tab = document.createElement('div');
        tab.setAttribute('data-tab', `tab-${i}`);
        tab.setAttribute('aria-selected', i === 2 ? 'true' : 'false');
        tab.textContent = `Tab ${i}`;
        el.appendChild(tab);
      }
      
      // Add panels
      for (let i = 1; i <= 3; i++) {
        const panel = document.createElement('div');
        panel.className = 'panel';
        if (i !== 2) panel.hidden = true;
        panel.textContent = `Panel ${i}`;
        el.appendChild(panel);
      }
      
      container.appendChild(el);

      // Should find only selected tabs
      expect(el.selectedTabs).toBeDefined();
      expect(el.selectedTabs?.length).toBe(1);
      expect(el.selectedTabs?.[0].textContent).toBe('Tab 2');

      // Should find only visible panels
      expect(el.visiblePanels).toBeDefined();
      expect(el.visiblePanels?.length).toBe(1);
      expect(el.visiblePanels?.[0].textContent).toBe('Panel 2');
    });
  });

  describe('Elements without shadow DOM', () => {
    it('should query light DOM when no shadow root exists', async () => {
      @element('test-no-shadow')
      class TestNoShadow extends HTMLElement {
        @query('.element', { light: true, shadow: false })
        element?: HTMLElement;

        @queryAll('.item', { light: true, shadow: false })
        items?: NodeListOf<HTMLElement>;

        // No html() method, so no shadow DOM
      }

      const el = document.createElement('test-no-shadow') as any;
      
      const div = document.createElement('div');
      div.className = 'element';
      div.textContent = 'Element';
      el.appendChild(div);
      
      for (let i = 1; i <= 2; i++) {
        const item = document.createElement('div');
        item.className = 'item';
        item.textContent = `Item ${i}`;
        el.appendChild(item);
      }
      
      // Need to append to DOM first for element to be connected
      container.appendChild(el);
      
      // Wait for element to be ready
      await el.ready;

      // Should find in light DOM when no shadow root
      expect(el.element).toBeDefined();
      expect(el.element?.textContent).toBe('Element');
      
      expect(el.items).toBeDefined();
      expect(el.items?.length).toBe(2);
    });
  });

  describe('Performance considerations', () => {
    it('should cache query results appropriately', () => {
      @element('test-cache')
      class TestCache extends HTMLElement {
        @query('.cached')
        cached?: HTMLElement;

        html() {
          return '<div class="cached">Cached</div>';
        }
      }

      const el = document.createElement('test-cache') as any;
      container.appendChild(el);

      // Access multiple times - should return same element
      const first = el.cached;
      const second = el.cached;
      
      expect(first).toBe(second);
      expect(first).toBeDefined();
    });
  });
});