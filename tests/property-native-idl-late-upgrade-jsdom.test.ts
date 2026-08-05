// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { element, html, property, render } from './test-imports';

describe('pre-upgrade property bindings that collide with native IDL', () => {
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
