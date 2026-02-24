import { element, property, render, styles, dispatch, on, query, html, css } from 'snice';
import type { Task, TaskPriority, TaskStatus } from '../types/task';

@element('task-modal')
class TaskModal extends HTMLElement {
  @property({ type: Boolean }) open = false;
  @property() mode: 'create' | 'edit' = 'create';
  @property({ type: Object }) task: Partial<Task> | null = null;

  @query('.modal-overlay') overlay?: HTMLElement;

  private formData = {
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    assignee: '',
    tags: '',
    dueDate: '',
  };

  @dispatch('task-submit')
  emitSubmit() {
    return {
      ...this.formData,
      tags: this.formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      assignee: this.formData.assignee || null,
      dueDate: this.formData.dueDate || null,
      id: this.task?.id,
    };
  }

  @dispatch('task-delete')
  emitDelete() {
    return { id: this.task?.id };
  }

  @dispatch('modal-close')
  emitClose() {
    return {};
  }

  @on('click', '.modal-overlay')
  handleOverlayClick(e: Event) {
    if (e.target === this.overlay) {
      this.emitClose();
    }
  }

  @on('keydown:Escape')
  handleEscape() {
    if (this.open) this.emitClose();
  }

  @on('submit', '.task-form')
  handleSubmit(e: Event) {
    e.preventDefault();
    this.emitSubmit();
  }

  private updateField(field: string, value: string) {
    (this.formData as any)[field] = value;
  }

  @render()
  renderContent() {
    if (this.task && this.mode === 'edit') {
      this.formData = {
        title: this.task.title || '',
        description: this.task.description || '',
        priority: this.task.priority || 'medium',
        status: this.task.status || 'todo',
        assignee: this.task.assignee || '',
        tags: (this.task.tags || []).join(', '),
        dueDate: this.task.dueDate || '',
      };
    }

    return html`
      <if ${this.open}>
        <div class="modal-overlay">
          <div class="modal">
            <div class="modal__header">
              <h2 class="modal__title">
                ${this.mode === 'create' ? 'New Task' : 'Edit Task'}
              </h2>
              <button class="modal__close" @click=${this.emitClose}>&times;</button>
            </div>
            <form class="task-form">
              <div class="form-group">
                <label class="label">Title</label>
                <input
                  class="input"
                  type="text"
                  .value=${this.formData.title}
                  @input=${(e: Event) => this.updateField('title', (e.target as HTMLInputElement).value)}
                  placeholder="Task title..."
                  required
                />
              </div>
              <div class="form-group">
                <label class="label">Description</label>
                <textarea
                  class="input textarea"
                  .value=${this.formData.description}
                  @input=${(e: Event) => this.updateField('description', (e.target as HTMLTextAreaElement).value)}
                  placeholder="Describe the task..."
                  rows="3"
                ></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="label">Priority</label>
                  <select
                    class="input"
                    .value=${this.formData.priority}
                    @change=${(e: Event) => this.updateField('priority', (e.target as HTMLSelectElement).value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="label">Status</label>
                  <select
                    class="input"
                    .value=${this.formData.status}
                    @change=${(e: Event) => this.updateField('status', (e.target as HTMLSelectElement).value)}
                  >
                    <option value="backlog">Backlog</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="label">Assignee</label>
                  <input
                    class="input"
                    type="text"
                    .value=${this.formData.assignee}
                    @input=${(e: Event) => this.updateField('assignee', (e.target as HTMLInputElement).value)}
                    placeholder="Name..."
                  />
                </div>
                <div class="form-group">
                  <label class="label">Due Date</label>
                  <input
                    class="input"
                    type="date"
                    .value=${this.formData.dueDate}
                    @input=${(e: Event) => this.updateField('dueDate', (e.target as HTMLInputElement).value)}
                  />
                </div>
              </div>
              <div class="form-group">
                <label class="label">Tags</label>
                <input
                  class="input"
                  type="text"
                  .value=${this.formData.tags}
                  @input=${(e: Event) => this.updateField('tags', (e.target as HTMLInputElement).value)}
                  placeholder="frontend, bug, design..."
                />
              </div>
              <div class="modal__actions">
                <if ${this.mode === 'edit'}>
                  <button type="button" class="btn btn--danger" @click=${this.emitDelete}>
                    Delete
                  </button>
                </if>
                <div class="modal__actions-right">
                  <button type="button" class="btn btn--secondary" @click=${this.emitClose}>
                    Cancel
                  </button>
                  <button type="submit" class="btn btn--primary">
                    ${this.mode === 'create' ? 'Create Task' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </if>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: contents;
      }

      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgb(0 0 0 / 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
        animation: fadeIn 150ms ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .modal {
        background: var(--snice-color-background-element, rgb(255 255 255));
        border-radius: 12px;
        box-shadow: var(--snice-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
        width: 100%;
        max-width: 32rem;
        max-height: 90vh;
        overflow-y: auto;
        animation: slideUp 200ms ease;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(1rem); }
        to { opacity: 1; transform: translateY(0); }
      }

      .modal__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem 0;
      }

      .modal__title {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--snice-color-text, rgb(15 23 42));
        margin: 0;
      }

      .modal__close {
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        font-size: 1.5rem;
        color: var(--snice-color-text-tertiary, rgb(148 163 184));
        cursor: pointer;
        border-radius: 6px;
        transition: all 150ms ease;
      }

      .modal__close:hover {
        background: var(--snice-color-background, rgb(248 250 252));
        color: var(--snice-color-text, rgb(15 23 42));
      }

      .task-form {
        padding: 1.25rem 1.5rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }

      .label {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--snice-color-text-secondary, rgb(100 116 139));
      }

      .input {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--snice-color-border, rgb(226 232 240));
        border-radius: 6px;
        font-size: 0.875rem;
        font-family: inherit;
        color: var(--snice-color-text, rgb(15 23 42));
        background: var(--snice-color-background-element, rgb(255 255 255));
        outline: none;
        transition: border-color 150ms ease;
      }

      .input:focus {
        border-color: var(--snice-color-primary, rgb(99 102 241));
        box-shadow: 0 0 0 3px rgb(99 102 241 / 0.1);
      }

      .textarea {
        resize: vertical;
        min-height: 4rem;
      }

      .modal__actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 0.5rem;
      }

      .modal__actions-right {
        display: flex;
        gap: 0.5rem;
        margin-left: auto;
      }

      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 150ms ease;
        font-family: inherit;
      }

      .btn--primary {
        background: var(--snice-color-primary, rgb(99 102 241));
        color: white;
      }

      .btn--primary:hover {
        background: rgb(79 70 229);
      }

      .btn--secondary {
        background: var(--snice-color-background, rgb(248 250 252));
        color: var(--snice-color-text-secondary, rgb(100 116 139));
        border: 1px solid var(--snice-color-border, rgb(226 232 240));
      }

      .btn--secondary:hover {
        background: var(--snice-color-border, rgb(226 232 240));
      }

      .btn--danger {
        background: transparent;
        color: var(--snice-color-danger, rgb(239 68 68));
        border: 1px solid var(--snice-color-danger, rgb(239 68 68));
      }

      .btn--danger:hover {
        background: var(--snice-color-danger, rgb(239 68 68));
        color: white;
      }
    `;
  }
}
