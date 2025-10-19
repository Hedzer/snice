import { describe, it, expect, beforeEach, vi } from 'vitest';
import { element, property, query, queryAll, render, html, css, styles } from './test-imports';

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

  it('should call html() method on connect', async () => {
    @element('test-html')
    class TestHtml extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Test Content</div>`;
      }
    }

    const el = document.createElement('test-html');
    document.body.appendChild(el);
    await (el as any).ready;

    expect(el.shadowRoot?.innerHTML).toContain('<div>Test Content</div>');
  });

  it('should call css() method and add styles', async () => {
    @element('test-css')
    class TestCss extends HTMLElement {
      @render()
      renderContent() {
        return html`<div class="test">Content</div>`;
      }

      @styles()
      componentStyles() {
        return css`.test { color: red; }`;
      }
    }

    const el = document.createElement('test-css');
    document.body.appendChild(el);
    await (el as any).ready;

    const style = el.shadowRoot?.querySelector('style');
    expect(style).toBeDefined();
    expect(style?.textContent).toContain('.test { color: red; }');
  });

  it('should handle css() returning array of strings', async () => {
    @element('test-css-array')
    class TestCssArray extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Content</div>`;
      }

      @styles()
      componentStyles() {
        return css`.test { color: red; } .other { color: blue; }`;
      }
    }

    const el = document.createElement('test-css-array');
    document.body.appendChild(el);
    await (el as any).ready;

    const style = el.shadowRoot?.querySelector('style');
    expect(style?.textContent).toContain('.test { color: red; }');
    expect(style?.textContent).toContain('.other { color: blue; }');
  });
});

describe('@property decorator', () => {
  it('should reflect string property to attribute', () => {
    @element('test-prop')
    class TestProp extends HTMLElement {
      @property({ type: String })
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
      @property({ type: Number })
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
      @property({ type: Boolean })
      active = false;
    }
    
    const el = document.createElement('test-bool-prop') as any;
    document.body.appendChild(el);
    
    el.active = true;
    expect(el.hasAttribute('active')).toBe(true);
    
    el.active = false;
    expect(el.hasAttribute('active')).toBe(false);
  });

  it('should parse boolean attribute "false" string as false', () => {
    @element('test-bool-false-string')
    class TestBoolFalseString extends HTMLElement {
      @property({ type: Boolean })
      enabled = true;
    }
    
    const el = document.createElement('test-bool-false-string') as any;
    el.setAttribute('enabled', 'false');
    document.body.appendChild(el);
    
    // Should parse "false" string as false
    expect(el.enabled).toBe(false);
    
    // Setting to "true" should work
    el.setAttribute('enabled', 'true');
    expect(el.enabled).toBe(true);
    
    // Empty string means attribute exists, should be true
    el.setAttribute('enabled', '');
    expect(el.enabled).toBe(true);
    
    // Removing attribute should make it false
    el.removeAttribute('enabled');
    expect(el.enabled).toBe(false);
  });

  it('should use custom attribute name', () => {
    @element('test-attr-prop')
    class TestAttrProp extends HTMLElement {
      @property({ type: String,  attribute: 'data-name' })
      name = '';
    }
    
    const el = document.createElement('test-attr-prop') as any;
    document.body.appendChild(el);
    
    el.name = 'test';
    expect(el.getAttribute('data-name')).toBe('test');
  });

  it('should read and reflect attribute values', () => {
    @element('test-no-reflect')
    class TestNoReflect extends HTMLElement {
      @property()  // No reflect option
      message = '';
      
      @property({ type: Number })  // No reflect option
      count = 0;
      
      @property({ attribute: 'data-label' })  // Custom attribute, no reflect
      label = '';
    }
    
    const el = document.createElement('test-no-reflect') as any;
    el.setAttribute('message', 'Hello World');
    el.setAttribute('count', '42');
    el.setAttribute('data-label', 'Test Label');
    document.body.appendChild(el);
    
    // Properties always read from attributes
    expect(el.message).toBe('Hello World');
    expect(el.count).toBe(42);
    expect(el.label).toBe('Test Label');
    
    // Properties now always reflect to attributes
    el.message = 'Updated';
    expect(el.getAttribute('message')).toBe('Updated'); // Now reflects
  });

  it('should read initial attribute values on connect', async () => {
    @element('test-initial-attrs')
    class TestInitialAttrs extends HTMLElement {
      @property()
      title = 'default';

      @property({ type: Number })
      value = 0;

      @property({ type: Boolean })
      enabled = false;

      @property({ attribute: 'data-config' })
      config = '';

      @render()
      renderContent() {
        return html`<div>${this.title}: ${this.value}</div>`;
      }
    }

    // Create element with attributes already set (simulating HTML parsing)
    const div = document.createElement('div');
    div.innerHTML = `<test-initial-attrs
      title="Custom Title"
      value="100"
      enabled
      data-config="advanced">
    </test-initial-attrs>`;

    const el = div.querySelector('test-initial-attrs') as any;
    document.body.appendChild(el);
    await el.ready;

    // All properties should be initialized from attributes on connect
    expect(el.title).toBe('Custom Title');
    expect(el.value).toBe(100);
    expect(el.enabled).toBe(true); // 'enabled' attribute exists with no = should be true
    expect(el.config).toBe('advanced');

    // Verify HTML was rendered with initial values
    expect(el.shadowRoot?.textContent).toContain('Custom Title');
    expect(el.shadowRoot?.textContent).toContain('100');
  });

  it('should handle kebab-case boolean attributes with false string', () => {
    @element('test-kebab-bool')
    class TestKebabBool extends HTMLElement {
      @property({ type: Boolean,  attribute: 'no-close-button' })
      noCloseButton = false;
    }

    const el = document.createElement('test-kebab-bool') as any;
    el.setAttribute('no-close-button', 'false');
    document.body.appendChild(el);

    // Should parse "false" string as false even with kebab-case attribute
    expect(el.noCloseButton).toBe(false);

    // Setting to true via property should reflect to attribute
    el.noCloseButton = true;
    expect(el.getAttribute('no-close-button')).toBe('true');

    // Setting attribute to false should update property
    el.setAttribute('no-close-button', 'false');
    expect(el.noCloseButton).toBe(false);
  });

  it('should parse attributes from string template to initial property values', () => {
    @element('test-string-attr')
    class TestStringAttr extends HTMLElement {
      @property({ type: String, attribute: 'custom-attr' })
      customAttr = '';

      @property({ type: Number, attribute: 'number-attr' })
      numberAttr = 0;

      @property({ type: Boolean, attribute: 'bool-attr' })
      boolAttr = false;
    }

    // Create element via innerHTML to simulate string template parsing
    const div = document.createElement('div');
    div.innerHTML = `<test-string-attr custom-attr="hello" number-attr="123" bool-attr></test-string-attr>`;

    const el = div.querySelector('test-string-attr') as any;
    document.body.appendChild(el);

    // Properties should have initial values matching the attributes
    expect(el.customAttr).toBe('hello');
    expect(el.numberAttr).toBe(123);
    expect(el.boolAttr).toBe(true); // 'bool-attr' attribute exists with no = should be true
  });
});

describe('@query decorator', () => {
  it('should query single element', async () => {
    @element('test-query')
    class TestQuery extends HTMLElement {
      @query('.test')
      testEl?: HTMLElement;

      @render()
      renderContent() {
        return html`<div class="test">Test</div>`;
      }
    }

    const el = document.createElement('test-query') as any;
    document.body.appendChild(el);
    await el.ready;

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
  it('should query multiple elements', async () => {
    @element('test-query-all')
    class TestQueryAll extends HTMLElement {
      @queryAll('.item')
      items?: NodeListOf<HTMLElement>;

      @render()
      renderContent() {
        return html`
          <div class="item">1</div>
          <div class="item">2</div>
          <div class="item">3</div>
        `;
      }
    }

    const el = document.createElement('test-query-all') as any;
    document.body.appendChild(el);
    await el.ready;

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

  // NOTE: Async @render() and @styles() methods are not supported in v3.0.0
  // These tests from v2 are removed as the feature doesn't exist in v3
  // If async data fetching is needed, use @ready() or controllers instead
});