import { element, property, query, queryAll, watch, dispatch, ready, dispose, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-select.css?inline';
import type { SelectSize, SelectOption, SniceSelectElement } from './snice-select.types';
import './snice-option';

@element('snice-select', { formAssociated: true })
export class SniceSelect extends HTMLElement implements SniceSelectElement {
  internals!: ElementInternals;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }
  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  required = false;

  @property({ type: Boolean,  })
  invalid = false;

  @property({ type: Boolean,  })
  readonly = false;

  @property({ type: Boolean,  })
  loading = false;

  @property({ type: Boolean,  })
  multiple = false;

  @property({ type: Boolean,  })
  searchable = false;

  @property({ type: Boolean,  })
  clearable = false;

  @property({ type: Boolean,  })
  open = false;

  @property({  })
  size: SelectSize = 'medium';

  @property({  })
  name = '';

  @property({  })
  value = '';

  @property({  })
  label = '';

  @property({  })
  placeholder = 'Select an option';

  @property({  attribute: 'max-height' })
  maxHeight = '200px';

  // Options will be read from child snice-option elements
  private options: SelectOption[] = [];

  @query('.select-trigger')
  trigger?: HTMLButtonElement;

  @query('.select-dropdown')
  dropdown?: HTMLElement;

  @query('.select-value')
  valueDisplay?: HTMLElement;

  @query('.select-label')
  labelElement?: HTMLElement;

  @query('.select-search-input')
  searchInput?: HTMLInputElement;

  @query('.select-options')
  optionsList?: HTMLElement;

  @query('.select-clear')
  clearButton?: HTMLElement;

  @query('.select-arrow')
  arrow?: HTMLElement;

  @query('.select-search')
  searchContainer?: HTMLElement;

  @queryAll('.select-option')
  optionElements?: HTMLElement[];

  private filteredOptions: SelectOption[] = [];
  private selectedValues: Set<string> = new Set();
  private focusedIndex = -1;

  @render()
  render() {
    const labelClasses = `select-label select-label--${this.size} ${this.required ? 'select-label--required' : ''}`;
    const triggerClasses = `select-trigger select-trigger--${this.size} ${this.loading ? 'select-trigger--loading' : ''}`;
    const searchHidden = !this.searchable;

    return html/*html*/`
      <div class="select-wrapper">
        <label class="${labelClasses}" part="label" ?hidden="${!this.label}">
          ${this.label}
        </label>

        <button
          type="button"
          class="${triggerClasses}"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-label="${this.label || 'Select'}"
          part="trigger"
          @keydown="${(e: KeyboardEvent) => this.handleTriggerOpen(e)}"
          @click="${(e: MouseEvent) => this.handleTriggerClick(e)}">

          <div class="select-value" part="value">
            <span class="select-placeholder">${this.placeholder}</span>
          </div>

          <span class="select-icons">
            <span class="select-clear" aria-label="Clear selection" style="display: none;" @click="${(e: MouseEvent) => this.handleClearClick(e)}">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"/>
              </svg>
            </span>
            <if ${this.loading}>
              <span class="select-spinner" part="spinner"></span>
            </if>
            <if ${!this.loading}>
              <span class="select-arrow">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M6 9L1 4h10L6 9z"/>
                </svg>
              </span>
            </if>
          </span>
        </button>

        <div class="select-dropdown"
             role="listbox"
             aria-label="${this.label || 'Options'}"
             part="dropdown"
             @click="${(e: MouseEvent) => this.handleOptionsClick(e)}">

          <div class="select-search" part="search" ?hidden="${searchHidden}">
            <input
              type="text"
              class="select-search-input"
              placeholder="Search..."
              aria-label="Search options"
              part="search-input"
              @keydown="${(e: KeyboardEvent) => this.handleSearchKeydown(e)}"
              @input="${(e: Event) => this.handleSearchInput(e)}" />
          </div>

          <div class="select-options" part="options">
            <!-- Options will be rendered in @ready() -->
          </div>
        </div>

      </div>
    `;
  }

  private renderOptions(): string {
    const options = this.searchable ? this.filteredOptions : this.options;
    
    if (options.length === 0) {
      return /*html*/`
        <div class="select-no-options">
          <span class="select-no-options-text" data-search="true" ${!this.searchable || this.filteredOptions.length > 0 ? 'hidden' : ''}>No matches found</span>
          <span class="select-no-options-text" data-search="false" ${this.searchable && this.filteredOptions.length === 0 ? 'hidden' : ''}>No options available</span>
        </div>
      `;
    }

    return options.map((opt, index) => {
      const isSelected = this.multiple ? 
        this.selectedValues.has(opt.value) : 
        opt.value === this.value;
      
      return /*html*/`
        <div class="select-option 
          ${isSelected ? 'select-option--selected' : ''}
          ${opt.disabled ? 'select-option--disabled' : ''}
          ${index === this.focusedIndex ? 'select-option--focused' : ''}
          ${opt.icon ? 'select-option--has-icon' : ''}"
          data-value="${opt.value}"
          role="option"
          aria-selected="${isSelected}"
          aria-disabled="${opt.disabled}"
          part="option">
          <span class="select-option-check" ${!this.multiple ? 'hidden' : ''}>
            <span class="select-option-check-mark" ${!isSelected ? 'hidden' : ''}>✓</span>
          </span>
          <img class="select-option-icon" src="${opt.icon || ''}" alt="" ${!opt.icon ? 'hidden' : ''} />
          <span class="select-option-label">${opt.label}</span>
        </div>
      `;
    }).join('');
  }

  @styles()
  styles() {
    return cssTag`${cssContent}`;
  }

  @ready()
  init() {
    // Read options from child snice-option elements
    this.readOptionsFromChildren();

    // Initialize selected values
    if (this.multiple && this.value) {
      this.selectedValues = new Set(this.value.split(',').map(v => v.trim()));
    }

    // Initialize filtered options
    this.filteredOptions = [...this.options];

    // Set initial form value
    if (this.internals) {
      this.internals.setFormValue(this.value);
    }

    // Wait for @query decorators to populate shadow DOM elements
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Set initial imperative state
        this.updateTriggerState();
        this.updateDropdownState();

        // Now that we have options, update everything
        this.updateDropdownContent();
        this.updateValueDisplay();
        this.updateClearButton();
      });
    });

    // Watch for changes to child options
    this.observeChildren();

    // Setup global event listeners
    this.setupGlobalListeners();
  }

  @dispose()
  cleanup() {
    this.removeGlobalListeners();
    this.childObserver?.disconnect();
  }

  private outsideClickHandler?: (e: MouseEvent) => void;
  private globalKeyHandler?: (e: KeyboardEvent) => void;

  private setupGlobalListeners() {
    // Create bound handlers
    this.outsideClickHandler = (e: MouseEvent) => {
      if (!this.contains(e.target as Node) && this.open) {
        this.closeDropdown();
      }
    };
    
    this.globalKeyHandler = (e: KeyboardEvent) => {
      if (!this.open) return;
      
      switch (e.key) {
        case 'Escape':
          this.closeDropdown();
          this.trigger?.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.focusNextOption();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.focusPreviousOption();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (this.focusedIndex >= 0) {
            const options = this.searchable ? this.filteredOptions : this.options;
            const option = options[this.focusedIndex];
            if (option && !option.disabled) {
              this.handleOptionSelect(option);
            }
          }
          break;
      }
    };
    
    // Add listeners
    document.addEventListener('click', this.outsideClickHandler);
    document.addEventListener('keydown', this.globalKeyHandler);
  }
  
  private removeGlobalListeners() {
    if (this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler);
    }
    if (this.globalKeyHandler) {
      document.removeEventListener('keydown', this.globalKeyHandler);
    }
  }

  // Manual observation of light DOM children (snice-option elements)
  private observeChildren() {
    const observer = new MutationObserver((mutations) => {
      this.handleChildrenChange(mutations);
    });
    
    // Observe the host element (this) for changes to its light DOM children
    observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['value', 'label', 'disabled', 'selected']
    });
    
    // Store for cleanup
    this.childObserver = observer;
  }
  
  private childObserver?: MutationObserver;
  
  private handleChildrenChange(mutations: MutationRecord[]) {
    // Check if any of the mutations are relevant (snice-option elements or their attributes)
    const relevant = mutations.some(m => {
      if (m.type === 'childList') return true;
      if (m.type === 'attributes' && ['value', 'label', 'disabled', 'selected'].includes(m.attributeName!)) {
        return m.target.nodeName === 'SNICE-OPTION';
      }
      return false;
    });
    
    if (relevant) {
      this.readOptionsFromChildren();
      this.filteredOptions = [...this.options];

      this.updateValueDisplay();
      this.updateClearButton();
      this.updateDropdownContent();
    }
  }


  private readOptionsFromChildren() {
    // Get all snice-option children from light DOM
    const optionElements = Array.from(this.querySelectorAll('snice-option'));
    
    this.options = optionElements.map(opt => {
      const sniceOption = opt as any;
      // Use the optionData getter if available, otherwise construct from properties
      if (sniceOption.optionData) {
        return sniceOption.optionData;
      }
      
      return {
        value: opt.getAttribute('value') || '',
        label: opt.getAttribute('label') || opt.textContent?.trim() || '',
        disabled: opt.hasAttribute('disabled'),
        selected: opt.hasAttribute('selected')
      };
    });
  }

  private handleTriggerOpen(e: KeyboardEvent) {
    if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      if (!this.open) {
        this.openDropdown();
      }
    }
  }

  private handleSearchKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        this.closeDropdown();
        this.trigger?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.focusNextOption();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.focusPreviousOption();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.focusedIndex >= 0) {
          const options = this.searchable ? this.filteredOptions : this.options;
          const option = options[this.focusedIndex];
          if (option && !option.disabled) {
            this.handleOptionSelect(option);
          }
        }
        break;
    }
  }

  private focusNextOption() {
    const options = this.searchable ? this.filteredOptions : this.options;
    const enabledOptions = options.filter(opt => !opt.disabled);
    if (enabledOptions.length === 0) return;

    this.focusedIndex++;
    if (this.focusedIndex >= options.length) {
      this.focusedIndex = 0;
    }
    while (options[this.focusedIndex]?.disabled) {
      this.focusedIndex++;
      if (this.focusedIndex >= options.length) {
        this.focusedIndex = 0;
      }
    }
    this.updateOptionFocus();
  }

  private focusPreviousOption() {
    const options = this.searchable ? this.filteredOptions : this.options;
    const enabledOptions = options.filter(opt => !opt.disabled);
    if (enabledOptions.length === 0) return;

    this.focusedIndex--;
    if (this.focusedIndex < 0) {
      this.focusedIndex = options.length - 1;
    }
    while (options[this.focusedIndex]?.disabled) {
      this.focusedIndex--;
      if (this.focusedIndex < 0) {
        this.focusedIndex = options.length - 1;
      }
    }
    this.updateOptionFocus();
  }

  private updateOptionFocus() {
    if (this.optionElements) {
      this.optionElements.forEach((el, index) => {
        el.classList.toggle('select-option--focused', index === this.focusedIndex);
      });
    }
  }

  private handleClearClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.clear();
  }

  private handleTriggerClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    // Don't toggle if clicking on the clear button
    if (target.closest('.select-clear')) {
      return;
    }

    e.stopPropagation();

    if (!this.disabled && !this.readonly) {
      this.toggleDropdown();
    }
  }

  private handleOptionsClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    // Handle tag remove click
    if (target.closest('.select-tag-remove')) {
      e.stopPropagation();
      const removeBtn = target.closest('.select-tag-remove') as HTMLElement;
      const value = removeBtn.getAttribute('data-value');
      if (value && this.multiple) {
        this.selectedValues.delete(value);
        this.value = Array.from(this.selectedValues).join(',');
  
        this.updateValueDisplay();
        this.updateClearButton();
        this.dispatchChangeEvent();
      }
      return;
    }

    const optionEl = target.closest('.select-option') as HTMLElement;

    if (!optionEl) return;

    e.stopPropagation();

    const value = optionEl.getAttribute('data-value');
    if (!value) return;

    const option = this.options.find(opt => opt.value === value);
    if (option && !option.disabled) {
      this.handleOptionSelect(option);
    }
  }

  private handleSearchInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const searchTerm = input.value.toLowerCase();

    if (searchTerm) {
      this.filteredOptions = this.options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm)
      );
    } else {
      this.filteredOptions = [...this.options];
    }

    this.focusedIndex = -1;
    this.updateDropdownContent();
  }

  private handleOptionSelect(option: SelectOption) {
    if (this.multiple) {
      if (this.selectedValues.has(option.value)) {
        this.selectedValues.delete(option.value);
      } else {
        this.selectedValues.add(option.value);
      }
      this.value = Array.from(this.selectedValues).join(',');
      this.updateDropdownContent();
    } else {
      this.value = option.value;
      this.closeDropdown();
    }
    

    this.updateValueDisplay();
    this.updateClearButton();
    this.dispatchChangeEvent(option);
  }

  @watch('value')
  handleValueChange() {
    if (this.multiple) {
      this.selectedValues = new Set(this.value ? this.value.split(',').map(v => v.trim()) : []);
    }
    this.updateValueDisplay();
    this.updateClearButton();
    if (this.internals) {
      this.internals.setFormValue(this.value);
    }
  }

  @watch('disabled')
  handleDisabledChange() {
    this.updateTriggerState();

    this.updateClearButton();
    // Side effect: close dropdown when disabled
    if (this.disabled && this.open) {
      this.closeDropdown();
    }
  }

  @watch('loading')
  handleLoadingChange() {
    this.updateTriggerState();

    this.updateClearButton();
    // Side effect: close dropdown when loading
    if (this.loading && this.open) {
      this.closeDropdown();
    }
  }

  @watch('open')
  handleOpenChange() {
    this.updateDropdownState();
    this.updateTriggerState();

    // Side effect: focus search input when opened
    if (this.open && this.searchable && this.searchInput) {
      setTimeout(() => this.searchInput?.focus(), 100);
    }

    // Side effect: reset search when closed
    if (!this.open) {
      this.focusedIndex = -1;
      if (this.searchInput) {
        this.searchInput.value = '';
        this.filteredOptions = [...this.options];
        this.updateDropdownContent();
      }
    }
  }

  private updateValueDisplay() {
    if (!this.valueDisplay) return;

    const selectedOptions = this.options.filter(opt => 
      this.multiple ? this.selectedValues.has(opt.value) : opt.value === this.value
    );

    if (this.multiple && selectedOptions.length > 0) {
      this.valueDisplay.innerHTML = /*html*/`
        <div class="select-value--multiple">
          ${selectedOptions.map(opt => /*html*/`
            <span class="select-tag">
              <img class="select-tag-icon" src="${opt.icon || ''}" alt="" ${!opt.icon ? 'hidden' : ''} />
              ${opt.label}
              <span class="select-tag-remove" data-value="${opt.value}" aria-label="Remove ${opt.label}" ${this.disabled || this.readonly ? 'hidden' : ''}>×</span>
            </span>
          `).join('')}
        </div>
      `;
    } else if (selectedOptions.length > 0) {
      const selected = selectedOptions[0];
      this.valueDisplay.innerHTML = /*html*/`
        <div class="select-value--single">
          <img class="select-value-icon" src="${selected.icon || ''}" alt="" ${!selected.icon ? 'hidden' : ''} />
          <span>${selected.label}</span>
        </div>
      `;
    } else {
      this.valueDisplay.innerHTML = /*html*/`<span class="select-placeholder">${this.placeholder}</span>`;
    }
  }

  private updateClearButton() {
    if (!this.clearButton) return;
    
    const selectedOptions = this.options.filter(opt => 
      this.multiple ? this.selectedValues.has(opt.value) : opt.value === this.value
    );
    
    const shouldShow = this.clearable && selectedOptions.length > 0 && !this.disabled && !this.readonly;
    this.clearButton.style.display = shouldShow ? '' : 'none';
  }

  private updateDropdownContent() {
    if (!this.optionsList) return;
    this.optionsList.innerHTML = this.renderOptions();
  }


  @dispatch('select-change', { bubbles: true, composed: true })
  private dispatchChangeEvent(option?: SelectOption) {
    return {
      value: this.multiple ? Array.from(this.selectedValues) : this.value,
      option,
      select: this
    };
  }

  @dispatch('select-open', { bubbles: true, composed: true })
  private dispatchOpenEvent() {
    return { select: this };
  }

  @dispatch('select-close', { bubbles: true, composed: true })
  private dispatchCloseEvent() {
    return { select: this };
  }

  // Public API
  focus() {
    this.trigger?.focus();
  }

  blur() {
    this.trigger?.blur();
    if (this.open) {
      this.closeDropdown();
    }
  }

  clear() {
    if (this.multiple) {
      this.selectedValues.clear();
      this.value = '';
    } else {
      this.value = '';
    }

    this.updateValueDisplay();
    this.updateClearButton();
    this.dispatchChangeEvent();
  }

  openDropdown() {
    if (!this.open && !this.disabled && !this.readonly) {
      this.open = true;
      this.dispatchOpenEvent();
    }
  }

  closeDropdown() {
    if (this.open) {
      this.open = false;
      this.dispatchCloseEvent();
    }
  }

  toggleDropdown() {
    if (this.open) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  selectOption(value: string) {
    const option = this.options.find(opt => opt.value === value);
    if (option && !option.disabled) {
      this.handleOptionSelect(option);
    }
  }

  private updateTriggerState() {
    if (!this.trigger) return;

    this.trigger.classList.toggle('select-trigger--open', this.open);
    this.trigger.classList.toggle('select-trigger--disabled', this.disabled);
    this.trigger.classList.toggle('select-trigger--readonly', this.readonly);
    this.trigger.classList.toggle('select-trigger--invalid', this.invalid);
    this.trigger.classList.toggle('select-trigger--loading', this.loading);
    this.trigger.setAttribute('aria-expanded', String(this.open));
    this.trigger.disabled = this.disabled || this.loading;
  }

  private updateDropdownState() {
    if (!this.dropdown) return;
    
    this.dropdown.classList.toggle('select-dropdown--open', this.open);
    
    if (this.arrow) {
      this.arrow.classList.toggle('select-arrow--open', this.open);
    }
  }

}