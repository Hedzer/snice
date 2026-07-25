import { element, property, ready, dispose, render, styles, dispatch, html, css } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import cssContent from './snice-layout-master-detail.css?inline';
import '../nav/snice-nav.ts';

/**
 * Master-detail shell: a scrollable list beside the selected item's detail.
 * The mail, chat, and issue-tracker shape.
 *
 * Wide viewports show both panes. Below the breakpoint only one is on screen:
 * the list, until something is selected, then the detail with a back control.
 */
@element('snice-layout-master-detail')
export class SniceLayoutMasterDetail extends HTMLElement implements Layout {
  /** A detail item is open. Drives the single-pane view below the breakpoint. */
  @property({ type: Boolean })
  selected = false;

  /** Size to the parent element instead of pinning to the viewport. */
  @property({ type: Boolean })
  contained = false;

  @property({ attribute: false })
  private narrow = false;

  private placards: Placard[] = [];
  private currentRoute = '';
  private viewportQuery?: MediaQueryList;
  private viewportListener?: (event: MediaQueryListEvent) => void;

  @render()
  render() {
    const showDetail = !this.narrow || this.selected;
    const showList = !this.narrow || !this.selected;
    const listClass = showList ? '' : ' pane--hidden';
    const detailClass = showDetail ? '' : ' pane--hidden';

    return html/*html*/`
      <div class="layout">
        <header class="header" part="header">
          <if ${this.narrow && this.selected}>
            <button class="back" type="button" aria-label="Back to list" @click=${this.handleBack}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
              </svg>
            </button>
          </if>
          <div class="header-brand">
            <slot name="brand"></slot>
          </div>
          <div class="header-content">
            <slot name="header"></slot>
          </div>
        </header>

        <div class="body-area">
          <section class="pane list${listClass}" part="list" aria-label="Items">
            <slot name="list"></slot>
          </section>

          <section class="pane detail${detailClass}" part="detail" aria-label="Details">
            <slot name="detail">
              <div class="detail-empty" part="empty">
                <slot name="empty">Select an item</slot>
              </div>
            </slot>
          </section>
        </div>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @dispatch('detail-closed', { bubbles: true, composed: true })
  handleBack() {
    this.selected = false;
    return { selected: false };
  }

  @ready()
  watchViewport() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    this.viewportQuery = window.matchMedia('(max-width: 640px)');
    this.narrow = this.viewportQuery.matches;
    this.viewportListener = (event: MediaQueryListEvent) => {
      this.narrow = event.matches;
    };
    this.viewportQuery.addEventListener('change', this.viewportListener);
  }

  @dispose()
  releaseViewport() {
    if (this.viewportQuery && this.viewportListener) {
      this.viewportQuery.removeEventListener('change', this.viewportListener);
      this.viewportQuery = undefined;
      this.viewportListener = undefined;
    }
  }

  update(_appContext: AppContext, placards: Placard[], currentRoute: string, _routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;
  }
}
