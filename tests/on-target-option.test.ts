/**
 * Tests for the `target` option on @on.
 *
 * `{ target: selector }` must behave exactly like the positional selector
 * argument: delegated handling where only events originating from (or inside)
 * a matching element trigger the handler.
 *
 * Covers: filtering, closest() matching for nested children, equivalence with
 * the positional form, positional selector precedence over `target`, and
 * cleanup on disconnect.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, render, html, on } from '../packages/core/src/index';

async function settle() {
  await new Promise((r) => queueMicrotask(r));
}

function click(el: Element) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

describe('@on target option', () => {
  let container: HTMLDivElement;
  let counter = 0;
  const tag = (base: string) => `${base}-${++counter}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('target: only matching elements trigger the handler', async () => {
    const calls: string[] = [];
    const t = tag('on-target-filter');

    @element(t)
    class C extends HTMLElement {
      @on('click', { target: '.wanted' })
      h(e: MouseEvent) { calls.push((e.target as HTMLElement).className); }

      @render()
      renderContent() {
        return html`<div><button class="wanted">yes</button><button class="unwanted">no</button></div>`;
      }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    const root = (el as any).shadowRoot as ShadowRoot;
    click(root.querySelector('.wanted')!);
    click(root.querySelector('.unwanted')!);
    await settle();

    expect(calls).toEqual(['wanted']);
  });

  it('target: matches via closest() when clicking a nested child', async () => {
    const calls: number[] = [];
    const t = tag('on-target-closest');

    @element(t)
    class C extends HTMLElement {
      @on('click', { target: '.row' })
      h() { calls.push(1); }

      @render()
      renderContent() {
        return html`<div class="row"><span class="inner">deep</span></div><div class="other">out</div>`;
      }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    const root = (el as any).shadowRoot as ShadowRoot;
    click(root.querySelector('.inner')!);
    click(root.querySelector('.other')!);
    await settle();

    expect(calls).toEqual([1]);
  });

  it('target behaves identically to the positional selector argument', async () => {
    const viaTarget: string[] = [];
    const viaSelector: string[] = [];
    const t1 = tag('on-target-eq-a');
    const t2 = tag('on-target-eq-b');

    @element(t1)
    class A extends HTMLElement {
      @on('click', { target: '.hit' })
      h(e: MouseEvent) { viaTarget.push((e.target as HTMLElement).className); }
      @render()
      renderContent() { return html`<button class="hit">a</button><button class="miss">b</button>`; }
    }

    @element(t2)
    class B extends HTMLElement {
      @on('click', '.hit')
      h(e: MouseEvent) { viaSelector.push((e.target as HTMLElement).className); }
      @render()
      renderContent() { return html`<button class="hit">a</button><button class="miss">b</button>`; }
    }

    const a = document.createElement(t1);
    const b = document.createElement(t2);
    container.append(a, b);
    await (a as any).ready;
    await (b as any).ready;

    for (const el of [a, b]) {
      const root = (el as any).shadowRoot as ShadowRoot;
      click(root.querySelector('.hit')!);
      click(root.querySelector('.miss')!);
    }
    await settle();

    expect(viaTarget).toEqual(['hit']);
    expect(viaSelector).toEqual(viaTarget);
  });

  it('positional selector wins when both selector and target are given', async () => {
    const calls: string[] = [];
    const t = tag('on-target-precedence');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.positional', { target: '.optional' })
      h(e: MouseEvent) { calls.push((e.target as HTMLElement).className); }

      @render()
      renderContent() {
        return html`<button class="positional">p</button><button class="optional">o</button>`;
      }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    const root = (el as any).shadowRoot as ShadowRoot;
    click(root.querySelector('.positional')!);
    click(root.querySelector('.optional')!);
    await settle();

    expect(calls).toEqual(['positional']);
  });

  // Slotted light-DOM matching lives in on-target-slotted-jsdom.test.ts —
  // happy-dom does not implement slot assignment or flattened-tree event
  // propagation, so that case needs the jsdom environment.

  it('target: does not match inside a child component shadow root (retargeting)', async () => {
    const calls: number[] = [];
    const childTag = tag('on-target-child');
    const parentTag = tag('on-target-parent');

    @element(childTag)
    class Child extends HTMLElement {
      @render()
      renderContent() { return html`<button class="inner-btn">deep</button>`; }
    }

    @element(parentTag)
    class Parent extends HTMLElement {
      @on('click', { target: '.inner-btn' })
      h() { calls.push(1); }

      @render()
      renderContent() { return html`<div class="mount"></div>`; }
    }

    const el = document.createElement(parentTag);
    container.appendChild(el);
    await (el as any).ready;

    const child = document.createElement(childTag);
    (el as any).shadowRoot.querySelector('.mount').appendChild(child);
    await (child as any).ready;
    const innerBtn = (child as any).shadowRoot.querySelector('.inner-btn');
    click(innerBtn);
    await settle();

    // The event retargets to the child host at the shadow boundary; a selector
    // for the child's internals must not match from the parent.
    expect(calls).toEqual([]);
  });

  it('target: delegated listener is removed on disconnect', async () => {
    const calls: number[] = [];
    const t = tag('on-target-cleanup');

    @element(t)
    class C extends HTMLElement {
      @on('click', { target: '.hit' })
      h() { calls.push(1); }
      @render()
      renderContent() { return html`<button class="hit">a</button>`; }
    }

    const el = document.createElement(t);
    container.appendChild(el);
    await (el as any).ready;

    const root = (el as any).shadowRoot as ShadowRoot;
    const btn = root.querySelector('.hit')!;
    click(btn);
    expect(calls.length).toBe(1);

    el.remove();
    await settle();

    click(btn);
    expect(calls.length).toBe(1); // no leak
  });
});
