/**
 * Tests for the `scope` option on @dispatch.
 *
 * Covers every shape of OnScope (mirrored from @on):
 *   - omitted              → host element (default)
 *   - 'global'             → document
 *   - selector string      → host.closest(selector)
 *   - Element/EventTarget  → that target directly
 *   - resolver function    → called with host as `this`
 *
 * Plus: warn when scope cannot resolve (event not dispatched),
 * dispatch detail still flows correctly through the scoped target,
 * @on with same scope receives the event end-to-end.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, render, html, on, dispatch } from '../src/index';

describe('@dispatch scope option', () => {
  let container: HTMLDivElement;
  let counter = 0;
  const tag = (base: string) => `${base}-${++counter}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // ────────────────────────────────────────────────────────────
  // Default — host
  // ────────────────────────────────────────────────────────────
  it('default: omitted scope dispatches on host element', async () => {
    const seen: string[] = [];
    const t = tag('disp-default');

    @element(t)
    class C extends HTMLElement {
      @dispatch('go')
      fire(val: string) { return val; }
    }

    const el = document.createElement(t) as any;
    container.appendChild(el);
    await el.ready;

    el.addEventListener('go', (e: CustomEvent) => seen.push(e.detail));
    el.fire('A');
    expect(seen).toEqual(['A']);
  });

  // ────────────────────────────────────────────────────────────
  // 'global' — dispatches on document
  // ────────────────────────────────────────────────────────────
  it("scope: 'global' dispatches on document", async () => {
    const seen: string[] = [];
    const t = tag('disp-global');

    @element(t)
    class C extends HTMLElement {
      @dispatch('bus:save', { scope: 'global' })
      save(val: string) { return val; }
    }

    const el = document.createElement(t) as any;
    container.appendChild(el);
    await el.ready;

    document.addEventListener('bus:save', (e: any) => seen.push(e.detail));

    // Host listener must NOT receive — event was dispatched on document.
    el.addEventListener('bus:save', () => seen.push('HOST'));

    el.save('payload');
    expect(seen).toEqual(['payload']);
  });

  // ────────────────────────────────────────────────────────────
  // Selector string — closest ancestor
  // ────────────────────────────────────────────────────────────
  it('scope: selector string dispatches on nearest matching ancestor', async () => {
    const seen: string[] = [];
    const t = tag('disp-ancestor');

    @element(t)
    class C extends HTMLElement {
      @dispatch('bus:cart-added', { scope: 'cart-shell' })
      add(id: number) { return { id }; }
    }

    const shell = document.createElement('cart-shell');
    const el = document.createElement(t) as any;
    shell.appendChild(el);
    container.appendChild(shell);
    await el.ready;

    shell.addEventListener('bus:cart-added', (e: any) => seen.push(`shell:${e.detail.id}`));
    document.addEventListener('bus:cart-added', (e: any) => seen.push(`doc:${e.detail.id}`));

    el.add(42);

    // Dispatched on shell — bubbles to document because CustomEvent has bubbles: true.
    expect(seen).toContain('shell:42');
    expect(seen).toContain('doc:42');
  });

  it('scope: selector string with no matching ancestor warns and does not dispatch', async () => {
    const seen: string[] = [];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = tag('disp-miss');

    @element(t)
    class C extends HTMLElement {
      @dispatch('miss', { scope: 'no-such-ancestor' })
      fire() { return 1; }
    }

    const el = document.createElement(t) as any;
    container.appendChild(el);
    await el.ready;

    document.addEventListener('miss', () => seen.push('DOC'));
    el.addEventListener('miss', () => seen.push('HOST'));

    el.fire();
    expect(warn).toHaveBeenCalled();
    expect(String(warn.mock.calls[0][0])).toContain('scope did not resolve');
    expect(seen).toEqual([]);
  });

  // ────────────────────────────────────────────────────────────
  // Direct EventTarget
  // ────────────────────────────────────────────────────────────
  it('scope: EventTarget instance dispatches on that target', async () => {
    const seen: string[] = [];
    const t = tag('disp-direct');
    const side = document.createElement('div');
    container.appendChild(side);

    @element(t)
    class C extends HTMLElement {
      target: any = null;
      @dispatch('go', { scope: side })
      fire() { return 'p'; }
    }

    const el = document.createElement(t) as any;
    container.appendChild(el);
    await el.ready;

    side.addEventListener('go', (e: any) => seen.push(`side:${e.detail}`));
    el.addEventListener('go', () => seen.push('HOST'));

    el.fire();
    expect(seen).toContain('side:p');
    expect(seen).not.toContain('HOST');
  });

  // ────────────────────────────────────────────────────────────
  // Resolver function
  // ────────────────────────────────────────────────────────────
  it('scope: resolver function receives host as `this`', async () => {
    const seen: string[] = [];
    let resolvedHost: any = null;
    const t = tag('disp-resolver');

    @element(t)
    class C extends HTMLElement {
      @dispatch('beep', {
        scope(this: HTMLElement) {
          resolvedHost = this;
          return this.parentElement;
        },
      })
      fire() { return 'r'; }
    }

    const el = document.createElement(t) as any;
    container.appendChild(el);
    await el.ready;

    container.addEventListener('beep', (e: any) => seen.push(e.detail));
    el.fire();

    expect(resolvedHost).toBe(el);
    expect(seen).toEqual(['r']);
  });

  it('scope: resolver returning null warns and does not dispatch', async () => {
    const seen: number[] = [];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = tag('disp-null');

    @element(t)
    class C extends HTMLElement {
      @dispatch('x', { scope: () => null })
      fire() { return 1; }
    }

    const el = document.createElement(t) as any;
    container.appendChild(el);
    await el.ready;

    document.addEventListener('x', () => seen.push(1));
    el.fire();
    expect(warn).toHaveBeenCalled();
    expect(seen).toEqual([]);
  });

  // ────────────────────────────────────────────────────────────
  // End-to-end: @dispatch global ↔ @on global
  // ────────────────────────────────────────────────────────────
  it('end-to-end: @dispatch global → @on global delivers event', async () => {
    const seen: { from: string; payload: any }[] = [];
    const emitterTag = tag('disp-emitter');
    const listenerTag = tag('disp-listener');

    @element(emitterTag)
    class E extends HTMLElement {
      @dispatch('bus:hello', { scope: 'global' })
      hi(payload: any) { return payload; }
    }

    @element(listenerTag)
    class L extends HTMLElement {
      @on('bus:hello', { scope: 'global' })
      heard(e: CustomEvent) { seen.push({ from: 'L', payload: e.detail }); }
    }

    const e = document.createElement(emitterTag) as any;
    const l = document.createElement(listenerTag) as any;
    container.appendChild(e);
    container.appendChild(l);
    await e.ready;
    await l.ready;

    e.hi({ msg: 'hi' });
    expect(seen).toEqual([{ from: 'L', payload: { msg: 'hi' } }]);
  });

  // ────────────────────────────────────────────────────────────
  // End-to-end: ancestor scope
  // ────────────────────────────────────────────────────────────
  it('end-to-end: @dispatch on ancestor → @on on ancestor delivers event', async () => {
    const seen: number[] = [];
    const emitterTag = tag('disp-anc-emit');
    const listenerTag = tag('disp-anc-listen');

    @element(emitterTag)
    class E extends HTMLElement {
      @dispatch('bus:item-added', { scope: 'cart-shell' })
      add(id: number) { return { id }; }
    }

    @element(listenerTag)
    class L extends HTMLElement {
      @on('bus:item-added', { scope: 'cart-shell' })
      h(e: CustomEvent) { seen.push(e.detail.id); }
    }

    const shell = document.createElement('cart-shell');
    const e = document.createElement(emitterTag) as any;
    const l = document.createElement(listenerTag) as any;
    shell.appendChild(e);
    shell.appendChild(l);
    container.appendChild(shell);
    await e.ready;
    await l.ready;

    e.add(7);
    expect(seen).toEqual([7]);
  });

  // ────────────────────────────────────────────────────────────
  // Two ancestors: events do not leak across shells
  // ────────────────────────────────────────────────────────────
  it('ancestor scope: events do not leak across two separate ancestor scopes', async () => {
    const seen: { who: string; id: number }[] = [];
    const emitterTag = tag('disp-anc-iso-emit');
    const listenerTag = tag('disp-anc-iso-listen');

    @element(emitterTag)
    class E extends HTMLElement {
      @dispatch('bus:x', { scope: 'cart-shell' })
      fire(id: number) { return { id }; }
    }

    @element(listenerTag)
    class L extends HTMLElement {
      who = '';
      @on('bus:x', { scope: 'cart-shell' })
      h(e: CustomEvent) { seen.push({ who: this.who, id: e.detail.id }); }
    }

    // Build TWO separate cart-shell trees.
    const shellA = document.createElement('cart-shell');
    const shellB = document.createElement('cart-shell');
    const eA = document.createElement(emitterTag) as any;
    const lA = document.createElement(listenerTag) as any;
    const eB = document.createElement(emitterTag) as any;
    const lB = document.createElement(listenerTag) as any;
    lA.who = 'A';
    lB.who = 'B';
    shellA.append(eA, lA);
    shellB.append(eB, lB);
    container.append(shellA, shellB);
    await eA.ready; await lA.ready; await eB.ready; await lB.ready;

    eA.fire(1);
    eB.fire(2);
    // A's emit should only reach A's listener; B's only B's.
    expect(seen).toEqual([{ who: 'A', id: 1 }, { who: 'B', id: 2 }]);
  });
});
