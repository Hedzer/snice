import { element, property, render, styles, dispatch, on, html, css, isSafeUrl, nothing } from 'snice';
import { renderIcon, strictStringAttributeConverter } from '../utils';
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

  @property({ type: String, attribute: 'map-url', converter: strictStringAttributeConverter })
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

  /**
   * Resolve the currently authored location to a navigation or embed URL.
   * Scheme policy remains centralized in core's `isSafeUrl()`; this method
   * only applies location-specific fallback and embed formatting.
   */
  private resolveMapUrl(embed = false): string | null {
    const coords = this.getCoordinates();
    const address = this.getFullAddress();
    let url: unknown = this.mapUrl;

    if (url === '' && coords) {
      url = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}${embed ? '&output=embed' : ''}`;
    } else if (url === '' && address) {
      const query = encodeURIComponent(address);
      url = embed
        ? `https://www.google.com/maps?q=${query}&output=embed`
        : `https://www.google.com/maps/search/?api=1&query=${query}`;
    }

    if (typeof url !== 'string') return null;
    const href = url.trim();
    return href && isSafeUrl(href) ? href : null;
  }

  openMap(): void {
    const url = this.resolveMapUrl();
    if (!url) return;

    window.open(url, '_blank', 'noopener');
  }

  @on('click')
  private handleClick() {
    if (!this.clickable) return;

    this.dispatchLocationClick();
    this.openMap();
  }

  @on('keydown', '.location')
  private handleKeydown(event: KeyboardEvent) {
    if (!this.clickable || event.key !== 'Enter') return;

    event.preventDefault();
    this.click();
  }

  private getMapEmbedUrl(): string {
    return this.resolveMapUrl(true) ?? '';
  }

  @render()
  render() {
    const coords = this.getCoordinates();
    const fullAddress = this.getFullAddress();
    const mapEmbedUrl = this.showMap ? this.getMapEmbedUrl() : '';

    return html/*html*/`
      <div
        class="location ${this.clickable ? 'location--clickable' : ''}"
        part="base"
        role=${this.clickable ? 'link' : nothing}
        tabindex=${this.clickable ? '0' : nothing}
      >
        <if ${this.showIcon}>
          <div class="icon" part="icon">
            <slot name="icon">
              ${renderIcon(this.iconImage || this.icon, 'location-icon')}
            </slot>
          </div>
        </if>

        <div class="content" part="content">
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
            <div class="map-container" part="map">
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
