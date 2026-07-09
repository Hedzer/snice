import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html, live } from '../src/index';

describe('live() property binding', () => {
  let container: HTMLDivElement;
  let uniqueId = 0;

  const getUniqueTag = () => `live-binding-test-${++uniqueId}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  const tick = () => new Promise(resolve => queueMicrotask(resolve));

  it('resets DOM state the user changed, even when the bound value is unchanged', async () => {
    const tag = getUniqueTag();

    @element(tag)
    class TestElement extends HTMLElement {
      @property() text = 'bound';
      @property({ type: Number }) unrelated = 0;

      @render()
      renderContent() {
        return html`<input .value=${live(this.text)} /><span>${this.unrelated}</span>`;
      }
    }

    const el = document.createElement(tag) as InstanceType<typeof TestElement>;
    container.appendChild(el);
    await el.ready;

    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('bound');

    // user types — DOM drifts from the bound value
    input.value = 'user-typed';

    // unrelated re-render with the SAME bound value must reset the input
    el.unrelated = 1;
    await tick();
    expect(input.value).toBe('bound');
  });

  it('without live(), an unchanged bound value does not reset user-typed DOM (baseline)', async () => {
    const tag = getUniqueTag();

    @element(tag)
    class TestElement extends HTMLElement {
      @property() text = 'bound';
      @property({ type: Number }) unrelated = 0;

      @render()
      renderContent() {
        return html`<input .value=${this.text} /><span>${this.unrelated}</span>`;
      }
    }

    const el = document.createElement(tag) as InstanceType<typeof TestElement>;
    container.appendChild(el);
    await el.ready;

    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
    input.value = 'user-typed';

    el.unrelated = 1;
    await tick();
    // dirty-check against the committed value skips the write — documented tradeoff
    expect(input.value).toBe('user-typed');
  });

  it('updates normally when the bound value changes', async () => {
    const tag = getUniqueTag();

    @element(tag)
    class TestElement extends HTMLElement {
      @property() text = 'one';

      @render()
      renderContent() {
        return html`<input .value=${live(this.text)} />`;
      }
    }

    const el = document.createElement(tag) as InstanceType<typeof TestElement>;
    container.appendChild(el);
    await el.ready;

    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('one');

    el.text = 'two';
    await tick();
    expect(input.value).toBe('two');
  });

  it('skips the DOM write when the DOM already matches (no spurious resets)', async () => {
    const tag = getUniqueTag();

    @element(tag)
    class TestElement extends HTMLElement {
      @property({ type: Number }) unrelated = 0;

      @render()
      renderContent() {
        return html`<input .value=${live('same')} /><span>${this.unrelated}</span>`;
      }
    }

    const el = document.createElement(tag) as InstanceType<typeof TestElement>;
    container.appendChild(el);
    await el.ready;

    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
    // spy on the value setter to detect writes
    let writes = 0;
    const proto = Object.getPrototypeOf(input);
    const desc = Object.getOwnPropertyDescriptor(proto, 'value')!;
    Object.defineProperty(input, 'value', {
      get() { return desc.get!.call(this); },
      set(v) { writes++; desc.set!.call(this, v); },
      configurable: true
    });

    el.unrelated = 1;
    await tick();
    expect(writes).toBe(0);
  });
});
