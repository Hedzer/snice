import { element, property, render, styles, html, css } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import cssContent from './snice-layout-minimal.css?inline';

@element('snice-layout-minimal')
export class SniceLayoutMinimal extends HTMLElement implements Layout {
  /** Size to the parent element instead of filling the screen. */
  @property({ type: Boolean })
  contained = false;

  @render()
  render() {
    return html/*html*/`
      <div class="layout">
        <main class="main">
          <slot name="page"></slot>
        </main>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  private placards: Placard[] = [];
  private currentRoute = '';

  update(_appContext: AppContext, placards: Placard[], currentRoute: string, _routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;
  }
}