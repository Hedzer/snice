import { layout, render, styles, html, css } from 'snice';
import type { Layout, AppContext, Placard, RouteParams } from 'snice';

@layout('minimal-layout')
export class MinimalLayout extends HTMLElement implements Layout {
  @render()
  renderContent() {
    return html/*html*/`
      <main class="minimal-content">
        <slot name="page"></slot>
      </main>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`
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
