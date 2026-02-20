import { element, property, render, styles, dispatch, html, css } from 'snice';
import { renderIcon } from '../utils';
import type { SniceLocationElement, LocationData, LocationDisplayMode } from './snice-location.types';
import locationStyles from './snice-location.css?inline';

@element('snice-location')
export class SniceLocation extends HTMLElement implements SniceLocationElement {
  @property({ attribute: 'mode' })
  mode: LocationDisplayMode = 'full';

  @property()
  name = '';

  @property()
  address = '';

  @property()
  city = '';

  @property()
  state = '';

  @property()
  country = '';

  @property({ attribute: 'zip-code' })
  zipCode = '';

  @property({ type: Number })
  latitude: number | string = '';

  @property({ type: Number })
  longitude: number | string = '';

  @property({ type: Boolean, attribute: 'show-map' })
  showMap = false;

  @property({ type: Boolean, attribute: 'show-icon' })
  showIcon = true;

  @property()
  icon = '📍';

  @property({ attribute: 'icon-image' })
  iconImage = '';

  @property({ attribute: 'map-url' })
  mapUrl = '';

  @property({ type: Boolean })
  clickable = false;

  @dispatch('location-click', { bubbles: true, composed: true })
  private dispatchLocationClick() {
    return this.getData();
  }

  @styles()
  private styles() {
    return css/*css*/`${locationStyles}`;
  }

  getData(): LocationData {
    return {
      name: this.name,
      address: this.address,
      city: this.city,
      state: this.state,
      country: this.country,
      zipCode: this.zipCode,
      latitude: typeof this.latitude === 'number' ? this.latitude : parseFloat(this.latitude as string),
      longitude: typeof this.longitude === 'number' ? this.longitude : parseFloat(this.longitude as string),
    };
  }

  getCoordinates(): { latitude: number; longitude: number } | null {
    const lat = typeof this.latitude === 'number' ? this.latitude : parseFloat(this.latitude as string);
    const lng = typeof this.longitude === 'number' ? this.longitude : parseFloat(this.longitude as string);

    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
    return null;
  }

  getFullAddress(): string {
    const parts = [
      this.address,
      this.city,
      this.state,
      this.zipCode,
      this.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  openMap(): void {
    const coords = this.getCoordinates();
    let url = this.mapUrl;

    if (!url && coords) {
      url = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
    } else if (!url && this.getFullAddress()) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.getFullAddress())}`;
    }

    if (url) {
      window.open(url, '_blank');
    }
  }

  private handleClick() {
    if (this.clickable) {
      this.dispatchLocationClick();
      this.openMap();
    }
  }

  private getMapEmbedUrl(): string {
    const coords = this.getCoordinates();

    if (this.mapUrl) {
      return this.mapUrl;
    }

    if (coords) {
      return `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}&output=embed`;
    }

    const address = this.getFullAddress();
    if (address) {
      return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
    }

    return '';
  }

  @render()
  render() {
    const coords = this.getCoordinates();
    const fullAddress = this.getFullAddress();
    const mapEmbedUrl = this.showMap ? this.getMapEmbedUrl() : '';

    return html/*html*/`
      <div class="location ${this.clickable ? 'location--clickable' : ''}" @click=${() => this.handleClick()}>
        <if ${this.showIcon}>
          <div class="icon">
            <slot name="icon">
              ${renderIcon(this.iconImage || this.icon, 'location-icon')}
            </slot>
          </div>
        </if>

        <div class="content">
          <if ${this.name && (this.mode === 'full' || this.mode === 'compact' || this.mode === 'address')}>
            <div class="name">${this.name}</div>
          </if>

          <if ${fullAddress && (this.mode === 'full' || this.mode === 'compact' || this.mode === 'address')}>
            <div class="address">${fullAddress}</div>
          </if>

          <if ${coords && (this.mode === 'full' || this.mode === 'compact' || this.mode === 'coordinates')}>
            <div class="coordinates">${coords ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}` : ''}</div>
          </if>

          <if ${this.showMap && mapEmbedUrl}>
            <div class="map-container">
              <iframe src="${mapEmbedUrl}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>
          </if>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snice-location': SniceLocation;
  }
}
