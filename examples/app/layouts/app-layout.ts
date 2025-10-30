import { layout, part, render, styles, html, css } from 'snice';
import type { Layout, AppContext, Placard, RouteParams } from 'snice';

@layout('app-layout')
export class AppLayout extends HTMLElement implements Layout {
  private placards: Placard[] = [];
  private currentRoute = '';

  @render()
  renderContent() {
    return html/*html*/`
      <nav class="navbar">
        <div class="nav-container">
          <h1 class="nav-brand">Snice</h1>
          <ul class="nav-menu" part="nav"></ul>
        </div>
      </nav>

      <main class="main-content">
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

      .navbar {
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .nav-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .nav-brand {
        font-size: 1.5rem;
        color: #333;
        margin: 0;
      }

      .nav-menu {
        display: flex;
        list-style: none;
        gap: 2rem;
        margin: 0;
        padding: 0;
      }

      .nav-link {
        color: #666;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.3s;
      }

      .nav-link:hover {
        color: #667eea;
      }

      .nav-link--active {
        color: #667eea;
      }

      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      @media (max-width: 768px) {
        .nav-container {
          flex-direction: column;
          gap: 1rem;
          text-align: center;
        }

        .nav-menu {
          gap: 1rem;
        }
      }
    `;
  }

  update(appContext: AppContext, placards: Placard[], currentRoute: string, routeParams: RouteParams): void {
    this.placards = placards;
    this.currentRoute = currentRoute;

    // Update navigation from placards
    this.renderNav();
  }

  @part('nav')
  renderNav() {
    // Get navigation items (show !== false, ordered)
    const navItems = this.placards
      .filter(p => p.show !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (navItems.length === 0) {
      // Fallback to hardcoded nav if no placards
      return /*html*/`
        <li><a href="#/" class="nav-link">Home</a></li>
        <li><a href="#/todos" class="nav-link">Todos</a></li>
        <li><a href="#/about" class="nav-link">About</a></li>
      `;
    }

    return navItems.map(placard => {
      const isActive = this.currentRoute === placard.name ||
                      this.currentRoute.startsWith(`/${placard.name}`) ||
                      (placard.name === 'home' && this.currentRoute === '/');

      const icon = placard.icon ? `<span class="nav-icon">${placard.icon}</span> ` : '';
      const title = placard.tooltip ? `title="${placard.tooltip}"` : '';

      return /*html*/`
        <li>
          <a href="#/${placard.name === 'home' ? '' : placard.name}"
             class="nav-link ${isActive ? 'nav-link--active' : ''}"
             ${title}>
            ${icon}${placard.title}
          </a>
        </li>
      `;
    }).join('');
  }
}
