import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, property, render, html } from '../packages/core/src/index';

/**
 * Regression tests for observed attributes in environments without Symbol.metadata.
 *
 * The bug: when Symbol.metadata is unavailable (e.g. older browsers), @property
 * decorators cannot share property options with @element via context.metadata.
 * This caused observedAttributes to only contain ['controller'], so
 * attributeChangedCallback never fired for property attributes like 'disabled'.
 * As a result, externally setting an attribute (e.g. ?disabled from a parent
 * template) never triggered a re-render.
 *
 * The fix: a module-level _pendingProperties stack lets @property (field
 * decorator, runs before @element) pass options to @element (class decorator)
 * without relying on Symbol.metadata.
 */
describe('observedAttributes fallback when Symbol.metadata is unavailable', () => {
  let container: HTMLElement;
  let originalSymbolMetadata: symbol | undefined;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Simulate an environment without Symbol.metadata
    originalSymbolMetadata = (Symbol as any).metadata;
    delete (Symbol as any).metadata;
  });

  afterEach(() => {
    container.remove();
    if (originalSymbolMetadata !== undefined) {
      (Symbol as any).metadata = originalSymbolMetadata;
    }
  });

  it('includes @property attributes in observedAttributes when Symbol.metadata is absent', () => {
    @element('obs-fallback-check')
    class ObsFallbackCheck extends HTMLElement {
      @property({ type: Boolean })
      disabled = false;

      @property()
      label = '';

      @render()
      renderContent() {
        return html`<span>${this.label}</span>`;
      }
    }

    const observed = (ObsFallbackCheck as any).observedAttributes as string[];
    expect(observed).toContain('disabled');
    expect(observed).toContain('label');
  });

  it('re-renders when an attribute is set externally and Symbol.metadata is absent', async () => {
    @element('obs-fallback-rerender')
    class ObsFallbackRerender extends HTMLElement {
      @property({ type: Boolean })
      active = false;

      @render()
      renderContent() {
        return html`<span class="${this.active ? 'is-on' : 'is-off'}"></span>`;
      }
    }

    const el = document.createElement('obs-fallback-rerender') as any;
    container.appendChild(el);
    await el.ready;

    expect(el.shadowRoot!.querySelector('.is-off')).toBeTruthy();

    // Simulate what a parent's BooleanAttributePart does
    el.setAttribute('active', '');
    await new Promise<void>(r => queueMicrotask(r));
    await new Promise<void>(r => queueMicrotask(r));

    expect(el.shadowRoot!.querySelector('.is-on')).toBeTruthy();
    expect(el.shadowRoot!.querySelector('.is-off')).toBeFalsy();

    el.removeAttribute('active');
    await new Promise<void>(r => queueMicrotask(r));
    await new Promise<void>(r => queueMicrotask(r));

    expect(el.shadowRoot!.querySelector('.is-off')).toBeTruthy();
    expect(el.shadowRoot!.querySelector('.is-on')).toBeFalsy();
  });

  it('handles nested elements where parent sets attribute on child externally', async () => {
    @element('obs-child-elem')
    class ObsChild extends HTMLElement {
      @property({ type: Boolean })
      disabled = false;

      @render()
      renderContent() {
        return html`<button ?disabled="${this.disabled}" class="${this.disabled ? 'btn-disabled' : 'btn-enabled'}"></button>`;
      }
    }

    @element('obs-parent-elem')
    class ObsParent extends HTMLElement {
      @property({ type: Boolean })
      disabled = false;

      @render()
      renderContent() {
        return html`<obs-child-elem ?disabled="${this.disabled}"></obs-child-elem>`;
      }
    }

    const parent = document.createElement('obs-parent-elem') as any;
    container.appendChild(parent);
    await parent.ready;

    const child = parent.shadowRoot!.querySelector('obs-child-elem') as any;
    expect(child.shadowRoot!.querySelector('.btn-enabled')).toBeTruthy();

    parent.disabled = true;
    await new Promise<void>(r => queueMicrotask(r));
    await new Promise<void>(r => queueMicrotask(r));
    await new Promise<void>(r => queueMicrotask(r));

    expect(child.shadowRoot!.querySelector('.btn-disabled')).toBeTruthy();
    expect(child.shadowRoot!.querySelector('button[disabled]')).toBeTruthy();

    parent.disabled = false;
    await new Promise<void>(r => queueMicrotask(r));
    await new Promise<void>(r => queueMicrotask(r));
    await new Promise<void>(r => queueMicrotask(r));

    expect(child.shadowRoot!.querySelector('.btn-enabled')).toBeTruthy();
    expect(child.shadowRoot!.querySelector('button:not([disabled])')).toBeTruthy();
  });
});
