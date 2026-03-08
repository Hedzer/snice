import { createReactAdapter } from './wrapper';
/**
 * Candlestick - React adapter for snice-candlestick
 *
 * This is an auto-generated React wrapper for the Snice candlestick component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/candlestick';
 * import { Candlestick } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Candlestick />;
 * }
 * ```
 */
export const Candlestick = createReactAdapter({
    tagName: 'snice-candlestick',
    properties: ["data", "showVolume", "showGrid", "showCrosshair", "bullishColor", "bearishColor", "timeFormat", "yAxisFormat", "zoomEnabled", "animation"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=candlestick.js.map