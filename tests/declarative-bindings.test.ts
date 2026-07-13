import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { element, html, property, render } from './test-imports';

describe('declarative bindings', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => container.remove());

  it('supports class and individual style bindings', async () => {
    @element('test-class-style-bindings')
    class TestClassStyleBindings extends HTMLElement {
      @property({ attribute: false }) active = true;
      @property({ attribute: false }) color: string | null = 'red';

      @render()
      template() {
        return html`
          <div
            class="base"
            class:active=${this.active}
            style:color=${this.color}
            style:--tone=${this.color}
          ></div>
        `;
      }
    }

    const el = document.createElement('test-class-style-bindings') as TestClassStyleBindings;
    container.appendChild(el);
    await el.ready;
    const div = el.shadowRoot?.querySelector('div') as HTMLDivElement;
    expect(div.className).toBe('base active');
    expect(div.style.color).toBe('red');
    expect(div.style.getPropertyValue('--tone')).toBe('red');

    el.active = false;
    el.color = null;
    await el.rendered;
    expect(div.className).toBe('base');
    expect(div.style.color).toBe('');
    expect(div.style.getPropertyValue('--tone')).toBe('');
  });

  it('supports named props, attrs, and events spreads', async () => {
    const first = vi.fn();
    const second = vi.fn();

    @element('test-named-spread-bindings')
    class TestNamedSpreadBindings extends HTMLElement {
      @property({ attribute: false }) alternate = false;

      @render()
      template() {
        return html`
          <input
            ...props=${this.alternate ? { value: 'two' } : { value: 'one', extra: 4 }}
            ...attrs=${this.alternate ? { title: 'two' } : { title: 'one', 'data-ready': true }}
            ...events=${{ click: this.alternate ? second : first }}
          >
        `;
      }
    }

    const el = document.createElement('test-named-spread-bindings') as TestNamedSpreadBindings;
    container.appendChild(el);
    await el.ready;
    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement & { extra?: number };
    input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(input.value).toBe('one');
    expect(input.extra).toBe(4);
    expect(input.hasAttribute('data-ready')).toBe(true);
    expect(first).toHaveBeenCalledTimes(1);

    el.alternate = true;
    await el.rendered;
    input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(input.value).toBe('two');
    expect(input.extra).toBeUndefined();
    expect(input.hasAttribute('data-ready')).toBe(false);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('supports the documented properties and attributes spread aliases', async () => {
    @element('test-long-named-spread-bindings')
    class TestLongNamedSpreadBindings extends HTMLElement {
      @property({ attribute: false }) alternate = false;

      @render()
      template() {
        return html`
          <input
            ...properties=${this.alternate ? { value: 'two' } : { value: 'one', extra: 4 }}
            ...attributes=${this.alternate ? { title: 'two' } : { title: 'one', 'data-ready': true }}
          >
        `;
      }
    }

    const host = document.createElement('test-long-named-spread-bindings') as TestLongNamedSpreadBindings;
    container.append(host);
    await host.ready;
    const input = host.shadowRoot!.querySelector('input') as HTMLInputElement & { extra?: number };
    expect(input.value).toBe('one');
    expect(input.extra).toBe(4);
    expect(input.title).toBe('one');
    expect(input.hasAttribute('data-ready')).toBe(true);

    host.alternate = true;
    await host.rendered;
    expect(input.value).toBe('two');
    expect(input.extra).toBeUndefined();
    expect(input.title).toBe('two');
    expect(input.hasAttribute('data-ready')).toBe(false);
  });

  it('supports composable event options with keyboard filters', async () => {
    const calls = vi.fn();

    @element('test-event-option-bindings')
    class TestEventOptionBindings extends HTMLElement {
      handle(event: Event) {
        calls(this, event.defaultPrevented);
      }

      @render()
      template() {
        return html`<input @keydown.enter|prevent|once=${this.handle}>`;
      }
    }

    const el = document.createElement('test-event-option-bindings') as TestEventOptionBindings;
    container.appendChild(el);
    await el.ready;
    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(calls).toHaveBeenCalledTimes(1);
    expect(calls).toHaveBeenCalledWith(el, true);
  });

});
