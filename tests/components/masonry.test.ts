import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow } from './test-utils';
import '../../components/masonry/snice-masonry';
import type { SniceMasonryElement } from '../../components/masonry/snice-masonry.types';

describe('snice-masonry', () => {
  let masonry: SniceMasonryElement;

  afterEach(() => {
    if (masonry) {
      removeComponent(masonry as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render masonry element', async () => {
      masonry = await createComponent<SniceMasonryElement>('snice-masonry');

      expect(masonry).toBeTruthy();
      expect(masonry.tagName).toBe('SNICE-MASONRY');
    });

    it('should have default properties', async () => {
      masonry = await createComponent<SniceMasonryElement>('snice-masonry');

      expect(masonry.columns).toBe(3);
      expect(masonry.gap).toBe('1rem');
      expect(masonry.minColumnWidth).toBe('250px');
    });

    it('should render a container with role="list"', async () => {
      masonry = await createComponent<SniceMasonryElement>('snice-masonry');

      const container = queryShadow(masonry as HTMLElement, '.masonry');
      expect(container).toBeTruthy();
      expect(container?.getAttribute('role')).toBe('list');
    });

    it('should contain a slot element', async () => {
      masonry = await createComponent<SniceMasonryElement>('snice-masonry');

      const slot = queryShadow(masonry as HTMLElement, 'slot');
      expect(slot).toBeTruthy();
    });
  });

  describe('column count', () => {
    it('should apply column count custom property', async () => {
      masonry = await createComponent<SniceMasonryElement>('snice-masonry', {
        columns: 4
      });

      const value = (masonry as HTMLElement).style.getPropertyValue('--masonry-columns');
      expect(value).toBe('4');
    });

    it('should update column count on property change', async () => {
      masonry = await createComponent<SniceMasonryElement>('snice-masonry');

      masonry.columns = 5;

      const value = (masonry as HTMLElement).style.getPropertyValue('--masonry-columns');
      expect(value).toBe('5');
    });

    it('should set columns attribute to 0 for auto mode', async () => {
      masonry = await createComponent<SniceMasonryElement>('snice-masonry', {
        columns: 0
      });

      expect(masonry.columns).toBe(0);
      expect((masonry as HTMLElement).getAttribute('columns')).toBe('0');
    });
  });

  describe('gap', () => {
    it('should apply gap custom property', async () => {
      masonry = await createComponent<SniceMasonryElement>('snice-masonry', {
        gap: '2rem'
      });

      const value = (masonry as HTMLElement).style.getPropertyValue('--masonry-gap');
      expect(value).toBe('2rem');
    });

    it('should update gap on property change', async () => {
      masonry = await createComponent<SniceMasonryElement>('snice-masonry');

      masonry.gap = '0.5rem';

      const value = (masonry as HTMLElement).style.getPropertyValue('--masonry-gap');
      expect(value).toBe('0.5rem');
    });
  });

  describe('responsive behavior', () => {
    it('should apply minColumnWidth custom property', async () => {
      masonry = await createComponent<SniceMasonryElement>('snice-masonry');

      masonry.minColumnWidth = '300px';

      const value = (masonry as HTMLElement).style.getPropertyValue('--masonry-column-width');
      expect(value).toBe('300px');
    });

    it('should update minColumnWidth on property change', async () => {
      masonry = await createComponent<SniceMasonryElement>('snice-masonry');

      masonry.minColumnWidth = '400px';

      const value = (masonry as HTMLElement).style.getPropertyValue('--masonry-column-width');
      expect(value).toBe('400px');
    });
  });
});
