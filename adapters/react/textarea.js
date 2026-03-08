import { createReactAdapter } from './wrapper';
/**
 * Textarea - React adapter for snice-textarea
 *
 * This is an auto-generated React wrapper for the Snice textarea component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/textarea';
 * import { Textarea } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Textarea />;
 * }
 * ```
 */
export const Textarea = createReactAdapter({
    tagName: 'snice-textarea',
    properties: ["size", "variant", "resize", "value", "placeholder", "label", "helperText", "errorText", "disabled", "readonly", "loading", "required", "invalid", "rows", "cols", "maxlength", "minlength", "autocomplete", "name", "autoGrow"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=textarea.js.map