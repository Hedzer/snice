import { element, property, render, styles, dispatch, ready, watch, query, html, css } from 'snice';
import type { SniceTagInputElement } from './snice-tag-input.types';
import tagInputStyles from './snice-tag-input.css?inline';

@element('snice-tag-input')
export class SniceTagInput extends HTMLElement implements SniceTagInputElement {
  @property({ type: Array, attribute: false })
  value: string[] = [];

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

  private inputValue: string = '';
  private filteredSuggestions: string[] = [];
  private showSuggestions: boolean = false;
  private highlightedIndex: number = -1;

  @query('.tag-input-field')
  private inputElement?: HTMLInputElement;

  @styles()
  componentStyles() {
    return css/*css*/`${tagInputStyles}`;
  }

  @ready()
  init() {
    // Close suggestions on outside click
    document.addEventListener('click', this.handleDocumentClick);
  }

  private handleDocumentClick = (e: Event) => {
    if (!this.contains(e.target as Node)) {
      this.showSuggestions = false;
    }
  };

  @watch('value')
  handleValueChange() {
    this.emitChange();
  }

  @render()
  renderTagInput() {
    const isDisabled = this.disabled;
    const isReadonly = this.readonly;
    const canAdd = !isDisabled && !isReadonly && (this.maxTags === 0 || this.value.length < this.maxTags);
    const hasLabel = !!this.label;
    const hasSuggestions = this.showSuggestions && this.filteredSuggestions.length > 0;

    return html/*html*/`
      <div part="base" class="tag-input-wrapper">
        <if ${hasLabel}>
          <label part="label" class="tag-input-label">${this.label}</label>
        </if>

        <div
          part="container"
          class="tag-input-container ${isDisabled ? 'tag-input-container--disabled' : ''}"
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
    this.inputElement?.focus();
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
