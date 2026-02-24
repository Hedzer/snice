import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the AppTiles component
 */
export interface AppTilesProps extends SniceBaseProps {
  tiles?: any;
  columns?: any;
  size?: any;
  variant?: any;

}

/**
 * AppTiles - React adapter for snice-app-tiles
 *
 * This is an auto-generated React wrapper for the Snice app-tiles component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/app-tiles';
 * import { AppTiles } from 'snice/react';
 *
 * function MyComponent() {
 *   return <AppTiles />;
 * }
 * ```
 */
export const AppTiles = createReactAdapter<AppTilesProps>({
  tagName: 'snice-app-tiles',
  properties: ["tiles","columns","size","variant"],
  events: {},
  formAssociated: false
});
