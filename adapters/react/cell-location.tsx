// GENERATED FILE — DO NOT EDIT.
// Source: components/table/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the CellLocation component
 */
export interface CellLocationProps extends SniceBaseProps {
  value?: any;
  address?: any;
  latitude?: any;
  longitude?: any;
  showMapLink?: any;
  mapProvider?: any;
  showIcon?: any;
  column?: any;
  rowData?: any;
  align?: any;
  type?: any;

}

/**
 * CellLocation - React adapter for snice-cell-location
 *
 * This is an auto-generated React wrapper for the Snice cell-location component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/table/snice-cell-location';
 * import { CellLocation } from 'snice/react';
 *
 * function MyComponent() {
 *   return <CellLocation />;
 * }
 * ```
 */
export const CellLocation: SniceReactComponent<CellLocationProps, SniceComponentRef> = createReactAdapter<CellLocationProps, false>({
  tagName: 'snice-cell-location',
  properties: ["value","address","latitude","longitude","showMapLink","mapProvider","showIcon","column","rowData","align","type"],
  events: {},
  formAssociated: false
});
