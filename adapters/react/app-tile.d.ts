import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the AppTile component
 */
export interface AppTileProps extends SniceBaseProps {
    'name'?: string;
    'icon'?: string;
    'color'?: string;
    'href'?: string;
    'badge'?: string | number;
}
/**
 * AppTile - React adapter for snice-app-tile
 *
 * This is an auto-generated React wrapper for the Snice app-tile component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/app-tiles/snice-app-tiles';
 * import { AppTile } from 'snice/react';
 *
 * function MyComponent() {
 *   return <AppTile />;
 * }
 * ```
 */
export declare const AppTile: SniceReactComponent<AppTileProps, SniceComponentRef>;
//# sourceMappingURL=app-tile.d.ts.map