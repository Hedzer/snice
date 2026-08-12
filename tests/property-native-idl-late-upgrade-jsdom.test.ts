// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { element, html, property, render } from './test-imports';

describe('pre-upgrade property bindings that collide with native IDL', () => {
  it('parks direct and spread values when the registered Snice element has not upgraded the template clone yet', async () => {
    const directRole = { applicationRole: 'registered-direct' };
    const spreadRole = { applicationRole: 'registered-spread' };

    @element('test-registered-native-idl-child')
    class RegisteredNativeIdlChild extends HTMLElement {
      @property({ attribute: false }) role: any = null;
    }

    @element('test-registered-native-idl-owner')
    class RegisteredNativeIdlOwner extends HTMLElement {
      @render()
      template() {
        return html`
          <test-registered-native-idl-child id="direct" .role=${directRole}></test-registered-native-idl-child>
          <test-registered-native-idl-child id="spread" ...props=${{ role: spreadRole }}></test-registered-native-idl-child>
        `;
      }
    }

    const owner = document.createElement('test-registered-native-idl-owner') as RegisteredNativeIdlOwner;
    document.body.append(owner);
    await owner.ready;

    const direct = owner.shadowRoot!.querySelector('#direct') as RegisteredNativeIdlChild;
    const spread = owner.shadowRoot!.querySelector('#spread') as RegisteredNativeIdlChild;
    await Promise.all([direct.ready, spread.ready]);
    expect(direct.role).toBe(directRole);
    expect(direct.getAttribute('role')).toBeNull();
    expect(spread.role).toBe(spreadRole);
    expect(spread.getAttribute('role')).toBeNull();
    expect(Object.hasOwn(direct, 'role')).toBe(false);
    expect(Object.hasOwn(spread, 'role')).toBe(false);

    const updatedRole = { applicationRole: 'upgraded-direct-assignment' };
    direct.role = updatedRole;
    expect(direct.role).toBe(updatedRole);
    expect(direct.getAttribute('role')).toBeNull();
    owner.remove();
  });

  it('preserves every native-IDL-colliding reactive member on a registered template clone', async () => {
    const names = ['autofocus', 'dir', 'hidden', 'id', 'inert', 'lang', 'role', 'slot', 'title', 'translate'] as const;
    const values = Object.fromEntries(names.map(name => [name, { name }]));

    @element('test-registered-all-native-idl-child')
    class RegisteredAllNativeIdlChild extends HTMLElement {
      @property({ attribute: false }) autofocus: any = null;
      @property({ attribute: false }) dir: any = null;
      @property({ attribute: false }) hidden: any = null;
      @property({ attribute: false }) id: any = null;
      @property({ attribute: false }) inert: any = null;
      @property({ attribute: false }) lang: any = null;
      @property({ attribute: false }) role: any = null;
      @property({ attribute: false }) slot: any = null;
      @property({ attribute: false }) title: any = null;
      @property({ attribute: false }) translate: any = null;
    }

    @element('test-registered-all-native-idl-owner')
    class RegisteredAllNativeIdlOwner extends HTMLElement {
      @render()
      template() {
        return html`<test-registered-all-native-idl-child data-child ...props=${values}></test-registered-all-native-idl-child>`;
      }
    }

    const owner = document.createElement('test-registered-all-native-idl-owner') as RegisteredAllNativeIdlOwner;
    document.body.append(owner);
    await owner.ready;
    const child = owner.shadowRoot!.querySelector('[data-child]') as RegisteredAllNativeIdlChild;
    await child.ready;

    for (const name of names) {
      expect((child as any)[name], name).toBe(values[name]);
      expect(child.getAttribute(name), name).toBeNull();
      expect(Object.hasOwn(child, name), name).toBe(false);
    }
    owner.remove();
  });

  it('does not park a native property for a registered custom element that does not redeclare it', async () => {
    class NativeRoleChild extends HTMLElement {}
    customElements.define('test-registered-native-role-child', NativeRoleChild);

    @element('test-registered-native-role-owner')
    class NativeRoleOwner extends HTMLElement {
      @render()
      template() {
        return html`<test-registered-native-role-child .role=${'button'}></test-registered-native-role-child>`;
      }
    }

    const owner = document.createElement('test-registered-native-role-owner') as NativeRoleOwner;
    document.body.append(owner);
    await owner.ready;

    const child = owner.shadowRoot!.querySelector('test-registered-native-role-child') as NativeRoleChild;
    expect(child.role).toBe('button');
    expect(child.getAttribute('role')).toBe('button');
    expect(Object.hasOwn(child, 'role')).toBe(false);
    owner.remove();
  });

  it('preserves structured identity without writing the inherited ARIA role', async () => {
    const boundRole = { applicationRole: 'results' };

    @element('test-native-idl-binding-owner')
    class NativeIdlBindingOwner extends HTMLElement {
      @render()
      template() {
        return html`<test-native-idl-binding-child .role=${boundRole}></test-native-idl-binding-child>`;
      }
    }

    const owner = document.createElement('test-native-idl-binding-owner') as NativeIdlBindingOwner;
    document.body.append(owner);
    await owner.ready;

    const pending = owner.shadowRoot!.querySelector('test-native-idl-binding-child') as HTMLElement;
    expect(pending.getAttribute('role')).toBeNull();
    expect((pending as any).role).toBe(boundRole);

    @element('test-native-idl-binding-child')
    class NativeIdlBindingChild extends HTMLElement {
      @property({ attribute: false }) role: any = null;
    }

    await customElements.whenDefined('test-native-idl-binding-child');
    const upgraded = owner.shadowRoot!.querySelector('test-native-idl-binding-child') as NativeIdlBindingChild;
    await upgraded.ready;
    expect(upgraded.role).toBe(boundRole);
    expect(upgraded.getAttribute('role')).toBeNull();
    expect(Object.hasOwn(upgraded, 'role')).toBe(false);
    owner.remove();
  });

  it('preserves the same contract through a properties spread', async () => {
    const boundRole = { applicationRole: 'spread-results' };

    @element('test-native-idl-spread-owner')
    class NativeIdlSpreadOwner extends HTMLElement {
      @render()
      template() {
        return html`<test-native-idl-spread-child ...props=${{ role: boundRole }}></test-native-idl-spread-child>`;
      }
    }

    const owner = document.createElement('test-native-idl-spread-owner') as NativeIdlSpreadOwner;
    document.body.append(owner);
    await owner.ready;
    const pending = owner.shadowRoot!.querySelector('test-native-idl-spread-child') as HTMLElement;
    expect(pending.getAttribute('role')).toBeNull();
    expect((pending as any).role).toBe(boundRole);

    @element('test-native-idl-spread-child')
    class NativeIdlSpreadChild extends HTMLElement {
      @property({ attribute: false }) role: any = null;
    }

    await customElements.whenDefined('test-native-idl-spread-child');
    const upgraded = owner.shadowRoot!.querySelector('test-native-idl-spread-child') as NativeIdlSpreadChild;
    await upgraded.ready;
    expect(upgraded.role).toBe(boundRole);
    expect(upgraded.getAttribute('role')).toBeNull();
    owner.remove();
  });
});
