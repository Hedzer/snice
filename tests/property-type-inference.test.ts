import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html } from '../src/index';

/**
 * @property infers its attribute-parsing type from the initializer's runtime
 * type (Number/Boolean/Date/Array) — an explicit { type } is only needed when
 * there is no initializer to infer from.
 */
describe('@property type inference from initializer', () => {
  let container: HTMLElement;
  let uniqueId = 0;

  const getUniqueTag = () => `prop-infer-test-${++uniqueId}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('infers Number from a numeric initializer', async () => {
    const tag = getUniqueTag();

    @element(tag)
    class NumEl extends HTMLElement {
      @property() count = 0;

      @render()
      renderContent() { return html`<div>${this.count}</div>`; }
    }

    const el = document.createElement(tag) as any;
    el.setAttribute('count', '5');
    container.appendChild(el);
    await el.ready;

    expect(el.count).toBe(5);
    expect(typeof el.count).toBe('number');
  });

  it('infers Boolean from a boolean initializer', async () => {
    const tag = getUniqueTag();

    @element(tag)
    class BoolEl extends HTMLElement {
      @property() enabled = false;

      @render()
      renderContent() { return html`<div>x</div>`; }
    }

    const el = document.createElement(tag) as any;
    el.setAttribute('enabled', '');
    container.appendChild(el);
    await el.ready;

    expect(el.enabled).toBe(true);
    expect(typeof el.enabled).toBe('boolean');
  });

  it('without an initializer, attribute stays a string (explicit type needed)', async () => {
    const tag = getUniqueTag();

    @element(tag)
    class NoInitEl extends HTMLElement {
      @property() amount?: number;

      @render()
      renderContent() { return html`<div>x</div>`; }
    }

    const el = document.createElement(tag) as any;
    el.setAttribute('amount', '5');
    container.appendChild(el);
    await el.ready;

    expect(el.amount).toBe('5'); // no initializer → nothing to infer from
  });
});
