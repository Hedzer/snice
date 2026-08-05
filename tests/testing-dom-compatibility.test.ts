import { describe, expect, it } from 'vitest';
import {
  domTestingCompatibility,
  installDOMTestingCompatibility,
} from '../packages/core/src/testing-dom';

describe('DOM testing compatibility in happy-dom', () => {
  it('provides browser-shaped autofocus reflection for generic hosts', () => {
    const host = document.createElement('div');

    host.autofocus = true;
    expect(host.hasAttribute('autofocus')).toBe(true);
    expect(host.autofocus).toBe(true);

    host.autofocus = false;
    expect(host.hasAttribute('autofocus')).toBe(false);
    expect(host.autofocus).toBe(false);
  });

  it('is idempotent and reports no second installation', () => {
    expect(domTestingCompatibility.installed.every(feature => feature === 'HTMLElement.autofocus')).toBe(true);
    expect(installDOMTestingCompatibility().installed).toEqual([]);
  });

  it('does not replace an existing DOM implementation', () => {
    class ExistingHTMLElement {}
    Object.defineProperty(ExistingHTMLElement.prototype, 'autofocus', {
      configurable: true,
      get: () => false,
      set: () => {},
    });
    const descriptor = Object.getOwnPropertyDescriptor(ExistingHTMLElement.prototype, 'autofocus');
    const scope = { HTMLElement: ExistingHTMLElement as unknown as typeof HTMLElement };

    expect(installDOMTestingCompatibility(scope).installed).toEqual([]);
    expect(Object.getOwnPropertyDescriptor(ExistingHTMLElement.prototype, 'autofocus')).toEqual(descriptor);
  });
});
