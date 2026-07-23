// GENERATED FILE — DO NOT EDIT.
// Source: components/key-value/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * KeyValue - React adapter for snice-key-value
 *
 * This is an auto-generated React wrapper for the Snice key-value component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/key-value/snice-key-value';
 * import { KeyValue } from 'snice/react';
 *
 * function MyComponent() {
 *   return <KeyValue />;
 * }
 * ```
 */
export const KeyValue = createReactAdapter({
    tagName: 'snice-key-value',
    properties: ["label", "autoExpand", "rows", "showDescription", "keyPlaceholder", "valuePlaceholder", "disabled", "readonly", "required", "name", "variant", "mode", "showCopy", "defaultValue", "placeholders", "value"],
    events: { "kv-add": "onKvAdd", "kv-remove": "onKvRemove", "kv-change": "onKvChange", "kv-copy": "onKvCopy" },
    formAssociated: true
});
//# sourceMappingURL=key-value.js.map