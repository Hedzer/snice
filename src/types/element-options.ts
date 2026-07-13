/**
 * Options for configuring custom elements via the @element decorator
 */
export interface ElementOptions {
  /**
   * Whether this element is form-associated.
   * Form-associated elements can participate in form submission and validation.
   * When true, the element will have access to ElementInternals for form integration.
   *
   * @default false
   *
   * @example
   * ```typescript
   * @element('my-input', { formAssociated: true })
   * class MyInput extends HTMLElement {
   *   private internals!: ElementInternals;
   *
   *   constructor() {
   *     super();
   *     this.internals = this.attachInternals();
   *   }
   * }
   * ```
   */
  formAssociated?: boolean;

  /** Render into the host's light DOM instead of a shadow root. */
  renderRoot?: 'shadow' | 'light';

  /** Shadow-root mode, or false as shorthand for renderRoot: 'light'. */
  shadow?: ShadowRootMode | false;

  /** Forwarded to attachShadow when a shadow render root is created. */
  delegatesFocus?: boolean;
}
