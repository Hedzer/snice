import { controller, on } from '../../../src';
import type { Todo } from '../types/todo';
import type { TodoListElement } from '../types/todo-list-element';

@controller('todo-controller')
export class TodoController {
  element!: TodoListElement;
  todos: Todo[] = [];
  nextId = 1;
  
  async attach(element: HTMLElement) {
    this.element = element as TodoListElement;
    await this.loadTodos();
    // Call the element's method to set todos
    this.element.setTodos(this.todos);
  }
  
  async detach() {
    // Nothing to manually clean up
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
      const newTodo: Todo = {
        id: this.nextId++,
        text,
        completed: false
      };
      this.todos.push(newTodo);
      this.saveTodos();
      
      // Call element's method to add the todo
      if (this.element) {
        this.element.addTodo(newTodo);
        this.element.updateCount(this.todos);
      }
    }
  }
  
  @on('todo-toggle')
  handleToggle(event: CustomEvent) {
    const todo = this.todos.find(t => t.id === event.detail.id);
    if (todo) {
      todo.completed = event.detail.completed;
      this.saveTodos();
      
      // Call element's method to update the todo
      if (this.element) {
        this.element.updateTodo(event.detail.id, { completed: event.detail.completed });
        this.element.updateCount(this.todos);
      }
    }
  }
  
  @on('todo-delete')
  handleDelete(event: CustomEvent) {
    console.log('Delete event received:', event.detail);
    this.todos = this.todos.filter(t => t.id !== event.detail.id);
    this.saveTodos();
    
    // Call element's method to remove the todo
    if (this.element) {
      this.element.removeTodo(event.detail.id);
      this.element.updateCount(this.todos);
    }
  }
  
  @on('clear-completed')
  handleClearCompleted() {
    this.todos = this.todos.filter(t => !t.completed);
    this.saveTodos();
    
    // Call element's method to clear completed
    if (this.element) {
      this.element.clearCompleted();
      this.element.updateCount(this.todos);
    }
  }
}