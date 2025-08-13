import { describe, it, expect, vi } from 'vitest';
import { element, property, watch } from '../src';

describe('@watch parameter signature', () => {
  it('should pass oldValue, newValue, and propertyName to single property watcher', () => {
    const watchSpy = vi.fn();
    
    @element('single-prop-params')
    class SinglePropParams extends HTMLElement {
      @property()
      title = 'initial';
      
      @watch('title')
      onTitleChange(oldValue: string, newValue: string, propertyName: string) {
        watchSpy(oldValue, newValue, propertyName);
      }
    }
    
    const el = document.createElement('single-prop-params') as any;
    document.body.appendChild(el);
    
    // Reset spy to ignore initial setup
    watchSpy.mockClear();
    
    // Change property
    el.title = 'updated';
    
    expect(watchSpy).toHaveBeenCalledWith('initial', 'updated', 'title');
  });
  
  it('should pass parameters correctly for multi-property watcher', () => {
    const watchSpy = vi.fn();
    
    @element('multi-prop-params')
    class MultiPropParams extends HTMLElement {
      @property({ type: Number })
      width = 100;
      
      @property({ type: Number })
      height = 200;
      
      @watch('width', 'height')
      onDimensionChange(oldValue: number, newValue: number, propertyName: string) {
        watchSpy(oldValue, newValue, propertyName);
      }
    }
    
    const el = document.createElement('multi-prop-params') as any;
    document.body.appendChild(el);
    
    watchSpy.mockClear();
    
    // Change width
    el.width = 150;
    expect(watchSpy).toHaveBeenCalledWith(100, 150, 'width');
    
    // Change height
    el.height = 250;
    expect(watchSpy).toHaveBeenCalledWith(200, 250, 'height');
  });
  
  it('should pass parameters correctly for wildcard watcher', () => {
    const watchSpy = vi.fn();
    
    @element('wildcard-params')
    class WildcardParams extends HTMLElement {
      @property()
      color = 'red';
      
      @property({ type: Number })
      size = 10;
      
      @watch('*')
      onAnyChange(oldValue: any, newValue: any, propertyName: string) {
        watchSpy(oldValue, newValue, propertyName);
      }
    }
    
    const el = document.createElement('wildcard-params') as any;
    document.body.appendChild(el);
    
    watchSpy.mockClear();
    
    // Change color
    el.color = 'blue';
    expect(watchSpy).toHaveBeenCalledWith('red', 'blue', 'color');
    
    // Change size
    el.size = 20;
    expect(watchSpy).toHaveBeenCalledWith(10, 20, 'size');
  });
  
  it('should allow using propertyName to handle different properties differently', () => {
    const actionSpy = vi.fn();
    
    @element('conditional-handler')
    class ConditionalHandler extends HTMLElement {
      @property({ type: Number })
      x = 0;
      
      @property({ type: Number })
      y = 0;
      
      @property({ type: Number })
      z = 0;
      
      @watch('x', 'y', 'z')
      onCoordinateChange(oldValue: number, newValue: number, propertyName: string) {
        switch (propertyName) {
          case 'x':
            actionSpy('moveX', newValue);
            break;
          case 'y':
            actionSpy('moveY', newValue);
            break;
          case 'z':
            actionSpy('moveZ', newValue);
            break;
        }
      }
    }
    
    const el = document.createElement('conditional-handler') as any;
    document.body.appendChild(el);
    
    actionSpy.mockClear();
    
    el.x = 10;
    expect(actionSpy).toHaveBeenCalledWith('moveX', 10);
    
    el.y = 20;
    expect(actionSpy).toHaveBeenCalledWith('moveY', 20);
    
    el.z = 30;
    expect(actionSpy).toHaveBeenCalledWith('moveZ', 30);
  });
  
  it('should handle type conversions correctly in parameters', () => {
    const watchSpy = vi.fn();
    
    @element('type-conversion-params')
    class TypeConversionParams extends HTMLElement {
      @property({ type: Boolean })
      enabled = false;
      
      @property({ type: Number })
      count = 0;
      
      @property({ type: String })
      text = '';
      
      @watch('enabled', 'count', 'text')
      onChange(oldValue: any, newValue: any, propertyName: string) {
        watchSpy(propertyName, typeof oldValue, typeof newValue, oldValue, newValue);
      }
    }
    
    const el = document.createElement('type-conversion-params') as any;
    document.body.appendChild(el);
    
    watchSpy.mockClear();
    
    // Boolean change
    el.enabled = true;
    expect(watchSpy).toHaveBeenCalledWith('enabled', 'boolean', 'boolean', false, true);
    
    // Number change
    el.count = 42;
    expect(watchSpy).toHaveBeenCalledWith('count', 'number', 'number', 0, 42);
    
    // String change
    el.text = 'hello';
    expect(watchSpy).toHaveBeenCalledWith('text', 'string', 'string', '', 'hello');
  });
});