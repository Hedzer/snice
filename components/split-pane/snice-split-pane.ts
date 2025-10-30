import { element, property, render, styles, dispatch, query, dispose, html, css } from 'snice';
import type { SniceResizeElement, SplitDirection, SniceResizeDetail } from './snice-split-pane.types';
import cssContent from './snice-split-pane.css?inline';

@element('snice-split-pane')
export class SniceResize extends HTMLElement implements SniceResizeElement {
  @property({ attribute: 'direction' })
  direction: SplitDirection = 'horizontal';

  @property({ type: Number, attribute: 'primary-size' })
  primarySize = 50; // percentage

  @property({ type: Number, attribute: 'min-primary-size' })
  minPrimarySize = 10; // percentage

  @property({ type: Number, attribute: 'min-secondary-size' })
  minSecondarySize = 10; // percentage

  @property({ type: Number, attribute: 'snap-size' })
  snapSize = 0; // percentage, 0 = no snap

  @property({ type: Boolean })
  disabled = false;

  @query('.primary')
  private primaryPane!: HTMLElement;

  @query('.secondary')
  private secondaryPane!: HTMLElement;

  @query('.divider')
  private dividerElement!: HTMLElement;

  private isDragging = false;
  private startPosition = 0;
  private startSize = 0;

  @dispatch('@snice/resize', { bubbles: true, composed: true })
  private dispatchResize(): SniceResizeDetail {
    return {
      primarySize: this.primarySize,
      secondarySize: 100 - this.primarySize,
      splitPane: this
    };
  }

  @styles()
  private styles() {
    return css/*css*/`${cssContent}`;
  }

  getPrimarySize(): number {
    return this.primarySize;
  }

  getSecondarySize(): number {
    return 100 - this.primarySize;
  }

  setPrimarySize(size: number): void {
    const clampedSize = Math.max(
      this.minPrimarySize,
      Math.min(100 - this.minSecondarySize, size)
    );

    this.primarySize = clampedSize;
    this.dispatchResize();
  }

  reset(): void {
    this.primarySize = 50;
    this.dispatchResize();
  }

  private handleDividerMouseDown = (e: MouseEvent) => {
    if (this.disabled) return;

    e.preventDefault();
    this.isDragging = true;
    this.classList.add('dragging');
    this.dividerElement.classList.add('divider--dragging');

    this.startPosition = this.direction === 'horizontal' ? e.clientX : e.clientY;
    this.startSize = this.primarySize;

    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;

    const containerSize = this.direction === 'horizontal'
      ? this.offsetWidth
      : this.offsetHeight;

    const currentPosition = this.direction === 'horizontal' ? e.clientX : e.clientY;
    const delta = currentPosition - this.startPosition;
    const deltaPercentage = (delta / containerSize) * 100;

    let newSize = this.startSize + deltaPercentage;

    // Apply snapping
    if (this.snapSize > 0) {
      const remainder = newSize % this.snapSize;
      if (remainder < this.snapSize / 2) {
        newSize -= remainder;
      } else {
        newSize += (this.snapSize - remainder);
      }
    }

    this.setPrimarySize(newSize);
  };

  private handleMouseUp = () => {
    this.isDragging = false;
    this.classList.remove('dragging');
    this.dividerElement.classList.remove('divider--dragging');

    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  };

  @render()
  template() {
    const primaryStyle = this.direction === 'horizontal'
      ? `width: ${this.primarySize}%`
      : `height: ${this.primarySize}%`;

    return html/*html*/`
      <div class="primary" style="${primaryStyle}">
        <slot name="primary"></slot>
      </div>

      <div
        class="divider ${this.disabled ? 'divider--disabled' : ''}"
        @mousedown=${this.handleDividerMouseDown}>
        <div class="divider__handle"></div>
      </div>

      <div class="secondary">
        <slot name="secondary"></slot>
      </div>
    `;
  }

  @dispose()
  cleanup() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }
}

// Also export as SniceSplitPane for backward compatibility
export const SniceSplitPane = SniceResize;

declare global {
  interface HTMLElementTagNameMap {
    'snice-split-pane': SniceResize;
  }
}
