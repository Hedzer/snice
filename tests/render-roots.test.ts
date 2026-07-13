import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SniceElement, css, element, html, property, query, render } from './test-imports';

describe('configurable render roots', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => container.remove());

  it('renders, styles, queries, and updates in light DOM', async () => {
    @element('test-light-render-root', { renderRoot: 'light' })
    class TestLightRenderRoot extends SniceElement {
      static styles = css`:host { display: block; }`;
      @property({ attribute: false }) count = 1;
      @query('button') button!: HTMLButtonElement;
      handlerThis: unknown;

      handleClick() {
        this.handlerThis = this;
        this.count++;
      }

      render() {
        return html`<button @click=${this.handleClick}>${this.count}</button>`;
      }
    }

    const el = document.createElement('test-light-render-root') as TestLightRenderRoot;
    el.appendChild(document.createElement('em'));
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot).toBeNull();
    expect(el.querySelector('em')).toBeNull();
    expect(el.querySelector('style')?.textContent).toContain('display: block');
    expect(el.button.textContent).toBe('1');

    el.button.click();
    await el.rendered;
    expect(el.handlerThis).toBe(el);
    expect(el.button.textContent).toBe('2');
    expect(el.querySelectorAll('style')).toHaveLength(1);
  });

  it('supports closed shadow roots while framework queries remain usable', async () => {
    @element('test-closed-render-root', { shadow: 'closed' })
    class TestClosedRenderRoot extends HTMLElement {
      @query('button') button!: HTMLButtonElement;

      @render()
      template() {
        return html`<button>closed</button>`;
      }
    }

    const el = document.createElement('test-closed-render-root') as TestClosedRenderRoot;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot).toBeNull();
    expect(el.button.textContent).toBe('closed');
  });

  it('supports shadow:false shorthand', async () => {
    @element('test-shadow-false-root', { shadow: false })
    class TestShadowFalseRoot extends HTMLElement {
      @render()
      template() {
        return html`<p>light</p>`;
      }
    }

    const el = document.createElement('test-shadow-false-root') as TestShadowFalseRoot;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot).toBeNull();
    expect(el.querySelector('p')?.textContent).toBe('light');
  });

  it('honors a custom createRenderRoot override', async () => {
    @element('test-custom-render-root')
    class TestCustomRenderRoot extends SniceElement {
      protected createRenderRoot() {
        return this.attachShadow({ mode: 'closed' });
      }

      @query('p') paragraph!: HTMLParagraphElement;

      render() {
        return html`<p>custom</p>`;
      }
    }

    const el = document.createElement('test-custom-render-root') as TestCustomRenderRoot;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot).toBeNull();
    expect(el.paragraph.textContent).toBe('custom');
  });

  it('rejects invalid custom render roots with a direct diagnostic', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    @element('test-invalid-render-root')
    class TestInvalidRenderRoot extends SniceElement {
      protected createRenderRoot(): any {
        return document.createDocumentFragment();
      }

      render() {
        return html`<p>bad</p>`;
      }
    }

    const el = document.createElement('test-invalid-render-root') as TestInvalidRenderRoot;
    container.appendChild(el);
    await el.ready;
    expect(error).toHaveBeenCalledWith(
      'Error rendering element:',
      expect.objectContaining({ message: expect.stringContaining('createRenderRoot') })
    );
    error.mockRestore();
  });

  it('honors shadow options on SniceElement and retains one root across reconnects', async () => {
    const attachShadow = vi.spyOn(HTMLElement.prototype, 'attachShadow');
    @element('test-base-shadow-options', { shadow: 'closed', delegatesFocus: true })
    class TestBaseShadowOptions extends SniceElement {
      @property({ attribute: false }) label = 'first';
      @query('button') button!: HTMLButtonElement;

      render() {
        return html`<button>${this.label}</button>`;
      }
    }

    const el = document.createElement('test-base-shadow-options') as TestBaseShadowOptions;
    container.appendChild(el);
    await el.ready;
    const root = el.button.getRootNode() as ShadowRoot;
    expect(el.shadowRoot).toBeNull();
    expect(root.mode).toBe('closed');
    expect(attachShadow).toHaveBeenCalledWith({ mode: 'closed', delegatesFocus: true });

    el.remove();
    el.label = 'second';
    container.appendChild(el);
    await el.rendered;
    expect(el.button.getRootNode()).toBe(root);
    expect(el.button.textContent).toBe('second');
    attachShadow.mockRestore();
  });

  it('falls back to style elements when a constructable sheet cannot cross realms', async () => {
    @element('test-cross-realm-style-fallback')
    class TestCrossRealmStyleFallback extends SniceElement {
      static styles = css`:host { color: rebeccapurple; }`;
      render() { return html`<p>styled</p>`; }
    }

    const el = document.createElement('test-cross-realm-style-fallback') as TestCrossRealmStyleFallback;
    const root = el.attachShadow({ mode: 'open' });
    const original = Object.getOwnPropertyDescriptor(root, 'adoptedStyleSheets');
    Object.defineProperty(root, 'adoptedStyleSheets', {
      configurable: true,
      get: () => [],
      set: () => { throw new DOMException('wrong document', 'NotAllowedError'); }
    });

    try {
      container.appendChild(el);
      await el.ready;
      const fallback = root.querySelector('style[data-snice-style]');
      expect(fallback?.textContent).toContain('rebeccapurple');
    } finally {
      if (original) Object.defineProperty(root, 'adoptedStyleSheets', original);
      else Reflect.deleteProperty(root, 'adoptedStyleSheets');
    }
  });

  it('validates conflicting options and lets explicit child options override an inherited root kind', async () => {
    expect(() => element('test-invalid-root-option', { renderRoot: 'other' as any })).toThrow(/renderRoot/);
    expect(() => element('test-invalid-shadow-option', { shadow: 'other' as any })).toThrow(/shadow/);
    expect(() => {
      @element('test-conflicting-root-options', { renderRoot: 'light', shadow: 'closed' })
      class TestConflictingRootOptions extends HTMLElement {}
      return TestConflictingRootOptions;
    }).toThrow(/conflicting render roots/);

    @element('test-inherited-light-root', { renderRoot: 'light' })
    class TestInheritedLightRoot extends SniceElement {
      render() { return html`<p>parent</p>`; }
    }
    @element('test-child-closed-root', { shadow: 'closed' })
    class TestChildClosedRoot extends TestInheritedLightRoot {
      @query('p') paragraph!: HTMLParagraphElement;
      render() { return html`<p>child closed</p>`; }
    }
    @element('test-child-open-root', { renderRoot: 'shadow' })
    class TestChildOpenRoot extends TestInheritedLightRoot {
      render() { return html`<p>child open</p>`; }
    }

    const closed = document.createElement('test-child-closed-root') as TestChildClosedRoot;
    const open = document.createElement('test-child-open-root') as TestChildOpenRoot;
    container.append(closed, open);
    await Promise.all([closed.ready, open.ready]);
    expect(closed.shadowRoot).toBeNull();
    expect(closed.paragraph.textContent).toBe('child closed');
    expect(open.shadowRoot?.querySelector('p')?.textContent).toBe('child open');
  });
});
