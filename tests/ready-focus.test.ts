import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent } from './components/test-utils';

let counter = 0;
function tag(base: string) { return `test-${base}-${++counter}-${Date.now()}`; }

describe('@ready focus', () => {
  let els: HTMLElement[] = [];
  function track(el: HTMLElement) { els.push(el); return el; }
  afterEach(() => { els.forEach(el => { try { removeComponent(el); } catch {} }); els = []; });

  it('focus on nested snice-input from parent @ready works', async () => {
    const { element, query, ready, render, styles, html, css } = await import('snice');
    await import('../components/input/snice-input');
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
});
