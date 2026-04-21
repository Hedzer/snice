import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { element, on, render, html } from '../src/index';

// Framework-level bugs carried over from the audit backlog.

afterEach(() => { document.body.innerHTML = ''; });

// ---------------------------------------------------------------------------
// #1 — @on dedup symbol is a global Symbol.for(...) keyed only by method name.
//   Parent + nested Child that both define an @on handler with the same method
//   name for the same composed event: Parent's handler is silently swallowed.
// ---------------------------------------------------------------------------

describe('@on: same method name across nested components does not collide', () => {
  it.fails('parent and child both have @on(click) handleClick; clicking inside child fires both', async () => {
    const calls: string[] = [];

    @element('on-collide-child')
    class C extends HTMLElement {
      @on('click') handleClick() { calls.push('child'); }
      @render() r() { return html`<button class="btn">click</button>`; }
    }

    @element('on-collide-parent')
    class P extends HTMLElement {
      @on('click') handleClick() { calls.push('parent'); }
      @render() r() { return html`<on-collide-child></on-collide-child>`; }
    }

    const p = document.createElement('on-collide-parent') as any;
    document.body.appendChild(p);
    await p.ready;

    const child = p.shadowRoot.querySelector('on-collide-child');
    const btn = child.shadowRoot.querySelector('.btn');
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    expect(calls).toContain('child');
    expect(calls).toContain('parent');
  });
});

// ---------------------------------------------------------------------------
// #3 — document listeners without @dispose: permanent leaks.
//   Sampling 3 representative components to prove the pattern. Fix sweep can
//   run across: cropper, date-picker, tag-input, time-picker, command-palette,
//   availability, gantt, tooltip, accordion.
// ---------------------------------------------------------------------------

describe('document listeners are removed on disconnect', () => {
  // Count all document click listeners by intercepting add/remove
  const orig = {
    add: document.addEventListener.bind(document),
    remove: document.removeEventListener.bind(document),
  };
  let added: Array<{ type: string; fn: any }> = [];
  let removed: Array<{ type: string; fn: any }> = [];

  beforeEach(() => {
    added = []; removed = [];
    document.addEventListener = function (type: string, fn: any, opts?: any) {
      added.push({ type, fn });
      return orig.add(type, fn, opts);
    } as any;
    document.removeEventListener = function (type: string, fn: any, opts?: any) {
      removed.push({ type, fn });
      return orig.remove(type, fn, opts);
    } as any;
  });

  afterEach(() => {
    document.addEventListener = orig.add;
    document.removeEventListener = orig.remove;
  });

  function leftover(type: string): number {
    // listeners still attached = added minus removed (by reference)
    return added.filter(a => a.type === type)
      .filter(a => !removed.some(r => r.type === a.type && r.fn === a.fn))
      .length;
  }

  it.fails('cropper: document mousemove/mouseup listeners are removed on disconnect', async () => {
    await import('../components/cropper/snice-cropper');
    const el = document.createElement('snice-cropper') as any;
    document.body.appendChild(el);
    await el.ready;
    const addedMouseMove = added.filter(a => a.type === 'mousemove').length;
    expect(addedMouseMove).toBeGreaterThan(0);
    el.remove();
    await new Promise(r => queueMicrotask(r));
    expect(leftover('mousemove')).toBe(0);
    expect(leftover('mouseup')).toBe(0);
  });

  it.fails('date-picker: document click listener is removed on disconnect', async () => {
    await import('../components/date-picker/snice-date-picker');
    const el = document.createElement('snice-date-picker') as any;
    document.body.appendChild(el);
    await el.ready;
    const addedClicks = added.filter(a => a.type === 'click').length;
    expect(addedClicks).toBeGreaterThan(0);
    el.remove();
    await new Promise(r => queueMicrotask(r));
    expect(leftover('click')).toBe(0);
  });

  it.fails('tag-input: document click listener is removed on disconnect', async () => {
    await import('../components/tag-input/snice-tag-input');
    const el = document.createElement('snice-tag-input') as any;
    document.body.appendChild(el);
    await el.ready;
    const addedClicks = added.filter(a => a.type === 'click').length;
    expect(addedClicks).toBeGreaterThan(0);
    el.remove();
    await new Promise(r => queueMicrotask(r));
    expect(leftover('click')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// #4 — terminal XSS via unsafeHTML on user input.
// ---------------------------------------------------------------------------

describe('terminal: user input is not rendered as raw HTML', () => {
  it.fails('typing an HTML tag at the prompt renders it as text, not an element', async () => {
    await import('../components/terminal/snice-terminal');
    const el = document.createElement('snice-terminal') as any;
    document.body.appendChild(el);
    await el.ready;

    // Use the documented `writeln` API with a string that looks like HTML
    el.writeln('<img src=x onerror="window.__pwn=true">', 'output');
    await new Promise(r => setTimeout(r, 50));

    // The rendered shadow DOM must not contain an <img> element
    const imgs = el.shadowRoot.querySelectorAll('img');
    expect(imgs.length).toBe(0);
    expect((window as any).__pwn).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// #5 — camera default autoStart=true silently requests camera permission on mount.
// ---------------------------------------------------------------------------

describe('camera: does not auto-request getUserMedia on default mount', () => {
  let getUserMediaCalls = 0;
  const origMediaDevices = (navigator as any).mediaDevices;

  beforeEach(() => {
    getUserMediaCalls = 0;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          getUserMediaCalls++;
          // return a fake stream-ish object
          return { getTracks: () => [], getVideoTracks: () => [] };
        },
        enumerateDevices: async () => [],
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: origMediaDevices,
    });
  });

  it.fails('default <snice-camera> does not call getUserMedia on connect', async () => {
    await import('../components/camera/snice-camera');
    const el = document.createElement('snice-camera') as any;
    document.body.appendChild(el);
    await el.ready;
    await new Promise(r => setTimeout(r, 30));

    expect(getUserMediaCalls).toBe(0);
  });
});
