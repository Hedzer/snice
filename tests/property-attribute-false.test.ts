import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, watch, html } from './test-imports';

describe('@property({ attribute: false })', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should not appear in observedAttributes', () => {
    @element('test-attr-false-observed')
    class TestAttrFalseObserved extends HTMLElement {
      @property({ attribute: false })
      data: any = null;

      @property({ type: String })
      name: string = '';
    }

    const observed = (TestAttrFalseObserved as any).observedAttributes;
    expect(observed).not.toContain('data');
    expect(observed).toContain('name');
  });

  it('should store and retrieve values without DOM attributes', () => {
    @element('test-attr-false-store')
    class TestAttrFalseStore extends HTMLElement {
      @property({ attribute: false })
      data: any = null;
    }

    const el = document.createElement('test-attr-false-store') as any;
    container.appendChild(el);

    el.data = { foo: 'bar' };
    expect(el.data).toEqual({ foo: 'bar' });
    expect(el.hasAttribute('data')).toBe(false);
  });

  it('should not reflect property values to DOM attributes', () => {
    @element('test-attr-false-reflect')
    class TestAttrFalseReflect extends HTMLElement {
      @property({ attribute: false })
      items: string[] = [];
    }

    const el = document.createElement('test-attr-false-reflect') as any;
    container.appendChild(el);

    el.items = ['a', 'b', 'c'];
    expect(el.items).toEqual(['a', 'b', 'c']);
    expect(el.hasAttribute('items')).toBe(false);
    expect(el.getAttribute('items')).toBeNull();
  });

  it('should preserve default value when no value is set', () => {
    @element('test-attr-false-default')
    class TestAttrFalseDefault extends HTMLElement {
      @property({ attribute: false })
      config: Record<string, any> = { theme: 'dark' };
    }

    const el = document.createElement('test-attr-false-default') as any;
    container.appendChild(el);

    expect(el.config).toEqual({ theme: 'dark' });
  });

  it('should trigger re-render on property change', async () => {
    @element('test-attr-false-render')
    class TestAttrFalseRender extends HTMLElement {
      @property({ attribute: false })
      count: number = 0;

      @render()
      template() {
        return html`<span id="count">${this.count}</span>`;
      }
    }

    const el = document.createElement('test-attr-false-render') as any;
    container.appendChild(el);

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.shadowRoot?.querySelector('#count')?.textContent).toBe('0');

    el.count = 42;
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(el.shadowRoot?.querySelector('#count')?.textContent).toBe('42');
    expect(el.hasAttribute('count')).toBe(false);
  });

  it('should trigger @watch on property change', async () => {
    let watchedOld: any;
    let watchedNew: any;
    let watchedProp: string | undefined;

    @element('test-attr-false-watch')
    class TestAttrFalseWatch extends HTMLElement {
      @property({ attribute: false })
      data: any = null;

      @watch('data')
      onDataChange(oldVal: any, newVal: any, prop: string) {
        watchedOld = oldVal;
        watchedNew = newVal;
        watchedProp = prop;
      }
    }

    const el = document.createElement('test-attr-false-watch') as any;
    container.appendChild(el);

    el.data = { key: 'value' };
    expect(watchedOld).toBeNull();
    expect(watchedNew).toEqual({ key: 'value' });
    expect(watchedProp).toBe('data');
  });

  it('should work alongside normal properties', () => {
    @element('test-attr-false-mixed')
    class TestAttrFalseMixed extends HTMLElement {
      @property({ type: String })
      label: string = '';

      @property({ attribute: false })
      data: any = null;

      @property({ type: Number })
      count: number = 0;
    }

    const el = document.createElement('test-attr-false-mixed') as any;
    container.appendChild(el);

    // Normal property reflects
    el.label = 'hello';
    expect(el.getAttribute('label')).toBe('hello');

    // attribute: false does not reflect
    el.data = [1, 2, 3];
    expect(el.hasAttribute('data')).toBe(false);

    // Normal property reflects
    el.count = 5;
    expect(el.getAttribute('count')).toBe('5');
  });

  it('should not initialize from DOM attribute on connect', async () => {
    @element('test-attr-false-init')
    class TestAttrFalseInit extends HTMLElement {
      @property({ attribute: false })
      value: string = 'default';
    }

    const el = document.createElement('test-attr-false-init') as any;
    // Manually set attribute before connecting — should be ignored
    el.setAttribute('value', 'from-attr');
    container.appendChild(el);

    await new Promise(resolve => setTimeout(resolve, 10));

    // attribute: false means the attribute is ignored
    expect(el.value).toBe('default');
  });

  it('should handle complex objects', () => {
    @element('test-attr-false-complex')
    class TestAttrFalseComplex extends HTMLElement {
      @property({ attribute: false })
      model: any = null;
    }

    const el = document.createElement('test-attr-false-complex') as any;
    container.appendChild(el);

    const complex = {
      users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
      meta: { page: 1, total: 100 },
      fn: () => 'test'
    };

    el.model = complex;
    expect(el.model).toBe(complex); // Same reference
    expect(el.model.users).toHaveLength(2);
    expect(el.model.fn()).toBe('test');
  });

  it('should handle multiple updates correctly', () => {
    @element('test-attr-false-multi')
    class TestAttrFalseMulti extends HTMLElement {
      @property({ attribute: false })
      value: number = 0;
    }

    const el = document.createElement('test-attr-false-multi') as any;
    container.appendChild(el);

    for (let i = 1; i <= 10; i++) {
      el.value = i;
      expect(el.value).toBe(i);
    }
    expect(el.hasAttribute('value')).toBe(false);
  });
});
