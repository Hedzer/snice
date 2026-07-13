/**
 * Regression tests for the three framework mediums called out in
 * tmp/BUGS-2.md (Apr 22 audit). Each scenario exercises the bug shape;
 * passing means the fix is in place. Failure here = real regression.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { element, render, property, html, css } from '../src/index';

afterEach(() => { document.body.innerHTML = ''; });

// ─── 1. RenderScheduler: do not render disconnected elements ──────────────────

describe('RenderScheduler skips elements that disconnect before flush', () => {
  it('disconnecting between schedule() and microtask flush prevents the render', async () => {
    let renderCount = 0;

    @element('test-disconnect-render')
    class _T extends HTMLElement {
      @property({ type: Number, attribute: false }) value = 0;
      @render()
      template() {
        renderCount++;
        return html`<div>${this.value}</div>`;
      }
    }

    const el = document.createElement('test-disconnect-render') as any;
    document.body.appendChild(el);
    await el.ready;
    const initialRenders = renderCount;

    // Schedule a render then disconnect synchronously, before the microtask flush runs.
    el.value = 1;
    el.remove();

    // Yield long enough that any pending microtask + animation frame would run.
    await new Promise((r) => setTimeout(r, 50));

    expect(renderCount).toBe(initialRenders);
  });
});

// ─── 2. css`…`: works when adoptedStyleSheets is absent (older Safari/DOM shims) ──

describe('css`` is safe when constructable stylesheets are unavailable', () => {
  it('falls back to plain CSSResult when adoptedStyleSheets is missing', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'adoptedStyleSheets'
    );

    // Hide adoptedStyleSheets to simulate environments that don't expose it.
    if (originalDescriptor) {
      delete (Document.prototype as any).adoptedStyleSheets;
    }

    let result: any;
    expect(() => {
      result = css`
        :host { color: red; }
      `;
    }).not.toThrow();

    expect(result).toBeTruthy();
    expect(typeof result.cssText).toBe('string');
    expect(result.cssText).toMatch(/color: red/);
    // styleSheet is optional in this branch — should NOT have been created.
    expect(result.styleSheet).toBeUndefined();

    // Restore so subsequent tests still see adoptedStyleSheets.
    if (originalDescriptor) {
      Object.defineProperty(Document.prototype, 'adoptedStyleSheets', originalDescriptor);
    }
  });

  it('does not crash when CSSStyleSheet is undefined', () => {
    const originalCSSStyleSheet = (globalThis as any).CSSStyleSheet;
    (globalThis as any).CSSStyleSheet = undefined;

    let result: any;
    expect(() => {
      result = css`:host { color: blue; }`;
    }).not.toThrow();
    expect(result?.cssText).toMatch(/color: blue/);
    expect(result.styleSheet).toBeUndefined();

    (globalThis as any).CSSStyleSheet = originalCSSStyleSheet;
  });
});

// ─── 3. performTransition: overlapping calls don't corrupt container.style.position

describe('performTransition: overlapping transitions restore position correctly', () => {
  it('back-to-back transitions on the same container leave position as it started', async () => {
    const { performTransition, TransitionMode } = await import('../src/transitions');

    const container = document.createElement('div');
    container.style.position = 'static';
    document.body.appendChild(container);

    const oldA = document.createElement('div');
    const newA = document.createElement('div');
    const oldB = document.createElement('div');
    const newB = document.createElement('div');
    container.appendChild(oldA);

    const before = container.style.position; // ''/'static'

    // Kick off two overlapping transitions on the same container.
    const p1 = performTransition(container, oldA, newA, {
      mode: TransitionMode.SEQUENTIAL,
      outDuration: 30,
      inDuration: 30,
    });
    const p2 = performTransition(container, oldB, newB, {
      mode: TransitionMode.SEQUENTIAL,
      outDuration: 30,
      inDuration: 30,
    });

    await Promise.all([p1, p2]);

    // After both transitions resolve, position should match what it was before.
    expect(container.style.position).toBe(before);
  });
});
