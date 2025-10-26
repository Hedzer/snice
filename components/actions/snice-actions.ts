import { element, property, render, styles, dispatch, ready, dispose, html, css } from 'snice';
import type { SniceActionsElement, ActionButton, ActionButtonSize, ActionButtonVariant } from './snice-actions.types';
import cssContent from './snice-actions.css?inline';

@element('snice-actions')
export class SniceActions extends HTMLElement implements SniceActionsElement {
  @property({ type: Array })
  actions: ActionButton[] = [];

  @property({ attribute: 'size' })
  size: ActionButtonSize = 'medium';

  @property({ attribute: 'variant' })
  variant: ActionButtonVariant = 'text';

  @property({ type: Boolean, attribute: 'show-labels' })
  showLabels = true;

  @property({ type: Number, attribute: 'max-visible' })
  maxVisible = 3;

  @property({ attribute: 'more-label' })
  moreLabel = 'More';

  @property({ attribute: 'more-icon' })
  moreIcon = '⋯';

  private dropdownOpen = false;

  @dispatch('@snice/action-trigger', { bubbles: true, composed: true })
  private dispatchActionTrigger(action: ActionButton) {
    return { action, actionsElement: this };
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  triggerAction(id: string): void {
    const action = this.getAction(id);
    if (action && !action.disabled) {
      this.handleActionClick(action);
    }
  }

  getAction(id: string): ActionButton | undefined {
    return this.actions.find(a => a.id === id);
  }

  private async handleActionClick(action: ActionButton) {
    if (action.disabled) return;

    this.dispatchActionTrigger(action);

    if (action.action) {
      await action.action();
    }

    if (action.href) {
      if (action.target) {
        window.open(action.href, action.target);
      } else {
        window.location.href = action.href;
      }
    }

    this.closeDropdown();
  }

  private toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  private closeDropdown() {
    if (this.dropdownOpen) {
      this.dropdownOpen = false;
    }
  }

  private renderActionButton(action: ActionButton, inDropdown = false) {
    const variant = action.variant || this.variant;
    const classes = [
      inDropdown ? 'dropdown-item' : 'action-button',
      variant !== 'text' && !inDropdown ? `action-button--${variant}` : '',
      this.size !== 'medium' && !inDropdown ? `action-button--${this.size}` : '',
      action.danger ? (inDropdown ? 'dropdown-item--danger' : 'action-button--danger') : '',
    ].filter(Boolean).join(' ');

    const content = html`
      <if ${action.iconImage}>
        <span class="icon">
          <img src="${action.iconImage}" alt="${action.label || ''}" />
        </span>
      </if>
      <if ${!action.iconImage && action.icon}>
        <span class="icon">${action.icon}</span>
      </if>
      <if ${this.showLabels && action.label}>
        <span>${action.label}</span>
      </if>
    `;

    if (action.href) {
      return html`
        <a
          class="${classes}"
          href="${action.href}"
          target="${action.target || '_self'}"
          title="${action.tooltip || action.label || ''}"
          @click=${(e: Event) => {
            e.preventDefault();
            this.handleActionClick(action);
          }}>
          ${content}
        </a>
      `;
    }

    return html`
      <button
        class="${classes}"
        ?disabled=${action.disabled}
        title="${action.tooltip || action.label || ''}"
        @click=${() => this.handleActionClick(action)}>
        ${content}
      </button>
    `;
  }

  @render()
  template() {
    if (!this.actions || this.actions.length === 0) {
      return html``;
    }

    const visibleActions = this.maxVisible > 0
      ? this.actions.slice(0, this.maxVisible)
      : this.actions;

    const hiddenActions = this.maxVisible > 0 && this.actions.length > this.maxVisible
      ? this.actions.slice(this.maxVisible)
      : [];

    return html`
      <div class="actions">
        ${visibleActions.map(action => this.renderActionButton(action))}

        <if ${hiddenActions.length > 0}>
          <div class="more-button">
            <button
              class="action-button action-button--${this.size}"
              @click=${() => this.toggleDropdown()}
              title="${this.moreLabel}">
              <span class="icon">${this.moreIcon}</span>
              <if ${this.showLabels}>
                <span>${this.moreLabel}</span>
              </if>
            </button>

            <div class="dropdown ${this.dropdownOpen ? 'dropdown--open' : ''}">
              ${hiddenActions.map(action => this.renderActionButton(action, true))}
            </div>
          </div>
        </if>
      </div>
    `;
  }

  @ready()
  init() {
    // Close dropdown when clicking outside
    document.addEventListener('click', this.handleOutsideClick);
  }

  @dispose()
  cleanup() {
    document.removeEventListener('click', this.handleOutsideClick);
  }

  private handleOutsideClick = (e: Event) => {
    if (!this.contains(e.target as Node)) {
      this.closeDropdown();
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-actions': SniceActions;
  }
}
