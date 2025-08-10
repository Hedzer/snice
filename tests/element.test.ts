import { describe, it, expect, beforeEach, vi } from 'vitest';
import { element, property, query, queryAll } from '../src/element';

describe('@element decorator', () => {
  beforeEach(() => {
    // Clear custom elements registry
    document.body.innerHTML = '';
  });

  it('should register a custom element', () => {
    @element('test-element')
    class TestElement extends HTMLElement {}
    
    expect(customElements.get('test-element')).toBeDefined();
  });

  it('should call html() method on connect', () => {
    @element('test-html')
    class TestHtml extends HTMLElement {
      html() {
        return '<div>Test Content</div>';
      }
    }
    
    const el = document.createElement('test-html');
    document.body.appendChild(el);
    
    expect(el.shadowRoot?.innerHTML).toContain('<div>Test Content</div>');
  });

  it('should call css() method and add styles', () => {
    @element('test-css')
    class TestCss extends HTMLElement {
      html() {
        return '<div class="test">Content</div>';
      }
      css() {
        return '.test { color: red; }';
      }
    }
    
    const el = document.createElement('test-css');
    document.body.appendChild(el);
    
    const style = el.shadowRoot?.querySelector('style');
    expect(style).toBeDefined();
    expect(style?.textContent).toContain('.test { color: red; }');
  });

  it('should handle css() returning array of strings', () => {
    @element('test-css-array')
    class TestCssArray extends HTMLElement {
      css() {
        return ['.test { color: red; }', '.other { color: blue; }'];
      }
    }
    
    const el = document.createElement('test-css-array');
    document.body.appendChild(el);
    
    const style = el.shadowRoot?.querySelector('style');
    expect(style?.textContent).toContain('.test { color: red; }');
    expect(style?.textContent).toContain('.other { color: blue; }');
  });
});

describe('@property decorator', () => {
  it('should reflect string property to attribute', () => {
    @element('test-prop')
    class TestProp extends HTMLElement {
      @property({ type: String, reflect: true })
      name = 'default';
    }
    
    const el = document.createElement('test-prop') as any;
    document.body.appendChild(el);
    
    el.name = 'updated';
    expect(el.getAttribute('name')).toBe('updated');
  });

  it('should reflect number property to attribute', () => {
    @element('test-num-prop')
    class TestNumProp extends HTMLElement {
      @property({ type: Number, reflect: true })
      count = 0;
    }
    
    const el = document.createElement('test-num-prop') as any;
    document.body.appendChild(el);
    
    el.count = 42;
    expect(el.getAttribute('count')).toBe('42');
  });

  it('should reflect boolean property to attribute', () => {
    @element('test-bool-prop')
    class TestBoolProp extends HTMLElement {
      @property({ type: Boolean, reflect: true })
      active = false;
    }
    
    const el = document.createElement('test-bool-prop') as any;
    document.body.appendChild(el);
    
    el.active = true;
    expect(el.hasAttribute('active')).toBe(true);
    
    el.active = false;
    expect(el.hasAttribute('active')).toBe(false);
  });

  it('should use custom attribute name', () => {
    @element('test-attr-prop')
    class TestAttrProp extends HTMLElement {
      @property({ type: String, reflect: true, attribute: 'data-name' })
      name = '';
    }
    
    const el = document.createElement('test-attr-prop') as any;
    document.body.appendChild(el);
    
    el.name = 'test';
    expect(el.getAttribute('data-name')).toBe('test');
  });
});

describe('@query decorator', () => {
  it('should query single element', () => {
    @element('test-query')
    class TestQuery extends HTMLElement {
      @query('.test')
      testEl?: HTMLElement;
      
      html() {
        return '<div class="test">Test</div>';
      }
    }
    
    const el = document.createElement('test-query') as any;
    document.body.appendChild(el);
    
    expect(el.testEl).toBeDefined();
    expect(el.testEl?.className).toBe('test');
  });

  it('should return null if element not found', () => {
    @element('test-query-null')
    class TestQueryNull extends HTMLElement {
      @query('.missing')
      missingEl?: HTMLElement;
    }
    
    const el = document.createElement('test-query-null') as any;
    document.body.appendChild(el);
    
    expect(el.missingEl).toBeNull();
  });
});

describe('@queryAll decorator', () => {
  it('should query multiple elements', () => {
    @element('test-query-all')
    class TestQueryAll extends HTMLElement {
      @queryAll('.item')
      items?: NodeListOf<HTMLElement>;
      
      html() {
        return `
          <div class="item">1</div>
          <div class="item">2</div>
          <div class="item">3</div>
        `;
      }
    }
    
    const el = document.createElement('test-query-all') as any;
    document.body.appendChild(el);
    
    expect(el.items).toBeDefined();
    expect(el.items?.length).toBe(3);
  });

  it('should return empty NodeList if no elements found', () => {
    @element('test-query-all-empty')
    class TestQueryAllEmpty extends HTMLElement {
      @queryAll('.missing')
      items?: NodeListOf<HTMLElement>;
    }
    
    const el = document.createElement('test-query-all-empty') as any;
    document.body.appendChild(el);
    
    expect(el.items).toBeDefined();
    expect(el.items?.length).toBe(0);
  });
});