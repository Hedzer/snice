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

  it('should handle async html() method', async () => {
    @element('test-async-html')
    class TestAsyncHtml extends HTMLElement {
      async html() {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));
        return '<div class="async-content">Async HTML Content</div>';
      }
    }
    
    const el = document.createElement('test-async-html');
    document.body.appendChild(el);
    
    // Wait for async html to complete
    await new Promise(resolve => setTimeout(resolve, 20));
    
    expect(el.shadowRoot?.innerHTML).toContain('<div class="async-content">Async HTML Content</div>');
  });

  it('should handle async css() method', async () => {
    @element('test-async-css')
    class TestAsyncCss extends HTMLElement {
      html() {
        return '<div class="styled">Content</div>';
      }
      
      async css() {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));
        return '.styled { background: blue; }';
      }
    }
    
    const el = document.createElement('test-async-css');
    document.body.appendChild(el);
    
    // Wait for async css to complete
    await new Promise(resolve => setTimeout(resolve, 20));
    
    const style = el.shadowRoot?.querySelector('style');
    expect(style).toBeDefined();
    expect(style?.textContent).toContain('.styled { background: blue; }');
  });

  it('should handle both async html() and css() methods', async () => {
    @element('test-async-both')
    class TestAsyncBoth extends HTMLElement {
      async html() {
        await new Promise(resolve => setTimeout(resolve, 5));
        return '<h1>Async Title</h1>';
      }
      
      async css() {
        await new Promise(resolve => setTimeout(resolve, 5));
        return 'h1 { color: green; }';
      }
    }
    
    const el = document.createElement('test-async-both');
    document.body.appendChild(el);
    
    // Wait for both async methods to complete
    await new Promise(resolve => setTimeout(resolve, 20));
    
    expect(el.shadowRoot?.innerHTML).toContain('<h1>Async Title</h1>');
    expect(el.shadowRoot?.innerHTML).toContain('h1 { color: green; }');
  });

  it('should handle async css() returning array', async () => {
    @element('test-async-css-array')
    class TestAsyncCssArray extends HTMLElement {
      html() {
        return '<div>Content</div>';
      }
      
      async css() {
        await new Promise(resolve => setTimeout(resolve, 5));
        return [
          'div { padding: 10px; }',
          'div:hover { background: yellow; }'
        ];
      }
    }
    
    const el = document.createElement('test-async-css-array');
    document.body.appendChild(el);
    
    // Wait for async css to complete
    await new Promise(resolve => setTimeout(resolve, 20));
    
    const style = el.shadowRoot?.querySelector('style');
    expect(style?.textContent).toContain('div { padding: 10px; }');
    expect(style?.textContent).toContain('div:hover { background: yellow; }');
  });

  it('should handle mix of sync html and async css', async () => {
    @element('test-mixed-sync-async')
    class TestMixedSyncAsync extends HTMLElement {
      html() {
        return '<p>Sync HTML</p>';
      }
      
      async css() {
        await new Promise(resolve => setTimeout(resolve, 5));
        return 'p { font-weight: bold; }';
      }
    }
    
    const el = document.createElement('test-mixed-sync-async');
    document.body.appendChild(el);
    
    // Wait for async connectedCallback to complete
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Now both HTML and CSS should be there
    expect(el.shadowRoot?.innerHTML).toContain('<p>Sync HTML</p>');
    const style = el.shadowRoot?.querySelector('style');
    expect(style?.textContent).toContain('p { font-weight: bold; }');
  });

  it('should handle async html with fetch simulation', async () => {
    @element('test-async-fetch')
    class TestAsyncFetch extends HTMLElement {
      async html() {
        // Simulate fetching template from server
        const mockFetch = async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return '<article>Fetched Content</article>';
        };
        
        return await mockFetch();
      }
      
      async css() {
        // Simulate fetching styles from server
        const mockFetch = async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'article { border: 1px solid black; }';
        };
        
        return await mockFetch();
      }
    }
    
    const el = document.createElement('test-async-fetch');
    document.body.appendChild(el);
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 30));
    
    expect(el.shadowRoot?.innerHTML).toContain('<article>Fetched Content</article>');
    expect(el.shadowRoot?.innerHTML).toContain('article { border: 1px solid black; }');
  });

  it('should resolve ready promise after async html/css', async () => {
    @element('test-async-ready')
    class TestAsyncReady extends HTMLElement {
      async html() {
        await new Promise(resolve => setTimeout(resolve, 10));
        return '<div>Ready</div>';
      }
    }
    
    const el = document.createElement('test-async-ready') as any;
    document.body.appendChild(el);
    
    // Ready promise should exist
    expect(el.ready).toBeDefined();
    expect(el.ready).toBeInstanceOf(Promise);
    
    // Wait for ready promise
    await el.ready;
    
    // Shadow DOM should be populated
    expect(el.shadowRoot?.innerHTML).toContain('<div>Ready</div>');
  });
});