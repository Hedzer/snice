import { element, property, render, styles, dispatch, html, css } from 'snice';
import type { TaskPriority } from '../types/task';

@element('task-card')
class TaskCard extends HTMLElement {
  @property() taskId = '';
  @property() title = '';
  @property() description = '';
  @property() priority: TaskPriority = 'medium';
  @property() assignee = '';
  @property() tags = '';
  @property() dueDate = '';

  @dispatch('task-click')
  handleClick() {
    return { id: this.taskId };
  }

  @dispatch('task-move')
  handleMove() {
    return { id: this.taskId };
  }

  @render()
  renderContent() {
    const tagList = this.tags ? this.tags.split(',').filter(Boolean) : [];
    const isOverdue = this.dueDate && new Date(this.dueDate) < new Date();

    return html`
      <div class="card" @click=${this.handleClick} draggable="true">
        <div class="card__header">
          <span class="priority priority--${this.priority}">${this.priority}</span>
          <if ${!!this.dueDate}>
            <span class="due-date ${isOverdue ? 'due-date--overdue' : ''}">
              ${this.formatDate(this.dueDate)}
            </span>
          </if>
        </div>
        <h4 class="card__title">${this.title}</h4>
        <if ${tagList.length > 0}>
          <div class="card__tags">
            ${tagList.map(
              (tag) => html`<span key=${tag} class="tag">${tag}</span>`
            )}
          </div>
        </if>
        <if ${!!this.assignee}>
          <div class="card__footer">
            <div class="avatar">${this.assignee.charAt(0).toUpperCase()}</div>
            <span class="assignee">${this.assignee}</span>
          </div>
        </if>
      </div>
    `;
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: block;
      }

      .card {
        background: var(--snice-color-background-element, rgb(255 255 255));
        border: 1px solid var(--snice-color-border, rgb(226 232 240));
        border-radius: 8px;
        padding: 0.875rem;
        cursor: pointer;
        transition: all 150ms ease;
        user-select: none;
      }

      .card:hover {
        box-shadow: var(--snice-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
        border-color: var(--snice-color-primary, rgb(99 102 241));
      }

      .card__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }

      .priority {
        display: inline-block;
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .priority--low {
        background: rgb(219 234 254);
        color: rgb(29 78 216);
      }

      .priority--medium {
        background: rgb(254 243 199);
        color: rgb(161 98 7);
      }

      .priority--high {
        background: rgb(254 226 226);
        color: rgb(185 28 28);
      }

      .priority--urgent {
        background: rgb(185 28 28);
        color: white;
      }

      .due-date {
        font-size: 0.75rem;
        color: var(--snice-color-text-tertiary, rgb(148 163 184));
      }

      .due-date--overdue {
        color: var(--snice-color-danger, rgb(239 68 68));
        font-weight: 600;
      }

      .card__title {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--snice-color-text, rgb(15 23 42));
        margin: 0 0 0.5rem;
        line-height: 1.4;
      }

      .card__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-bottom: 0.5rem;
      }

      .tag {
        padding: 0.0625rem 0.375rem;
        border-radius: 4px;
        font-size: 0.6875rem;
        background: var(--snice-color-background, rgb(248 250 252));
        color: var(--snice-color-text-secondary, rgb(100 116 139));
        border: 1px solid var(--snice-color-border, rgb(226 232 240));
      }

      .card__footer {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding-top: 0.5rem;
        border-top: 1px solid var(--snice-color-border, rgb(226 232 240));
      }

      .avatar {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background: var(--snice-color-primary, rgb(99 102 241));
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.6875rem;
        font-weight: 700;
      }

      .assignee {
        font-size: 0.75rem;
        color: var(--snice-color-text-secondary, rgb(100 116 139));
      }
    `;
  }
}
