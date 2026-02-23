import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

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

}

/**
 * Map - React adapter for snice-map
 *
 * This is an auto-generated React wrapper for the Snice map component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/map';
 * import { Map } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Map />;
 * }
 * ```
 */
export const Map = createReactAdapter<MapProps>({
  tagName: 'snice-map',
  properties: ["center","zoom","minZoom","maxZoom","markers","tileUrl"],
  events: {},
  formAssociated: false
});
