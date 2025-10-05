import { element, property } from 'snice';
import type { Placard } from 'snice';
import css from './snice-nav.css?inline';
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

  html() {
    const navItems = this.placards
      .filter(p => !p.parent && p.show !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (navItems.length === 0) {
      return '<slot></slot>';
    }

    if (this.variant === 'grouped') {
      return this.renderGrouped(navItems);
    }

    if (this.variant === 'hierarchical') {
      return this.renderHierarchical(navItems);
    }

    return this.renderFlat(navItems);
  }

  css() {
    return css;
  }

  private renderFlat(navItems: Placard[]): string {
    return /*html*/`
      <nav class="nav nav--${this.variant} nav--${this.orientation}" role="navigation">
        ${navItems.map(placard => this.renderNavItem(placard)).join('')}
      </nav>
    `;
  }

  private renderHierarchical(navItems: Placard[]): string {
    return /*html*/`
      <nav class="nav nav--${this.variant} nav--${this.orientation}" role="navigation">
        ${navItems.map(placard => {
          const children = this.placards
            .filter(p => p.parent === placard.name && p.show !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          const childrenHtml = children.length > 0 ? /*html*/`
            <ul class="nav__submenu">
              ${children.map(child => /*html*/`
                <li class="nav__item ${this.isActive(child) ? 'nav__item--active' : ''}">
                  ${this.renderNavLink(child)}
                </li>
              `).join('')}
            </ul>
          ` : '';

          return /*html*/`
            <div class="nav__group ${this.isActive(placard) ? 'nav__group--active' : ''}">
              ${this.renderNavLink(placard)}
              ${childrenHtml}
            </div>
          `;
        }).join('')}
      </nav>
    `;
  }

  private renderGrouped(navItems: Placard[]): string {
    const groups = new Map<string, Placard[]>();

    navItems.forEach(placard => {
      const groupName = placard.group || 'default';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(placard);
    });

    return /*html*/`
      <nav class="nav nav--${this.variant} nav--${this.orientation}" role="navigation">
        ${Array.from(groups.entries()).map(([groupName, items]) => {
          const sortedItems = items.sort((a, b) => (a.order || 0) - (b.order || 0));

          return /*html*/`
            <div class="nav__group" data-group="${groupName}">
              ${groupName !== 'default' ? /*html*/`
                <div class="nav__group-label">${groupName}</div>
              ` : ''}
              ${sortedItems.map(placard => this.renderNavItem(placard)).join('')}
            </div>
          `;
        }).join('')}
      </nav>
    `;
  }

  private renderNavItem(placard: Placard): string {
    const isActive = this.isActive(placard);

    return /*html*/`
      <div class="nav__item ${isActive ? 'nav__item--active' : ''}">
        ${this.renderNavLink(placard)}
      </div>
    `;
  }

  private renderNavLink(placard: Placard): string {
    const isActive = this.isActive(placard);
    const icon = placard.icon ? /*html*/`<span class="nav__icon">${placard.icon}</span>` : '';
    const tooltip = placard.tooltip ? `title="${placard.tooltip}"` : '';
    const href = placard.name === 'home' ? '#/' : `#/${placard.name}`;

    return /*html*/`
      <a href="${href}"
         class="nav__link ${isActive ? 'nav__link--active' : ''}"
         aria-current="${isActive ? 'page' : ''}"
         ${tooltip}>
        ${icon}
        <span class="nav__label">${placard.title}</span>
      </a>
    `;
  }

  private isActive(placard: Placard): boolean {
    return this.currentRoute === placard.name ||
           this.currentRoute.startsWith(`/${placard.name}`) ||
           (placard.name === 'home' && this.currentRoute === '/');
  }
}
