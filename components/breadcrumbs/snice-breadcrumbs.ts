import { element, property, watch, query, dispatch, on, ready } from 'snice';
import css from './snice-breadcrumbs.css?inline';
import type { BreadcrumbItem, BreadcrumbSeparator, BreadcrumbSize, SniceBreadcrumbsElement } from './snice-breadcrumbs.types';
import type { SniceCrumbElement } from './snice-breadcrumbs.types';

@element('snice-breadcrumbs')
export class SniceBreadcrumbs extends HTMLElement implements SniceBreadcrumbsElement {
  @property({ type: Array })
  items: BreadcrumbItem[] = [];

  @property({  })
  separator: BreadcrumbSeparator = '/';

  @property({  })
  size: BreadcrumbSize = 'medium';

  @property({ type: Number,  })
  maxItems = 0;

  @query('.breadcrumb')
  breadcrumbElement?: HTMLElement;

  private collapsed = true;
  private slotItems: BreadcrumbItem[] = [];

  html() {
    const allItems = this.getAllItems();
    const visibleItems = this.getVisibleItems(allItems);
    const hasCollapsed = this.maxItems > 0 && allItems.length > this.maxItems && this.collapsed;
    
    return /*html*/`
      <slot style="display: none"></slot>
      <nav aria-label="Breadcrumb">
        <ol class="breadcrumb ${hasCollapsed ? 'breadcrumb--collapsed' : ''}">
          ${visibleItems.map((item, index) => {
            const isLast = index === visibleItems.length - 1;
            const isActive = item.active || isLast;
            const isHidden = hasCollapsed && index > 0 && index < visibleItems.length - 2;
            
            return /*html*/`
              <li class="breadcrumb-item ${isActive ? 'breadcrumb-item--active' : ''} ${isHidden ? 'breadcrumb-item--hidden' : ''}">
                ${item.href && !isActive ? /*html*/`
                  <a href="${item.href}" 
                     class="breadcrumb-link"
                     aria-current="${isActive ? 'page' : ''}"
                     tabindex="0">
                    ${this.renderIcon(item)}
                    ${item.label}
                  </a>
                ` : /*html*/`
                  <span class="breadcrumb-text" 
                        aria-current="${isActive ? 'page' : ''}">
                    ${this.renderIcon(item)}
                    ${item.label}
                  </span>
                `}
                ${!isLast ? /*html*/`
                  <span class="breadcrumb-separator" aria-hidden="true">
                    ${this.separator}
                  </span>
                ` : ''}
              </li>
              ${hasCollapsed && index === 0 && allItems.length > this.maxItems ? /*html*/`
                <li class="breadcrumb-item">
                  <button class="breadcrumb-ellipsis" 
                          aria-label="Show all breadcrumbs"
                          tabindex="0">
                    •••
                  </button>
                  <span class="breadcrumb-separator" aria-hidden="true">
                    ${this.separator}
                  </span>
                </li>
              ` : ''}
            `;
          }).join('')}
        </ol>
      </nav>
    `;
  }

  css() {
    return css;
  }

  private getAllItems(): BreadcrumbItem[] {
    // Prefer slot items if available, otherwise use items property
    return this.slotItems.length > 0 ? this.slotItems : this.items;
  }

  private getVisibleItems(allItems: BreadcrumbItem[]): BreadcrumbItem[] {
    if (this.maxItems <= 0 || allItems.length <= this.maxItems || !this.collapsed) {
      return allItems;
    }
    
    // Show first item and last (maxItems - 1) items
    const firstItem = allItems[0];
    const lastItems = allItems.slice(-(this.maxItems - 1));
    return [firstItem, ...lastItems];
  }

  @on('click')
  handleEllipsisClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.matches('.breadcrumb-ellipsis')) return;

    this.collapsed = false;
    this.render();
  }

  @on('click')
  @dispatch('breadcrumb-click')
  handleLinkClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.matches('.breadcrumb-link')) return;

    const link = target as HTMLAnchorElement;
    const label = link.textContent?.trim() || '';
    const href = link.getAttribute('href') || '';

    // Find the item index
    const allItems = this.getAllItems();
    const index = allItems.findIndex(item => item.label === label);

    return {
      item: allItems[index],
      index,
      href,
      label
    };
  }

  private handleSlotChange() {
    const slot = this.shadowRoot?.querySelector('slot');
    if (!slot) return;
    
    const crumbs = slot.assignedElements().filter(
      el => el.tagName.toLowerCase() === 'snice-crumb'
    ) as SniceCrumbElement[];
    
    this.slotItems = crumbs.map(crumb => ({
      label: crumb.label || crumb.textContent?.trim() || '',
      href: crumb.href || undefined,
      icon: crumb.icon || undefined,
      iconImage: crumb.iconImage || undefined,
      active: crumb.active || false
    }));
    
    this.render();
  }

  @ready()
  init() {
    // Setup slot change handling
    const slot = this.shadowRoot?.querySelector('slot');
    if (slot) {
      slot.addEventListener('slotchange', () => this.handleSlotChange());
      // Initial check for slotted content
      this.handleSlotChange();
    }
  }

  @watch('items', 'separator', 'maxItems')
  updateBreadcrumb() {
    this.collapsed = true;
    // Only render if not using slot items, otherwise slot change will handle it
    if (!this.slotItems || this.slotItems.length === 0) {
      this.render();
    }
  }

  setItems(items: BreadcrumbItem[]) {
    this.items = items;
  }

  private renderIcon(item: BreadcrumbItem): string {
    return /*html*/`
      <img class="breadcrumb-icon-image" src="${item.iconImage || ''}" alt="" ${item.iconImage ? '' : 'hidden'}>
      <span class="breadcrumb-icon" ${item.icon ? '' : 'hidden'}>${item.icon || ''}</span>
    `;
  }

  private render() {
    const shadow = this.shadowRoot;
    if (shadow) {
      shadow.innerHTML = '';
      if (this.css) {
        const style = document.createElement('style');
        style.textContent = this.css();
        shadow.appendChild(style);
      }
      const template = document.createElement('template');
      template.innerHTML = this.html();
      shadow.appendChild(template.content.cloneNode(true));
    }
  }
}