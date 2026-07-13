import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bind, element, html, property, render } from './test-imports';

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

  it('binds model and native form properties in both directions', async () => {
    @element('test-form-bindings')
    class TestFormBindings extends HTMLElement {
      @property({ attribute: false }) query = 'initial';
      @property({ attribute: false }) accepted = false;

      @render()
      template() {
        return html`
          <input class="query" .value=${bind(this, 'query')}>
          <input class="accepted" type="checkbox" .checked=${bind(this, 'accepted')}>
        `;
      }
    }

    const el = document.createElement('test-form-bindings') as TestFormBindings;
    container.appendChild(el);
    await el.ready;
    const query = el.shadowRoot?.querySelector('.query') as HTMLInputElement;
    const accepted = el.shadowRoot?.querySelector('.accepted') as HTMLInputElement;
    expect(query.value).toBe('initial');

    query.value = 'typed';
    query.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await el.rendered;
    expect(el.query).toBe('typed');

    accepted.checked = true;
    accepted.dispatchEvent(new Event('change', { bubbles: true }));
    await el.rendered;
    expect(el.accepted).toBe(true);

    el.query = 'model';
    el.accepted = false;
    await el.rendered;
    expect(query.value).toBe('model');
    expect(accepted.checked).toBe(false);
  });

  it('does not publish partial IME composition values', async () => {
    @element('test-composition-binding')
    class TestCompositionBinding extends HTMLElement {
      @property({ attribute: false }) value = '';

      @render()
      template() {
        return html`<input .value=${bind(this, 'value')}>`;
      }
    }

    const el = document.createElement('test-composition-binding') as TestCompositionBinding;
    container.appendChild(el);
    await el.ready;
    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;

    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'partial';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    expect(el.value).toBe('');

    input.value = '完成';
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    await el.rendered;
    expect(el.value).toBe('完成');
  });
});
