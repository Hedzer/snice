import type { SniceElement, AppContext, Placard, RouteParams } from 'snice';

/**
 * Desktop collapse behaviour for shells with a sidebar.
 * - `rail`: shrink to an icon-width column so navigation stays reachable
 * - `offcanvas`: hide the sidebar entirely and give its space to main
 * - `none`: keep the sidebar pinned open and drop the toggle
 */
export type SidebarCollapseMode = 'rail' | 'offcanvas' | 'none';

export interface SniceLayoutElement extends SniceElement {
  // Layout update method called by router on navigation
  update?(
    appContext: AppContext,
    placards: Placard[],
    currentRoute: string,
    routeParams: RouteParams,
  ): void;
}