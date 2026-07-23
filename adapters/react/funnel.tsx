// GENERATED FILE — DO NOT EDIT.
// Source: components/funnel/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Funnel component
 */
export interface FunnelProps extends SniceBaseProps {
  data?: any;
  variant?: any;
  orientation?: any;
  showLabels?: any;
  showValues?: any;
  showPercentages?: any;
  animation?: any;
  onFunnelClick?: (event: any) => void;
  onFunnelHover?: (event: any) => void;
}

/**
 * Funnel - React adapter for snice-funnel
 *
 * This is an auto-generated React wrapper for the Snice funnel component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/funnel/snice-funnel';
 * import { Funnel } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Funnel />;
 * }
 * ```
 */
export const Funnel: SniceReactComponent<FunnelProps, SniceComponentRef> = createReactAdapter<FunnelProps, false>({
  tagName: 'snice-funnel',
  properties: ["data","variant","orientation","showLabels","showValues","showPercentages","animation"],
  events: {"funnel-click":"onFunnelClick","funnel-hover":"onFunnelHover"},
  formAssociated: false
});
