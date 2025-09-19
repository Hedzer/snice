import { element, property, watch, query, on, dispatch } from 'snice';
import css from './snice-chip.css?inline';
import type { ChipVariant, ChipSize, SniceChipElement } from './snice-chip.types';

@element('snice-chip')
export class SniceChip extends HTMLElement implements SniceChipElement {
  @property({  })
  label = '';

  @property({  })
  variant: ChipVariant = 'default';

  @property({  })
  size: ChipSize = 'medium';

  @property({ type: Boolean,  })
  removable = false;

  @property({ type: Boolean,  })
  selected = false;

  @property({ type: Boolean,  })
  disabled = false;

  @property({  })
  icon = '';

  @property({  })
  avatar = '';

  @query('.chip')
  chipElement?: HTMLElement;

  @query('.chip-remove')
  removeButton?: HTMLButtonElement;

  html() {
    return /*html*/`
      <div class="chip ${this.selected ? 'chip--selected' : ''}" 
           role="${this.removable ? 'button' : 'status'}"
           tabindex="${this.disabled ? '-1' : '0'}"
           aria-disabled="${this.disabled}"
           aria-selected="${this.selected}">
        ${this.avatar ? /*html*/`
          <img class="chip-avatar" src="${this.avatar}" alt="">
        ` : this.icon ? /*html*/`
          <span class="chip-icon">${this.icon}</span>
        ` : ''}
        <span class="chip-label">${this.label}</span>
        ${this.removable && !this.disabled ? /*html*/`
          <button class="chip-remove" 
                  type="button" 
                  tabindex="-1"
                  aria-label="Remove ${this.label}">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"/>
            </svg>
          </button>
        ` : ''}
      </div>
    `;
  }

  css() {
    return css;
  }

  @on('click', '.chip')
  @dispatch('chip-click')
  handleClick(event: MouseEvent) {
    if (this.disabled) return;
    if ((event.target as HTMLElement).closest('.chip-remove')) return;
    
    if (!this.removable) {
      this.selected = !this.selected;
    }
    
    return { 
      label: this.label,
      selected: this.selected 
    };
  }

  @on('click', '.chip-remove')
  @dispatch('chip-remove')
  handleRemove(event: MouseEvent) {
    event.stopPropagation();
    if (this.disabled) return;
    
    return { label: this.label };
  }

  @on(['keydown:Enter', 'keydown:Space'], '.chip')
  handleKeyPress(event: KeyboardEvent) {
    event.preventDefault();
    if (this.disabled) return;
    
    if (!this.removable) {
      this.selected = !this.selected;
      this.dispatchChipClick();
    }
  }

  @on(['keydown:Delete', 'keydown:Backspace'], '.chip')
  handleDelete(event: KeyboardEvent) {
    if (this.disabled || !this.removable) return;
    event.preventDefault();
    this.dispatchChipRemove();
  }

  @watch('selected')
  updateSelected() {
    if (this.chipElement) {
      this.chipElement.classList.toggle('chip--selected', this.selected);
      this.chipElement.setAttribute('aria-selected', String(this.selected));
    }
  }

  @watch('disabled')
  updateDisabled() {
    if (this.chipElement) {
      this.chipElement.setAttribute('aria-disabled', String(this.disabled));
      this.chipElement.setAttribute('tabindex', this.disabled ? '-1' : '0');
    }
  }

  @dispatch('chip-click')
  private dispatchChipClick() {
    return { 
      label: this.label,
      selected: this.selected 
    };
  }

  @dispatch('chip-remove')
  private dispatchChipRemove() {
    return { label: this.label };
  }
}