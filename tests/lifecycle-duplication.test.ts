import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, ready, dispose, watch, moved, property, render, html } from '../src/index';
import { getSymbol } from '../src/symbols';

const READY_HANDLERS = getSymbol('ready-handlers');
const DISPOSE_HANDLERS = getSymbol('dispose-handlers');
const PROPERTY_WATCHERS = getSymbol('property-watchers');
const MOVED_HANDLERS = getSymbol('moved-handlers');

describe('Lifecycle decorator duplication bug', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('@ready should not duplicate handlers when creating multiple instances', async () => {
    const readyHandler = vi.fn();

    @element('test-ready-dup')
    class TestReadyDup extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Test</div>`;
      }

      @ready()
      initialize() {
        readyHandler(this);
      }
    }

    const constructor = TestReadyDup as any;

    // Create 5 instances
    const instances: TestReadyDup[] = [];
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('test-ready-dup') as TestReadyDup;
      container.appendChild(el);
      await el.ready;
      instances.push(el);
    }

    // Handler array should only contain 1 handler
    const handlerCount = constructor[READY_HANDLERS]?.length || 0;
    expect(handlerCount).toBe(1);

    // Ready handler should have been called exactly 5 times (once per instance)
    expect(readyHandler).toHaveBeenCalledTimes(5);

    // Each call should have been with a different instance
    expect(readyHandler).toHaveBeenNthCalledWith(1, instances[0]);
    expect(readyHandler).toHaveBeenNthCalledWith(2, instances[1]);
    expect(readyHandler).toHaveBeenNthCalledWith(3, instances[2]);
    expect(readyHandler).toHaveBeenNthCalledWith(4, instances[3]);
    expect(readyHandler).toHaveBeenNthCalledWith(5, instances[4]);
  });

  it('@ready with multiple handlers should not duplicate', async () => {
    const readyHandler1 = vi.fn();
    const readyHandler2 = vi.fn();
    const readyHandler3 = vi.fn();

    @element('test-multi-ready')
    class TestMultiReady extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Test</div>`;
      }

      @ready()
      initialize1() {
        readyHandler1();
      }

      @ready()
      initialize2() {
        readyHandler2();
      }

      @ready()
      initialize3() {
        readyHandler3();
      }
    }

    const constructor = TestMultiReady as any;

    // Create 10 instances and wait for all to be ready
    const instances = [];
    for (let i = 0; i < 10; i++) {
      const el = document.createElement('test-multi-ready') as TestMultiReady;
      container.appendChild(el);
      instances.push(el);
    }

    // Wait for all instances to be ready
    await Promise.all(instances.map((el: any) => el.ready));

    // Should have exactly 3 handlers (not 30)
    const handlerCount = constructor[READY_HANDLERS]?.length || 0;
    expect(handlerCount).toBe(3);

    // Each handler should have been called exactly 10 times (once per instance)
    expect(readyHandler1).toHaveBeenCalledTimes(10);
    expect(readyHandler2).toHaveBeenCalledTimes(10);
    expect(readyHandler3).toHaveBeenCalledTimes(10);
  });

  it('@dispose should not duplicate handlers when creating multiple instances', async () => {
    const disposeHandler = vi.fn();

    @element('test-dispose-dup')
    class TestDisposeDup extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Test</div>`;
      }

      @dispose()
      cleanup() {
        disposeHandler(this);
      }
    }

    const constructor = TestDisposeDup as any;

    // Create 5 instances
    const instances: TestDisposeDup[] = [];
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('test-dispose-dup') as TestDisposeDup;
      container.appendChild(el);
      await el.ready;
      instances.push(el);
    }

    // Handler array should only contain 1 handler
    const handlerCount = constructor[DISPOSE_HANDLERS]?.length || 0;
    expect(handlerCount).toBe(1);

    // Dispose should not have been called yet
    expect(disposeHandler).toHaveBeenCalledTimes(0);

    // Remove instances one by one
    for (let i = 0; i < instances.length; i++) {
      instances[i].remove();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should have been called exactly i+1 times (not i+1 * (i+1))
      expect(disposeHandler).toHaveBeenCalledTimes(i + 1);
      expect(disposeHandler).toHaveBeenNthCalledWith(i + 1, instances[i]);
    }
  });

  it('@dispose with multiple handlers should not duplicate', async () => {
    const disposeHandler1 = vi.fn();
    const disposeHandler2 = vi.fn();

    @element('test-multi-dispose')
    class TestMultiDispose extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Test</div>`;
      }

      @dispose()
      cleanup1() {
        disposeHandler1();
      }

      @dispose()
      cleanup2() {
        disposeHandler2();
      }
    }

    const constructor = TestMultiDispose as any;

    // Create 5 instances
    const instances: TestMultiDispose[] = [];
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('test-multi-dispose') as TestMultiDispose;
      container.appendChild(el);
      await el.ready;
      instances.push(el);
    }

    // Should have exactly 2 handlers
    const handlerCount = constructor[DISPOSE_HANDLERS]?.length || 0;
    expect(handlerCount).toBe(2);

    // Remove all instances
    for (const instance of instances) {
      instance.remove();
    }
    await new Promise(resolve => setTimeout(resolve, 10));

    // Each handler should have been called exactly 5 times
    expect(disposeHandler1).toHaveBeenCalledTimes(5);
    expect(disposeHandler2).toHaveBeenCalledTimes(5);
  });

  it('@watch should not duplicate watchers when creating multiple instances', async () => {
    const watchHandler = vi.fn();

    @element('test-watch-dup')
    class TestWatchDup extends HTMLElement {
      @property()
      count = 0;

      @render()
      renderContent() {
        return html`<div>${this.count}</div>`;
      }

      @watch('count')
      onCountChange(oldValue: number, newValue: number) {
        watchHandler(this, oldValue, newValue);
      }
    }

    const constructor = TestWatchDup as any;

    // Create 5 instances
    const instances: TestWatchDup[] = [];
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('test-watch-dup') as TestWatchDup;
      container.appendChild(el);
      await el.ready;
      instances.push(el);
    }

    // Watcher should only be registered once
    const watcherCount = constructor[PROPERTY_WATCHERS]?.get('count')?.length || 0;
    expect(watcherCount).toBe(1);

    watchHandler.mockClear();

    // Change count on first instance
    instances[0].count = 1;
    await new Promise(resolve => setTimeout(resolve, 10));

    // Should fire exactly once (not 5 times)
    expect(watchHandler).toHaveBeenCalledTimes(1);
    expect(watchHandler).toHaveBeenCalledWith(instances[0], 0, 1);

    watchHandler.mockClear();

    // Change count on third instance
    instances[2].count = 5;
    await new Promise(resolve => setTimeout(resolve, 10));

    // Should fire exactly once
    expect(watchHandler).toHaveBeenCalledTimes(1);
    expect(watchHandler).toHaveBeenCalledWith(instances[2], 0, 5);
  });

  it('@watch with multiple properties should not duplicate', async () => {
    const watchHandler = vi.fn();

    @element('test-multi-watch')
    class TestMultiWatch extends HTMLElement {
      @property()
      name = '';

      @property({ type: Number })
      age = 0;

      @render()
      renderContent() {
        return html`<div>${this.name} ${this.age}</div>`;
      }

      @watch('name', 'age')
      onPropertyChange(oldValue: any, newValue: any) {
        watchHandler(this, oldValue, newValue);
      }
    }

    const constructor = TestMultiWatch as any;

    // Create 10 instances
    const instances: TestMultiWatch[] = [];
    for (let i = 0; i < 10; i++) {
      const el = document.createElement('test-multi-watch') as TestMultiWatch;
      container.appendChild(el);
      await el.ready;
      instances.push(el);
    }

    // Both properties should have exactly 1 watcher
    expect(constructor[PROPERTY_WATCHERS]?.get('name')?.length).toBe(1);
    expect(constructor[PROPERTY_WATCHERS]?.get('age')?.length).toBe(1);

    watchHandler.mockClear();

    // Change name on instance 5
    instances[4].name = 'Alice';
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(watchHandler).toHaveBeenCalledTimes(1);

    watchHandler.mockClear();

    // Change age on instance 5
    instances[4].age = 30;
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(watchHandler).toHaveBeenCalledTimes(1);

    watchHandler.mockClear();

    // Change both on instance 8
    instances[7].name = 'Bob';
    instances[7].age = 25;
    await new Promise(resolve => setTimeout(resolve, 10));

    // Should fire twice (once for each property)
    expect(watchHandler).toHaveBeenCalledTimes(2);
  });

  it('@moved should not duplicate handlers when creating multiple instances', async () => {
    const movedHandler = vi.fn();

    @element('test-moved-dup')
    class TestMovedDup extends HTMLElement {
      @render()
      renderContent() {
        return html`<div>Test</div>`;
      }

      @moved()
      onMoved() {
        movedHandler(this);
      }
    }

    const constructor = TestMovedDup as any;

    // Create 5 instances
    const instances: any[] = [];
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('test-moved-dup') as TestMovedDup;
      container.appendChild(el);
      await el.ready;
      instances.push(el);
    }

    // Handler should only be registered once
    const handlerCount = constructor[MOVED_HANDLERS]?.length || 0;
    expect(handlerCount).toBe(1);

    movedHandler.mockClear();

    // Manually trigger connectedMoveCallback on first instance
    if (instances[0].connectedMoveCallback) {
      await instances[0].connectedMoveCallback();
    }

    // Should fire exactly once (not 5 times)
    expect(movedHandler).toHaveBeenCalledTimes(1);
    expect(movedHandler).toHaveBeenCalledWith(instances[0]);

    movedHandler.mockClear();

    // Manually trigger connectedMoveCallback on third instance
    if (instances[2].connectedMoveCallback) {
      await instances[2].connectedMoveCallback();
    }

    expect(movedHandler).toHaveBeenCalledTimes(1);
    expect(movedHandler).toHaveBeenCalledWith(instances[2]);
  });

  it('creating 100 instances with all lifecycle decorators should not cause duplication', async () => {
    const readyHandler = vi.fn();
    const disposeHandler = vi.fn();
    const watchHandler = vi.fn();
    const movedHandler = vi.fn();

    @element('test-all-lifecycle')
    class TestAllLifecycle extends HTMLElement {
      @property({ type: Number })
      value = 0;

      @render()
      renderContent() {
        return html`<div>${this.value}</div>`;
      }

      @ready()
      initialize() {
        readyHandler();
      }

      @dispose()
      cleanup() {
        disposeHandler();
      }

      @watch('value')
      onValueChange() {
        watchHandler();
      }

      @moved()
      onMoved() {
        movedHandler();
      }
    }

    const constructor = TestAllLifecycle as any;

    // Create 100 instances
    const instances: TestAllLifecycle[] = [];
    for (let i = 0; i < 100; i++) {
      const el = document.createElement('test-all-lifecycle') as TestAllLifecycle;
      container.appendChild(el);
      await el.ready;
      instances.push(el);
    }

    // All handler arrays should have exactly 1 handler
    expect(constructor[READY_HANDLERS]?.length).toBe(1);
    expect(constructor[DISPOSE_HANDLERS]?.length).toBe(1);
    expect(constructor[PROPERTY_WATCHERS]?.get('value')?.length).toBe(1);
    expect(constructor[MOVED_HANDLERS]?.length).toBe(1);

    // Ready should have been called exactly 100 times
    expect(readyHandler).toHaveBeenCalledTimes(100);

    // Change value on one instance - watch should fire exactly once
    watchHandler.mockClear();
    instances[50].value = 42;
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(watchHandler).toHaveBeenCalledTimes(1);

    // Remove all instances
    for (const instance of instances) {
      instance.remove();
    }
    await new Promise(resolve => setTimeout(resolve, 10));

    // Dispose should have been called exactly 100 times
    expect(disposeHandler).toHaveBeenCalledTimes(100);
  });
});
