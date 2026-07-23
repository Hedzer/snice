// GENERATED FILE — DO NOT EDIT.
// Source: components/input/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Input - React adapter for snice-input
 *
 * This is an auto-generated React wrapper for the Snice input component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/input/snice-input';
 * import { Input } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Input />;
 * }
 * ```
 */
export const Input = createReactAdapter({
    tagName: 'snice-input',
    properties: ["defaultValue", "type", "size", "variant", "placeholder", "label", "helperText", "errorText", "disabled", "readonly", "loading", "required", "invalid", "clearable", "password", "min", "max", "step", "pattern", "maxlength", "minlength", "autocomplete", "name", "align", "labelAlign", "stretch", "prefixIcon", "suffixIcon", "value"],
    events: { "input-input": "onInputInput", "input-change": "onInputChange", "input-focus": "onInputFocus", "input-blur": "onInputBlur", "input-clear": "onInputClear" },
    formAssociated: true
});
//# sourceMappingURL=input.js.map