// GENERATED FILE — DO NOT EDIT.
// Source: components/radio/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Radio - React adapter for snice-radio
 *
 * This is an auto-generated React wrapper for the Snice radio component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/radio';
 * import { Radio } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Radio />;
 * }
 * ```
 */
export const Radio = createReactAdapter({
    tagName: 'snice-radio',
    properties: ["checked", "disabled", "loading", "required", "invalid", "variant", "size", "name", "value", "label", "description"],
    events: { "radio-change": "onRadioChange" },
    formAssociated: true
});
//# sourceMappingURL=radio.js.map