import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, on } from '../src/index';

describe('@on decorator with array syntax', () => {
  let container: HTMLElement;
  let testId = 0;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    testId++;
  });

  afterEach(() => {
    container.remove();
  });

  it('should handle array of events on same element', async () => {
    const tagName = `test-array-${testId}`;
    let clickCount = 0;
    let keyCount = 0;

    @element(tagName)
    class TestArray extends HTMLElement {
      html() {
        return `<button class="btn">Click or Press Enter</button>`;
      }

      @on(['click', 'keydown:Enter'], '.btn')
      handleAction(e: Event) {
        if (e.type === 'click') clickCount++;
        if (e.type === 'keydown') keyCount++;
      }
    }

    container.innerHTML = `<${tagName}></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    const button = el.shadowRoot.querySelector('.btn');
    
    // Test click
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clickCount).toBe(1);
    expect(keyCount).toBe(0);
    
    // Test Enter key
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(clickCount).toBe(1);
    expect(keyCount).toBe(1);
  });

  it('should handle array of keyboard events with modifiers', async () => {
    const tagName = `test-keys-${testId}`;
    let callCount = 0;
    let lastKey = '';

    @element(tagName)
    class TestKeys extends HTMLElement {
      html() {
        return `<input class="input" type="text">`;
      }

      @on(['keydown:Enter', 'keydown:Space', 'keydown:ArrowDown', 'keydown:ArrowUp'], '.input', { preventDefault: true })
      handleKeys(e: KeyboardEvent) {
        callCount++;
        lastKey = e.key;
      }
    }

    container.innerHTML = `<${tagName}></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    const input = el.shadowRoot.querySelector('.input');
    
    // Test each key
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(callCount).toBe(1);
    expect(lastKey).toBe('Enter');
    
    input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    expect(callCount).toBe(2);
    expect(lastKey).toBe(' ');
    
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(callCount).toBe(3);
    expect(lastKey).toBe('ArrowDown');
    
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect(callCount).toBe(4);
    expect(lastKey).toBe('ArrowUp');
    
    // Test that other keys don't trigger
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(callCount).toBe(4); // No change
  });

  it('should apply options to all events in array', async () => {
    const tagName = `test-options-${testId}`;
    let callCount = 0;
    let events: Event[] = [];

    @element(tagName)
    class TestOptions extends HTMLElement {
      html() {
        return `<form><button class="btn">Submit</button></form>`;
      }

      @on(['click', 'keydown:Enter'], '.btn', { preventDefault: true, stopPropagation: true })
      handleSubmit(e: Event) {
        callCount++;
        events.push(e);
      }
    }

    container.innerHTML = `<${tagName}></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    const button = el.shadowRoot.querySelector('.btn');
    
    // Test with cancelable events
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const keyEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    
    button.dispatchEvent(clickEvent);
    button.dispatchEvent(keyEvent);
    
    expect(callCount).toBe(2);
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(keyEvent.defaultPrevented).toBe(true);
  });

  it('should handle single event in array same as string', async () => {
    const tagName = `test-single-${testId}`;
    let count1 = 0;
    let count2 = 0;

    @element(tagName)
    class TestSingle extends HTMLElement {
      html() {
        return `
          <button class="btn1">Button 1</button>
          <button class="btn2">Button 2</button>
        `;
      }

      @on(['click'], '.btn1')
      handleClick1() {
        count1++;
      }

      @on('click', '.btn2')
      handleClick2() {
        count2++;
      }
    }

    container.innerHTML = `<${tagName}></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    const btn1 = el.shadowRoot.querySelector('.btn1');
    const btn2 = el.shadowRoot.querySelector('.btn2');
    
    btn1.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    btn2.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    expect(count1).toBe(1);
    expect(count2).toBe(1);
  });

  it('should handle mixed event types', async () => {
    const tagName = `test-mixed-${testId}`;
    const events: string[] = [];

    @element(tagName)
    class TestMixed extends HTMLElement {
      html() {
        return `<div class="target" tabindex="0">Interactive Element</div>`;
      }

      @on(['mouseenter', 'focus', 'click'], '.target')
      handleInteraction(e: Event) {
        events.push(e.type);
      }
    }

    container.innerHTML = `<${tagName}></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    const target = el.shadowRoot.querySelector('.target');
    
    target.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    target.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    expect(events).toEqual(['mouseenter', 'focus', 'click']);
  });

  it('should handle empty array gracefully', async () => {
    const tagName = `test-empty-${testId}`;
    let called = false;

    @element(tagName)
    class TestEmpty extends HTMLElement {
      html() {
        return `<button class="btn">Button</button>`;
      }

      @on([], '.btn')
      handleNothing() {
        called = true;
      }
    }

    container.innerHTML = `<${tagName}></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    const button = el.shadowRoot.querySelector('.btn');
    
    // Nothing should trigger the handler
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    
    expect(called).toBe(false);
  });

  it('should work with debounce option on multiple events', async () => {
    const tagName = `test-debounce-${testId}`;
    let callCount = 0;
    let lastEventType = '';

    @element(tagName)
    class TestDebounce extends HTMLElement {
      html() {
        return `<input class="field" type="text">`;
      }

      @on(['input', 'change'], '.field', { debounce: 50 })
      handleFieldChange(e: Event) {
        callCount++;
        lastEventType = e.type;
      }
    }

    container.innerHTML = `<${tagName}></${tagName}>`;
    const el = container.querySelector(tagName) as any;
    await el.ready;

    const field = el.shadowRoot.querySelector('.field');
    
    // Fire multiple events of same type rapidly
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Should not have fired yet
    expect(callCount).toBe(0);
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should have fired once for input
    expect(callCount).toBe(1);
    expect(lastEventType).toBe('input');
    
    // Now test change event separately
    field.dispatchEvent(new Event('change', { bubbles: true }));
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should have fired again for change
    expect(callCount).toBe(2);
    expect(lastEventType).toBe('change');
  });
});