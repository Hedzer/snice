/**
 * Field report FR5 (reported against 7.5.0, verified here against current source).
 *
 * Claim: two stacked @on decorators on one method, where one carries
 * { debounce: 300 }, result in NEITHER event firing the handler. Un-stacked,
 * debounce works.
 *
 * These tests assert CORRECT behavior: every stacked registration must fire.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, on, render, html } from '../packages/core/src/index';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('FR5 — stacked @on decorators with debounce/throttle', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  // --- Report's exact repro: debounce on top, plain below, different events ---
  it('fires both stacked handlers when the FIRST decorator has debounce (exact repro)', async () => {
    @element('fr5-debounce-then-plain')
    class Fr5DebounceThenPlain extends HTMLElement {
      calls: string[] = [];

      @on('input', { debounce: 300 })
      @on('click')
      handleEither(event: Event) {
        this.calls.push(event.type);
      }

      @render()
      renderContent() {
        return html`<div>content</div>`;
      }
    }

    const el = document.createElement('fr5-debounce-then-plain') as Fr5DebounceThenPlain;
    document.body.appendChild(el);
    await (el as any).ready;

    el.dispatchEvent(new Event('click', { bubbles: true }));
    expect(el.calls).toEqual(['click']);

    el.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);

    expect(el.calls.sort()).toEqual(['click', 'input']);
  });

  // --- Reversed order: plain on top, debounce below ---
  it('fires both stacked handlers when the SECOND decorator has debounce', async () => {
    @element('fr5-plain-then-debounce')
    class Fr5PlainThenDebounce extends HTMLElement {
      calls: string[] = [];

      @on('click')
      @on('input', { debounce: 300 })
      handleEither(event: Event) {
        this.calls.push(event.type);
      }

      @render()
      renderContent() {
        return html`<div>content</div>`;
      }
    }

    const el = document.createElement('fr5-plain-then-debounce') as Fr5PlainThenDebounce;
    document.body.appendChild(el);
    await (el as any).ready;

    el.dispatchEvent(new Event('click', { bubbles: true }));
    expect(el.calls).toEqual(['click']);

    el.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);

    expect(el.calls.sort()).toEqual(['click', 'input']);
  });

  // --- Throttle + plain ---
  it('fires both stacked handlers when one decorator has throttle', async () => {
    @element('fr5-throttle-then-plain')
    class Fr5ThrottleThenPlain extends HTMLElement {
      calls: string[] = [];

      @on('scroll', { throttle: 100 })
      @on('click')
      handleEither(event: Event) {
        this.calls.push(event.type);
      }

      @render()
      renderContent() {
        return html`<div>content</div>`;
      }
    }

    const el = document.createElement('fr5-throttle-then-plain') as Fr5ThrottleThenPlain;
    document.body.appendChild(el);
    await (el as any).ready;

    el.dispatchEvent(new Event('click', { bubbles: true }));
    el.dispatchEvent(new Event('scroll', { bubbles: true }));
    await flush();

    expect(el.calls.sort()).toEqual(['click', 'scroll']);
  });

  // --- Both debounced, different events ---
  it('fires both stacked handlers when BOTH decorators are debounced', async () => {
    @element('fr5-both-debounced')
    class Fr5BothDebounced extends HTMLElement {
      calls: string[] = [];

      @on('input', { debounce: 300 })
      @on('change', { debounce: 300 })
      handleEither(event: Event) {
        this.calls.push(event.type);
      }

      @render()
      renderContent() {
        return html`<div>content</div>`;
      }
    }

    const el = document.createElement('fr5-both-debounced') as Fr5BothDebounced;
    document.body.appendChild(el);
    await (el as any).ready;

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);

    expect(el.calls.sort()).toEqual(['change', 'input']);
  });

  // --- Stacked with delegation selectors ---
  it('fires both stacked delegated handlers when one has debounce', async () => {
    @element('fr5-selectors-debounce')
    class Fr5SelectorsDebounce extends HTMLElement {
      calls: string[] = [];

      @on('input', '.search', { debounce: 300 })
      @on('click', '.btn')
      handleEither(event: Event) {
        this.calls.push(event.type);
      }

      @render()
      renderContent() {
        return html`
          <button class="btn">go</button>
          <input class="search">
        `;
      }
    }

    const el = document.createElement('fr5-selectors-debounce') as Fr5SelectorsDebounce;
    document.body.appendChild(el);
    await (el as any).ready;

    const root = (el.shadowRoot ?? el) as ParentNode;
    root.querySelector<HTMLElement>('.btn')!.dispatchEvent(new Event('click', { bubbles: true, composed: true }));
    expect(el.calls).toEqual(['click']);

    root.querySelector<HTMLElement>('.search')!.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await vi.advanceTimersByTimeAsync(400);

    expect(el.calls.sort()).toEqual(['click', 'input']);
  });

  // --- Same event name, different selectors, one debounced (dedup-key probe) ---
  // FR5: registration identity omits debounce/throttle, so a stacked pair that
  // differs ONLY by timing options collapses to a single registration.
  it('fires both stacked handlers on the SAME event when only the timing option differs — FR5', async () => {
    @element('fr5-same-event-timing-only')
    class Fr5SameEventTimingOnly extends HTMLElement {
      calls: string[] = [];

      @on('click', { debounce: 300 })
      @on('click')
      handleEither(event: Event) {
        this.calls.push(`${event.type}:${this.calls.length}`);
      }

      @render()
      renderContent() {
        return html`<div>content</div>`;
      }
    }

    const el = document.createElement('fr5-same-event-timing-only') as Fr5SameEventTimingOnly;
    document.body.appendChild(el);
    await (el as any).ready;

    el.dispatchEvent(new Event('click', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);

    // One immediate call from the plain registration, one debounced call.
    expect(el.calls.length).toBe(2);
  });

  // FR5: the surviving registration is order-dependent. With the PLAIN
  // decorator on top, the plain registration is the one that gets dropped, so
  // the handler never runs synchronously — the reported "nothing fires" shape.
  it('runs the plain stacked registration immediately when a debounced one sits below it — FR5', async () => {
    @element('fr5-plain-top-debounce-bottom')
    class Fr5PlainTopDebounceBottom extends HTMLElement {
      calls: string[] = [];

      @on('click')
      @on('click', { debounce: 300 })
      handleEither(event: Event) {
        this.calls.push(event.type);
      }

      @render()
      renderContent() {
        return html`<div>content</div>`;
      }
    }

    const el = document.createElement('fr5-plain-top-debounce-bottom') as Fr5PlainTopDebounceBottom;
    document.body.appendChild(el);
    await (el as any).ready;

    el.dispatchEvent(new Event('click', { bubbles: true }));

    // The undebounced registration must fire on dispatch, not 300ms later.
    expect(el.calls).toEqual(['click']);
  });

  // --- Control: un-stacked debounce works ---
  it('fires a single un-stacked debounced handler', async () => {
    @element('fr5-unstacked-debounce')
    class Fr5UnstackedDebounce extends HTMLElement {
      calls: string[] = [];

      @on('input', { debounce: 300 })
      handleInput(event: Event) {
        this.calls.push(event.type);
      }

      @render()
      renderContent() {
        return html`<div>content</div>`;
      }
    }

    const el = document.createElement('fr5-unstacked-debounce') as Fr5UnstackedDebounce;
    document.body.appendChild(el);
    await (el as any).ready;

    el.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.calls).toEqual([]);
    await vi.advanceTimersByTimeAsync(400);
    expect(el.calls).toEqual(['input']);
  });

  // --- Reconnect: debounced stacked pair must survive disconnect/reconnect ---
  it('fires both stacked handlers after disconnect and reconnect', async () => {
    @element('fr5-reconnect-debounce')
    class Fr5ReconnectDebounce extends HTMLElement {
      calls: string[] = [];

      @on('input', { debounce: 300 })
      @on('click')
      handleEither(event: Event) {
        this.calls.push(event.type);
      }

      @render()
      renderContent() {
        return html`<div>content</div>`;
      }
    }

    const el = document.createElement('fr5-reconnect-debounce') as Fr5ReconnectDebounce;
    document.body.appendChild(el);
    await (el as any).ready;

    el.remove();
    document.body.appendChild(el);
    await (el as any).ready;
    await flush();

    el.dispatchEvent(new Event('click', { bubbles: true }));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);

    expect(el.calls.sort()).toEqual(['click', 'input']);
  });

  // --- Second instance of the same class ---
  it('fires both stacked handlers on a SECOND instance of the same class', async () => {
    @element('fr5-second-instance')
    class Fr5SecondInstance extends HTMLElement {
      calls: string[] = [];

      @on('input', { debounce: 300 })
      @on('click')
      handleEither(event: Event) {
        this.calls.push(event.type);
      }

      @render()
      renderContent() {
        return html`<div>content</div>`;
      }
    }

    const first = document.createElement('fr5-second-instance') as Fr5SecondInstance;
    const second = document.createElement('fr5-second-instance') as Fr5SecondInstance;
    document.body.append(first, second);
    await (first as any).ready;
    await (second as any).ready;

    second.dispatchEvent(new Event('click', { bubbles: true }));
    second.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(400);

    expect(second.calls.sort()).toEqual(['click', 'input']);
    expect(first.calls).toEqual([]);
  });

  // --- Guard: fixing FR5 must not make registration identity so unique that
  // a subclass re-declaring an identically decorated method registers twice.
  it('does not double-register when a subclass re-declares an identically decorated method', async () => {
    class Fr5Base extends HTMLElement {
      calls: string[] = [];

      @on('click')
      handleClick() {
        this.calls.push('base');
      }

      @render()
      renderContent() {
        return html`<div>content</div>`;
      }
    }

    @element('fr5-subclass-redeclare')
    class Fr5Child extends Fr5Base {
      @on('click')
      handleClick() {
        this.calls.push('child');
      }
    }

    const el = document.createElement('fr5-subclass-redeclare') as Fr5Child;
    document.body.appendChild(el);
    await (el as any).ready;

    el.dispatchEvent(new Event('click', { bubbles: true }));
    expect(el.calls).toEqual(['child']);
  });

  // --- Guard: one @on(...) decorator value applied to two methods of the same
  // class must register both, not collapse onto whichever ran first.
  it('registers both methods when one @on decorator value is applied twice', async () => {
    const onClick = on('click');

    @element('fr5-shared-decorator')
    class Fr5SharedDecorator extends HTMLElement {
      calls: string[] = [];

      @onClick
      first() {
        this.calls.push('first');
      }

      @onClick
      second() {
        this.calls.push('second');
      }

      @render()
      renderContent() {
        return html`<div>content</div>`;
      }
    }

    const el = document.createElement('fr5-shared-decorator') as Fr5SharedDecorator;
    document.body.appendChild(el);
    await (el as any).ready;

    el.dispatchEvent(new Event('click', { bubbles: true }));
    expect(el.calls.sort()).toEqual(['first', 'second']);
  });
});
