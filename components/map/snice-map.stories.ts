import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-map';

type Args = {
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomEnabled?: boolean;
  dragEnabled?: boolean;
};

const europeanCities = [
  { id: 'paris', lat: 48.8566, lng: 2.3522, label: 'Paris' },
  { id: 'london', lat: 51.5074, lng: -0.1278, label: 'London' },
  { id: 'berlin', lat: 52.52, lng: 13.405, label: 'Berlin' },
  { id: 'madrid', lat: 40.4168, lng: -3.7038, label: 'Madrid' },
  { id: 'rome', lat: 41.9028, lng: 12.4964, label: 'Rome' },
];

const usCities = [
  { id: 'ny', lat: 40.7128, lng: -74.006, label: 'New York' },
  { id: 'la', lat: 34.0522, lng: -118.2437, label: 'Los Angeles' },
  { id: 'chi', lat: 41.8781, lng: -87.6298, label: 'Chicago' },
  { id: 'hou', lat: 29.7604, lng: -95.3698, label: 'Houston' },
  { id: 'phx', lat: 33.4484, lng: -112.074, label: 'Phoenix' },
  { id: 'sea', lat: 47.6062, lng: -122.3321, label: 'Seattle' },
  { id: 'mia', lat: 25.7617, lng: -80.1918, label: 'Miami' },
  { id: 'den', lat: 39.7392, lng: -104.9903, label: 'Denver' },
];

function makeMap(opts: {
  center?: { lat: number; lng: number };
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  markers?: object[];
  zoomEnabled?: boolean;
  dragEnabled?: boolean;
} = {}): HTMLElement {
  const el = document.createElement('snice-map');
  el.style.cssText = 'display:block;height:300px;border:1px solid var(--snice-color-border,#ddd);border-radius:8px;overflow:hidden;';
  if (opts.center !== undefined) (el as any).center = opts.center;
  if (opts.zoom !== undefined) el.setAttribute('zoom', String(opts.zoom));
  if (opts.minZoom !== undefined) el.setAttribute('min-zoom', String(opts.minZoom));
  if (opts.maxZoom !== undefined) el.setAttribute('max-zoom', String(opts.maxZoom));
  if (opts.markers !== undefined) (el as any).markers = opts.markers;
  if (opts.zoomEnabled === false) el.setAttribute('zoom-enabled', 'false');
  if (opts.dragEnabled === false) el.setAttribute('drag-enabled', 'false');
  return el;
}

const meta: Meta<Args> = {
  title: 'Specialty/Map',
  component: 'snice-map',
  tags: ['autodocs'],
  argTypes: {
    zoom:        { control: 'number' },
    minZoom:     { control: 'number' },
    maxZoom:     { control: 'number' },
    zoomEnabled: { control: 'boolean' },
    dragEnabled: { control: 'boolean' },
  },
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({
      zoom: args.zoom,
      minZoom: args.minZoom,
      maxZoom: args.maxZoom,
      zoomEnabled: args.zoomEnabled,
      dragEnabled: args.dragEnabled,
    }));
    return wrap;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = { args: { zoom: 13 } };

// h2: Default (London, zoom 13)
export const DefaultLondonZoom13: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap());
    return wrap;
  },
};

// h2: Zoom: 3 (continent scale)
export const Zoom3ContinentScale: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({ center: { lat: 20, lng: 0 }, zoom: 3 }));
    return wrap;
  },
};

// h2: Zoom: 8 (region scale)
export const Zoom8RegionScale: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({ center: { lat: 48.8566, lng: 2.3522 }, zoom: 8 }));
    return wrap;
  },
};

// h2: Zoom: 16 (street scale)
export const Zoom16StreetScale: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({ center: { lat: 40.7484, lng: -73.9857 }, zoom: 16 }));
    return wrap;
  },
};

// h2: Min zoom: 5, max zoom: 10
export const MinZoom5MaxZoom10: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({ center: { lat: 40.7128, lng: -74.006 }, zoom: 7, minZoom: 5, maxZoom: 10 }));
    return wrap;
  },
};

// h2: With markers
export const WithMarkers: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({ center: { lat: 48, lng: 5 }, zoom: 5, markers: europeanCities }));
    return wrap;
  },
};

// h2: Markers with popups
export const MarkersWithPopups: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({
      center: { lat: 40.7128, lng: -74.006 },
      zoom: 12,
      markers: [
        { id: 'statue', lat: 40.6892, lng: -74.0445, label: 'Statue of Liberty', popup: 'Statue of Liberty - Gift from France, 1886' },
        { id: 'empire', lat: 40.7484, lng: -73.9857, label: 'Empire State', popup: 'Empire State Building - 102 floors' },
        { id: 'central', lat: 40.7829, lng: -73.9654, label: 'Central Park', popup: 'Central Park - 843 acres' },
      ],
    }));
    return wrap;
  },
};

// h2: Markers with labels
export const MarkersWithLabels: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({
      center: { lat: 37.5, lng: -122 },
      zoom: 10,
      markers: [
        { id: 'sf', lat: 37.7749, lng: -122.4194, label: 'San Francisco' },
        { id: 'sj', lat: 37.3382, lng: -121.8863, label: 'San Jose' },
        { id: 'oak', lat: 37.8044, lng: -122.2712, label: 'Oakland' },
      ],
    }));
    return wrap;
  },
};

// h2: Single marker
export const SingleMarker: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({
      center: { lat: 48.8584, lng: 2.2945 },
      zoom: 14,
      markers: [
        { id: 'eiffel', lat: 48.8584, lng: 2.2945, label: 'Eiffel Tower', popup: 'Tour Eiffel' },
      ],
    }));
    return wrap;
  },
};

// h2: Many markers (fitBounds)
export const ManyMarkersfitBounds: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    const el = makeMap({ markers: usCities });
    wrap.appendChild(el);
    // fitBounds after element is connected
    requestAnimationFrame(() => { (el as any).fitBounds?.(); });
    return wrap;
  },
};

// h2: Zoom disabled
export const ZoomDisabled: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({ center: { lat: 51.5074, lng: -0.1278 }, zoom: 10, zoomEnabled: false }));
    return wrap;
  },
};

// h2: Drag disabled
export const DragDisabled: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({ center: { lat: 51.5074, lng: -0.1278 }, zoom: 10, dragEnabled: false }));
    return wrap;
  },
};

// h2: Both zoom and drag disabled
export const BothZoomAndDragDisabled: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({ center: { lat: 51.5074, lng: -0.1278 }, zoom: 10, zoomEnabled: false, dragEnabled: false }));
    return wrap;
  },
};

// h2: Different center (New York)
export const DifferentCenterNewYork: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({ center: { lat: 40.7128, lng: -74.006 }, zoom: 11 }));
    return wrap;
  },
};

// h2: Different center (Tokyo)
export const DifferentCenterTokyo: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({ center: { lat: 35.6762, lng: 139.6503 }, zoom: 11 }));
    return wrap;
  },
};

// h2: Different center (Sydney)
export const DifferentCenterSydney: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:1rem;';
    wrap.appendChild(makeMap({ center: { lat: -33.8688, lng: 151.2093 }, zoom: 11 }));
    return wrap;
  },
};
