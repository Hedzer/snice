import { element, property, render, styles, html, css, isSafeUrl, nothing } from 'snice';
import { strictStringAttributeConverter } from '../utils';
import cssContent from './snice-link.css?inline';
import type { LinkVariant, LinkTarget, SniceLinkElement } from './snice-link.types';

@element('snice-link')
export class SniceLink extends HTMLElement implements SniceLinkElement {
  @property({ type: String, converter: strictStringAttributeConverter })
  href = '';

  @property({  })
  target: LinkTarget = '_self';

  @property({  })
  variant: LinkVariant = 'default';

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  external = false;

  @property({ type: Boolean })
  underline = false;

  @property({ type: Boolean })
  hash = false;

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  /**
   * Resolve the component's authored value to the exact href exposed by the
   * internal anchor. Scheme validation stays centralized in core's
   * `isSafeUrl()`; this method only applies link-specific empty/hash behavior.
   */
  private getNavigationHref(): string | null {
    if (this.href === '') return '#';
    if (typeof this.href !== 'string') return null;

    const href = this.href.trim();
    if (!href || !isSafeUrl(href)) return null;

    return this.hash && !href.startsWith('#')
      ? `#${href}`
      : href;
  }

  private handleClick(e: MouseEvent) {
    const navigationHref = this.getNavigationHref();
    if (this.disabled || navigationHref === null) {
      e.preventDefault();
      return;
    }

    // Emit navigate event for router integration
    if (this.hash) {
      const navigateEvent = new CustomEvent('navigate', {
        detail: { href: this.href },
        bubbles: true,
        composed: true,
        cancelable: true
      });
      const shouldNavigate = this.dispatchEvent(navigateEvent);

      if (!shouldNavigate) {
        e.preventDefault();
      }
    }
  }

  @render()
  render() {
    const linkClasses = [
      'link',
      `link--${this.variant}`,
      this.underline ? 'link--underline' : '',
      this.disabled ? 'link--disabled' : ''
    ].filter(Boolean).join(' ');

    const linkTarget = this.external ? '_blank' : this.target;
    const linkRel = this.external ? 'noopener noreferrer' : '';

    const navigationHref = this.getNavigationHref();

    return html/*html*/`
      <a
        href=${navigationHref ?? nothing}
        target="${linkTarget}"
        rel="${linkRel}"
        class="${linkClasses}"
        part="link"
        @click="${(e: MouseEvent) => this.handleClick(e)}"
      >
        <slot></slot>
        <if ${this.external}>
          <span class="link__external-icon" part="external-icon">↗</span>
        </if>
      </a>
    `;
  }
}
