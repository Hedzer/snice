import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/location/snice-location';
import type { SniceLocationElement } from '../../packages/components/src/location/snice-location.types';
import { allowedNavigationUrls, unsafeNavigationUrls } from '../navigation-url-cases';

describe('snice-location', () => {
  let location: SniceLocationElement;

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as any).__sniceNavigationInjected;
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

  describe('safe external navigation', () => {
    it.each(unsafeNavigationUrls)(
      'rejects %s (%s) from direct and clickable navigation',
      async (mapUrl) => {
        (globalThis as any).__sniceNavigationInjected = 0;
        location = await createComponent<SniceLocationElement>('snice-location', {
          clickable: true,
          'map-url': mapUrl
        });
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);
        const base = queryShadow(location, '.location') as HTMLElement;

        expect(() => location.openMap()).not.toThrow();
        expect(() => base.click()).not.toThrow();
        expect(open).not.toHaveBeenCalled();
        expect((globalThis as any).__sniceNavigationInjected).toBe(0);
      }
    );

    it.each(allowedNavigationUrls)(
      'opens %s (%s) in an isolated new browsing context',
      async (mapUrl) => {
        location = await createComponent<SniceLocationElement>('snice-location', {
          'map-url': `  ${mapUrl}  `
        });
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);

        location.openMap();

        expect(open).toHaveBeenCalledOnce();
        expect(open).toHaveBeenCalledWith(mapUrl, '_blank', 'noopener');
      }
    );

    it('removes a previously safe map and restores a later safe map', async () => {
      location = await createComponent<SniceLocationElement>('snice-location', {
        showMap: true,
        'map-url': 'https://example.com/safe-before'
      });
      expect(queryShadow(location, 'iframe')?.getAttribute('src')).toBe('https://example.com/safe-before');

      location.mapUrl = 'javascript:globalThis.__sniceNavigationInjected++';
      await wait(10);
      expect(queryShadow(location, 'iframe')).toBeNull();

      location.mapUrl = 'https://example.com/safe-after';
      await wait(10);
      expect(queryShadow(location, 'iframe')?.getAttribute('src')).toBe('https://example.com/safe-after');
    });

    it('responds safely to reflected map-url changes and removal', async () => {
      location = await createComponent<SniceLocationElement>('snice-location', {
        showMap: true,
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        'map-url': 'https://example.com/safe-before'
      });

      location.setAttribute('map-url', 'JaVaScRiPt:globalThis.__sniceNavigationInjected++');
      await wait(10);
      expect(location.mapUrl).toBe('JaVaScRiPt:globalThis.__sniceNavigationInjected++');
      expect(queryShadow(location, 'iframe')).toBeNull();

      location.setAttribute('map-url', 'https://example.com/restored');
      await wait(10);
      expect(queryShadow(location, 'iframe')?.getAttribute('src')).toBe('https://example.com/restored');

      location.removeAttribute('map-url');
      await wait(10);
      expect(location.mapUrl).toBe('');
      expect(queryShadow(location, 'iframe')?.getAttribute('src')).toBe(
        'https://www.google.com/maps?q=123%20Main%20St%2C%20New%20York%2C%20NY&output=embed'
      );
    });

    it.each([null, undefined, false, 0, Number.NaN])(
      'fails closed for a falsey non-string runtime map URL: %j',
      async (mapUrl) => {
        location = await createComponent<SniceLocationElement>('snice-location', {
          showMap: true,
          clickable: true,
          'map-url': 'https://example.com/safe-before'
        });
        const open = vi.spyOn(window, 'open').mockImplementation(() => null);

        expect(() => {
          (location as any).mapUrl = mapUrl;
        }).not.toThrow();
        await wait(10);

        expect(queryShadow(location, 'iframe')).toBeNull();
        expect(() => location.click()).not.toThrow();
        expect(open).not.toHaveBeenCalled();
      }
    );

    it('fails closed without coercing truthy or throwing runtime values', async () => {
      location = await createComponent<SniceLocationElement>('snice-location', {
        showMap: true,
        clickable: true,
        'map-url': 'https://example.com/safe-before'
      });
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);
      const values = [
        { toString: () => 'https://example.com/coerced' },
        { toString: () => { throw new Error('must not convert'); } },
        [],
        1
      ];

      for (const value of values) {
        expect(() => {
          (location as any).mapUrl = value;
        }).not.toThrow();
        await wait(10);
        expect(queryShadow(location, 'iframe')).toBeNull();
        expect(() => location.openMap()).not.toThrow();
      }

      expect(open).not.toHaveBeenCalled();
    });

    it('uses authored whitespace as an invalid URL but preserves exact-empty fallback', async () => {
      location = await createComponent<SniceLocationElement>('snice-location', {
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        'map-url': '   '
      });
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);

      location.openMap();
      expect(open).not.toHaveBeenCalled();

      location.mapUrl = '';
      await wait(10);
      location.openMap();
      expect(open).toHaveBeenCalledOnce();
      expect(open).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=123%20Main%20St%2C%20New%20York%2C%20NY',
        '_blank',
        'noopener'
      );
    });

    it('generates exact coordinate navigation and embed URLs', async () => {
      location = await createComponent<SniceLocationElement>('snice-location', {
        latitude: 40.7829,
        longitude: -73.9654,
        showMap: true
      });
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);

      expect(queryShadow(location, 'iframe')?.getAttribute('src')).toBe(
        'https://www.google.com/maps?q=40.7829,-73.9654&output=embed'
      );
      location.openMap();
      expect(open).toHaveBeenCalledWith(
        'https://www.google.com/maps?q=40.7829,-73.9654',
        '_blank',
        'noopener'
      );
    });

    it('generates exact encoded address navigation and embed URLs', async () => {
      location = await createComponent<SniceLocationElement>('snice-location', {
        address: '10 Main St & 2nd',
        city: 'Montréal',
        country: 'CA',
        showMap: true
      });
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);

      expect(queryShadow(location, 'iframe')?.getAttribute('src')).toBe(
        'https://www.google.com/maps?q=10%20Main%20St%20%26%202nd%2C%20Montr%C3%A9al%2C%20CA&output=embed'
      );
      location.openMap();
      expect(open).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=10%20Main%20St%20%26%202nd%2C%20Montr%C3%A9al%2C%20CA',
        '_blank',
        'noopener'
      );
    });

    it('keeps direct openMap imperative and event-free', async () => {
      location = await createComponent<SniceLocationElement>('snice-location', {
        clickable: true,
        'map-url': '/map'
      });
      const events: CustomEvent[] = [];
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);
      location.addEventListener('location-click', (event) => events.push(event as CustomEvent));

      location.openMap();

      expect(events).toEqual([]);
      expect(open).toHaveBeenCalledWith('/map', '_blank', 'noopener');
    });

    it('does nothing when openMap has no custom URL or location fallback', async () => {
      location = await createComponent<SniceLocationElement>('snice-location');
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);

      expect(() => location.openMap()).not.toThrow();
      expect(open).not.toHaveBeenCalled();
    });

    it.each([
      ['mouse', (element: SniceLocationElement, base: HTMLElement) => base.click()],
      ['keyboard', (element: SniceLocationElement, base: HTMLElement) => {
        base.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          composed: true,
          cancelable: true
        }));
      }],
      ['programmatic', (element: SniceLocationElement) => element.click()]
    ] as const)(
      'uses identical event-before-navigation ordering for %s activation',
      async (_kind, activate) => {
        location = await createComponent<SniceLocationElement>('snice-location', {
          clickable: true,
          name: 'Central Park',
          address: 'Central Park West',
          city: 'New York',
          state: 'NY',
          latitude: 40.7829,
          longitude: -73.9654,
          'map-url': '/map'
        });
        const order: string[] = [];
        const details: unknown[] = [];
        vi.spyOn(window, 'open').mockImplementation(() => {
          order.push('open');
          return null;
        });
        location.addEventListener('location-click', (event) => {
          order.push('event');
          details.push((event as CustomEvent).detail);
        });

        activate(location, queryShadow(location, '.location') as HTMLElement);

        expect(order).toEqual(['event', 'open']);
        expect(details).toEqual([{
          name: 'Central Park',
          address: 'Central Park West',
          city: 'New York',
          state: 'NY',
          country: '',
          zipCode: '',
          latitude: 40.7829,
          longitude: -73.9654
        }]);
        expect(window.open).toHaveBeenCalledWith('/map', '_blank', 'noopener');
      }
    );

    it('prevents the native Enter action and ignores Space and unrelated keys', async () => {
      location = await createComponent<SniceLocationElement>('snice-location', {
        clickable: true,
        'map-url': '/map'
      });
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);
      const base = queryShadow(location, '.location') as HTMLElement;
      const enter = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        composed: true,
        cancelable: true
      });

      expect(base.dispatchEvent(enter)).toBe(false);
      expect(enter.defaultPrevented).toBe(true);
      expect(open).toHaveBeenCalledOnce();

      for (const key of [' ', 'Spacebar', 'Escape', 'ArrowDown']) {
        base.dispatchEvent(new KeyboardEvent('keydown', {
          key,
          bubbles: true,
          composed: true,
          cancelable: true
        }));
      }
      expect(open).toHaveBeenCalledOnce();
    });

    it('keeps every activation inert when clickable is false', async () => {
      location = await createComponent<SniceLocationElement>('snice-location', {
        'map-url': '/map'
      });
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);
      const event = vi.fn();
      const base = queryShadow(location, '.location') as HTMLElement;
      location.addEventListener('location-click', event);

      base.click();
      location.click();
      base.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        composed: true,
        cancelable: true
      }));

      expect(event).not.toHaveBeenCalled();
      expect(open).not.toHaveBeenCalled();
    });

    it('preserves click notification when an authored URL is unsafe', async () => {
      location = await createComponent<SniceLocationElement>('snice-location', {
        clickable: true,
        name: 'Blocked map',
        'map-url': 'javascript:globalThis.__sniceNavigationInjected++'
      });
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);
      const details: unknown[] = [];
      location.addEventListener('location-click', (event) => {
        details.push((event as CustomEvent).detail);
      });

      location.click();

      expect(details).toHaveLength(1);
      expect(details[0]).toMatchObject({ name: 'Blocked map' });
      expect(open).not.toHaveBeenCalled();
    });

    it('bubbles one composed activation event across the shadow boundary', async () => {
      location = await createComponent<SniceLocationElement>('snice-location', {
        clickable: true,
        name: 'Observable location'
      });
      const received: CustomEvent[] = [];
      const listener = (event: Event) => received.push(event as CustomEvent);
      document.body.addEventListener('location-click', listener);

      try {
        (queryShadow(location, '.location') as HTMLElement).click();
      } finally {
        document.body.removeEventListener('location-click', listener);
      }

      expect(received).toHaveLength(1);
      expect(received[0].target).toBe(location);
      expect(received[0].bubbles).toBe(true);
      expect(received[0].composed).toBe(true);
      expect(received[0].detail).toMatchObject({ name: 'Observable location' });
    });

    it('resolves the destination after event listeners have run', async () => {
      location = await createComponent<SniceLocationElement>('snice-location', {
        clickable: true,
        'map-url': '/original-map'
      });
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);
      location.addEventListener('location-click', () => {
        location.mapUrl = 'javascript:globalThis.__sniceNavigationInjected++';
      }, { once: true });

      location.click();

      expect(open).not.toHaveBeenCalled();
      expect((globalThis as any).__sniceNavigationInjected).toBeUndefined();
    });

    it('exposes link semantics only while the location is clickable', async () => {
      location = await createComponent<SniceLocationElement>('snice-location', {
        name: 'Accessible destination',
        clickable: true,
        'map-url': '/map'
      });
      const base = queryShadow(location, '.location') as HTMLElement;

      expect(base.getAttribute('role')).toBe('link');
      expect(base.getAttribute('tabindex')).toBe('0');
      expect(base.textContent).toContain('Accessible destination');

      location.clickable = false;
      await wait(10);
      expect(base.hasAttribute('role')).toBe(false);
      expect(base.hasAttribute('tabindex')).toBe(false);
    });
  });

  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/location/snice-location.css');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\\(\\s*--snice-[a-z0-9-]+\\s*\\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});