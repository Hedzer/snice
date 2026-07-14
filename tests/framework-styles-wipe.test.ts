import { describe, it, expect, afterEach } from 'vitest';
import { element, render, styles, html, css, property } from '../packages/core/src/index';

afterEach(() => { document.body.innerHTML = ''; });

// In environments without adoptedStyleSheets (older Safari and DOM shims), @styles falls
// back to appending <style> tags. On a template identity change, performRender
// does `shadowRoot.innerHTML = ''` which wipes those <style> tags → component
// loses its styles. Verify styles survive template switch.

describe('render: fallback <style> tags survive template identity change', () => {
  it('style tags remain in shadow after template switches', async () => {
    // Force fallback path by hiding adoptedStyleSheets support on ShadowRoot
    const origDesc = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, 'adoptedStyleSheets');
    Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
      configurable: true,
      get() { return undefined; },
      set() { /* no-op: fallback path must be taken */ },
    });

    try {
      @element('snice-fallback-styles-test')
      class FallbackStyles extends HTMLElement {
        @property({ type: Boolean, attribute: false })
        alt = false;

        @styles()
        stylesheet() {
          return css/*css*/`.card { color: red; }`;
        }

        @render()
        template() {
          return this.alt
            ? html/*html*/`<section class="card">alt</section>`
            : html/*html*/`<div class="card">base</div>`;
        }
      }

      const el = document.createElement('snice-fallback-styles-test') as any;
      document.body.appendChild(el);
      await el.ready;

      // Confirm fallback path: at least one <style> tag in shadow
      const shadowStylesBefore = el.shadowRoot.querySelectorAll('style').length;
      expect(shadowStylesBefore).toBeGreaterThan(0);
      expect(el.shadowRoot.querySelector('.card')?.textContent).toBe('base');

      // Trigger template identity change (switch between two different templates)
      el.alt = true;
      await new Promise(r => setTimeout(r, 20));

      // With the bug: innerHTML='' wiped the <style> tag.
      // With the fix: style tag preserved OR re-injected.
      const shadowStylesAfter = el.shadowRoot.querySelectorAll('style').length;
      expect(shadowStylesAfter).toBeGreaterThan(0);
      expect(el.shadowRoot.querySelector('.card')?.textContent).toBe('alt');
    } finally {
      if (origDesc) Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', origDesc);
    }
  });
});
