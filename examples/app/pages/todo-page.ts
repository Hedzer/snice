import { page } from '../router';
import { on, query } from '../../../src';
import '../components/todo-item';
import '../components/todo-list';
import '../controllers/todo-controller';

@page({ 
  tag: 'todo-page', 
  routes: ['/todos'],
  // Using default fade transition
})
export class TodoPage extends HTMLElement {
  @query('#todo-input')
  todoInput!: HTMLInputElement;
  
  @query('todo-list')
  todoList!: HTMLElement;
  
  
  html() {
    return /*html*/`
      <div class="todo-wrapper">
        <div class="todo-header">
          <h1>✨ Todo List</h1>
          <p class="todo-subtitle">Stay organized and productive</p>
        </div>
        
        <div class="todo-container">
          <div class="todo-input-section">
            <input 
              type="text" 
              id="todo-input" 
              placeholder="What needs to be done?"
              class="todo-input"
            >
            <button class="add-btn">
              <span class="plus-icon">+</span>
              Add Task
            </button>
          </div>
          
          <todo-list controller="todo-controller"></todo-list>
        </div>
      </div>
    `;
  }
  
  css() {
    return /*css*/`
      .todo-wrapper {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 3rem 1rem;
      }
      
      .todo-header {
        text-align: center;
        margin-bottom: 2rem;
      }
      
      .todo-header h1 {
        color: white;
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        letter-spacing: -0.5px;
      }
      
      .todo-subtitle {
        color: rgba(255, 255, 255, 0.95);
        font-size: 1.1rem;
        font-weight: 400;
      }
      
      .todo-container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        overflow: hidden;
      }
      
      .todo-input-section {
        padding: 2rem;
        background: white;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        gap: 0.75rem;
      }
      
      .todo-input {
        flex: 1;
        padding: 0.875rem 1rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 1rem;
        background: white;
        transition: all 0.2s ease;
        font-family: inherit;
        color: #333;
      }
      
      .todo-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
      
      .todo-input::placeholder {
        color: #9ca3af;
      }
      
      .add-btn {
        padding: 0.875rem 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
        white-space: nowrap;
        font-family: inherit;
        min-width: 120px;
        justify-content: center;
      }
      
      .add-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
      }
      
      .add-btn:active {
        transform: translateY(0);
      }
      
      .plus-icon {
        font-size: 1.25rem;
        font-weight: 400;
      }
      
    `;
  }
  
  @on('click', '.add-btn')
  addTodo() {
    const text = this.todoInput.value.trim();
    if (text) {
      const event = new CustomEvent('add-todo', {
        bubbles: true,
        detail: { text }
      });
      this.todoList?.dispatchEvent(event);
      this.todoInput.value = '';
    }
  }
  
  @on('keypress', '#todo-input')
  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.addTodo();
    }
  }
  
}