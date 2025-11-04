import { element, property, watch, ready, dispatch, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-cell-actions.css?inline';
import type { SniceCellElement, ColumnDefinition } from './snice-table.types';

export interface ActionButton {
  action: string;
  label?: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  title?: string;
  disabled?: boolean;
}

@element('snice-cell-actions')
export class SniceCellActions extends HTMLElement implements SniceCellElement {
  @property({ type: Array })
  actions: ActionButton[] = [];

  @property({ type: Object })
  column: ColumnDefinition | null = null;

  @property({ type: Object })
  rowData: any = null;

  @property({ type: String })
  value: string = '';

  @property({ type: String })
  align: 'left' | 'center' | 'right' = 'left';

  @property({ type: String })
  type: string = 'actions';

  @render()
  render() {
    if (this.actions.length === 0) {
      return html/*html*/`
        <div class="cell-content cell-content--actions" part="content">
          <div class="actions-container"></div>
        </div>
      `;
    }

    return html/*html*/`
      <div class="cell-content cell-content--actions" part="content">
        <div class="actions-container">
          ${this.actions.map(action => this.renderActionButton(action))}
        </div>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.extractActionsFromColumn();
  }

  @watch('column')
  extractActionsFromColumn() {
    if (this.column?.actionsFormat?.actions) {
      this.actions = this.column.actionsFormat.actions;
    }
  }

  private renderActionButton(action: ActionButton) {
    const icon = action.icon || '';
    const label = action.label || '';
    const variant = action.variant || 'secondary';
    const disabled = action.disabled || false;

    // Determine if icon is an image URL or text/emoji
    const isImageUrl = icon && (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/') || icon.startsWith('./'));

    let iconHTML = '';
    if (icon) {
      if (isImageUrl) {
        iconHTML = `<span class="action-icon action-icon--image"><img src="${icon}" alt="" /></span>`;
      } else {
        iconHTML = `<span class="action-icon">${icon}</span>`;
      }
    }

    return html/*html*/`
      <button
        class="action-button action-button--${variant}"
        part="action-button"
        title="${action.title || action.action}"
        ?disabled=${disabled}
        @click=${(e: Event) => this.handleActionClick(e, action.action)}
      >
        ${unsafeHTML(iconHTML)}
        ${label ? html/*html*/`<span class="action-label">${label}</span>` : ''}
      </button>
    `;
  }

  private handleActionClick(e: Event, action: string) {
    e.stopPropagation();
    this.dispatchAction(action);
  }

  @dispatch('cell-action', { bubbles: true, composed: true })
  private dispatchAction(action: string) {
    return {
      action,
      rowData: this.rowData,
      column: this.column
    };
  }
}
