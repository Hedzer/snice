import { element, property, query, on, dispatch } from 'snice';
import type { ICounterButton } from '../types/counter-button';

@element('counter-button')
export class CounterButton extends HTMLElement implements ICounterButton {
  @property({ type: Number })
  count = 0;

  @query('.count')
  countDisplay?: HTMLElement;

  html() {
    return /*html*/`
      <div class="counter">
        <button class="btn minus">-</button>
        <span class="count">${this.count}</span>
        <button class="btn plus">+</button>
      </div>
    `;
  }

  css() {
    return /*css*/`
      .counter {
        display: inline-flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .count {
        font-size: 1.5rem;
        font-weight: bold;
        min-width: 3rem;
        text-align: center;
      }
      
      .btn {
        width: 2rem;
        height: 2rem;
        border: 2px solid var(--primary-color);
        background: white;
        color: var(--primary-color);
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.2rem;
      }
      
      .btn:hover {
        background: var(--primary-color);
        color: white;
      }
    `;
  }

  // Imperative methods that controller can call
  setCount(value: number) {
    this.count = value;
    this.updateDisplay();
  }

  @dispatch('count-changed')
  increment() {
    this.count++;
    this.updateDisplay();
    return { count: this.count };
  }

  @dispatch('count-changed')
  decrement() {
    this.count--;
    this.updateDisplay();
    return { count: this.count };
  }

  @dispatch('count-changed')
  reset() {
    this.count = 0;
    this.updateDisplay();
    return { count: this.count };
  }

  private updateDisplay() {
    if (this.countDisplay) {
      this.countDisplay.textContent = String(this.count);
    }
  }

  @on('click', '.plus')
  handlePlus() {
    this.increment();
  }

  @on('click', '.minus')
  handleMinus() {
    this.decrement();
  }
}