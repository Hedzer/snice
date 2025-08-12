export interface TodoItemElement extends HTMLElement {
  todoId: number;
  completed: boolean;
  setCompleted(completed: boolean): void;
}