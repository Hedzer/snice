import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/image/snice-image';
import type { SniceImageElement } from '../../components/image/snice-image.types';

describe('snice-image', () => {
  let image: SniceImageElement;

  afterEach(() => {
    if (image) {
      removeComponent(image as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render image element', async () => {
      image = await createComponent<SniceImageElement>('snice-image');
      expect(image).toBeTruthy();
      expect(image.tagName).toBe('SNICE-IMAGE');
    });

    it('should have default properties', async () => {
      image = await createComponent<SniceImageElement>('snice-image');
      expect(image.src).toBe('');
      expect(image.alt).toBe('');
      expect(image.fallback).toBe('');
      expect(image.variant).toBe('rounded');
      expect(image.size).toBe('medium');
      expect(image.lazy).toBe(true);
      expect(image.fit).toBe('cover');
      expect(image.width).toBe('');
      expect(image.height).toBe('');
    });

    it('should render container', async () => {
      image = await createComponent<SniceImageElement>('snice-image');
      await wait(50);

      const container = queryShadow(image as HTMLElement, '.image-container');
      expect(container).toBeTruthy();
    });
  });

  describe('src and alt', () => {
    it('should render image with src', async () => {
      image = await createComponent<SniceImageElement>('snice-image', {
        src: 'https://example.com/image.jpg'
      });
      await wait(50);

      const img = queryShadow(image as HTMLElement, 'img');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toBe('https://example.com/image.jpg');
    });

    it('should render image with alt text', async () => {
      image = await createComponent<SniceImageElement>('snice-image', {
        src: 'https://example.com/image.jpg',
        alt: 'Test Image'
      });
      await wait(50);

      const img = queryShadow(image as HTMLElement, 'img');
      expect(img?.getAttribute('alt')).toBe('Test Image');
    });

    it('should use default alt text when not provided', async () => {
      image = await createComponent<SniceImageElement>('snice-image', {
        src: 'https://example.com/image.jpg'
      });
      await wait(50);

      const img = queryShadow(image as HTMLElement, 'img');
      expect(img?.getAttribute('alt')).toBe('Image');
    });
  });

  describe('placeholder', () => {
    it('should render placeholder when no src provided', async () => {
      image = await createComponent<SniceImageElement>('snice-image');
      await wait(50);

      const placeholder = queryShadow(image as HTMLElement, '.image--placeholder');
      expect(placeholder).toBeTruthy();
    });

    it('should not render img element when no src', async () => {
      image = await createComponent<SniceImageElement>('snice-image');
      await wait(50);

      const img = queryShadow(image as HTMLElement, 'img');
      expect(img).toBeFalsy();
    });
  });

  describe('size variants', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        image = await createComponent<SniceImageElement>('snice-image', {
          src: 'https://example.com/image.jpg',
          size: size as any
        });
        await wait(50);

        const img = queryShadow(image as HTMLElement, 'img');
        expect(img?.classList.contains(`image--${size}`)).toBe(true);
      });
    });
  });

  describe('shape variants', () => {
    const variants = ['rounded', 'square', 'circle'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant class`, async () => {
        image = await createComponent<SniceImageElement>('snice-image', {
          src: 'https://example.com/image.jpg',
          variant: variant as any
        });
        await wait(50);

        const img = queryShadow(image as HTMLElement, 'img');
        expect(img?.classList.contains(`image--${variant}`)).toBe(true);
      });
    });
  });

  describe('fit variants', () => {
    const fits = ['cover', 'contain', 'fill', 'none', 'scale-down'];

    fits.forEach(fit => {
      it(`should apply ${fit} fit class`, async () => {
        image = await createComponent<SniceImageElement>('snice-image', {
          src: 'https://example.com/image.jpg',
          fit: fit as any
        });
        await wait(50);

        const img = queryShadow(image as HTMLElement, 'img');
        expect(img?.classList.contains(`image--${fit}`)).toBe(true);
      });
    });
  });

  describe('lazy loading', () => {
    it('should use lazy loading by default', async () => {
      image = await createComponent<SniceImageElement>('snice-image', {
        src: 'https://example.com/image.jpg'
      });
      await wait(50);

      const img = queryShadow(image as HTMLElement, 'img');
      expect(img?.getAttribute('loading')).toBe('lazy');
    });

    it('should use eager loading when lazy is false', async () => {
      image = await createComponent<SniceImageElement>('snice-image', {
        src: 'https://example.com/image.jpg',
        lazy: false
      });
      await wait(50);

      const img = queryShadow(image as HTMLElement, 'img');
      expect(img?.getAttribute('loading')).toBe('eager');
    });
  });

  describe('dimensions', () => {
    it('should apply custom width', async () => {
      image = await createComponent<SniceImageElement>('snice-image', {
        src: 'https://example.com/image.jpg',
        width: '200px'
      });
      await wait(50);

      const img = queryShadow(image as HTMLElement, 'img');
      expect(img?.style.width).toBe('200px');
    });

    it('should apply custom height', async () => {
      image = await createComponent<SniceImageElement>('snice-image', {
        src: 'https://example.com/image.jpg',
        height: '150px'
      });
      await wait(50);

      const img = queryShadow(image as HTMLElement, 'img');
      expect(img?.style.height).toBe('150px');
    });

    it('should apply both width and height', async () => {
      image = await createComponent<SniceImageElement>('snice-image', {
        src: 'https://example.com/image.jpg',
        width: '200px',
        height: '150px'
      });
      await wait(50);

      const img = queryShadow(image as HTMLElement, 'img');
      expect(img?.style.width).toBe('200px');
      expect(img?.style.height).toBe('150px');
    });
  });

  describe('fallback', () => {
    // Note: Cannot easily test error event in JSDOM, these tests verify structure only
    it('should have fallback property', async () => {
      image = await createComponent<SniceImageElement>('snice-image', {
        src: 'https://example.com/image.jpg',
        fallback: 'https://example.com/fallback.jpg'
      });

      expect(image.fallback).toBe('https://example.com/fallback.jpg');
    });
  });
});
