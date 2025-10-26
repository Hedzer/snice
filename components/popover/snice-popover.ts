import { element, property, render, styles, dispatch, ready, html, css } from 'snice';
import type { SnicePopoverElement, PopoverPlacement, PopoverTrigger } from './snice-popover.types';
import cssContent from './snice-popover.css?inline';

@element('snice-popover')
export class SnicePopover extends HTMLElement implements SnicePopoverElement {
  @property({ type: Boolean })
  open = false;

  @property({ attribute: 'placement' })
  placement: PopoverPlacement = 'top';

  @property({ attribute: 'trigger' })
  trigger: PopoverTrigger = 'click';

  @property({ type: Number })
  distance = 8;

  @property({ type: Boolean, attribute: 'show-arrow' })
  showArrow = true;

  @property({ type: Boolean, attribute: 'close-on-click-outside' })
  closeOnClickOutside = true;

  @property({ type: Boolean, attribute: 'close-on-escape' })
  closeOnEscape = true;

  @property({ type: Number, attribute: 'hover-delay' })
  hoverDelay = 200;

  @property({ attribute: 'target-selector' })
  targetSelector = '';

  private targetElement: HTMLElement | null = null;
  private hoverTimeout: number | null = null;

  @dispatch('@snice/popover-show', { bubbles: true, composed: true })
  private dispatchShow() {
    return { popover: this };
  }

  @dispatch('@snice/popover-hide', { bubbles: true, composed: true })
  private dispatchHide() {
    return { popover: this };
  }

  @styles()
  private styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  initialize() {
    this.setupTarget();
  }

  private setupTarget() {
    // Find target element
    if (this.targetSelector) {
      this.targetElement = document.querySelector(this.targetSelector);
    } else {
      this.targetElement = this.previousElementSibling as HTMLElement;
    }

    if (!this.targetElement) {
      console.warn('snice-popover: No target element found');
      return;
    }

    // Setup event listeners based on trigger
    this.removeTargetListeners();

    if (this.trigger === 'click') {
      this.targetElement.addEventListener('click', this.handleTargetClick);
    } else if (this.trigger === 'hover') {
      this.targetElement.addEventListener('mouseenter', this.handleTargetMouseEnter);
      this.targetElement.addEventListener('mouseleave', this.handleTargetMouseLeave);
    } else if (this.trigger === 'focus') {
      this.targetElement.addEventListener('focus', this.handleTargetFocus);
      this.targetElement.addEventListener('blur', this.handleTargetBlur);
    }
  }

  private removeTargetListeners() {
    if (!this.targetElement) return;

    this.targetElement.removeEventListener('click', this.handleTargetClick);
    this.targetElement.removeEventListener('mouseenter', this.handleTargetMouseEnter);
    this.targetElement.removeEventListener('mouseleave', this.handleTargetMouseLeave);
    this.targetElement.removeEventListener('focus', this.handleTargetFocus);
    this.targetElement.removeEventListener('blur', this.handleTargetBlur);
  }

  private handleTargetClick = () => {
    this.toggle();
  };

  private handleTargetMouseEnter = () => {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    this.hoverTimeout = window.setTimeout(() => {
      this.show();
    }, this.hoverDelay);
  };

  private handleTargetMouseLeave = () => {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    this.hoverTimeout = window.setTimeout(() => {
      this.hide();
    }, this.hoverDelay);
  };

  private handleTargetFocus = () => {
    this.show();
  };

  private handleTargetBlur = () => {
    this.hide();
  };

  show(): void {
    if (this.open) return;
    this.open = true;
    this.dispatchShow();
    this.updatePosition();
  }

  hide(): void {
    if (!this.open) return;
    this.open = false;
    this.dispatchHide();
  }

  toggle(): void {
    if (this.open) {
      this.hide();
    } else {
      this.show();
    }
  }

  updatePosition(): void {
    if (!this.open || !this.targetElement) return;

    requestAnimationFrame(() => {
      const popoverEl = this.shadowRoot?.querySelector('.popover') as HTMLElement;
      if (!popoverEl || !this.targetElement) return;

      const targetRect = this.targetElement.getBoundingClientRect();
      const popoverRect = popoverEl.getBoundingClientRect();

      let top = 0;
      let left = 0;

      // Calculate position based on placement
      switch (this.placement) {
        case 'top':
          top = targetRect.top - popoverRect.height - this.distance;
          left = targetRect.left + (targetRect.width - popoverRect.width) / 2;
          break;
        case 'top-start':
          top = targetRect.top - popoverRect.height - this.distance;
          left = targetRect.left;
          break;
        case 'top-end':
          top = targetRect.top - popoverRect.height - this.distance;
          left = targetRect.right - popoverRect.width;
          break;
        case 'bottom':
          top = targetRect.bottom + this.distance;
          left = targetRect.left + (targetRect.width - popoverRect.width) / 2;
          break;
        case 'bottom-start':
          top = targetRect.bottom + this.distance;
          left = targetRect.left;
          break;
        case 'bottom-end':
          top = targetRect.bottom + this.distance;
          left = targetRect.right - popoverRect.width;
          break;
        case 'left':
          top = targetRect.top + (targetRect.height - popoverRect.height) / 2;
          left = targetRect.left - popoverRect.width - this.distance;
          break;
        case 'left-start':
          top = targetRect.top;
          left = targetRect.left - popoverRect.width - this.distance;
          break;
        case 'left-end':
          top = targetRect.bottom - popoverRect.height;
          left = targetRect.left - popoverRect.width - this.distance;
          break;
        case 'right':
          top = targetRect.top + (targetRect.height - popoverRect.height) / 2;
          left = targetRect.right + this.distance;
          break;
        case 'right-start':
          top = targetRect.top;
          left = targetRect.right + this.distance;
          break;
        case 'right-end':
          top = targetRect.bottom - popoverRect.height;
          left = targetRect.right + this.distance;
          break;
      }

      // Apply position
      popoverEl.style.top = `${Math.round(top)}px`;
      popoverEl.style.left = `${Math.round(left)}px`;
    });
  }

  @render()
  template() {
    return html`
      <div
        class="popover ${this.open ? 'popover--open' : ''}"
        data-placement="${this.placement}"
        @mouseenter=${() => this.trigger === 'hover' && this.clearHoverTimeout()}
        @mouseleave=${() => this.trigger === 'hover' && this.handlePopoverMouseLeave()}>
        <div class="popover__content">
          <slot></slot>
        </div>
        <if ${this.showArrow}>
          <div class="popover__arrow"></div>
        </if>
      </div>
    `;
  }

  private clearHoverTimeout() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }

  private handlePopoverMouseLeave() {
    this.hoverTimeout = window.setTimeout(() => {
      this.hide();
    }, this.hoverDelay);
  }

  private handleClickOutside = (e: MouseEvent) => {
    if (!this.open || !this.closeOnClickOutside) return;

    const target = e.target as Node;
    if (this.contains(target) || this.targetElement?.contains(target)) {
      return;
    }

    this.hide();
  };

  private handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.open && this.closeOnEscape) {
      this.hide();
    }
  };

  connectedCallback() {
    super.connectedCallback?.();
    document.addEventListener('click', this.handleClickOutside);
    document.addEventListener('keydown', this.handleEscape);
    window.addEventListener('scroll', this.updatePosition);
    window.addEventListener('resize', this.updatePosition);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this.removeTargetListeners();
    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleEscape);
    window.removeEventListener('scroll', this.updatePosition);
    window.removeEventListener('resize', this.updatePosition);

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-popover': SnicePopover;
  }
}
