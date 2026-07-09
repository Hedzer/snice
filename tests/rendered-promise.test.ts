import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html } from '../src/index';

describe('el.rendered promise', () => {
  let container: HTMLDivElement;
  let uniqueId = 0;

  const getUniqueTag = () => `rendered-promise-test-${++uniqueId}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function makeCounter(options?: any) {
    const tag = getUniqueTag();

    @element(tag)
    class TestElement extends HTMLElement {
      @property({ type: Number }) count = 0;

      @render(options)
      renderContent() {
        return html`<div>${this.count}</div>`;
      }
    }

    const el = document.createElement(tag) as HTMLElement & {
      count: number; ready: Promise<void>; rendered: Promise<void>;
    };
    container.appendChild(el);
    return el;
  }

  it('resolves after a batched property-change render, with the DOM updated', async () => {
    const el = makeCounter();
    await el.ready;

    el.count = 42;
    await el.rendered;

    expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('42');
  });

  it('resolves immediately when no render is pending', async () => {
    const el = makeCounter();
    await el.ready;

    // nothing pending — must not hang
    await el.rendered;
    expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('0');
  });

  it('waits for a debounced render to commit', async () => {
    const el = makeCounter({ debounce: 20 });
    await el.ready;

    el.count = 7;
    // immediately after the set, the DOM must still be stale
    expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('0');

    await el.rendered;
    expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('7');
  });

  it('multiple awaiters of the same render all resolve', async () => {
    const el = makeCounter();
    await el.ready;

    el.count = 5;
    const results = await Promise.all([
      el.rendered.then(() => 'a'),
      el.rendered.then(() => 'b'),
    ]);
    expect(results).toEqual(['a', 'b']);
    expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('5');
  });

  it('coalesces multiple property changes into one awaited render', async () => {
    const el = makeCounter();
    await el.ready;

    el.count = 1;
    el.count = 2;
    el.count = 3;
    await el.rendered;
    expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('3');
  });
});
