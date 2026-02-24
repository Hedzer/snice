import { page } from '../router';
import { render, styles, property, context, on, ready, html, css } from 'snice';
import type { Placard, Context } from 'snice';
import type { AppContext } from '../router';
import { isAuthenticated } from '../guards/auth';
import type { Task, TaskStatus } from '../types/task';
import { COLUMNS } from '../types/task';
import * as taskService from '../services/tasks';

const placard: Placard = {
  name: 'board',
  title: 'Board',
  icon: '\u2630',
  show: true,
  order: 1,
};

@page({ tag: 'board-page', routes: ['/', '/board'], guards: [isAuthenticated], placard })
class BoardPage extends HTMLElement {
  @property({ type: Array }) tasks: Task[] = [];
  @property() searchQuery = '';
  @property({ type: Boolean }) loading = true;
  @property({ type: Boolean }) showModal = false;
  @property() modalMode: 'create' | 'edit' = 'create';
  @property({ type: Object }) editingTask: Task | null = null;

  private ctx?: Context;

  @context()
  handleContext(ctx: Context) {
    this.ctx = ctx;
  }

  @ready()
  async load() {
    try {
      this.tasks = await taskService.getTasks();
    } catch (e) {
      console.error('Failed to load tasks:', e);
    }
    this.loading = false;
  }

  @on('keydown:ctrl+n')
  openCreateModal(e: Event) {
    e.preventDefault();
    this.modalMode = 'create';
    this.editingTask = null;
    this.showModal = true;
  }

  private handleTaskClick = (e: CustomEvent) => {
    const task = this.tasks.find((t) => t.id === e.detail.id);
    if (task) {
      this.editingTask = { ...task };
      this.modalMode = 'edit';
      this.showModal = true;
    }
  };

  private handleTaskDrop = async (e: CustomEvent) => {
    const { taskId, status } = e.detail;
    const task = this.tasks.find((t) => t.id === taskId);
    if (task && task.status !== status) {
      await taskService.moveTask(taskId, status);
      this.tasks = this.tasks.map((t) =>
        t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t
      );
    }
  };

  private handleSubmit = async (e: CustomEvent) => {
    const data = e.detail;
    if (this.modalMode === 'create') {
      const newTask = await taskService.createTask(data);
      this.tasks = [...this.tasks, newTask];
    } else if (data.id) {
      await taskService.updateTask(data.id, data);
      this.tasks = this.tasks.map((t) =>
        t.id === data.id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      );
    }
    this.showModal = false;
  };

  private handleDelete = async (e: CustomEvent) => {
    if (e.detail.id) {
      await taskService.deleteTask(e.detail.id);
      this.tasks = this.tasks.filter((t) => t.id !== e.detail.id);
    }
    this.showModal = false;
  };

  private handleSearch = (e: Event) => {
    this.searchQuery = (e.target as HTMLInputElement).value;
  };

  @render()
  renderContent() {
    const filteredTasks = this.searchQuery
      ? taskService.searchTasks(this.tasks, this.searchQuery)
      : this.tasks;

    return html`
      <div class="board-page">
        <div class="toolbar">
          <div class="toolbar__left">
            <h1 class="toolbar__title">Project Board</h1>
            <span class="toolbar__hint">Ctrl+N to create</span>
          </div>
          <div class="toolbar__right">
            <div class="search-box">
              <input
                class="search-input"
                type="text"
                placeholder="Search tasks..."
                .value=${this.searchQuery}
                @input=${this.handleSearch}
                @keydown:Escape=${() => { this.searchQuery = ''; }}
              />
            </div>
            <button class="btn-create" @click=${() => {
              this.modalMode = 'create';
              this.editingTask = null;
              this.showModal = true;
            }}>
              + New Task
            </button>
          </div>
        </div>

        <stats-bar .tasks=${this.tasks}></stats-bar>

        <if ${this.loading}>
          <div class="loading">Loading tasks...</div>
        </if>
        <if ${!this.loading}>
          <div class="board" @task-click=${this.handleTaskClick} @task-dropped=${this.handleTaskDrop}>
            ${COLUMNS.map(
              (col) => html`
                <board-column
                  key=${col.id}
                  columnId=${col.id}
                  title=${col.title}
                  color=${col.color}
                  .tasks=${filteredTasks.filter((t) => t.status === col.id)}
                ></board-column>
              `
            )}
          </div>
        </if>

        <task-modal
          ?open=${this.showModal}
          mode=${this.modalMode}
          .task=${this.editingTask}
          @task-submit=${this.handleSubmit}
          @task-delete=${this.handleDelete}
          @modal-close=${() => { this.showModal = false; }}
        ></task-modal>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css`
      :host {
        display: block;
        height: 100%;
      }

      .board-page {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 1.25rem 1.5rem;
        gap: 1rem;
      }

      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
      }

      .toolbar__left {
        display: flex;
        align-items: baseline;
        gap: 0.75rem;
      }

      .toolbar__title {
        font-size: 1.375rem;
        font-weight: 800;
        color: var(--snice-color-text, rgb(15 23 42));
        margin: 0;
      }

      .toolbar__hint {
        font-size: 0.6875rem;
        color: var(--snice-color-text-tertiary, rgb(148 163 184));
        background: var(--snice-color-background-element, rgb(255 255 255));
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
        border: 1px solid var(--snice-color-border, rgb(226 232 240));
        font-family: monospace;
      }

      .toolbar__right {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .search-box {
        position: relative;
      }

      .search-input {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--snice-color-border, rgb(226 232 240));
        border-radius: 8px;
        font-size: 0.875rem;
        width: 14rem;
        outline: none;
        background: var(--snice-color-background-element, rgb(255 255 255));
        color: var(--snice-color-text, rgb(15 23 42));
        font-family: inherit;
        transition: border-color 150ms ease;
      }

      .search-input:focus {
        border-color: var(--snice-color-primary, rgb(99 102 241));
        box-shadow: 0 0 0 3px rgb(99 102 241 / 0.1);
      }

      .btn-create {
        padding: 0.5rem 1rem;
        background: var(--snice-color-primary, rgb(99 102 241));
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 150ms ease;
        font-family: inherit;
        white-space: nowrap;
      }

      .btn-create:hover {
        background: rgb(79 70 229);
      }

      .board {
        display: flex;
        gap: 0.75rem;
        flex: 1;
        overflow-x: auto;
        padding-bottom: 0.5rem;
      }

      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        font-size: 1rem;
        color: var(--snice-color-text-tertiary, rgb(148 163 184));
      }

      @media (max-width: 768px) {
        .board-page {
          padding: 1rem;
        }

        .toolbar {
          flex-direction: column;
          align-items: stretch;
          gap: 0.75rem;
        }

        .toolbar__right {
          flex-direction: column;
        }

        .search-input {
          width: 100%;
        }

        .btn-create {
          width: 100%;
        }
      }
    `;
  }
}
