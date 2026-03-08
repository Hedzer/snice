import { element, property, dispatch, dispose, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-spotlight.css?inline';
import type { SpotlightStep, SniceSpotlightElement } from './snice-spotlight.types';

@element('snice-spotlight')
export class SniceSpotlight extends HTMLElement implements SniceSpotlightElement {
  @property({ type: Array, attribute: false })
  steps: SpotlightStep[] = [];

  @property({ type: Number })
  private currentIndex = -1;

  @property({ type: Boolean })
  private active = false;

  /**
   * Portal div appended to document.body. All overlay UI lives here
   * to escape ancestor transforms/filters/contain that break position:fixed.
   */
  private _portal: HTMLDivElement | null = null;
  private _cutoutEl: HTMLElement | null = null;
  private _popoverEl: HTMLElement | null = null;
  private _scrollHandler: (() => void) | null = null;
  private _resizeHandler: (() => void) | null = null;

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
    this._removePortal();
  }

  /**
   * Create the portal div on document.body with all overlay UI.
   * This avoids moving the component itself (which triggers @dispose).
   */
  private _createPortal() {
    if (this._portal) return;

    const portal = document.createElement('div');
    portal.setAttribute('data-snice-spotlight-portal', '');
    portal.innerHTML = `
      <style>${cssContent}
        [data-snice-spotlight-portal] { font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif); }
        [data-snice-spotlight-portal] .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9998; pointer-events: none; }
        [data-snice-spotlight-portal] .backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: auto; }
        [data-snice-spotlight-portal] .cutout { position: fixed; background: transparent; box-shadow: 0 0 0 9999px rgb(0 0 0 / 0.5); border-radius: 4px; z-index: 9999; pointer-events: none; transition: top var(--snice-transition-medium, 250ms) ease, left var(--snice-transition-medium, 250ms) ease, width var(--snice-transition-medium, 250ms) ease, height var(--snice-transition-medium, 250ms) ease; }
        [data-snice-spotlight-portal] .popover { position: fixed; z-index: 10000; background: var(--snice-color-background, rgb(255 255 255)); border: 1px solid var(--snice-color-border, rgb(226 226 226)); border-radius: var(--snice-border-radius-lg, 0.5rem); box-shadow: var(--snice-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)); padding: var(--snice-spacing-md, 1rem); max-width: 20rem; min-width: 15rem; pointer-events: auto; color: var(--snice-color-text, rgb(23 23 23)); }
        [data-snice-spotlight-portal] .popover-title { font-size: var(--snice-font-size-lg, 1.125rem); font-weight: var(--snice-font-weight-semibold, 600); margin-bottom: var(--snice-spacing-2xs, 0.25rem); }
        [data-snice-spotlight-portal] .popover-description { font-size: var(--snice-font-size-md, 1rem); color: var(--snice-color-text-secondary, rgb(82 82 82)); line-height: var(--snice-line-height-normal, 1.5); margin-bottom: var(--snice-spacing-sm, 0.75rem); }
        [data-snice-spotlight-portal] .popover-footer { display: flex; align-items: center; justify-content: space-between; gap: var(--snice-spacing-xs, 0.5rem); }
        [data-snice-spotlight-portal] .step-indicator { font-size: var(--snice-font-size-sm, 0.875rem); color: var(--snice-color-text-tertiary, rgb(115 115 115)); }
        [data-snice-spotlight-portal] .popover-actions { display: flex; gap: var(--snice-spacing-2xs, 0.25rem); }
        [data-snice-spotlight-portal] .btn { padding: var(--snice-spacing-2xs, 0.25rem) var(--snice-spacing-sm, 0.75rem); border-radius: var(--snice-border-radius-md, 0.25rem); font-size: var(--snice-font-size-sm, 0.875rem); cursor: pointer; border: 1px solid var(--snice-color-border, rgb(226 226 226)); background: var(--snice-color-background, rgb(255 255 255)); color: var(--snice-color-text, rgb(23 23 23)); font-family: inherit; }
        [data-snice-spotlight-portal] .btn:hover { background: var(--snice-color-background-element, rgb(252 251 249)); }
        [data-snice-spotlight-portal] .btn-primary { background: var(--snice-color-primary, rgb(37 99 235)); color: var(--snice-color-text-inverse, rgb(250 250 250)); border-color: var(--snice-color-primary, rgb(37 99 235)); }
        [data-snice-spotlight-portal] .btn-primary:hover { opacity: 0.9; }
        [data-snice-spotlight-portal] .btn-skip { border: none; background: none; color: var(--snice-color-text-tertiary, rgb(115 115 115)); padding: var(--snice-spacing-2xs, 0.25rem); }
        [data-snice-spotlight-portal] .btn-skip:hover { color: var(--snice-color-text, rgb(23 23 23)); }
      </style>
      <div class="overlay">
        <div class="backdrop"></div>
        <div class="cutout"></div>
        <div class="popover">
          <div class="popover-title"></div>
          <div class="popover-description"></div>
          <div class="popover-footer">
            <span class="step-indicator"></span>
            <div class="popover-actions"></div>
          </div>
        </div>
      </div>
    `;

    // Wire up event handlers
    const backdrop = portal.querySelector('.backdrop') as HTMLElement;
    backdrop?.addEventListener('click', () => this.skip());

    this._portal = portal;
    this._cutoutEl = portal.querySelector('.cutout');
    this._popoverEl = portal.querySelector('.popover');

    document.body.appendChild(portal);

    // Listen for scroll and resize to reposition
    this._scrollHandler = () => this._updatePosition();
    this._resizeHandler = () => this._updatePosition();
    window.addEventListener('scroll', this._scrollHandler, true);
    window.addEventListener('resize', this._resizeHandler);
  }

  /** Remove portal from document.body and clean up listeners. */
  private _removePortal() {
    if (this._scrollHandler) {
      window.removeEventListener('scroll', this._scrollHandler, true);
      this._scrollHandler = null;
    }
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this._portal) {
      this._portal.remove();
      this._portal = null;
      this._cutoutEl = null;
      this._popoverEl = null;
    }
  }

  /** Update the portal HTML to reflect current step state. */
  private _updatePortalContent() {
    if (!this._portal) return;

    const step = this.currentIndex >= 0 ? this.steps[this.currentIndex] : null;
    const isLast = this.currentIndex === this.steps.length - 1;
    const isFirst = this.currentIndex === 0;

    // Update popover content
    const titleEl = this._portal.querySelector('.popover-title') as HTMLElement;
    const descEl = this._portal.querySelector('.popover-description') as HTMLElement;
    const indicatorEl = this._portal.querySelector('.step-indicator') as HTMLElement;
    const actionsEl = this._portal.querySelector('.popover-actions') as HTMLElement;
    const popoverEl = this._popoverEl;

    if (!step || !popoverEl) return;

    popoverEl.style.display = '';
    if (titleEl) titleEl.textContent = step.title;
    if (descEl) descEl.textContent = step.description;
    if (indicatorEl) indicatorEl.textContent = `${this.currentIndex + 1} / ${this.steps.length}`;

    if (actionsEl) {
      actionsEl.innerHTML = '';

      const skipBtn = document.createElement('button');
      skipBtn.className = 'btn btn-skip';
      skipBtn.textContent = 'Skip';
      skipBtn.addEventListener('click', () => this.skip());
      actionsEl.appendChild(skipBtn);

      if (!isFirst) {
        const backBtn = document.createElement('button');
        backBtn.className = 'btn';
        backBtn.textContent = 'Back';
        backBtn.addEventListener('click', () => this.prev());
        actionsEl.appendChild(backBtn);
      }

      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-primary';
      nextBtn.textContent = isLast ? 'Done' : 'Next';
      nextBtn.addEventListener('click', () => this.next());
      actionsEl.appendChild(nextBtn);
    }
  }

  /** Position the cutout and popover over the current target. */
  private _updatePosition() {
    if (this.currentIndex < 0 || !this.steps[this.currentIndex]) return;
    if (!this._cutoutEl || !this._popoverEl) return;

    const step = this.steps[this.currentIndex];
    const target = document.querySelector(step.target);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const padding = 8;

    // Position cutout
    this._cutoutEl.style.top = `${rect.top - padding}px`;
    this._cutoutEl.style.left = `${rect.left - padding}px`;
    this._cutoutEl.style.width = `${rect.width + padding * 2}px`;
    this._cutoutEl.style.height = `${rect.height + padding * 2}px`;

    // Position popover
    const position = step.position || 'auto';
    this._positionPopover(rect, position, padding);
  }

  private _positionPopover(targetRect: DOMRect, position: string, padding: number) {
    const popover = this._popoverEl;
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

  /** Scroll target into view, then position once scroll settles. */
  private _scrollAndPosition() {
    if (this.currentIndex < 0 || !this.steps[this.currentIndex]) return;

    const step = this.steps[this.currentIndex];
    const target = document.querySelector(step.target);
    if (!target) return;

    // Use instant scroll so getBoundingClientRect is accurate immediately
    target.scrollIntoView({ behavior: 'instant', block: 'center' });
    this._updatePosition();
  }

  start() {
    if (this.steps.length === 0) return;
    this._createPortal();
    this.active = true;
    this.currentIndex = 0;
    this._updatePortalContent();
    this.emitStart();
    this._scrollAndPosition();
  }

  next() {
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      this._updatePortalContent();
      this.emitStep();
      this._scrollAndPosition();
    } else {
      this.end();
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this._updatePortalContent();
      this.emitStep();
      this._scrollAndPosition();
    }
  }

  goToStep(index: number) {
    if (index >= 0 && index < this.steps.length) {
      this.currentIndex = index;
      if (!this.active) {
        this._createPortal();
        this.active = true;
      }
      this._updatePortalContent();
      this.emitStep();
      this._scrollAndPosition();
    }
  }

  end() {
    this.active = false;
    this.currentIndex = -1;
    this._removePortal();
    this.emitEnd();
  }

  private skip() {
    this.emitSkip();
    this.end();
  }

  @render()
  template() {
    // The overlay UI lives in the portal on document.body.
    // The component itself renders nothing visible.
    return html``;
  }

  @styles()
  componentStyles() {
    return cssTag`:host { display: none; }`;
  }
}
