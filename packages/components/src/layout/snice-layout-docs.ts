import { element, property, ready, dispose, render, styles, html, css } from 'snice';
import type { AppContext, Placard, RouteParams, Layout } from 'snice';
import cssContent from './snice-layout-docs.css?inline';
import '../nav/snice-nav.ts';
import type { SniceNav } from '../nav/snice-nav.ts';

/**
 * Documentation shell: navigation tree, prose at a reading measure, and an
 * on-this-page rail.
 *
 * The rail leaves first on narrower screens, then the tree becomes a drawer —
 * the order documentation sites settle on. Each region scrolls on its own.
 */
@element('snice-layout-docs')
export class SniceLayoutDocs extends HTMLElement implements Layout {
  /** Sidebar drawer state below the navigation breakpoint. */
  @property({ attribute: false })
  sidebarOpen = false;

  /** Size to the parent element instead of pinning to the viewport. */
  @property({ type: Boolean })
  contained = false;

  @property({ attribute: false })
  private hasToc = false;

  private navElement?: SniceNav;
  private placards: Placard[] = [];
  private currentRoute = '';

  @render()
  render() {
    const sidebarClass = this.sidebarOpen ? ' sidebar--open' : '';
    const scrimClass = this.sidebarOpen ? ' scrim--visible' : '';
    const tocClass = this.hasToc ? '' : ' toc--empty';

    return html/*html*/`
      <div class="layout">
        <a class="skip-link" href="#snice-docs-main">Skip to content</a>

        <header class="header" part="header">
          <button
            class="sidebar-toggle"
            type="button"
            aria-label="Toggle documentation navigation"
            aria-expanded="${this.sidebarOpen}"
            @click=${this.handleSidebarToggle}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor"/>
            </svg>
          </button>
          <div class="header-brand">
            <slot name="brand">
              <span class="brand-fallback">Documentation</span>
            </slot>
          </div>
          <div class="header-content">
            <slot name="header"></slot>
          </div>
        </header>

        <div class="body-area">
          <nav class="sidebar${sidebarClass}" part="sidebar" aria-label="Documentation">
            <slot name="sidebar">
              <snice-nav class="sidebar-nav" variant="hierarchical" orientation="vertical"></snice-nav>
            </slot>
          </nav>

          <div class="scrim${scrimClass}" part="scrim" @click=${this.handleScrimClick}></div>

          <main class="content" id="snice-docs-main" part="main">
            <article class="prose" part="prose">
              <slot name="page"></slot>
            </article>
            <footer class="footer" part="footer">
              <slot name="footer"></slot>
            </footer>
          </main>

          <aside class="toc${tocClass}" part="toc" aria-label="On this page">
            <slot name="toc"></slot>
          </aside>
        </div>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  handleSidebarToggle() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  handleScrimClick() {
    this.sidebarOpen = false;
  }

  @ready()
  wireRegions() {
    this.syncSlotState();
    this.shadowRoot?.addEventListener('slotchange', () => this.syncSlotState());

    if (typeof document !== 'undefined') {
      this.escapeListener = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && this.sidebarOpen) this.sidebarOpen = false;
      };
      document.addEventListener('keydown', this.escapeListener);
    }
  }

  @dispose()
  releaseListeners() {
    if (this.escapeListener && typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.escapeListener);
      this.escapeListener = undefined;
    }
  }

  private escapeListener?: (event: KeyboardEvent) => void;

  private syncSlotState() {
    this.hasToc = !!this.querySelector('[slot="toc"]');
    this.navElement = this.shadowRoot?.querySelector('snice-nav') as SniceNav | undefined;
  }

  update(appContext: AppContext, placards: Placard[], currentRoute: string, routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;
    this.updateNav(appContext, routeParams);
  }

  updateNav(appContext?: AppContext, routeParams?: RouteParams) {
    const nav = this.navElement ?? (this.shadowRoot?.querySelector('snice-nav') as SniceNav | undefined);
    if (nav) {
      nav.update(this.placards, appContext, this.currentRoute, routeParams);
    }
  }
}
