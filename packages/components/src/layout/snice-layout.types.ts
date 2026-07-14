import type { SniceElement, AppContext, Placard, RouteParams } from 'snice';

export interface SniceLayoutElement extends SniceElement {
  // Layout update method called by router on navigation
  update?(
    appContext: AppContext,
    placards: Placard[],
    currentRoute: string,
    routeParams: RouteParams,
  ): void;
}