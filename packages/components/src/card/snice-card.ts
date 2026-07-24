import { element, property, ready, on, render, styles, dispatch, html, css as cssTag } from 'snice';
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
    // Check slots after a microtask to allow slot assignment
    queueMicrotask(() => this.checkSlots());
  }

  @render()
  render() {
    const role = this.clickable ? 'button' : 'article';
    const tabindex = this.clickable && !this.disabled ? '0' : '-1';
    // aria-selected is only valid on option/tab/row/gridcell/treeitem.
    // Use aria-pressed for button-as-toggle state; omit for article.
    const ariaPressed = this.clickable ? String(!!this.selected) : 'false';

    return html/*html*/`
      <div part="base" class="card"
           role="${role}"
           tabindex="${tabindex}"
           aria-pressed="${ariaPressed}"
           aria-disabled="${this.disabled}"
           @click="${(e: MouseEvent) => this.handleClick(e)}"
           @keydown="${(e: KeyboardEvent) => this.handleKeydown(e)}">
        <slot name="image" class="card-image-slot"></slot>
        <div part="header" class="card-header" ?hidden="${!this.hasHeader}">
          <slot name="header" @slotchange="${() => this.checkSlots()}"></slot>
        </div>
        <div part="body" class="card-body">
          <slot></slot>
        </div>
        <div part="footer" class="card-footer" ?hidden="${!this.hasFooter}">
          <slot name="footer" @slotchange="${() => this.checkSlots()}"></slot>
        </div>
      </div>
    `;
  }

  @styles()
  styles() {
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

      this.emitCardClick();
    }
  }

  /**
   * Update --card-mx/--card-my based on cursor position over the card so
   * CSS can tilt the card toward the cursor. Only runs for clickable cards
   * and only while hovered — plain cards get no events attached.
   */
  @on('pointermove', '.card')
  handlePointerMove(event: PointerEvent) {
    if (!this.clickable || this.disabled) return;
    const card = event.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const mx = (event.clientX - rect.left) / rect.width;
    const my = (event.clientY - rect.top) / rect.height;
    card.style.setProperty('--card-mx', mx.toFixed(3));
    card.style.setProperty('--card-my', my.toFixed(3));
  }

  @on('pointerleave', '.card')
  handlePointerLeave(event: PointerEvent) {
    const card = event.currentTarget as HTMLElement;
    // Ease back to center — the CSS transition on transform handles the lerp.
    card.style.setProperty('--card-mx', '0.5');
    card.style.setProperty('--card-my', '0.5');
  }

  private handleKeydown(event: KeyboardEvent) {
    if (!this.clickable || this.disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      this.selected = !this.selected;

      this.emitCardClick();
    }
  }

  @dispatch('card-click', { bubbles: true, composed: true })
  private emitCardClick() {
    return { selected: this.selected };
  }
}
