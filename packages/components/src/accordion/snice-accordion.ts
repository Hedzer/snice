import { element, property, ready, on, dispatch, queryAll, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-accordion.css?inline';
import type { SniceAccordionElement, SniceAccordionItemElement } from './snice-accordion.types';

@element('snice-accordion')
export class SniceAccordion extends HTMLElement implements SniceAccordionElement {
  @property({ type: Boolean,  })
  multiple = false;

  @property()
  variant: 'bordered' | 'elevated' = 'bordered';

  @queryAll('snice-accordion-item', { light: true, shadow: false })
  items?: NodeListOf<SniceAccordionItemElement>;

  activeItems: Set<string> = new Set();

  @render()
  render() {
    return html/*html*/`
      <div class="accordion ${this.variant === 'elevated' ? 'accordion--elevated' : ''}" @keydown="${(e: KeyboardEvent) => this.handleKeydown(e)}">
        <slot @slotchange="${() => this.updateItems()}"></slot>
      </div>
    `;
  }

  @styles()
  styles() {
    return cssTag`${cssContent}`;
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.navigateItems(e, 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.navigateItems(e, -1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.navigateToEdge(e, 'first');
    } else if (e.key === 'End') {
      e.preventDefault();
      this.navigateToEdge(e, 'last');
    }
  }

  @ready()
  init() {
    this.updateItems();
  }

  private updateItems() {
    if (!this.items) return;

    this.items.forEach((item, index) => {
      // Set default ID if not provided
      if (!item.itemId) {
        item.itemId = `accordion-item-${index}`;
      }

      // Track open items
      if (item.open) {
        this.activeItems.add(item.itemId);
      }
    });
  }

  @on('accordion-item-toggle')
  handleItemToggle(event: CustomEvent<{ itemId: string; open: boolean }>) {
    const { itemId, open } = event.detail;

    if (open) {
      // If not multiple mode, close other items
      if (!this.multiple) {
        this.activeItems.forEach(id => {
          if (id !== itemId) {
            this.closeItem(id);
          }
        });
        this.activeItems.clear();
      }

      this.activeItems.add(itemId);
      this.emitOpen(itemId);
    } else {
      this.activeItems.delete(itemId);
      this.emitClose(itemId);
    }
  }

  openItem(id: string) {
    const item = this.getItem(id);
    if (item && !item.disabled) {
      item.expand();
    }
  }

  closeItem(id: string) {
    this.getItem(id)?.collapse();
  }

  toggleItem(id: string) {
    const item = this.getItem(id);
    if (item && !item.disabled) {
      item.toggle();
    }
  }

  openAll() {
    if (!this.multiple || !this.items) return;

    this.items.forEach(item => {
      if (!item.disabled) {
        item.expand();
      }
    });
  }

  closeAll() {
    if (!this.items) return;

    this.items.forEach(item => {
      item.collapse();
    });
  }

  @dispatch('accordion-open', { bubbles: true, composed: true })
  private emitOpen(itemId: string) {
    return { itemId, item: this.getItem(itemId) };
  }

  @dispatch('accordion-close', { bubbles: true, composed: true })
  private emitClose(itemId: string) {
    return { itemId, item: this.getItem(itemId) };
  }

  private getItem(id: string): SniceAccordionItemElement | null {
    return this.querySelector(`snice-accordion-item[item-id="${id}"]`) as SniceAccordionItemElement | null;
  }

  private enabledItems(): SniceAccordionItemElement[] {
    return Array.from(this.items ?? []).filter(item => !item.disabled);
  }

  private navigateItems(event: KeyboardEvent, direction: number) {
    const items = this.enabledItems();
    const currentIndex = items.indexOf(event.target as SniceAccordionItemElement);

    if (currentIndex === -1) return;

    const nextIndex = direction > 0
      ? (currentIndex + 1) % items.length
      : currentIndex - 1 < 0 ? items.length - 1 : currentIndex - 1;

    items[nextIndex]?.focusHeader();
  }

  private navigateToEdge(event: KeyboardEvent, edge: 'first' | 'last') {
    const items = this.enabledItems();

    if (!items.includes(event.target as SniceAccordionItemElement)) return;

    const target = edge === 'first' ? items[0] : items[items.length - 1];
    target?.focusHeader();
  }
}
