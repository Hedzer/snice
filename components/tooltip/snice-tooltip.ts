import { element, property, query, on, watch, ready, dispose, render, styles, html, css } from 'snice';
import cssContent from './snice-tooltip.css?inline';
import type { TooltipPosition, TooltipTrigger, SniceTooltipElement } from './snice-tooltip.types';
import { ensurePortalStyles, calculatePosition } from './tooltip-positioning';
// Side effect: auto-enable attribute-based tooltips
import './tooltip-observer';

@element('snice-tooltip')
export class SniceTooltip extends HTMLElement implements SniceTooltipElement {
  @property({  })
  content: string = '';

  @property({  })
  position: TooltipPosition = 'top';

  @property({  })
  trigger: TooltipTrigger = 'hover';

  @property({ type: Number,  })
  delay: number = 0;

  @property({ type: Number, attribute: 'hide-delay',  })
  hideDelay: number = 0;

  @property({ type: Number,  })
  offset: number = 12;

  @property({ type: Boolean,  })
  arrow: boolean = true;

  @property({ type: Boolean,  })
  open: boolean = false;

  @property({ type: Number, attribute: 'max-width',  })
  maxWidth: number = 250;

  @property({ type: Number, attribute: 'z-index',  })
  zIndex: number = 10000;

  @property({ type: Boolean, attribute: 'strict-positioning',  })
  strictPositioning: boolean = false;

  @query('.tooltip')
  tooltipElement?: HTMLElement;

  @query('.tooltip__arrow')
  arrowElement?: HTMLElement;

  private showTimeout?: number;
  private hideTimeout?: number;
  private activePosition: TooltipPosition = 'top';
  private portalElement?: HTMLElement;

  @render()
  render() {
    return html/*html*/`
      <div part="trigger" class="tooltip-trigger">
        <slot></slot>
      </div>
      <div part="tooltip" class="tooltip tooltip--${this.position}" role="tooltip" hidden>
        <div part="content" class="tooltip__content">${this.content}</div>
        <div part="arrow" class="tooltip__arrow"></div>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    if (this.tooltipElement) {
      this.tooltipElement.style.setProperty('--tooltip-max-width', `${this.maxWidth}px`);
      this.tooltipElement.style.setProperty('--tooltip-z-index', `${this.zIndex}`);
    }

    if (this.open && this.trigger === 'manual') {
      this.show();
    }
  }

  @dispose()
  cleanup() {
    this.clearTimeouts();
    if (this.portalElement) {
      this.portalElement.remove();
      this.portalElement = undefined;
    }
  }

  @watch('content')
  updateContent() {
    const contentEl = this.shadowRoot?.querySelector('.tooltip__content');
    if (contentEl) {
      contentEl.textContent = this.content;
    }
  }

  @watch('arrow')
  updateArrow() {
    if (this.arrowElement) {
      if (this.arrow) {
        this.arrowElement.removeAttribute('hidden');
      } else {
        this.arrowElement.setAttribute('hidden', '');
      }
    }
  }

  @watch('maxWidth')
  updateMaxWidth() {
    if (this.tooltipElement) {
      this.tooltipElement.style.setProperty('--tooltip-max-width', `${this.maxWidth}px`);
    }
  }

  @watch('zIndex')
  updateZIndex() {
    if (this.tooltipElement) {
      this.tooltipElement.style.setProperty('--tooltip-z-index', `${this.zIndex}`);
    }
  }

  @watch('open')
  handleOpenChange() {
    if (this.trigger === 'manual') {
      if (this.open) {
        this.show();
      } else {
        this.hide();
      }
    }
  }

  @on('mouseenter')
  handleMouseEnter() {
    if (this.trigger === 'hover') {
      this.scheduleShow();
    }
  }

  @on('mouseleave')
  handleMouseLeave() {
    if (this.trigger === 'hover') {
      this.scheduleHide();
    }
  }

  @on('focusin')
  handleFocusIn() {
    if (this.trigger === 'focus') {
      this.scheduleShow();
    }
  }

  @on('focusout')
  handleFocusOut() {
    if (this.trigger === 'focus') {
      this.scheduleHide();
    }
  }

  @on('click')
  handleClick() {
    if (this.trigger === 'click') {
      this.toggle();
    }
  }

  private scheduleShow() {
    this.clearTimeouts();
    if (this.delay > 0) {
      this.showTimeout = window.setTimeout(() => this.show(), this.delay);
    } else {
      this.show();
    }
  }

  private scheduleHide() {
    this.clearTimeouts();
    if (this.hideDelay > 0) {
      this.hideTimeout = window.setTimeout(() => this.hide(), this.hideDelay);
    } else {
      this.hide();
    }
  }

  private clearTimeouts() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = undefined;
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = undefined;
    }
  }

  show() {
    if (!this.content) return;

    ensurePortalStyles();

    if (!this.portalElement) {
      this.portalElement = this.createPortalElement();
      this.updateArrowStyles(this.position);
    }

    this.portalElement.style.display = 'block';
    this.updatePortalContent();

    void this.portalElement.offsetHeight;

    this.updatePosition();
    this.portalElement.classList.add('snice-tooltip--visible');

    if (this.trigger === 'click') {
      setTimeout(() => {
        document.addEventListener('click', this.handleClickOutside);
      }, 0);
    }
  }

  hide() {
    if (!this.portalElement) return;

    this.portalElement.classList.remove('snice-tooltip--visible');

    setTimeout(() => {
      if (this.portalElement) {
        this.portalElement.style.display = 'none';
      }
    }, 200);

    if (this.trigger === 'click') {
      document.removeEventListener('click', this.handleClickOutside);
    }
  }

  toggle() {
    const isVisible = this.portalElement?.classList.contains('snice-tooltip--visible');
    if (!isVisible) {
      this.show();
    } else {
      this.hide();
    }
  }

  updatePosition() {
    if (!this.portalElement) return;

    this.portalElement.style.visibility = 'hidden';
    this.portalElement.style.left = '-9999px';
    this.portalElement.style.top = '-9999px';

    const triggerRect = this.getBoundingClientRect();
    const tooltipRect = this.portalElement.getBoundingClientRect();

    this.portalElement.style.visibility = '';

    const arrowSize = this.arrow ? 6 : 0;
    const position = calculatePosition(
      triggerRect, tooltipRect, this.position, this.offset, arrowSize, this.strictPositioning
    );

    if (position.adjustedPosition !== this.activePosition) {
      this.portalElement.classList.remove(`snice-tooltip--${this.activePosition}`);
      this.portalElement.classList.add(`snice-tooltip--${position.adjustedPosition}`);
      this.activePosition = position.adjustedPosition;
      this.updateArrowStyles(position.adjustedPosition);
    }

    this.portalElement.style.left = `${position.left}px`;
    this.portalElement.style.top = `${position.top}px`;
  }

  private updateArrowStyles(position: TooltipPosition) {
    if (!this.portalElement || !this.arrow) return;

    const arrow = this.portalElement.querySelector('.snice-tooltip__arrow') as HTMLElement;
    if (!arrow) return;

    arrow.style.top = 'auto';
    arrow.style.bottom = 'auto';
    arrow.style.left = 'auto';
    arrow.style.right = 'auto';
    arrow.style.transform = 'none';
    arrow.style.borderTopColor = 'transparent';
    arrow.style.borderBottomColor = 'transparent';
    arrow.style.borderLeftColor = 'transparent';
    arrow.style.borderRightColor = 'transparent';

    const tooltipBg = getComputedStyle(this).getPropertyValue('--tooltip-bg').trim() || 'rgb(51 51 51)';

    switch (position) {
      case 'top':
      case 'top-start':
      case 'top-end':
        arrow.style.bottom = '-6px';
        arrow.style.borderWidth = '6px 6px 0';
        arrow.style.borderTopColor = tooltipBg;
        arrow.style.borderLeftColor = 'transparent';
        arrow.style.borderRightColor = 'transparent';
        if (position === 'top') {
          arrow.style.left = '50%';
          arrow.style.transform = 'translateX(-50%)';
        } else if (position === 'top-start') {
          arrow.style.left = '16px';
        } else {
          arrow.style.right = '16px';
        }
        break;

      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        arrow.style.top = '-6px';
        arrow.style.borderWidth = '0 6px 6px';
        arrow.style.borderBottomColor = tooltipBg;
        arrow.style.borderLeftColor = 'transparent';
        arrow.style.borderRightColor = 'transparent';
        if (position === 'bottom') {
          arrow.style.left = '50%';
          arrow.style.transform = 'translateX(-50%)';
        } else if (position === 'bottom-start') {
          arrow.style.left = '16px';
        } else {
          arrow.style.right = '16px';
        }
        break;

      case 'left':
      case 'left-start':
      case 'left-end':
        arrow.style.right = '-6px';
        arrow.style.borderWidth = '6px 0 6px 6px';
        arrow.style.borderLeftColor = tooltipBg;
        arrow.style.borderTopColor = 'transparent';
        arrow.style.borderBottomColor = 'transparent';
        if (position === 'left') {
          arrow.style.top = '50%';
          arrow.style.transform = 'translateY(-50%)';
        } else if (position === 'left-start') {
          arrow.style.top = '16px';
        } else {
          arrow.style.bottom = '16px';
        }
        break;

      case 'right':
      case 'right-start':
      case 'right-end':
        arrow.style.left = '-6px';
        arrow.style.borderWidth = '6px 6px 6px 0';
        arrow.style.borderRightColor = tooltipBg;
        arrow.style.borderTopColor = 'transparent';
        arrow.style.borderBottomColor = 'transparent';
        if (position === 'right') {
          arrow.style.top = '50%';
          arrow.style.transform = 'translateY(-50%)';
        } else if (position === 'right-start') {
          arrow.style.top = '16px';
        } else {
          arrow.style.bottom = '16px';
        }
        break;
    }
  }

  private handleClickOutside = (e: MouseEvent) => {
    if (!this.contains(e.target as Node)) {
      this.hide();
    }
  };

  private createPortalElement(): HTMLElement {
    const portal = document.createElement('div');
    portal.className = `snice-tooltip snice-tooltip--${this.position}`;
    portal.setAttribute('role', 'tooltip');
    const hostStyles = getComputedStyle(this);
    const bg = hostStyles.getPropertyValue('--tooltip-bg').trim() || 'rgb(51 51 51)';
    const color = hostStyles.getPropertyValue('--tooltip-color').trim() || 'rgb(255 255 255)';
    portal.style.cssText = `
      position: fixed;
      z-index: ${this.zIndex};
      padding: 0.5rem 0.75rem;
      background: ${bg};
      color: ${color};
      border-radius: 6px;
      font-size: 0.875rem;
      line-height: 1.4;
      max-width: ${this.maxWidth}px;
      width: max-content;
      pointer-events: none;
      opacity: 0;
      transform: scale(0.95);
      transition: opacity 0.2s, transform 0.2s;
      box-shadow: 0 2px 8px rgb(0 0 0 / 0.15);
      display: none;
    `;

    const content = document.createElement('div');
    content.className = 'snice-tooltip__content';
    portal.appendChild(content);

    if (this.arrow) {
      const arrow = document.createElement('div');
      arrow.className = 'snice-tooltip__arrow';
      arrow.style.cssText = `
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
      `;
      portal.appendChild(arrow);
    }

    document.body.appendChild(portal);
    return portal;
  }

  private updatePortalContent() {
    if (!this.portalElement) return;

    const content = this.portalElement.querySelector('.snice-tooltip__content');
    if (content) {
      content.textContent = this.content;
    }

    let arrow = this.portalElement.querySelector('.snice-tooltip__arrow') as HTMLElement;
    if (this.arrow && !arrow) {
      arrow = document.createElement('div');
      arrow.className = 'snice-tooltip__arrow';
      arrow.style.cssText = `
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
      `;
      this.portalElement.appendChild(arrow);
    } else if (arrow) {
      arrow.style.display = this.arrow ? '' : 'none';
    }
  }
}
