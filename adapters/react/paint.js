// GENERATED FILE — DO NOT EDIT.
// Source: components/paint/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Paint - React adapter for snice-paint
 *
 * This is an auto-generated React wrapper for the Snice paint component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/paint';
 * import { Paint } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Paint />;
 * }
 * ```
 */
export const Paint = createReactAdapter({
    tagName: 'snice-paint',
    properties: ["color", "strokeWidth", "minStrokeWidth", "maxStrokeWidth", "controls", "backgroundColor", "colorSelects", "disabled", "tool"],
    events: { "color-select": "onColorSelect", "paint-start": "onPaintStart", "paint-end": "onPaintEnd", "paint-clear": "onPaintClear", "paint-undo": "onPaintUndo", "paint-redo": "onPaintRedo" },
    formAssociated: false
});
//# sourceMappingURL=paint.js.map