import { element, property, on, dispatch, query } from '../../../src';
import type { TodoItemElement } from '../types/todo-item-element';

@element('todo-item')
export class TodoItem extends HTMLElement implements TodoItemElement {
  @property({ type: Number, reflect: true, attribute: 'todo-id' })
  todoId = 0;
  
  @property({ type: Boolean, reflect: true, attribute: 'completed' })
  completed = false;
  
  @query('.todo-checkbox')
  checkbox?: HTMLInputElement;
  
  @query('.todo-item')
  todoItem?: HTMLElement;
  
  setCompleted(completed: boolean) {
    this.completed = completed;
    if (this.checkbox) {
      this.checkbox.checked = completed;
    }
    if (this.todoItem) {
      this.todoItem.classList.toggle('completed', completed);
    }
  }
  
  html() {
    return /*html*/`
      <div class="todo-item ${this.completed ? 'completed' : ''}">
        <label class="checkbox-container">
          <input 
            type="checkbox" 
            class="todo-checkbox"
            ${this.completed ? 'checked' : ''}
          >
          <span class="checkmark"></span>
        </label>
        <span class="todo-text"><slot></slot></span>
        <button class="todo-delete" aria-label="Delete task">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
  }
  
  css() {
    return /*css*/`
      .todo-item {
        display: flex;
        align-items: center;
        padding: 1.25rem 2rem;
        background: white;
        border-bottom: 1px solid #f0f0f0;
        transition: background 0.3s ease;
        position: relative;
      }
      
      .todo-item:hover {
        background: #f8f9fa;
      }
      
      .todo-item.completed {
        opacity: 0.6;
      }
      
      .todo-item.completed .todo-text {
        text-decoration: line-through;
        color: #999;
      }
      
      /* Custom checkbox */
      .checkbox-container {
        display: inline-block;
        position: relative;
        padding-left: 30px;
        margin-right: 1rem;
        cursor: pointer;
        user-select: none;
      }
      
      .todo-checkbox {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0;
        width: 0;
      }
      
      .checkmark {
        position: absolute;
        top: -10px;
        left: 0;
        height: 24px;
        width: 24px;
        background-color: #f0f0f0;
        border-radius: 6px;
        transition: all 0.3s ease;
      }
      
      .checkbox-container:hover .checkmark {
        background-color: #e0e0e0;
      }
      
      .todo-checkbox:checked ~ .checkmark {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      .checkmark:after {
        content: "";
        position: absolute;
        display: none;
      }
      
      .todo-checkbox:checked ~ .checkmark:after {
        display: block;
      }
      
      .checkmark:after {
        left: 8px;
        top: 4px;
        width: 6px;
        height: 12px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
      
      .todo-text {
        flex: 1;
        font-size: 1.05rem;
        color: #333;
        transition: all 0.3s ease;
      }
      
      .todo-delete {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        padding: 0.5rem;
        opacity: 0;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 5px;
      }
      
      .todo-item:hover .todo-delete {
        opacity: 1;
      }
      
      .todo-delete:hover {
        background: #fee;
        color: #e53e3e;
        transform: scale(1.1);
      }
    `;
  }
  
  @on('change', '.todo-checkbox')
  @dispatch('todo-toggle')
  handleToggle(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    // Update visual state
    if (this.todoItem) {
      this.todoItem.classList.toggle('completed', checkbox.checked);
    }
    return { id: this.todoId, completed: checkbox.checked };
  }
  
  @on('click', '.todo-delete')
  @dispatch('todo-delete')
  handleDelete() {
    console.log('Delete button clicked, dispatching with id:', this.todoId);
    return { id: this.todoId };
  }
}