import { describe, it, expect, beforeEach, vi } from 'vitest';
import { element, property, watch } from '../src/index';

describe('@watch decorator', () => {
  beforeEach(() => {
    // Clear any previously registered elements
    customElements.define = vi.fn();
  });

  it('should call watcher when property changes', () => {
    const watcherSpy = vi.fn();
    
    @element('test-watch')
    class TestElement extends HTMLElement {
      @property()
      value = 'initial';
      
      @watch('value')
      onValueChange(oldValue: string, newValue: string) {
        watcherSpy(oldValue, newValue);
      }
    }
    
    const el = new TestElement();
    document.body.appendChild(el);
    
    // Change the property
    el.value = 'updated';
    
    expect(watcherSpy).toHaveBeenCalledWith('initial', 'updated');
  });

  it('should support multiple watchers for the same property', () => {
    const watcher1Spy = vi.fn();
    const watcher2Spy = vi.fn();
    
    @element('test-multi-watch')
    class TestElement extends HTMLElement {
      @property()
      count = 0;
      
      @watch('count')
      onCountChange1(oldValue: number, newValue: number) {
        watcher1Spy(oldValue, newValue);
      }
      
      @watch('count')
      onCountChange2(oldValue: number, newValue: number) {
        watcher2Spy(oldValue, newValue);
      }
    }
    
    const el = new TestElement();
    document.body.appendChild(el);
    
    el.count = 5;
    
    expect(watcher1Spy).toHaveBeenCalledWith(0, 5);
    expect(watcher2Spy).toHaveBeenCalledWith(0, 5);
  });

  it('should not call watcher when value does not change', () => {
    const watcherSpy = vi.fn();
    
    @element('test-no-change')
    class TestElement extends HTMLElement {
      @property()
      status = 'active';
      
      @watch('status')
      onStatusChange(oldValue: string, newValue: string) {
        watcherSpy(oldValue, newValue);
      }
    }
    
    const el = new TestElement();
    document.body.appendChild(el);
    
    // Clear any initial calls from property initialization
    watcherSpy.mockClear();
    
    // Set to same value
    el.status = 'active';
    
    expect(watcherSpy).not.toHaveBeenCalled();
  });

  it('should call watcher when property changes programmatically', () => {
    const watcherSpy = vi.fn();
    
    @element('test-prop-change')
    class TestElement extends HTMLElement {
      @property()
      theme = 'light';
      
      @watch('theme')
      onThemeChange(oldValue: string, newValue: string) {
        watcherSpy(oldValue, newValue);
      }
    }
    
    const el = new TestElement();
    document.body.appendChild(el);
    
    // Clear any initial calls
    watcherSpy.mockClear();
    
    // Change via property
    el.theme = 'dark';
    
    expect(watcherSpy).toHaveBeenCalledWith('light', 'dark');
  });

  it('should handle multiple properties with watchers', () => {
    const widthSpy = vi.fn();
    const heightSpy = vi.fn();
    
    @element('test-multiple-props')
    class TestElement extends HTMLElement {
      @property({ type: Number })
      width = 100;
      
      @property({ type: Number })
      height = 50;
      
      @watch('width')
      onWidthChange(oldValue: number, newValue: number) {
        widthSpy(oldValue, newValue);
      }
      
      @watch('height')
      onHeightChange(oldValue: number, newValue: number) {
        heightSpy(oldValue, newValue);
      }
    }
    
    const el = new TestElement();
    document.body.appendChild(el);
    
    el.width = 200;
    el.height = 100;
    
    expect(widthSpy).toHaveBeenCalledWith(100, 200);
    expect(heightSpy).toHaveBeenCalledWith(50, 100);
  });

  it('should catch and log errors in watcher methods', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    @element('test-error-watch')
    class TestElement extends HTMLElement {
      @property()
      value = 'test';
      
      @watch('value')
      onValueChange() {
        throw new Error('Watcher error');
      }
    }
    
    const el = new TestElement();
    document.body.appendChild(el);
    
    el.value = 'new value';
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error in @watch('value')"),
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });

  it('should work with boolean properties', () => {
    const watcherSpy = vi.fn();
    
    @element('test-bool-watch')
    class TestElement extends HTMLElement {
      @property({ type: Boolean })
      disabled = false;
      
      @watch('disabled')
      onDisabledChange(oldValue: boolean, newValue: boolean) {
        watcherSpy(oldValue, newValue);
      }
    }
    
    const el = new TestElement();
    document.body.appendChild(el);
    
    el.disabled = true;
    
    expect(watcherSpy).toHaveBeenCalledWith(false, true);
  });

  it('should pass correct this context to watcher', () => {
    let capturedThis: any;
    
    @element('test-context')
    class TestElement extends HTMLElement {
      @property()
      value = 'test';
      
      someMethod() {
        return 'method result';
      }
      
      @watch('value')
      onValueChange() {
        capturedThis = this;
      }
    }
    
    const el = new TestElement();
    document.body.appendChild(el);
    
    el.value = 'updated';
    
    expect(capturedThis).toBe(el);
    expect(capturedThis.someMethod()).toBe('method result');
  });
});