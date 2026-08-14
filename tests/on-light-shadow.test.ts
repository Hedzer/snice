/**
 * Tests for the `light`/`shadow` options on @on — the same tree-toggle pair
 * @query uses. They control which DOM tree a listener attaches to (direct
 * handlers) or matches in (delegated handlers). Both default to true.
 *
 *   - direct: shadow → the shadow root listener, light → the host listener
 *   - delegated: shadow → match in the shadow tree, light → match light-DOM
 *     children of the host
 *   - both false → warn, listener skipped
 *   - with scope/daemon the flags are ignored (warned) — scope owns attachment
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, render, html, on } from '../packages/core/src/index';

async function settle() {
  await new Promise((r) => queueMicrotask(r));
}

function click(el: Element) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

describe('@on light/shadow options', () => {
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

  async function mount(t: string) {
    const el = document.createElement(t);
    const lightChild = document.createElement('button');
    lightChild.className = 'light-child';
    el.appendChild(lightChild);
    container.appendChild(el);
    await (el as any).ready;
    return { el, lightChild, shadow: (el as any).shadowRoot as ShadowRoot };
  }

  // ────────────────────────────────────────────────────────────
  // Direct listeners
  // ────────────────────────────────────────────────────────────

  it('direct: default hears both shadow-tree and light-DOM events', async () => {
    const calls: number[] = [];
    const t = tag('on-tree-direct-default');

    @element(t)
    class C extends HTMLElement {
      @on('click')
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="inner">s</button>`; }
    }

    const { lightChild, shadow } = await mount(t);
    click(shadow.querySelector('.inner')!);
    await settle();
    expect(calls.length).toBe(1);

    click(lightChild);
    await settle();
    expect(calls.length).toBe(2);
  });

  it('direct: light:false does not hear light-DOM events', async () => {
    const calls: number[] = [];
    const t = tag('on-tree-direct-noleak');

    @element(t)
    class C extends HTMLElement {
      @on('click', { light: false })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="inner">s</button>`; }
    }

    const { lightChild, shadow } = await mount(t);
    click(shadow.querySelector('.inner')!);
    await settle();
    expect(calls.length).toBe(1);

    click(lightChild);
    await settle();
    expect(calls.length).toBe(1);
  });

  it('direct: light:false does not hear host-targeted events', async () => {
    const calls: number[] = [];
    const t = tag('on-tree-direct-nohost');

    @element(t)
    class C extends HTMLElement {
      @on('click', { light: false })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="inner">s</button>`; }
    }

    const { el } = await mount(t);
    click(el);
    await settle();
    expect(calls).toEqual([]);
  });

  it('direct: shadow:false still hears light-DOM and host events', async () => {
    const calls: number[] = [];
    const t = tag('on-tree-direct-lightonly');

    @element(t)
    class C extends HTMLElement {
      @on('click', { shadow: false })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="inner">s</button>`; }
    }

    const { el, lightChild } = await mount(t);
    click(lightChild);
    await settle();
    expect(calls.length).toBe(1);

    click(el);
    await settle();
    expect(calls.length).toBe(2);
  });

  it('direct: light:false and shadow:false warns and skips the listener', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const calls: number[] = [];
    const t = tag('on-tree-direct-none');

    @element(t)
    class C extends HTMLElement {
      @on('click', { light: false, shadow: false })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="inner">s</button>`; }
    }

    const { el, lightChild, shadow } = await mount(t);
    click(shadow.querySelector('.inner')!);
    click(lightChild);
    click(el);
    await settle();

    expect(calls).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('light'));
  });

  // ────────────────────────────────────────────────────────────
  // Delegated listeners
  // ────────────────────────────────────────────────────────────

  it('delegated: default matches in both trees', async () => {
    const calls: string[] = [];
    const t = tag('on-tree-delegated-default');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.hit')
      h(e: MouseEvent) { calls.push((e.target as HTMLElement).textContent ?? ''); }
      @render()
      renderContent() { return html`<button class="hit">shadow</button><button class="miss">m</button>`; }
    }

    const { el, shadow } = await mount(t);
    const lightHit = document.createElement('button');
    lightHit.className = 'hit';
    lightHit.textContent = 'light';
    el.appendChild(lightHit);

    click(shadow.querySelector('.hit')!);
    await settle();
    expect(calls).toEqual(['shadow']);

    click(lightHit);
    await settle();
    expect(calls).toEqual(['shadow', 'light']);

    click(shadow.querySelector('.miss')!);
    await settle();
    expect(calls).toEqual(['shadow', 'light']);
  });

  it('delegated: light:false does not match light-DOM children', async () => {
    const calls: number[] = [];
    const t = tag('on-tree-delegated-shadowonly');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.hit', { light: false })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="hit">s</button>`; }
    }

    const { el, shadow } = await mount(t);
    const lightHit = document.createElement('button');
    lightHit.className = 'hit';
    el.appendChild(lightHit);

    click(shadow.querySelector('.hit')!);
    await settle();
    expect(calls.length).toBe(1);

    click(lightHit);
    await settle();
    expect(calls.length).toBe(1);
  });

  it('delegated: shadow:false does not match in the shadow tree', async () => {
    const calls: number[] = [];
    const t = tag('on-tree-delegated-lightonly');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.hit', { shadow: false })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="hit">s</button>`; }
    }

    const { el, shadow } = await mount(t);
    const lightHit = document.createElement('button');
    lightHit.className = 'hit';
    el.appendChild(lightHit);

    click(lightHit);
    await settle();
    expect(calls.length).toBe(1);

    click(shadow.querySelector('.hit')!);
    await settle();
    expect(calls.length).toBe(1);
  });

  it('delegated: target option composes with light/shadow', async () => {
    const calls: number[] = [];
    const t = tag('on-tree-delegated-target');

    @element(t)
    class C extends HTMLElement {
      @on('click', { target: '.hit', light: false })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="hit">s</button>`; }
    }

    const { el, shadow } = await mount(t);
    const lightHit = document.createElement('button');
    lightHit.className = 'hit';
    el.appendChild(lightHit);

    click(shadow.querySelector('.hit')!);
    click(lightHit);
    await settle();
    expect(calls.length).toBe(1);
  });

  it('delegated: light-DOM component still delegates with default flags', async () => {
    const calls: number[] = [];
    const t = tag('on-tree-delegated-lightroot');

    @element(t, { renderRoot: 'light' })
    class C extends HTMLElement {
      @on('click', '.hit')
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="hit">s</button><button class="miss">m</button>`; }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    click(el.querySelector('.hit')!);
    await settle();
    expect(calls.length).toBe(1);

    click(el.querySelector('.miss')!);
    await settle();
    expect(calls.length).toBe(1);
  });

  it('delegated: both-tree listeners are removed on disconnect', async () => {
    const calls: number[] = [];
    const t = tag('on-tree-delegated-cleanup');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.hit')
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="hit">s</button>`; }
    }

    const { el, shadow } = await mount(t);
    const lightHit = document.createElement('button');
    lightHit.className = 'hit';
    el.appendChild(lightHit);

    const shadowHit = shadow.querySelector('.hit')!;
    click(shadowHit);
    click(lightHit);
    await settle();
    expect(calls.length).toBe(2);

    el.remove();
    await settle();

    click(shadowHit);
    click(lightHit);
    await settle();
    expect(calls.length).toBe(2); // no leak from either tree's listener
  });

  it('stacked @on registrations differing only by light/shadow both register', async () => {
    const calls: string[] = [];
    const t = tag('on-tree-stacked');

    @element(t)
    class C extends HTMLElement {
      @on('ping', { light: false })
      @on('ping', { shadow: false })
      h(e: CustomEvent) { calls.push(e.detail); }
      @render()
      renderContent() { return html`<button class="inner">s</button>`; }
    }

    const { lightChild, shadow } = await mount(t);
    // shadow-only registration hears this…
    shadow.querySelector('.inner')!.dispatchEvent(
      new CustomEvent('ping', { detail: 'shadow', bubbles: true, composed: true }));
    // …light-only registration hears this.
    lightChild.dispatchEvent(
      new CustomEvent('ping', { detail: 'light', bubbles: true, composed: true }));
    await settle();

    expect(calls).toContain('shadow');
    expect(calls).toContain('light');
  });

  // ────────────────────────────────────────────────────────────
  // Interaction with scope
  // ────────────────────────────────────────────────────────────

  it('scope: light/shadow flags are ignored with an explicit scope (warned)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const calls: number[] = [];
    const t = tag('on-tree-scope');

    @element(t)
    class C extends HTMLElement {
      @on('bus:x', { scope: 'global', light: false })
      h() { calls.push(1); }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    document.dispatchEvent(new CustomEvent('bus:x'));
    expect(calls.length).toBe(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('scope'));
  });
});
