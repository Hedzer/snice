import type { Todo } from './todo';

export interface TodoListElement extends HTMLElement {
  setTodos(todos: Todo[]): void;
  addTodo(todo: Todo): void;
  removeTodo(id: number): void;
  updateTodo(id: number, updates: { completed?: boolean }): void;
  clearCompleted(): void;
  updateCount(todos: Todo[]): void;
  setCount(count: number): void;
  setClearButtonState(hasCompleted: boolean): void;
}