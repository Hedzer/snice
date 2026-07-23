// GENERATED FILE — DO NOT EDIT.
// Source: components/color-picker/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * ColorPicker - React adapter for snice-color-picker
 *
 * This is an auto-generated React wrapper for the Snice color-picker component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/color-picker/snice-color-picker';
 * import { ColorPicker } from 'snice/react';
 *
 * function MyComponent() {
 *   return <ColorPicker />;
 * }
 * ```
 */
export const ColorPicker = createReactAdapter({
    tagName: 'snice-color-picker',
    properties: ["defaultValue", "size", "format", "label", "helperText", "errorText", "disabled", "loading", "required", "invalid", "name", "showInput", "showPresets", "presets", "value"],
    events: { "color-picker-input": "onColorPickerInput", "color-picker-change": "onColorPickerChange", "color-picker-focus": "onColorPickerFocus", "color-picker-blur": "onColorPickerBlur" },
    formAssociated: true
});
//# sourceMappingURL=color-picker.js.map