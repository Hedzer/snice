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
}
