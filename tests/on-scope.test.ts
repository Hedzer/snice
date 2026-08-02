/**
 * Tests for the `scope` option on @on.
 *
 * Covers every shape of OnScope:
 *   - omitted              → host element (default)
 *   - 'global'             → document
 *   - selector string      → host.closest(selector)
 *   - Element/EventTarget  → that target directly
 *   - resolver function    → called with host as `this`
 *
 * Plus: dev warn when scope cannot resolve, cleanup on disconnect,
 * fresh resolution on reconnect, scope + delegation selector interaction,
 * leakage across separate elements.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, property, render, html, on } from '../packages/core/src/index';

async function settle() {
  await new Promise((r) => queueMicrotask(r));
}

describe('@on scope option', () => {
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
  // Default (omitted) — host element
  // ────────────────────────────────────────────────────────────
  it('default: omitted scope attaches to host element', async () => {
    const seen: string[] = [];
    const t = tag('scope-default');

    @element(t)
    class C extends HTMLElement {
      @on('ping')
      h(e: CustomEvent) { seen.push(e.detail); }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    el.dispatchEvent(new CustomEvent('ping', { detail: 'host' }));
    expect(seen).toEqual(['host']);

    // Should NOT receive events dispatched on document.
    document.dispatchEvent(new CustomEvent('ping', { detail: 'doc' }));
    expect(seen).toEqual(['host']);
  });

  // ────────────────────────────────────────────────────────────
  // 'global' — document
  // ────────────────────────────────────────────────────────────
  it("scope: 'global' attaches listener on document", async () => {
    const seen: string[] = [];
    const t = tag('scope-global');

    @element(t)
    class C extends HTMLElement {
      @on('bus:save', { scope: 'global' })
      h(e: CustomEvent) { seen.push(e.detail); }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    document.dispatchEvent(new CustomEvent('bus:save', { detail: 'doc-fire' }));
    expect(seen).toEqual(['doc-fire']);

    // Events on host should NOT trigger when scope=global.
    el.dispatchEvent(new CustomEvent('bus:save', { detail: 'host-fire', bubbles: false }));
    expect(seen).toEqual(['doc-fire']);
  });

  it("scope: 'global' listener is removed on disconnect", async () => {
    const seen: number[] = [];
    const t = tag('scope-global-cleanup');

    @element(t)
    class C extends HTMLElement {
      @on('bus:x', { scope: 'global' })
      h() { seen.push(1); }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    document.dispatchEvent(new CustomEvent('bus:x'));
    expect(seen.length).toBe(1);

    el.remove();
    await settle();

    document.dispatchEvent(new CustomEvent('bus:x'));
    expect(seen.length).toBe(1); // no leak
  });

  // ────────────────────────────────────────────────────────────
  // Selector string — closest ancestor
  // ────────────────────────────────────────────────────────────
  it('scope: selector string attaches to nearest matching ancestor', async () => {
    const seen: string[] = [];
    const t = tag('scope-ancestor');

    @element(t)
    class C extends HTMLElement {
      @on('bus:cart-added', { scope: 'cart-shell' })
      h(e: CustomEvent) { seen.push(e.detail); }
    }

    // Build: container > cart-shell > scope-ancestor-N
    const shell = document.createElement('cart-shell');
    const el = document.createElement(t);
    shell.appendChild(el);
    container.appendChild(shell);
    await (el as any).ready;

    // Event on the shell — should fire.
    shell.dispatchEvent(new CustomEvent('bus:cart-added', { detail: 'shell' }));
    expect(seen).toEqual(['shell']);

    // Event on document — should NOT fire.
    document.dispatchEvent(new CustomEvent('bus:cart-added', { detail: 'doc' }));
    expect(seen).toEqual(['shell']);
  });

  it('scope: sibling scope roots isolate their own traffic', async () => {
    // The property that makes a scoped bus worth using: a second <cart-shell>
    // elsewhere on the page must not hear the first one's messages.
    const seenA: string[] = [];
    const seenB: string[] = [];
    const tA = tag('scope-iso-a');
    const tB = tag('scope-iso-b');

    @element(tA)
    class A extends HTMLElement {
      @on('bus:cart-added', { scope: 'cart-shell' })
      h(e: CustomEvent) { seenA.push(e.detail); }
    }

    @element(tB)
    class B extends HTMLElement {
      @on('bus:cart-added', { scope: 'cart-shell' })
      h(e: CustomEvent) { seenB.push(e.detail); }
    }

    const shellA = document.createElement('cart-shell');
    const shellB = document.createElement('cart-shell');
    const a = document.createElement(tA);
    const b = document.createElement(tB);
    shellA.appendChild(a);
    shellB.appendChild(b);
    container.appendChild(shellA);
    container.appendChild(shellB);
    await (a as any).ready;
    await (b as any).ready;

    // Published inside shell A: bubbles a -> shellA -> container, never through shellB.
    a.dispatchEvent(new CustomEvent('bus:cart-added', {
      detail: 'from-a', bubbles: true, composed: true,
    }));

    expect(seenA).toEqual(['from-a']);
    expect(seenB).toEqual([]);
  });

  it('scope: selector string with no matching ancestor warns and skips', async () => {
    const seen: number[] = [];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = tag('scope-missing');

    @element(t)
    class C extends HTMLElement {
      @on('foo', { scope: 'missing-ancestor' })
      h() { seen.push(1); }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    expect(warn).toHaveBeenCalled();
    const msg = String(warn.mock.calls[0][0]);
    expect(msg).toContain('scope did not resolve');

    // No listener got installed.
    container.dispatchEvent(new CustomEvent('foo'));
    document.dispatchEvent(new CustomEvent('foo'));
    expect(seen).toEqual([]);
  });

  // ────────────────────────────────────────────────────────────
  // Direct EventTarget instance
  // ────────────────────────────────────────────────────────────
  it('scope: EventTarget instance attaches to that target', async () => {
    const seen: string[] = [];
    const t = tag('scope-instance');
    const sideTarget = document.createElement('div');
    container.appendChild(sideTarget);

    @element(t)
    class C extends HTMLElement {
      @on('go', { scope: sideTarget })
      h(e: CustomEvent) { seen.push(e.detail); }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    sideTarget.dispatchEvent(new CustomEvent('go', { detail: 'side' }));
    expect(seen).toEqual(['side']);

    el.dispatchEvent(new CustomEvent('go', { detail: 'host' }));
    expect(seen).toEqual(['side']);
  });

  // ────────────────────────────────────────────────────────────
  // Resolver function
  // ────────────────────────────────────────────────────────────
  it('scope: resolver function is called with host as `this`', async () => {
    const seen: string[] = [];
    const t = tag('scope-resolver');
    let resolvedHost: any = null;

    @element(t)
    class C extends HTMLElement {
      @on('hit', {
        scope(this: HTMLElement) {
          resolvedHost = this;
          return this.parentElement;
        },
      })
      h(e: CustomEvent) { seen.push(e.detail); }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    expect(resolvedHost).toBe(el);

    container.dispatchEvent(new CustomEvent('hit', { detail: 'parent' }));
    expect(seen).toEqual(['parent']);
  });

  it('scope: resolver returning null warns and skips', async () => {
    const seen: number[] = [];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = tag('scope-null');

    @element(t)
    class C extends HTMLElement {
      @on('hit', { scope: () => null })
      h() { seen.push(1); }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    expect(warn).toHaveBeenCalled();
    document.dispatchEvent(new CustomEvent('hit'));
    expect(seen).toEqual([]);
  });

  it('scope: resolver that throws warns and skips', async () => {
    const seen: number[] = [];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const t = tag('scope-throw');

    @element(t)
    class C extends HTMLElement {
      @on('hit', { scope: () => { throw new Error('boom'); } })
      h() { seen.push(1); }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    expect(warn).toHaveBeenCalled();
    expect(seen).toEqual([]);
  });

  // ────────────────────────────────────────────────────────────
  // Reconnect: resolver fires again on next connect
  // ────────────────────────────────────────────────────────────
  it('scope: reconnect re-resolves the target', async () => {
    const seen: string[] = [];
    const calls: HTMLElement[] = [];
    const t = tag('scope-reconnect');

    @element(t)
    class C extends HTMLElement {
      @on('beep', {
        scope(this: HTMLElement) {
          calls.push(this.parentElement!);
          return this.parentElement;
        },
      })
      h(e: CustomEvent) { seen.push(e.detail); }
    }

    const parent1 = document.createElement('div');
    parent1.id = 'p1';
    container.appendChild(parent1);

    const el = document.createElement(t);
    parent1.appendChild(el);
    await (el as any).ready;

    parent1.dispatchEvent(new CustomEvent('beep', { detail: 'p1' }));
    expect(seen).toEqual(['p1']);
    expect(calls.length).toBe(1);

    // Move element to a new parent. Explicit remove + append so both
    // disconnectedCallback and connectedCallback fire on the host.
    const parent2 = document.createElement('div');
    parent2.id = 'p2';
    container.appendChild(parent2);
    el.remove();
    await settle();
    parent2.appendChild(el);
    await settle();

    parent2.dispatchEvent(new CustomEvent('beep', { detail: 'p2' }));
    expect(seen).toContain('p2');
    expect(calls.length).toBeGreaterThanOrEqual(2);

    // Old parent must no longer trigger the handler.
    const before = seen.length;
    parent1.dispatchEvent(new CustomEvent('beep', { detail: 'old' }));
    expect(seen.length).toBe(before);
  });

  // ────────────────────────────────────────────────────────────
  // Scope + delegation selector
  // ────────────────────────────────────────────────────────────
  it('scope + delegation: listener attaches to scope, matches selector', async () => {
    const seen: string[] = [];
    const t = tag('scope-delegate');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.btn', { scope: 'global' })
      h(e: MouseEvent) { seen.push((e.target as HTMLElement).className); }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    // Inject a button anywhere in the document and click it.
    const btn = document.createElement('span');
    btn.className = 'btn';
    container.appendChild(btn);
    btn.click();
    await settle();

    expect(seen).toEqual(['btn']);

    // Non-matching target does nothing.
    const other = document.createElement('span');
    other.className = 'other';
    container.appendChild(other);
    other.click();
    await settle();

    expect(seen).toEqual(['btn']);
  });

  // ────────────────────────────────────────────────────────────
  // Two separate hosts, same global event — both fire
  // ────────────────────────────────────────────────────────────
  it("scope: 'global' delivers same event to multiple components", async () => {
    const seen: string[] = [];
    const t = tag('scope-multi');

    @element(t)
    class C extends HTMLElement {
      @property() id = '';
      @on('bus:ping', { scope: 'global' })
      h() { seen.push(this.id); }
    }

    const a = document.createElement(t) as any;
    a.id = 'A';
    const b = document.createElement(t) as any;
    b.id = 'B';
    container.appendChild(a);
    container.appendChild(b);
    await a.ready;
    await b.ready;

    document.dispatchEvent(new CustomEvent('bus:ping'));
    expect(seen.sort()).toEqual(['A', 'B']);
  });

  // ────────────────────────────────────────────────────────────
  // Removing one component leaves other's global listener intact
  // ────────────────────────────────────────────────────────────
  it("scope: 'global' cleanup per-instance does not affect siblings", async () => {
    const seen: string[] = [];
    const t = tag('scope-sibling-cleanup');

    @element(t)
    class C extends HTMLElement {
      @property() id = '';
      @on('bus:fire', { scope: 'global' })
      h() { seen.push(this.id); }
    }

    const a = document.createElement(t) as any;
    a.id = 'A';
    const b = document.createElement(t) as any;
    b.id = 'B';
    container.appendChild(a);
    container.appendChild(b);
    await a.ready;
    await b.ready;

    a.remove();
    await settle();

    document.dispatchEvent(new CustomEvent('bus:fire'));
    expect(seen).toEqual(['B']);
  });
});
