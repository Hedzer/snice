import { element, html, property, render } from '../../../packages/core/src/index';

export const nativeIdlBoundRole = { applicationRole: 'results' };

@element('live-native-idl-binding-owner')
export class LiveNativeIdlBindingOwner extends HTMLElement {
  @render()
  template() {
    return html`<live-native-idl-binding-child .role=${nativeIdlBoundRole}></live-native-idl-binding-child>`;
  }
}

export function defineNativeIdlBindingChild() {
  @element('live-native-idl-binding-child')
  class LiveNativeIdlBindingChild extends HTMLElement {
    @property({ attribute: false }) role: any = null;
  }

  return LiveNativeIdlBindingChild;
}
