export interface ICounterButton extends HTMLElement {
  count: number;
  setCount(count: number): void;
  increment(): void;
  decrement(): void;
  reset(): void;
}