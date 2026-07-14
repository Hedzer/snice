import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/map/snice-map';
import type { SniceMapElement } from '../../packages/components/src/map/snice-map.types';

describe('snice-map', () => {
  let map: SniceMapElement;

  afterEach(() => {
    if (map) {
      removeComponent(map as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render map element', async () => {
      map = await createComponent<SniceMapElement>('snice-map');

      expect(map).toBeTruthy();
      expect(map.tagName).toBe('SNICE-MAP');
    });

    it('should have default properties', async () => {
      map = await createComponent<SniceMapElement>('snice-map');

      expect(map.center).toEqual({ lat: 51.505, lng: -0.09 });
      expect(map.zoom).toBe(13);
      expect(map.minZoom).toBe(1);
      expect(map.maxZoom).toBe(18);
      expect(map.markers).toEqual([]);
    });

    it('should render map structure', async () => {
      map = await createComponent<SniceMapElement>('snice-map');
      await wait(10);

      const container = queryShadow(map as HTMLElement, '.map-container');
      expect(container).toBeTruthy();

      const tiles = queryShadow(map as HTMLElement, '.map-tiles');
      expect(tiles).toBeTruthy();

      const controls = queryShadow(map as HTMLElement, '.map-controls');
      expect(controls).toBeTruthy();
    });
  });

  describe('properties', () => {
    it('should accept center object', async () => {
      map = await createComponent<SniceMapElement>('snice-map');

      const newCenter = { lat: 40.7128, lng: -74.006 };
      map.center = newCenter;

      expect(map.center).toEqual(newCenter);
    });

    it('should accept zoom attribute', async () => {
      map = await createComponent<SniceMapElement>('snice-map', {
        zoom: 10
      });

      expect(map.zoom).toBe(10);
    });

    it('should accept min-zoom and max-zoom', async () => {
      map = await createComponent<SniceMapElement>('snice-map', {
        'min-zoom': 3,
        'max-zoom': 15
      });

      expect(map.minZoom).toBe(3);
      expect(map.maxZoom).toBe(15);
    });
  });

  describe('API methods', () => {
    it('should have setCenter method', async () => {
      map = await createComponent<SniceMapElement>('snice-map');

      expect(typeof map.setCenter).toBe('function');
    });

    it('should have setZoom method', async () => {
      map = await createComponent<SniceMapElement>('snice-map');

      expect(typeof map.setZoom).toBe('function');
    });

    it('should have addMarker method', async () => {
      map = await createComponent<SniceMapElement>('snice-map');

      expect(typeof map.addMarker).toBe('function');
    });

    it('should have removeMarker method', async () => {
      map = await createComponent<SniceMapElement>('snice-map');

      expect(typeof map.removeMarker).toBe('function');
    });

    it('should have fitBounds method', async () => {
      map = await createComponent<SniceMapElement>('snice-map');

      expect(typeof map.fitBounds).toBe('function');
    });

    it('should add marker correctly', async () => {
      map = await createComponent<SniceMapElement>('snice-map');

      const marker = { id: '1', lat: 51.5, lng: -0.1, label: 'Test' };
      map.addMarker(marker);

      expect(map.markers).toHaveLength(1);
      expect(map.markers[0].id).toBe('1');
    });

    it('should remove marker correctly', async () => {
      map = await createComponent<SniceMapElement>('snice-map');

      const marker = { id: '1', lat: 51.5, lng: -0.1, label: 'Test' };
      map.addMarker(marker);
      expect(map.markers).toHaveLength(1);

      map.removeMarker('1');
      expect(map.markers).toHaveLength(0);
    });
  });

  describe('events', () => {
    it('should dispatch map-move event', async () => {
      map = await createComponent<SniceMapElement>('snice-map');

      let eventFired = false;
      map.addEventListener('map-move', () => {
        eventFired = true;
      });

      map.setCenter(40, -74);
      await wait(10);

      expect(eventFired).toBe(true);
    });

    it('should dispatch map-zoom event', async () => {
      map = await createComponent<SniceMapElement>('snice-map');

      let eventFired = false;
      map.addEventListener('map-zoom', () => {
        eventFired = true;
      });

      map.setZoom(8);
      await wait(10);

      expect(eventFired).toBe(true);
    });
  });

  describe('keyboard pan/zoom on .map-container (@on decorator)', () => {
    const dispatchKey = (el: HTMLElement, key: string) => {
      const container = el.shadowRoot!.querySelector('.map-container') as HTMLElement;
      container.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
    };

    it('container is keyboard-focusable', async () => {
      map = await createComponent<SniceMapElement>('snice-map');
      const container = queryShadow(map as HTMLElement, '.map-container');
      expect(container?.getAttribute('tabindex')).toBe('0');
      expect(container?.getAttribute('role')).toBe('application');
    });

    it('+ key increases zoom', async () => {
      map = await createComponent<SniceMapElement>('snice-map', { zoom: 5 } as any);
      await wait(20);
      dispatchKey(map as HTMLElement, '+');
      await wait(10);
      expect(map.zoom).toBe(6);
    });

    it('- key decreases zoom', async () => {
      map = await createComponent<SniceMapElement>('snice-map', { zoom: 5 } as any);
      await wait(20);
      dispatchKey(map as HTMLElement, '-');
      await wait(10);
      expect(map.zoom).toBe(4);
    });

    it('ArrowLeft pans west (lng decreases)', async () => {
      map = await createComponent<SniceMapElement>('snice-map');
      map.setCenter(40, -74);
      map.setZoom(5);
      await wait(20);
      const lngBefore = map.center.lng;
      dispatchKey(map as HTMLElement, 'ArrowLeft');
      await wait(10);
      expect(map.center.lng).toBeLessThan(lngBefore);
    });

    it('ArrowRight pans east (lng increases)', async () => {
      map = await createComponent<SniceMapElement>('snice-map');
      map.setCenter(40, -74);
      map.setZoom(5);
      await wait(20);
      const lngBefore = map.center.lng;
      dispatchKey(map as HTMLElement, 'ArrowRight');
      await wait(10);
      expect(map.center.lng).toBeGreaterThan(lngBefore);
    });
  });
});
