import { describe, it, expect, vi } from 'vitest';
import { element, property, watch } from '../src';

describe('@watch("*") wildcard watcher', () => {
  it('should watch all property changes', () => {
    const watchSpy = vi.fn();
    
    @element('wildcard-watcher')
    class WildcardWatcher extends HTMLElement {
      @property()
      prop1 = 'value1';
      
      @property()
      prop2 = 'value2';
      
      @property({ type: Number })
      prop3 = 0;
      
      @watch('*')
      watchAllChanges(oldValue: any, newValue: any, propertyName: string) {
        watchSpy(propertyName, oldValue, newValue);
      }
    }
    
    const el = document.createElement('wildcard-watcher') as any;
    document.body.appendChild(el);
    
    // Reset the spy to ignore initial value calls
    watchSpy.mockClear();
    
    // Change prop1
    el.prop1 = 'updated1';
    expect(watchSpy).toHaveBeenCalledWith('prop1', 'value1', 'updated1');
    
    // Change prop2
    el.prop2 = 'updated2';
    expect(watchSpy).toHaveBeenCalledWith('prop2', 'value2', 'updated2');
    
    // Change prop3
    el.prop3 = 42;
    expect(watchSpy).toHaveBeenCalledWith('prop3', 0, 42);
    
    expect(watchSpy).toHaveBeenCalledTimes(3);
  });
  
  it('should work alongside specific property watchers', () => {
    const wildcardSpy = vi.fn();
    const specificSpy = vi.fn();
    
    @element('mixed-watchers')
    class MixedWatchers extends HTMLElement {
      @property()
      prop1 = 'initial1';
      
      @property()
      prop2 = 'initial2';
      
      @watch('*')
      watchAll(oldValue: any, newValue: any, propertyName: string) {
        wildcardSpy(propertyName, newValue);
      }
      
      @watch('prop1')
      watchProp1(oldValue: any, newValue: any) {
        specificSpy('prop1', newValue);
      }
    }
    
    const el = document.createElement('mixed-watchers') as any;
    document.body.appendChild(el);
    
    // Reset spies to ignore initial value calls
    wildcardSpy.mockClear();
    specificSpy.mockClear();
    
    // Change prop1 - should trigger both watchers
    el.prop1 = 'changed1';
    expect(specificSpy).toHaveBeenCalledWith('prop1', 'changed1');
    expect(wildcardSpy).toHaveBeenCalledWith('prop1', 'changed1');
    
    // Change prop2 - should only trigger wildcard watcher
    el.prop2 = 'changed2';
    expect(wildcardSpy).toHaveBeenCalledWith('prop2', 'changed2');
    expect(specificSpy).toHaveBeenCalledTimes(1); // Still only 1 call
    
    expect(wildcardSpy).toHaveBeenCalledTimes(2);
  });
  
  it('should handle multiple wildcard watchers', () => {
    const watcher1 = vi.fn();
    const watcher2 = vi.fn();
    
    @element('multi-wildcard')
    class MultiWildcard extends HTMLElement {
      @property()
      value = 'initial';
      
      @watch('*')
      firstWatcher(oldValue: any, newValue: any, propertyName: string) {
        watcher1(propertyName, newValue);
      }
      
      @watch('*')
      secondWatcher(oldValue: any, newValue: any, propertyName: string) {
        watcher2(propertyName, newValue);
      }
    }
    
    const el = document.createElement('multi-wildcard') as any;
    document.body.appendChild(el);
    
    el.value = 'updated';
    
    expect(watcher1).toHaveBeenCalledWith('value', 'updated');
    expect(watcher2).toHaveBeenCalledWith('value', 'updated');
  });
  
  it('should not trigger for non-@property fields', () => {
    const watchSpy = vi.fn();
    
    @element('selective-watcher')
    class SelectiveWatcher extends HTMLElement {
      @property()
      trackedProp = 'tracked';
      
      // This is not a @property, so changes shouldn't trigger watch
      untrackedProp = 'untracked';
      
      @watch('*')
      watchChanges(oldValue: any, newValue: any, propertyName: string) {
        watchSpy(propertyName);
      }
    }
    
    const el = document.createElement('selective-watcher') as any;
    document.body.appendChild(el);
    
    // Reset spy to ignore initial value calls
    watchSpy.mockClear();
    
    // Change tracked property
    el.trackedProp = 'new-tracked';
    expect(watchSpy).toHaveBeenCalledWith('trackedProp');
    
    // Change untracked property - should not trigger watcher
    el.untrackedProp = 'new-untracked';
    expect(watchSpy).toHaveBeenCalledTimes(1); // Still only 1 call
  });
});