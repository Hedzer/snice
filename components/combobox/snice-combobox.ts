import { element, property, query, queryAll, watch, dispatch, ready, dispose, render, styles, html, css } from 'snice';
import cssContent from './snice-combobox.css?inline';
import type { ComboboxSize, ComboboxVariant, ComboboxOption, SniceComboboxElement } from './snice-combobox.types';

@element('snice-combobox', { formAssociated: true })
export class SniceCombobox extends HTMLElement implements SniceComboboxElement {
  internals!: ElementInternals;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }

  @property()
  value = '';

  @property({ type: Array })
  options: ComboboxOption[] = [];

  @property()
  placeholder = '';

  @property({ type: Boolean, attribute: 'allow-custom' })
  allowCustom = false;

  @property({ type: Boolean })
  filterable = true;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  readonly = false;

  @property({ type: Boolean })
  required = false;

  @property()
  variant: ComboboxVariant = 'default';

  @property()
  size: ComboboxSize = 'medium';

  @property()
  name = '';

  @property()
  label = '';

  @query('.combobox-input')
  inputEl?: HTMLInputElement;

  @query('.combobox-dropdown')
  dropdown?: HTMLElement;

  @query('.combobox-options')
  optionsList?: HTMLElement;

  @query('.combobox-arrow')
  arrow?: HTMLElement;

  @queryAll('.combobox-option')
  optionElements?: HTMLElement[];

  private isOpen = false;
  private filteredOptions: ComboboxOption[] = [];
  private focusedIndex = -1;
  private inputValue = '';
  private outsideClickHandler?: (e: MouseEvent) => void;

  @render()
  render() {
    const labelClasses = `combobox-label combobox-label--${this.size} ${this.required ? 'combobox-label--required' : ''}`;
    const inputClasses = [
      'combobox-input',
      `combobox-input--${this.size}`,
      this.variant === 'outlined' ? 'combobox-input--outlined' : ''
    ].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="combobox-wrapper">
        <label class="${labelClasses}" part="label" ?hidden="${!this.label}">
          ${this.label}
        </label>

        <div class="combobox-input-container">
          <input
            type="text"
            class="${inputClasses}"
            placeholder="${this.placeholder}"
            ?disabled="${this.disabled}"
            ?readonly="${this.readonly}"
            autocomplete="off"
            role="combobox"
            aria-expanded="false"
            aria-autocomplete="list"
            aria-label="${this.label || 'Combobox'}"
            part="input"
            @input="${(e: Event) => this.handleInput(e)}"
            @focus="${() => this.handleFocus()}"
            @blur="${(e: FocusEvent) => this.handleBlur(e)}"
            @keydown="${(e: KeyboardEvent) => this.handleKeydown(e)}"
            @click="${() => this.handleInputClick()}"
          />

          <span class="combobox-arrow" part="arrow"
                @mousedown="${(e: MouseEvent) => this.handleArrowClick(e)}">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 9L1 4h10L6 9z"/>
            </svg>
          </span>
        </div>

        <div class="combobox-dropdown"
             role="listbox"
             aria-label="${this.label || 'Options'}"
             part="dropdown"
             @mousedown="${(e: MouseEvent) => this.handleOptionsMousedown(e)}">
          <div class="combobox-options" part="options">
            <!-- Options rendered imperatively -->
          </div>
        </div>
      </div>
    `;
  }

  private renderOptions(): string {
    if (this.filteredOptions.length === 0) {
      return /*html*/`<div class="combobox-no-options">No matches found</div>`;
    }

    return this.filteredOptions.map((opt, index) => {
      const isSelected = opt.value === this.value;
      return /*html*/`
        <div class="combobox-option
          ${isSelected ? 'combobox-option--selected' : ''}
          ${opt.disabled ? 'combobox-option--disabled' : ''}
          ${index === this.focusedIndex ? 'combobox-option--focused' : ''}"
          data-value="${opt.value}"
          role="option"
          aria-selected="${isSelected}"
          aria-disabled="${opt.disabled || false}"
          part="option">
          <img class="combobox-option-icon" src="${opt.icon || ''}" alt="" ${!opt.icon ? 'hidden' : ''} />
          <span class="combobox-option-label">${opt.label}</span>
        </div>
      `;
    }).join('');
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.filteredOptions = [...this.options];

    if (this.internals) {
      this.internals.setFormValue(this.value);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.syncInputToValue();
        this.updateDropdownContent();
      });
    });

    this.setupGlobalListeners();
  }

  @dispose()
  cleanup() {
    this.removeGlobalListeners();
  }

  private setupGlobalListeners() {
    this.outsideClickHandler = (e: MouseEvent) => {
      if (!this.contains(e.target as Node) && this.isOpen) {
        this.closeDropdown();
      }
    };
    document.addEventListener('click', this.outsideClickHandler);
  }

  private removeGlobalListeners() {
    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler);
    }
  }

  private handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.inputValue = input.value;

    if (this.filterable) {
      this.filterOptions(this.inputValue);
    }

    if (!this.isOpen) {
      this.openDropdown();
    }

    this.dispatchInputChangeEvent();
  }

  private handleFocus() {
    if (!this.isOpen && !this.readonly) {
      this.openDropdown();
    }
  }

  private handleBlur(e: FocusEvent) {
    // Delay close to allow option clicks
    setTimeout(() => {
      if (this.isOpen) {
        this.commitValue();
        this.closeDropdown();
      }
    }, 200);
  }

  private handleInputClick() {
    if (!this.isOpen && !this.disabled && !this.readonly) {
      this.openDropdown();
    }
  }

  private handleArrowClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (this.disabled || this.readonly) return;

    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
      this.inputEl?.focus();
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this.isOpen) {
          this.openDropdown();
        } else {
          this.focusNextOption();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (this.isOpen) {
          this.focusPreviousOption();
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (this.isOpen && this.focusedIndex >= 0) {
          const option = this.filteredOptions[this.focusedIndex];
          if (option && !option.disabled) {
            this.selectOption(option);
          }
        } else if (this.isOpen) {
          this.commitValue();
          this.closeDropdown();
        }
        break;
      case 'Escape':
        if (this.isOpen) {
          this.closeDropdown();
          this.syncInputToValue();
        }
        break;
      case 'Tab':
        if (this.isOpen) {
          this.commitValue();
          this.closeDropdown();
        }
        break;
    }
  }

  private handleOptionsMousedown(e: MouseEvent) {
    // Prevent blur on input when clicking options
    e.preventDefault();

    const target = e.target as HTMLElement;
    const optionEl = target.closest('.combobox-option') as HTMLElement;
    if (!optionEl) return;

    const value = optionEl.getAttribute('data-value');
    if (!value) return;

    const option = this.filteredOptions.find(opt => opt.value === value);
    if (option && !option.disabled) {
      this.selectOption(option);
    }
  }

  private selectOption(option: ComboboxOption) {
    this.value = option.value;
    this.inputValue = option.label;
    if (this.inputEl) {
      this.inputEl.value = option.label;
    }
    this.closeDropdown();
    this.dispatchValueChangeEvent(option);
    this.dispatchOptionSelectEvent(option);
    this.inputEl?.focus();
  }

  private commitValue() {
    if (!this.inputEl) return;
    const inputText = this.inputEl.value.trim();

    // Try to match an existing option
    const match = this.options.find(
      opt => opt.label.toLowerCase() === inputText.toLowerCase()
    );

    if (match) {
      this.value = match.value;
      this.inputValue = match.label;
      this.inputEl.value = match.label;
      this.dispatchValueChangeEvent(match);
    } else if (this.allowCustom && inputText) {
      this.value = inputText;
      this.inputValue = inputText;
      this.dispatchValueChangeEvent();
    } else {
      // Revert to current value
      this.syncInputToValue();
    }
  }

  private filterOptions(query: string) {
    if (!query) {
      this.filteredOptions = [...this.options];
    } else {
      const lower = query.toLowerCase();
      this.filteredOptions = this.options.filter(opt =>
        opt.label.toLowerCase().includes(lower)
      );
    }
    this.focusedIndex = -1;
    this.updateDropdownContent();
  }

  private syncInputToValue() {
    if (!this.inputEl) return;

    if (this.value) {
      const match = this.options.find(opt => opt.value === this.value);
      if (match) {
        this.inputEl.value = match.label;
        this.inputValue = match.label;
      } else if (this.allowCustom) {
        this.inputEl.value = this.value;
        this.inputValue = this.value;
      } else {
        this.inputEl.value = '';
        this.inputValue = '';
      }
    } else {
      this.inputEl.value = '';
      this.inputValue = '';
    }
  }

  private focusNextOption() {
    const enabledOptions = this.filteredOptions.filter(opt => !opt.disabled);
    if (enabledOptions.length === 0) return;

    this.focusedIndex++;
    if (this.focusedIndex >= this.filteredOptions.length) {
      this.focusedIndex = 0;
    }
    while (this.filteredOptions[this.focusedIndex]?.disabled) {
      this.focusedIndex++;
      if (this.focusedIndex >= this.filteredOptions.length) {
        this.focusedIndex = 0;
      }
    }
    this.updateOptionFocus();
  }

  private focusPreviousOption() {
    const enabledOptions = this.filteredOptions.filter(opt => !opt.disabled);
    if (enabledOptions.length === 0) return;

    this.focusedIndex--;
    if (this.focusedIndex < 0) {
      this.focusedIndex = this.filteredOptions.length - 1;
    }
    while (this.filteredOptions[this.focusedIndex]?.disabled) {
      this.focusedIndex--;
      if (this.focusedIndex < 0) {
        this.focusedIndex = this.filteredOptions.length - 1;
      }
    }
    this.updateOptionFocus();
  }

  private updateOptionFocus() {
    if (this.optionElements) {
      this.optionElements.forEach((el, index) => {
        el.classList.toggle('combobox-option--focused', index === this.focusedIndex);
      });
    }
    // Scroll focused option into view
    const focusedEl = this.optionElements?.[this.focusedIndex];
    if (focusedEl) {
      focusedEl.scrollIntoView({ block: 'nearest' });
    }
  }

  private openDropdown() {
    if (this.isOpen || this.disabled || this.readonly) return;

    this.isOpen = true;
    this.filteredOptions = [...this.options];
    this.focusedIndex = -1;
    this.updateDropdownContent();
    this.updateDropdownState();
  }

  private closeDropdown() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.focusedIndex = -1;
    this.updateDropdownState();
  }

  private updateDropdownContent() {
    if (!this.optionsList) return;
    this.optionsList.innerHTML = this.renderOptions();
  }

  private updateDropdownState() {
    if (this.dropdown) {
      this.dropdown.classList.toggle('combobox-dropdown--open', this.isOpen);
    }
    if (this.inputEl) {
      this.inputEl.setAttribute('aria-expanded', String(this.isOpen));
      this.inputEl.classList.toggle('combobox-input--open', this.isOpen);
    }
    if (this.arrow) {
      this.arrow.classList.toggle('combobox-arrow--open', this.isOpen);
    }
  }

  @watch('value')
  handleValueChange() {
    this.syncInputToValue();
    if (this.internals) {
      this.internals.setFormValue(this.value);
    }
  }

  @watch('options')
  handleOptionsChange() {
    this.filteredOptions = [...this.options];
    this.updateDropdownContent();
    this.syncInputToValue();
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.disabled && this.isOpen) {
      this.closeDropdown();
    }
  }

  @dispatch('value-change', { bubbles: true, composed: true })
  private dispatchValueChangeEvent(option?: ComboboxOption) {
    return {
      value: this.value,
      option,
      combobox: this
    };
  }

  @dispatch('input-change', { bubbles: true, composed: true })
  private dispatchInputChangeEvent() {
    return {
      inputValue: this.inputValue,
      combobox: this
    };
  }

  @dispatch('option-select', { bubbles: true, composed: true })
  private dispatchOptionSelectEvent(option: ComboboxOption) {
    return {
      value: option.value,
      option,
      combobox: this
    };
  }

  // Public API
  open() {
    this.openDropdown();
    this.inputEl?.focus();
  }

  close() {
    this.closeDropdown();
  }

  focus() {
    this.inputEl?.focus();
  }

  blur() {
    this.inputEl?.blur();
    if (this.isOpen) {
      this.closeDropdown();
    }
  }
}
