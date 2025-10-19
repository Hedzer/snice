import { describe, it, expect, beforeEach, vi } from 'vitest';
import { element, property, render, html } from './test-imports';

describe('@property decorator', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('basic functionality', () => {
    it('should create getter and setter', () => {
      @element('test-prop-basic')
      class TestPropBasic extends HTMLElement {
        @property()
        value = 'initial';
      }
      
      const el = document.createElement('test-prop-basic') as any;
      document.body.appendChild(el);
      
      expect(el.value).toBe('initial');
      el.value = 'updated';
      expect(el.value).toBe('updated');
    });

    it('should store and retrieve property values', () => {
      @element('test-prop-storage')
      class TestPropStorage extends HTMLElement {
        @property()
        data = 'test';
      }
      
      const el = document.createElement('test-prop-storage') as any;
      document.body.appendChild(el);
      
      el.data = 'changed';
      expect(el.data).toBe('changed');
    });
  });

  describe('attribute reflection', () => {
    it('should reflect string property to attribute', () => {
      @element('test-prop-string')
      class TestPropString extends HTMLElement {
        @property({ type: String })
        name = 'default';
      }
      
      const el = document.createElement('test-prop-string') as any;
      document.body.appendChild(el);
      
      el.name = 'updated';
      expect(el.getAttribute('name')).toBe('updated');
    });

    it('should reflect number property to attribute', () => {
      @element('test-prop-number')
      class TestPropNumber extends HTMLElement {
        @property({ type: Number })
        count = 0;
      }
      
      const el = document.createElement('test-prop-number') as any;
      document.body.appendChild(el);
      
      el.count = 42;
      expect(el.getAttribute('count')).toBe('42');
    });

    it('should reflect boolean property to attribute', () => {
      @element('test-prop-bool')
      class TestPropBool extends HTMLElement {
        @property({ type: Boolean })
        active = false;
      }
      
      const el = document.createElement('test-prop-bool') as any;
      document.body.appendChild(el);
      
      el.active = true;
      expect(el.hasAttribute('active')).toBe(true);
      
      el.active = false;
      expect(el.hasAttribute('active')).toBe(false);
    });

    it('should use custom attribute name', () => {
      @element('test-prop-custom-attr')
      class TestPropCustomAttr extends HTMLElement {
        @property({ type: String, attribute: 'data-name' })
        name = '';
      }
      
      const el = document.createElement('test-prop-custom-attr') as any;
      document.body.appendChild(el);
      
      el.name = 'test';
      expect(el.getAttribute('data-name')).toBe('test');
    });

    it('should remove attribute when value is null', () => {
      @element('test-prop-null')
      class TestPropNull extends HTMLElement {
        @property()
        value: string | null = 'initial';
      }
      
      const el = document.createElement('test-prop-null') as any;
      document.body.appendChild(el);
      
      el.value = 'test';
      expect(el.hasAttribute('value')).toBe(true);
      
      el.value = null;
      expect(el.hasAttribute('value')).toBe(false);
    });

    it('should remove attribute when value is undefined', () => {
      @element('test-prop-undefined')
      class TestPropUndefined extends HTMLElement {
        @property()
        value: string | undefined = 'initial';
      }
      
      const el = document.createElement('test-prop-undefined') as any;
      document.body.appendChild(el);
      
      el.value = 'test';
      expect(el.hasAttribute('value')).toBe(true);
      
      el.value = undefined;
      expect(el.hasAttribute('value')).toBe(false);
    });
  });

  describe('property types', () => {
    it('should handle all property types', () => {
      @element('test-prop-types')
      class TestPropTypes extends HTMLElement {
        @property({ type: String })
        str = 'text';
        
        @property({ type: Number })
        num = 42;
        
        @property({ type: Boolean })
        bool = true;
        
        @property({ type: Array })
        arr = [1, 2, 3];
        
        @property({ type: Object })
        obj = { key: 'value' };
      }
      
      const el = document.createElement('test-prop-types') as any;
      document.body.appendChild(el);
      
      expect(el.str).toBe('text');
      expect(el.num).toBe(42);
      expect(el.bool).toBe(true);
      expect(el.arr).toEqual([1, 2, 3]);
      expect(el.obj).toEqual({ key: 'value' });
      
      // Test mutation
      el.arr.push(4);
      expect(el.arr).toEqual([1, 2, 3, 4]);
      
      el.obj.newKey = 'newValue';
      expect(el.obj.newKey).toBe('newValue');
    });
  });

  // requestUpdate was removed in v3.0.0 - properties now trigger @render() automatically via differential rendering

  describe('multiple properties', () => {
    it('should handle multiple properties on same class', () => {
      @element('test-multi-props')
      class TestMultiProps extends HTMLElement {
        @property()
        firstName = 'John';
        
        @property()
        lastName = 'Doe';
        
        @property({ type: Number })
        age = 30;
      }
      
      const el = document.createElement('test-multi-props') as any;
      document.body.appendChild(el);
      
      el.firstName = 'Jane';
      el.lastName = 'Smith';
      el.age = 25;
      
      expect(el.getAttribute('firstName')).toBe('Jane');
      expect(el.getAttribute('lastName')).toBe('Smith');
      expect(el.getAttribute('age')).toBe('25');
    });
  });
});