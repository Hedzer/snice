import { controller, on } from '../../../src';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

@controller('todo-controller')
export class TodoController {
  element: HTMLElement | null = null;
  todos: Todo[] = [];
  nextId = 1;
  
  async attach(element: HTMLElement) {
    this.element = element;
    await this.loadTodos();
    // The element IS the todo-list, so call setTodos directly on it
    if ((element as any).setTodos) {
      (element as any).setTodos(this.todos);
    }
  }
  
  async detach() {
    this.element = null;
  }
  
  private async loadTodos() {
    // Simulate server fetch
    try {
      // In real app, this would be: const response = await fetch('/api/todos');
      const saved = localStorage.getItem('todos');
      if (saved) {
        this.todos = JSON.parse(saved);
        this.nextId = Math.max(...this.todos.map(t => t.id), 0) + 1;
      }
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }
  
  private async saveTodos() {
    // Simulate server save
    try {
      // In real app, this would be: await fetch('/api/todos', { method: 'POST', body: JSON.stringify(this.todos) });
      localStorage.setItem('todos', JSON.stringify(this.todos));
    } catch (error) {
      console.error('Failed to save todos:', error);
    }
  }
  
  @on('add-todo')
  handleAddTodo(event: CustomEvent) {
    const text = event.detail.text;
    
    if (text) {
      const newTodo = {
        id: this.nextId++,
        text,
        completed: false
      };
      this.todos.push(newTodo);
      this.saveTodos();
      
      // Set all todos, not just add one
      if (this.element && (this.element as any).setTodos) {
        (this.element as any).setTodos(this.todos);
      }
    }
  }
  
  @on('todo-toggle')
  handleToggle(event: CustomEvent) {
    const todo = this.todos.find(t => t.id === event.detail.id);
    if (todo) {
      todo.completed = event.detail.completed;
      this.saveTodos();
      if (this.element && (this.element as any).updateTodo) {
        (this.element as any).updateTodo(event.detail.id, { completed: event.detail.completed });
      }
    }
  }
  
  @on('todo-delete')
  handleDelete(event: CustomEvent) {
    this.todos = this.todos.filter(t => t.id !== event.detail.id);
    this.saveTodos();
    if (this.element && (this.element as any).removeTodo) {
      (this.element as any).removeTodo(event.detail.id);
    }
  }
  
  @on('clear-completed')
  handleClearCompleted() {
    this.todos = this.todos.filter(t => !t.completed);
    this.saveTodos();
    if (this.element && (this.element as any).clearCompleted) {
      (this.element as any).clearCompleted();
    }
  }
  
}