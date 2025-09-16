import { element, property, on, dispatch, ready, queryAll } from 'snice';
import css from './snice-accordion.css?inline';
import type { SniceAccordionElement, SniceAccordionItemElement, AccordionOpenEvent, AccordionCloseEvent } from './snice-accordion.types';

@element('snice-accordion')
export class SniceAccordion extends HTMLElement implements SniceAccordionElement {
  @property({ type: Boolean, reflect: true })
  multiple = false;

  @queryAll('snice-accordion-item', { light: true, shadow: false })
  items?: NodeListOf<SniceAccordionItemElement>;

  activeItems: Set<string> = new Set();

  html() {
    return /*html*/`
      <div class="accordion">
        <slot></slot>
      </div>
    `;
  }

  css() {
    return css;
  }

  @ready()
  init() {
    // Set up initial state
    this.updateItems();
  }

  @on('slotchange', 'slot', { debounce: 50 })
  handleSlotChange() {
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

  @dispatch('accordion-open', { bubbles: true, composed: true })
  private dispatchOpenEvent(itemId: string): AccordionOpenEvent['detail'] {
    const item = this.querySelector(`snice-accordion-item[item-id="${itemId}"]`) as SniceAccordionItemElement;
    return { itemId, item };
  }

  @dispatch('accordion-close', { bubbles: true, composed: true })
  private dispatchCloseEvent(itemId: string): AccordionCloseEvent['detail'] {
    const item = this.querySelector(`snice-accordion-item[item-id="${itemId}"]`) as SniceAccordionItemElement;
    return { itemId, item };
  }

  // Keyboard navigation
  @on('keydown:ArrowDown', { preventDefault: true })
  handleArrowDown(event: KeyboardEvent) {
    this.navigateItems(event, 1);
  }

  @on('keydown:ArrowUp', { preventDefault: true })
  handleArrowUp(event: KeyboardEvent) {
    this.navigateItems(event, -1);
  }

  @on('keydown:Home', { preventDefault: true })
  handleHome(event: KeyboardEvent) {
    this.navigateToIndex(event, 0);
  }

  @on('keydown:End', { preventDefault: true })
  handleEnd(event: KeyboardEvent) {
    if (!this.items) return;
    this.navigateToIndex(event, this.items.length - 1);
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