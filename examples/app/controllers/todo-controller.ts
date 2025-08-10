import { controller, on } from '../../../src';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

@controller('todo-controller')
export class TodoController {
  element: HTMLElement | null = null;
  todoList: any = null;
  todos: Todo[] = [];
  nextId = 1;
  
  async attach(element: HTMLElement) {
    this.element = element;
    this.todoList = element.querySelector('todo-list');
    await this.loadTodos();
    if (this.todoList) {
      this.todoList.setTodos(this.todos);
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
      this.todos.push({
        id: this.nextId++,
        text,
        completed: false
      });
      this.saveTodos();
      if (this.todoList) {
        this.todoList.addTodo(this.todos[this.todos.length - 1]);
      }
    }
  }
  
  @on('todo-toggle')
  handleToggle(event: CustomEvent) {
    const todo = this.todos.find(t => t.id === event.detail.id);
    if (todo) {
      todo.completed = event.detail.completed;
      this.saveTodos();
      if (this.todoList) {
        this.todoList.updateTodo(event.detail.id, { completed: event.detail.completed });
      }
    }
  }
  
  @on('todo-delete')
  handleDelete(event: CustomEvent) {
    this.todos = this.todos.filter(t => t.id !== event.detail.id);
    this.saveTodos();
    if (this.todoList) {
      this.todoList.removeTodo(event.detail.id);
    }
  }
  
  @on('clear-completed')
  handleClearCompleted() {
    this.todos = this.todos.filter(t => !t.completed);
    this.saveTodos();
    if (this.todoList) {
      this.todoList.clearCompleted();
    }
  }
  
}