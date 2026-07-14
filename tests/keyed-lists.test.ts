import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html } from '../packages/core/src/index';

/**
 * Keyed list rendering — `key=${...}` on the root element of a list item
 * template associates DOM (and its state) with the key, not the index.
 * Documented in docs/ai/patterns.md ("Lists with keys").
 *
 * Without keys, lists reconcile by index.
 */
describe('keyed list rendering', () => {
  let container: HTMLDivElement;
  let uniqueId = 0;

  const getUniqueTag = () => `keyed-list-test-${++uniqueId}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function makeListElement() {
    const tag = getUniqueTag();

    @element(tag)
    class TestElement extends HTMLElement {
      @property({ attribute: false }) items: number[] = [];

      @render()
      renderContent() {
        return html`<div>${this.items.map(
          (id) => html`<input key=${id} data-id=${id} />`
        )}</div>`;
      }
    }

    const el = document.createElement(tag) as HTMLElement & { items: number[]; ready: Promise<void> };
    container.appendChild(el);
    return el;
  }

  const inputs = (el: HTMLElement) =>
    Array.from(el.shadowRoot!.querySelectorAll('input')) as HTMLInputElement[];

  const tick = () => new Promise(resolve => queueMicrotask(resolve));

  it('state follows the key when the first item is removed', async () => {
    const el = makeListElement();
    el.items = [1, 2, 3];
    await el.ready;

    const before = inputs(el);
    expect(before.length).toBe(3);
    before[0].value = 'typed-into-row-1';

    el.items = [2, 3];
    await tick();

    const after = inputs(el);
    expect(after.length).toBe(2);
    expect(after[0].dataset.id).toBe('2');
    // Row 2 keeps ITS node — it must not inherit row 1's typed state
    expect(after[0]).toBe(before[1]);
    expect(after[0].value).toBe('');
  });

  it('node identity follows keys on reorder', async () => {
    const el = makeListElement();
    el.items = [1, 2, 3];
    await el.ready;

    const before = inputs(el);
    before[0].value = 'one';
    before[1].value = 'two';
    before[2].value = 'three';

    el.items = [3, 1, 2];
    await tick();

    const after = inputs(el);
    expect(after.map(i => i.dataset.id)).toEqual(['3', '1', '2']);
    expect(after[0]).toBe(before[2]);
    expect(after[1]).toBe(before[0]);
    expect(after[2]).toBe(before[1]);
    expect(after.map(i => i.value)).toEqual(['three', 'one', 'two']);
  });

  it('prepending reuses existing keyed nodes', async () => {
    const el = makeListElement();
    el.items = [2, 3];
    await el.ready;

    const before = inputs(el);
    before[0].value = 'two';

    el.items = [1, 2, 3];
    await tick();

    const after = inputs(el);
    expect(after.map(i => i.dataset.id)).toEqual(['1', '2', '3']);
    expect(after[1]).toBe(before[0]);
    expect(after[1].value).toBe('two');
    expect(after[0].value).toBe('');
  });

  it('unkeyed lists still reconcile by index (baseline behavior)', async () => {
    const tag = getUniqueTag();

    @element(tag)
    class TestElement extends HTMLElement {
      @property({ attribute: false }) items: number[] = [];

      @render()
      renderContent() {
        return html`<div>${this.items.map(
          (id) => html`<input data-id=${id} />`
        )}</div>`;
      }
    }

    const el = document.createElement(tag) as HTMLElement & { items: number[]; ready: Promise<void> };
    container.appendChild(el);
    el.items = [1, 2, 3];
    await el.ready;

    const before = inputs(el as any);
    el.items = [2, 3];
    await tick();

    const after = inputs(el as any);
    // index-based: first DOM node is reused for the new first item
    expect(after[0]).toBe(before[0]);
    expect(after[0].dataset.id).toBe('2');
  });
});
