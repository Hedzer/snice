import { element, property, state, query, queryAll, watch, dispatch, ready, observe, dispose, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-key-value.css?inline';
import './snice-kv-pair';
import type { KeyValueItem, KeyValueVariant, KeyValueMode, SniceKeyValueElement, SniceKvPairElement } from './snice-key-value.types';

@element('snice-key-value', { formAssociated: true })
export class SniceKeyValue extends HTMLElement implements SniceKeyValueElement {
  internals!: ElementInternals;

  private dirtyValue = false;
  private customValidationMessage = '';
  private serializedParseError = false;
  private validationInput?: HTMLInputElement;
  private copyFeedbackTimer?: number;

  @query('[part="key-input"]')
  private firstKeyInput?: HTMLInputElement;

  @queryAll('[part="key-input"]')
  private keyInputs!: NodeListOf<HTMLInputElement>;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }

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

  @property({ type: Boolean })
  required = false;

  @property()
  name = '';

  @property()
  variant: KeyValueVariant = 'default';

  @property()
  mode: KeyValueMode = 'edit';

  @property({ type: Boolean, attribute: 'show-copy' })
  showCopy = false;

  @state()
  private valueState = '[]';

  @state()
  private formDisabled = false;

  /**
   * Ordered JSON entry-array value. Duplicate keys, descriptions, Unicode,
   * and row order are preserved. Assigning it does not change the reset
   * default stored by the `value` content attribute.
   * @public
   */
  get value(): string {
    return this.valueState;
  }

  set value(value: string) {
    this.setValueFromSerialized(value, true);
  }

  /** The `value` content attribute and imperative-mode form-reset default. */
  @property({ attribute: 'value' })
  defaultValue = '[]';

  /** Per-row placeholder samples */
  @property({ type: Array, attribute: false })
  placeholders: Array<{ key: string; value: string }> = [];

  /** Internal items for rendering — reactive property triggers re-render */
  @state()
  private items: KeyValueItem[] = [];

  /** Stable placeholder assignments per row index */
  private placeholderMap = new Map<number, { key: string; value: string }>();

  /** Tracks whether slot children are driving the data */
  private usingSlotMode = false;

  /** Copy button feedback state */
  @property({ type: Boolean, attribute: false })
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
    let preUpgradeValue: unknown;
    if (Object.prototype.hasOwnProperty.call(this, 'value')) {
      preUpgradeValue = (this as { value: unknown }).value;
      delete (this as Partial<{ value: unknown }>).value;
    }

    const children = this.getPairChildren();
    if (children.length > 0) {
      this.commitItems(this.itemsFromChildren(children), false);
      this.usingSlotMode = true;
    } else if (preUpgradeValue !== undefined) {
      this.value = String(preUpgradeValue ?? '');
    } else if (!this.dirtyValue && Array.isArray(this.items) && this.dataItems(this.items).length > 0) {
      // Preserve the pre-existing runtime behavior for consumers that assign
      // the reactive `items` field before connection. The documented
      // `setItems()` API remains preferred, but connection must not discard
      // state that older code already supplied.
      this.commitItems(this.items, true);
    } else if (!this.dirtyValue) {
      this.applyDefaultValue();
    } else {
      this.commitItems(this.items, true);
    }

    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
    this.syncFormState();
    queueMicrotask(() => this.syncValidity());
  }

  private formAssociatedCallback() {
    this.syncFormState();
  }

  private formResetCallback() {
    this.dirtyValue = false;
    if (this.usingSlotMode) this.syncFromChildren();
    else this.applyDefaultValue();
  }

  private formDisabledCallback(disabled: boolean) {
    // Ancestor fieldset state is effective state; it must never overwrite the
    // authored public `disabled` property.
    this.formDisabled = disabled;
    this.syncValidity();
  }

  private formStateRestoreCallback(state: File | string | FormData | null) {
    if (typeof state !== 'string') return;
    this.setValueFromSerialized(state, true);
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
    const children = this.getPairChildren();
    if (children.length > 0) {
      this.usingSlotMode = true;
      this.commitItems(this.itemsFromChildren(children), false);
    } else if (this.usingSlotMode) {
      this.usingSlotMode = false;
      this.dirtyValue = false;
      this.applyDefaultValue();
    }
  }

  private get interactionDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  private get validationBarred(): boolean {
    return this.interactionDisabled || this.readonly || this.mode === 'view';
  }

  private getPairChildren(): SniceKvPairElement[] {
    return Array.from(this.children)
      .filter((child): child is SniceKvPairElement => child.tagName === 'SNICE-KV-PAIR');
  }

  private itemsFromChildren(children: SniceKvPairElement[]): KeyValueItem[] {
    return children.map(child => ({
      key: child.getAttribute('key') ?? '',
      value: child.getAttribute('value') ?? '',
      description: child.getAttribute('description') ?? '',
    }));
  }

  private normalizeItem(item: Partial<KeyValueItem> | null | undefined): KeyValueItem {
    return {
      key: String(item?.key ?? ''),
      value: String(item?.value ?? ''),
      description: String(item?.description ?? ''),
    };
  }

  private serializeItems(items: KeyValueItem[]): string {
    return JSON.stringify(items.map(item => ({
      key: item.key,
      value: item.value,
      description: item.description ?? '',
    })));
  }

  private parseSerializedItems(value: unknown): KeyValueItem[] | null {
    const candidate = String(value ?? '');
    if (candidate === '') return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(candidate);
    } catch {
      return null;
    }

    // Accept the previous object representation as input for migration, but
    // always expose and submit the ordered entry-array representation.
    if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
      const entries = Object.entries(parsed as Record<string, unknown>);
      if (entries.some(([, entryValue]) => typeof entryValue !== 'string')) return null;
      return entries.map(([key, entryValue]) => ({ key, value: entryValue as string, description: '' }));
    }

    if (!Array.isArray(parsed)) return null;
    const items: KeyValueItem[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
      const candidateEntry = entry as Record<string, unknown>;
      if (Object.keys(candidateEntry).some(key => !['key', 'value', 'description'].includes(key))) return null;
      if (typeof candidateEntry.key !== 'string' || typeof candidateEntry.value !== 'string') return null;
      if (candidateEntry.description !== undefined && typeof candidateEntry.description !== 'string') return null;
      items.push({
        key: candidateEntry.key,
        value: candidateEntry.value,
        description: candidateEntry.description ?? '',
      });
    }
    return items;
  }

  private setValueFromSerialized(value: unknown, dirty: boolean) {
    const candidate = String(value ?? '');
    const parsed = this.parseSerializedItems(candidate);
    if (parsed === null) {
      if (dirty) this.dirtyValue = true;
      this.items = this.padItems([]);
      this.valueState = candidate;
      this.serializedParseError = true;
      this.syncFormState();
      return;
    }
    this.commitItems(parsed, dirty);
  }

  private applyDefaultValue() {
    this.setValueFromSerialized(this.defaultValue, false);
  }

  private commitItems(items: KeyValueItem[], dirty: boolean) {
    if (dirty) this.dirtyValue = true;
    const normalized = items.map(item => this.normalizeItem(item));
    this.items = this.padItems(normalized);
    this.serializedParseError = false;
    this.valueState = this.serializeItems(this.dataItems(this.items));
    this.syncFormState();
  }

  private dataItems(items: KeyValueItem[]): KeyValueItem[] {
    return items.filter(item => !this.isEmptyItem(item));
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

  private isEmptyItem(item: KeyValueItem | undefined): boolean {
    if (!item) return true;
    return !item.key && !item.value && (!item.description || !item.description.trim());
  }

  // --- Public Methods ---

  setItems(items: KeyValueItem[]): void {
    if (!this.usingSlotMode) {
      this.commitItems(Array.isArray(items) ? items : [], true);
    }
  }

  addItem(key = '', value = '', description = ''): void {
    if (this.usingSlotMode) return;
    const item: KeyValueItem = { key, value, description };
    const current = [...this.items];
    const emptyIndex = current.findIndex(candidate => this.isEmptyItem(candidate));
    if (emptyIndex >= 0) current[emptyIndex] = item;
    else if (this.rows === 0) {
      current.push(item);
    }
    const idx = emptyIndex >= 0 ? emptyIndex : current.indexOf(item);
    if (idx < 0) return;
    this.commitItems(current, true);
    this.emitAdd(item, idx);
    this.emitChange();
  }

  removeItem(index: number): void {
    if (this.usingSlotMode) return;
    if (index < 0 || index >= this.items.length) return;
    const removed = this.items[index];
    const current = this.items.filter((_, i) => i !== index);
    this.commitItems(current, true);
    this.emitRemove(removed, index);
    this.emitChange();
  }

  clear(): void {
    if (this.usingSlotMode) return;
    this.commitItems([], true);
    this.emitChange();
  }

  getItems(): KeyValueItem[] {
    return this.dataItems(this.items).map(item => ({ ...item }));
  }

  focus(): void {
    this.firstKeyInput?.focus();
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
    if (this.interactionDisabled || this.readonly || this.mode === 'view') {
      input.value = this.items[index]?.key ?? '';
      return;
    }
    const current = [...this.items];
    current[index] = { ...current[index], key: input.value };
    const needsExpand = this.autoExpand && this.rows === 0 && index === current.length - 1 && !this.isEmptyItem(current[index]);
    if (needsExpand) {
      current.push({ key: '', value: '', description: '' });
    }
    this.commitItems(current, true);
    this.emitChange();
  }

  private handleValueInput(index: number, e: Event) {
    const input = e.target as HTMLInputElement;
    if (this.interactionDisabled || this.readonly || this.mode === 'view') {
      input.value = this.items[index]?.value ?? '';
      return;
    }
    const current = [...this.items];
    current[index] = { ...current[index], value: input.value };
    const needsExpand = this.autoExpand && this.rows === 0 && index === current.length - 1 && !this.isEmptyItem(current[index]);
    if (needsExpand) {
      current.push({ key: '', value: '', description: '' });
    }
    this.commitItems(current, true);
    this.emitChange();
  }

  private handleDescriptionInput(index: number, e: Event) {
    const input = e.target as HTMLInputElement;
    if (this.interactionDisabled || this.readonly || this.mode === 'view') {
      input.value = this.items[index]?.description ?? '';
      return;
    }
    const current = [...this.items];
    current[index] = { ...current[index], description: input.value };
    this.commitItems(current, true);
    this.emitChange();
  }

  private handleDelete(index: number) {
    if (this.rows > 0 || this.interactionDisabled || this.readonly || this.mode === 'view') return;
    const removed = this.items[index];
    const current = this.items.filter((_, i) => i !== index);
    this.commitItems(current, true);
    if (!this.isEmptyItem(removed)) {
      this.emitRemove(removed, index);
      this.emitChange();
    }
  }

  private async handleCopy() {
    if (this.interactionDisabled) return;
    try {
      const items = this.getItems();
      await navigator.clipboard.writeText(JSON.stringify(items, null, 2));
      this.copyFeedback = true;
      this.emitCopy();
      if (this.copyFeedbackTimer !== undefined) window.clearTimeout(this.copyFeedbackTimer);
      this.copyFeedbackTimer = window.setTimeout(() => {
        this.copyFeedback = false;
        this.copyFeedbackTimer = undefined;
      }, 1500);
    } catch {
      // Clipboard API not available
    }
  }

  @dispose()
  private cleanupCopyFeedback() {
    if (this.copyFeedbackTimer !== undefined) window.clearTimeout(this.copyFeedbackTimer);
    this.copyFeedbackTimer = undefined;
    this.copyFeedback = false;
  }

  @watch('defaultValue', { immediate: false })
  private handleDefaultValueChange() {
    if (!this.usingSlotMode && !this.dirtyValue) this.applyDefaultValue();
  }

  @watch('rows', 'autoExpand', { immediate: false })
  private handleRowConfigurationChange() {
    this.commitItems(this.items, this.dirtyValue);
  }

  @watch('placeholders', 'keyPlaceholder', 'valuePlaceholder', { immediate: false })
  private handlePlaceholderChange() {
    this.placeholderMap.clear();
  }

  @watch('disabled', 'formDisabled', 'readonly', 'mode', 'required', { immediate: false })
  private handleFormStateChange() {
    this.syncValidity();
  }

  @watch('name', { immediate: false })
  private handleNameChange() {
    this.syncFormState();
  }

  private isMalformedItem(item: KeyValueItem | undefined): boolean {
    if (!item || this.isEmptyItem(item)) return false;
    return item.key.trim().length === 0;
  }

  private getValidityFlags(): ValidityStateFlags {
    if (this.validationBarred) {
      return {
        badInput: false,
        customError: false,
        patternMismatch: false,
        rangeOverflow: false,
        rangeUnderflow: false,
        stepMismatch: false,
        tooLong: false,
        tooShort: false,
        typeMismatch: false,
        valueMissing: false,
      };
    }

    const dataItems = this.dataItems(this.items);
    return {
      badInput: this.serializedParseError || dataItems.some(item => this.isMalformedItem(item)),
      customError: Boolean(this.customValidationMessage),
      patternMismatch: false,
      rangeOverflow: false,
      rangeUnderflow: false,
      stepMismatch: false,
      tooLong: false,
      tooShort: false,
      typeMismatch: false,
      valueMissing: this.required && dataItems.length === 0,
    };
  }

  private getValidationMessage(flags = this.getValidityFlags()): string {
    if (flags.customError) return this.customValidationMessage;
    if (this.serializedParseError) return 'Enter key-value data as an ordered JSON entry array.';
    if (flags.valueMissing) return 'Add at least one key-value entry.';
    if (flags.badInput) {
      const malformedIndex = this.items.findIndex(item => this.isMalformedItem(item));
      return `Row ${malformedIndex + 1} needs a non-empty key.`;
    }
    return '';
  }

  private getValidationAnchor(flags = this.getValidityFlags()): HTMLInputElement | undefined {
    const inputs = this.keyInputs;
    if (!inputs?.length) return undefined;
    if (flags.badInput && !this.serializedParseError) {
      const malformedIndex = this.items.findIndex(item => this.isMalformedItem(item));
      if (malformedIndex >= 0) return inputs[malformedIndex] ?? inputs[0];
    }
    return inputs[0];
  }

  private hasValidationError(): boolean {
    const flags = this.getValidityFlags();
    return Object.values(flags).some(Boolean);
  }

  private syncFormState() {
    if (this.internals) this.internals.setFormValue(this.valueState, this.valueState);
    this.syncValidity();
    queueMicrotask(() => this.syncValidity());
  }

  private syncValidity() {
    const flags = this.getValidityFlags();
    const hasError = Object.values(flags).some(Boolean);
    const message = this.getValidationMessage(flags);
    const anchor = this.getValidationAnchor(flags);

    if (this.internals) {
      if (!hasError) this.internals.setValidity({});
      else if (anchor) this.internals.setValidity(flags, message, anchor);
      else this.internals.setValidity(flags, message);
    }

    const proxy = this.validationProxy;
    proxy.setCustomValidity(hasError ? message : '');

    this.keyInputs.forEach((input, index) => {
      const rowInvalid = !this.validationBarred && (
        (this.serializedParseError && index === 0) ||
        (flags.valueMissing && index === 0) ||
        (flags.customError && index === 0) ||
        this.isMalformedItem(this.items[index])
      );
      input.setAttribute('aria-invalid', String(rowInvalid));
      input.classList.toggle('kv__input--invalid', rowInvalid);
    });
  }

  private get validationProxy(): HTMLInputElement {
    if (!this.validationInput) this.validationInput = document.createElement('input');
    return this.validationInput;
  }

  private get fallbackFormOwner(): HTMLFormElement | null {
    const explicitOwner = this.getAttribute('form');
    if (explicitOwner !== null) {
      const root = this.getRootNode();
      if (!('querySelectorAll' in root)) return null;
      return Array.from((root as ParentNode).querySelectorAll('form[id]'))
        .find((candidate): candidate is HTMLFormElement =>
          candidate instanceof HTMLFormElement && candidate.id === explicitOwner
        ) ?? null;
    }
    return this.closest('form');
  }

  /** Native-compatible control type. @public */
  get type(): 'key-value' {
    return 'key-value';
  }

  /** Owning form, including association through a `form` attribute. @public */
  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.fallbackFormOwner;
  }

  /** Current constraint-validation state. @public */
  get validity(): ValidityState {
    return this.internals?.validity ?? this.validationProxy.validity;
  }

  /** Current validation message. @public */
  get validationMessage(): string {
    return this.internals?.validationMessage ?? this.validationProxy.validationMessage;
  }

  /** Whether this editor participates in constraint validation. @public */
  get willValidate(): boolean {
    if (this.validationBarred) return false;
    return this.internals?.willValidate ?? true;
  }

  /** Labels associated with this editor. @public */
  get labels(): NodeList | null {
    return this.internals?.labels ?? null;
  }

  checkValidity(): boolean {
    this.syncValidity();
    if (this.internals) return this.internals.checkValidity() && !this.hasValidationError();
    return this.validationProxy.checkValidity();
  }

  reportValidity(): boolean {
    this.syncValidity();
    if (this.internals) return this.internals.reportValidity() && !this.hasValidationError();
    return this.validationProxy.reportValidity();
  }

  setCustomValidity(message: string): void {
    this.customValidationMessage = String(message ?? '');
    this.syncValidity();
  }

  // --- Render ---

  private renderEditRow(item: KeyValueItem, index: number) {
    const ph = this.getPlaceholder(index);
    const isFixedMode = this.rows > 0;
    const canDelete = !isFixedMode && !this.readonly && !this.interactionDisabled;
    const showDesc = this.showDescription;
    const flags = this.getValidityFlags();
    const keyInvalid = !this.validationBarred && (
      (this.serializedParseError && index === 0) ||
      (flags.valueMissing && index === 0) ||
      (flags.customError && index === 0) ||
      this.isMalformedItem(item)
    );

    return html`
      <div class="kv__row" part="row">
        <div class="kv__fields">
          <div class="kv__pair">
            <input
              class="kv__input ${keyInvalid ? 'kv__input--invalid' : ''}"
              part="key-input"
              type="text"
              placeholder="${ph.key}"
              .value="${item.key}"
              .disabled=${this.interactionDisabled}
              .readOnly=${this.readonly}
              aria-label="Key ${index + 1}"
              aria-invalid="${keyInvalid ? 'true' : 'false'}"
              aria-errormessage=${keyInvalid ? 'kv-error' : null}
              @input=${(e: Event) => this.handleKeyInput(index, e)}
            />
            <input
              class="kv__input"
              part="value-input"
              type="text"
              placeholder="${ph.value}"
              .value="${item.value}"
              .disabled=${this.interactionDisabled}
              .readOnly=${this.readonly}
              aria-label="Value ${index + 1}"
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
              .disabled=${this.interactionDisabled}
              .readOnly=${this.readonly}
              aria-label="Description ${index + 1}"
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
            .disabled=${this.interactionDisabled || this.readonly}
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
        .disabled=${this.interactionDisabled}
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
    const validationMessage = this.getValidationMessage();
    const showValidationMessage = !this.validationBarred && this.hasValidationError();

    return html`
      <div
        class="kv ${this.interactionDisabled ? 'kv--disabled' : ''}"
        part="base"
        role="group"
        aria-labelledby=${hasTitle ? 'kv-title' : null}
        aria-label=${hasTitle ? null : 'Key value editor'}
        aria-required="${this.required ? 'true' : 'false'}"
      >
        <if ${hasTitle || showCopyBtn}>
          <div class="kv__header">
            <if ${hasTitle}>
              <h3 id="kv-title" class="kv__title" part="title">
                ${this.label}${this.required ? ' *' : ''}
              </h3>
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
        <if ${showValidationMessage}>
          <div id="kv-error" class="kv__error" part="error" role="alert">${validationMessage}</div>
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
