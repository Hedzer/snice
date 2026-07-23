// GENERATED FILE — DO NOT EDIT.
// Source: components/layout/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter, type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';


/**
 * Props for the LayoutFullscreen component
 */
export interface LayoutFullscreenProps extends SniceBaseProps {
  overlay?: any;

}

/**
 * LayoutFullscreen - React adapter for snice-layout-fullscreen
 *
 * This is an auto-generated React wrapper for the Snice layout-fullscreen component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/layout/snice-layout-fullscreen';
 * import { LayoutFullscreen } from 'snice/react';
 *
 * function MyComponent() {
 *   return <LayoutFullscreen />;
 * }
 * ```
 */
export const LayoutFullscreen: SniceReactComponent<LayoutFullscreenProps, SniceComponentRef> = createReactAdapter<LayoutFullscreenProps, false>({
  tagName: 'snice-layout-fullscreen',
  properties: ["overlay"],
  events: {},
  formAssociated: false
});
