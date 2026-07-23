import { type SniceReactComponent } from './wrapper';
import type { SniceBaseProps, SniceComponentRef } from './types';
/**
 * Props for the AppTiles component
 */
export interface AppTilesProps extends SniceBaseProps {
    tiles?: any;
    columns?: any;
    size?: any;
    variant?: any;
    onTileClick?: (event: any) => void;
}
/**
 * AppTiles - React adapter for snice-app-tiles
 *
 * This is an auto-generated React wrapper for the Snice app-tiles component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/app-tiles/snice-app-tiles';
 * import { AppTiles } from 'snice/react';
 *
 * function MyComponent() {
 *   return <AppTiles />;
 * }
 * ```
 */
export declare const AppTiles: SniceReactComponent<AppTilesProps, SniceComponentRef>;
//# sourceMappingURL=app-tiles.d.ts.map