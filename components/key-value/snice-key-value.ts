import { element, property, dispatch, ready, observe, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-key-value.css?inline';
import './snice-kv-pair';
import type { KeyValueItem, KeyValueVariant, KeyValueMode, SniceKeyValueElement, SniceKvPairElement } from './snice-key-value.types';

@element('snice-key-value', { formAssociated: true })
export class SniceKeyValue extends HTMLElement implements SniceKeyValueElement {
  internals!: ElementInternals;

  @property()
  label = '';

  @property({ type: Boolean, attribute: 'auto-expand' })
  autoExpand = true;

  @property({ type: Number })
  rows = 0;

  @property({ type: Boolean, attribute: 'show-description' })
  showDescription = false;

  @property({ attribute: 'key-placeholder' })
  keyPlaceholder = 'Key';

  @property({ attribute: 'value-placeholder' })
  valuePlaceholder = 'Value';

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  readonly = false;

  @property()
  name = '';

  @property()
  variant: KeyValueVariant = 'default';

  @property()
  mode: KeyValueMode = 'edit';

  @property({ type: Boolean, attribute: 'show-copy' })
  showCopy = false;

  /** Per-row placeholder samples */
  placeholders: Array<{ key: string; value: string }> = [];

  /** Internal items for rendering — reactive property triggers re-render */
  @property({ type: Array, attribute: false })
  private items: KeyValueItem[] = [];

  /** Stable placeholder assignments per row index */
  private placeholderMap = new Map<number, { key: string; value: string }>();

  /** Tracks whether slot children are driving the data */
  private usingSlotMode = false;

  /** Copy button feedback state */
  private copyFeedback = false;

  @dispatch('kv-add', { bubbles: true, composed: true })
  private emitAdd(item: KeyValueItem, index: number) {
    return { item, index };
  }

  @dispatch('kv-remove', { bubbles: true, composed: true })
  private emitRemove(item: KeyValueItem, index: number) {
    return { item, index };
  }

  @dispatch('kv-change', { bubbles: true, composed: true })
  private emitChange() {
    return { items: this.getItems() };
  }

  @dispatch('kv-copy', { bubbles: true, composed: true })
  private emitCopy() {
    return { items: this.getItems() };
  }

  @ready()
  init() {
    this.syncFromChildren();
    if (!this.usingSlotMode) {
      this.items = this.padItems(this.items);
    }
    this.updateFormValue();
  }

  @observe('mutation:childList')
  onChildListChange() {
    this.syncFromChildren();
  }

  @observe('mutation:attributes', { subtree: true })
  onChildAttrChange() {
    this.syncFromChildren();
  }

  private syncFromChildren() {
    const children = Array.from(this.querySelectorAll('snice-kv-pair')) as SniceKvPairElement[];
    if (children.length > 0) {
      this.usingSlotMode = true;
      const newItems = children.map(child => ({
        key: child.getAttribute('key') || '',
        value: child.getAttribute('value') || '',
        description: child.getAttribute('description') || '',
      }));
      this.items = this.padItems(newItems);
    } else {
      this.usingSlotMode = false;
    }
    this.updateFormValue();
  }

  /** Serialize non-empty items as JSON object for form submission */
  private updateFormValue() {
    if (!this.internals) return;
    const items = this.getItems();
    if (items.length === 0) {
      this.internals.setFormValue('');
      return;
    }
    const obj: Record<string, string> = {};
    for (const item of items) {
      obj[item.key] = item.value;
    }
    this.internals.setFormValue(JSON.stringify(obj));
  }

  /** Pad/trim items to match rows config, ensure at least one row */
  private padItems(items: KeyValueItem[]): KeyValueItem[] {
    const result = [...items];
    if (this.rows > 0) {
      while (result.length < this.rows) {
        result.push({ key: '', value: '', description: '' });
      }
      if (result.length > this.rows) {
        return result.slice(0, this.rows);
      }
    } else if (this.autoExpand) {
      const hasEmptyLast = result.length > 0 && this.isEmptyItem(result[result.length - 1]);
      if (!hasEmptyLast) {
        result.push({ key: '', value: '', description: '' });
      }
    }
    if (result.length === 0) {
      result.push({ key: '', value: '', description: '' });
    }
    return result;
  }

  private isEmptyItem(item: KeyValueItem): boolean {
    return !item.key && !item.value && (!item.description || !item.description.trim());
  }

  // --- Public Methods ---

  /** Get form value as JSON object */
  get value(): string {
    const items = this.getItems();
    if (items.length === 0) return '';
    const obj: Record<string, string> = {};
    for (const item of items) {
      obj[item.key] = item.value;
    }
    return JSON.stringify(obj);
  }

  setItems(items: KeyValueItem[]): void {
    if (!this.usingSlotMode) {
      const mapped = items.map(i => ({ key: i.key || '', value: i.value || '', description: i.description || '' }));
      this.items = this.padItems(mapped);
      this.updateFormValue();
    }
  }

  addItem(key = '', value = '', description = ''): void {
    if (this.usingSlotMode) return;
    const item: KeyValueItem = { key, value, description };
    const current = [...this.items];
    if (this.autoExpand && this.rows === 0 && current.length > 0 && this.isEmptyItem(current[current.length - 1])) {
      current.splice(current.length - 1, 0, item);
    } else {
      current.push(item);
    }
    this.items = this.padItems(current);
    const idx = this.items.indexOf(item);
    this.emitAdd(item, idx);
    this.emitChange();
    this.updateFormValue();
  }

  removeItem(index: number): void {
    if (this.usingSlotMode) return;
    if (index < 0 || index >= this.items.length) return;
    const removed = this.items[index];
    const current = this.items.filter((_, i) => i !== index);
    this.items = this.padItems(current);
    this.emitRemove(removed, index);
    this.emitChange();
    this.updateFormValue();
  }

  clear(): void {
    if (this.usingSlotMode) return;
    this.items = this.padItems([]);
    this.emitChange();
    this.updateFormValue();
  }

  getItems(): KeyValueItem[] {
    return this.items.filter(i => !this.isEmptyItem(i));
  }

  focus(): void {
    const firstInput = this.shadowRoot?.querySelector('.kv__input') as HTMLInputElement | null;
    firstInput?.focus();
  }

  // --- Row placeholders ---

  private getPlaceholder(rowIndex: number): { key: string; value: string } {
    if (this.placeholders.length === 0) {
      return { key: this.keyPlaceholder, value: this.valuePlaceholder };
    }
    if (!this.placeholderMap.has(rowIndex)) {
      const idx = Math.floor(Math.random() * this.placeholders.length);
      this.placeholderMap.set(rowIndex, this.placeholders[idx]);
    }
    return this.placeholderMap.get(rowIndex)!;
  }

  // --- Event handlers ---

  private handleKeyInput(index: number, e: Event) {
    const input = e.target as HTMLInputElement;
    const current = [...this.items];
    current[index] = { ...current[index], key: input.value };
    const needsExpand = this.autoExpand && this.rows === 0 && index === current.length - 1 && !this.isEmptyItem(current[index]);
    if (needsExpand) {
      current.push({ key: '', value: '', description: '' });
    }
    this.items = current;
    this.emitChange();
    this.updateFormValue();
  }

  private handleValueInput(index: number, e: Event) {
    const input = e.target as HTMLInputElement;
    const current = [...this.items];
    current[index] = { ...current[index], value: input.value };
    const needsExpand = this.autoExpand && this.rows === 0 && index === current.length - 1 && !this.isEmptyItem(current[index]);
    if (needsExpand) {
      current.push({ key: '', value: '', description: '' });
    }
    this.items = current;
    this.emitChange();
    this.updateFormValue();
  }

  private handleDescriptionInput(index: number, e: Event) {
    const input = e.target as HTMLInputElement;
    const current = [...this.items];
    current[index] = { ...current[index], description: input.value };
    this.items = current;
    this.emitChange();
    this.updateFormValue();
  }

  private handleDelete(index: number) {
    if (this.rows > 0) return;
    const removed = this.items[index];
    const current = this.items.filter((_, i) => i !== index);
    this.items = this.padItems(current);
    if (!this.isEmptyItem(removed)) {
      this.emitRemove(removed, index);
      this.emitChange();
    }
    this.updateFormValue();
  }

  private async handleCopy() {
    const items = this.getItems();
    const obj: Record<string, string> = {};
    for (const item of items) {
      obj[item.key] = item.value;
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
      this.copyFeedback = true;
      this.emitCopy();
      // Reset feedback after delay
      setTimeout(() => {
        this.copyFeedback = false;
      }, 1500);
    } catch {
      // Clipboard API not available
    }
  }

  // --- Render ---

  private renderEditRow(item: KeyValueItem, index: number) {
    const ph = this.getPlaceholder(index);
    const isFixedMode = this.rows > 0;
    const canDelete = !isFixedMode && !this.readonly && !this.disabled;
    const showDesc = this.showDescription;

    return html`
      <div class="kv__row" part="row">
        <div class="kv__fields">
          <div class="kv__pair">
            <input
              class="kv__input"
              part="key-input"
              type="text"
              placeholder="${ph.key}"
              .value="${item.key}"
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              @input=${(e: Event) => this.handleKeyInput(index, e)}
            />
            <input
              class="kv__input"
              part="value-input"
              type="text"
              placeholder="${ph.value}"
              .value="${item.value}"
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              @input=${(e: Event) => this.handleValueInput(index, e)}
            />
          </div>
          <if ${showDesc}>
            <input
              class="kv__description"
              part="description-input"
              type="text"
              placeholder="Description"
              .value="${item.description || ''}"
              ?disabled=${this.disabled}
              ?readonly=${this.readonly}
              @input=${(e: Event) => this.handleDescriptionInput(index, e)}
            />
          </if>
        </div>
        <if ${canDelete}>
          <button
            class="kv__delete"
            part="delete-button"
            type="button"
            tabindex="-1"
            title="Remove row"
            @click=${() => this.handleDelete(index)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </if>
      </div>
    `;
  }

  private renderViewRow(item: KeyValueItem) {
    const showDesc = this.showDescription;
    const hasDesc = showDesc && item.description;

    return html`
      <div class="kv__view-row" part="view-row">
        <span class="kv__view-key" part="view-key">${item.key}</span>
        <div>
          <span class="kv__view-value" part="view-value">${item.value}</span>
          <if ${hasDesc}>
            <div class="kv__view-desc" part="view-desc">${item.description}</div>
          </if>
        </div>
      </div>
    `;
  }

  private renderCopyButton() {
    const isCopied = this.copyFeedback;

    return html`
      <button
        class="kv__copy ${isCopied ? 'kv__copy--copied' : ''}"
        part="copy-button"
        type="button"
        tabindex="-1"
        title="${isCopied ? 'Copied!' : 'Copy as JSON'}"
        @click=${() => this.handleCopy()}
      >
        <if ${isCopied}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </if>
        <if ${!isCopied}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
        </if>
      </button>
    `;
  }

  @render()
  template() {
    const hasTitle = !!this.label;
    const isView = this.mode === 'view';
    const visibleItems = isView ? this.getItems() : this.items;
    const isEmpty = isView && visibleItems.length === 0;
    const showCopyBtn = this.showCopy && this.getItems().length > 0;

    return html`
      <div class="kv" part="base">
        <if ${hasTitle || showCopyBtn}>
          <div class="kv__header">
            <if ${hasTitle}>
              <h3 class="kv__title" part="title">${this.label}</h3>
            </if>
            <if ${showCopyBtn}>
              ${this.renderCopyButton()}
            </if>
          </div>
        </if>
        <if ${isEmpty}>
          <div class="kv__empty" part="empty">No entries</div>
        </if>
        <if ${!isEmpty}>
          <div class="kv__rows" part="rows">
            ${isView
              ? visibleItems.map((item) => this.renderViewRow(item))
              : visibleItems.map((item, i) => this.renderEditRow(item, i))
            }
          </div>
        </if>
        <slot></slot>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-key-value': SniceKeyValue;
    'snice-kv-pair': import('./snice-kv-pair').SniceKvPair;
  }
}
