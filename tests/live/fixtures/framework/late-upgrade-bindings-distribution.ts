import { element, html, property, render } from '/dist/index.esm.js';

export const directValue = { source: 'direct' };
export const spreadValue = { source: 'spread' };

@element('dist-late-upgrade-binding-host')
export class LateUpgradeBindingHost extends HTMLElement {
  @render()
  template() {
    return html`
      <dist-late-upgrade-binding-child id="direct" .value=${directValue}></dist-late-upgrade-binding-child>
      <dist-late-upgrade-binding-child id="spread" ...props=${{ value: spreadValue }}></dist-late-upgrade-binding-child>
      <dist-late-upgrade-binding-child id="false" .value=${false}></dist-late-upgrade-binding-child>
      <dist-late-upgrade-binding-child id="zero" .value=${0}></dist-late-upgrade-binding-child>
      <dist-late-upgrade-binding-child id="empty" .value=${''}></dist-late-upgrade-binding-child>
      <dist-late-upgrade-binding-child id="undefined" .value=${undefined}></dist-late-upgrade-binding-child>
      <dist-late-upgrade-binding-child id="attribute" value="authored" .value=${'bound'}></dist-late-upgrade-binding-child>
    `;
  }
}

export function defineLateUpgradeBindingChild() {
  @element('dist-late-upgrade-binding-child')
  class LateUpgradeBindingChild extends HTMLElement {
    @property() value: unknown = 'field-default';

    @render()
    template() {
      return html`<span>${String(this.value)}</span>`;
    }
  }

  return LateUpgradeBindingChild;
}
