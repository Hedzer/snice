import { element, property, state, render, styles, dispatch, ready, dispose, reconnect, watch, query, html, css } from 'snice';
import type { SniceTagInputElement } from './snice-tag-input.types';
import tagInputStyles from './snice-tag-input.css?inline';
import { FormLabelAssociation } from '../form-label-association';
import { applyElementInternalsValidity, findFormOwner, hasValidityError } from '../form-control-validity';

@element('snice-tag-input', { formAssociated: true, delegatesFocus: true })
export class SniceTagInput extends HTMLElement implements SniceTagInputElement {
  internals!: ElementInternals;
  private dirtyValue = false;
  private suppressValueEvent = false;
  private customValidationMessage = '';
  private readonly labelAssociation: FormLabelAssociation;
  private validationInput?: HTMLInputElement;

  @state()
  private valueState: string[] = [];

  @state()
  private formDisabled = false;

  @state()
  private constraintInvalid = false;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
    this.labelAssociation = new FormLabelAssociation(
      this,
      () => this.internals,
      () => this.interactionDisabled ? undefined : this.validationAnchor,
      () => this.label || 'Tags'
    );
  }

  /**
   * Live tags. Assignments do not rewrite the authored reset default.
   * @public
   */
  get value(): string[] {
    return this.valueState;
  }

  set value(value: string[]) {
    this.setValue(value, true, true);
  }

  /** JSON-backed `value` content attribute and form-reset default. */
  @property({ type: Array, attribute: 'value' })
  defaultValue: string[] = [];

  formAssociatedCallback() {
    this.syncFormState();
  }

  formResetCallback() {
    this.dirtyValue = false;
    this.applyDefaultValue();
    this.clearDraft();
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
    this.syncValidity();
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    if (typeof state !== 'string') return;
    try {
      const value = JSON.parse(state);
      if (Array.isArray(value)) {
        this.setValue(value.map(String), true, false);
        this.clearDraft();
      }
    } catch {
      // Ignore malformed browser restoration state.
    }
  }

  @property({ type: Array, attribute: false })
  suggestions: string[] = [];

  @property({ type: Number, attribute: 'max-tags' })
  maxTags: number = 0;

  @property({ type: Boolean, attribute: 'allow-duplicates' })
  allowDuplicates: boolean = false;

  @property() placeholder: string = 'Add a tag...';

  @property({ type: Boolean })
  disabled: boolean = false;

  @property({ type: Boolean })
  readonly: boolean = false;

  @property() label: string = '';
  @property() name: string = '';

  @property({ attribute: false })
  private inputValue: string = '';
  @property({ type: Array, attribute: false })
  private filteredSuggestions: string[] = [];
  @property({ type: Boolean, attribute: false })
  private showSuggestions: boolean = false;
  @property({ type: Number, attribute: false })
  private highlightedIndex: number = -1;

  @query('.tag-input-field')
  private inputElement?: HTMLInputElement;

  @query('.tag-remove')
  private firstRemoveButton?: HTMLButtonElement;

  @query('.tag-input-container')
  private containerElement?: HTMLElement;

  @styles()
  componentStyles() {
    return css/*css*/`${tagInputStyles}`;
  }

  @ready()
  init() {
    if (Object.prototype.hasOwnProperty.call(this, 'value')) {
      const value = (this as { value: unknown }).value;
      delete (this as Partial<{ value: unknown }>).value;
      if (Array.isArray(value)) this.value = value.map(String);
    } else if (!this.dirtyValue) {
      this.applyDefaultValue();
    }
    this.syncFormState();
    this.attachOutsideClickListener();
    this.labelAssociation.connect();
  }

  @reconnect()
  onReconnect() {
    this.attachOutsideClickListener();
    this.labelAssociation.connect();
  }

  @dispose()
  cleanup() {
    document.removeEventListener('click', this.handleDocumentClick);
    this.labelAssociation.disconnect();
  }

  private attachOutsideClickListener() {
    document.addEventListener('click', this.handleDocumentClick);
  }

  private get interactionDisabled(): boolean {
    return this.disabled || this.formDisabled;
  }

  private applyDefaultValue() {
    this.setValue(this.defaultValue, false, false);
  }

  private setValue(value: unknown, dirty: boolean, emit: boolean) {
    if (!Array.isArray(value)) return;
    if (dirty) this.dirtyValue = true;
    this.suppressValueEvent = !emit;
    try {
      this.valueState = value.map(String);
    } finally {
      this.suppressValueEvent = false;
    }
    this.syncFormState();
  }

  private syncFormValue() {
    const value = JSON.stringify(this.value);
    this.internals?.setFormValue(value, value);
  }

  private syncFormState() {
    this.syncFormValue();
    this.syncValidity();
  }

  private get validationAnchor(): HTMLElement | undefined {
    return this.inputElement ?? this.firstRemoveButton;
  }

  private syncValidityAfterRender() {
    // @watch handlers run before the batched render. Re-read conditional
    // targets after it commits so ElementInternals never retains a detached
    // draft input when the tag limit hides that input.
    queueMicrotask(() => {
      const rendered = (this as unknown as { readonly rendered: Promise<void> }).rendered;
      void rendered.then(() => {
        if (this.isConnected) this.syncValidity();
      });
    });
  }

  private syncValidity() {
    const barred = this.interactionDisabled || this.readonly;
    const tooLong = !barred && this.maxTags > 0 && this.value.length > this.maxTags;
    const duplicateValue = !barred && !this.allowDuplicates &&
      new Set(this.value).size !== this.value.length;
    const flags: ValidityStateFlags = barred ? {} : {
      customError: Boolean(this.customValidationMessage) || duplicateValue,
      tooLong
    };
    const hasError = hasValidityError(flags);
    const message = this.customValidationMessage ||
      (tooLong ? `Use no more than ${this.maxTags} tags.` : '') ||
      (duplicateValue ? 'Duplicate tags are not allowed.' : '');
    this.constraintInvalid = hasError;
    this.validationProxy.setCustomValidity(hasError ? message : '');
    this.inputElement?.setCustomValidity(hasError ? message : '');
    this.inputElement?.setAttribute('aria-invalid', String(hasError));
    this.containerElement?.setAttribute('aria-invalid', String(hasError));
    this.containerElement?.classList.toggle('tag-input-container--invalid', hasError);
    applyElementInternalsValidity(this.internals, flags, message, this.validationAnchor);
  }

  private get validationProxy(): HTMLInputElement {
    if (!this.validationInput) this.validationInput = document.createElement('input');
    return this.validationInput;
  }

  private clearDraft() {
    this.inputValue = '';
    this.filteredSuggestions = [];
    this.showSuggestions = false;
    this.highlightedIndex = -1;
    if (this.inputElement) this.inputElement.value = '';
  }

  private handleDocumentClick = (e: Event) => {
    if (e.composedPath().includes(this)) return;
    this.showSuggestions = false;
  };

  @watch('valueState', { immediate: false })
  handleValueChange() {
    this.syncFormState();
    this.syncValidityAfterRender();
    if (!this.suppressValueEvent) this.emitChange();
  }

  @watch('defaultValue', { immediate: false })
  handleDefaultValueChange() {
    if (!this.dirtyValue) this.applyDefaultValue();
  }

  @watch('maxTags', 'allowDuplicates', 'disabled', 'readonly', 'formDisabled', { immediate: false })
  handleValidationConfigurationChange() {
    this.syncValidity();
    this.syncValidityAfterRender();
  }

  @render()
  renderTagInput() {
    const isDisabled = this.interactionDisabled;
    const isReadonly = this.readonly;
    const canAdd = !isDisabled && !isReadonly && (this.maxTags <= 0 || this.value.length < this.maxTags);
    const hasLabel = !!this.label;
    const hasSuggestions = this.showSuggestions && this.filteredSuggestions.length > 0;

    return html/*html*/`
      <div part="base" class="tag-input-wrapper">
        <if ${hasLabel}>
          <label part="label" class="tag-input-label">${this.label}</label>
        </if>

        <div
          part="container"
          class="tag-input-container ${isDisabled ? 'tag-input-container--disabled' : ''} ${this.constraintInvalid ? 'tag-input-container--invalid' : ''}"
          aria-invalid="${this.constraintInvalid ? 'true' : 'false'}"
          @click=${() => this.focus()}
        >
          ${this.value.map((tag, index) => html/*html*/`
            <span part="tag" class="tag" key=${tag + index}>
              <span part="tag-text" class="tag-text">${tag}</span>
              <if ${!isDisabled && !isReadonly}>
                <button
                  class="tag-remove"
                  type="button"
                  tabindex="-1"
                  @click=${(e: Event) => { e.stopPropagation(); this.removeTag(index); }}
                  title="Remove ${tag}"
                >
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </if>
            </span>
          `)}

          <if ${canAdd}>
            <input
              part="input"
              class="tag-input-field"
              type="text"
              placeholder="${this.value.length === 0 ? this.placeholder : ''}"
              ?disabled=${isDisabled}
              ?readonly=${isReadonly}
              aria-label="${this.labelAssociation.accessibleName}"
              aria-invalid="${this.constraintInvalid ? 'true' : 'false'}"
              @input=${(e: Event) => this.handleInput(e)}
              @keydown=${(e: KeyboardEvent) => this.handleKeyDown(e)}
              @focus=${() => this.handleFocus()}
              @blur=${() => this.handleBlur()}
            />
          </if>

          <if ${hasSuggestions}>
            <div part="suggestions" class="tag-suggestions">
              ${this.filteredSuggestions.map((suggestion, i) => html/*html*/`
                <div
                  class="tag-suggestion-item ${i === this.highlightedIndex ? 'tag-suggestion-item--highlighted' : ''}"
                  @mousedown=${(e: Event) => { e.preventDefault(); this.selectSuggestion(suggestion); }}
                >
                  ${suggestion}
                </div>
              `)}
            </div>
          </if>
        </div>
      </div>
    `;
  }

  // --- Public Methods ---

  addTag(tag: string): void {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (!this.allowDuplicates && this.value.includes(trimmed)) return;
    if (this.maxTags > 0 && this.value.length >= this.maxTags) return;

    this.value = [...this.value, trimmed];
    this.emitAdd(trimmed);
  }

  removeTag(index: number): void {
    if (index < 0 || index >= this.value.length) return;
    const removed = this.value[index];
    this.value = this.value.filter((_, i) => i !== index);
    this.emitRemove(removed, index);
  }

  clear(): void {
    this.value = [];
  }

  focus(): void {
    if (!this.interactionDisabled) this.validationAnchor?.focus();
  }

  blur(): void {
    this.validationAnchor?.blur();
  }

  /** Native-compatible control type. @public */
  get type(): 'text' {
    return 'text';
  }

  /** Owning form, including association through a `form` attribute. @public */
  get form(): HTMLFormElement | null {
    return findFormOwner(this, this.internals);
  }

  /** Current constraint-validation state. @public */
  get validity(): ValidityState {
    return this.internals?.validity ?? this.validationProxy.validity;
  }

  /** Current validation message. @public */
  get validationMessage(): string {
    return this.internals?.validationMessage ?? this.validationProxy.validationMessage;
  }

  /** Whether this tag input currently participates in validation. @public */
  get willValidate(): boolean {
    if (this.interactionDisabled || this.readonly) return false;
    return this.internals?.willValidate ?? this.inputElement?.willValidate ?? true;
  }

  /** Labels associated with the host. @public */
  get labels(): NodeList | null {
    return this.labelAssociation.labels;
  }

  checkValidity(): boolean {
    this.syncValidity();
    return this.internals?.checkValidity() ?? this.validationProxy.checkValidity();
  }

  reportValidity(): boolean {
    this.syncValidity();
    return this.internals?.reportValidity() ?? this.validationProxy.reportValidity();
  }

  setCustomValidity(message: string): void {
    this.customValidationMessage = String(message);
    this.syncValidity();
  }

  // --- Private Methods ---

  private handleInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.inputValue = input.value;

    // Check for comma separator
    if (this.inputValue.includes(',')) {
      const parts = this.inputValue.split(',');
      for (const part of parts) {
        if (part.trim()) {
          this.addTag(part);
        }
      }
      this.inputValue = '';
      input.value = '';
      this.showSuggestions = false;
      return;
    }

    this.updateFilteredSuggestions();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (this.highlightedIndex >= 0 && this.highlightedIndex < this.filteredSuggestions.length) {
          this.selectSuggestion(this.filteredSuggestions[this.highlightedIndex]);
        } else if (this.inputValue.trim()) {
          this.addTag(this.inputValue);
          this.inputValue = '';
          if (this.inputElement) this.inputElement.value = '';
          this.showSuggestions = false;
        }
        break;

      case 'Backspace':
        if (!this.inputValue && this.value.length > 0) {
          this.removeTag(this.value.length - 1);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (this.showSuggestions && this.filteredSuggestions.length > 0) {
          this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredSuggestions.length - 1);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (this.showSuggestions) {
          this.highlightedIndex = Math.max(this.highlightedIndex - 1, -1);
        }
        break;

      case 'Escape':
        this.showSuggestions = false;
        this.highlightedIndex = -1;
        break;
    }
  }

  private handleFocus(): void {
    this.updateFilteredSuggestions();
  }

  private handleBlur(): void {
    // Delay to allow click on suggestion
    setTimeout(() => {
      this.showSuggestions = false;
      this.highlightedIndex = -1;
    }, 200);
  }

  private selectSuggestion(suggestion: string): void {
    this.addTag(suggestion);
    this.inputValue = '';
    if (this.inputElement) this.inputElement.value = '';
    this.showSuggestions = false;
    this.highlightedIndex = -1;
    this.focus();
  }

  private updateFilteredSuggestions(): void {
    if (this.suggestions.length === 0) {
      this.showSuggestions = false;
      return;
    }

    const query = this.inputValue.toLowerCase();
    this.filteredSuggestions = this.suggestions.filter(s => {
      const matches = !query || s.toLowerCase().includes(query);
      const notDuplicate = this.allowDuplicates || !this.value.includes(s);
      return matches && notDuplicate;
    });

    this.showSuggestions = this.filteredSuggestions.length > 0;
    this.highlightedIndex = -1;
  }

  // --- Events ---

  @dispatch('tag-add', { bubbles: true, composed: true })
  private emitAdd(tag: string) {
    return { tag, value: this.value };
  }

  @dispatch('tag-remove', { bubbles: true, composed: true })
  private emitRemove(tag: string, index: number) {
    return { tag, index, value: this.value };
  }

  @dispatch('tag-change', { bubbles: true, composed: true })
  private emitChange() {
    return { value: this.value };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-tag-input': SniceTagInput;
  }
}
