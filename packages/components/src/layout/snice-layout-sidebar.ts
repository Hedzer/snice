import { element, property, query, on, ready, dispose, render, styles, html, css } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import type { SidebarCollapseMode } from './snice-layout.types';
import cssContent from './snice-layout-sidebar.css?inline';
import '../nav/snice-nav.ts';
import type { SniceNav } from '../nav/snice-nav.ts';

@element('snice-layout-sidebar')
export class SniceLayoutSidebar extends HTMLElement implements Layout {
  @property({ type: Boolean })
  collapsed = false;

  /** Size to the parent element instead of pinning to the viewport. */
  @property({ type: Boolean })
  contained = false;

  /**
   * How the sidebar collapses on desktop:
   * `rail` shrinks it to an icon-width column, `offcanvas` hides it entirely,
   * `none` pins it open and drops the toggle.
   */
  @property({ attribute: 'collapse-mode' })
  collapseMode: SidebarCollapseMode = 'rail';

  @property({ attribute: false })
  mobileOpen = false;

  /**
   * Whether the viewport is below the documented 768px breakpoint, where the
   * sidebar leaves the flow and overlays main behind a scrim. Driven from a
   * `matchMedia` listener rather than a CSS `@media` block: the component's
   * styles live in one constructable stylesheet shared across every instance's
   * shadow root, and WebKit does not reliably re-evaluate `@media` rules in
   * such a sheet after viewport changes, while `matchMedia` listeners stay
   * live. The state lands on the template as `layout--mobile`.
   */
  @property({ attribute: false })
  private mobileViewport = false;

  private mobileQuery?: MediaQueryList;
  private mobileListener?: (event: MediaQueryListEvent) => void;

  @query('snice-nav')
  navElement!: SniceNav;

  private placards: Placard[] = [];
  private currentRoute = '';

  @property({ attribute: false })
  private hasFooterContent = false;

  @render()
  render() {
    const isRail = this.collapseMode === 'rail';
    const canCollapse = this.collapseMode !== 'none';
    const sidebarRailClass = isRail ? ' sidebar--rail' : '';
    const sidebarCollapsedClass = canCollapse && this.collapsed ? ' sidebar--collapsed' : '';
    const sidebarMobileClass = this.mobileOpen ? ' sidebar--mobile-open' : '';
    const scrimClass = this.mobileOpen ? ' scrim--visible' : '';
    const layoutMobileClass = this.mobileViewport ? ' layout--mobile' : '';
    const expanded = this.mobileOpen || !this.collapsed;

    return html/*html*/`
      <div class="layout${layoutMobileClass}">
        <header class="header" part="header">
          <if ${canCollapse}>
            <button class="sidebar-toggle" type="button" aria-label="Toggle sidebar" aria-expanded="${expanded}" @click=${this.handleSidebarToggle}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor"/>
              </svg>
            </button>
          </if>
          <div class="header-brand">
            <slot name="brand">
              <h2>App</h2>
            </slot>
          </div>
          <div class="header-content">
            <slot name="header"></slot>
          </div>
        </header>

        <div class="body-area">
          <aside class="sidebar${sidebarRailClass}${sidebarCollapsedClass}${sidebarMobileClass}" part="sidebar">
            <slot name="sidebar">
              <snice-nav class="sidebar-nav" variant="hierarchical" orientation="vertical"></snice-nav>
            </slot>
          </aside>

          <div class="scrim${scrimClass}" part="scrim" @click=${this.handleScrimClick}></div>

          <main class="main" part="main">
            <slot name="page"></slot>
          </main>
        </div>

        <footer class="footer${this.hasFooterContent ? '' : ' footer--empty'}" part="footer">
          <slot name="footer"></slot>
        </footer>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  handleSidebarToggle() {
    if (this.collapseMode === 'none') return;

    if (this.mobileViewport) {
      this.mobileOpen = !this.mobileOpen;
      return;
    }

    this.collapsed = !this.collapsed;
  }

  handleScrimClick() {
    this.mobileOpen = false;
  }

  @on('keydown')
  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.mobileOpen) {
      this.mobileOpen = false;
    }
  }

  private shortcutListener?: (event: KeyboardEvent) => void;

  @ready()
  wireFooterState() {
    this.syncFooterState();
    this.shadowRoot?.addEventListener('slotchange', () => this.syncFooterState());
  }

  @ready()
  wireMobileState() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    this.mobileQuery = window.matchMedia('(max-width: 768px)');
    this.mobileViewport = this.mobileQuery.matches;
    this.mobileListener = (event) => { this.mobileViewport = event.matches; };
    this.mobileQuery.addEventListener('change', this.mobileListener);
  }

  @dispose()
  releaseMobileState() {
    if (this.mobileQuery && this.mobileListener) {
      this.mobileQuery.removeEventListener('change', this.mobileListener);
    }
    this.mobileQuery = undefined;
    this.mobileListener = undefined;
  }

  private syncFooterState() {
    this.hasFooterContent = !!this.querySelector('[slot="footer"]');
  }

  @ready()
  bindShortcut() {
    if (typeof document === 'undefined') return;

    this.shortcutListener = (event: KeyboardEvent) => {
      const isToggleChord = event.key?.toLowerCase() === 'b' && (event.metaKey || event.ctrlKey);
      if (!isToggleChord) return;

      event.preventDefault();
      this.handleSidebarToggle();
    };
    document.addEventListener('keydown', this.shortcutListener);
  }

  @dispose()
  releaseShortcut() {
    if (this.shortcutListener && typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.shortcutListener);
      this.shortcutListener = undefined;
    }
  }

  @ready()
  init() {
    // Update nav when component is ready and shadow DOM is available
    this.updateNav();
  }

  update(appContext: AppContext, placards: Placard[], currentRoute: string, routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;

    // Update the navigation
    this.updateNav(appContext, routeParams);
  }

  updateNav(appContext?: AppContext, routeParams?: RouteParams) {
    if (this.navElement) {
      this.navElement.update(this.placards, appContext, this.currentRoute, routeParams);
    }
  }
}
