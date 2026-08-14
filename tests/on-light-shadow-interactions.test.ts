/**
 * Interaction coverage for @on's light/shadow tree toggles against the rest of
 * the option surface — @on is core, so every combination that could misfire
 * gets a test:
 *
 *   - `once` must fire EXACTLY once: not once per tree listener, and a
 *     key-filtered `once` must not be consumed by a non-matching key.
 *   - debounce/throttle compose with the flags.
 *   - keyboard filters compose with delegation + flags.
 *   - event-name arrays compose with the flags.
 *   - controllers get identical flag semantics (no shadow root → light only).
 *   - reconnect re-attaches flagged listeners without duplication.
 *   - preventDefault/stopPropagation behave with multi-root delegation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, controller, on, render, html } from '../packages/core/src/index';

async function settle() {
  await new Promise((r) => queueMicrotask(r));
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function click(el: Element) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

function key(el: Element, k: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true }));
}

describe('@on light/shadow interactions', () => {
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
    lightChild.className = 'light-hit hit';
    el.appendChild(lightChild);
    container.appendChild(el);
    await (el as any).ready;
    return { el, lightChild, shadow: (el as any).shadowRoot as ShadowRoot };
  }

  // ────────────────────────────────────────────────────────────
  // once — exactly once, across trees and key filters
  // ────────────────────────────────────────────────────────────

  it('once (direct): fires exactly once across shadow and light events', async () => {
    const calls: string[] = [];
    const t = tag('on-x-once-direct');

    @element(t)
    class C extends HTMLElement {
      @on('ping', { once: true })
      h(e: CustomEvent) { calls.push(e.detail); }
      @render()
      renderContent() { return html`<button class="inner">s</button>`; }
    }

    const { lightChild, shadow } = await mount(t);
    shadow.querySelector('.inner')!.dispatchEvent(
      new CustomEvent('ping', { detail: 'shadow', bubbles: true, composed: true }));
    await settle();
    lightChild.dispatchEvent(
      new CustomEvent('ping', { detail: 'light', bubbles: true, composed: true }));
    await settle();

    expect(calls).toEqual(['shadow']);
  });

  it('once (delegated): fires exactly once across trees', async () => {
    const calls: string[] = [];
    const t = tag('on-x-once-delegated');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.hit', { once: true })
      h(e: MouseEvent) { calls.push((e.target as HTMLElement).className); }
      @render()
      renderContent() { return html`<button class="shadow-hit hit">s</button>`; }
    }

    const { lightChild, shadow } = await mount(t);
    click(lightChild);
    await settle();
    click(shadow.querySelector('.hit')!);
    await settle();

    expect(calls).toEqual(['light-hit hit']);
  });

  it('once (delegated): a non-matching event does not consume the listener', async () => {
    const calls: number[] = [];
    const t = tag('on-x-once-nomatch');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.hit', { once: true })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="hit">s</button><button class="miss">m</button>`; }
    }

    const { shadow } = await mount(t);
    click(shadow.querySelector('.miss')!);
    await settle();
    click(shadow.querySelector('.hit')!);
    await settle();
    click(shadow.querySelector('.hit')!);
    await settle();

    expect(calls).toEqual([1]);
  });

  it('once + key filter: not consumed by a non-matching key', async () => {
    const calls: number[] = [];
    const t = tag('on-x-once-key');

    @element(t)
    class C extends HTMLElement {
      @on('keydown:Enter', { once: true })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="inner">s</button>`; }
    }

    const { shadow } = await mount(t);
    const inner = shadow.querySelector('.inner')!;
    key(inner, 'a');
    await settle();
    key(inner, 'Enter');
    await settle();
    key(inner, 'Enter');
    await settle();

    expect(calls).toEqual([1]);
  });

  it('once + light:false: single-tree once still removes after first fire', async () => {
    const calls: number[] = [];
    const t = tag('on-x-once-shadowonly');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.hit', { once: true, light: false })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="hit">s</button>`; }
    }

    const { shadow } = await mount(t);
    const hit = shadow.querySelector('.hit')!;
    click(hit);
    await settle();
    click(hit);
    await settle();

    expect(calls).toEqual([1]);
  });

  // ────────────────────────────────────────────────────────────
  // debounce / throttle
  // ────────────────────────────────────────────────────────────

  it('debounce composes with delegated tree flags', async () => {
    const calls: number[] = [];
    const t = tag('on-x-debounce');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.hit', { debounce: 30, shadow: false })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="hit">s</button>`; }
    }

    const { lightChild, shadow } = await mount(t);
    click(lightChild);
    click(lightChild);
    click(lightChild);
    await wait(60);
    expect(calls.length).toBe(1);

    // shadow tree is off — even after the debounce window nothing fires
    click(shadow.querySelector('.hit')!);
    await wait(60);
    expect(calls.length).toBe(1);
  });

  it('throttle composes with direct light-only listeners', async () => {
    const calls: number[] = [];
    const t = tag('on-x-throttle');

    @element(t)
    class C extends HTMLElement {
      @on('ping', { throttle: 100, shadow: false })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<span>s</span>`; }
    }

    const { lightChild } = await mount(t);
    lightChild.dispatchEvent(new CustomEvent('ping', { bubbles: true, composed: true }));
    lightChild.dispatchEvent(new CustomEvent('ping', { bubbles: true, composed: true }));
    await settle();
    expect(calls.length).toBe(1); // leading edge only within the window
  });

  // ────────────────────────────────────────────────────────────
  // keyboard filters + delegation + flags
  // ────────────────────────────────────────────────────────────

  it('keydown:Enter + selector + light:false matches only shadow-tree Enter', async () => {
    const calls: number[] = [];
    const t = tag('on-x-key-delegated');

    @element(t)
    class C extends HTMLElement {
      @on('keydown:Enter', '.hit', { light: false })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="hit">s</button>`; }
    }

    const { lightChild, shadow } = await mount(t);
    const shadowHit = shadow.querySelector('.hit')!;

    key(shadowHit, 'a');
    key(lightChild, 'Enter');
    await settle();
    expect(calls).toEqual([]);

    key(shadowHit, 'Enter');
    await settle();
    expect(calls).toEqual([1]);
  });

  // ────────────────────────────────────────────────────────────
  // event-name arrays
  // ────────────────────────────────────────────────────────────

  it('event-name arrays compose with shadow:false', async () => {
    const calls: string[] = [];
    const t = tag('on-x-array');

    @element(t)
    class C extends HTMLElement {
      @on(['ping', 'pong'], { shadow: false })
      h(e: Event) { calls.push(e.type); }
      @render()
      renderContent() { return html`<span class="inner">s</span>`; }
    }

    const { lightChild, shadow } = await mount(t);
    lightChild.dispatchEvent(new CustomEvent('ping', { bubbles: true, composed: true }));
    lightChild.dispatchEvent(new CustomEvent('pong', { bubbles: true, composed: true }));
    await settle();
    expect(calls).toEqual(['ping', 'pong']);

    // Direct listeners with light enabled still hear composed shadow events —
    // they retarget to the host, exactly as in the native DOM.
    shadow.querySelector('.inner')!.dispatchEvent(
      new CustomEvent('ping', { bubbles: true, composed: true }));
    await settle();
    expect(calls).toEqual(['ping', 'pong', 'ping']);
  });

  // ────────────────────────────────────────────────────────────
  // controllers
  // ────────────────────────────────────────────────────────────

  it('controller on a plain element: delegation matches light children by default', async () => {
    const calls: number[] = [];
    const ctrl = tag('tree-ctrl');

    @controller(ctrl)
    class C {
      element!: HTMLElement;
      async attach() {}
      async detach() {}

      @on('click', '.hit')
      h() { calls.push(1); }
    }

    const host = document.createElement('div');
    host.setAttribute('controller', ctrl);
    const hit = document.createElement('button');
    hit.className = 'hit';
    const miss = document.createElement('button');
    miss.className = 'miss';
    host.append(hit, miss);
    container.appendChild(host);
    await wait(10);

    click(hit);
    click(miss);
    await settle();
    expect(calls).toEqual([1]);
  });

  it('controller on a plain element: light:false warns and skips (no shadow root)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const calls: number[] = [];
    const ctrl = tag('tree-ctrl-noshadow');

    @controller(ctrl)
    class C {
      element!: HTMLElement;
      async attach() {}
      async detach() {}

      @on('click', '.hit', { light: false })
      h() { calls.push(1); }
    }

    const host = document.createElement('div');
    host.setAttribute('controller', ctrl);
    const hit = document.createElement('button');
    hit.className = 'hit';
    host.appendChild(hit);
    container.appendChild(host);
    await wait(10);

    click(hit);
    await settle();
    expect(calls).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('shadow'));
  });

  it('controller on a shadow host: flags pick the tree like elements do', async () => {
    const calls: string[] = [];
    const ctrl = tag('tree-ctrl-shadow');
    const t = tag('on-x-ctrl-host');

    @controller(ctrl)
    class Ctl {
      element!: HTMLElement;
      async attach() {}
      async detach() {}

      @on('click', '.hit', { shadow: false })
      h(e: MouseEvent) { calls.push((e.target as HTMLElement).className); }
    }

    @element(t)
    class Host extends HTMLElement {
      @render()
      renderContent() { return html`<button class="shadow-hit hit">s</button>`; }
    }

    const el = document.createElement(t);
    el.setAttribute('controller', ctrl);
    const lightHit = document.createElement('button');
    lightHit.className = 'light-hit hit';
    el.appendChild(lightHit);
    container.appendChild(el);
    await (el as any).ready;
    await wait(10);

    click(lightHit);
    await settle();
    expect(calls).toEqual(['light-hit hit']);

    click((el as any).shadowRoot.querySelector('.hit'));
    await settle();
    expect(calls).toEqual(['light-hit hit']);
  });

  // ────────────────────────────────────────────────────────────
  // reconnect
  // ────────────────────────────────────────────────────────────

  it('reconnect re-attaches flagged listeners exactly once', async () => {
    const calls: number[] = [];
    const t = tag('on-x-reconnect');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.hit', { shadow: false })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="shadow-hit hit">s</button>`; }
    }

    const { el, lightChild, shadow } = await mount(t);
    click(lightChild);
    await settle();
    expect(calls.length).toBe(1);

    el.remove();
    await settle();
    container.appendChild(el);
    await settle();
    await wait(10);

    click(lightChild);
    await settle();
    expect(calls.length).toBe(2); // exactly one new call — no double-registration

    click(shadow.querySelector('.hit')!);
    await settle();
    expect(calls.length).toBe(2); // shadow still off after reconnect
  });

  // ────────────────────────────────────────────────────────────
  // preventDefault / stopPropagation with multi-root delegation
  // ────────────────────────────────────────────────────────────

  it('preventDefault applies on a light-tree delegated match', async () => {
    const t = tag('on-x-preventdefault');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.hit', { preventDefault: true })
      h() {}
      @render()
      renderContent() { return html`<span>s</span>`; }
    }

    const { lightChild } = await mount(t);
    const event = new MouseEvent('click', { bubbles: true, composed: true, cancelable: true });
    lightChild.dispatchEvent(event);
    await settle();
    expect(event.defaultPrevented).toBe(true);
  });

  it('stopPropagation on a shadow-tree match keeps the event inside the component', async () => {
    const outer = vi.fn();
    document.addEventListener('click', outer);
    const t = tag('on-x-stopprop');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.hit', { stopPropagation: true })
      h() {}
      @render()
      renderContent() { return html`<button class="hit">s</button>`; }
    }

    const { shadow } = await mount(t);
    click(shadow.querySelector('.hit')!);
    await settle();

    document.removeEventListener('click', outer);
    expect(outer).not.toHaveBeenCalled();
  });
});
