import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Location component
 */
export interface LocationProps extends SniceBaseProps {
    mode?: any;
    name?: any;
    address?: any;
    city?: any;
    state?: any;
    country?: any;
    zipCode?: any;
    latitude?: any;
    longitude?: any;
    showMap?: any;
    showIcon?: any;
    icon?: any;
    iconImage?: any;
    mapUrl?: any;
    clickable?: any;
    onLocationClick?: (event: any) => void;
}
/**
 * Location - React adapter for snice-location
 *
 * This is an auto-generated React wrapper for the Snice location component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/location/snice-location';
 * import { Location } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Location />;
 * }
 * ```
 */
export declare const Location: SniceReactComponent<LocationProps, SniceComponentRef>;
//# sourceMappingURL=location.d.ts.map