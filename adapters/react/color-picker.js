import { createReactAdapter } from './wrapper';
/**
 * ColorPicker - React adapter for snice-color-picker
 *
 * This is an auto-generated React wrapper for the Snice color-picker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/color-picker';
 * import { ColorPicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ColorPicker />;
 * }
 * ```
 */
export const ColorPicker = createReactAdapter({
    tagName: 'snice-color-picker',
    properties: ["size", "value", "format", "label", "helperText", "errorText", "disabled", "loading", "required", "invalid", "name", "showInput", "showPresets", "presets"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=color-picker.js.map