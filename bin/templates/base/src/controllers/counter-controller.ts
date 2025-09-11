import { controller, on } from 'snice';
import type { ICounterButton } from '../components/counter-button.types';

@controller('counter')
export class CounterController {
  element!: ICounterButton;
  
  async attach() {
    // Load saved count from localStorage
    const saved = localStorage.getItem('counter-value');
    if (saved) {
      this.element.setCount(parseInt(saved));
    }
  }

  async detach() {
    // any clean up you need
  }
  
  @on('count-changed')
  handleCountChanged(e: CustomEvent) {
    localStorage.setItem('counter-value', String(e.detail.count));
  }
}