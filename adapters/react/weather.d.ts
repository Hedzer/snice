import type { SniceBaseProps } from './types';
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
 * import 'snice/components/weather';
 * import { Weather } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Weather />;
 * }
 * ```
 */
export declare const Weather: import("react").ForwardRefExoticComponent<Omit<WeatherProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=weather.d.ts.map