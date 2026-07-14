import { element, property, watch, ready, render, styles, html, css, unsafeHTML } from 'snice';
import cssContent from './snice-cell-location.css?inline';
import type { SniceCellElement, ColumnDefinition } from './snice-table.types';
import { installCellPresentation } from './table-cell-presentation';

@element('snice-cell-location')
export class SniceCellLocation extends HTMLElement implements SniceCellElement {
  @property({ type: String })
  value: string = '';

  @property({ type: String })
  address: string = '';

  @property({ type: String })
  latitude: string = '';

  @property({ type: String })
  longitude: string = '';

  @property({ type: Boolean })
  showMapLink: boolean = true;

  @property({ type: String })
  mapProvider: 'google' | 'openstreetmap' | 'apple' = 'google';

  @property({ type: Boolean })
  showIcon: boolean = true;

  @property({ type: Object, attribute: false })
  column: ColumnDefinition | null = null;

  @property({ type: Object, attribute: false })
  rowData: any = null;

  @property({ type: String })
  align: 'left' | 'center' | 'right' = 'left';

  @property({ type: String })
  type: string = 'location';

  @render()
  render() {
    const locationValue = this.address || this.value;
    const iconHTML = this.showIcon ? '<span class="location-icon">📍</span>' : '';
    const mapLink = this.getMapLink();

    if (!locationValue && !this.latitude && !this.longitude) {
      return html/*html*/`
        <div class="cell-content cell-content--location" part="content">
          <span class="location-empty"></span>
        </div>
      `;
    }

    const displayText = locationValue || `${this.latitude}, ${this.longitude}`;

    return html/*html*/`
      <div class="cell-content cell-content--location" part="content">
        ${unsafeHTML(iconHTML)}
        ${this.showMapLink && mapLink
          ? html`<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="location-link" part="link">
              ${displayText}
            </a>`
          : html`<span class="location-text">${displayText}</span>`
        }
      </div>
    `;
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  @ready()
  init() {
    installCellPresentation(this, true);
    this.updateLocationAttributes();
  }

  @watch('value', 'column')
  updateLocationAttributes() {
    if (this.column?.locationFormat) {
      const format = this.column.locationFormat;
      this.address = format.address || this.value;
      const latitude = format.latitude ?? format.lat;
      const longitude = format.longitude ?? format.lng;
      this.latitude = latitude !== undefined && latitude !== null ? String(latitude) : '';
      this.longitude = longitude !== undefined && longitude !== null ? String(longitude) : '';
      this.showMapLink = format.showMapLink ?? true;
      this.mapProvider = format.mapProvider || 'google';
      this.showIcon = format.showIcon ?? true;
    }
  }

  private getMapLink(): string {
    if (!this.showMapLink) {
      return '';
    }

    const address = this.address || this.value;
    const lat = this.latitude;
    const lon = this.longitude;

    switch (this.mapProvider) {
      case 'google':
        if (lat && lon) {
          return `https://www.google.com/maps?q=${lat},${lon}`;
        }
        if (address) {
          return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        }
        return '';

      case 'openstreetmap':
        if (lat && lon) {
          return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15`;
        }
        if (address) {
          return `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;
        }
        return '';

      case 'apple':
        if (lat && lon) {
          return `https://maps.apple.com/?ll=${lat},${lon}`;
        }
        if (address) {
          return `https://maps.apple.com/?address=${encodeURIComponent(address)}`;
        }
        return '';

      default:
        return '';
    }
  }
}
