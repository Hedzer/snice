import { element, property, render, styles, html, css, dispatch } from 'snice';
import cssContent from './snice-link.css?inline';
import type { LinkVariant, LinkTarget, SniceLinkElement } from './snice-link.types';

@element('snice-link')
export class SniceLink extends HTMLElement implements SniceLinkElement {
  @property({  })
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

  @dispatch('click')
  private handleClick(e: MouseEvent) {
    if (this.disabled) {
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

    // Compute href with hash prefix if needed
    let computedHref = this.href || '';
    if (this.hash && computedHref && !computedHref.startsWith('#')) {
      computedHref = `#${computedHref}`;
    }
    if (!computedHref) {
      computedHref = '#';
    }

    return html/*html*/`
      <a
        href="${computedHref}"
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
