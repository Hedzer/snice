import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, property, render, html, setStrictRenderErrors } from '../packages/core/src/index';

describe('strict render error mode', () => {
  let container: HTMLDivElement;
  let uniqueId = 0;

  const getUniqueTag = () => `render-error-test-${++uniqueId}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    setStrictRenderErrors(false);
    document.body.removeChild(container);
  });

  // Throws during COMMIT (inside the engine's render pass), not during the
  // render method call itself — that's the layer the error mode governs.
  const explodingIterable = {
    [Symbol.iterator](): Iterator<unknown> {
      throw new Error('template exploded');
    }
  };

  function makeThrowingElement() {
    const tag = getUniqueTag();

    @element(tag)
    class TestElement extends HTMLElement {
      @property({ type: Boolean }) blowUp = false;

      // sync renders so commit errors surface at the property assignment
      @render({ sync: true })
      renderContent() {
        return html`<div>${this.blowUp ? explodingIterable : 'fine'}</div>`;
      }
    }

    const el = document.createElement(tag) as HTMLElement & {
      blowUp: boolean; ready: Promise<void>;
    };
    container.appendChild(el);
    return el;
  }

  it('default: logs the render error and keeps the element alive', async () => {
    const el = makeThrowingElement();
    await el.ready;

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => { el.blowUp = true; }).not.toThrow();
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }

    // the element stays alive and recovers on the next good render
    el.blowUp = false;
    expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('fine');
  });

  it('strict: rethrows render errors instead of logging', async () => {
    const el = makeThrowingElement();
    await el.ready;

    setStrictRenderErrors(true);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => { el.blowUp = true; }).toThrow('template exploded');
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('strict mode can be turned back off', async () => {
    const el = makeThrowingElement();
    await el.ready;

    setStrictRenderErrors(true);
    setStrictRenderErrors(false);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => { el.blowUp = true; }).not.toThrow();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
