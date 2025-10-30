import { element, on, dispatch, query, queryAll, render, styles, html, css } from 'snice';
import { TodoItem } from './todo-item';
import type { Todo } from '../types/todo';
import type { TodoListElement } from '../types/todo-list-element';
import type { TodoItemElement } from '../types/todo-item-element';

@element('todo-list')
export class TodoList extends HTMLElement implements TodoListElement {
  @query('.todo-items')
  todoItemsContainer?: HTMLElement;

  @query('.count-number')
  countNumber?: HTMLElement;

  @query('.todo-count')
  todoCount?: HTMLElement;

  @query('.clear-button')
  clearButton?: HTMLButtonElement;

  @queryAll('todo-item[completed="true"]', { light: true })
  completedItems?: NodeListOf<TodoItemElement>;

  @render()
  renderContent() {
    return html/*html*/`
      <div class="todo-items">
        <slot></slot>
      </div>

      <div class="todo-footer">
        <span class="todo-count">
          <span class="count-number">0</span> items left
        </span>
        <button class="clear-button">Clear completed</button>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`
      .todo-items {
        min-height: 300px;
        max-height: 500px;
        overflow-y: auto;
        background: #fafafa;
      }
      
      .todo-items:empty::after {
        content: "No tasks yet. Add one above!";
        display: block;
        text-align: center;
        padding: 3rem;
        color: #999;
        font-size: 1.1rem;
      }
      
      .todo-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 2rem;
        background: white;
        border-top: 2px solid #f0f0f0;
      }
      
      .todo-count {
        color: #666;
        font-weight: 500;
      }
      
      .count-number {
        font-weight: 700;
        color: #667eea;
        font-size: 1.2rem;
      }
      
      .clear-button {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        font-size: 0.95rem;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        transition: all 0.3s ease;
      }
      
      .clear-button:hover {
        background: #f0f0f0;
        color: #667eea;
      }
      
      .clear-button:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      /* Custom scrollbar */
      .todo-items::-webkit-scrollbar {
        width: 8px;
      }
      
      .todo-items::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      
      .todo-items::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
      }
      
      .todo-items::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `;
  }
  
  @on('click', '.clear-button')
  @dispatch('clear-completed')
  handleClearClick() {
    return {};
  }
  
  setTodos(todos: Todo[]) {
    // Clear existing todo items
    this.innerHTML = '';
    
    // Create todo-item elements
    todos.forEach(todo => {
      const todoItem = new TodoItem();
      todoItem.todoId = todo.id;
      todoItem.completed = todo.completed;
      todoItem.textContent = todo.text;
      this.appendChild(todoItem);
    });
    
    this.updateCount(todos);
  }
  
  addTodo(todo: Todo) {
    const todoItem = new TodoItem();
    todoItem.todoId = todo.id;
    todoItem.completed = todo.completed;
    todoItem.textContent = todo.text;
    this.appendChild(todoItem);
  }
  
  removeTodo(id: number) {
    const todoItem = this.querySelector(`todo-item[todo-id="${id}"]`);
    if (todoItem) {
      todoItem.remove();
    }
  }
  
  updateTodo(id: number, updates: { completed?: boolean }) {
    const todoItem = this.querySelector(`todo-item[todo-id="${id}"]`) as TodoItemElement | null;
    if (todoItem && updates.completed !== undefined) {
      todoItem.setCompleted(updates.completed);
    }
  }
  
  clearCompleted() {
    // Using @queryAll to get all completed items
    if (this.completedItems) {
      this.completedItems.forEach(item => item.remove());
    }
  }
  
  updateCount(todos: Todo[]) {
    const activeCount = todos.filter(t => !t.completed).length;
    const hasCompleted = todos.some(t => t.completed);
    
    if (this.countNumber) {
      this.countNumber.textContent = String(activeCount);
    }
    if (this.todoCount) {
      const itemText = activeCount === 1 ? 'item' : 'items';
      this.todoCount.innerHTML = /*html*/`<span class="count-number">${activeCount}</span> ${itemText} left`;
    }
    if (this.clearButton) {
      this.clearButton.disabled = !hasCompleted;
    }
  }
  
  setCount(count: number) {
    if (this.countNumber) {
      this.countNumber.textContent = String(count);
    }
    if (this.todoCount) {
      const itemText = count === 1 ? 'item' : 'items';
      this.todoCount.innerHTML = /*html*/`<span class="count-number">${count}</span> ${itemText} left`;
    }
  }
  
  setClearButtonState(hasCompleted: boolean) {
    if (this.clearButton) {
      this.clearButton.disabled = !hasCompleted;
    }
  }
}