import { element, html, on, render } from '/packages/core/src/index';

@element('no-styles-delegation-source')
export class NoStylesDelegationSource extends HTMLElement {
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
