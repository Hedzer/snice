import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

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

}

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
export const Location = createReactAdapter<LocationProps>({
  tagName: 'snice-location',
  properties: ["mode","name","address","city","state","country","zipCode","latitude","longitude","showMap","showIcon","icon","iconImage","mapUrl","clickable"],
  events: {},
  formAssociated: false
});
