import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, on, render, html } from '../src/index';
import { getSymbol } from '../src/symbols';

const ON_HANDLERS = getSymbol('on-handlers');

describe('@on decorator - handler duplication bug', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should not add duplicate handlers to prototype when creating multiple instances', async () => {
    const clickHandler = vi.fn();

    @element('test-multi-instance')
    class TestMultiInstance extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Test</div>`;
      }

      @on('click')
      handleClick(e: Event) {
        clickHandler(e);
      }
    }

    // Check prototype handlers before creating any instances
    const constructor = TestMultiInstance as any;
    const initialHandlerCount = constructor.prototype[ON_HANDLERS]?.length || 0;
    console.log('Initial handler count:', initialHandlerCount);

    // Create first instance
    const el1 = document.createElement('test-multi-instance') as TestMultiInstance;
    container.appendChild(el1);
    await el1.ready;

    const afterFirstInstance = constructor.prototype[ON_HANDLERS]?.length || 0;
    console.log('After first instance:', afterFirstInstance);

    // Create second instance
    const el2 = document.createElement('test-multi-instance') as TestMultiInstance;
    container.appendChild(el2);
    await el2.ready;

    const afterSecondInstance = constructor.prototype[ON_HANDLERS]?.length || 0;
    console.log('After second instance:', afterSecondInstance);

    // Create third instance
    const el3 = document.createElement('test-multi-instance') as TestMultiInstance;
    container.appendChild(el3);
    await el3.ready;

    const afterThirdInstance = constructor.prototype[ON_HANDLERS]?.length || 0;
    console.log('After third instance:', afterThirdInstance);

    // The prototype handler count should NOT increase with each instance
    expect(afterFirstInstance).toBe(afterSecondInstance);
    expect(afterSecondInstance).toBe(afterThirdInstance);

    // Click first instance - should fire exactly once
    clickHandler.mockClear();
    el1.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);

    // Click second instance - should fire exactly once
    clickHandler.mockClear();
    el2.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);

    // Click third instance - should fire exactly once
    clickHandler.mockClear();
    el3.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it('should fire handler exactly once per click regardless of how many instances exist', async () => {
    const clickHandler = vi.fn();

    @element('test-click-count')
    class TestClickCount extends HTMLElement {
      @render()
      renderContent() {
        return html`<button>Click</button>`;
      }

      @on('click', 'button')
      handleClick(e: Event) {
        clickHandler(e);
      }
    }

    // Create 10 instances
    const instances: TestClickCount[] = [];
    for (let i = 0; i < 10; i++) {
      const el = document.createElement('test-click-count') as TestClickCount;
      container.appendChild(el);
      await el.ready;
      instances.push(el);
    }

    // Click the first instance's button
    clickHandler.mockClear();
    const button1 = instances[0].shadowRoot?.querySelector('button') as HTMLButtonElement;
    button1.click();

    // Should fire exactly once, not 10 times
    expect(clickHandler).toHaveBeenCalledTimes(1);

    // Click the last instance's button
    clickHandler.mockClear();
    const button10 = instances[9].shadowRoot?.querySelector('button') as HTMLButtonElement;
    button10.click();

    // Should fire exactly once
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it('should not multiply handlers with direct event listeners', async () => {
    const clickHandler = vi.fn();

    @element('test-direct-multi')
    class TestDirectMulti extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Test</div>`;
      }

      @on('click')
      handleClick(e: Event) {
        console.log('Handler called for', this.constructor.name);
        clickHandler(e);
      }
    }

    // Create 5 instances
    const instances: TestDirectMulti[] = [];
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('test-direct-multi') as TestDirectMulti;
      container.appendChild(el);
      await el.ready;
      instances.push(el);
    }

    // Click first instance
    clickHandler.mockClear();
    console.log('=== Clicking first instance ===');
    instances[0].click();
    expect(clickHandler).toHaveBeenCalledTimes(1);

    // Click second instance
    clickHandler.mockClear();
    console.log('=== Clicking second instance ===');
    instances[1].click();
    expect(clickHandler).toHaveBeenCalledTimes(1);

    // Click third instance
    clickHandler.mockClear();
    console.log('=== Clicking third instance ===');
    instances[2].click();
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it('should have stable prototype handler array size', async () => {
    @element('test-stable-prototype')
    class TestStablePrototype extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Test</div>`;
      }

      @on('click')
      handleClick1() {}

      @on('mouseenter')
      handleMouseEnter() {}

      @on('focus')
      handleFocus() {}
    }

    const constructor = TestStablePrototype as any;

    // Before any instances (handlers not registered yet)
    const before = constructor[ON_HANDLERS]?.length || 0;
    console.log('Handlers before instances:', before);

    // Create first instance
    const el1 = document.createElement('test-stable-prototype');
    container.appendChild(el1);
    await (el1 as any).ready;

    const after1 = constructor[ON_HANDLERS]?.length || 0;
    console.log('Handlers after 1 instance:', after1);

    // Create 9 more instances
    for (let i = 0; i < 9; i++) {
      const el = document.createElement('test-stable-prototype');
      container.appendChild(el);
      await (el as any).ready;
    }

    const after10 = constructor[ON_HANDLERS]?.length || 0;
    console.log('Handlers after 10 instances:', after10);

    // Should have exactly 3 handlers (click, mouseenter, focus)
    // and count should not change as instances are created
    expect(after1).toBe(3);
    expect(after10).toBe(3);
  });
});
