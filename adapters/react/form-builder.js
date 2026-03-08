import { createReactAdapter } from './wrapper';
/**
 * FormBuilder - React adapter for snice-form-builder
 *
 * This is an auto-generated React wrapper for the Snice form-builder component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/form-builder';
 * import { FormBuilder } from 'snice/react';
 *
 * function MyComponent() {
 *   return <FormBuilder />;
 * }
 * ```
 */
export const FormBuilder = createReactAdapter({
    tagName: 'snice-form-builder',
    properties: ["schema", "mode", "fieldTypes"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=form-builder.js.map