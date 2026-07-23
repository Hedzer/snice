// GENERATED FILE — DO NOT EDIT.
// Source: components/tooltip/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Tooltip component
 */
export interface TooltipProps extends SniceBaseProps {
  content?: any;
  position?: any;
  trigger?: any;
  delay?: any;
  hideDelay?: any;
  offset?: any;
  arrow?: any;
  open?: any;
  maxWidth?: any;
  zIndex?: any;
  strictPositioning?: any;

}

/**
 * Tooltip - React adapter for snice-tooltip
 *
 * This is an auto-generated React wrapper for the Snice tooltip component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/tooltip/snice-tooltip';
 * import { Tooltip } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Tooltip />;
 * }
 * ```
 */
export const Tooltip: SniceReactComponent<TooltipProps, SniceComponentRef> = createReactAdapter<TooltipProps, false>({
  tagName: 'snice-tooltip',
  properties: ["content","position","trigger","delay","hideDelay","offset","arrow","open","maxWidth","zIndex","strictPositioning"],
  events: {},
  formAssociated: false
});
