// GENERATED FILE — DO NOT EDIT.
// Source: components/spotlight/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the Spotlight component
 */
export interface SpotlightProps extends SniceBaseProps {
  steps?: any;
  onSpotlightStart?: (event: any) => void;
  onSpotlightStep?: (event: any) => void;
  onSpotlightEnd?: (event: any) => void;
  onSpotlightSkip?: (event: any) => void;
  onSpotlightTargetMissing?: (event: any) => void;
}

/**
 * Spotlight - React adapter for snice-spotlight
 *
 * This is an auto-generated React wrapper for the Snice spotlight component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/spotlight/snice-spotlight';
 * import { Spotlight } from 'snice/react';
 *
 * function MyComponent() {
 *   return <Spotlight />;
 * }
 * ```
 */
export const Spotlight: SniceReactComponent<SpotlightProps, SniceComponentRef> = createReactAdapter<SpotlightProps, false>({
  tagName: 'snice-spotlight',
  properties: ["steps"],
  events: {"spotlight-start":"onSpotlightStart","spotlight-step":"onSpotlightStep","spotlight-end":"onSpotlightEnd","spotlight-skip":"onSpotlightSkip","spotlight-target-missing":"onSpotlightTargetMissing"},
  formAssociated: false
});
