import { element, property, query, watch, dispatch, ready, dispose, render, styles, html, css } from 'snice';
import { renderIcon } from '../utils';
import cssContent from './snice-split-button.css?inline';
import type { SplitButtonVariant, SplitButtonSize, SplitButtonAction, SniceSplitButtonElement } from './snice-split-button.types';

@element('snice-split-button')
export class SniceSplitButton extends HTMLElement implements SniceSplitButtonElement {
  @property()
  label = '';

  @property({ type: Array, attribute: false })
  actions: SplitButtonAction[] = [];

  @property()
  variant: SplitButtonVariant = 'default';

  @property()
  size: SplitButtonSize = 'medium';

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  loading = false;

  @property({ type: Boolean })
  outline = false;

  @property({ type: Boolean })
  pill = false;

  @property({ type: String })
  icon = '';

  @property({ attribute: 'icon-placement' })
  iconPlacement: 'start' | 'end' = 'start';

  @query('.split-button__menu')
  menu?: HTMLElement;

  @query('.split-button__arrow')
  arrowEl?: HTMLElement;

  @query('.split-button__primary')
  primaryBtn?: HTMLButtonElement;

  @query('.split-button__toggle')
  toggleBtn?: HTMLButtonElement;

  private isOpen = false;
  private outsideClickHandler?: (e: MouseEvent) => void;
  private globalKeyHandler?: (e: KeyboardEvent) => void;

  @render()
  render() {
    const classes = [
      'split-button',
      `split-button--${this.variant}`,
      `split-button--${this.size}`,
      this.outline ? 'split-button--outline' : '',
      this.pill ? 'split-button--pill' : '',
      this.loading ? 'split-button--loading' : '',
    ].filter(Boolean).join(' ');

    const iconHtml = this.icon ? renderIcon(this.icon, 'split-button__icon') : '';
    const isDisabled = this.disabled || this.loading;

    return html/*html*/`
      <div class="${classes}" part="base">
        <button
          type="button"
          class="split-button__primary"
          part="primary"
          ?disabled="${isDisabled}"
          @click="${(e: MouseEvent) => this.handlePrimaryClick(e)}">
          <if ${this.loading}>
            <span class="split-button__spinner" part="spinner"></span>
          </if>
          <if ${!this.loading && this.icon && this.iconPlacement === 'start'}>
            ${iconHtml}
          </if>
          <span class="split-button__label">${this.label}</span>
          <if ${!this.loading && this.icon && this.iconPlacement === 'end'}>
            ${iconHtml}
          </if>
        </button>

        <span class="split-button__divider" part="divider"></span>

        <button
          type="button"
          class="split-button__toggle"
          part="toggle"
          aria-haspopup="true"
          aria-expanded="false"
          aria-label="More actions"
          ?disabled="${isDisabled}"
          @click="${(e: MouseEvent) => this.handleToggleClick(e)}">
          <span class="split-button__arrow">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 9L1 4h10L6 9z"/>
            </svg>
          </span>
        </button>

        <div class="split-button__menu" role="menu" part="menu" popover="manual">
          <div class="split-button__menu-items" part="menu-items"
               @click="${(e: MouseEvent) => this.handleMenuClick(e)}">
            <!-- Actions rendered imperatively -->
          </div>
        </div>
      </div>
    `;
  }

  private renderActions(): string {
    return this.actions.map(action => /*html*/`
      <button
        type="button"
        class="split-button__action"
        data-value="${action.value}"
        role="menuitem"
        ?disabled="${action.disabled}"
        ${action.disabled ? 'disabled' : ''}
        part="action">
        <img class="split-button__action-icon" src="${action.icon || ''}" alt="" ${!action.icon ? 'hidden' : ''} />
        <span class="split-button__action-label">${action.label}</span>
      </button>
    `).join('');
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    requestAnimationFrame(() => {
      this.updateMenuContent();
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
        this.closeMenu();
      }
    };

    this.globalKeyHandler = (e: KeyboardEvent) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        this.closeMenu();
        this.toggleBtn?.focus();
      }
    };

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

  private handlePrimaryClick(e: MouseEvent) {
    if (this.disabled) return;
    e.stopPropagation();

    if (this.isOpen) {
      this.closeMenu();
    }

    this.dispatchPrimaryClickEvent();
  }

  private handleToggleClick(e: MouseEvent) {
    if (this.disabled) return;
    e.stopPropagation();

    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  private handleMenuClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const actionEl = target.closest('.split-button__action') as HTMLButtonElement;
    if (!actionEl || actionEl.disabled) return;

    e.stopPropagation();

    const value = actionEl.getAttribute('data-value');
    if (!value) return;

    const action = this.actions.find(a => a.value === value);
    if (action && !action.disabled) {
      this.closeMenu();
      this.dispatchActionClickEvent(action);
    }
  }

  private openMenu() {
    if (this.isOpen || this.disabled) return;
    this.isOpen = true;
    this.updateMenuState();
  }

  private closeMenu() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.updateMenuState();
  }

  private updateMenuState() {
    if (this.menu) {
      if (this.isOpen) {
        this.positionMenu();
        this.menu.classList.add('split-button__menu--open');
        if (typeof this.menu.showPopover === 'function') {
          this.menu.showPopover();
        }
      } else {
        this.menu.classList.remove('split-button__menu--open');
        if (typeof this.menu.hidePopover === 'function') {
          this.menu.hidePopover();
        }
      }
    }
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute('aria-expanded', String(this.isOpen));
    }
    if (this.arrowEl) {
      this.arrowEl.classList.toggle('split-button__arrow--open', this.isOpen);
    }
  }

  private positionMenu() {
    if (!this.menu || CSS.supports('position-anchor', '--a')) return;
    const base = this.shadowRoot?.querySelector('.split-button') as HTMLElement;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    this.menu.style.top = `${rect.bottom + 4}px`;
    this.menu.style.right = `${document.documentElement.clientWidth - rect.right}px`;
    this.menu.style.minWidth = `${rect.width}px`;
  }

  private updateMenuContent() {
    const menuItems = this.menu?.querySelector('.split-button__menu-items');
    if (menuItems) {
      menuItems.innerHTML = this.renderActions();
    }
  }

  @watch('actions')
  handleActionsChange() {
    requestAnimationFrame(() => {
      this.updateMenuContent();
    });
  }

  @watch('disabled')
  handleDisabledChange() {
    if (this.disabled && this.isOpen) {
      this.closeMenu();
    }
  }

  @dispatch('primary-click', { bubbles: true, composed: true })
  private dispatchPrimaryClickEvent() {
    return {
      button: this
    };
  }

  @dispatch('action-click', { bubbles: true, composed: true })
  private dispatchActionClickEvent(action: SplitButtonAction) {
    return {
      value: action.value,
      action,
      button: this
    };
  }
}
