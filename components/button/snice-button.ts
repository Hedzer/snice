import { element, property, query, on, render, styles, html, css } from 'snice';
import { renderIcon } from '../utils';
import cssContent from './snice-button.css?inline';
import type { ButtonVariant, ButtonSize, ButtonType, IconPlacement, SniceButtonElement } from './snice-button.types';

@element('snice-button', { formAssociated: true })
export class SniceButton extends HTMLElement implements SniceButtonElement {
  internals!: ElementInternals;

  constructor() {
    super();
    if (typeof this.attachInternals === 'function') {
      this.internals = this.attachInternals();
    }
  }

  @property({  })
  variant: ButtonVariant = 'default';

  @property({  })
  size: ButtonSize = 'medium';

  @property({  })
  type: ButtonType = 'button';

  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  loading = false;

  @property({ type: Boolean,  })
  outline = false;

  @property({ type: Boolean,  })
  pill = false;

  @property({ type: Boolean,  })
  circle = false;

  @property({ type: String,  })
  href = '';

  @property({ type: String,  })
  target = '';

  @property({ type: String,  })
  download = '';

  @property({ type: String,  })
  icon = '';

  @property({ attribute: 'icon-placement',  })
  iconPlacement: IconPlacement = 'start';

  private hasIconSlot = false;

  @query('.button')
  button?: HTMLButtonElement;

  @query('.spinner')
  spinner?: HTMLElement;

  @query('.label')
  label?: HTMLElement;

  @query('.icon')
  iconElement?: HTMLImageElement;

  @on('slotchange', { target: 'slot[name="icon"]' })
  handleIconSlotChange() {
    const slot = this.shadowRoot?.querySelector('slot[name="icon"]') as HTMLSlotElement;
    this.hasIconSlot = (slot?.assignedNodes().length ?? 0) > 0;
  }

  @render()
  render() {
    const hasIcon = this.icon || this.hasIconSlot;
    const showIconStart = hasIcon && this.iconPlacement === 'start';
    const showIconEnd = hasIcon && this.iconPlacement === 'end';
    const classes = [
      'button',
      `button--${this.variant || 'default'}`,
      `button--${this.size || 'medium'}`,
      this.outline ? 'button--outline' : '',
      this.pill ? 'button--pill' : '',
      this.circle ? 'button--circle' : '',
      this.loading ? 'button--loading' : '',
      this.disabled ? 'button--disabled' : '',
      hasIcon ? `button--has-icon` : '',
      hasIcon ? `button--icon-${this.iconPlacement}` : ''
    ].filter(Boolean).join(' ');

    return html/*html*/`
      <button class="${classes}" type="${this.type}" ?disabled="${this.disabled}" part="base" @click="${(e: MouseEvent) => this.handleInternalClick(e)}">
        <span class="spinner" part="spinner"></span>
        <if ${showIconStart}>
          <span class="icon-slot" part="icon">
            <slot name="icon">
              <if ${this.icon}>
                ${renderIcon(this.icon, 'icon')}
              </if>
            </slot>
          </span>
        </if>
        <span class="label" part="label">
          <slot></slot>
        </span>
        <if ${showIconEnd}>
          <span class="icon-slot" part="icon">
            <slot name="icon">
              <if ${this.icon}>
                ${renderIcon(this.icon, 'icon')}
              </if>
            </slot>
          </span>
        </if>
      </button>
    `;
  }

  private handleInternalClick(event: MouseEvent) {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Handle navigation if href is set
    if (this.href) {
      if (this.download) {
        const a = document.createElement('a');
        a.href = this.href;
        a.download = this.download;
        a.click();
      } else if (this.target) {
        window.open(this.href, this.target);
      } else {
        window.location.href = this.href;
      }
    }

    // Handle form submission/reset for form-associated buttons
    const form = this.internals?.form || this.closest('form');
    if (form) {
      switch (this.type) {
        case 'submit':
          form.requestSubmit();
          break;
        case 'reset':
          form.reset();
          break;
      }
    }

    // Dispatch the custom event
    this.dispatchEvent(new CustomEvent('button-click', {
      bubbles: true,
      composed: true,
      detail: { originalEvent: event }
    }));
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  // Keep these methods for backwards compatibility if needed
  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
  }

  setVariant(variant: typeof this.variant) {
    this.variant = variant;
  }

  focus(options?: FocusOptions) {
    this.button?.focus(options);
  }

  blur() {
    this.button?.blur();
  }

  click() {
    this.button?.click();
  }
}