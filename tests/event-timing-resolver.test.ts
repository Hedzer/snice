import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  attachController,
  controller,
  detachController,
  dispatch,
  dispose,
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

  it('invalidates queued and unresolved dispatch work before awaiting element disposal', async () => {
    let releaseDispose!: () => void;
    const disposeGate = new Promise<void>((resolve) => { releaseDispose = resolve; });
    let releaseMethod!: () => void;
    const methodGate = new Promise<void>((resolve) => { releaseMethod = resolve; });

    @element('timing-element-teardown')
    class TimingElementTeardown extends HTMLElement {
      @dispose()
      async waitForDispose() { await disposeGate; }

      @dispatch('queued-value', { debounce: 40 })
      emitQueued(value: number) { return value; }

      @dispatch('async-value', { debounce: 40 })
      async emitAsync(value: number) {
        await methodGate;
        return value;
      }
    }

    const target = document.createElement('timing-element-teardown') as TimingElementTeardown;
    document.body.append(target);
    await target.ready;
    const events = vi.fn();
    target.addEventListener('queued-value', events);
    target.addEventListener('async-value', events);

    vi.useFakeTimers();
    target.emitQueued(1);
    const unresolved = target.emitAsync(2);
    target.remove();

    await vi.advanceTimersByTimeAsync(50);
    releaseMethod();
    await expect(unresolved).resolves.toBe(2);
    await vi.advanceTimersByTimeAsync(50);
    expect(events).not.toHaveBeenCalled();

    releaseDispose();
    await Promise.resolve();
    document.body.append(target);
    target.emitQueued(3);
    await vi.advanceTimersByTimeAsync(40);
    expect(events).toHaveBeenCalledOnce();
    expect((events.mock.calls[0][0] as CustomEvent).detail).toBe(3);
  });

  it('invalidates dispatch work when controller attachment aborts before ready', async () => {
    let resolveReady!: () => void;
    const ready = new Promise<void>((resolve) => { resolveReady = resolve; });
    let releaseMethod!: () => void;
    const methodGate = new Promise<void>((resolve) => { releaseMethod = resolve; });

    @controller('timing-aborted-controller')
    class TimingAbortedController {
      element: HTMLElement | null = null;
      attach() {}
      detach() {}

      @dispatch('queued-value', { debounce: 40 })
      emitQueued(value: number) { return value; }

      @dispatch('async-value', { debounce: 40 })
      async emitAsync(value: number) {
        await methodGate;
        return value;
      }
    }

    const host = document.createElement('div') as HTMLElement & { ready: Promise<void> };
    host.ready = ready;
    document.body.append(host);
    const events = vi.fn();
    host.addEventListener('queued-value', events);
    host.addEventListener('async-value', events);
    const attaching = attachController(host, TimingAbortedController);
    const instance = getController<TimingAbortedController>(host)!;

    vi.useFakeTimers();
    instance.emitQueued(1);
    const unresolved = instance.emitAsync(2);
    await detachController(host);
    await expect(attaching).rejects.toMatchObject({ name: 'ControllerAttachAborted' });

    await vi.advanceTimersByTimeAsync(50);
    releaseMethod();
    await expect(unresolved).resolves.toBe(2);
    await vi.advanceTimersByTimeAsync(50);
    expect(events).not.toHaveBeenCalled();
    resolveReady();

    await attachController(host, TimingAbortedController);
    const rebound = getController<TimingAbortedController>(host)!;
    rebound.emitQueued(3);
    await vi.advanceTimersByTimeAsync(40);
    expect(events).toHaveBeenCalledOnce();
    expect((events.mock.calls[0][0] as CustomEvent).detail).toBe(3);
  });

  it('@dispatch cancels stale debounce when a resolver changes to zero', async () => {
    @element('timing-debounce-zero')
    class TimingDebounceZero extends HTMLElement {
      wait = 100;

      @dispatch('value', { debounce() { return this.wait; } })
      emit(value: number) { return value; }
    }

    const target = document.createElement('timing-debounce-zero') as TimingDebounceZero;
    document.body.append(target);
    await target.ready;
    const details: number[] = [];
    target.addEventListener('value', (event) => details.push((event as CustomEvent).detail));

    vi.useFakeTimers();
    target.emit(1);
    target.wait = 0;
    target.emit(2);
    expect(details).toEqual([2]);
    await vi.advanceTimersByTimeAsync(100);
    expect(details).toEqual([2]);
  });

  it('@dispatch reschedules throttle trailing work to the newly resolved interval', async () => {
    @element('timing-throttle-reschedule')
    class TimingThrottleReschedule extends HTMLElement {
      wait = 100;

      @dispatch('value', { throttle() { return this.wait; } })
      emit(value: number) { return value; }
    }

    const target = document.createElement('timing-throttle-reschedule') as TimingThrottleReschedule;
    document.body.append(target);
    await target.ready;
    const details: number[] = [];
    target.addEventListener('value', (event) => details.push((event as CustomEvent).detail));

    vi.useFakeTimers();
    target.emit(1);
    await vi.advanceTimersByTimeAsync(20);
    target.emit(2); // trailing deadline: t=100
    target.wait = 200;
    await vi.advanceTimersByTimeAsync(10);
    target.emit(3); // replace detail and move trailing deadline to t=200
    await vi.advanceTimersByTimeAsync(80);
    expect(details).toEqual([1]);
    await vi.advanceTimersByTimeAsync(90);
    expect(details).toEqual([1, 3]);

    target.wait = 100;
    await vi.advanceTimersByTimeAsync(10);
    target.emit(4); // deadline t=300
    target.wait = 40;
    await vi.advanceTimersByTimeAsync(10);
    target.emit(5); // replace t=300 deadline with last-dispatch + 40 = t=240
    expect(details).toEqual([1, 3]);
    await vi.advanceTimersByTimeAsync(19);
    expect(details).toEqual([1, 3]);
    await vi.advanceTimersByTimeAsync(1);
    expect(details).toEqual([1, 3, 5]);

    target.wait = 100;
    await vi.advanceTimersByTimeAsync(10);
    target.emit(6);
    target.wait = 0;
    await vi.advanceTimersByTimeAsync(10);
    target.emit(7);
    expect(details).toEqual([1, 3, 5, 7]);
    await vi.advanceTimersByTimeAsync(100);
    expect(details).toEqual([1, 3, 5, 7]);
  });

  it('@dispatch timing state cannot collide across event/method name pairs', async () => {
    @element('timing-key-collision')
    class TimingKeyCollision extends HTMLElement {
      @dispatch('a_b', { debounce: 20 })
      c(value: number) { return value; }

      @dispatch('a', { debounce: 20 })
      b_c(value: number) { return value; }
    }

    const target = document.createElement('timing-key-collision') as TimingKeyCollision;
    document.body.append(target);
    await target.ready;
    const details: string[] = [];
    target.addEventListener('a_b', (event) => details.push(`a_b:${(event as CustomEvent).detail}`));
    target.addEventListener('a', (event) => details.push(`a:${(event as CustomEvent).detail}`));

    vi.useFakeTimers();
    target.c(1);
    target.b_c(2);
    await vi.advanceTimersByTimeAsync(20);
    expect(details.sort()).toEqual(['a:2', 'a_b:1']);
  });

  it('drops debounced dispatch work invoked inside @dispose', async () => {
    let releaseDispose!: () => void;
    const disposeGate = new Promise<void>((resolve) => { releaseDispose = resolve; });

    @element('timing-dispose-dispatch')
    class TimingDisposeDispatch extends HTMLElement {
      @dispatch('disposed-value', { debounce: 30 })
      emitDisposed() { return 'disposed'; }

      @dispose()
      async disposeWork() {
        this.emitDisposed();
        await disposeGate;
      }
    }

    const target = document.createElement('timing-dispose-dispatch') as TimingDisposeDispatch;
    document.body.append(target);
    await target.ready;
    const listener = vi.fn();
    target.addEventListener('disposed-value', listener);

    vi.useFakeTimers();
    target.remove();
    await vi.advanceTimersByTimeAsync(60);
    expect(listener).not.toHaveBeenCalled();
    releaseDispose();
    await Promise.resolve();
    await vi.runAllTimersAsync();
    expect(listener).not.toHaveBeenCalled();
  });

  it('drops debounced dispatch work invoked inside the original disconnectedCallback', async () => {
    @element('timing-native-disconnect-dispatch')
    class TimingNativeDisconnectDispatch extends HTMLElement {
      @dispatch('disconnected-value', { debounce: 30 })
      emitDisconnected() { return 'disconnected'; }

      disconnectedCallback() {
        this.emitDisconnected();
      }
    }

    const target = document.createElement('timing-native-disconnect-dispatch') as TimingNativeDisconnectDispatch;
    document.body.append(target);
    await target.ready;
    const listener = vi.fn();
    target.addEventListener('disconnected-value', listener);

    vi.useFakeTimers();
    target.remove();
    await vi.advanceTimersByTimeAsync(60);
    expect(listener).not.toHaveBeenCalled();
  });

  it('preserves new-generation dispatch work across an immediate reconnect', async () => {
    let releaseDispose!: () => void;
    const disposeGate = new Promise<void>((resolve) => { releaseDispose = resolve; });

    @element('timing-reconnect-generation')
    class TimingReconnectGeneration extends HTMLElement {
      @dispatch('generation-value', { debounce: 50 })
      emit(value: string) { return value; }

      @dispose()
      async disposeWork() {
        this.emit('old-dispose');
        await disposeGate;
      }
    }

    const target = document.createElement('timing-reconnect-generation') as TimingReconnectGeneration;
    document.body.append(target);
    await target.ready;
    const details: string[] = [];
    target.addEventListener('generation-value', (event) => details.push((event as CustomEvent).detail));

    vi.useFakeTimers();
    target.remove();
    document.body.append(target);
    target.emit('new-connect');
    releaseDispose();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(50);
    expect(details).toEqual(['new-connect']);
  });

  it('does not let an old async @dispose continuation supersede reconnected dispatch work', async () => {
    let releaseDispose!: () => void;
    const disposeGate = new Promise<void>((resolve) => { releaseDispose = resolve; });

    @element('timing-late-dispose-generation')
    class TimingLateDisposeGeneration extends HTMLElement {
      @dispatch('late-dispose-value', { debounce: 50 })
      emit(value: string) { return value; }

      @dispose()
      async disposeWork() {
        await disposeGate;
        this.emit('old-dispose');
      }
    }

    const target = document.createElement('timing-late-dispose-generation') as TimingLateDisposeGeneration;
    document.body.append(target);
    await target.ready;
    const details: string[] = [];
    target.addEventListener('late-dispose-value', (event) => details.push((event as CustomEvent).detail));

    vi.useFakeTimers();
    target.remove();
    document.body.append(target);
    target.emit('new-connect');
    releaseDispose();
    await Promise.resolve();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(50);
    expect(details).toEqual(['new-connect']);
  });

  it('does not let a delayed original disconnectedCallback supersede reconnected dispatch work', async () => {
    let releaseDispose!: () => void;
    const disposeGate = new Promise<void>((resolve) => { releaseDispose = resolve; });

    @element('timing-late-native-generation')
    class TimingLateNativeGeneration extends HTMLElement {
      @dispatch('late-native-value', { debounce: 50 })
      emit(value: string) { return value; }

      @dispose()
      async disposeWork() {
        await disposeGate;
      }

      disconnectedCallback() {
        this.emit('old-native');
      }
    }

    const target = document.createElement('timing-late-native-generation') as TimingLateNativeGeneration;
    document.body.append(target);
    await target.ready;
    const details: string[] = [];
    target.addEventListener('late-native-value', (event) => details.push((event as CustomEvent).detail));

    vi.useFakeTimers();
    target.remove();
    document.body.append(target);
    target.emit('new-connect');
    releaseDispose();
    await Promise.resolve();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(50);
    expect(details).toEqual(['new-connect']);
  });

  it('keeps each reconnect generation isolated across repeated async teardowns', async () => {
    const releases: Array<() => void> = [];

    @element('timing-repeated-generation')
    class TimingRepeatedGeneration extends HTMLElement {
      disconnect = 0;

      @dispatch('repeated-generation-value', { debounce: 40 })
      emit(value: string) { return value; }

      @dispose()
      async disposeWork() {
        const disconnect = ++this.disconnect;
        await new Promise<void>((resolve) => { releases.push(resolve); });
        this.emit(`old-${disconnect}`);
      }
    }

    const target = document.createElement('timing-repeated-generation') as TimingRepeatedGeneration;
    document.body.append(target);
    await target.ready;
    const details: string[] = [];
    target.addEventListener('repeated-generation-value', (event) => details.push((event as CustomEvent).detail));
    vi.useFakeTimers();

    for (const cycle of [1, 2]) {
      target.remove();
      document.body.append(target);
      target.emit(`new-${cycle}`);
      releases.shift()!();
      await Promise.resolve();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(40);
    }

    expect(details).toEqual(['new-1', 'new-2']);
  });
});
