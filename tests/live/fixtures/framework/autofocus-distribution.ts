import { element, html, query, render } from '/dist/index.esm.js';

function autofocusTemplate(kind: string) {
  return html`
    <input data-kind="fallback">
    <input data-kind="input" ?autofocus=${kind === 'input'}>
    <textarea data-kind="textarea" ?autofocus=${kind === 'textarea'}></textarea>
    <button data-kind="button" ?autofocus=${kind === 'button'}>Button</button>
    <select data-kind="select" ?autofocus=${kind === 'select'}>
      <option>Option</option>
    </select>
    <div data-kind="tabindex" tabindex="0" ?autofocus=${kind === 'tabindex'}>Focusable</div>
  `;
}

@element('autofocus-distribution-host')
export class AutofocusDistributionHost extends HTMLElement {
  @render()
  template() {
    return autofocusTemplate(this.getAttribute('kind') || 'host');
  }

  get focusedKind(): string | null {
    return this.shadowRoot?.activeElement?.getAttribute('data-kind') ?? null;
  }
}

@element('autofocus-distribution-closed-host', { shadow: 'closed' })
export class AutofocusDistributionClosedHost extends HTMLElement {
  @query('[autofocus]')
  autofocusTarget?: HTMLElement;

  @render()
  template() {
    return html`<input autofocus data-kind="closed-input">`;
  }

  get focusedKind(): string | null {
    const target = this.autofocusTarget;
    if (!target) return null;
    const root = target.getRootNode() as ShadowRoot;
    return root.activeElement === target ? target.getAttribute('data-kind') : null;
  }
}
