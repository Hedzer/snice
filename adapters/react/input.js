import { createReactAdapter } from './wrapper';
/**
 * Input - React adapter for snice-input
 *
 * This is an auto-generated React wrapper for the Snice input component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/input';
 * import { Input } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Input />;
 * }
 * ```
 */
export const Input = createReactAdapter({
    tagName: 'snice-input',
    properties: ["type", "size", "variant", "value", "placeholder", "label", "helperText", "errorText", "disabled", "readonly", "loading", "required", "invalid", "clearable", "password", "min", "max", "step", "pattern", "maxlength", "minlength", "autocomplete", "name", "align", "labelAlign", "stretch", "prefixIcon", "suffixIcon"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=input.js.map