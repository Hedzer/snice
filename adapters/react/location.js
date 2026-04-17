// GENERATED FILE — DO NOT EDIT.
// Source: components/location/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Location - React adapter for snice-location
 *
 * This is an auto-generated React wrapper for the Snice location component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/location';
 * import { Location } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Location />;
 * }
 * ```
 */
export const Location = createReactAdapter({
    tagName: 'snice-location',
    properties: ["mode", "name", "address", "city", "state", "country", "zipCode", "latitude", "longitude", "showMap", "showIcon", "icon", "iconImage", "mapUrl", "clickable"],
    events: { "location-click": "onLocationClick" },
    formAssociated: false
});
//# sourceMappingURL=location.js.map