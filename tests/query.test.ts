import { describe, it, expect, beforeEach } from 'vitest';
import { element, query, queryAll } from '../src/element';

describe('query decorators', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('@query decorator', () => {
    it('should query single element', () => {
      @element('test-query-basic')
      class TestQueryBasic extends HTMLElement {
        @query('.test')
        testEl?: HTMLElement;
        
        html() {
          return '<div class="test">Test Content</div>';
        }
      }
      
      const el = document.createElement('test-query-basic') as any;
      document.body.appendChild(el);
      
      expect(el.testEl).toBeDefined();
      expect(el.testEl?.className).toBe('test');
      expect(el.testEl?.textContent).toBe('Test Content');
    });

    it('should return null if element not found', () => {
      @element('test-query-null')
      class TestQueryNull extends HTMLElement {
        @query('.missing')
        missingEl?: HTMLElement;
        
        html() {
          return '<div class="present">Present</div>';
        }
      }
      
      const el = document.createElement('test-query-null') as any;
      document.body.appendChild(el);
      
      expect(el.missingEl).toBeNull();
    });

    it('should query nested elements', () => {
      @element('test-query-nested')
      class TestQueryNested extends HTMLElement {
        @query('.parent .child')
        nestedEl?: HTMLElement;
        
        html() {
          return `
            <div class="parent">
              <div class="child">Nested</div>
            </div>
          `;
        }
      }
      
      const el = document.createElement('test-query-nested') as any;
      document.body.appendChild(el);
      
      expect(el.nestedEl).toBeDefined();
      expect(el.nestedEl?.textContent).toBe('Nested');
    });

    it('should query by ID', () => {
      @element('test-query-id')
      class TestQueryId extends HTMLElement {
        @query('#unique')
        uniqueEl?: HTMLElement;
        
        html() {
          return '<div id="unique">Unique Element</div>';
        }
      }
      
      const el = document.createElement('test-query-id') as any;
      document.body.appendChild(el);
      
      expect(el.uniqueEl).toBeDefined();
      expect(el.uniqueEl?.id).toBe('unique');
    });

    it('should query by attribute', () => {
      @element('test-query-attr')
      class TestQueryAttr extends HTMLElement {
        @query('[data-test="value"]')
        attrEl?: HTMLElement;
        
        html() {
          return '<div data-test="value">Attribute Query</div>';
        }
      }
      
      const el = document.createElement('test-query-attr') as any;
      document.body.appendChild(el);
      
      expect(el.attrEl).toBeDefined();
      expect(el.attrEl?.getAttribute('data-test')).toBe('value');
    });

    it('should work with shadow DOM', () => {
      @element('test-query-shadow')
      class TestQueryShadow extends HTMLElement {
        @query('.shadow-el')
        shadowEl?: HTMLElement;
        
        constructor() {
          super();
          const shadow = this.attachShadow({ mode: 'open' });
          shadow.innerHTML = '<div class="shadow-el">Shadow Content</div>';
        }
      }
      
      const el = document.createElement('test-query-shadow') as any;
      document.body.appendChild(el);
      
      expect(el.shadowEl).toBeDefined();
      expect(el.shadowEl?.textContent).toBe('Shadow Content');
    });

    it('should be reactive to DOM changes', () => {
      @element('test-query-reactive')
      class TestQueryReactive extends HTMLElement {
        @query('.dynamic')
        dynamicEl?: HTMLElement;
        
        html() {
          return '<div class="static">Static</div>';
        }
      }
      
      const el = document.createElement('test-query-reactive') as any;
      document.body.appendChild(el);
      
      expect(el.dynamicEl).toBeNull();
      
      // Add element dynamically
      const div = document.createElement('div');
      div.className = 'dynamic';
      div.textContent = 'Dynamic';
      el.appendChild(div);
      
      expect(el.dynamicEl).toBeDefined();
      expect(el.dynamicEl?.textContent).toBe('Dynamic');
    });
  });

  describe('@queryAll decorator', () => {
    it('should query multiple elements', () => {
      @element('test-query-all-basic')
      class TestQueryAllBasic extends HTMLElement {
        @queryAll('.item')
        items?: NodeListOf<HTMLElement>;
        
        html() {
          return `
            <div class="item">Item 1</div>
            <div class="item">Item 2</div>
            <div class="item">Item 3</div>
          `;
        }
      }
      
      const el = document.createElement('test-query-all-basic') as any;
      document.body.appendChild(el);
      
      expect(el.items).toBeDefined();
      expect(el.items?.length).toBe(3);
      expect(el.items?.[0].textContent).toBe('Item 1');
      expect(el.items?.[1].textContent).toBe('Item 2');
      expect(el.items?.[2].textContent).toBe('Item 3');
    });

    it('should return empty NodeList if no elements found', () => {
      @element('test-query-all-empty')
      class TestQueryAllEmpty extends HTMLElement {
        @queryAll('.missing')
        items?: NodeListOf<HTMLElement>;
        
        html() {
          return '<div class="present">Present</div>';
        }
      }
      
      const el = document.createElement('test-query-all-empty') as any;
      document.body.appendChild(el);
      
      expect(el.items).toBeDefined();
      expect(el.items?.length).toBe(0);
    });

    it('should query nested elements', () => {
      @element('test-query-all-nested')
      class TestQueryAllNested extends HTMLElement {
        @queryAll('.list .item')
        nestedItems?: NodeListOf<HTMLElement>;
        
        html() {
          return `
            <div class="list">
              <div class="item">Nested 1</div>
              <div class="item">Nested 2</div>
            </div>
            <div class="item">Not Nested</div>
          `;
        }
      }
      
      const el = document.createElement('test-query-all-nested') as any;
      document.body.appendChild(el);
      
      expect(el.nestedItems?.length).toBe(2);
      expect(el.nestedItems?.[0].textContent).toBe('Nested 1');
      expect(el.nestedItems?.[1].textContent).toBe('Nested 2');
    });

    it('should work with shadow DOM', () => {
      @element('test-query-all-shadow')
      class TestQueryAllShadow extends HTMLElement {
        @queryAll('.shadow-item')
        shadowItems?: NodeListOf<HTMLElement>;
        
        constructor() {
          super();
          const shadow = this.attachShadow({ mode: 'open' });
          shadow.innerHTML = `
            <div class="shadow-item">Shadow 1</div>
            <div class="shadow-item">Shadow 2</div>
          `;
        }
      }
      
      const el = document.createElement('test-query-all-shadow') as any;
      document.body.appendChild(el);
      
      expect(el.shadowItems).toBeDefined();
      expect(el.shadowItems?.length).toBe(2);
    });

    it('should be reactive to DOM changes', () => {
      @element('test-query-all-reactive')
      class TestQueryAllReactive extends HTMLElement {
        @queryAll('.dynamic')
        dynamicEls?: NodeListOf<HTMLElement>;
        
        html() {
          return '<div class="static">Static</div>';
        }
      }
      
      const el = document.createElement('test-query-all-reactive') as any;
      document.body.appendChild(el);
      
      expect(el.dynamicEls?.length).toBe(0);
      
      // Add elements dynamically
      for (let i = 1; i <= 3; i++) {
        const div = document.createElement('div');
        div.className = 'dynamic';
        div.textContent = `Dynamic ${i}`;
        el.appendChild(div);
      }
      
      expect(el.dynamicEls?.length).toBe(3);
    });
  });

  describe('multiple queries', () => {
    it('should handle multiple query decorators on same class', () => {
      @element('test-multi-query')
      class TestMultiQuery extends HTMLElement {
        @query('.header')
        header?: HTMLElement;
        
        @query('.content')
        content?: HTMLElement;
        
        @queryAll('.item')
        items?: NodeListOf<HTMLElement>;
        
        html() {
          return `
            <div class="header">Header</div>
            <div class="content">
              <div class="item">Item 1</div>
              <div class="item">Item 2</div>
            </div>
          `;
        }
      }
      
      const el = document.createElement('test-multi-query') as any;
      document.body.appendChild(el);
      
      expect(el.header?.textContent).toBe('Header');
      expect(el.content?.textContent).toContain('Item 1');
      expect(el.items?.length).toBe(2);
    });
  });
});