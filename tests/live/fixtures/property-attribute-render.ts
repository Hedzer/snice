import { element, html, property, render } from '../../../packages/core/src/index';

@element('test-attr')
class TestAttributeElement extends HTMLElement {
  @property({ attribute: true }) variant = 'default';

  @render()
  template() {
    return html`<div class=${`variant-${this.variant}`}></div>`;
  }
}
