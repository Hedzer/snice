import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, controller, render, html } from '../src/index';

/**
 * Detaching an element before its controller finishes attaching is the
 * DESIGNED teardown path (list re-render, conditional flip, navigation),
 * not a failure — it must not log console.error. Real attach failures
 * (unknown controller, attach() throwing) stay loud.
 */
describe('controller attach-abort logging', () => {
  let container: HTMLElement;
  let uniqueId = 0;

  const getUniqueTag = () => `abort-log-test-${++uniqueId}`;
  const getUniqueController = () => `abort-log-ctrl-${++uniqueId}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('does not console.error when the element detaches before ready', async () => {
    const tag = getUniqueTag();
    const ctrlName = getUniqueController();

    @controller(ctrlName)
    class QuietCtrl {
      element: HTMLElement | null = null;
      attach(el: HTMLElement) { this.element = el; }
      detach() { this.element = null; }
    }

    @element(tag)
    class QuickEl extends HTMLElement {
      @render()
      renderContent() { return html`<div>x</div>`; }
    }

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    try {
      const el = document.createElement(tag) as any;
      el.setAttribute('controller', ctrlName);
      el.controller = ctrlName;
      container.appendChild(el);
      // remove immediately — before ready resolves — aborting the attach
      el.remove();

      await new Promise(r => setTimeout(r, 30));

      const attachErrors = errorSpy.mock.calls.filter(c =>
        String(c[0]).includes('Failed to attach controller')
      );
      expect(attachErrors.length).toBe(0);
      // the designed teardown surfaces at debug level instead
      expect(debugSpy.mock.calls.some(c => String(c[0]).includes('attach aborted'))).toBe(true);
    } finally {
      errorSpy.mockRestore();
      debugSpy.mockRestore();
    }
  });

  it('still console.errors for a genuinely unknown controller', async () => {
    const tag = getUniqueTag();

    @element(tag)
    class BadEl extends HTMLElement {
      @render()
      renderContent() { return html`<div>x</div>`; }
    }

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const el = document.createElement(tag) as any;
      container.appendChild(el);
      await el.ready;
      el.controller = 'does-not-exist-anywhere';

      await new Promise(r => setTimeout(r, 30));

      const attachErrors = errorSpy.mock.calls.filter(c =>
        String(c[0]).includes('Failed to attach controller')
      );
      expect(attachErrors.length).toBeGreaterThan(0);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
