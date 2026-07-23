import { element, html, property, render } from '../../../packages/core/src/index';

export const directValue = { source: 'direct' };
export const spreadValue = { source: 'spread' };

@element('late-upgrade-binding-host')
export class LateUpgradeBindingHost extends HTMLElement {
  @render()
  template() {
    return html`
      <late-upgrade-binding-child id="direct" .value=${directValue}></late-upgrade-binding-child>
      <late-upgrade-binding-child id="spread" ...props=${{ value: spreadValue }}></late-upgrade-binding-child>
      <late-upgrade-binding-child id="false" .value=${false}></late-upgrade-binding-child>
      <late-upgrade-binding-child id="zero" .value=${0}></late-upgrade-binding-child>
      <late-upgrade-binding-child id="empty" .value=${''}></late-upgrade-binding-child>
      <late-upgrade-binding-child id="undefined" .value=${undefined}></late-upgrade-binding-child>
      <late-upgrade-binding-child id="attribute" value="authored" .value=${'bound'}></late-upgrade-binding-child>
    `;
  }
}

export function defineLateUpgradeBindingChild() {
  @element('late-upgrade-binding-child')
  class LateUpgradeBindingChild extends HTMLElement {
    @property() value: unknown = 'field-default';

    @render()
    template() {
      return html`<span>${String(this.value)}</span>`;
    }
  }

  return LateUpgradeBindingChild;
}
