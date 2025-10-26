import { element, property, watch, ready, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-cell-link.css?inline';
import type { SniceCellElement, ColumnDefinition } from './snice-table.types';

@element('snice-cell-link')
export class SniceCellLink extends HTMLElement implements SniceCellElement {
  @property({ type: String })
  value: string = '';

  @property({ type: String })
  href: string = '';

  @property({ type: String })
  target: string = '_self';

  @property({ type: Boolean, attribute: 'external' })
  external: boolean = false;

  @property({ type: String })
  icon: string = '';

  @property({ type: String })
  text: string = '';

  @property({ type: Object })
  column: ColumnDefinition | null = null;

  @property({ type: Object })
  rowData: any = null;

  @property({ type: String })
  align: 'left' | 'center' | 'right' = 'left';

  @property({ type: String })
  type: string = 'link';

  @render()
  render() {
    const linkHref = this.href || this.value;
    const linkText = this.text || this.value;
    const isExternal = this.external || this.target === '_blank' || linkHref.startsWith('http');

    const iconHTML = this.icon ? `<span class="link-icon">${this.icon}</span>` : '';
    const externalIcon = isExternal ? '<span class="external-icon">↗</span>' : '';

    return html/*html*/`
      <div class="cell-content cell-content--link" part="content">
        <a
          href="${linkHref}"
          target="${isExternal ? '_blank' : this.target}"
          rel="${isExternal ? 'noopener noreferrer' : ''}"
          class="cell-link"
          part="link"
        >
          ${unsafeHTML(iconHTML)}
          <span class="link-text">${linkText}</span>
          ${unsafeHTML(externalIcon)}
        </a>
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    this.updateCellAttributes();
  }

  @watch('value', 'column')
  updateCellAttributes() {
    // Extract link properties from column config
    if (this.column?.linkFormat) {
      const format = this.column.linkFormat;
      this.href = format.href || this.value;
      this.target = format.target || '_self';
      this.external = format.external || false;
      this.icon = format.icon || '';
      this.text = format.text || this.value;
    }
  }
}
