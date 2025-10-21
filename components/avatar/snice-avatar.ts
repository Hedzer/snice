import { element, property, query, render, styles, html, css } from 'snice';
import cssContent from './snice-avatar.css?inline';
import type { AvatarSize, AvatarShape, SniceAvatarElement } from './snice-avatar.types';

@element('snice-avatar')
export class SniceAvatar extends HTMLElement implements SniceAvatarElement {
  @property({  })
  src = '';

  @property({  })
  alt = '';

  @property({  })
  name = '';

  @property({  })
  size: AvatarSize = 'medium';

  @property({  })
  shape: AvatarShape = 'circle';

  @property({ attribute: 'fallback-color',  })
  fallbackColor = '#ffffff';

  @property({ attribute: 'fallback-background',  })
  fallbackBackground = '';

  @query('.avatar-image')
  imageElement?: HTMLImageElement;

  @query('.avatar-fallback')
  fallbackElement?: HTMLElement;

  @property({ type: Boolean, attribute: false })
  private imageError = false;

  @render()
  renderContent() {
    const colorClass = this.fallbackBackground ? '' : this.getColorClass(this.name);
    const bgStyle = this.fallbackBackground ? `--avatar-bg: ${this.fallbackBackground}; --avatar-color: ${this.fallbackColor}` : '';
    const initials = this.getInitials(this.name);
    const avatarClasses = ['avatar', colorClass].filter(Boolean).join(' ');
    const imageClasses = ['avatar-image', this.imageError ? 'avatar-image--error' : ''].filter(Boolean).join(' ');
    const fallbackClasses = ['avatar-fallback', !this.src || this.imageError ? 'avatar-fallback--visible' : ''].filter(Boolean).join(' ');

    return html/*html*/`
      <div class="${avatarClasses}" style="${bgStyle}">
        <if ${this.src}>
          <img class="${imageClasses}"
               src="${this.src}"
               alt="${this.alt || this.name}"
               loading="lazy"
               @load=${this.handleImageLoad}
               @error=${this.handleImageError}>
        </if>
        <div class="${fallbackClasses}">
          <case ${initials}>
            <when value="">
              <svg class="avatar-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </when>
            <default>
              ${initials}
            </default>
          </case>
        </div>
      </div>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  handleImageLoad() {
    this.imageError = false;
  }

  handleImageError() {
    this.imageError = true;
  }


  getInitials(name: string): string {
    if (!name) return '';
    const words = name.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return '';
    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    // Use first and second word (not first and last)
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  private getColorClass(name: string): string {
    if (!name) return '';
    
    const colors = [
      'red', 'orange', 'yellow', 'lime', 'green',
      'teal', 'cyan', 'sky', 'blue', 'indigo',
      'violet', 'purple', 'fuchsia', 'pink', 'rose'
    ];
    
    // Hash the name to get a consistent index
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colorIndex = Math.abs(hash) % colors.length;
    return `avatar--${colors[colorIndex]}`;
  }

  private renderIcon() {
    return html`
      <svg class="avatar-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    `;
  }
}