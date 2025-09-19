import { element, property, ready } from 'snice';
import type { SniceOptionElement } from './snice-option.types';

@element('snice-option')
export class SniceOption extends HTMLElement implements SniceOptionElement {
  @property({  })
  value = '';

  @property({  })
  label = '';

  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  selected = false;

  @property({  })
  icon = '';

  html() {
    // Options are data-only elements, no shadow DOM needed
    return '';
  }

  @ready()
  init() {
    // Hide the option element itself as it's only used for data
    this.style.display = 'none';
    
    // If no label is provided, use the text content
    if (!this.label && this.textContent) {
      this.label = this.textContent.trim();
    }
    
    // If no value is provided, use the label
    if (!this.value && this.label) {
      this.value = this.label;
    }
  }

  // Getter for the option data
  get optionData() {
    return {
      value: this.value,
      label: this.label || this.textContent?.trim() || this.value,
      disabled: this.disabled,
      selected: this.selected,
      icon: this.icon
    };
  }
}