import { element, property, query, watch, ready, observe, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-accordion-item.css?inline';
import type { SniceAccordionItemElement } from './snice-accordion.types';

@element('snice-accordion-item')
export class SniceAccordionItem extends HTMLElement implements SniceAccordionItemElement {
  @property({ attribute: 'item-id',  })
  itemId: string = '';

  @property({ type: Boolean,  })
  open = false;

  @property({ type: Boolean,  })
  disabled = false;

  @query('.accordion-item__content')
  contentElement?: HTMLElement;

  @query('.accordion-item__content-inner')
  contentInner?: HTMLElement;

  private isAnimating = false;

  @render()
  render() {
    return html/*html*/`
      <button
        part="header"
        class="accordion-item__header"
        aria-expanded="${this.open}"
        aria-controls="content-${this.itemId}"
        ?disabled="${this.disabled}"
        @click="${(e: Event) => this.handleClick(e)}"
        @keydown="${(e: KeyboardEvent) => this.handleKeydown(e)}"
      >
        <span part="title" class="accordion-item__title">
          <slot name="header"></slot>
        </span>
        <svg part="icon" class="accordion-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      <div
        part="content"
        class="accordion-item__content"
        id="content-${this.itemId}"
        role="region"
        aria-labelledby="header-${this.itemId}"
      >
        <div part="content-inner" class="accordion-item__content-inner">
          <slot></slot>
        </div>
      </div>
    `;
  }

  @styles()
  styles() {
    return cssTag`${cssContent}`;
  }

  private handleClick(e: Event) {
    e.preventDefault();
    if (!this.disabled) {
      this.toggle();
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!this.disabled) {
        this.toggle();
      }
    }
  }

  @ready()
  init() {
    this.updateContentHeight();
    
    // Set initial state
    if (this.open) {
      this.expand(false);
    }
  }

  @observe('mutation:childList', { subtree: true, throttle: 100 })
  onContentMutation() {
    // Only update height if we're open and not animating
    if (this.open && !this.isAnimating) {
      this.updateContentHeight();
    }
  }

  @watch('open')
  handleOpenChange() {
    if (this.open) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  toggle() {
    if (this.isAnimating || this.disabled) return;
    
    if (this.open) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  expand(animate = true) {
    if (this.open || this.disabled) return;
    
    this.open = true;
    this.updateAriaExpanded(true);
    
    if (this.contentElement) {
      if (animate) {
        this.animateExpand();
      } else {
        // Instant expand
        this.contentElement.style.maxHeight = 'none';
      }
    }
    
    this.dispatchToggleEvent(true);
  }

  collapse(animate = true) {
    if (!this.open) return;
    
    this.open = false;
    this.updateAriaExpanded(false);
    
    if (this.contentElement) {
      if (animate) {
        this.animateCollapse();
      } else {
        // Instant collapse
        this.contentElement.style.maxHeight = '0';
      }
    }
    
    this.dispatchToggleEvent(false);
  }

  private animateExpand() {
    if (!this.contentElement || !this.contentInner) return;
    
    this.isAnimating = true;
    
    // Use requestAnimationFrame for smoother animation
    requestAnimationFrame(() => {
      if (!this.contentElement || !this.contentInner) return;
      
      // Get the actual height
      const height = this.contentInner.scrollHeight;
      
      // Set the max-height for animation
      this.contentElement.style.maxHeight = `${height}px`;
      
      // After animation completes, remove the max-height to allow dynamic content
      this.contentElement.addEventListener('transitionend', () => {
        if (this.contentElement && this.open) {
          this.contentElement.style.maxHeight = 'none';
        }
        this.isAnimating = false;
      }, { once: true });
    });
  }

  private animateCollapse() {
    if (!this.contentElement) return;
    
    this.isAnimating = true;
    
    // Use requestAnimationFrame for smoother animation
    requestAnimationFrame(() => {
      if (!this.contentElement) return;
      
      // First set the current height explicitly
      const height = this.contentElement.scrollHeight;
      this.contentElement.style.maxHeight = `${height}px`;
      
      // Force reflow
      void this.contentElement.offsetHeight;
      
      // Then animate to 0
      requestAnimationFrame(() => {
        if (!this.contentElement) return;
        this.contentElement.style.maxHeight = '0';
        
        this.contentElement.addEventListener('transitionend', () => {
          this.isAnimating = false;
        }, { once: true });
      });
    });
  }

  private updateContentHeight() {
    if (!this.contentElement || !this.contentInner || this.isAnimating) return;
    
    // Use requestAnimationFrame to batch DOM reads/writes
    requestAnimationFrame(() => {
      if (!this.contentInner) return;
      
      // Set CSS variable for max-height based on content
      const height = this.contentInner.scrollHeight;
      this.style.setProperty('--max-height', `${height}px`);
    });
  }

  private updateAriaExpanded(expanded: boolean) {
    const header = this.shadowRoot?.querySelector('.accordion-item__header');
    header?.setAttribute('aria-expanded', String(expanded));
  }

  private dispatchToggleEvent(open: boolean) {
    this.dispatchEvent(new CustomEvent('accordion-item-toggle', {
      bubbles: true,
      composed: true,
      detail: { itemId: this.itemId, open }
    }));
  }
}