import { element, html, on, render } from '/dist/index.esm.js';

@element('no-styles-delegation-distribution')
export class NoStylesDelegationDistribution extends HTMLElement {
  delegatedClicks = 0;
  directClicks = 0;

  @render()
  template() {
    return html`<button id="target">Go</button>`;
  }

  @on('click', '#target')
  handleDelegatedClick() {
    this.delegatedClicks++;
  }

  @on('click')
  handleDirectClick() {
    this.directClicks++;
  }
}
