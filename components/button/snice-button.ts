import { element, property, query, on, dispatch, watch } from 'snice';
import css from './snice-button.css?inline';
import type { ButtonVariant, ButtonSize, IconPlacement, SniceButtonElement } from './snice-button.types';

@element('snice-button')
export class SniceButton extends HTMLElement implements SniceButtonElement {
  @property({  })
  variant: ButtonVariant = 'default';

  @property({  })
  size: ButtonSize = 'medium';

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


  @query('.button')
  button?: HTMLButtonElement;

  @query('.spinner')
  spinner?: HTMLElement;

  @query('.label')
  label?: HTMLElement;

  @query('.icon')
  iconElement?: HTMLImageElement;

  html() {
    const classes = [
      'button',
      `button--${this.variant || 'default'}`,
      `button--${this.size || 'medium'}`,
      this.outline ? 'button--outline' : '',
      this.pill ? 'button--pill' : '',
      this.circle ? 'button--circle' : '',
      this.loading ? 'button--loading' : '',
      this.disabled ? 'button--disabled' : '',
      this.icon ? `button--has-icon` : '',
      this.icon ? `button--icon-${this.iconPlacement}` : ''
    ].filter(Boolean).join(' ');

    const iconElement = this.icon ? /*html*/`
      <img class="icon" src="${this.icon}" alt="" part="icon" />
    ` : '';

    return /*html*/`
      <button class="${classes}" type="button" ${this.disabled ? 'disabled' : ''} part="base">
        <span class="spinner" part="spinner"></span>
        ${this.iconPlacement === 'start' ? iconElement : ''}
        <span class="label" part="label">
          <slot></slot>
        </span>
        ${this.iconPlacement === 'end' ? iconElement : ''}
      </button>
    `;
  }

  css() {
    return css;
  }

  @watch('*')
  updateButtonClasses() {
    if (!this.button) return;
    
    // Rebuild all classes based on current state
    const classes = [
      'button',
      `button--${this.variant}`,
      `button--${this.size}`,
      this.outline ? 'button--outline' : '',
      this.pill ? 'button--pill' : '',
      this.circle ? 'button--circle' : '',
      this.loading ? 'button--loading' : '',
      this.disabled ? 'button--disabled' : '',
      this.icon ? `button--has-icon` : '',
      this.icon ? `button--icon-${this.iconPlacement}` : ''
    ].filter(Boolean);
    
    // Set the className directly to avoid class manipulation issues
    this.button.className = classes.join(' ');
  }

  @watch('disabled')
  updateDisabledState() {
    if (this.button) {
      this.button.disabled = this.disabled;
    }
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

  @on('click')
  @dispatch('@snice/click')
  handleClick(event: MouseEvent) {
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

    return { originalEvent: event };
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