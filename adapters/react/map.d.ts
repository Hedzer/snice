import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the Map component
 */
export interface MapProps extends SniceBaseProps {
    center?: any;
    zoom?: any;
    minZoom?: any;
    maxZoom?: any;
    markers?: any;
    tileUrl?: any;
    onMapClick?: (event: any) => void;
    onMarkerClick?: (event: any) => void;
    onMapMove?: (event: any) => void;
    onMapZoom?: (event: any) => void;
}
/**
 * Map - React adapter for snice-map
 *
 * This is an auto-generated React wrapper for the Snice map component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/map/snice-map';
 * import { Map } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Map />;
 * }
 * ```
 */
export declare const Map: SniceReactComponent<MapProps, SniceComponentRef>;
//# sourceMappingURL=map.d.ts.map