import { element, property, on, dispatch, ready } from '../../src/index';
import css from './snice-card.css?inline';
import type { CardVariant, CardSize, SniceCardElement } from './snice-card.types';

@element('snice-card')
export class SniceCard extends HTMLElement implements SniceCardElement {
  @property({ reflect: true })
  variant: CardVariant = 'elevated';

  @property({ reflect: true })
  size: CardSize = 'medium';

  @property({ type: Boolean, reflect: true })
  clickable = false;

  @property({ type: Boolean, reflect: true })
  selected = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  private hasHeader = false;
  private hasFooter = false;

  html() {
    return /*html*/`
      <div class="card" 
           role="${this.clickable ? 'button' : 'article'}"
           tabindex="${this.clickable && !this.disabled ? '0' : '-1'}"
           aria-selected="${this.selected}"
           aria-disabled="${this.disabled}">
        <slot name="image" class="card-image-slot"></slot>
        <div class="card-header" ${this.hasHeader ? '' : 'hidden'}>
          <slot name="header"></slot>
        </div>
        <div class="card-body">
          <slot></slot>
        </div>
        <div class="card-footer" ${this.hasFooter ? '' : 'hidden'}>
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }

  css() {
    return css;
  }

  @ready()
  init() {
    // Check for slotted content
    this.setupSlotListeners();
    this.checkSlots();
  }

  private setupSlotListeners() {
    const slots = this.shadowRoot?.querySelectorAll('slot');
    slots?.forEach(slot => {
      slot.addEventListener('slotchange', () => this.checkSlots());
    });
  }

  private checkSlots() {
    const headerSlot = this.shadowRoot?.querySelector('slot[name="header"]') as HTMLSlotElement;
    const footerSlot = this.shadowRoot?.querySelector('slot[name="footer"]') as HTMLSlotElement;
    
    this.hasHeader = (headerSlot?.assignedNodes().length || 0) > 0;
    this.hasFooter = (footerSlot?.assignedNodes().length || 0) > 0;
    
    // Update visibility
    const header = this.shadowRoot?.querySelector('.card-header') as HTMLElement;
    const footer = this.shadowRoot?.querySelector('.card-footer') as HTMLElement;
    
    if (header) header.toggleAttribute('hidden', !this.hasHeader);
    if (footer) footer.toggleAttribute('hidden', !this.hasFooter);
  }

  @on('click', '.card')
  @dispatch('card-click')
  handleClick(event: MouseEvent) {
    if (!this.clickable || this.disabled) return;
    
    if (this.clickable && !this.disabled) {
      this.selected = !this.selected;
    }
    
    return {
      selected: this.selected
    };
  }

  @on('keydown', '.card')
  handleKeydown(event: KeyboardEvent) {
    if (!this.clickable || this.disabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleClick(new MouseEvent('click'));
    }
  }
}