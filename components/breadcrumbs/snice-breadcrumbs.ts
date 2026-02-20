import { element, property, watch, query, ready, render, styles, html, css as cssTag } from 'snice';
import { renderIcon } from '../utils';
import cssContent from './snice-breadcrumbs.css?inline';
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

  @property({ type: Number, attribute: 'max-items' })
  maxItems = 0;

  @query('.breadcrumb')
  breadcrumbElement?: HTMLElement;

  @property({ type: Boolean })
  collapsed = true;

  private slotItems: BreadcrumbItem[] = [];

  @property({ type: Number, attribute: false })
  private renderTrigger = 0;

  @render()
  render() {
    const allItems = this.getAllItems();
    const visibleItems = this.getVisibleItems(allItems);
    const hasCollapsed = this.maxItems > 0 && allItems.length > this.maxItems && this.collapsed;
    const breadcrumbClass = `breadcrumb${hasCollapsed ? ' breadcrumb--collapsed' : ''}`;

    return html/*html*/`
      <slot style="display: none" @slotchange="${() => this.handleSlotChange()}"></slot>
      <nav aria-label="Breadcrumb" @click="${(e: Event) => this.handleClick(e)}">
        <ol class="${breadcrumbClass}">
          ${visibleItems.map((item, index) => {
            const isLast = index === visibleItems.length - 1;
            const isActive = item.active || isLast;
            const isHidden = hasCollapsed && index > 0 && index < visibleItems.length - 2;
            const itemClass = `breadcrumb-item${isActive ? ' breadcrumb-item--active' : ''}${isHidden ? ' breadcrumb-item--hidden' : ''}`;

            return html/*html*/`
              <li class="${itemClass}">
                <if ${item.href && !isActive}>
                  <a href="${item.href}"
                     class="breadcrumb-link"
                     aria-current="${isActive ? 'page' : ''}"
                     tabindex="0">
                    ${this.renderItemIcon(item)}
                    ${item.label}
                  </a>
                </if>
                <if ${!item.href || isActive}>
                  <span class="breadcrumb-text"
                        aria-current="${isActive ? 'page' : ''}">
                    ${this.renderItemIcon(item)}
                    ${item.label}
                  </span>
                </if>
                <if ${!isLast}>
                  <span class="breadcrumb-separator" aria-hidden="true">
                    ${this.separator}
                  </span>
                </if>
              </li>
              <if ${hasCollapsed && index === 0 && allItems.length > this.maxItems}>
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
              </if>
            `;
          })}
        </ol>
      </nav>
    `;
  }

  @styles()
  styles() {
    return cssTag`${cssContent}`;
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

  private handleClick(event: Event) {
    const target = event.target as HTMLElement;

    // Handle ellipsis click
    if (target.matches('.breadcrumb-ellipsis')) {
      this.collapsed = false;
      return;
    }

    // Handle breadcrumb link click
    if (target.matches('.breadcrumb-link')) {
      const link = target as HTMLAnchorElement;
      const label = link.textContent?.trim() || '';
      const href = link.getAttribute('href') || '';

      // Find the item index
      const allItems = this.getAllItems();
      const index = allItems.findIndex(item => item.label === label);

      this.dispatchEvent(new CustomEvent('breadcrumb-click', {
        bubbles: true,
        composed: true,
        detail: {
          item: allItems[index],
          index,
          href,
          label
        }
      }));
    }
  }

  private handleSlotChange() {
    const slot = this.shadowRoot?.querySelector('slot');
    if (!slot) return;

    const crumbs = slot.assignedElements().filter(
      el => el.tagName.toLowerCase() === 'snice-crumb'
    ) as SniceCrumbElement[];

    this.slotItems = crumbs.map(crumb => {
      // Check for slotted icon element
      const iconElement = crumb.querySelector('[slot="icon"]') as Element | null;
      return {
        label: crumb.label || crumb.textContent?.trim() || '',
        href: crumb.href || undefined,
        icon: crumb.icon || undefined,
        iconImage: crumb.iconImage || undefined,
        active: crumb.active || false,
        iconNode: iconElement || undefined
      };
    });

    // Trigger re-render to display slot items by updating a property
    this.renderTrigger++;
  }

  @watch('items', 'separator', 'maxItems')
  updateBreadcrumb() {
    this.collapsed = true;
  }

  setItems(items: BreadcrumbItem[]) {
    this.items = items;
  }

  private renderItemIcon(item: BreadcrumbItem) {
    // Slotted icon node takes precedence
    if (item.iconNode) {
      const clone = item.iconNode.cloneNode(true) as Element;
      clone.classList.add('breadcrumb-icon');
      clone.removeAttribute('slot');
      return html`${clone}`;
    }
    // iconImage takes precedence for backwards compatibility
    if (item.iconImage) {
      return renderIcon(item.iconImage, 'breadcrumb-icon');
    }
    if (item.icon) {
      return renderIcon(item.icon, 'breadcrumb-icon');
    }
    return html``;
  }
}