import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/location/snice-location';
import type { SniceLocationElement } from '../../components/location/snice-location.types';

describe('snice-location', () => {
  let location: SniceLocationElement;

  afterEach(() => {
    if (location) {
      removeComponent(location as HTMLElement);
    }
  });

  it('should render', async () => {
    location = await createComponent<SniceLocationElement>('snice-location');
    expect(location).toBeTruthy();
  });

  it('should have default properties', async () => {
    location = await createComponent<SniceLocationElement>('snice-location');
    expect(location.mode).toBe('full');
    expect(location.name).toBe('');
    expect(location.showIcon).toBe(true);
    expect(location.clickable).toBe(false);
  });

  it('should display location name', async () => {
    location = await createComponent<SniceLocationElement>('snice-location', {
      name: 'Central Park'
    });
    expect(location.name).toBe('Central Park');
  });

  it('should display address', async () => {
    location = await createComponent<SniceLocationElement>('snice-location', {
      address: '123 Main St',
      city: 'New York',
      state: 'NY'
    });
    expect(location.address).toBe('123 Main St');
    expect(location.city).toBe('New York');
    expect(location.state).toBe('NY');
  });

  it('should display coordinates', async () => {
    location = await createComponent<SniceLocationElement>('snice-location', {
      latitude: 40.7829,
      longitude: -73.9654
    });
    expect(location.latitude).toBe(40.7829);
    expect(location.longitude).toBe(-73.9654);
  });

  it('should support display modes', async () => {
    location = await createComponent<SniceLocationElement>('snice-location', {
      mode: 'compact'
    });
    expect(location.mode).toBe('compact');
  });

  it('should get full address', async () => {
    location = await createComponent<SniceLocationElement>('snice-location', {
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      'zip-code': '10001',
      country: 'USA'
    });
    const fullAddress = location.getFullAddress();
    expect(fullAddress).toBe('123 Main St, New York, NY, 10001, USA');
  });

  it('should get coordinates', async () => {
    location = await createComponent<SniceLocationElement>('snice-location', {
      latitude: 40.7829,
      longitude: -73.9654
    });
    const coords = location.getCoordinates();
    expect(coords).toEqual({ latitude: 40.7829, longitude: -73.9654 });
  });

  it('should return null for invalid coordinates', async () => {
    location = await createComponent<SniceLocationElement>('snice-location');
    const coords = location.getCoordinates();
    expect(coords).toBeNull();
  });

  it('should get location data', async () => {
    location = await createComponent<SniceLocationElement>('snice-location', {
      name: 'Office',
      address: '123 Main St',
      city: 'Boston',
      latitude: 42.3601,
      longitude: -71.0589
    });
    const data = location.getData();
    expect(data.name).toBe('Office');
    expect(data.address).toBe('123 Main St');
    expect(data.city).toBe('Boston');
    expect(data.latitude).toBe(42.3601);
    expect(data.longitude).toBe(-71.0589);
  });

  it('should support custom icon', async () => {
    location = await createComponent<SniceLocationElement>('snice-location', {
      icon: '🏢'
    });
    expect(location.icon).toBe('🏢');
  });

  it('should support icon image', async () => {
    location = await createComponent<SniceLocationElement>('snice-location', {
      'icon-image': '/icon.png'
    });
    expect(location.iconImage).toBe('/icon.png');
  });

  it('should support show map', async () => {
    location = await createComponent<SniceLocationElement>('snice-location', {
      showMap: true
    });
    expect(location.showMap).toBe(true);
  });

  it('should support clickable', async () => {
    location = await createComponent<SniceLocationElement>('snice-location', {
      clickable: true
    });
    expect(location.clickable).toBe(true);
  });

  it('should support custom map URL', async () => {
    location = await createComponent<SniceLocationElement>('snice-location', {
      'map-url': 'https://example.com/map'
    });
    expect(location.mapUrl).toBe('https://example.com/map');
  });
});
