import { element, property, watch, ready, render, styles, html, css as cssTag } from 'snice';
import cssContent from './snice-skeleton.css?inline';
import type { SkeletonVariant, SkeletonAnimation, SniceSkeletonElement } from './snice-skeleton.types';

@element('snice-skeleton')
export class SniceSkeleton extends HTMLElement implements SniceSkeletonElement {
  @property({  })
  variant: SkeletonVariant = 'text';

  @property({  })
  width = '';

  @property({  })
  height = '';

  @property({  })
  animation: SkeletonAnimation = 'wave';

  @property({ type: Number,  })
  count = 1;

  @property({  })
  spacing = '8px';

  @render()
  render() {
    const items = Array(this.count).fill(0);
    const skeletonClass = `skeleton skeleton--${this.variant} skeleton--${this.animation}`;
    const inlineStyles = this.getInlineStyles();

    return html`
      <div class="skeleton-container" style="gap: ${this.spacing}">
        ${items.map(() => html`
          <div class="${skeletonClass}"
               style="${inlineStyles}"
               role="status"
               aria-label="Loading...">
            <span class="skeleton-screen-reader">Loading...</span>
          </div>
        `)}
      </div>
    `;
  }

  @styles()
  styles() {
    return cssTag`${cssContent}`;
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
}