import { element, property, ready, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-card.css?inline';
import type { CardVariant, CardSize, SniceCardElement } from './snice-card.types';

@element('snice-card')
export class SniceCard extends HTMLElement implements SniceCardElement {
  @property({  })
  variant: CardVariant = 'elevated';

  @property({  })
  size: CardSize = 'medium';

  @property({ type: Boolean,  })
  clickable = false;

  @property({ type: Boolean,  })
  selected = false;

  @property({ type: Boolean,  })
  disabled = false;

  @property({ type: Boolean,  })
  private hasHeader = false;

  @property({ type: Boolean,  })
  private hasFooter = false;

  @ready()
  onReady() {
    this.checkSlots();
  }

  @render()
  renderContent() {
    const role = this.clickable ? 'button' : 'article';
    const tabindex = this.clickable && !this.disabled ? '0' : '-1';

    return html`
      <div class="card"
           role="${role}"
           tabindex="${tabindex}"
           aria-selected="${this.selected}"
           aria-disabled="${this.disabled}"
           @click="${(e: MouseEvent) => this.handleClick(e)}"
           @keydown="${(e: KeyboardEvent) => this.handleKeydown(e)}">
        <slot name="image" class="card-image-slot"></slot>
        <div class="card-header" ?hidden="${!this.hasHeader}">
          <slot name="header" @slotchange="${() => this.checkSlots()}"></slot>
        </div>
        <div class="card-body">
          <slot></slot>
        </div>
        <div class="card-footer" ?hidden="${!this.hasFooter}">
          <slot name="footer" @slotchange="${() => this.checkSlots()}"></slot>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }

  private checkSlots() {
    const headerSlot = this.shadowRoot?.querySelector('slot[name="header"]') as HTMLSlotElement;
    const footerSlot = this.shadowRoot?.querySelector('slot[name="footer"]') as HTMLSlotElement;

    this.hasHeader = (headerSlot?.assignedNodes().length || 0) > 0;
    this.hasFooter = (footerSlot?.assignedNodes().length || 0) > 0;
  }

  private handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.matches('.card')) return;
    if (!this.clickable || this.disabled) return;

    if (this.clickable && !this.disabled) {
      this.selected = !this.selected;

      this.dispatchEvent(new CustomEvent('card-click', {
        bubbles: true,
        composed: true,
        detail: {
          selected: this.selected
        }
      }));
    }
  }

  private handleKeydown(event: KeyboardEvent) {
    if (!this.clickable || this.disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      this.selected = !this.selected;

      this.dispatchEvent(new CustomEvent('card-click', {
        bubbles: true,
        composed: true,
        detail: {
          selected: this.selected
        }
      }));
    }
  }
}