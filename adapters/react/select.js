import { createReactAdapter } from './wrapper';
/**
 * Select - React adapter for snice-select
 *
 * This is an auto-generated React wrapper for the Snice select component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/select';
 * import { Select } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Select />;
 * }
 * ```
 */
export const Select = createReactAdapter({
    tagName: 'snice-select',
    properties: ["disabled", "required", "invalid", "readonly", "loading", "multiple", "searchable", "clearable", "allowFreeText", "editable", "remote", "searchDebounce", "open", "size", "name", "value", "label", "placeholder", "maxHeight", "options"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=select.js.map