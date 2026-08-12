import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  attachController,
  controller,
  detachController,
  dispatch,
  element,
  getController,
  on,
} from './test-imports';
import { setupEventHandlers } from '../packages/core/src/on';
import type {
  DispatchOptions,
  EventTiming,
  OnOptions,
} from './test-imports';

const typedTiming: EventTiming = function () { return 25; };
const typedOnOptions: OnOptions = {
  debounce() { return 25; },
  throttle() { return 50; },
};
const typedDispatchOptions: DispatchOptions = {
  debounce() { return 25; },
  throttle() { return 50; },
};
// @ts-expect-error timing resolvers must return milliseconds as a number
const invalidTypedTiming: EventTiming = () => '25';
void [typedTiming, typedOnOptions, typedDispatchOptions, invalidTypedTiming];

describe('per-instance event timing resolvers', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('@on resolves debounce against each element instance at setup', async () => {
    @element('timing-on-element')
    class TimingOnElement extends HTMLElement {
      wait = 0;
      calls = 0;

      @on('ping', { debounce() { return this.wait; } })
      handlePing() { this.calls++; }
    }

    const fast = document.createElement('timing-on-element') as TimingOnElement;
    const slow = document.createElement('timing-on-element') as TimingOnElement;
    fast.wait = 20;
    slow.wait = 80;
    document.body.append(fast, slow);
    await Promise.all([fast.ready, slow.ready]);

    vi.useFakeTimers();
    fast.dispatchEvent(new Event('ping'));
    slow.dispatchEvent(new Event('ping'));

    await vi.advanceTimersByTimeAsync(30);
    expect([fast.calls, slow.calls]).toEqual([1, 0]);
    await vi.advanceTimersByTimeAsync(60);
    expect([fast.calls, slow.calls]).toEqual([1, 1]);
  });

  it('@on resolves debounce against each attached controller instance', async () => {
    @controller('timing-on-controller')
    class TimingOnController {
      element: HTMLElement | null = null;
      calls = 0;
      attach() {}
      detach() {}

      @on('ping', { debounce() { return Number(this.element?.dataset.wait); } })
      handlePing() { this.calls++; }
    }

    const fastHost = document.createElement('div') as HTMLElement & { ready: Promise<void> };
    const slowHost = document.createElement('div') as HTMLElement & { ready: Promise<void> };
    fastHost.ready = Promise.resolve();
    slowHost.ready = Promise.resolve();
    fastHost.dataset.wait = '20';
    slowHost.dataset.wait = '80';
    document.body.append(fastHost, slowHost);
    await Promise.all([
      attachController(fastHost, TimingOnController),
      attachController(slowHost, TimingOnController),
    ]);
    const fast = getController<TimingOnController>(fastHost)!;
    const slow = getController<TimingOnController>(slowHost)!;

    vi.useFakeTimers();
    fastHost.dispatchEvent(new Event('ping'));
    slowHost.dispatchEvent(new Event('ping'));

    await vi.advanceTimersByTimeAsync(30);
    expect([fast.calls, slow.calls]).toEqual([1, 0]);
    await vi.advanceTimersByTimeAsync(60);
    expect([fast.calls, slow.calls]).toEqual([1, 1]);
  });

  it('@dispatch resolves debounce independently for each element invocation', async () => {
    @element('timing-dispatch-element')
    class TimingDispatchElement extends HTMLElement {
      wait = 0;

      @dispatch('value-ready', { debounce() { return this.wait; } })
      emit(value: number) { return value; }
    }

    const fast = document.createElement('timing-dispatch-element') as TimingDispatchElement;
    const slow = document.createElement('timing-dispatch-element') as TimingDispatchElement;
    fast.wait = 20;
    slow.wait = 80;
    document.body.append(fast, slow);
    await Promise.all([fast.ready, slow.ready]);
    const values: number[] = [];
    fast.addEventListener('value-ready', (event) => values.push((event as CustomEvent).detail));
    slow.addEventListener('value-ready', (event) => values.push((event as CustomEvent).detail));

    vi.useFakeTimers();
    fast.emit(1);
    slow.emit(2);

    await vi.advanceTimersByTimeAsync(30);
    expect(values).toEqual([1]);
    await vi.advanceTimersByTimeAsync(60);
    expect(values).toEqual([1, 2]);
  });

  it('@dispatch keeps async controller results and cancels pending work on detach', async () => {
    @controller('timing-dispatch-controller')
    class TimingDispatchController {
      element: HTMLElement | null = null;
      wait = 0;
      attach() {}
      detach() {}

      @dispatch('value-ready', { debounce() { return this.wait; } })
      async emit(value: number, gate: Promise<void> = Promise.resolve()) {
        await gate;
        return value;
      }
    }

    const fastHost = document.createElement('div') as HTMLElement & { ready: Promise<void> };
    const slowHost = document.createElement('div') as HTMLElement & { ready: Promise<void> };
    fastHost.ready = Promise.resolve();
    slowHost.ready = Promise.resolve();
    document.body.append(fastHost, slowHost);
    await Promise.all([
      attachController(fastHost, TimingDispatchController),
      attachController(slowHost, TimingDispatchController),
    ]);
    const fast = getController<TimingDispatchController>(fastHost)!;
    const slow = getController<TimingDispatchController>(slowHost)!;
    fast.wait = 20;
    slow.wait = 80;
    const fastEvents = vi.fn();
    const slowEvents = vi.fn();
    fastHost.addEventListener('value-ready', fastEvents);
    slowHost.addEventListener('value-ready', slowEvents);

    vi.useFakeTimers();
    await expect(fast.emit(1)).resolves.toBe(1);
    await expect(slow.emit(2)).resolves.toBe(2);
    await vi.advanceTimersByTimeAsync(30);
    expect(fastEvents).toHaveBeenCalledOnce();
    expect(slowEvents).not.toHaveBeenCalled();

    await detachController(slowHost);
    await vi.advanceTimersByTimeAsync(60);
    expect(slowEvents).not.toHaveBeenCalled();

    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const unresolved = fast.emit(3, gate);
    await detachController(fastHost);
    release();
    await expect(unresolved).resolves.toBe(3);
    await vi.runAllTimersAsync();
    expect(fastEvents).toHaveBeenCalledOnce();
  });

  it('accepts the same per-instance resolver API for throttle', async () => {
    @element('timing-throttle-element')
    class TimingThrottleElement extends HTMLElement {
      wait = 50;
      onCalls = 0;

      @on('ping', { throttle() { return this.wait; } })
      handlePing() { this.onCalls++; }

      @dispatch('pong', { throttle() { return this.wait; } })
      emit(value: number) { return value; }
    }

    const target = document.createElement('timing-throttle-element') as TimingThrottleElement;
    document.body.append(target);
    await target.ready;
    const details: number[] = [];
    target.addEventListener('pong', (event) => details.push((event as CustomEvent).detail));

    vi.useFakeTimers();
    target.dispatchEvent(new Event('ping'));
    target.dispatchEvent(new Event('ping'));
    target.emit(1);
    target.emit(2);
    expect(target.onCalls).toBe(1);
    expect(details).toEqual([1]);

    await vi.advanceTimersByTimeAsync(50);
    expect(details).toEqual([1, 2]);
    target.dispatchEvent(new Event('ping'));
    expect(target.onCalls).toBe(2);
  });

  it('rejects negative, non-finite, and non-number timing values', () => {
    @element('timing-invalid-dispatch')
    class InvalidDispatch extends HTMLElement {
      @dispatch('nope', { debounce: () => -1 })
      emit() { return true; }
    }

    const emitter = document.createElement('timing-invalid-dispatch') as InvalidDispatch;
    expect(() => emitter.emit()).toThrow(/debounce.*finite, non-negative number/i);

    class InvalidOn {
      @on('nope', { debounce: () => Number.NaN })
      handle() {}
    }
    expect(() => setupEventHandlers(new InvalidOn(), new EventTarget()))
      .toThrow(/debounce.*finite, non-negative number/i);

    @element('timing-invalid-throttle')
    class InvalidThrottle extends HTMLElement {
      @dispatch('nope', { throttle: (() => 'fast') as unknown as EventTiming })
      emit() { return true; }
    }
    const throttled = document.createElement('timing-invalid-throttle') as InvalidThrottle;
    expect(() => throttled.emit()).toThrow(/throttle.*finite, non-negative number/i);

    @element('timing-infinite-throttle')
    class InfiniteThrottle extends HTMLElement {
      @dispatch('nope', { throttle: () => Number.POSITIVE_INFINITY })
      emit() { return true; }
    }
    const infinite = document.createElement('timing-infinite-throttle') as InfiniteThrottle;
    expect(() => infinite.emit()).toThrow(/throttle.*finite, non-negative number/i);
  });
});
