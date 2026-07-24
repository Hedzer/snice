import { element, property, query, watch, ready, observe, dispatch, render, styles, html, css as cssTag } from 'snice';
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

  @query('.accordion-item__header')
  headerElement?: HTMLElement;

  @query('.accordion-item__content')
  contentElement?: HTMLElement;

  @query('.accordion-item__content-inner')
  contentInner?: HTMLElement;

  private suppressAnimation = false;

  // Incremented whenever a new open/close transition starts so queued
  // rAF callbacks from an interrupted animation can detect they are stale.
  private animationToken = 0;

  @render()
  render() {
    return html/*html*/`
      <button
        part="header"
        id="header-${this.itemId}"
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
        @transitionend="${(e: TransitionEvent) => this.handleContentTransitionEnd(e)}"
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
    this.toggle();
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.toggle();
    }
  }

  @ready()
  init() {
    this.updateContentHeight();

    // Apply the initial state directly: no animation, no toggle event.
    if (this.open && this.contentElement) {
      this.contentElement.style.maxHeight = 'none';
    }
  }

  @observe('mutation:childList', { subtree: true, throttle: 100 })
  onContentMutation() {
    if (this.open) {
      this.updateContentHeight();
    }
  }

  // Every state change — user click, method call, property assignment, or
  // attribute toggle — funnels through this watcher, so all of them animate
  // and dispatch consistently.
  @watch('open')
  handleOpenChange(oldValue?: boolean, newValue?: boolean) {
    if (oldValue === undefined) return; // initial value; @ready applies it

    if (Boolean(oldValue) === Boolean(newValue)) return;

    const animate = !this.suppressAnimation;
    this.suppressAnimation = false;
    this.applyOpenState(Boolean(newValue), animate);
  }

  toggle() {
    if (this.disabled) return;

    this.open = !this.open;
  }

  expand(animate = true) {
    if (this.open || this.disabled) return;

    this.suppressAnimation = !animate;
    this.open = true;
  }

  collapse(animate = true) {
    if (!this.open) return;

    this.suppressAnimation = !animate;
    this.open = false;
  }

  focusHeader() {
    this.headerElement?.focus();
  }

  private applyOpenState(open: boolean, animate: boolean) {
    this.updateAriaExpanded(open);

    if (this.contentElement) {
      if (animate) {
        open ? this.animateExpand() : this.animateCollapse();
      } else {
        this.animationToken++;
        this.contentElement.style.maxHeight = open ? 'none' : '0';
      }
    }

    this.emitToggle();
  }

  private animateExpand() {
    if (!this.contentElement || !this.contentInner) return;

    const token = ++this.animationToken;

    requestAnimationFrame(() => {
      if (token !== this.animationToken || !this.contentElement || !this.contentInner) return;

      const height = this.contentInner.scrollHeight;
      this.contentElement.style.maxHeight = `${height}px`;
    });
  }

  private animateCollapse() {
    if (!this.contentElement) return;

    const token = ++this.animationToken;

    // Pin the currently rendered height so the transition has a concrete
    // start value even when interrupting an in-flight expand.
    const currentHeight = this.contentElement.getBoundingClientRect().height;
    this.contentElement.style.maxHeight = `${currentHeight}px`;

    // Force reflow so the pinned height is committed before animating to 0
    void this.contentElement.offsetHeight;

    requestAnimationFrame(() => {
      if (token !== this.animationToken || !this.contentElement) return;

      this.contentElement.style.maxHeight = '0';
    });
  }

  private handleContentTransitionEnd(e: TransitionEvent) {
    if (e.propertyName !== 'max-height' || e.target !== this.contentElement) return;

    // Once fully expanded, release the pinned height so the content can
    // grow or shrink freely (window resizes, async content, etc).
    if (this.open && this.contentElement) {
      this.contentElement.style.maxHeight = 'none';
    }
  }

  private updateContentHeight() {
    if (!this.contentElement || !this.contentInner) return;

    // Use requestAnimationFrame to batch DOM reads/writes
    requestAnimationFrame(() => {
      if (!this.contentInner) return;

      // Set CSS variable for max-height based on content
      const height = this.contentInner.scrollHeight;
      this.style.setProperty('--max-height', `${height}px`);
    });
  }

  private updateAriaExpanded(expanded: boolean) {
    this.headerElement?.setAttribute('aria-expanded', String(expanded));
  }

  @dispatch('accordion-item-toggle', { bubbles: true, composed: true })
  private emitToggle() {
    return { itemId: this.itemId, open: this.open };
  }
}
