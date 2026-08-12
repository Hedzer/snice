import { element, html, property, render } from '../../../packages/core/src/index';

export const nativeIdlBoundRole = { applicationRole: 'results' };
export const registeredNativeIdlDirectRole = { applicationRole: 'registered-direct' };
export const registeredNativeIdlSpreadRole = { applicationRole: 'registered-spread' };

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

export function defineRegisteredNativeIdlScenario() {
  @element('live-registered-native-idl-child')
  class LiveRegisteredNativeIdlChild extends HTMLElement {
    @property({ attribute: false }) role: any = null;
  }

  @element('live-registered-native-idl-owner')
  class LiveRegisteredNativeIdlOwner extends HTMLElement {
    @render()
    template() {
      return html`
        <live-registered-native-idl-child id="direct" .role=${registeredNativeIdlDirectRole}></live-registered-native-idl-child>
        <live-registered-native-idl-child id="spread" ...props=${{ role: registeredNativeIdlSpreadRole }}></live-registered-native-idl-child>
      `;
    }
  }

  return { LiveRegisteredNativeIdlChild, LiveRegisteredNativeIdlOwner };
}
