import { element, property, render, styles, dispatch, on, html, css } from 'snice';
import type { Task, TaskStatus } from '../types/task';

@element('board-column')
class BoardColumn extends HTMLElement {
  @property() columnId: TaskStatus = 'todo';
  @property() title = '';
  @property() color = '';
  @property({ type: Array }) tasks: Task[] = [];

  @dispatch('column-drop')
  emitDrop() {
    return { status: this.columnId };
  }

  @on('dragover')
  handleDragOver(e: DragEvent) {
    e.preventDefault();
    this.classList.add('drag-over');
  }

  @on('dragleave')
  handleDragLeave() {
    this.classList.remove('drag-over');
  }

  @on('drop')
  handleDrop(e: DragEvent) {
    e.preventDefault();
    this.classList.remove('drag-over');
    const taskId = e.dataTransfer?.getData('text/plain');
    if (taskId) {
      this.dispatchEvent(
        new CustomEvent('task-dropped', {
          bubbles: true,
          composed: true,
          detail: { taskId, status: this.columnId },
        })
      );
    }
  }

  @render()
  renderContent() {
    return html`
      <div class="column">
        <div class="column__header">
          <div class="column__title-row">
            <span class="column__dot" style="background: ${this.color}"></span>
            <h3 class="column__title">${this.title}</h3>
            <span class="column__count">${this.tasks.length}</span>
          </div>
        </div>
        <div class="column__body">
          ${this.tasks.map(
            (task) => html`
              <task-card
                key=${task.id}
                taskId=${task.id}
                title=${task.title}
                description=${task.description}
                priority=${task.priority}
                assignee=${task.assignee || ''}
                tags=${task.tags.join(',')}
                dueDate=${task.dueDate || ''}
                draggable="true"
                @dragstart=${(e: DragEvent) => {
                  e.dataTransfer?.setData('text/plain', task.id);
                }}
              ></task-card>
            `
          )}
          <if ${this.tasks.length === 0}>
            <div class="column__empty">No tasks</div>
          </if>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: block;
        min-width: 17rem;
        max-width: 22rem;
        flex: 1;
      }

      :host(.drag-over) .column {
        background: var(--snice-color-primary, rgb(99 102 241));
        background: color-mix(in srgb, var(--snice-color-primary, rgb(99 102 241)) 5%, transparent);
        border-color: var(--snice-color-primary, rgb(99 102 241));
      }

      .column {
        background: var(--snice-color-background, rgb(248 250 252));
        border: 2px dashed transparent;
        border-radius: 10px;
        padding: 0.75rem;
        height: 100%;
        display: flex;
        flex-direction: column;
        transition: all 200ms ease;
      }

      .column__header {
        margin-bottom: 0.75rem;
        flex-shrink: 0;
      }

      .column__title-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .column__dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .column__title {
        font-size: 0.8125rem;
        font-weight: 700;
        color: var(--snice-color-text, rgb(15 23 42));
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .column__count {
        background: var(--snice-color-border, rgb(226 232 240));
        color: var(--snice-color-text-secondary, rgb(100 116 139));
        font-size: 0.6875rem;
        font-weight: 700;
        padding: 0.0625rem 0.375rem;
        border-radius: 999px;
        min-width: 1.25rem;
        text-align: center;
      }

      .column__body {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        overflow-y: auto;
        min-height: 4rem;
      }

      .column__empty {
        text-align: center;
        padding: 2rem 1rem;
        color: var(--snice-color-text-tertiary, rgb(148 163 184));
        font-size: 0.8125rem;
        font-style: italic;
      }
    `;
  }
}
