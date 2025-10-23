import { element, property, watch } from 'snice';
import type { Placard, AppContext } from 'snice';
import cssContent from './snice-nav.css?inline';
import type { SniceNavElement, NavVariant, NavOrientation } from './snice-nav.types';

@element('snice-nav')
export class SniceNav extends HTMLElement implements SniceNavElement {

  @property({ type: Array })
  placards: Placard[] = [];

  @property()
  currentRoute = '';

  @property()
  variant: NavVariant = 'flat';

  @property()
  orientation: NavOrientation = 'horizontal';

  private context: AppContext | null = null;

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.applyStyles();
    this.render();
  }

  @watch('placards')
  @watch('currentRoute')
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
    if (this.isActive(placard)) {
      a.setAttribute('aria-current', 'page');
    }
    if (placard.tooltip) {
      a.title = placard.tooltip;
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
    return this.currentRoute === placard.name ||
           this.currentRoute.startsWith(`/${placard.name}`) ||
           (placard.name === 'home' && this.currentRoute === '/');
  }

  private isVisible(placard: Placard): boolean {
    if (!placard.visibleOn) return true;
    if (!this.context) return true;

    const guards = Array.isArray(placard.visibleOn) ? placard.visibleOn : [placard.visibleOn];
    return guards.every(guard => guard(this.context!, {}));
  }

  update(placards: Placard[], currentRoute: string, context?: AppContext) {
    this.placards = [...placards];
    this.currentRoute = currentRoute;
    if (context) {
      this.context = context;
    }
  }
}
