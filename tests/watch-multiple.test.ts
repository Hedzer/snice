import { describe, it, expect, vi } from 'vitest';
import { element, property, watch } from '../src';

describe('@watch multiple properties', () => {
  it('should watch multiple properties with single decorator', () => {
    const watchSpy = vi.fn();
    
    @element('multi-prop-watcher')
    class MultiPropWatcher extends HTMLElement {
      @property()
      width = 100;
      
      @property()
      height = 100;
      
      @property()
      depth = 50;
      
      @watch('width', 'height')
      updateDimensions(oldValue: any, newValue: any) {
        watchSpy('dimensions', oldValue, newValue);
      }
    }
    
    const el = document.createElement('multi-prop-watcher') as any;
    document.body.appendChild(el);
    
    // Reset spy to ignore initial value calls
    watchSpy.mockClear();
    
    // Change width - should trigger updateDimensions
    el.width = 200;
    expect(watchSpy).toHaveBeenCalledWith('dimensions', 100, 200);
    
    // Change height - should also trigger updateDimensions
    el.height = 150;
    expect(watchSpy).toHaveBeenCalledWith('dimensions', 100, 150);
    
    // Change depth - should NOT trigger updateDimensions
    el.depth = 75;
    expect(watchSpy).toHaveBeenCalledTimes(2); // Still only 2 calls
  });
  
  it('should work with wildcard and specific properties', () => {
    const dimensionSpy = vi.fn();
    const colorSpy = vi.fn();
    const wildcardSpy = vi.fn();
    
    @element('mixed-multi-watcher')
    class MixedMultiWatcher extends HTMLElement {
      @property()
      width = 100;
      
      @property()
      height = 100;
      
      @property()
      color = 'red';
      
      @property()
      opacity = 1;
      
      @watch('width', 'height')
      updateDimensions() {
        dimensionSpy(`${this.width}x${this.height}`);
      }
      
      @watch('color', 'opacity')
      updateAppearance() {
        colorSpy(`${this.color}@${this.opacity}`);
      }
      
      @watch('*')
      logAllChanges(oldValue: any, newValue: any, propName: string) {
        wildcardSpy(propName, newValue);
      }
    }
    
    const el = document.createElement('mixed-multi-watcher') as any;
    document.body.appendChild(el);
    
    // Reset spies
    dimensionSpy.mockClear();
    colorSpy.mockClear();
    wildcardSpy.mockClear();
    
    // Change width
    el.width = 200;
    expect(dimensionSpy).toHaveBeenCalledWith('200x100');
    expect(wildcardSpy).toHaveBeenCalledWith('width', 200);
    expect(colorSpy).not.toHaveBeenCalled();
    
    // Change color
    el.color = 'blue';
    expect(colorSpy).toHaveBeenCalledWith('blue@1');
    expect(wildcardSpy).toHaveBeenCalledWith('color', 'blue');
    
    // Change opacity
    el.opacity = 0.5;
    expect(colorSpy).toHaveBeenCalledWith('blue@0.5');
    expect(wildcardSpy).toHaveBeenCalledWith('opacity', 0.5);
  });
  
  it('should handle overlapping watchers correctly', () => {
    const watcher1 = vi.fn();
    const watcher2 = vi.fn();
    const watcher3 = vi.fn();
    
    @element('overlap-watcher')
    class OverlapWatcher extends HTMLElement {
      @property()
      propA = 'a';
      
      @property()
      propB = 'b';
      
      @property()
      propC = 'c';
      
      @watch('propA', 'propB')
      watchAB() {
        watcher1('AB');
      }
      
      @watch('propB', 'propC')
      watchBC() {
        watcher2('BC');
      }
      
      @watch('propA', 'propC')
      watchAC() {
        watcher3('AC');
      }
    }
    
    const el = document.createElement('overlap-watcher') as any;
    document.body.appendChild(el);
    
    // Reset spies
    watcher1.mockClear();
    watcher2.mockClear();
    watcher3.mockClear();
    
    // Change propA - should trigger watchAB and watchAC
    el.propA = 'a2';
    expect(watcher1).toHaveBeenCalledWith('AB');
    expect(watcher2).not.toHaveBeenCalled();
    expect(watcher3).toHaveBeenCalledWith('AC');
    
    // Reset
    watcher1.mockClear();
    watcher2.mockClear();
    watcher3.mockClear();
    
    // Change propB - should trigger watchAB and watchBC
    el.propB = 'b2';
    expect(watcher1).toHaveBeenCalledWith('AB');
    expect(watcher2).toHaveBeenCalledWith('BC');
    expect(watcher3).not.toHaveBeenCalled();
    
    // Reset
    watcher1.mockClear();
    watcher2.mockClear();
    watcher3.mockClear();
    
    // Change propC - should trigger watchBC and watchAC
    el.propC = 'c2';
    expect(watcher1).not.toHaveBeenCalled();
    expect(watcher2).toHaveBeenCalledWith('BC');
    expect(watcher3).toHaveBeenCalledWith('AC');
  });
  
  it('should work with empty argument list (no-op)', () => {
    const watchSpy = vi.fn();
    
    @element('empty-watcher')
    class EmptyWatcher extends HTMLElement {
      @property()
      value = 'test';
      
      @watch() // No properties specified
      watchNothing() {
        watchSpy('called');
      }
    }
    
    const el = document.createElement('empty-watcher') as any;
    document.body.appendChild(el);
    
    watchSpy.mockClear();
    
    // Change value - should not trigger the empty watcher
    el.value = 'changed';
    expect(watchSpy).not.toHaveBeenCalled();
  });
});