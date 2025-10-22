import { element, property, render, styles, html, css } from 'snice';
import type { Placard } from 'snice';
import cssContent from './snice-nav.css?inline';
import type { SniceNavElement, NavVariant, NavOrientation } from './snice-nav.types';

@element('snice-nav')
export class SniceNav extends HTMLElement implements SniceNavElement {

  placards: Placard[] = [];

  @property()
  currentRoute = '';

  @property()
  variant: NavVariant = 'flat';

  @property()
  orientation: NavOrientation = 'horizontal';

  @render()
  renderContent() {
    return html`<div class="nav-content">${this.renderNavContent()}</div><slot></slot>`;
  }

  @styles()
  componentStyles() {
    return css`${cssContent}`;
  }

  private renderFlat(navItems: Placard[]) {
    return html`
      <nav class="nav nav--${this.variant} nav--${this.orientation}" role="navigation">
        ${navItems.map(placard => this.renderNavItem(placard))}
      </nav>
    `;
  }

  private renderHierarchical(navItems: Placard[]) {
    return html`
      <nav class="nav nav--${this.variant} nav--${this.orientation}" role="navigation">
        ${navItems.map(placard => {
          const children = this.placards
            .filter(p => p.parent === placard.name && p.show !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          const groupClasses = ['nav__group', this.isActive(placard) ? 'nav__group--active' : ''].filter(Boolean).join(' ');
          return html`
            <div class="${groupClasses}">
              ${this.renderNavLink(placard)}
              <if ${children.length > 0}>
                <ul class="nav__submenu">
                  ${children.map(child => {
                    const childClasses = ['nav__item', this.isActive(child) ? 'nav__item--active' : ''].filter(Boolean).join(' ');
                    return html`
                    <li class="${childClasses}">
                      ${this.renderNavLink(child)}
                    </li>
                  `})}
                </ul>
              </if>
            </div>
          `;
        })}
      </nav>
    `;
  }

  private renderGrouped(navItems: Placard[]) {
    const groups = new Map<string, Placard[]>();

    navItems.forEach(placard => {
      const groupName = placard.group || 'default';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(placard);
    });

    return html`
      <nav class="nav nav--${this.variant} nav--${this.orientation}" role="navigation">
        ${Array.from(groups.entries()).map(([groupName, items]) => {
          const sortedItems = items.sort((a, b) => (a.order || 0) - (b.order || 0));

          return html`
            <div class="nav__group" data-group="${groupName}">
              <if ${groupName !== 'default'}>
                <div class="nav__group-label">${groupName}</div>
              </if>
              ${sortedItems.map(placard => this.renderNavItem(placard))}
            </div>
          `;
        })}
      </nav>
    `;
  }

  private renderNavItem(placard: Placard) {
    const isActive = this.isActive(placard);
    const itemClasses = ['nav__item', isActive ? 'nav__item--active' : ''].filter(Boolean).join(' ');

    return html`
      <div class="${itemClasses}">
        ${this.renderNavLink(placard)}
      </div>
    `;
  }

  private renderNavLink(placard: Placard) {
    const isActive = this.isActive(placard);
    const tooltip = placard.tooltip ? placard.tooltip : '';
    const href = placard.name === 'home' ? '#/' : `#/${placard.name}`;
    const linkClasses = ['nav__link', isActive ? 'nav__link--active' : ''].filter(Boolean).join(' ');

    return html`
      <a href="${href}"
         class="${linkClasses}"
         aria-current="${isActive ? 'page' : ''}"
         title="${tooltip}">
        <if ${placard.icon}>
          <span class="nav__icon">${placard.icon}</span>
        </if>
        <span class="nav__label">${placard.title}</span>
      </a>
    `;
  }

  private isActive(placard: Placard): boolean {
    return this.currentRoute === placard.name ||
           this.currentRoute.startsWith(`/${placard.name}`) ||
           (placard.name === 'home' && this.currentRoute === '/');
  }

  update(placards: Placard[], currentRoute: string) {
    this.placards = placards;
    this.currentRoute = currentRoute;
  }

  renderNavContent() {
    const navItems = this.placards
      .filter(p => !p.parent && p.show !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (navItems.length === 0) {
      return '';
    }

    if (this.variant === 'grouped') {
      return this.renderGrouped(navItems);
    }

    if (this.variant === 'hierarchical') {
      return this.renderHierarchical(navItems);
    }

    return this.renderFlat(navItems);
  }
}
