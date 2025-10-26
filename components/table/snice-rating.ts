import { element, property, render, styles, html, css } from 'snice';

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

  @render()
  render() {
    const filled = Math.round(this.value);
    const empty = this.max - filled;

    return html/*html*/`
      <span class="filled">${this.symbol.repeat(filled)}</span><span class="empty">${this.emptySymbol.repeat(empty)}</span>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`
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