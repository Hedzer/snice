import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Directive,
  attrs,
  createRef,
  directive,
  element,
  events,
  html,
  noChange,
  property,
  props,
  ref,
  render,
  use
} from './test-imports';

describe('template directives', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => container.remove());

  it('supports stateful custom directives in value parts', async () => {
    class UppercaseDirective extends Directive {
      render(value: unknown) {
        return String(value).toUpperCase();
      }
    }
    const uppercase = directive(UppercaseDirective);

    @element('test-public-directive')
    class TestPublicDirective extends HTMLElement {
      @property({ attribute: false }) value = 'first';

      @render()
      template() {
        return html`<p title=${uppercase(this.value)}>${uppercase(this.value)}</p>`;
      }
    }

    const el = document.createElement('test-public-directive') as TestPublicDirective;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot?.querySelector('p')?.textContent).toBe('FIRST');
    expect(el.shadowRoot?.querySelector('p')?.getAttribute('title')).toBe('FIRST');

    el.value = 'second';
    await el.rendered;
    expect(el.shadowRoot?.querySelector('p')?.textContent).toBe('SECOND');
  });

  it('assigns and clears refs as conditional branches connect', async () => {
    const button = createRef<HTMLButtonElement>();

    @element('test-ref-directive')
    class TestRefDirective extends HTMLElement {
      @property({ attribute: false }) visible = true;

      @render()
      template() {
        return html`<if ${this.visible}><button ${ref(button)}>Go</button></if>`;
      }
    }

    const el = document.createElement('test-ref-directive') as TestRefDirective;
    container.appendChild(el);
    await el.ready;
    expect(button.value?.textContent).toBe('Go');

    el.visible = false;
    await el.rendered;
    expect(button.value).toBeNull();

    el.visible = true;
    await el.rendered;
    expect(button.value?.textContent).toBe('Go');
  });

  it('runs use actions with update and teardown lifecycle', async () => {
    const destroy = vi.fn();
    const update = vi.fn();
    const action = vi.fn(() => ({ update, destroy }));

    @element('test-use-directive')
    class TestUseDirective extends HTMLElement {
      @property({ attribute: false }) value = 1;

      @render()
      template() {
        return html`<div ${use(action, this.value)}></div>`;
      }
    }

    const el = document.createElement('test-use-directive') as TestUseDirective;
    container.appendChild(el);
    await el.ready;
    expect(action).toHaveBeenCalledTimes(1);

    el.value = 2;
    await el.rendered;
    expect(update).toHaveBeenCalledWith(2);

    el.remove();
    await Promise.resolve();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('spreads properties, attributes, and events without leaving stale keys', async () => {
    const first = vi.fn();
    const second = vi.fn();

    @element('test-spread-directives')
    class TestSpreadDirectives extends HTMLElement {
      @property({ attribute: false }) alternate = false;

      @render()
      template() {
        const propertyValues = this.alternate ? { value: 'two' } : { value: 'one', custom: 7 };
        const attributeValues = this.alternate ? { title: 'second' } : { title: 'first', hidden: true };
        const eventValues = { click: this.alternate ? second : first };
        return html`
          <input
            ${props(propertyValues)}
            ${attrs(attributeValues)}
            ${events(eventValues)}
          >
        `;
      }
    }

    const el = document.createElement('test-spread-directives') as TestSpreadDirectives;
    container.appendChild(el);
    await el.ready;
    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement & { custom?: number };
    input.click();
    expect(input.value).toBe('one');
    expect(input.custom).toBe(7);
    expect(input.hidden).toBe(true);
    expect(first).toHaveBeenCalledTimes(1);

    el.alternate = true;
    await el.rendered;
    input.click();
    expect(input.value).toBe('two');
    expect(input.custom).toBeUndefined();
    expect(input.hidden).toBe(false);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('rejects non-directive expressions in an opening tag', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    @element('test-invalid-element-expression')
    class TestInvalidElementExpression extends HTMLElement {
      @render()
      template() {
        return html`<div ${noChange}>bad</div>`;
      }
    }

    const el = document.createElement('test-invalid-element-expression') as TestInvalidElementExpression;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot?.querySelector('div')).toBeNull();
    expect(error).toHaveBeenCalledWith(
      'Error rendering element:',
      expect.objectContaining({
        message: expect.stringContaining('opening tag')
      })
    );
  });
});
