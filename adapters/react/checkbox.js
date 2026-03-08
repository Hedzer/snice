import { createReactAdapter } from './wrapper';
/**
 * Checkbox - React adapter for snice-checkbox
 *
 * This is an auto-generated React wrapper for the Snice checkbox component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/checkbox';
 * import { Checkbox } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Checkbox />;
 * }
 * ```
 */
export const Checkbox = createReactAdapter({
    tagName: 'snice-checkbox',
    properties: ["checked", "indeterminate", "disabled", "loading", "required", "invalid", "size", "name", "value", "label"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=checkbox.js.map