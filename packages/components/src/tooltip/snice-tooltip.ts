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
  private hideAnimationTimeout?: number;
  private activePosition: TooltipPosition = 'top';
  private portalElement?: HTMLElement;
  private scrollHandler = () => this.updatePosition();
  private rafId = 0;

  @render()
  render() {
    return html/*html*/`
      <div part="trigger base" class="tooltip-trigger">
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
    window.removeEventListener('scroll', this.scrollHandler, { capture: true } as EventListenerOptions);
    window.removeEventListener('resize', this.scrollHandler);
    document.removeEventListener('click', this.handleClickOutside);
    document.removeEventListener('keydown', this.handleEscapeKey);
    cancelAnimationFrame(this.rafId);
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
    if (this.hideAnimationTimeout) {
      clearTimeout(this.hideAnimationTimeout);
      this.hideAnimationTimeout = undefined;
    }
  }

  show() {
    if (!this.content) return;

    if (this.hideAnimationTimeout) {
      clearTimeout(this.hideAnimationTimeout);
      this.hideAnimationTimeout = undefined;
    }

    ensurePortalStyles();

    if (!this.portalElement) {
      this.portalElement = this.createPortalElement();
      this.updateArrowStyles(this.position);
    }

    this.syncPortalStyles();
    this.portalElement.style.display = 'block';
    this.updatePortalContent();

    void this.portalElement.offsetHeight;

    this.updatePosition();
    this.portalElement.classList.add('snice-tooltip--visible');

    // Track scroll/resize to keep tooltip anchored
    window.addEventListener('scroll', this.scrollHandler, { capture: true, passive: true });
    window.addEventListener('resize', this.scrollHandler, { passive: true });

    if (this.trigger === 'click') {
      setTimeout(() => {
        document.addEventListener('click', this.handleClickOutside);
      }, 0);
    }
    if (this.trigger !== 'hover') {
      document.addEventListener('keydown', this.handleEscapeKey);
    }
  }

  hide() {
    if (!this.portalElement) return;

    this.portalElement.classList.remove('snice-tooltip--visible');

    // Stop tracking scroll/resize
    window.removeEventListener('scroll', this.scrollHandler, { capture: true } as EventListenerOptions);
    window.removeEventListener('resize', this.scrollHandler);
    cancelAnimationFrame(this.rafId);

    if (this.hideAnimationTimeout) {
      clearTimeout(this.hideAnimationTimeout);
    }
    this.hideAnimationTimeout = window.setTimeout(() => {
      this.hideAnimationTimeout = undefined;
      if (this.portalElement && !this.portalElement.classList.contains('snice-tooltip--visible')) {
        this.portalElement.style.display = 'none';
      }
    }, 200);

    if (this.trigger === 'click') {
      document.removeEventListener('click', this.handleClickOutside);
    }
    document.removeEventListener('keydown', this.handleEscapeKey);
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

    const arrowHidden = getComputedStyle(this).getPropertyValue('--tooltip-arrow-display').trim() === 'none';
    const arrowSize = (this.arrow && !arrowHidden) ? 6 : 0;
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
    const path = e.composedPath();
    if (path.includes(this)) return;
    if (this.portalElement && path.includes(this.portalElement)) return;
    this.hide();
  };

  private handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.hide();
  };

  private syncPortalStyles() {
    if (!this.portalElement) return;
    const hostStyles = getComputedStyle(this);
    const getVar = (name: string, fallback: string) =>
      hostStyles.getPropertyValue(name).trim() || fallback;

    const bg = getVar('--tooltip-bg', 'rgb(51 51 51)');
    const color = getVar('--tooltip-color', 'rgb(255 255 255)');
    const border = getVar('--tooltip-border', 'none');
    const radius = getVar('--tooltip-radius', '6px');
    const padding = getVar('--tooltip-padding', '0.5rem 0.75rem');
    const fontSize = getVar('--tooltip-font-size', '0.875rem');
    const fontFamily = getVar('--tooltip-font-family', '');
    const fontWeight = getVar('--tooltip-font-weight', '');
    const lineHeight = getVar('--tooltip-line-height', '1.4');
    const letterSpacing = getVar('--tooltip-letter-spacing', '');
    const shadow = getVar('--tooltip-shadow', '0 2px 8px rgb(0 0 0 / 0.15)');
    const backdropFilter = getVar('--tooltip-backdrop-filter', 'none');
    const transition = getVar('--tooltip-transition', 'opacity 0.2s, transform 0.2s');
    const minHeight = getVar('--tooltip-min-height', '');

    this.portalElement.style.background = bg;
    this.portalElement.style.color = color;
    this.portalElement.style.border = border;
    this.portalElement.style.borderRadius = radius;
    this.portalElement.style.padding = padding;
    this.portalElement.style.fontSize = fontSize;
    this.portalElement.style.lineHeight = lineHeight;
    this.portalElement.style.boxShadow = shadow;
    this.portalElement.style.backdropFilter = backdropFilter;
    (this.portalElement.style as any).webkitBackdropFilter = backdropFilter;
    this.portalElement.style.transition = transition;
    this.portalElement.style.minHeight = minHeight;
    this.portalElement.style.fontFamily = fontFamily;
    this.portalElement.style.fontWeight = fontWeight;
    this.portalElement.style.letterSpacing = letterSpacing;

    const arrow = this.portalElement.querySelector('.snice-tooltip__arrow') as HTMLElement | null;
    if (arrow) {
      const arrowDisplay = getVar('--tooltip-arrow-display', '');
      arrow.style.display = (!this.arrow || arrowDisplay === 'none') ? 'none' : '';
    }
  }

  private createPortalElement(): HTMLElement {
    const portal = document.createElement('div');
    portal.className = `snice-tooltip snice-tooltip--${this.position}`;
    portal.setAttribute('role', 'tooltip');
    portal.style.cssText = `
      position: fixed;
      box-sizing: border-box;
      z-index: ${this.zIndex};
      max-width: ${this.maxWidth}px;
      width: max-content;
      pointer-events: none;
      opacity: 0;
      transform: scale(0.95);
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

    const arrowHidden = getComputedStyle(this).getPropertyValue('--tooltip-arrow-display').trim() === 'none';
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
    }
    if (arrow) {
      arrow.style.display = (this.arrow && !arrowHidden) ? '' : 'none';
    }
  }
}
