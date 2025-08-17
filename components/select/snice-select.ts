import { element, property, query, queryAll, on, watch, dispatch, ready, dispose } from '../../src/index';
import css from './snice-select.css?inline';
import type { SelectSize, SelectOption, SniceSelectElement } from './snice-select.types';
import './snice-option';

@element('snice-select')
export class SniceSelect extends HTMLElement implements SniceSelectElement {
  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Boolean, reflect: true })
  invalid = false;

  @property({ type: Boolean, reflect: true })
  readonly = false;

  @property({ type: Boolean, reflect: true })
  multiple = false;

  @property({ type: Boolean, reflect: true })
  searchable = false;

  @property({ type: Boolean, reflect: true })
  clearable = false;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ reflect: true })
  size: SelectSize = 'medium';

  @property({ reflect: true })
  name = '';

  @property({ reflect: true })
  value = '';

  @property({ reflect: true })
  label = '';

  @property({ reflect: true })
  placeholder = 'Select an option';

  @property({ reflect: true, attribute: 'max-height' })
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

  @query('.select-native')
  nativeSelect?: HTMLSelectElement;

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

  html() {
    // Initial render - options will be populated in @ready()
    return /*html*/`
      <div class="select-wrapper">
        <label class="select-label select-label--${this.size} ${this.required ? 'select-label--required' : ''}" part="label" ${!this.label ? 'hidden' : ''}>
          ${this.label}
        </label>
        
        <button
          type="button"
          class="select-trigger select-trigger--${this.size}"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-label="${this.label || 'Select'}"
          part="trigger">
          
          <div class="select-value" part="value">
            <span class="select-placeholder">${this.placeholder}</span>
          </div>
          
          <span class="select-icons">
            <span class="select-clear" aria-label="Clear selection" style="display: none;">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"/>
              </svg>
            </span>
            <span class="select-arrow">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 9L1 4h10L6 9z"/>
              </svg>
            </span>
          </span>
        </button>
        
        <div class="select-dropdown" 
             role="listbox" 
             aria-label="${this.label || 'Options'}"
             part="dropdown">
          
          <div class="select-search" part="search" ${!this.searchable ? 'hidden' : ''}>
            <input
              type="text"
              class="select-search-input"
              placeholder="Search..."
              aria-label="Search options"
              part="search-input" />
          </div>
          
          <div class="select-options" part="options">
            <!-- Options will be rendered in @ready() -->
          </div>
        </div>
        
        <!-- Hidden native select for form submission -->
        <select
          class="select-native"
          name="${this.name || ''}"
          tabindex="-1"
          aria-hidden="true">
          <!-- Options will be added in @ready() -->
        </select>
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

  css() {
    return css;
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
    
    // Set initial imperative state
    this.updateTriggerState();
    this.updateDropdownState();
    this.updateNativeSelectAttributes();
    
    // Now that we have options, update everything
    this.updateDropdownContent();
    this.updateNativeSelect();
    this.updateValueDisplay();
    this.updateClearButton();
    
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
      this.updateNativeSelect();
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

  @on(['keydown:Enter', 'keydown:Space', 'keydown:ArrowDown', 'keydown:ArrowUp'], '.select-trigger')
  handleTriggerOpen(e: KeyboardEvent) {
    e.preventDefault();
    if (!this.open) {
      this.openDropdown();
    }
  }
  
  @on('keydown:Escape', '.select-search-input')
  handleSearchEscape() {
    this.closeDropdown();
    this.trigger?.focus();
  }

  @on('keydown:ArrowDown', '.select-search-input')
  handleSearchArrowDown(e: KeyboardEvent) {
    e.preventDefault();
    this.focusNextOption();
  }

  @on('keydown:ArrowUp', '.select-search-input')
  handleSearchArrowUp(e: KeyboardEvent) {
    e.preventDefault();
    this.focusPreviousOption();
  }

  @on('keydown:Enter', '.select-search-input')
  handleSearchEnter(e: KeyboardEvent) {
    e.preventDefault();
    if (this.focusedIndex >= 0) {
      const options = this.searchable ? this.filteredOptions : this.options;
      const option = options[this.focusedIndex];
      if (option && !option.disabled) {
        this.handleOptionSelect(option);
      }
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

  @on('click', '.select-trigger')
  handleTriggerClick(e: Event) {
    e.stopPropagation();
    
    // Don't toggle if clicking on the clear button or tag remove buttons
    const target = e.target as HTMLElement;
    if (target.closest('.select-clear') || target.closest('.select-tag-remove')) {
      return;
    }
    
    if (!this.disabled && !this.readonly) {
      this.toggleDropdown();
    }
  }

  @on('click', '.select-clear', { preventDefault: true, stopPropagation: true })
  handleClearClick(_e: Event) {
    this.clear();
  }

  @on('click', '.select-tag-remove')
  handleTagRemove(e: Event) {
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const value = target.getAttribute('data-value');
    if (value && this.multiple) {
      this.selectedValues.delete(value);
      this.value = Array.from(this.selectedValues).join(',');
      this.updateNativeSelect();
      this.updateValueDisplay();
      this.updateClearButton();
      this.dispatchChangeEvent();
    }
  }

  @on('click', '.select-options')
  handleOptionsClick(e: Event) {
    e.stopPropagation();
    
    const target = e.target as HTMLElement;
    const optionEl = target.closest('.select-option') as HTMLElement;
    
    if (!optionEl) return;
    
    const value = optionEl.getAttribute('data-value');
    if (!value) return;

    const option = this.options.find(opt => opt.value === value);
    if (option && !option.disabled) {
      this.handleOptionSelect(option);
    }
  }

  @on('input', '.select-search-input')
  handleSearchInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const searchTerm = target.value.toLowerCase();
    
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
    
    this.updateNativeSelect();
    this.updateValueDisplay();
    this.updateClearButton();
    this.dispatchChangeEvent(option);
  }

  @watch('value')
  handleValueChange() {
    if (this.multiple) {
      this.selectedValues = new Set(this.value ? this.value.split(',').map(v => v.trim()) : []);
    }
    this.updateNativeSelect();
    this.updateValueDisplay();
    this.updateClearButton();
  }

  @watch('disabled')
  handleDisabledChange() {
    this.updateTriggerState();
    this.updateNativeSelectAttributes();
    this.updateClearButton();
    if (this.disabled && this.open) {
      this.closeDropdown();
    }
  }

  @watch('readonly')
  handleReadonlyChange() {
    this.updateTriggerState();
    this.updateClearButton();
  }

  @watch('invalid')
  handleInvalidChange() {
    this.updateTriggerState();
  }

  // Remove the @watch('options') since options are now read from children

  @watch('open')
  handleOpenChange() {
    this.updateDropdownState();
    this.updateTriggerState();
    
    if (this.open && this.searchable && this.searchInput) {
      setTimeout(() => this.searchInput?.focus(), 100);
    }
    
    if (!this.open) {
      this.focusedIndex = -1;
      if (this.searchInput) {
        this.searchInput.value = '';
        this.filteredOptions = [...this.options];
        this.updateDropdownContent();
      }
    }
  }

  @watch('label')
  handleLabelChange() {
    if (this.labelElement) {
      this.labelElement.textContent = this.label;
      if (this.label) {
        this.labelElement.removeAttribute('hidden');
      } else {
        this.labelElement.setAttribute('hidden', '');
      }
    }
  }

  @watch('placeholder')
  handlePlaceholderChange() {
    this.updateValueDisplay();
  }

  @watch('required')
  handleRequiredChange() {
    if (this.labelElement) {
      this.labelElement.classList.toggle('select-label--required', this.required);
    }
    this.updateNativeSelectAttributes();
  }

  @watch('multiple')
  handleMultipleChange() {
    this.updateNativeSelectAttributes();
  }

  @watch('name')
  handleNameChange() {
    this.updateNativeSelectAttributes();
  }


  @watch('clearable')
  handleClearableChange() {
    this.updateClearButton();
  }

  @watch('searchable')
  handleSearchableChange() {
    if (this.searchContainer) {
      if (this.searchable) {
        this.searchContainer.removeAttribute('hidden');
      } else {
        this.searchContainer.setAttribute('hidden', '');
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

  private updateNativeSelect() {
    if (!this.nativeSelect) return;

    // Clear and rebuild options
    this.nativeSelect.innerHTML = '';
    this.options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      option.selected = this.multiple ? 
        this.selectedValues.has(opt.value) : 
        opt.value === this.value;
      this.nativeSelect!.appendChild(option);
    });
  }

  @dispatch('@snice/select-change', { bubbles: true, composed: true })
  private dispatchChangeEvent(option?: SelectOption) {
    return {
      value: this.multiple ? Array.from(this.selectedValues) : this.value,
      option,
      select: this
    };
  }

  @dispatch('@snice/select-open', { bubbles: true, composed: true })
  private dispatchOpenEvent() {
    return { select: this };
  }

  @dispatch('@snice/select-close', { bubbles: true, composed: true })
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
    this.updateNativeSelect();
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
    this.trigger.setAttribute('aria-expanded', String(this.open));
    this.trigger.disabled = this.disabled;
  }

  private updateDropdownState() {
    if (!this.dropdown) return;
    
    this.dropdown.classList.toggle('select-dropdown--open', this.open);
    
    if (this.arrow) {
      this.arrow.classList.toggle('select-arrow--open', this.open);
    }
  }

  private updateNativeSelectAttributes() {
    if (!this.nativeSelect) return;
    
    this.nativeSelect.disabled = this.disabled;
    this.nativeSelect.required = this.required;
    this.nativeSelect.multiple = this.multiple;
    if (this.name) {
      this.nativeSelect.name = this.name;
    } else {
      this.nativeSelect.removeAttribute('name');
    }
  }
}