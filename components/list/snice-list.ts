import { element, property, watch, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-list.css?inline';
import type { ListItem, ListSelectionMode, SniceListElement, ListItemSelectDetail } from './snice-list.types';

@element('snice-list')
export class SniceList extends HTMLElement implements SniceListElement {
  @property({ type: Array })
  items: ListItem[] = [];

  @property({ attribute: 'selection-mode' })
  selectionMode: ListSelectionMode = 'none';

  @property({ type: Array, attribute: 'selected-items' })
  selectedItems: string[] = [];

  @property({ type: Boolean })
  hoverable = true;

  @property({ type: Boolean })
  dividers = false;

  @property({ type: Boolean })
  dense = false;

  private itemMap = new Map<string, ListItem>();

  @watch('items')
  handleItemsChange() {
    this.buildItemMap();
  }

  private buildItemMap() {
    this.itemMap.clear();
    for (const item of this.items) {
      this.itemMap.set(item.id, item);
    }
  }

  private handleItemClick(item: ListItem) {
    if (item.disabled || this.selectionMode === 'none') return;

    if (this.selectionMode === 'single') {
      this.selectedItems = [item.id];
    } else {
      this.toggleSelection(item.id);
    }

    this.dispatchSelectEvent(item, this.selectedItems.includes(item.id));
  }

  @dispatch('@snice/list-item-select', { bubbles: true, composed: true })
  private dispatchSelectEvent(item: ListItem, selected: boolean): ListItemSelectDetail {
    return { item, selected, list: this };
  }

  @render()
  render() {
    return html`
      <div class="list" part="container" role="list">
        ${this.items.map((item, index) => {
          const itemClasses = [
            'list__item',
            this.selectedItems.includes(item.id) ? 'list__item--selected' : '',
            item.disabled ? 'list__item--disabled' : '',
            this.dense ? 'list__item--dense' : ''
          ].filter(Boolean).join(' ');

          return html`
            <button
              class="${itemClasses}"
              part="item"
              role="listitem"
              @click="${() => this.handleItemClick(item)}">

              <if ${item.icon || item.iconImage}>
                <div class="list__item-icon" part="item-icon">
                  <if ${item.iconImage}>
                    <img src="${item.iconImage}" alt="" style="width:100%;height:100%;object-fit:contain;" />
                  </if>
                  <if ${!item.iconImage && item.icon}>
                    ${item.icon}
                  </if>
                </div>
              </if>

              <div class="list__item-content" part="item-content">
                <div class="list__item-label" part="item-label">${item.label}</div>
                <if ${item.description}>
                  <div class="list__item-description" part="item-description">${item.description}</div>
                </if>
              </div>
            </button>

            <if ${this.dividers && index < this.items.length - 1}>
              <div class="list__divider" part="divider"></div>
            </if>
          `;
        })}
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  // Public API
  selectItem(id: string) {
    if (this.selectionMode === 'none') return;
    if (this.selectionMode === 'single') {
      this.selectedItems = [id];
    } else if (!this.selectedItems.includes(id)) {
      this.selectedItems = [...this.selectedItems, id];
    }
  }

  deselectItem(id: string) {
    this.selectedItems = this.selectedItems.filter(itemId => itemId !== id);
  }

  toggleSelection(id: string) {
    if (this.selectedItems.includes(id)) {
      this.deselectItem(id);
    } else {
      this.selectItem(id);
    }
  }

  getSelectedItems(): ListItem[] {
    return this.selectedItems.map(id => this.itemMap.get(id)).filter(Boolean) as ListItem[];
  }
}
