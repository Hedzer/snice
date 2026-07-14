export type LocationDisplayMode = 'full' | 'compact' | 'coordinates' | 'address';

export interface LocationData {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface SniceLocationElement extends HTMLElement {
  mode: LocationDisplayMode;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude: number | string;
  longitude: number | string;
  showMap: boolean;
  showIcon: boolean;
  icon: string;
  iconImage: string;
  mapUrl: string;
  clickable: boolean;

  getData(): LocationData;
  getCoordinates(): { latitude: number; longitude: number } | null;
  getFullAddress(): string;
  openMap(): void;
}
