import { createReactAdapter } from './wrapper';
/**
 * Switch - React adapter for snice-switch
 *
 * This is an auto-generated React wrapper for the Snice switch component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/switch';
 * import { Switch } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Switch />;
 * }
 * ```
 */
export const Switch = createReactAdapter({
    tagName: 'snice-switch',
    properties: ["checked", "disabled", "loading", "required", "invalid", "size", "name", "value", "label", "labelOn", "labelOff"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=switch.js.map