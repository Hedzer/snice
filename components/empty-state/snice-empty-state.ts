import { element, property, dispatch, render, styles, html, css } from 'snice';
import { renderIcon } from '../utils';
import cssContent from './snice-empty-state.css?inline';
import type { EmptyStateSize, SniceEmptyStateElement } from './snice-empty-state.types';

@element('snice-empty-state')
export class SniceEmptyState extends HTMLElement implements SniceEmptyStateElement {
  @property({  })
  size: EmptyStateSize = 'medium';

  @property({  })
  icon = '📭';

  @property({  })
  title = 'No data';

  @property({  })
  description = '';

  @property({ attribute: 'action-text',  })
  actionText = '';

  @property({ attribute: 'action-href',  })
  actionHref = '';

  @render()
  render() {
    const emptyStateClasses = ['empty-state', `empty-state--${this.size}`].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="${emptyStateClasses}" part="container">
        <div class="empty-state__icon-wrapper" part="icon">
          <slot name="icon">
            ${renderIcon(this.icon, 'empty-state__icon')}
          </slot>
        </div>
        <h3 class="empty-state__title" part="title">${this.title}</h3>
        <if ${this.description}>
          <p class="empty-state__description" part="description">${this.description}</p>
        </if>
        <if ${this.actionText}>
          <case ${this.actionHref ? 'link' : 'button'}>
            <when value="link">
              <a
                href="${this.actionHref}"
                class="empty-state__action"
                part="action"
                @click=${this.handleActionClick}
              >${this.actionText}</a>
            </when>
            <when value="button">
              <button
                class="empty-state__action"
                part="action"
                type="button"
                @click=${this.handleActionClick}
              >${this.actionText}</button>
            </when>
          </case>
        </if>
        <slot></slot>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  private handleActionClick(e: Event) {
    if (!this.actionHref) {
      e.preventDefault();
    }
    this.dispatchActionEvent();
  }

  @dispatch('empty-state-action', { bubbles: true, composed: true })
  private dispatchActionEvent() {
    return { emptyState: this };
  }
}
