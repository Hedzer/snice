import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef, element, html, property, ref, render } from './test-imports';

describe('dynamic component syntax', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => container.remove());

  it('retargets every binding and preserves children when the tag changes', async () => {
    const current = createRef<HTMLElement>();

    @element('test-dynamic-component')
    class TestDynamicComponent extends HTMLElement {
      @property({ attribute: false }) tag: string | null = 'button';
      @property({ attribute: false }) label = 'Save';
      @property({ attribute: false }) disabled = false;
      clicks = 0;

      handleClick() {
        this.clicks++;
      }

      @render()
      template() {
        return html`
          <component ${this.tag}
            ${ref(current)}
            class="base"
            class:active=${true}
            data-label=${this.label}
            .customValue=${this.label}
            ?disabled=${this.disabled}
            @click=${this.handleClick}
          ><span>${this.label}</span></component>
        `;
      }
    }

    const el = document.createElement('test-dynamic-component') as TestDynamicComponent;
    container.appendChild(el);
    await el.ready;
    const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement & { customValue?: string };
    const child = button.querySelector('span');
    expect(current.value).toBe(button);
    expect(button.className).toBe('base active');
    expect(button.dataset.label).toBe('Save');
    expect(button.customValue).toBe('Save');

    button.click();
    expect(el.clicks).toBe(1);

    el.tag = 'a';
    el.label = 'Open';
    await el.rendered;
    const anchor = el.shadowRoot?.querySelector('a') as HTMLAnchorElement & { customValue?: string };
    expect(current.value).toBe(anchor);
    expect(anchor.querySelector('span')).toBe(child);
    expect(anchor.textContent).toBe('Open');
    expect(anchor.customValue).toBe('Open');
    anchor.click();
    expect(el.clicks).toBe(2);
  });

  it('supports null unmount and later remount without losing child DOM', async () => {
    @element('test-dynamic-component-null')
    class TestDynamicComponentNull extends HTMLElement {
      @property({ attribute: false }) tag: string | null = 'section';

      @render()
      template() {
        return html`<component ${this.tag}><input value="kept"></component>`;
      }
    }

    const el = document.createElement('test-dynamic-component-null') as TestDynamicComponentNull;
    container.appendChild(el);
    await el.ready;
    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
    input.value = 'user state';

    el.tag = null;
    await el.rendered;
    expect(el.shadowRoot?.querySelector('section')).toBeNull();

    el.tag = 'article';
    await el.rendered;
    expect(el.shadowRoot?.querySelector('input')).toBe(input);
    expect((el.shadowRoot?.querySelector('input') as HTMLInputElement).value).toBe('user state');
  });

  it('rejects invalid tag names without committing a partial tree', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    @element('test-dynamic-component-invalid')
    class TestDynamicComponentInvalid extends HTMLElement {
      @render()
      template() {
        return html`<component ${'<img onerror=bad>'}>unsafe</component>`;
      }
    }

    const el = document.createElement('test-dynamic-component-invalid') as TestDynamicComponentInvalid;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot?.childElementCount).toBe(0);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('can create table cells in parser-sensitive positions', async () => {
    @element('test-dynamic-table-cell')
    class TestDynamicTableCell extends HTMLElement {
      @property({ attribute: false }) tag = 'td';

      @render()
      template() {
        return html`<table><tbody><tr><component ${this.tag}>Cell</component></tr></tbody></table>`;
      }
    }

    const el = document.createElement('test-dynamic-table-cell') as TestDynamicTableCell;
    container.appendChild(el);
    await el.ready;
    expect(el.shadowRoot?.querySelector('tr > td')?.textContent).toBe('Cell');
  });

  it('preserves case-sensitive SVG tag names and namespace across switches', async () => {
    const createElementNS = vi.spyOn(document, 'createElementNS');
    @element('test-dynamic-svg-tag')
    class TestDynamicSvgTag extends HTMLElement {
      @property({ attribute: false }) tag = 'linearGradient';

      @render()
      template() {
        return html`<svg><defs><component ${this.tag} id="paint"><stop offset="1"></stop></component></defs></svg>`;
      }
    }

    const el = document.createElement('test-dynamic-svg-tag') as TestDynamicSvgTag;
    container.appendChild(el);
    await el.ready;
    const gradient = el.shadowRoot!.querySelector('#paint')!;
    const stop = gradient.firstElementChild;
    expect(gradient.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(createElementNS).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'linearGradient');

    el.tag = 'clipPath';
    await el.rendered;
    const clipPath = el.shadowRoot!.querySelector('#paint')!;
    expect(clipPath.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(createElementNS).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'clipPath');
    expect(clipPath.firstElementChild).toBe(stop);
    createElementNS.mockRestore();
  });

  it('parks children for HTML void targets and restores their identity later', async () => {
    @element('test-dynamic-void-tag')
    class TestDynamicVoidTag extends HTMLElement {
      @property({ attribute: false }) tag = 'input';
      @render() template() {
        return html`<component ${this.tag} class="target"><span>retained</span></component>`;
      }
    }

    const el = document.createElement('test-dynamic-void-tag') as TestDynamicVoidTag;
    container.appendChild(el);
    await el.ready;
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.childNodes).toHaveLength(0);
    expect(el.shadowRoot!.querySelector('span')).toBeNull();

    el.tag = 'section';
    await el.rendered;
    const span = el.shadowRoot!.querySelector('span')!;
    expect(span.textContent).toBe('retained');

    el.tag = 'img';
    await el.rendered;
    expect(el.shadowRoot!.querySelector('span')).toBeNull();
    el.tag = 'article';
    await el.rendered;
    expect(el.shadowRoot!.querySelector('span')).toBe(span);
  });

  it('uses the virtual element namespace at SVG HTML integration points', async () => {
    @element('test-dynamic-foreign-object')
    class TestDynamicForeignObject extends HTMLElement {
      @render() template() {
        return html`<svg><foreignObject><component ${'section'}><span>html</span></component></foreignObject></svg>`;
      }
    }

    const el = document.createElement('test-dynamic-foreign-object') as TestDynamicForeignObject;
    container.appendChild(el);
    await el.ready;
    const section = el.shadowRoot!.querySelector('section')!;
    expect(section.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
    expect(section.querySelector('span')?.textContent).toBe('html');
  });
});
