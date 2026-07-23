// GENERATED FILE — DO NOT EDIT.
// Source: components/weather/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Weather component
 */
export interface WeatherProps extends SniceBaseProps {
  data?: any;
  unit?: any;
  variant?: any;

}

/**
 * Weather - React adapter for snice-weather
 *
 * This is an auto-generated React wrapper for the Snice weather component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/weather/snice-weather';
 * import { Weather } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Weather />;
 * }
 * ```
 */
export const Weather: SniceReactComponent<WeatherProps, SniceComponentRef> = createReactAdapter<WeatherProps, false>({
  tagName: 'snice-weather',
  properties: ["data","unit","variant"],
  events: {},
  formAssociated: false
});
