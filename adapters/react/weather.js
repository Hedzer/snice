import { createReactAdapter } from './wrapper';
/**
 * Weather - React adapter for snice-weather
 *
 * This is an auto-generated React wrapper for the Snice weather component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/weather';
 * import { Weather } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Weather />;
 * }
 * ```
 */
export const Weather = createReactAdapter({
    tagName: 'snice-weather',
    properties: ["data", "unit", "variant"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=weather.js.map