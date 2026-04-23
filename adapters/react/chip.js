// GENERATED FILE — DO NOT EDIT.
// Source: components/chip/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Chip - React adapter for snice-chip
 *
 * This is an auto-generated React wrapper for the Snice chip component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/chip';
 * import { Chip } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Chip />;
 * }
 * ```
 */
export const Chip = createReactAdapter({
    tagName: 'snice-chip',
    properties: ["label", "variant", "size", "shape", "removable", "selectable", "selected", "disabled", "icon", "avatar", "hasIconSlot"],
    events: { "chip-click": "onChipClick", "chip-remove": "onChipRemove" },
    formAssociated: false
});
//# sourceMappingURL=chip.js.map