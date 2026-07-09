import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, property, watch, render, html } from '../src/index';

/**
 * @watch('typo') matches no @property and silently never fires — the framework
 * warns once per class at init so the mistake is visible.
 */
describe('@watch unknown-property warning', () => {
  let container: HTMLElement;
  let uniqueId = 0;

  const getUniqueTag = () => `watch-unknown-test-${++uniqueId}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  async function mount(tag: string) {
    const el = document.createElement(tag) as any;
    container.appendChild(el);
    await el.ready;
    return el;
  }

  it('warns when a watched name matches no @property', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const tag = getUniqueTag();

      @element(tag)
      class TypoWatch extends HTMLElement {
        @property() value = 'x';

        @watch('vlaue') // typo
        onChange() {}

        @render()
        renderContent() { return html`<div>x</div>`; }
      }

      await mount(tag);
      const calls = warnSpy.mock.calls.map(c => String(c[0]));
      expect(calls.some(c => c.includes("'vlaue'") && c.includes('never fire'))).toBe(true);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('does not warn for valid property, attribute-name, or wildcard watches', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const tag = getUniqueTag();

      @element(tag)
      class ValidWatch extends HTMLElement {
        @property({ attribute: 'user-name' }) userName = 'x';

        @watch('userName')
        onName() {}

        @watch('user-name') // explicit attribute form
        onAttr() {}

        @watch('*')
        onAny() {}

        @render()
        renderContent() { return html`<div>x</div>`; }
      }

      await mount(tag);
      const calls = warnSpy.mock.calls.map(c => String(c[0]));
      expect(calls.some(c => c.includes('never fire'))).toBe(false);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('warns once per class, not per instance', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const tag = getUniqueTag();

      @element(tag)
      class OnceWatch extends HTMLElement {
        @property() value = 'x';

        @watch('nope')
        onChange() {}

        @render()
        renderContent() { return html`<div>x</div>`; }
      }

      await mount(tag);
      await mount(tag);
      const hits = warnSpy.mock.calls.filter(c => String(c[0]).includes("'nope'"));
      expect(hits.length).toBe(1);
    } finally {
      warnSpy.mockRestore();
    }
  });
});
