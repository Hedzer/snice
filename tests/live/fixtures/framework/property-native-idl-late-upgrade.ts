import { element, html, property, render } from '../../../packages/core/src/index';

export const nativeIdlBoundRole = { applicationRole: 'results' };
export const registeredNativeIdlDirectRole = { applicationRole: 'registered-direct' };
export const registeredNativeIdlSpreadRole = { applicationRole: 'registered-spread' };
export const scopedReactiveDirectRole = { applicationRole: 'scoped-reactive-direct' };
export const scopedReactiveSpreadHidden = { applicationRole: 'scoped-reactive-spread' };

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

export function defineScopedNativeIdlScenario() {
  const scopedRegistry = new CustomElementRegistry();

  class LiveScopedNativeIdlChild extends HTMLElement {}
  scopedRegistry.define('live-scoped-native-idl-child', LiveScopedNativeIdlChild);
  class LiveScopedLateNativeIdlChild extends HTMLElement {}

  @element('live-scoped-reactive-idl-base')
  class LiveScopedReactiveIdlBase extends HTMLElement {
    @property({ attribute: false }) role: any = null;
    @property({ attribute: false }) hidden: any = null;
  }
  class LiveScopedReactiveIdlChild extends LiveScopedReactiveIdlBase {}
  scopedRegistry.define('live-scoped-reactive-idl-child', LiveScopedReactiveIdlChild);

  @element('live-scoped-native-idl-owner')
  class LiveScopedNativeIdlOwner extends HTMLElement {
    @property({ attribute: false }) nativeRole = 'button';
    @property({ attribute: false }) nativeProps: Record<string, unknown> = { hidden: true };

    createRenderRoot() {
      return this.attachShadow({
        mode: 'open',
        customElementRegistry: scopedRegistry,
      } as ShadowRootInit & { customElementRegistry: CustomElementRegistry });
    }

    @render()
    template() {
      return html`
        <live-scoped-native-idl-child data-native-direct .role=${this.nativeRole}></live-scoped-native-idl-child>
        <live-scoped-native-idl-child data-native-spread ...props=${this.nativeProps}></live-scoped-native-idl-child>
        <live-scoped-late-native-idl-child data-late-native-direct .role=${'switch'}></live-scoped-late-native-idl-child>
        <live-scoped-late-native-idl-child data-late-native-spread ...props=${{ hidden: true }}></live-scoped-late-native-idl-child>
        <live-scoped-reactive-idl-child data-reactive-direct .role=${scopedReactiveDirectRole}></live-scoped-reactive-idl-child>
        <live-scoped-reactive-idl-child data-reactive-spread ...props=${{ hidden: scopedReactiveSpreadHidden }}></live-scoped-reactive-idl-child>
      `;
    }
  }

  return {
    LiveScopedNativeIdlOwner,
    LiveScopedNativeIdlChild,
    LiveScopedReactiveIdlChild,
    async defineLateNativeIdlChild() {
      scopedRegistry.define('live-scoped-late-native-idl-child', LiveScopedLateNativeIdlChild);
      await scopedRegistry.whenDefined('live-scoped-late-native-idl-child');
      await Promise.resolve();
      return LiveScopedLateNativeIdlChild;
    },
  };
}
