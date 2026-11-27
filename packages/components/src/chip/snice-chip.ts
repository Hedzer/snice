import { element, property, watch, query, dispatch, on, ready, dispose, render, styles, html, css } from 'snice';
import { renderIcon, pickContrastColor, onThemeChange } from '../utils';
import cssContent from './snice-chip.css?inline';
import type { ChipVariant, ChipSize, ChipShape, SniceChipElement } from './snice-chip.types';
import { attachCompiledPlatformBehavior } from '../platform-behaviors/bind';

@element('snice-chip')
export class SniceChip extends HTMLElement implements SniceChipElement {
  @property({  })
  label = '';

  @property({  })
  variant: ChipVariant = 'default';

  @property({  })
  size: ChipSize = 'medium';

  @property({  })
  shape: ChipShape = 'pill';

  @property({ type: Boolean,  })
  removable = false;

  @property({ type: Boolean,  })
  selectable = false;

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

  @property({ type: Boolean, attribute: false })
  private hasIconSlot = false;

  @on('slotchange', { target: 'slot[name="icon"]' })
  handleIconSlotChange() {
    const slot = this.shadowRoot?.querySelector('slot[name="icon"]') as HTMLSlotElement;
    this.hasIconSlot = (slot?.assignedNodes().length ?? 0) > 0;
  }

  @render()
  render() {
    const chipClasses = `chip${this.selected ? ' chip--selected' : ''}`;
    // The icon slot must project whenever slotted, regardless of the `icon`
    // property — probe the light DOM directly so a slot-only icon paints on
    // first render (MATRIX-chip-5: the slotchange flag alone was chicken-and-
    // egg, since the slot lived inside the gate it controlled).
    const showIcon = !this.avatar
      && (this.icon || this.hasIconSlot || !!this.querySelector('[slot="icon"]'));

    return html/*html*/`
      <div class="${chipClasses}"
           role="${this.removable ? 'button' : 'status'}"
           tabindex="${this.disabled ? '-1' : '0'}"
           aria-disabled="${this.disabled}"
           aria-selected="${this.selected}"
           part="base${this.selected ? ' base-selected' : ''}${this.disabled ? ' base-disabled' : ''}"
           @click=${(e: MouseEvent) => this.handleChipClick(e)}
           @keydown=${(e: KeyboardEvent) => this.handleKeydown(e)}>
        <span class="chip-ripple" part="ripple" data-platform-only="material" aria-hidden="true" hidden></span>
        <if ${this.avatar}>
          <img class="chip-avatar" src="${this.avatar}" alt="" part="avatar">
        </if>
        <if ${showIcon}>
          <span class="chip-icon-slot" part="icon">
            <slot name="icon">
              <if ${this.icon}>
                ${renderIcon(this.icon, 'chip-icon')}
              </if>
            </slot>
          </span>
        </if>
        <span class="chip-label" part="label"><slot>${this.label}</slot></span>
        <if ${this.removable}>
          <button class="chip-remove"
                  part="remove-button"
                  type="button"
                  tabindex="-1"
                  aria-label="Remove ${this.label}"
                  @click=${(e: MouseEvent) => this.handleRemoveClick(e)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" part="remove-icon">
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

    if (this.selectable) {
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
      if (this.selectable) {
        this.selected = !this.selected;
      }
      this.dispatchChipClick();
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && this.removable) {
      event.preventDefault();
      this.dispatchChipRemove();
    }
  }

  private themeUnsubscribe?: () => void;
  private platformBehaviorCleanup?: () => void;
  private platformObserver?: MutationObserver;

  @ready()
  init() {
    this.applyAutoContrastColor();
    this.themeUnsubscribe = onThemeChange(() => this.applyAutoContrastColor());
    this.platformBehaviorCleanup = attachCompiledPlatformBehavior(this);
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => this.applyAutoContrastColor());
      let cur: Element | null = this;
      while (cur) {
        observer.observe(cur, { attributes: true, attributeFilter: ['data-platform'] });
        cur = cur.parentElement;
      }
      this.platformObserver = observer;
    }
  }

  @dispose()
  teardown() {
    this.platformBehaviorCleanup?.();
    this.platformBehaviorCleanup = undefined;
    this.platformObserver?.disconnect();
    this.platformObserver = undefined;
    this.themeUnsubscribe?.();
  }

  @watch('selected', 'variant')
  updateSelected() {
    if (this.chipElement) {
      this.chipElement.classList.toggle('chip--selected', this.selected);
      this.chipElement.setAttribute('aria-selected', String(this.selected));
    }
    this.applyAutoContrastColor();
  }

  /**
   * Sets chip text color via runtime luminance check — but ONLY for selected
   * chips (the solid-fill state) when no platform skin is active. Under an
   * active platform skin (Mode B `[data-platform]` or Mode A adopted sheet),
   * defer to the platform stylesheet's calibrated semantic ink tokens.
   */
  applyAutoContrastColor() {
    const el = this.chipElement;
    if (!el) return;
    if (!this.selected) {
      el.style.removeProperty('color');
      return;
    }
    if (this.style.color) return;
    if (this.closest('[data-platform]') || (this.shadowRoot?.adoptedStyleSheets?.length ?? 0) > 1) {
      el.style.removeProperty('color');
      return;
    }
    const bg = getComputedStyle(el).backgroundColor;
    el.style.color = pickContrastColor(bg);
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