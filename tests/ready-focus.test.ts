import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent } from './components/test-utils';

let counter = 0;
function tag(base: string) { return `test-${base}-${++counter}-${Date.now()}`; }

describe('@ready focus', () => {
  let els: HTMLElement[] = [];
  function track(el: HTMLElement) { els.push(el); return el; }
  afterEach(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    els.forEach(el => { try { removeComponent(el); } catch {} });
    els = [];
  });

  it('focus on nested snice-input from parent @ready works', async () => {
    const { element, query, ready, render, styles, html, css } = await import('snice');
    await import('../packages/components/src/input/snice-input');
    const t = tag('page');

    @element(t)
    class Page extends HTMLElement {
      @query('snice-input') input!: any;

      @ready()
      onReady() {
        this.input?.focus();
      }

      @render() renderContent() { return html`<snice-input label="Name"></snice-input>`; }
      @styles() componentStyles() { return css`:host { display: block; }`; }
    }

    const page = track(await createComponent(t));
    await page.ready;

    const input = page.shadowRoot?.querySelector('snice-input') as any;
    const inner = input?.shadowRoot?.querySelector('input');
    expect(inner).toBeTruthy();
    expect(input.shadowRoot.activeElement).toBe(inner);
  });

  it('honors autofocus on a host that upgrades after connection', async () => {
    const { element, render, html } = await import('snice');
    const t = tag('late-autofocus-host');
    const host = track(document.createElement(t) as any);
    host.setAttribute('autofocus', '');
    document.body.append(host);

    @element(t)
    class LateAutofocusHost extends HTMLElement {
      @render()
      template() {
        return html`<input data-target="inner">`;
      }
    }

    await customElements.whenDefined(t);
    const upgraded = document.querySelector(t) as any;
    if (upgraded !== host) track(upgraded);
    await upgraded.ready;
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    expect(document.activeElement).toBe(upgraded);
  });

  it('honors autofocus on a native control rendered inside a shadow root', async () => {
    const { element, render, html } = await import('snice');
    const t = tag('shadow-autofocus');

    @element(t)
    class ShadowAutofocus extends HTMLElement {
      @render()
      template() {
        return html`<input autofocus data-target="inner">`;
      }
    }

    const host = track(document.createElement(t) as any);
    document.body.append(host);
    await host.ready;
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    expect(document.activeElement).toBe(host);
    expect(host.shadowRoot.activeElement).toBe(host.shadowRoot.querySelector('[data-target="inner"]'));
  });

  it('does not replace focus that application code established during ready', async () => {
    const { element, ready, render, html } = await import('snice');
    const t = tag('ready-focus-wins');
    const existing = track(document.createElement('button'));
    document.body.append(existing);

    @element(t)
    class ReadyFocusWins extends HTMLElement {
      @ready()
      establishFocus() {
        existing.focus();
      }

      @render()
      template() {
        return html`<input autofocus>`;
      }
    }

    const host = track(document.createElement(t) as any);
    document.body.append(host);
    await host.ready;
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    expect(document.activeElement).toBe(existing);
  });
});
