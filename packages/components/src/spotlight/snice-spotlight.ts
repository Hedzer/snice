import { element, property, dispatch, dispose, render, styles, html, css as cssTag } from 'snice';
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
  private portal: HTMLDivElement | null = null;
  private portalSkinStyle: HTMLStyleElement | null = null;
  private cutoutEl: HTMLElement | null = null;
  private popoverEl: HTMLElement | null = null;
  private scrollHandler: (() => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private contextObserver: MutationObserver | null = null;

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
    this.removePortal();
  }

  /**
   * Create the portal div on document.body with all overlay UI.
   * This avoids moving the component itself (which triggers @dispose).
   */
  private createPortal() {
    if (this.portal) return;

    const portal = document.createElement('div');
    portal.setAttribute('data-snice-spotlight-portal', '');
    portal.innerHTML = `
      <style>
        [data-snice-spotlight-portal] { font-family: var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif); }
        [data-snice-spotlight-portal] .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9998; pointer-events: none; }
        [data-snice-spotlight-portal] .backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: auto; }
        [data-snice-spotlight-portal] .cutout { position: fixed; background: transparent; box-shadow: 0 0 0 9999px rgb(0 0 0 / 0.5); border-radius: 4px; z-index: 9999; pointer-events: none; transition: top var(--snice-transition-medium, 250ms) ease, left var(--snice-transition-medium, 250ms) ease, width var(--snice-transition-medium, 250ms) ease, height var(--snice-transition-medium, 250ms) ease; }
        [data-snice-spotlight-portal] .popover { position: fixed; z-index: 10000; background: var(--snice-color-surface, rgb(255 255 255)); border: 1px solid var(--snice-color-border, rgb(226 226 226)); border-radius: var(--snice-border-radius-lg, 0.5rem); box-shadow: var(--snice-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)); padding: var(--snice-spacing-md, 1rem); max-width: 20rem; min-width: 15rem; pointer-events: auto; color: var(--snice-color-text, rgb(23 23 23)); }
        [data-snice-spotlight-portal] .popover-title { font-size: var(--snice-font-size-lg, 1.125rem); font-weight: var(--snice-font-weight-semibold, 600); margin-bottom: var(--snice-spacing-2xs, 0.25rem); }
        [data-snice-spotlight-portal] .popover-description { font-size: var(--snice-font-size-md, 1rem); color: var(--snice-color-text-secondary, rgb(82 82 82)); line-height: var(--snice-line-height-normal, 1.5); margin-bottom: var(--snice-spacing-sm, 0.75rem); }
        [data-snice-spotlight-portal] .popover-footer { display: flex; align-items: center; justify-content: space-between; gap: var(--snice-spacing-xs, 0.5rem); }
        [data-snice-spotlight-portal] .step-indicator { font-size: var(--snice-font-size-sm, 0.875rem); color: var(--snice-color-text-tertiary, rgb(115 115 115)); }
        [data-snice-spotlight-portal] .popover-actions { display: flex; gap: var(--snice-spacing-2xs, 0.25rem); }
        [data-snice-spotlight-portal] .btn { padding: var(--snice-spacing-2xs, 0.25rem) var(--snice-spacing-sm, 0.75rem); border-radius: var(--snice-border-radius-md, 0.25rem); font-size: var(--snice-font-size-sm, 0.875rem); cursor: pointer; border: 1px solid var(--snice-color-border, rgb(226 226 226)); background: var(--snice-color-surface, rgb(255 255 255)); color: var(--snice-color-text, rgb(23 23 23)); font-family: inherit; }
        [data-snice-spotlight-portal] .btn:hover { background: var(--snice-color-surface-container-high, rgb(252 251 249)); }
        [data-snice-spotlight-portal] .btn-primary { background: var(--snice-color-primary, rgb(37 99 235)); color: var(--snice-color-text-inverse, rgb(250 250 250)); border-color: var(--snice-color-primary, rgb(37 99 235)); }
        [data-snice-spotlight-portal] .btn-primary:hover { opacity: 0.9; }
        [data-snice-spotlight-portal] .btn-skip { border: none; background: none; color: var(--snice-color-text-tertiary, rgb(115 115 115)); padding: var(--snice-spacing-2xs, 0.25rem); }
        [data-snice-spotlight-portal] .btn-skip:hover { color: var(--snice-color-text, rgb(23 23 23)); }
        @media (prefers-reduced-motion: reduce) {
          [data-snice-spotlight-portal] * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
        }
      </style>
      <div class="overlay" part="base">
        <div class="backdrop" part="backdrop"></div>
        <div class="cutout" part="cutout"></div>
        <div class="popover" part="popover" role="dialog" aria-modal="true"
             aria-labelledby="snice-spotlight-title" aria-describedby="snice-spotlight-desc">
          <div class="popover-title" part="title" id="snice-spotlight-title"></div>
          <div class="popover-description" part="description" id="snice-spotlight-desc"></div>
          <div class="popover-footer" part="footer">
            <span class="step-indicator" part="step-indicator"></span>
            <div class="popover-actions" part="actions"></div>
          </div>
        </div>
      </div>
    `;

    const skinStyle = document.createElement('style');
    skinStyle.setAttribute('data-snice-spotlight-skin', '');
    portal.appendChild(skinStyle);

    // Wire up event handlers
    const backdrop = portal.querySelector('.backdrop') as HTMLElement;
    backdrop?.addEventListener('click', () => this.skip());

    this.portal = portal;
    this.portalSkinStyle = skinStyle;
    this.cutoutEl = portal.querySelector('.cutout');
    this.popoverEl = portal.querySelector('.popover');

    document.body.appendChild(portal);
    this.observePortalContext();
    this.syncPortalPlatformStyles();

    // Listen for scroll and resize to reposition
    this.scrollHandler = () => this.updatePosition();
    this.resizeHandler = () => this.updatePosition();
    window.addEventListener('scroll', this.scrollHandler, true);
    window.addEventListener('resize', this.resizeHandler);
  }

  /** Remove portal from document.body and clean up listeners. */
  private removePortal() {
    this.contextObserver?.disconnect();
    this.contextObserver = null;
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
      this.scrollHandler = null;
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.portal) {
      this.portal.remove();
      this.portal = null;
      this.portalSkinStyle = null;
      this.cutoutEl = null;
      this.popoverEl = null;
    }
  }

  private observePortalContext() {
    this.contextObserver?.disconnect();
    this.contextObserver = null;
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => this.syncPortalPlatformStyles());
    let cur: Element | null = this;
    while (cur) {
      observer.observe(cur, { attributes: true, attributeFilter: ['data-platform', 'data-theme'] });
      cur = cur.parentElement;
    }
    this.contextObserver = observer;
  }

  private rewriteScopedRuleForPortal(rule: CSSRule, platform: string): string {
    if (typeof CSSMediaRule !== 'undefined' && rule instanceof CSSMediaRule) {
      const inner: string[] = [];
      for (const child of Array.from(rule.cssRules)) {
        const rewritten = this.rewriteScopedRuleForPortal(child, platform);
        if (rewritten) inner.push(rewritten);
      }
      return inner.length ? `@media ${rule.conditionText} {\n${inner.join('\n')}\n}` : '';
    }
    if (typeof CSSStyleRule === 'undefined' || !(rule instanceof CSSStyleRule)) return '';
    const selectorText = rule.selectorText || '';
    if (!selectorText.includes('snice-spotlight')) return '';
    const platformRe = new RegExp(`data-platform\\s*=\\s*["']?${platform}["']?(?=[\\]\\s])`);
    const outSelectors = new Set<string>();
    for (const rawSel of selectorText.split(',')) {
      const sel = rawSel.trim();
      if (!sel.includes('snice-spotlight') || !platformRe.test(sel)) continue;
      const partIdx = sel.indexOf('::part(');
      if (partIdx !== -1) {
        const closeIdx = sel.indexOf(')', partIdx + 7);
        if (closeIdx === -1) continue;
        const partTokens = sel.slice(partIdx + 7, closeIdx).trim().split(/\s+/).filter(Boolean);
        const attrChain = partTokens.map(t => `[part~="${t}"]`).join('');
        const suffix = sel.slice(closeIdx + 1);
        outSelectors.add(`[data-snice-spotlight-portal] ${attrChain}${suffix}`);
      } else {
        outSelectors.add('[data-snice-spotlight-portal]');
      }
    }
    if (!outSelectors.size || !rule.style.cssText) return '';
    return `${Array.from(outSelectors).join(', ')} { ${rule.style.cssText} }`;
  }

  private rewriteAdoptedRuleForPortal(rule: CSSRule): string {
    if (typeof CSSMediaRule !== 'undefined' && rule instanceof CSSMediaRule) {
      const inner: string[] = [];
      for (const child of Array.from(rule.cssRules)) {
        const rewritten = this.rewriteAdoptedRuleForPortal(child);
        if (rewritten) inner.push(rewritten);
      }
      return inner.length ? `@media ${rule.conditionText} {\n${inner.join('\n')}\n}` : '';
    }
    if (typeof CSSStyleRule === 'undefined' || !(rule instanceof CSSStyleRule)) return '';
    const selectorText = rule.selectorText || '';
    if (!selectorText.includes('[part~=')) return '';
    const outSelectors = selectorText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.replace(/^:host(?:\([^)]*\))?\s*/, '').trim())
      .filter(Boolean)
      .map(s => `[data-snice-spotlight-portal] ${s}`);
    if (!outSelectors.length || !rule.style.cssText) return '';
    return `${outSelectors.join(', ')} { ${rule.style.cssText} }`;
  }

  private syncPortalPlatformStyles() {
    if (!this.portal || !this.portalSkinStyle) return;

    const platformHost = this.closest('[data-platform]');
    const platform = platformHost?.getAttribute('data-platform') || '';
    if (platform) {
      this.portal.setAttribute('data-platform', platform);
    } else {
      this.portal.removeAttribute('data-platform');
    }

    const themeHost = this.closest('[data-theme]');
    const scopedTheme = themeHost && themeHost !== document.documentElement
      ? themeHost.getAttribute('data-theme')
      : null;
    if (scopedTheme) {
      this.portal.setAttribute('data-theme', scopedTheme);
    } else {
      this.portal.removeAttribute('data-theme');
    }

    const chunks: string[] = [];

    if (platform) {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        for (const rule of Array.from(rules)) {
          const rewritten = this.rewriteScopedRuleForPortal(rule, platform);
          if (rewritten) chunks.push(rewritten);
        }
      }
    }

    const adopted = this.shadowRoot?.adoptedStyleSheets;
    if (adopted?.length) {
      for (const sheet of adopted) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        for (const rule of Array.from(rules)) {
          const rewritten = this.rewriteAdoptedRuleForPortal(rule);
          if (rewritten) chunks.push(rewritten);
        }
      }
    }

    this.portalSkinStyle.textContent = chunks.join('\n');
  }

  /** Update the portal HTML to reflect current step state. */
  private updatePortalContent() {
    if (!this.portal) return;

    const step = this.currentIndex >= 0 ? this.steps[this.currentIndex] : null;
    const isLast = this.currentIndex === this.steps.length - 1;
    const isFirst = this.currentIndex === 0;

    // Update popover content
    const titleEl = this.portal.querySelector('.popover-title') as HTMLElement;
    const descEl = this.portal.querySelector('.popover-description') as HTMLElement;
    const indicatorEl = this.portal.querySelector('.step-indicator') as HTMLElement;
    const actionsEl = this.portal.querySelector('.popover-actions') as HTMLElement;
    const popoverEl = this.popoverEl;

    if (!step || !popoverEl) return;

    popoverEl.style.display = '';
    if (titleEl) titleEl.textContent = step.title;
    if (descEl) descEl.textContent = step.description;
    if (indicatorEl) indicatorEl.textContent = `${this.currentIndex + 1} / ${this.steps.length}`;

    if (actionsEl) {
      actionsEl.innerHTML = '';

      const skipBtn = document.createElement('button');
      skipBtn.className = 'btn btn-skip';
      skipBtn.setAttribute('part', 'button button-skip');
      skipBtn.textContent = 'Skip';
      skipBtn.addEventListener('click', () => this.skip());
      actionsEl.appendChild(skipBtn);

      if (!isFirst) {
        const backBtn = document.createElement('button');
        backBtn.className = 'btn';
        backBtn.setAttribute('part', 'button button-back');
        backBtn.textContent = 'Back';
        backBtn.addEventListener('click', () => this.prev());
        actionsEl.appendChild(backBtn);
      }

      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-primary';
      nextBtn.setAttribute('part', 'button button-next');
      nextBtn.textContent = isLast ? 'Done' : 'Next';
      nextBtn.addEventListener('click', () => this.next());
      actionsEl.appendChild(nextBtn);
    }
  }

  /** Position the cutout and popover over the current target. */
  private updatePosition() {
    if (this.currentIndex < 0 || !this.steps[this.currentIndex]) return;
    if (!this.cutoutEl || !this.popoverEl) return;

    const step = this.steps[this.currentIndex];
    const target = document.querySelector(step.target);
    if (!target) {
      // Target disappeared (e.g. route change removed it). Emit an event so
      // the app can respond instead of the popover silently vanishing.
      this.dispatchEvent(new CustomEvent('spotlight-target-missing', {
        bubbles: true,
        composed: true,
        detail: { step, index: this.currentIndex },
      }));
      return;
    }

    const rect = target.getBoundingClientRect();
    const padding = 8;

    // Position cutout
    this.cutoutEl.style.top = `${rect.top - padding}px`;
    this.cutoutEl.style.left = `${rect.left - padding}px`;
    this.cutoutEl.style.width = `${rect.width + padding * 2}px`;
    this.cutoutEl.style.height = `${rect.height + padding * 2}px`;

    // Position popover
    const position = step.position || 'auto';
    this.positionPopover(rect, position, padding);
  }

  private positionPopover(targetRect: DOMRect, position: string, padding: number) {
    const popover = this.popoverEl;
    if (!popover) return;

    const gap = 12;
    const margin = 8;
    popover.style.top = '';
    popover.style.left = '';
    popover.style.bottom = '';
    popover.style.right = '';

    const popRect = popover.getBoundingClientRect();
    const popWidth = popover.offsetWidth || popRect.width || 280;
    const popHeight = popover.offsetHeight || popRect.height || 160;

    let pos = position;
    if (pos === 'auto') {
      const spaceBelow = window.innerHeight - targetRect.bottom;
      const spaceAbove = targetRect.top;
      pos = spaceBelow > popHeight + padding + gap ? 'bottom' : spaceAbove > popHeight + padding + gap ? 'top' : 'bottom';
    }

    let top = 0;
    let left = 0;

    switch (pos) {
      case 'bottom':
        top = targetRect.bottom + padding + gap;
        left = targetRect.left;
        break;
      case 'top':
        top = targetRect.top - padding - gap - popHeight;
        left = targetRect.left;
        break;
      case 'left':
        top = targetRect.top;
        left = targetRect.left - padding - gap - popWidth;
        break;
      case 'right':
        top = targetRect.top;
        left = targetRect.right + padding + gap;
        break;
      default:
        top = targetRect.bottom + padding + gap;
        left = targetRect.left;
        break;
    }

    // Clamp to viewport bounds
    const maxLeft = Math.max(margin, window.innerWidth - popWidth - margin);
    const maxTop = Math.max(margin, window.innerHeight - popHeight - margin);
    left = Math.max(margin, Math.min(left, maxLeft));
    top = Math.max(margin, Math.min(top, maxTop));

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }

  /** Scroll target into view, then position once scroll settles. */
  private scrollAndPosition() {
    if (this.currentIndex < 0 || !this.steps[this.currentIndex]) return;

    const step = this.steps[this.currentIndex];
    const target = document.querySelector(step.target);
    if (target) {
      // Use instant scroll so getBoundingClientRect is accurate immediately
      target.scrollIntoView?.({ behavior: 'instant', block: 'center' });
    }
    // updatePosition emits spotlight-target-missing if the target is gone
    this.updatePosition();
  }

  start() {
    if (this.steps.length === 0) return;
    this.createPortal();
    this.active = true;
    this.currentIndex = 0;
    this.updatePortalContent();
    this.emitStart();
    this.scrollAndPosition();
  }

  next() {
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      this.updatePortalContent();
      this.emitStep();
      this.scrollAndPosition();
    } else {
      this.end();
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updatePortalContent();
      this.emitStep();
      this.scrollAndPosition();
    }
  }

  goToStep(index: number) {
    if (index >= 0 && index < this.steps.length) {
      this.currentIndex = index;
      if (!this.active) {
        this.createPortal();
        this.active = true;
      }
      this.updatePortalContent();
      this.emitStep();
      this.scrollAndPosition();
    }
  }

  end() {
    this.active = false;
    this.currentIndex = -1;
    this.removePortal();
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
