import { describe, it, expect, afterEach } from 'vitest';
import { element, render, styles, html, css, property, ready, controller } from '../packages/core/src/index';
import { attachController, detachController } from '../packages/core/src/controller';

afterEach(() => { document.body.innerHTML = ''; });

// ---------------------------------------------------------------------------
// Audit claim 1 (Critical): element.ts — reconnect path skips [STYLES_APPLIED]
// reset → adoptedStyleSheets lost on reattach.
// ---------------------------------------------------------------------------
describe('audit: reconnect preserves shadow styles', () => {
  it('shadow tree retains its styles after detach + reattach', async () => {
    @element('snice-reconnect-styles-test')
    class Reconnect extends HTMLElement {
      @styles()
      css() { return css/*css*/`.token { color: rgb(1, 2, 3); }`; }

      @render()
      tpl() { return html/*html*/`<p class="token">hi</p>`; }
    }

    const el = document.createElement('snice-reconnect-styles-test') as any;
    document.body.appendChild(el);
    await el.ready;

    // Baseline: styles exist in shadow root (either via <style> or adoptedStyleSheets).
    const baselineStyleTags = el.shadowRoot.querySelectorAll('style').length;
    const baselineAdopted = (el.shadowRoot as any).adoptedStyleSheets?.length ?? 0;
    const baselineHasStyle = baselineStyleTags > 0 || baselineAdopted > 0;
    expect(baselineHasStyle).toBe(true);

    // Detach → reattach.
    el.remove();
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 30));

    const afterStyleTags = el.shadowRoot.querySelectorAll('style').length;
    const afterAdopted = (el.shadowRoot as any).adoptedStyleSheets?.length ?? 0;
    const afterHasStyle = afterStyleTags > 0 || afterAdopted > 0;
    // Claim: reconnect loses styles. Invert to prove: we expect styles to survive.
    expect(afterHasStyle).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Audit claim 2 (Critical): render.ts — disconnected elements leave
// RENDER_INSTANCE stale; property changes while disconnected are ignored on
// reconnect.
// ---------------------------------------------------------------------------
describe('audit: property changed while disconnected renders after reconnect', () => {
  it('after reconnect, the shadow reflects the property that changed while detached', async () => {
    @element('snice-reconnect-render-test')
    class ReconnectRender extends HTMLElement {
      @property({ type: Number, attribute: false }) count = 0;
      @render()
      tpl() { return html/*html*/`<span>${this.count}</span>`; }
    }

    const el = document.createElement('snice-reconnect-render-test') as any;
    document.body.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.textContent?.trim()).toBe('0');

    // Detach, change prop while detached, reattach.
    el.remove();
    el.count = 5;
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 50));

    // Claim: pending render was lost; reattach doesn't catch up.
    // We expect the fix: shadow reflects count=5.
    expect(el.shadowRoot.textContent?.trim()).toBe('5');
  });

  it('reflects a property changed while detached even when the flush runs before reattach', async () => {
    @element('snice-reconnect-render-late')
    class ReconnectRenderLate extends HTMLElement {
      @property({ type: Number, attribute: false }) count = 0;
      @render()
      tpl() { return html/*html*/`<span>${this.count}</span>`; }
    }

    const el = document.createElement('snice-reconnect-render-late') as any;
    document.body.appendChild(el);
    await el.ready;
    expect(el.shadowRoot.textContent?.trim()).toBe('0');

    // Detach, change prop, and LET THE MICROTASK FLUSH RUN while detached
    // (a real gap: setTimeout/route transition/async list op between the two).
    el.remove();
    el.count = 5;
    await new Promise(r => setTimeout(r, 0)); // flush skips the disconnected el

    // Reattach AFTER the dropped flush. Reconnect must catch up.
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 50));

    expect(el.shadowRoot.textContent?.trim()).toBe('5');
  });
});

// ---------------------------------------------------------------------------
// Audit claim 3 (Critical): controller.ts — attachController's
// `await element.ready` hangs if the element never connects.
// ---------------------------------------------------------------------------
describe('audit: attachController on a never-connected element does not hang', () => {
  it('detachController aborts a pending attachController waiting on .ready', async () => {
    @element('snice-never-connect-test')
    class NeverConnect extends HTMLElement {
      @ready() init() { /* no-op */ }
    }

    @controller('audit-never-connect-ctrl')
    class DummyController {
      element: any;
      async attach() { /* no-op */ }
      async detach() { /* no-op */ }
    }
    void DummyController;

    const el = document.createElement('snice-never-connect-test') as any;
    // Never appendChild — element stays floating.

    // attachController awaits `.ready` which will never resolve for this
    // element. With the fix, detachController aborts the wait and attach
    // rejects fast with a clear error.
    const attachPromise = attachController(el, 'audit-never-connect-ctrl');
    // Give attach a tick to enter the await, then detach to trigger abort.
    setTimeout(() => { try { detachController(el); } catch { /* ignore */ } }, 20);

    await expect(attachPromise).rejects.toThrow(/aborted|never connected|did not become ready/i);
  });
});

// ---------------------------------------------------------------------------
// Audit claim 4 (High): element.ts:245,262 — no isConnected check after
// microtask gaps in connectedCallback. If the element is removed during those
// gaps, render and @ready handlers still run on an orphan.
// ---------------------------------------------------------------------------
describe('audit: render/@ready skip when element removed during microtask gap', () => {
  it('removing the element between appendChild and its first render does not invoke @ready', async () => {
    let readyFired = false;

    @element('snice-microtask-gap-test')
    class MicrotaskGap extends HTMLElement {
      @ready() init() { readyFired = true; }
      @render()
      tpl() { return html/*html*/`<p>x</p>`; }
    }

    const el = document.createElement('snice-microtask-gap-test') as any;
    document.body.appendChild(el);
    // Remove synchronously — connectedCallback has queued microtasks to defer
    // render and @ready. When they run, element is detached.
    el.remove();

    // Wait for the deferred phases to complete.
    await new Promise(r => setTimeout(r, 50));

    // Claim: @ready still fires on the orphan. We expect the fix: @ready
    // should be skipped because the element was removed.
    expect(readyFired).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Audit claim 6 (Medium): on.ts:294 — `once: true` listeners duplicated
// across shadow root and host; removing one leaves the other armed.
// ---------------------------------------------------------------------------
describe('audit: @on with once:true fires only once across host and shadow', () => {
  it('once:true handler fires at most once total', async () => {
    const { on } = await import('../packages/core/src/index');

    let calls = 0;

    @element('snice-once-dedup-test')
    class OnceDedup extends HTMLElement {
      @on('custom-ping', { once: true })
      handle() { calls++; }

      @render()
      tpl() { return html/*html*/`<div></div>`; }
    }

    const el = document.createElement('snice-once-dedup-test') as any;
    document.body.appendChild(el);
    await el.ready;

    el.dispatchEvent(new CustomEvent('custom-ping', { bubbles: true }));
    el.dispatchEvent(new CustomEvent('custom-ping', { bubbles: true }));
    await new Promise(r => setTimeout(r, 10));

    expect(calls).toBe(1);
  });
});
