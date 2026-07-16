// GENERATED FILE — DO NOT EDIT.
// Source: components/textarea/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
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
    properties: ["defaultValue", "size", "variant", "resize", "placeholder", "label", "helperText", "errorText", "disabled", "readonly", "loading", "required", "invalid", "rows", "cols", "maxlength", "minlength", "autocomplete", "name", "autoGrow", "value"],
    events: { "textarea-input": "onTextareaInput", "textarea-change": "onTextareaChange", "textarea-focus": "onTextareaFocus", "textarea-blur": "onTextareaBlur" },
    formAssociated: true
});
//# sourceMappingURL=textarea.js.map