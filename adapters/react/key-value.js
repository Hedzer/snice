import { createReactAdapter } from './wrapper';
/**
 * KeyValue - React adapter for snice-key-value
 *
 * This is an auto-generated React wrapper for the Snice key-value component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/key-value';
 * import { KeyValue } from 'snice/react';
 *
 * function MyComponent() {
 *   return <KeyValue />;
 * }
 * ```
 */
export const KeyValue = createReactAdapter({
    tagName: 'snice-key-value',
    properties: ["label", "autoExpand", "rows", "showDescription", "keyPlaceholder", "valuePlaceholder", "disabled", "readonly", "name", "variant", "mode", "showCopy", "items"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=key-value.js.map