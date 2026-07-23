// GENERATED FILE — DO NOT EDIT.
// Source: components/candlestick/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * Candlestick - React adapter for snice-candlestick
 *
 * This is an auto-generated React wrapper for the Snice candlestick component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/candlestick/snice-candlestick';
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
    events: { "candle-click": "onCandleClick", "candle-hover": "onCandleHover", "crosshair-move": "onCrosshairMove" },
    formAssociated: false
});
//# sourceMappingURL=candlestick.js.map