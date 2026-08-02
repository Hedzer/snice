import { test, expect } from 'vitest';
import { element, property, render, html, ready, styles, css } from 'snice';

function mount(tag) {
  const el = document.createElement(tag);
  document.body.appendChild(el);
  return el;
}

@element('ready-fix-async')
class ReadyFixAsync extends HTMLElement {
  readyResolved = false;

  @render()
  template() {
    return html`<div>${this.readyResolved ? 'ready' : 'not-ready'}</div>`;
  }

  @styles()
  s() { return css`:host { display: block; }`; }

  @ready()
  async init() {
    await new Promise(r => setTimeout(r, 200));
    this.readyResolved = true;
  }
}

@element('ready-fix-multi')
class ReadyFixMulti extends HTMLElement {
  order = [];

  @render()
  template() {
    return html`<div>${this.order.join(',')}</div>`;
  }

  @styles()
  s() { return css`:host { display: block; }`; }

  @ready()
  async first() {
    await new Promise(r => setTimeout(r, 150));
    this.order.push('first');
  }

  @ready()
  async second() {
    await new Promise(r => setTimeout(r, 50));
    this.order.push('second');
  }
}

@element('ready-fix-promise')
class ReadyFixPromise extends HTMLElement {
  value = 'initial';

  @render()
  template() {
    return html`<div>${this.value}</div>`;
  }

  @styles()
  s() { return css`:host { display: block; }`; }

  @ready()
  async init() {
    await new Promise(r => setTimeout(r, 300));
    this.value = 'loaded';
  }
}

test('await el.ready waits for async @ready() to complete', async () => {
  const el = mount('ready-fix-async');
  expect(el.readyResolved).toBe(false);
  await el.ready;
  expect(el.readyResolved).toBe(true);
});

test('multiple @ready() run serially, .ready waits for all', async () => {
  const el = mount('ready-fix-multi');
  await el.ready;
  expect(el.order).toEqual(['first', 'second']);
});

test('.ready resolves after async @ready() sets value', async () => {
  const el = mount('ready-fix-promise');
  expect(el.value).toBe('initial');
  await el.ready;
  expect(el.value).toBe('loaded');
});
