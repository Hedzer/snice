import { element, property, render, styles, html, css } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import cssContent from './snice-layout-fullscreen.css?inline';

@element('snice-layout-fullscreen')
export class SniceLayoutFullscreen extends HTMLElement implements Layout {
  @property({ type: Boolean,  })
  overlay = false;

  /** Size to the parent element instead of pinning to the viewport. */
  @property({ type: Boolean })
  contained = false;

  @render()
  render() {
    return html/*html*/`
      <div class="layout">
        <div class="background">
          <slot name="background"></slot>
        </div>

        <div class="overlay">
          <slot name="overlay"></slot>
        </div>

        <div class="content">
          <slot name="page"></slot>
        </div>

        <div class="controls">
          <slot name="controls"></slot>
        </div>
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