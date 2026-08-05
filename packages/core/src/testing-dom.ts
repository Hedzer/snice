/**
 * Standards-shaped DOM compatibility for non-browser test runners.
 *
 * This module only fills missing IDL surface. It never replaces an existing
 * implementation and does not attempt to simulate layout, paint, or browser
 * focus navigation.
 */

export type DOMTestingCompatibilityFeature = 'HTMLElement.autofocus';

export interface DOMTestingCompatibilityReport {
  /** Standards features installed because the current DOM omitted them. */
  installed: readonly DOMTestingCompatibilityFeature[];
}

interface DOMTestingGlobal {
  HTMLElement?: typeof HTMLElement;
}

/**
 * Fill proven DOM-runner IDL gaps without replacing native implementations.
 * Safe to call more than once.
 */
export function installDOMTestingCompatibility(
  scope: DOMTestingGlobal = globalThis as DOMTestingGlobal
): DOMTestingCompatibilityReport {
  const installed: DOMTestingCompatibilityFeature[] = [];
  const HTMLElementConstructor = scope.HTMLElement;
  if (!HTMLElementConstructor) return { installed };

  const prototype = HTMLElementConstructor.prototype;
  if (!('autofocus' in prototype)) {
    Object.defineProperty(prototype, 'autofocus', {
      configurable: true,
      enumerable: true,
      get(this: HTMLElement): boolean {
        return this.hasAttribute('autofocus');
      },
      set(this: HTMLElement, value: boolean) {
        this.toggleAttribute('autofocus', Boolean(value));
      },
    });
    installed.push('HTMLElement.autofocus');
  }

  return { installed };
}

/** Result of the side-effect installation performed by `snice/testing/dom`. */
export const domTestingCompatibility = installDOMTestingCompatibility();
