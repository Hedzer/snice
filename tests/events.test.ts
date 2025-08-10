import { describe, it, expect, beforeEach, vi } from 'vitest';
import { element } from '../src/element';
import { on } from '../src/events';

describe('@on decorator', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should bind click event to method', () => {
    const clickHandler = vi.fn();
    
    @element('test-click')
    class TestClick extends HTMLElement {
      html() {
        return '<button class="btn">Click me</button>';
      }
      
      @on('click', '.btn')
      handleClick() {
        clickHandler();
      }
    }
    
    const el = document.createElement('test-click');
    document.body.appendChild(el);
    
    const btn = el.shadowRoot?.querySelector('.btn') as HTMLElement;
    btn.click();
    
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it('should bind event without selector', () => {
    const clickHandler = vi.fn();
    
    @element('test-direct-click')
    class TestDirectClick extends HTMLElement {
      @on('click')
      handleClick() {
        clickHandler();
      }
    }
    
    const el = document.createElement('test-direct-click');
    document.body.appendChild(el);
    
    el.click();
    
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it('should handle delegated events', () => {
    const clickHandler = vi.fn();
    
    @element('test-delegated')
    class TestDelegated extends HTMLElement {
      items = ['Item 1', 'Item 2'];
      
      html() {
        return `
          <div class="list">
            ${this.items.map((item, i) => `<div class="item" data-index="${i}">${item}</div>`).join('')}
          </div>
        `;
      }
      
      @on('click', '.item')
      handleItemClick(event: Event) {
        clickHandler(event.target);
      }
    }
    
    const el = document.createElement('test-delegated');
    document.body.appendChild(el);
    
    const item = el.shadowRoot?.querySelector('.item[data-index="1"]') as HTMLElement;
    item.click();
    
    expect(clickHandler).toHaveBeenCalledTimes(1);
    expect(clickHandler).toHaveBeenCalledWith(item);
  });

  it('should pass event object to handler', () => {
    let capturedEvent: Event | null = null;
    
    @element('test-event')
    class TestEvent extends HTMLElement {
      @on('click')
      handleClick(event: Event) {
        capturedEvent = event;
      }
    }
    
    const el = document.createElement('test-event');
    document.body.appendChild(el);
    
    el.click();
    
    expect(capturedEvent).toBeDefined();
    expect(capturedEvent?.type).toBe('click');
    expect(capturedEvent?.target).toBe(el);
  });

  it('should handle multiple event bindings', () => {
    const clickHandler = vi.fn();
    const changeHandler = vi.fn();
    
    @element('test-multi-events')
    class TestMultiEvents extends HTMLElement {
      html() {
        return `
          <button class="btn">Click</button>
          <input class="input" type="text">
        `;
      }
      
      @on('click', '.btn')
      handleClick() {
        clickHandler();
      }
      
      @on('input', '.input')
      handleChange() {
        changeHandler();
      }
    }
    
    const el = document.createElement('test-multi-events');
    document.body.appendChild(el);
    
    const btn = el.shadowRoot?.querySelector('.btn') as HTMLElement;
    const input = el.shadowRoot?.querySelector('.input') as HTMLInputElement;
    
    btn.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler).toHaveBeenCalledTimes(0);
    
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(clickHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler).toHaveBeenCalledTimes(1);
  });

  it('should cleanup event listeners on disconnect', () => {
    const clickHandler = vi.fn();
    
    @element('test-cleanup')
    class TestCleanup extends HTMLElement {
      @on('click')
      handleClick() {
        clickHandler();
      }
    }
    
    const el = document.createElement('test-cleanup');
    document.body.appendChild(el);
    
    el.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);
    
    // Remove element
    document.body.removeChild(el);
    
    // Try clicking after removal (should not trigger)
    el.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });
});