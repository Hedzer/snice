import { element, html, property, render } from '../../../dist/index.esm.js';

export const scopedReactiveDirectRole = { applicationRole: 'dist-scoped-reactive-direct' };
export const scopedReactiveSpreadHidden = { applicationRole: 'dist-scoped-reactive-spread' };

export function defineScopedNativeIdlScenario() {
  const scopedRegistry = new CustomElementRegistry();

  class DistScopedNativeIdlChild extends HTMLElement {}
  scopedRegistry.define('dist-scoped-native-idl-child', DistScopedNativeIdlChild);
  class DistScopedLateNativeIdlChild extends HTMLElement {}

  @element('dist-scoped-reactive-idl-base')
  class DistScopedReactiveIdlBase extends HTMLElement {
    @property({ attribute: false }) role: any = null;
    @property({ attribute: false }) hidden: any = null;
  }
  class DistScopedReactiveIdlChild extends DistScopedReactiveIdlBase {}
  scopedRegistry.define('dist-scoped-reactive-idl-child', DistScopedReactiveIdlChild);

  @element('dist-scoped-native-idl-owner')
  class DistScopedNativeIdlOwner extends HTMLElement {
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
        <dist-scoped-native-idl-child data-native-direct .role=${this.nativeRole}></dist-scoped-native-idl-child>
        <dist-scoped-native-idl-child data-native-spread ...props=${this.nativeProps}></dist-scoped-native-idl-child>
        <dist-scoped-late-native-idl-child data-late-native-direct .role=${'switch'}></dist-scoped-late-native-idl-child>
        <dist-scoped-late-native-idl-child data-late-native-spread ...props=${{ hidden: true }}></dist-scoped-late-native-idl-child>
        <dist-scoped-reactive-idl-child data-reactive-direct .role=${scopedReactiveDirectRole}></dist-scoped-reactive-idl-child>
        <dist-scoped-reactive-idl-child data-reactive-spread ...props=${{ hidden: scopedReactiveSpreadHidden }}></dist-scoped-reactive-idl-child>
      `;
    }
  }

  return {
    DistScopedNativeIdlOwner,
    DistScopedNativeIdlChild,
    DistScopedReactiveIdlChild,
    async defineLateNativeIdlChild() {
      scopedRegistry.define('dist-scoped-late-native-idl-child', DistScopedLateNativeIdlChild);
      await scopedRegistry.whenDefined('dist-scoped-late-native-idl-child');
      await Promise.resolve();
      return DistScopedLateNativeIdlChild;
    },
  };
}
