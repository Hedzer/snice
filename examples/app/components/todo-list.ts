import { element, on } from '../../../src';
import './todo-item';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

@element('todo-list')
export class TodoList extends HTMLElement {
  private todos: Todo[] = [];
  
  
  html() {
    return /*html*/`
      <div class="todo-items"></div>
      
      <div class="todo-footer">
        <span class="todo-count">
          <span class="count-number">0</span> items left
        </span>
        <button class="clear-completed">Clear completed</button>
      </div>
    `;
  }
  
  css() {
    return /*css*/`
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
      
      .clear-completed {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        font-size: 0.95rem;
        padding: 0.5rem 1rem;
        border-radius: 5px;
        transition: all 0.3s ease;
      }
      
      .clear-completed:hover {
        background: #f0f0f0;
        color: #667eea;
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
  
  setTodos(todos: Todo[]) {
    this.todos = todos;
    this.updateDisplay();
  }
  
  addTodo(todo: Todo) {
    this.todos.push(todo);
    this.updateDisplay();
  }
  
  removeTodo(id: number) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.updateDisplay();
  }
  
  updateTodo(id: number, updates: Partial<Todo>) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      Object.assign(todo, updates);
      this.updateDisplay();
    }
  }
  
  clearCompleted() {
    this.todos = this.todos.filter(t => !t.completed);
    this.updateDisplay();
  }
  
  @on('click', '.clear-completed')
  handleClearClick() {
    this.dispatchEvent(new CustomEvent('clear-completed', {
      bubbles: true
    }));
  }
  
  private updateDisplay() {
    // Query elements from shadow root
    const todoItemsContainer = this.shadowRoot?.querySelector('.todo-items') as HTMLElement;
    const countNumber = this.shadowRoot?.querySelector('.count-number') as HTMLElement;
    const todoCount = this.shadowRoot?.querySelector('.todo-count') as HTMLElement;
    
    // Update todo items
    if (todoItemsContainer) {
      const todoHtml = this.todos
        .map(todo => /*html*/`<todo-item 
          data-id="${todo.id}" 
          ${todo.completed ? 'data-completed="true"' : ''}
        >${this.escapeHtml(todo.text)}</todo-item>`)
        .join('');
      todoItemsContainer.innerHTML = todoHtml;
    }
    
    // Update count
    const count = this.todos.filter(t => !t.completed).length;
    if (countNumber) {
      countNumber.textContent = String(count);
    }
    if (todoCount) {
      const itemText = count === 1 ? 'item' : 'items';
      todoCount.innerHTML = /*html*/`<span class="count-number">${count}</span> ${itemText} left`;
    }
  }
  
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}