import { element, property, ready, queryAll, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-accordion.css?inline';
import type { SniceAccordionElement, SniceAccordionItemElement, AccordionOpenEvent, AccordionCloseEvent } from './snice-accordion.types';

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
        <slot @slotchange="${(e: Event) => this.handleSlotChange(e)}"></slot>
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
      this.navigateToIndex(e, 0);
    } else if (e.key === 'End') {
      e.preventDefault();
      if (!this.items) return;
      this.navigateToIndex(e, this.items.length - 1);
    }
  }

  private handleSlotChange(e: Event) {
    this.updateItems();
  }

  @ready()
  init() {
    // Set up initial state
    this.updateItems();

    // Listen for accordion-item-toggle events
    this.addEventListener('accordion-item-toggle', (e: Event) => {
      this.handleItemToggle(e as CustomEvent<{ itemId: string; open: boolean }>);
    });
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

  private handleItemToggle(event: CustomEvent<{ itemId: string; open: boolean }>) {
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
      this.dispatchOpenEvent(itemId);
    } else {
      this.activeItems.delete(itemId);
      this.dispatchCloseEvent(itemId);
    }
  }

  openItem(id: string) {
    const item = this.querySelector(`snice-accordion-item[item-id="${id}"]`) as SniceAccordionItemElement;
    if (item && !item.disabled) {
      item.expand();
    }
  }

  closeItem(id: string) {
    const item = this.querySelector(`snice-accordion-item[item-id="${id}"]`) as SniceAccordionItemElement;
    if (item) {
      item.collapse();
    }
  }

  toggleItem(id: string) {
    const item = this.querySelector(`snice-accordion-item[item-id="${id}"]`) as SniceAccordionItemElement;
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

  private dispatchOpenEvent(itemId: string) {
    const item = this.querySelector(`snice-accordion-item[item-id="${itemId}"]`) as SniceAccordionItemElement;
    this.dispatchEvent(new CustomEvent('accordion-open', {
      bubbles: true,
      composed: true,
      detail: { itemId, item }
    }));
  }

  private dispatchCloseEvent(itemId: string) {
    const item = this.querySelector(`snice-accordion-item[item-id="${itemId}"]`) as SniceAccordionItemElement;
    this.dispatchEvent(new CustomEvent('accordion-close', {
      bubbles: true,
      composed: true,
      detail: { itemId, item }
    }));
  }

  private navigateItems(event: KeyboardEvent, direction: number) {
    if (!this.items) return;
    
    const items = Array.from(this.items).filter(item => !item.disabled);
    const currentItem = event.target as SniceAccordionItemElement;
    const currentIndex = items.indexOf(currentItem);
    
    if (currentIndex === -1) return;
    
    const nextIndex = direction > 0
      ? (currentIndex + 1) % items.length
      : currentIndex - 1 < 0 ? items.length - 1 : currentIndex - 1;
    
    const nextItem = items[nextIndex];
    const button = nextItem.shadowRoot?.querySelector('.accordion-item__header') as HTMLElement;
    button?.focus();
  }

  private navigateToIndex(event: KeyboardEvent, index: number) {
    if (!this.items) return;
    
    const items = Array.from(this.items).filter(item => !item.disabled);
    const currentItem = event.target as SniceAccordionItemElement;
    
    if (!items.includes(currentItem)) return;
    
    const targetItem = items[index];
    if (targetItem) {
      const button = targetItem.shadowRoot?.querySelector('.accordion-item__header') as HTMLElement;
      button?.focus();
    }
  }
}