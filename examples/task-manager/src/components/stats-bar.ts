import { element, property, render, styles, observe, html, css } from 'snice';
import type { Task } from '../types/task';
import { COLUMNS } from '../types/task';

@element('stats-bar')
class StatsBar extends HTMLElement {
  @property({ type: Array }) tasks: Task[] = [];
  @property({ type: Boolean }) compact = false;

  @observe('media:(max-width: 768px)')
  handleMediaChange(matches: boolean) {
    this.compact = matches;
  }

  @render()
  renderContent() {
    const total = this.tasks.length;
    const done = this.tasks.filter((t) => t.status === 'done').length;
    const inProgress = this.tasks.filter((t) => t.status === 'in-progress').length;
    const urgent = this.tasks.filter((t) => t.priority === 'urgent').length;
    const overdue = this.tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length;
    const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

    return html`
      <div class="stats">
        <div class="stat">
          <span class="stat__value">${total}</span>
          <span class="stat__label">Total</span>
        </div>
        <div class="stat">
          <span class="stat__value stat__value--progress">${inProgress}</span>
          <span class="stat__label">In Progress</span>
        </div>
        <div class="stat">
          <span class="stat__value stat__value--done">${done}</span>
          <span class="stat__label">Done</span>
        </div>
        <if ${!this.compact}>
          <div class="stat">
            <span class="stat__value stat__value--urgent">${urgent}</span>
            <span class="stat__label">Urgent</span>
          </div>
          <div class="stat">
            <span class="stat__value ${overdue > 0 ? 'stat__value--overdue' : ''}">${overdue}</span>
            <span class="stat__label">Overdue</span>
          </div>
        </if>
        <div class="stat stat--progress-bar">
          <div class="progress">
            <div class="progress__fill" style="width: ${completionPct}%"></div>
          </div>
          <span class="stat__label">${completionPct}% Complete</span>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: block;
      }

      .stats {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 0.75rem 1rem;
        background: var(--snice-color-background-element, rgb(255 255 255));
        border: 1px solid var(--snice-color-border, rgb(226 232 240));
        border-radius: 10px;
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.125rem;
      }

      .stat__value {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--snice-color-text, rgb(15 23 42));
      }

      .stat__value--progress {
        color: var(--snice-color-warning, rgb(245 158 11));
      }

      .stat__value--done {
        color: var(--snice-color-success, rgb(34 197 94));
      }

      .stat__value--urgent {
        color: var(--snice-color-danger, rgb(239 68 68));
      }

      .stat__value--overdue {
        color: var(--snice-color-danger, rgb(239 68 68));
      }

      .stat__label {
        font-size: 0.6875rem;
        font-weight: 500;
        color: var(--snice-color-text-tertiary, rgb(148 163 184));
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .stat--progress-bar {
        flex: 1;
        min-width: 6rem;
        align-items: stretch;
      }

      .progress {
        height: 0.375rem;
        background: var(--snice-color-border, rgb(226 232 240));
        border-radius: 999px;
        overflow: hidden;
      }

      .progress__fill {
        height: 100%;
        background: var(--snice-color-primary, rgb(99 102 241));
        border-radius: 999px;
        transition: width 400ms ease;
      }
    `;
  }
}
