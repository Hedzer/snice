/**
 * "React person" patterns: a naive user expects every kind of items mutation
 * or reassignment to re-render `${this.items.length}` and `<if ${...}>`.
 *
 * Probes which patterns actually trigger re-render and which silently don't.
 * If a "naive but reasonable" pattern fails, that's a footgun worth knowing.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html } from '../packages/core/src/index';

describe('<if> + items.length re-render under naive React-style updates', () => {
  let container: HTMLDivElement;
  let counter = 0;
  const t = (base: string) => `${base}-${++counter}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  function make() {
    const tag = t('react-moron');
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Array }) items: number[] = [];
      @render()
      tpl() {
        return html`
          <span class="count">${this.items.length}</span>
          <if ${this.items.length > 0}><span class="have">have</span></if>
          <if ${this.items.length === 0}><span class="empty">empty</span></if>
          <ul>${this.items.map((n) => html`<li class="row">${n}</li>`)}</ul>
        `;
      }
    }
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    return el;
  }

  function settle() {
    return new Promise((r) => queueMicrotask(r));
  }

  function snapshot(el: any) {
    const sr = el.shadowRoot;
    return {
      countText: sr.querySelector('.count')?.textContent,
      have: !!sr.querySelector('.have'),
      empty: !!sr.querySelector('.empty'),
      rows: sr.querySelectorAll('.row').length,
    };
  }

  it('reassignment to a new array triggers re-render', async () => {
    const el = make();
    await el.ready;
    expect(snapshot(el)).toEqual({ countText: '0', have: false, empty: true, rows: 0 });

    el.items = [1, 2, 3];
    await settle();
    expect(snapshot(el)).toEqual({ countText: '3', have: true, empty: false, rows: 3 });
  });

  it('items = [...this.items, x] (spread append) triggers re-render', async () => {
    const el = make();
    await el.ready;

    el.items = [...el.items, 1];
    await settle();
    expect(snapshot(el)).toEqual({ countText: '1', have: true, empty: false, rows: 1 });

    el.items = [...el.items, 2];
    await settle();
    expect(snapshot(el)).toEqual({ countText: '2', have: true, empty: false, rows: 2 });
  });

  it('items = items.concat(x) triggers re-render', async () => {
    const el = make();
    await el.ready;

    el.items = el.items.concat(1, 2);
    await settle();
    expect(snapshot(el)).toEqual({ countText: '2', have: true, empty: false, rows: 2 });
  });

  it('items.push(x) WITHOUT reassignment — naive React person mistake', async () => {
    const el = make();
    await el.ready;

    el.items.push(1);
    el.items.push(2);
    await settle();

    // Snice does not subscribe to mutations. So count stays 0, <if> stays empty.
    // This is the universal footgun for naive users.
    expect(snapshot(el)).toEqual({ countText: '0', have: false, empty: true, rows: 0 });
  });

  it('items.push(x) + self-reassign (`items = items`) does NOT re-render', async () => {
    const el = make();
    await el.ready;

    el.items.push(1);
    el.items.push(2);
    el.items = el.items; // same reference
    await settle();

    // FOOTGUN: setter short-circuits on `oldValue === newValue`
    // (element.ts:596), matching Lit's hasChanged default. The push mutates
    // in place, then the self-assign hits the equality check and bails.
    // Property setter never fires render, list never updates.
    const snap = snapshot(el);
    expect(snap.countText).toBe('0');
    expect(snap.rows).toBe(0);
    expect(snap.have).toBe(false);
    expect(snap.empty).toBe(true);
  });

  it('items.push then spread reassign always works', async () => {
    const el = make();
    await el.ready;

    el.items.push(1);
    el.items = [...el.items]; // new ref
    await settle();
    expect(snapshot(el)).toEqual({ countText: '1', have: true, empty: false, rows: 1 });
  });

  it('items.splice mutation alone — no re-render', async () => {
    const el = make();
    await el.ready;
    el.items = [1, 2, 3, 4, 5];
    await settle();
    expect(snapshot(el).countText).toBe('5');

    el.items.splice(0, 2); // mutate to length 3, no reassign
    await settle();
    // Naive React person bug: shows 5 still, even though items array is len 3.
    expect(snapshot(el).countText).toBe('5');
  });

  it('items.sort() mutation alone — no re-render', async () => {
    const el = make();
    await el.ready;
    el.items = [3, 1, 2];
    await settle();
    expect(snapshot(el).rows).toBe(3);
    const beforeOrder = Array.from(el.shadowRoot.querySelectorAll('.row')).map((n: any) => n.textContent);

    el.items.sort();
    await settle();
    const afterOrder = Array.from(el.shadowRoot.querySelectorAll('.row')).map((n: any) => n.textContent);
    // Same order in DOM as before (no re-render), even though items is sorted.
    expect(afterOrder).toEqual(beforeOrder);
  });

  it('items.length = 0 (mutation reset) — no re-render', async () => {
    const el = make();
    await el.ready;
    el.items = [1, 2, 3];
    await settle();
    expect(snapshot(el).countText).toBe('3');

    el.items.length = 0; // mutates length, doesn't reassign
    await settle();
    expect(snapshot(el).countText).toBe('3');
  });

  it('items[0] = newVal index assignment — no re-render', async () => {
    const el = make();
    await el.ready;
    el.items = [10, 20];
    await settle();
    expect(snapshot(el).countText).toBe('2');
    const before = Array.from(el.shadowRoot.querySelectorAll('.row')).map((n: any) => n.textContent);
    expect(before).toEqual(['10', '20']);

    el.items[0] = 99; // mutation by index
    await settle();
    const after = Array.from(el.shadowRoot.querySelectorAll('.row')).map((n: any) => n.textContent);
    expect(after).toEqual(['10', '20']); // stale, no re-render
  });

  it('items = [] (replace with same-length-but-different-ref empty)', async () => {
    const el = make();
    await el.ready;

    // Initially empty.
    el.items = []; // same length 0, but new ref
    await settle();
    expect(snapshot(el)).toEqual({ countText: '0', have: false, empty: true, rows: 0 });

    el.items = [1, 2];
    await settle();
    el.items = []; // back to empty, new ref
    await settle();
    expect(snapshot(el)).toEqual({ countText: '0', have: false, empty: true, rows: 0 });
  });

  it('rapid back-to-back reassignments collapse to final value', async () => {
    const el = make();
    await el.ready;

    el.items = [1];
    el.items = [1, 2];
    el.items = [1, 2, 3];
    el.items = [1, 2, 3, 4];
    await settle();

    expect(snapshot(el)).toEqual({ countText: '4', have: true, empty: false, rows: 4 });
  });

  it('clearing then immediately repopulating in same tick', async () => {
    const el = make();
    await el.ready;
    el.items = [1, 2, 3];
    await settle();

    el.items = [];
    el.items = [9, 8, 7, 6];
    await settle();
    expect(snapshot(el)).toEqual({ countText: '4', have: true, empty: false, rows: 4 });
  });
});
