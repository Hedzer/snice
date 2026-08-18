import { element, property, render, styles, html, css } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import cssContent from './snice-layout-split.css?inline';

@element('snice-layout-split')
export class SniceLayoutSplit extends HTMLElement implements Layout {
  @property({  })
  direction: 'horizontal' | 'vertical' = 'horizontal';

  @property({  })
  ratio: '50-50' | '60-40' | '70-30' | '33-67' | '67-33' = '50-50';

  /** Size to the parent element instead of filling the screen. */
  @property({ type: Boolean })
  contained = false;

  @render()
  render() {
    return html/*html*/`
      <div class="layout">
        <div class="panel panel-left">
          <slot name="left"></slot>
        </div>
        <div class="divider"></div>
        <div class="panel panel-right">
          <slot name="right"></slot>
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