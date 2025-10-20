import { element, property, query, on, watch, ready, dispose, render, styles, html, css } from 'snice';
import cssContent from './snice-tooltip.css?inline';
import portalCss from './snice-tooltip-portal.css?inline';
import type { TooltipPosition, TooltipTrigger, SniceTooltipElement } from './snice-tooltip.types';

@element('snice-tooltip')
export class SniceTooltip extends HTMLElement implements SniceTooltipElement {
  private static portalStylesInjected = false;
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

  private static ensurePortalStyles() {
    if (SniceTooltip.portalStylesInjected) return;
    
    try {
      // Use Constructable Stylesheets if supported
      if ('adoptedStyleSheets' in document && 'CSSStyleSheet' in window) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(portalCss);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      } else {
        // Fallback for older browsers
        const style = document.createElement('style');
        style.textContent = portalCss;
        document.head.appendChild(style);
      }
      
      SniceTooltip.portalStylesInjected = true;
    } catch (error) {
      console.warn('Failed to inject tooltip portal styles:', error);
    }
  }

  @render()
  renderContent() {
    return html/*html*/`
      <div class="tooltip-trigger">
        <slot></slot>
      </div>
      <div class="tooltip tooltip--${this.position}" role="tooltip" hidden>
        <div class="tooltip__content">${this.content}</div>
        <div class="tooltip__arrow"></div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
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

    // Ensure portal styles are injected
    SniceTooltip.ensurePortalStyles();

    // Create portal element if it doesn't exist
    if (!this.portalElement) {
      this.portalElement = this.createPortalElement();
      this.updateArrowStyles(this.position);
    }

    this.portalElement.style.display = 'block';
    this.updatePortalContent();
    
    // Force reflow before adding visible class
    void this.portalElement.offsetHeight;
    
    this.updatePosition();
    this.portalElement.classList.add('snice-tooltip--visible');

    if (this.trigger === 'click') {
      // Add click outside listener
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
    }, 200); // Match transition duration

    if (this.trigger === 'click') {
      document.removeEventListener('click', this.handleClickOutside);
    }
  }

  toggle() {
    if (!this.portalElement || this.portalElement.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
  }

  updatePosition() {
    if (!this.portalElement) return;

    // Make sure tooltip is visible but off-screen to get accurate dimensions
    this.portalElement.style.visibility = 'hidden';
    this.portalElement.style.left = '-9999px';
    this.portalElement.style.top = '-9999px';
    
    const triggerRect = this.getBoundingClientRect();
    const tooltipRect = this.portalElement.getBoundingClientRect();
    
    // Restore visibility
    this.portalElement.style.visibility = '';
    
    // Calculate position with smart viewport detection
    const position = this.calculatePosition(triggerRect, tooltipRect);
    
    // Update tooltip position class if it changed
    if (position.adjustedPosition !== this.activePosition) {
      this.portalElement.classList.remove(`snice-tooltip--${this.activePosition}`);
      this.portalElement.classList.add(`snice-tooltip--${position.adjustedPosition}`);
      this.activePosition = position.adjustedPosition;
      
      // Update arrow styles for new position
      this.updateArrowStyles(position.adjustedPosition);
    }

    // Apply calculated position
    this.portalElement.style.left = `${position.left}px`;
    this.portalElement.style.top = `${position.top}px`;
  }
  
  private updateArrowStyles(position: TooltipPosition) {
    if (!this.portalElement || !this.arrow) return;
    
    const arrow = this.portalElement.querySelector('.snice-tooltip__arrow') as HTMLElement;
    if (!arrow) return;
    
    // Reset styles - set to explicit values instead of empty strings
    arrow.style.top = 'auto';
    arrow.style.bottom = 'auto';
    arrow.style.left = 'auto';
    arrow.style.right = 'auto';
    arrow.style.transform = 'none';
    arrow.style.borderTopColor = 'transparent';
    arrow.style.borderBottomColor = 'transparent';
    arrow.style.borderLeftColor = 'transparent';
    arrow.style.borderRightColor = 'transparent';
    
    // Apply position-specific styles
    switch (position) {
      case 'top':
      case 'top-start':
      case 'top-end':
        arrow.style.bottom = '-6px';
        arrow.style.borderWidth = '6px 6px 0';
        arrow.style.borderTopColor = '#333';
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
        arrow.style.borderBottomColor = '#333';
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
        arrow.style.borderLeftColor = '#333';
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
        arrow.style.borderRightColor = '#333';
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

  private calculatePosition(triggerRect: DOMRect, tooltipRect: DOMRect) {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };

    let position = this.position;
    let left = 0;
    let top = 0;

    // Calculate base position
    const positions = this.getPositionCoordinates(triggerRect, tooltipRect, position);
    left = positions.left;
    top = positions.top;

    // If strict positioning is disabled, check if tooltip fits in viewport
    if (!this.strictPositioning) {
      const fitsInViewport = 
        left >= 0 && 
        top >= 0 && 
        left + tooltipRect.width <= viewport.width &&
        top + tooltipRect.height <= viewport.height;

      // If it doesn't fit, try alternative positions
      if (!fitsInViewport) {
        const alternativePositions = this.getAlternativePositions(position);
        
        for (const altPosition of alternativePositions) {
          const altCoords = this.getPositionCoordinates(triggerRect, tooltipRect, altPosition);
          
          if (
            altCoords.left >= 0 &&
            altCoords.top >= 0 &&
            altCoords.left + tooltipRect.width <= viewport.width &&
            altCoords.top + tooltipRect.height <= viewport.height
          ) {
            position = altPosition;
            left = altCoords.left;
            top = altCoords.top;
            break;
          }
        }
      }
    }

    return { left, top, adjustedPosition: position };
  }

  private getPositionCoordinates(triggerRect: DOMRect, tooltipRect: DOMRect, position: TooltipPosition) {
    let left = 0;
    let top = 0;

    const centerX = triggerRect.left + triggerRect.width / 2;
    const centerY = triggerRect.top + triggerRect.height / 2;
    
    // Different offsets for different directions
    // Left/right need more spacing, top/bottom need less
    const arrowSize = this.arrow ? 6 : 0;
    const verticalOffset = this.offset;  // Just base offset for top/bottom
    const horizontalOffset = this.offset + arrowSize;  // More offset for left/right

    switch (position) {
      case 'top':
        left = centerX - tooltipRect.width / 2;
        top = triggerRect.top - tooltipRect.height - verticalOffset;
        break;
      case 'top-start':
        left = triggerRect.left;
        top = triggerRect.top - tooltipRect.height - verticalOffset;
        break;
      case 'top-end':
        left = triggerRect.right - tooltipRect.width;
        top = triggerRect.top - tooltipRect.height - verticalOffset;
        break;
      case 'bottom':
        left = centerX - tooltipRect.width / 2;
        top = triggerRect.bottom + verticalOffset;
        break;
      case 'bottom-start':
        left = triggerRect.left;
        top = triggerRect.bottom + verticalOffset;
        break;
      case 'bottom-end':
        left = triggerRect.right - tooltipRect.width;
        top = triggerRect.bottom + verticalOffset;
        break;
      case 'left':
        left = triggerRect.left - tooltipRect.width - horizontalOffset;
        top = centerY - tooltipRect.height / 2;
        break;
      case 'left-start':
        left = triggerRect.left - tooltipRect.width - horizontalOffset;
        top = triggerRect.top;
        break;
      case 'left-end':
        left = triggerRect.left - tooltipRect.width - horizontalOffset;
        top = triggerRect.bottom - tooltipRect.height;
        break;
      case 'right':
        left = triggerRect.right + horizontalOffset;
        top = centerY - tooltipRect.height / 2;
        break;
      case 'right-start':
        left = triggerRect.right + horizontalOffset;
        top = triggerRect.top;
        break;
      case 'right-end':
        left = triggerRect.right + horizontalOffset;
        top = triggerRect.bottom - tooltipRect.height;
        break;
    }

    return { left, top };
  }

  private getAlternativePositions(position: TooltipPosition): TooltipPosition[] {
    const opposites: Record<string, TooltipPosition[]> = {
      'top': ['bottom', 'left', 'right'],
      'top-start': ['bottom-start', 'left', 'right'],
      'top-end': ['bottom-end', 'left', 'right'],
      'bottom': ['top', 'left', 'right'],
      'bottom-start': ['top-start', 'left', 'right'],
      'bottom-end': ['top-end', 'left', 'right'],
      'left': ['right', 'top', 'bottom'],
      'left-start': ['right-start', 'top', 'bottom'],
      'left-end': ['right-end', 'top', 'bottom'],
      'right': ['left', 'top', 'bottom'],
      'right-start': ['left-start', 'top', 'bottom'],
      'right-end': ['left-end', 'top', 'bottom']
    };

    return opposites[position] || ['top', 'bottom', 'left', 'right'];
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
    portal.style.cssText = `
      position: fixed;
      z-index: ${this.zIndex};
      padding: 8px 12px;
      background: #333;
      color: white;
      border-radius: 6px;
      font-size: 14px;
      line-height: 1.4;
      max-width: ${this.maxWidth}px;
      width: max-content;
      pointer-events: none;
      opacity: 0;
      transform: scale(0.95);
      transition: opacity 0.2s, transform 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      display: none;
    `;
    
    // Create content element
    const content = document.createElement('div');
    content.className = 'snice-tooltip__content';
    portal.appendChild(content);
    
    // Create arrow element if needed
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
    
    // Add to body
    document.body.appendChild(portal);
    
    return portal;
  }

  private updatePortalContent() {
    if (!this.portalElement) return;
    
    const content = this.portalElement.querySelector('.snice-tooltip__content');
    if (content) {
      content.textContent = this.content;
    }
    
    // Update or create arrow if needed
    let arrow = this.portalElement.querySelector('.snice-tooltip__arrow') as HTMLElement;
    if (this.arrow && !arrow) {
      // Create arrow if it doesn't exist but should
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