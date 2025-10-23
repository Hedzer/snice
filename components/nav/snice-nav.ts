import { element, property, watch, context } from 'snice';
import type { Placard, AppContext, Context } from 'snice';
import cssContent from './snice-nav.css?inline';
import type { SniceNavElement, NavVariant, NavOrientation } from './snice-nav.types';

@element('snice-nav')
export class SniceNav extends HTMLElement implements SniceNavElement {

  @property()
  variant: NavVariant = 'flat';

  @property()
  orientation: NavOrientation = 'horizontal';

  @property({ type: Boolean })
  isTopLevel = false;

  private placards: Placard[] = [];
  private currentRoute = '';
  private routeParams: Record<string, string> = {};
  private appContext: AppContext | null = null;

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.applyStyles();
    this.render();
  }

  @context()
  handleContext(ctx: Context) {
    // Only update from context if this is a top-level nav
    if (this.isTopLevel) {
      this.update(
        ctx.navigation.placards,
        ctx.application,
        ctx.navigation.route,
        ctx.navigation.params
      );
    }
  }

  @watch('variant')
  @watch('orientation')
  handleChange() {
    this.render();
  }

  private applyStyles() {
    if (!this.shadowRoot) return;
    const style = document.createElement('style');
    style.textContent = cssContent;
    this.shadowRoot.appendChild(style);
  }

  private render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = '';
    this.applyStyles();

    const wrapper = document.createElement('div');
    wrapper.className = 'nav-content';

    const navItems = this.placards
      .filter(p => !p.parent && p.show !== false && this.isVisible(p))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (navItems.length > 0) {
      if (this.variant === 'grouped') {
        wrapper.appendChild(this.renderGrouped(navItems));
      } else if (this.variant === 'hierarchical') {
        wrapper.appendChild(this.renderHierarchical(navItems));
      } else {
        wrapper.appendChild(this.renderFlat(navItems));
      }
    }

    this.shadowRoot.appendChild(wrapper);

    const slot = document.createElement('slot');
    this.shadowRoot.appendChild(slot);
  }

  private renderFlat(navItems: Placard[]): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = `nav nav--${this.variant} nav--${this.orientation}`;
    nav.setAttribute('role', 'navigation');

    navItems.forEach(placard => {
      nav.appendChild(this.renderNavItem(placard));
    });

    return nav;
  }

  private renderHierarchical(navItems: Placard[]): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = `nav nav--${this.variant} nav--${this.orientation}`;
    nav.setAttribute('role', 'navigation');

    navItems.forEach(placard => {
      const children = this.placards
        .filter(p => p.parent === placard.name && p.show !== false && this.isVisible(p))
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const groupDiv = document.createElement('div');
      groupDiv.className = this.isActive(placard) ? 'nav__group nav__group--active' : 'nav__group';
      groupDiv.appendChild(this.renderNavLink(placard));

      if (children.length > 0) {
        const submenu = document.createElement('ul');
        submenu.className = 'nav__submenu';
        children.forEach(child => {
          const li = document.createElement('li');
          li.className = this.isActive(child) ? 'nav__item nav__item--active' : 'nav__item';
          li.appendChild(this.renderNavLink(child));
          submenu.appendChild(li);
        });
        groupDiv.appendChild(submenu);
      }

      nav.appendChild(groupDiv);
    });

    return nav;
  }

  private renderGrouped(navItems: Placard[]): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = `nav nav--${this.variant} nav--${this.orientation}`;
    nav.setAttribute('role', 'navigation');

    const groups = new Map<string, Placard[]>();
    navItems.forEach(placard => {
      const groupName = placard.group || 'default';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(placard);
    });

    groups.forEach((items, groupName) => {
      const sortedItems = items.sort((a, b) => (a.order || 0) - (b.order || 0));
      const groupDiv = document.createElement('div');
      groupDiv.className = 'nav__group';
      groupDiv.setAttribute('data-group', groupName);

      if (groupName !== 'default') {
        const label = document.createElement('div');
        label.className = 'nav__group-label';
        label.textContent = groupName;
        groupDiv.appendChild(label);
      }

      sortedItems.forEach(placard => {
        groupDiv.appendChild(this.renderNavItem(placard));
      });

      nav.appendChild(groupDiv);
    });

    return nav;
  }

  private renderNavItem(placard: Placard): HTMLElement {
    const div = document.createElement('div');
    div.className = this.isActive(placard) ? 'nav__item nav__item--active' : 'nav__item';
    div.appendChild(this.renderNavLink(placard));
    return div;
  }

  private renderNavLink(placard: Placard): HTMLElement {
    const a = document.createElement('a');
    const href = placard.name === 'home' ? '#/' : `#/${placard.name}`;
    a.href = href;
    a.className = this.isActive(placard) ? 'nav__link nav__link--active' : 'nav__link';

    // Accessibility
    if (this.isActive(placard)) {
      a.setAttribute('aria-current', 'page');
    }

    // Use description for aria-label if available, otherwise fall back to title
    if (placard.description) {
      a.setAttribute('aria-label', placard.description);
    }

    // Tooltip (prefers tooltip, falls back to description)
    if (placard.tooltip) {
      a.title = placard.tooltip;
    } else if (placard.description) {
      a.title = placard.description;
    }

    // Keyboard shortcuts - add data attribute for external hotkey handlers
    if (placard.hotkeys && placard.hotkeys.length > 0) {
      a.setAttribute('data-hotkeys', placard.hotkeys.join(','));
    }

    // Help URL - add data attribute for external help systems
    if (placard.helpUrl) {
      a.setAttribute('data-help-url', placard.helpUrl);
    }

    // Search terms - add data attribute for search functionality
    if (placard.searchTerms && placard.searchTerms.length > 0) {
      a.setAttribute('data-search-terms', placard.searchTerms.join(','));
    }

    // Custom attributes - apply any custom data attributes
    if (placard.attributes) {
      Object.entries(placard.attributes).forEach(([key, value]) => {
        a.setAttribute(`data-${key}`, String(value));
      });
    }

    if (placard.icon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'nav__icon';
      iconSpan.textContent = placard.icon;
      a.appendChild(iconSpan);
    }

    const labelSpan = document.createElement('span');
    labelSpan.className = 'nav__label';
    labelSpan.textContent = placard.title;
    a.appendChild(labelSpan);

    return a;
  }

  private isActive(placard: Placard): boolean {
    // Normalize route - remove leading slash if present
    const route = this.currentRoute.startsWith('/')
      ? this.currentRoute.slice(1)
      : this.currentRoute;

    // Check exact match or starts with (for child routes)
    return route === placard.name ||
           route.startsWith(`${placard.name}/`) ||
           (placard.name === 'home' && (this.currentRoute === '/' || this.currentRoute === ''));
  }

  private isVisible(placard: Placard): boolean {
    if (!placard.visibleOn) return true;
    if (!this.appContext) return true;

    const guards = Array.isArray(placard.visibleOn) ? placard.visibleOn : [placard.visibleOn];
    return guards.every(guard => guard(this.appContext!, this.routeParams));
  }

  update(placards: Placard[], appContext?: AppContext, currentRoute?: string, routeParams?: Record<string, string>) {
    this.placards = [...placards];
    if (appContext) {
      this.appContext = appContext;
    }
    if (currentRoute !== undefined) {
      this.currentRoute = currentRoute;
    }
    if (routeParams) {
      this.routeParams = routeParams;
    }
    this.render();
  }
}
