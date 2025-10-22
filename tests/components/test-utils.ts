/**
 * Test utilities for component testing
 */

import { trackRenders } from '../../src/render-debug';

/**
 * Create a component element and append it to the document
 */
export async function createComponent<T extends HTMLElement>(
  tagName: string,
  attributes: Record<string, any> = {}
): Promise<T> {
  const el = document.createElement(tagName) as T;

  // Set attributes first (before connecting)
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'boolean') {
      // For boolean attributes, set attribute
      if (value) {
        el.setAttribute(key, '');
      } else {
        el.removeAttribute(key);
      }
    } else {
      el.setAttribute(key, String(value));
    }
  }

  document.body.appendChild(el);

  // Wait for element to be ready
  await (el as any).ready;

  // Now set properties after element is connected and ready
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'boolean') {
      // Convert kebab-case to camelCase and set property
      const propName = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      (el as any)[propName] = value;
    }
  }

  return el;
}

/**
 * Remove component from document
 */
export function removeComponent(el: HTMLElement) {
  el.remove();
}

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 1000,
  interval = 10
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timeout exceeded');
    }
    await wait(interval);
  }
}

/**
 * Get shadow root content
 */
export function getShadowRoot(el: HTMLElement): ShadowRoot {
  const shadowRoot = el.shadowRoot;
  if (!shadowRoot) {
    throw new Error('Element does not have shadow root');
  }
  return shadowRoot;
}

/**
 * Query selector within shadow root
 */
export function queryShadow<T extends Element = Element>(
  el: HTMLElement,
  selector: string
): T | null {
  return getShadowRoot(el).querySelector<T>(selector);
}

/**
 * Query all within shadow root
 */
export function queryShadowAll<T extends Element = Element>(
  el: HTMLElement,
  selector: string
): NodeListOf<T> {
  return getShadowRoot(el).querySelectorAll<T>(selector);
}

/**
 * Trigger a custom event on an element
 */
export function triggerEvent(
  el: HTMLElement,
  eventName: string,
  detail?: any
): boolean {
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: true,
    composed: true,
    cancelable: true
  });
  return el.dispatchEvent(event);
}

/**
 * Trigger a keyboard event
 */
export function triggerKeyboardEvent(
  el: HTMLElement,
  key: string,
  type: 'keydown' | 'keyup' | 'keypress' = 'keydown',
  options: Partial<KeyboardEventInit> = {}
): boolean {
  const event = new KeyboardEvent(type, {
    key,
    bubbles: true,
    cancelable: true,
    ...options
  });
  return el.dispatchEvent(event);
}

/**
 * Trigger a mouse event
 */
export function triggerMouseEvent(
  el: HTMLElement,
  type: 'click' | 'mousedown' | 'mouseup' | 'mousemove',
  options: Partial<MouseEventInit> = {}
): boolean {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    ...options
  });
  return el.dispatchEvent(event);
}

/**
 * Get computed style of an element
 */
export function getComputedStyleValue(el: HTMLElement, property: string): string {
  return window.getComputedStyle(el).getPropertyValue(property);
}

/**
 * Check if element has class (works with shadow DOM)
 */
export function hasClass(el: HTMLElement, className: string): boolean {
  return el.classList.contains(className);
}

/**
 * Set property on component
 */
export function setProperty<T extends HTMLElement>(
  el: T,
  property: keyof T,
  value: any
): void {
  (el as any)[property] = value;
}

/**
 * Get property from component
 */
export function getProperty<T extends HTMLElement>(
  el: T,
  property: keyof T
): any {
  return (el as any)[property];
}

/**
 * Track renders of an element using an async generator
 * Re-exported from render-debug for convenience in tests
 */
export { trackRenders };
