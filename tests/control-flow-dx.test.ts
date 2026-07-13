import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { element, html, property, render, repeat } from './test-imports';

describe('declarative control flow', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => container.remove());

  it('supports if / else-if / else while preserving branch DOM', async () => {
    @element('test-if-else-flow')
    class TestIfElseFlow extends HTMLElement {
      @property({ attribute: false }) state = 'first';

      @render()
      template() {
        return html`
          <if ${this.state === 'first'}>
            <input class="first" value="kept">
            <else-if ${this.state === 'second'}>
              <input class="second" value="second">
            </else-if>
            <else><p class="fallback">fallback</p></else>
          </if>
        `;
      }
    }

    const el = document.createElement('test-if-else-flow') as TestIfElseFlow;
    container.appendChild(el);
    await el.ready;
    const first = el.shadowRoot?.querySelector('.first') as HTMLInputElement;
    first.value = 'user state';

    el.state = 'second';
    await el.rendered;
    expect(el.shadowRoot?.querySelector('.second')).not.toBeNull();

    el.state = 'other';
    await el.rendered;
    expect(el.shadowRoot?.querySelector('.fallback')?.textContent).toBe('fallback');

    el.state = 'first';
    await el.rendered;
    expect(el.shadowRoot?.querySelector('.first')).toBe(first);
    expect((el.shadowRoot?.querySelector('.first') as HTMLInputElement).value).toBe('user state');
  });

  it('matches dynamic when values by identity and retains static matching', async () => {
    const loading = Symbol('loading');
    const ready = { state: 'ready' };

    @element('test-typed-when-flow')
    class TestTypedWhenFlow extends HTMLElement {
      @property({ attribute: false }) state: unknown = loading;

      @render()
      template() {
        return html`
          <case ${this.state}>
            <when ${loading}><p>loading</p></when>
            <when ${ready}><p>ready</p></when>
            <when value="1"><p>one</p></when>
            <default><p>unknown</p></default>
          </case>
        `;
      }
    }

    const el = document.createElement('test-typed-when-flow') as TestTypedWhenFlow;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot?.textContent?.trim()).toBe('loading');

    el.state = ready;
    await el.rendered;
    expect(el.shadowRoot?.textContent?.trim()).toBe('ready');

    el.state = { state: 'ready' };
    await el.rendered;
    expect(el.shadowRoot?.textContent?.trim()).toBe('unknown');

    el.state = 1;
    await el.rendered;
    expect(el.shadowRoot?.textContent?.trim()).toBe('one');
  });

  it('repeat preserves identity without wrapper elements and renders empty state', async () => {
    type Item = { id: number; label: string };

    @element('test-repeat-flow')
    class TestRepeatFlow extends HTMLElement {
      @property({ attribute: false }) items: Item[] = [
        { id: 1, label: 'one' },
        { id: 2, label: 'two' }
      ];

      @render()
      template() {
        return html`
          <ul>${repeat(this.items, {
            key: item => item.id,
            render: item => html`<li data-id=${item.id}>${item.label}</li>`,
            empty: () => html`<li class="empty">No items</li>`
          })}</ul>
        `;
      }
    }

    const el = document.createElement('test-repeat-flow') as TestRepeatFlow;
    container.appendChild(el);
    await el.ready;
    const first = el.shadowRoot?.querySelector('[data-id="1"]');

    el.items = [
      { id: 2, label: 'two updated' },
      { id: 1, label: 'one updated' }
    ];
    await el.rendered;
    expect(el.shadowRoot?.querySelector('[data-id="1"]')).toBe(first);
    expect([...el.shadowRoot!.querySelectorAll('li')].map(node => node.textContent)).toEqual([
      'two updated',
      'one updated'
    ]);
    expect(el.shadowRoot?.querySelector('snice-repeat-item')).toBeNull();

    el.items = [];
    await el.rendered;
    expect(el.shadowRoot?.querySelector('.empty')?.textContent).toBe('No items');
  });

  it('repeat rejects duplicate keys before reconciliation', () => {
    expect(() => repeat([1, 1], {
      key: value => value,
      render: value => value
    })).toThrow(/duplicate key/);
  });
});
