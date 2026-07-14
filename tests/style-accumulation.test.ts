import { describe, it, expect, afterEach } from 'vitest';
import { element, property, render, html } from '../packages/core/src/index';

// Switching between two templates that each embed their own <style> must not
// accumulate <style> tags. The template-switch path preserved every <style>
// child (to protect the @styles() fallback), but couldn't tell a framework
// style from a template-emitted one, so each toggle kept the old and appended
// a new one — unbounded growth of stale, conflicting rules.
describe('template-emitted <style> tags do not accumulate on switch', () => {
  const els: HTMLElement[] = [];
  afterEach(() => els.splice(0).forEach((e) => e.remove()));

  it('stays at one template <style> across many toggles', async () => {
    const tag = `style-accum-${Math.random().toString(36).slice(2, 8)}`;
    @element(tag)
    class C extends HTMLElement {
      @property({ type: Boolean, attribute: false }) dark = false;
      @render()
      r() {
        return this.dark
          ? html`<style>:host{color:red}</style><div class="c">a</div>`
          : html`<style>:host{color:blue}</style><div class="c">b</div>`;
      }
    }

    const el = document.createElement(tag) as any;
    document.body.appendChild(el);
    els.push(el);
    await el.ready;

    const count = () => el.shadowRoot.querySelectorAll('style').length;
    expect(count()).toBe(1);

    for (let i = 0; i < 6; i++) {
      el.dark = !el.dark;
      await new Promise((r) => queueMicrotask(r));
    }

    // Exactly one template <style> remains — not one per toggle.
    expect(count()).toBe(1);
  });
});
