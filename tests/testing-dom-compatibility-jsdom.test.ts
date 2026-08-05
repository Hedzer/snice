// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import '../packages/core/src/testing-dom';
import { element, html, render } from '../packages/core/src/index';

describe('DOM testing compatibility in jsdom', () => {
  it('provides browser-shaped autofocus reflection for generic hosts', () => {
    const host = document.createElement('div');

    host.autofocus = true;
    expect(host.hasAttribute('autofocus')).toBe(true);
    expect(host.autofocus).toBe(true);

    host.autofocus = false;
    expect(host.hasAttribute('autofocus')).toBe(false);
    expect(host.autofocus).toBe(false);
  });

  it('leaves native control autofocus reflection working', () => {
    for (const tag of ['input', 'button', 'select', 'textarea']) {
      const control = document.createElement(tag) as HTMLElement & { autofocus: boolean };
      control.autofocus = true;
      expect(control.hasAttribute('autofocus'), tag).toBe(true);
      expect(control.autofocus, tag).toBe(true);
    }
  });

  it('uses the same autofocus property path through a Snice host lifecycle', async () => {
    @element('test-jsdom-autofocus-host')
    class TestJsdomAutofocusHost extends HTMLElement {
      @render()
      template() { return html`<input>`; }

      focus() { this.shadowRoot?.querySelector('input')?.focus(); }
    }

    const host = document.createElement('test-jsdom-autofocus-host') as TestJsdomAutofocusHost;
    host.autofocus = true;
    document.body.append(host);
    await host.ready;
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

    expect(host.hasAttribute('autofocus')).toBe(true);
    expect(host.shadowRoot?.activeElement).toBe(host.shadowRoot?.querySelector('input'));
    host.remove();
  });
});
