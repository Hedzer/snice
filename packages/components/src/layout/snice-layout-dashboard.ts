import { element, query, property, ready, dispose, render, styles, html, css } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import cssContent from './snice-layout-dashboard.css?inline';
import '../breadcrumbs/snice-breadcrumbs.ts';
import '../nav/snice-nav.ts';
import type { SniceNav } from '../nav/snice-nav.ts';

@element('snice-layout-dashboard')
export class SniceLayoutDashboard extends HTMLElement implements Layout {
  @query('snice-nav')
  navElement!: SniceNav;

  @property({ type: Array })
  private placards: Placard[] = [];

  @property({ attribute: false })
  private currentRoute = '';

  @property({ type: Boolean })
  collapsed = false;

  /** Size to the parent element instead of pinning to the viewport. */
  @property({ type: Boolean })
  contained = false;

  @property({ attribute: false })
  mobileOpen = false;

  /**
   * Whether the viewport is below the documented 1024px/768px breakpoints
   * (rail stacks under main below 1024px; sidebar overlays below 768px).
   * Driven from `matchMedia` listeners rather than CSS `@media` blocks: the
   * component's styles live in one constructable stylesheet shared across
   * every instance's shadow root, and WebKit does not reliably re-evaluate
   * `@media` rules in such a sheet after viewport changes, while `matchMedia`
   * listeners stay live. The states land on the template as
   * `layout--railed-stacked` and `layout--mobile`.
   */
  @property({ attribute: false })
  private stackedViewport = false;

  @property({ attribute: false })
  private mobileViewport = false;

  private viewportQuery?: MediaQueryList;
  private mobileQuery?: MediaQueryList;
  private viewportListener?: (event: MediaQueryListEvent) => void;
  private mobileListener?: (event: MediaQueryListEvent) => void;

  @property({ attribute: false })
  hasRail = false;

  @property({ attribute: false })
  hasToolbarContent = false;

  @render()
  render() {
    const sidebarCollapsedClass = this.collapsed ? ' sidebar--collapsed' : '';
    const sidebarMobileClass = this.mobileOpen ? ' sidebar--mobile-open' : '';
    const scrimClass = this.mobileOpen ? ' scrim--visible' : '';
    const expanded = this.mobileOpen || !this.collapsed;
    const railedClass = this.hasRail ? ' content-area--railed' : '';
    const railEmptyClass = this.hasRail ? '' : ' right-sidebar--empty';
    const breadcrumbsHtml = this.getBreadcrumbsHtml();
    const toolbarHiddenClass = this.hasToolbarContent || breadcrumbsHtml ? '' : ' toolbar--hidden';
    const layoutClasses = `${this.stackedViewport ? ' layout--railed-stacked' : ''}`
      + `${this.mobileViewport ? ' layout--mobile' : ''}`;

    return html/*html*/`
      <div class="layout${layoutClasses}">
        <header class="header" part="header">
          <button class="sidebar-toggle" type="button" aria-label="Toggle sidebar" aria-expanded="${expanded}" @click=${this.handleSidebarToggle}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor"/>
            </svg>
          </button>
          <div class="header-start">
            <slot name="brand">
              <h1>Dashboard</h1>
            </slot>
          </div>
          <div class="header-content">
            <slot name="header"></slot>
          </div>
        </header>

        <div class="toolbar${toolbarHiddenClass}" part="toolbar">
          <slot name="toolbar">${breadcrumbsHtml}</slot>
        </div>

        <div class="body-area">
          <aside class="sidebar${sidebarCollapsedClass}${sidebarMobileClass}" part="sidebar">
            <slot name="sidebar">
              <snice-nav class="sidebar-nav" variant="hierarchical" orientation="vertical"></snice-nav>
            </slot>
          </aside>

          <div class="scrim${scrimClass}" part="scrim" @click=${this.handleScrimClick}></div>

          <div class="content-area${railedClass}">
            <main class="main" part="main">
              <slot name="page"></slot>
            </main>

            <aside class="right-sidebar${railEmptyClass}" part="right-sidebar">
              <slot name="right-sidebar"></slot>
            </aside>
          </div>
        </div>
      </div>
    `;
  }

  handleSidebarToggle() {
    if (this.mobileViewport) {
      this.mobileOpen = !this.mobileOpen;
      return;
    }

    this.collapsed = !this.collapsed;
  }

  handleScrimClick() {
    this.mobileOpen = false;
  }

  @ready()
  wireViewportState() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    this.viewportQuery = window.matchMedia('(max-width: 1024px)');
    this.stackedViewport = this.viewportQuery.matches;
    this.viewportListener = (event) => { this.stackedViewport = event.matches; };
    this.viewportQuery.addEventListener('change', this.viewportListener);

    this.mobileQuery = window.matchMedia('(max-width: 768px)');
    this.mobileViewport = this.mobileQuery.matches;
    this.mobileListener = (event) => { this.mobileViewport = event.matches; };
    this.mobileQuery.addEventListener('change', this.mobileListener);
  }

  @dispose()
  releaseViewportState() {
    if (this.viewportQuery && this.viewportListener) {
      this.viewportQuery.removeEventListener('change', this.viewportListener);
    }
    if (this.mobileQuery && this.mobileListener) {
      this.mobileQuery.removeEventListener('change', this.mobileListener);
    }
    this.viewportQuery = undefined;
    this.mobileQuery = undefined;
    this.viewportListener = undefined;
    this.mobileListener = undefined;
  }

  @ready()
  wireSlotDetection() {
    this.syncSlotState();

    // slotchange bubbles to the shadow root (not past it), so one delegated
    // listener survives re-renders that replace the slot elements.
    this.shadowRoot?.addEventListener('slotchange', () => this.syncSlotState());
  }

  private syncSlotState() {
    this.hasRail = !!this.querySelector('[slot="right-sidebar"]');
    this.hasToolbarContent = !!this.querySelector('[slot="toolbar"]');
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  update(appContext: AppContext, placards: Placard[], currentRoute: string, routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;

    // Update navigation
    this.updateNav(appContext, routeParams);
  }

  updateNav(appContext?: AppContext, routeParams?: RouteParams) {
    if (this.navElement) {
      this.navElement.update(this.placards, appContext, this.currentRoute, routeParams);
    }
  }

  private getBreadcrumbsHtml(): string {
    const currentPlacard = this.placards.find(p =>
      this.currentRoute === p.name || this.currentRoute.startsWith(`/${p.name}`)
    );

    if (!currentPlacard) {
      return '';
    }

    // Build breadcrumb trail
    const breadcrumbs = this.buildBreadcrumbTrail(currentPlacard);

    if (breadcrumbs.length === 0) {
      return '';
    }

    return `
      <snice-breadcrumbs
        items='${JSON.stringify(breadcrumbs.map(p => ({
          label: p.title,
          href: p.href || '',
          icon: p.icon
        })))}'
        separator="/">
      </snice-breadcrumbs>
    `;
  }

  private buildBreadcrumbTrail(placard: Placard): Placard[] {
    const trail: Placard[] = [];

    // If explicit breadcrumbs are defined, use them
    if (placard.breadcrumbs && placard.breadcrumbs.length > 0) {
      placard.breadcrumbs.forEach(name => {
        const p = this.placards.find(pc => pc.name === name);
        if (p) trail.push(p);
      });
      return trail;
    }

    // Otherwise, build from parent hierarchy
    let current: Placard | undefined = placard;
    const visited = new Set<string>();

    while (current) {
      if (visited.has(current.name)) break; // Prevent infinite loops
      visited.add(current.name);

      trail.unshift(current);

      if (current.parent) {
        current = this.placards.find(p => p.name === current!.parent);
      } else {
        break;
      }
    }

    return trail;
  }
}
