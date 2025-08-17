import { element, property, watch, ready } from '../../src/index';
import css from './snice-skeleton.css?inline';
import type { SkeletonVariant, SkeletonAnimation, SniceSkeletonElement } from './snice-skeleton.types';

@element('snice-skeleton')
export class SniceSkeleton extends HTMLElement implements SniceSkeletonElement {
  @property({ reflect: true })
  variant: SkeletonVariant = 'text';

  @property()
  width = '';

  @property()
  height = '';

  @property({ reflect: true })
  animation: SkeletonAnimation = 'wave';

  @property({ type: Number })
  count = 1;

  @property()
  spacing = '8px';

  html() {
    const items = Array(this.count).fill(0);
    
    return /*html*/`
      <div class="skeleton-container" style="gap: ${this.spacing}">
        ${items.map(() => /*html*/`
          <div class="skeleton skeleton--${this.variant} skeleton--${this.animation}"
               style="${this.getInlineStyles()}"
               role="status"
               aria-label="Loading...">
            <span class="skeleton-screen-reader">Loading...</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  css() {
    return css;
  }

  @ready()
  init() {
    this.updateDimensions();
  }

  @watch('width', 'height')
  updateDimensions() {
    const container = this.shadowRoot?.querySelector('.skeleton-container');
    if (!container) return;
    
    const skeletons = container.querySelectorAll('.skeleton');
    skeletons.forEach(skeleton => {
      (skeleton as HTMLElement).style.cssText = this.getInlineStyles();
    });
  }

  @watch('variant')
  updateVariant() {
    // Re-render when variant changes to apply proper default dimensions
    this.render();
  }

  private getInlineStyles(): string {
    const styles: string[] = [];
    
    // Apply width
    if (this.width) {
      styles.push(`width: ${this.width}`);
    } else {
      // Default widths based on variant
      switch (this.variant) {
        case 'circular':
          styles.push('width: 40px');
          break;
        case 'rectangular':
        case 'rounded':
          styles.push('width: 100%');
          break;
        case 'text':
          styles.push('width: 100%');
          break;
      }
    }
    
    // Apply height
    if (this.height) {
      styles.push(`height: ${this.height}`);
    } else {
      // Default heights based on variant
      switch (this.variant) {
        case 'circular':
          styles.push('height: 40px');
          break;
        case 'rectangular':
        case 'rounded':
          styles.push('height: 120px');
          break;
        case 'text':
          styles.push('height: 20px');
          break;
      }
    }
    
    return styles.join('; ');
  }

  private render() {
    const shadow = this.shadowRoot;
    if (shadow) {
      shadow.innerHTML = '';
      if (this.css) {
        const style = document.createElement('style');
        style.textContent = this.css();
        shadow.appendChild(style);
      }
      const template = document.createElement('template');
      template.innerHTML = this.html();
      shadow.appendChild(template.content.cloneNode(true));
    }
  }
}