export interface AppTile {
  id: string;
  name: string;
  icon: string;
  color?: string;
  href?: string;
  badge?: string;
}

export type AppTilesVariant = 'grid' | 'list' | 'compact';

export interface SniceAppTilesElement extends HTMLElement {
  tiles: AppTile[];
  columns: number;
  size: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant: AppTilesVariant;
}

export interface TileClickDetail {
  tile: AppTile;
  index: number;
}

export interface SniceAppTilesEventMap {
  'tile-click': CustomEvent<TileClickDetail>;
}
