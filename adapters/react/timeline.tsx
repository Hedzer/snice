// GENERATED FILE — DO NOT EDIT.
// Source: components/timeline/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Timeline component
 */
export interface TimelineProps extends SniceBaseProps {
  orientation?: any;
  position?: any;
  items?: any;
  reverse?: any;

}

/**
 * Timeline - React adapter for snice-timeline
 *
 * This is an auto-generated React wrapper for the Snice timeline component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/timeline/snice-timeline';
 * import { Timeline } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Timeline />;
 * }
 * ```
 */
export const Timeline: SniceReactComponent<TimelineProps, SniceComponentRef> = createReactAdapter<TimelineProps, false>({
  tagName: 'snice-timeline',
  properties: ["orientation","position","items","reverse"],
  events: {},
  formAssociated: false
});
