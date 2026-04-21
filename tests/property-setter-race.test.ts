import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html } from '../src/index';

/**
 * Regression tests for the property-setter race condition where SETTING_FROM_PROPERTY
 * was cleared via setTimeout(0) instead of queueMicrotask().
 *
 * The bug: when a boolean attribute is set on an element via template binding
 * (?attr), the attributeChangedCallback fires which triggers the property setter,
 * which adds the attribute name to SETTING_FROM_PROPERTY and schedules its removal.
 * If the attribute is then removed in the *next* microtask batch (e.g. a follow-up
 * render), attributeChangedCallback runs again — but with setTimeout(0), the flag
 * is still set (setTimeout fires after all microtasks), so the watcher and re-render
 * are skipped, leaving stale internal state.
 *
 * The fix: use queueMicrotask() so the flag is cleared before the next render cycle.
 */
describe('Property setter race condition', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('clears SETTING_FROM_PROPERTY flag before the next microtask render cycle', async () => {
    @element('race-inner')
    class RaceInner extends HTMLElement {
      @property({ type: Boolean })
      disabled = false;

      @render()
      renderContent() {
        return html`<button class="${this.disabled ? 'is-disabled' : 'is-enabled'}">btn</button>`;
      }
    }

    @element('race-outer')
    class RaceOuter extends HTMLElement {
      @property({ type: Boolean })
      pass = false;

      @render()
      renderContent() {
        return html`<race-inner ?disabled="${this.pass}"></race-inner>`;
      }
    }

    const outer = document.createElement('race-outer') as any;
    container.appendChild(outer);

    // Cycle 1: enable disabled — outer renders, inner receives disabled attribute,
    // inner's attributeChangedCallback fires → property setter → adds flag →
    // schedules flag removal (queueMicrotask or setTimeout).
    outer.pass = true;
    // Yield only microtasks — if the fix is queueMicrotask, the flag is now cleared.
    // If it were setTimeout, the flag would still be set here.
    await new Promise<void>(resolve => queueMicrotask(resolve));
    await new Promise<void>(resolve => queueMicrotask(resolve));

    const inner = outer.shadowRoot!.querySelector('race-inner') as any;
    expect(inner.shadowRoot!.querySelector('.is-disabled')).toBeTruthy();

    // Cycle 2: remove disabled — outer re-renders, inner loses disabled attribute,
    // inner's attributeChangedCallback fires. With the bug (setTimeout), the flag
    // is still set here and the re-render is skipped.
    outer.pass = false;
    await new Promise<void>(resolve => queueMicrotask(resolve));
    await new Promise<void>(resolve => queueMicrotask(resolve));
    await new Promise<void>(resolve => queueMicrotask(resolve));

    // Inner must have re-rendered: button should reflect disabled=false
    expect(inner.shadowRoot!.querySelector('.is-enabled')).toBeTruthy();
    expect(inner.shadowRoot!.querySelector('.is-disabled')).toBeFalsy();
    expect(inner.disabled).toBe(false);
  });

  it('does not suppress watcher when attribute is removed after a JS property set', async () => {
    let watcherCalls: boolean[] = [];

    @element('race-watch')
    class RaceWatch extends HTMLElement {
      @property({ type: Boolean })
      active = false;

      @render()
      renderContent() {
        watcherCalls.push(this.active);
        return html`<span class="${this.active ? 'on' : 'off'}"></span>`;
      }
    }

    const el = document.createElement('race-watch') as any;
    container.appendChild(el);
    await new Promise<void>(resolve => queueMicrotask(resolve));

    watcherCalls = [];

    // Set via JS property (triggers property setter → sets attribute → schedules flag removal)
    el.active = true;
    // Yield microtasks so flag is cleared (queueMicrotask fix), but not a full setTimeout
    await new Promise<void>(resolve => queueMicrotask(resolve));
    await new Promise<void>(resolve => queueMicrotask(resolve));

    // Now remove the attribute directly (simulates a parent re-render removing ?active)
    el.removeAttribute('active');
    await new Promise<void>(resolve => queueMicrotask(resolve));
    await new Promise<void>(resolve => queueMicrotask(resolve));

    // Watcher should have fired twice: once for true, once for false
    expect(el.active).toBe(false);
    expect(el.shadowRoot!.querySelector('.off')).toBeTruthy();
    expect(watcherCalls).toContain(false);
  });
});
