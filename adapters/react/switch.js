// GENERATED FILE — DO NOT EDIT.
// Source: components/switch/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Switch - React adapter for snice-switch
 *
 * This is an auto-generated React wrapper for the Snice switch component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/switch/snice-switch';
 * import { Switch } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Switch />;
 * }
 * ```
 */
export const Switch = createReactAdapter({
    tagName: 'snice-switch',
    properties: ["defaultChecked", "disabled", "loading", "required", "invalid", "size", "name", "value", "label", "labelOn", "labelOff", "checked"],
    events: { "switch-change": "onSwitchChange" },
    formAssociated: true
});
//# sourceMappingURL=switch.js.map