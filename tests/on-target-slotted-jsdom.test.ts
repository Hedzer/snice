// @vitest-environment jsdom
/**
 * Slotted light-DOM delegation for @on's `target`/selector matching.
 *
 * A click on content slotted into a shadow wrapper must match a delegation
 * selector for that wrapper: the flattened event path crosses the slot
 * boundary even though `target.closest()` cannot. happy-dom implements
 * neither slot assignment nor flattened-tree propagation, so this file runs
 * under jsdom.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, render, html, on } from '../packages/core/src/index';

async function settle() {
  await new Promise((r) => queueMicrotask(r));
}

function click(el: Element) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

describe('@on target option — slotted content (jsdom)', () => {
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

  it('slotted light-DOM clicks match a shadow wrapper around the slot', async () => {
    const calls: number[] = [];
    const t = tag('on-target-slotted');

    @element(t)
    class C extends HTMLElement {
      @on('click', { target: '.trigger-wrap' })
      h() { calls.push(1); }

      @render()
      renderContent() {
        return html`<div class="trigger-wrap"><slot name="trigger"></slot></div><div class="outside">x</div>`;
      }
    }

    const el = document.createElement(t);
    const slotted = document.createElement('button');
    slotted.slot = 'trigger';
    el.appendChild(slotted);
    container.appendChild(el);
    await (el as any).ready;

    click(slotted);
    await settle();
    expect(calls).toEqual([1]);

    const root = (el as any).shadowRoot as ShadowRoot;
    click(root.querySelector('.outside')!);
    await settle();
    expect(calls).toEqual([1]);
  });

  it('fires once when a selector matches in both trees for one event', async () => {
    const calls: number[] = [];
    const t = tag('on-target-dualmatch');

    @element(t)
    class C extends HTMLElement {
      @on('click', '.hit')
      h() { calls.push(1); }

      @render()
      renderContent() {
        return html`<div class="hit"><slot name="trigger"></slot></div>`;
      }
    }

    const el = document.createElement(t);
    const slotted = document.createElement('button');
    slotted.slot = 'trigger';
    slotted.className = 'hit';
    el.appendChild(slotted);
    container.appendChild(el);
    await (el as any).ready;

    // The click matches `.hit` on the slotted button (light tree) AND on the
    // shadow wrapper — the handler must still run exactly once.
    click(slotted);
    await settle();
    expect(calls).toEqual([1]);
  });

  it('slotted clicks do not match when the slot sits outside the selector', async () => {
    const calls: number[] = [];
    const t = tag('on-target-slotted-miss');

    @element(t)
    class C extends HTMLElement {
      @on('click', { target: '.other-wrap' })
      h() { calls.push(1); }

      @render()
      renderContent() {
        return html`<div class="trigger-wrap"><slot name="trigger"></slot></div><div class="other-wrap">x</div>`;
      }
    }

    const el = document.createElement(t);
    const slotted = document.createElement('button');
    slotted.slot = 'trigger';
    el.appendChild(slotted);
    container.appendChild(el);
    await (el as any).ready;

    click(slotted);
    await settle();
    expect(calls).toEqual([]);
  });
});
