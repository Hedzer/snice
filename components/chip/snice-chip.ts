import { element, property, watch, query, dispatch, render, styles, html, css } from 'snice';
import cssContent from './snice-chip.css?inline';
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

  @render()
  render() {
    const chipClasses = `chip${this.selected ? ' chip--selected' : ''}`;

    return html/*html*/`
      <div class="${chipClasses}"
           role="${this.removable ? 'button' : 'status'}"
           tabindex="${this.disabled ? '-1' : '0'}"
           aria-disabled="${this.disabled}"
           aria-selected="${this.selected}"
           @click=${(e: MouseEvent) => this.handleChipClick(e)}
           @keydown=${(e: KeyboardEvent) => this.handleKeydown(e)}>
        <if ${this.avatar}>
          <img class="chip-avatar" src="${this.avatar}" alt="">
        </if>
        <if ${!this.avatar && this.icon}>
          <span class="chip-icon">${this.icon}</span>
        </if>
        <span class="chip-label">${this.label}</span>
        <if ${this.removable && !this.disabled}>
          <button class="chip-remove"
                  type="button"
                  tabindex="-1"
                  aria-label="Remove ${this.label}"
                  @click=${(e: MouseEvent) => this.handleRemoveClick(e)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"/>
            </svg>
          </button>
        </if>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  private handleChipClick(event: MouseEvent) {
    if (this.disabled) return;
    const target = event.target as HTMLElement;
    if (target.closest('.chip-remove')) return;

    if (!this.removable) {
      this.selected = !this.selected;
    }

    this.dispatchChipClick();
  }

  private handleRemoveClick(event: MouseEvent) {
    event.stopPropagation();
    if (this.disabled) return;
    this.dispatchChipRemove();
  }

  private handleKeydown(event: KeyboardEvent) {
    if (this.disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.removable) {
        this.selected = !this.selected;
        this.dispatchChipClick();
      }
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && this.removable) {
      event.preventDefault();
      this.dispatchChipRemove();
    }
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