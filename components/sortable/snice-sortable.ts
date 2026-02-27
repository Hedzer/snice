import { element, property, dispatch, ready, dispose, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-sortable.css?inline';
import type { SortableDirection, SniceSortableElement } from './snice-sortable.types';

@element('snice-sortable')
export class SniceSortable extends HTMLElement implements SniceSortableElement {
  @property()
  direction: SortableDirection = 'vertical';

  @property()
  handle = '';

  @property({ type: Boolean })
  disabled = false;

  @property()
  group = '';

  private dragItem: HTMLElement | null = null;
  private dragIndex = -1;
  private items: HTMLElement[] = [];

  @dispatch('sort-start', { bubbles: true, composed: true })
  private emitSortStart() {
    return { index: this.dragIndex, item: this.dragItem };
  }

  @dispatch('sort-end', { bubbles: true, composed: true })
  private emitSortEnd(detail: { oldIndex: number; newIndex: number; item: HTMLElement }) {
    return detail;
  }

  @dispatch('sort-change', { bubbles: true, composed: true })
  private emitSortChange(detail: { oldIndex: number; newIndex: number; item: HTMLElement }) {
    return detail;
  }

  @ready()
  init() {
    this.addEventListener('dragstart', this.onDragStart as EventListener);
    this.addEventListener('dragover', this.onDragOver as EventListener);
    this.addEventListener('dragend', this.onDragEnd as EventListener);
    this.addEventListener('drop', this.onDrop as EventListener);
    this.setupItems();
  }

  @dispose()
  cleanup() {
    this.removeEventListener('dragstart', this.onDragStart as EventListener);
    this.removeEventListener('dragover', this.onDragOver as EventListener);
    this.removeEventListener('dragend', this.onDragEnd as EventListener);
    this.removeEventListener('drop', this.onDrop as EventListener);
  }

  private setupItems() {
    const slot = this.shadowRoot?.querySelector('slot');
    if (!slot) return;
    this.items = (slot.assignedElements() as HTMLElement[]).filter(el => el instanceof HTMLElement);
    this.items.forEach(item => {
      item.draggable = true;
    });
  }

  private getItemIndex(el: HTMLElement): number {
    return this.items.indexOf(el);
  }

  private getItemFromEvent(e: DragEvent): HTMLElement | null {
    const target = e.target as HTMLElement;
    if (this.handle) {
      const handleEl = target.closest(this.handle);
      if (!handleEl) return null;
      return handleEl.closest('[draggable]') as HTMLElement || target;
    }
    return this.items.find(item => item === target || item.contains(target)) || null;
  }

  private onDragStart = (e: DragEvent) => {
    if (this.disabled) return;
    const item = this.getItemFromEvent(e);
    if (!item) return;

    this.dragItem = item;
    this.dragIndex = this.getItemIndex(item);
    item.classList.add('sortable-dragging');

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(this.dragIndex));
    }

    this.emitSortStart();
  };

  private onDragOver = (e: DragEvent) => {
    if (this.disabled || !this.dragItem) return;
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    const item = this.getItemFromEvent(e);
    if (!item || item === this.dragItem) return;

    const rect = item.getBoundingClientRect();
    const isVertical = this.direction === 'vertical';
    const mid = isVertical
      ? rect.top + rect.height / 2
      : rect.left + rect.width / 2;
    const pos = isVertical ? e.clientY : e.clientX;

    if (pos < mid) {
      this.insertBefore(this.dragItem, item);
    } else {
      this.insertBefore(this.dragItem, item.nextSibling);
    }

    this.setupItems();
  };

  private onDrop = (e: DragEvent) => {
    e.preventDefault();
  };

  private onDragEnd = () => {
    if (!this.dragItem) return;
    this.dragItem.classList.remove('sortable-dragging');

    const newIndex = this.getItemIndex(this.dragItem);
    if (this.dragIndex !== newIndex) {
      const detail = { oldIndex: this.dragIndex, newIndex, item: this.dragItem };
      this.emitSortEnd(detail);
      this.emitSortChange(detail);
    }

    this.dragItem = null;
    this.dragIndex = -1;
  };

  @render()
  template() {
    return html`
      <div part="base" class="sortable">
        <slot @slotchange=${() => this.setupItems()}></slot>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }
}
