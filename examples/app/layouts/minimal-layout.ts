import { layout } from '../../../src/index';
import type { Layout, AppContext, Placard, RouteParams } from '../../../src/index';

@layout('minimal-layout')
export class MinimalLayout extends HTMLElement implements Layout {
  html() {
    return /*html*/`
      <main class="minimal-content">
        <slot name="page"></slot>
      </main>
    `;
  }

  css() {
    return /*css*/`
      :host {
        display: block;
        min-height: 100vh;
      }

      .minimal-content {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
    `;
  }

  // Minimal layout doesn't need to do anything with placards,
  // but implements the interface for consistency
  update(appContext: AppContext, placards: Placard[], currentRoute: string, routeParams: RouteParams): void {
    // Intentionally empty - minimal layout has no navigation
  }
}
