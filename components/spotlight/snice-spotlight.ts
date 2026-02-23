import { element, property, query, dispatch, dispose, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-spotlight.css?inline';
import type { SpotlightStep, SniceSpotlightElement } from './snice-spotlight.types';

@element('snice-spotlight')
export class SniceSpotlight extends HTMLElement implements SniceSpotlightElement {
  @property({ type: Array })
  steps: SpotlightStep[] = [];

  @property({ type: Number })
  private currentIndex = -1;

  @property({ type: Boolean })
  private active = false;

  @query('.cutout')
  private cutoutEl!: HTMLElement;

  @query('.popover')
  private popoverEl!: HTMLElement;

  private resizeObserver: ResizeObserver | null = null;
  private _originalParent: Node | null = null;
  private _originalNextSibling: Node | null = null;

  @dispatch('spotlight-start', { bubbles: true, composed: true })
  private emitStart() { return undefined; }

  @dispatch('spotlight-step', { bubbles: true, composed: true })
  private emitStep() {
    return { index: this.currentIndex, step: this.steps[this.currentIndex] };
  }

  @dispatch('spotlight-end', { bubbles: true, composed: true })
  private emitEnd() { return undefined; }

  @dispatch('spotlight-skip', { bubbles: true, composed: true })
  private emitSkip() {
    return { index: this.currentIndex };
  }

  @dispose()
  cleanup() {
    this.resizeObserver?.disconnect();
    this._returnToOrigin();
  }

  /**
   * Move element to document.body to escape any containing blocks
   * created by ancestor transforms/filters/contain that break position:fixed.
   */
  private _teleportToBody() {
    if (this.parentNode === document.body) return;
    this._originalParent = this.parentNode;
    this._originalNextSibling = this.nextSibling;
    document.body.appendChild(this);
  }

  /**
   * Return element to its original DOM position.
   */
  private _returnToOrigin() {
    if (!this._originalParent) return;
    if (this._originalNextSibling) {
      this._originalParent.insertBefore(this, this._originalNextSibling);
    } else {
      this._originalParent.appendChild(this);
    }
    this._originalParent = null;
    this._originalNextSibling = null;
  }

  start() {
    if (this.steps.length === 0) return;
    this._teleportToBody();
    this.active = true;
    this.currentIndex = 0;
    this.emitStart();
    requestAnimationFrame(() => this.positionElements());
  }

  next() {
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      this.emitStep();
      requestAnimationFrame(() => this.positionElements());
    } else {
      this.end();
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.emitStep();
      requestAnimationFrame(() => this.positionElements());
    }
  }

  goToStep(index: number) {
    if (index >= 0 && index < this.steps.length) {
      this.currentIndex = index;
      if (!this.active) {
        this._teleportToBody();
        this.active = true;
      }
      this.emitStep();
      requestAnimationFrame(() => this.positionElements());
    }
  }

  end() {
    this.active = false;
    this.currentIndex = -1;
    this.emitEnd();
    this._returnToOrigin();
  }

  private skip() {
    this.emitSkip();
    this.end();
  }

  private positionElements() {
    if (this.currentIndex < 0 || !this.steps[this.currentIndex]) return;

    const step = this.steps[this.currentIndex];
    const target = document.querySelector(step.target);
    if (!target) return;

    // Scroll target into view first
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const rect = target.getBoundingClientRect();
    const padding = 8;

    // Position cutout
    if (this.cutoutEl) {
      this.cutoutEl.style.top = `${rect.top - padding}px`;
      this.cutoutEl.style.left = `${rect.left - padding}px`;
      this.cutoutEl.style.width = `${rect.width + padding * 2}px`;
      this.cutoutEl.style.height = `${rect.height + padding * 2}px`;
    }

    // Position popover
    if (this.popoverEl) {
      const position = step.position || 'auto';
      this.positionPopover(rect, position, padding);
    }
  }

  private positionPopover(targetRect: DOMRect, position: string, padding: number) {
    const popover = this.popoverEl;
    if (!popover) return;

    const gap = 12;
    popover.style.top = '';
    popover.style.left = '';
    popover.style.bottom = '';
    popover.style.right = '';

    let pos = position;
    if (pos === 'auto') {
      const spaceBelow = window.innerHeight - targetRect.bottom;
      const spaceAbove = targetRect.top;
      pos = spaceBelow > 200 ? 'bottom' : spaceAbove > 200 ? 'top' : 'bottom';
    }

    switch (pos) {
      case 'bottom':
        popover.style.top = `${targetRect.bottom + padding + gap}px`;
        popover.style.left = `${Math.max(8, targetRect.left)}px`;
        break;
      case 'top':
        popover.style.bottom = `${window.innerHeight - targetRect.top + padding + gap}px`;
        popover.style.left = `${Math.max(8, targetRect.left)}px`;
        break;
      case 'left':
        popover.style.top = `${targetRect.top}px`;
        popover.style.right = `${window.innerWidth - targetRect.left + padding + gap}px`;
        break;
      case 'right':
        popover.style.top = `${targetRect.top}px`;
        popover.style.left = `${targetRect.right + padding + gap}px`;
        break;
    }
  }

  @render()
  template() {
    const step = this.currentIndex >= 0 ? this.steps[this.currentIndex] : null;
    const isLast = this.currentIndex === this.steps.length - 1;
    const isFirst = this.currentIndex === 0;

    return html`
      <div class="overlay" ?hidden=${!this.active}>
        <div class="backdrop" @click=${() => this.skip()}></div>
        <div class="cutout"></div>
        <div class="popover" ?hidden=${!step}>
          <div class="popover-title">${step?.title ?? ''}</div>
          <div class="popover-description">${step?.description ?? ''}</div>
          <div class="popover-footer">
            <span class="step-indicator">${this.currentIndex + 1} / ${this.steps.length}</span>
            <div class="popover-actions">
              <button class="btn btn-skip" @click=${() => this.skip()}>Skip</button>
              ${!isFirst ? html`<button class="btn" @click=${() => this.prev()}>Back</button>` : html``}
              <button class="btn btn-primary" @click=${() => this.next()}>
                ${isLast ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return cssTag`${cssContent}`;
  }
}
