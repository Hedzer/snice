import { requestRender, renderElementNow } from './render';
import { ELEMENT_OPTIONS, SNICE_ELEMENT_BASE } from './symbols';
import type { ElementOptions } from './types/element-options';

/**
 * Optional authoring base for convention-driven Snice components.
 *
 * Decorators remain fully supported on plain HTMLElement subclasses. Extending
 * this class adds typed lifecycle promises, imperative invalidation, modern
 * kebab-case implicit attributes, and `render()` / static `styles` conventions.
 */
export class SniceElement extends HTMLElement {
  static propertyAttributeNaming: 'kebab' = 'kebab';

  protected createRenderRoot(): HTMLElement | ShadowRoot {
    const options = (this.constructor as any)[ELEMENT_OPTIONS] as ElementOptions | undefined;
    const mode = typeof options?.shadow === 'string' ? options.shadow : 'open';
    return this.attachShadow({ mode, delegatesFocus: options?.delegatesFocus });
  }

  invalidate(): Promise<void> {
    requestRender(this);
    return this.rendered;
  }

  renderNow(): Promise<void> {
    renderElementNow(this);
    return this.rendered;
  }
}

// Declaration merging exposes lifecycle promises without emitting class fields
// that could shadow the accessors installed by @element at runtime.
export interface SniceElement {
  readonly ready: Promise<void>;
  readonly rendered: Promise<void>;
}

// `@element` uses this inherited marker to enable render() conventions only
// for the opt-in base class. Plain HTMLElement components may legitimately
// have imperative helper methods named render().
Object.defineProperty(SniceElement.prototype, SNICE_ELEMENT_BASE, { value: true });
