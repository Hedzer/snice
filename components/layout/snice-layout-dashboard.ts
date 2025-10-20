import { element, query, property, render, styles, html, css } from 'snice';
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

  @property({  })
  private currentRoute = '';

  @render()
  renderContent() {
    return html/*html*/`
      <div class="layout">
        <header class="header">
          <div class="header-start">
            <slot name="brand">
              <h1>Dashboard</h1>
            </slot>
          </div>
          <div class="header-center">
            <slot name="search"></slot>
          </div>
          <div class="header-end">
            <slot name="user"></slot>
          </div>
        </header>

        <snice-nav class="nav" variant="grouped" orientation="horizontal"></snice-nav>

        <aside class="sidebar">${this.getBreadcrumbsHtml()}</aside>

        <main class="main">
          <slot name="page"></slot>
        </main>

        <aside class="right-sidebar">
          <slot name="right-sidebar"></slot>
        </aside>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  update(_appContext: AppContext, placards: Placard[], currentRoute: string, _routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;

    // Update navigation
    this.updateNav();
  }

  updateNav() {
    if (this.navElement) {
      this.navElement.placards = this.placards;
      this.navElement.currentRoute = this.currentRoute;
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
          href: `#/${p.name}`,
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
