import { element, property } from '../../src/index';

@element('snice-rating')
export class SniceRating extends HTMLElement {
  @property({ type: Number })
  value = 0;
  
  @property({ type: Number })
  max = 5;
  
  @property()
  symbol = '★';
  
  @property()
  emptySymbol = '☆';
  
  @property()
  color = '#facc15';

  html() {
    const filled = Math.round(this.value);
    const empty = this.max - filled;
    
    return `
      <span class="filled">${this.symbol.repeat(filled)}</span><span class="empty">${this.emptySymbol.repeat(empty)}</span>
    `;
  }

  css() {
    return `
      :host {
        display: inline-block;
        font-size: 1.2em;
      }
      
      .filled {
        color: ${this.color};
      }
      
      .empty {
        color: #d1d5db;
      }
    `;
  }
}