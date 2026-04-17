// GENERATED FILE — DO NOT EDIT.
// Source: components/app-tiles/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * AppTiles - React adapter for snice-app-tiles
 *
 * This is an auto-generated React wrapper for the Snice app-tiles component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/app-tiles';
 * import { AppTiles } from 'snice/react';
 *
 * function MyComponent() {
 *   return <AppTiles />;
 * }
 * ```
 */
export const AppTiles = createReactAdapter({
    tagName: 'snice-app-tiles',
    properties: ["tiles", "columns", "size", "variant"],
    events: { "tile-click": "onTileClick" },
    formAssociated: false
});
//# sourceMappingURL=app-tiles.js.map