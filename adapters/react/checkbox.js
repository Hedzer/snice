// GENERATED FILE — DO NOT EDIT.
// Source: components/checkbox/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Checkbox - React adapter for snice-checkbox
 *
 * This is an auto-generated React wrapper for the Snice checkbox component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/checkbox/snice-checkbox';
 * import { Checkbox } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Checkbox />;
 * }
 * ```
 */
export const Checkbox = createReactAdapter({
    tagName: 'snice-checkbox',
    properties: ["defaultChecked", "indeterminate", "disabled", "loading", "required", "invalid", "size", "name", "value", "label", "checked"],
    events: { "checkbox-change": "onCheckboxChange" },
    formAssociated: true
});
//# sourceMappingURL=checkbox.js.map