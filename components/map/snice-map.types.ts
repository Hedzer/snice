export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  icon?: string;
  popup?: string;
}

export interface MapCenter {
  lat: number;
  lng: number;
}

export interface SniceMapElement extends HTMLElement {
  center: MapCenter;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  markers: MapMarker[];
  tileUrl: string;

  setCenter(lat: number, lng: number): void;
  setZoom(zoom: number): void;
  addMarker(marker: MapMarker): void;
  removeMarker(id: string): void;
  fitBounds(markers?: MapMarker[]): void;
}

export interface SniceMapEventMap {
  'map-click': CustomEvent<{ lat: number; lng: number }>;
  'marker-click': CustomEvent<{ marker: MapMarker }>;
  'map-move': CustomEvent<{ center: MapCenter; zoom: number }>;
  'map-zoom': CustomEvent<{ zoom: number }>;
}
