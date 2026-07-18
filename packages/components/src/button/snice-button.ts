import { element, property, state, query, render, styles, html, css, isSafeUrl } from 'snice';
import { renderIcon, strictStringAttributeConverter } from '../utils';
import cssContent from './snice-button.css?inline';
import type { ButtonVariant, ButtonSize, ButtonType, IconPlacement, ButtonJustify, SniceButtonElement } from './snice-button.types';
import { findFormOwner } from '../form-control-validity';

@element('snice-button', { formAssociated: true, delegatesFocus: true })
export class SniceButton extends HTMLElement implements SniceButtonElement {
  internals!: ElementInternals;

  @state()
  private formDisabled = false;

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

  @property({ type: String, converter: strictStringAttributeConverter })
  href = '';

  @property({ type: String,  })
  target = '';

  @property({ type: String,  })
  download = '';

  @property({ type: String,  })
  icon = '';

  @property({ attribute: 'icon-placement',  })
  iconPlacement: IconPlacement = 'start';

  @property({ attribute: 'justify-text' })
  justifyText: ButtonJustify = 'center';

  @query('[slot="icon"]', { light: true })
  private iconSlotChild?: Element;

  private get hasIconSlot() {
    return !!this.iconSlotChild;
  }

  private get effectiveDisabled() {
    return this.disabled || this.formDisabled;
  }

  private get interactionDisabled() {
    return this.effectiveDisabled || this.loading;
  }

  @query('.button')
  button?: HTMLButtonElement;

  @query('.spinner')
  spinner?: HTMLElement;

  @query('.label')
  label?: HTMLElement;

  @query('.icon')
  iconElement?: HTMLImageElement;

  @render()
  render() {
    const effectiveDisabled = this.effectiveDisabled;
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
      effectiveDisabled ? 'button--disabled' : '',
      hasIcon ? `button--has-icon` : '',
      hasIcon ? `button--icon-${this.iconPlacement}` : ''
    ].filter(Boolean).join(' ');

    return html/*html*/`
      <button class="${classes}" type="${this.type}" ?disabled="${effectiveDisabled}" part="base" @click="${(e: MouseEvent) => this.handleInternalClick(e)}">
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
    if (this.interactionDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // A non-empty href turns this activation into navigation. Treat an
    // invalid URL as a blocked activation: it must not fall through to form
    // behavior or emit the success-oriented button-click event.
    if (this.href !== '') {
      const href = typeof this.href === 'string' ? this.href.trim() : '';
      if (!href || !isSafeUrl(href)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (this.download) {
        const a = document.createElement('a');
        a.href = href;
        a.download = this.download;
        a.click();
      } else if (this.target) {
        window.open(href, this.target, 'noopener');
      } else {
        window.location.href = href;
      }
    } else {
      // Form behavior is a separate activation mode. A safe, non-empty href
      // takes precedence over type="submit" or type="reset".
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
    }

    // Dispatch the custom event
    this.dispatchEvent(new CustomEvent('button-click', {
      bubbles: true,
      composed: true,
      detail: { originalEvent: event }
    }));
  }

  private formDisabledCallback(disabled: boolean) {
    // The browser reports effective disabledness here, including disabled
    // ancestor fieldsets and their first-legend exception. Keep that state
    // separate so the authored `disabled` property/attribute is untouched.
    this.formDisabled = disabled;
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
    if (this.effectiveDisabled) return;
    this.button?.focus(options);
  }

  blur() {
    this.button?.blur();
  }

  click() {
    if (this.effectiveDisabled) return;
    this.button?.click();
  }

  /** Owning form, including association through a `form` attribute. @public */
  get form(): HTMLFormElement | null {
    return findFormOwner(this, this.internals);
  }

  /** Labels associated with the form-associated host. @public */
  get labels(): NodeList | null {
    return this.internals?.labels ?? null;
  }
}
