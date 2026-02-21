import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, trackRenders } from './test-utils';
import '../../components/link-preview/snice-link-preview';
import type { SniceLinkPreviewElement } from '../../components/link-preview/snice-link-preview.types';

describe('snice-link-preview', () => {
  let el: SniceLinkPreviewElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render link preview element', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview');

      expect(el).toBeTruthy();
      expect(el.tagName).toBe('SNICE-LINK-PREVIEW');
    });

    it('should have default properties', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview');

      expect(el.url).toBe('');
      expect(el.title).toBe('');
      expect(el.description).toBe('');
      expect(el.image).toBe('');
      expect(el.siteName).toBe('');
      expect(el.favicon).toBe('');
      expect(el.variant).toBe('vertical');
      expect(el.size).toBe('medium');
    });
  });

  describe('content display', () => {
    it('should display title', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview');

      const tracker = trackRenders(el as HTMLElement);
      el.title = 'Test Title';
      await tracker.next();

      const titleEl = queryShadow(el as HTMLElement, '.link-preview__title');
      expect(titleEl).toBeTruthy();
      expect(titleEl?.textContent?.trim()).toBe('Test Title');
    });

    it('should display description', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview');

      const tracker = trackRenders(el as HTMLElement);
      el.description = 'Test description text';
      await tracker.next();

      const descEl = queryShadow(el as HTMLElement, '.link-preview__description');
      expect(descEl).toBeTruthy();
      expect(descEl?.textContent?.trim()).toBe('Test description text');
    });

    it('should display image when provided', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview');

      const tracker = trackRenders(el as HTMLElement);
      el.image = 'https://example.com/image.jpg';
      await tracker.next();

      const imgEl = queryShadow(el as HTMLElement, '.link-preview__image img');
      expect(imgEl).toBeTruthy();
      expect((imgEl as HTMLImageElement).src).toBe('https://example.com/image.jpg');
    });

    it('should show placeholder when no image', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview');

      const placeholder = queryShadow(el as HTMLElement, '.link-preview__image-placeholder');
      expect(placeholder).toBeTruthy();
    });

    it('should display site name', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview', {
        'site-name': 'Example Site'
      });

      const siteNameEl = queryShadow(el as HTMLElement, '.link-preview__site-name');
      expect(siteNameEl).toBeTruthy();
      expect(siteNameEl?.textContent?.trim()).toBe('Example Site');
    });

    it('should extract domain from url', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview', {
        url: 'https://www.example.com/path/to/page'
      });

      const domainEl = queryShadow(el as HTMLElement, '.link-preview__domain');
      expect(domainEl).toBeTruthy();
      expect(domainEl?.textContent?.trim()).toBe('www.example.com');
    });

    it('should display favicon when provided', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview', {
        favicon: 'https://example.com/favicon.ico',
        'site-name': 'Example'
      });

      const faviconEl = queryShadow(el as HTMLElement, '.link-preview__favicon');
      expect(faviconEl).toBeTruthy();
      expect((faviconEl as HTMLImageElement).src).toBe('https://example.com/favicon.ico');
    });
  });

  describe('variants', () => {
    it('should support vertical variant (default)', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview');

      expect(el.variant).toBe('vertical');
    });

    it('should support horizontal variant', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview', {
        variant: 'horizontal'
      });

      expect(el.variant).toBe('horizontal');
    });
  });

  describe('sizes', () => {
    it('should support small size', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview', {
        size: 'small',
        title: 'Small'
      });

      expect(el.size).toBe('small');
    });

    it('should support medium size (default)', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview');

      expect(el.size).toBe('medium');
    });

    it('should support large size', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview', {
        size: 'large',
        title: 'Large'
      });

      expect(el.size).toBe('large');
    });
  });

  describe('click behavior', () => {
    it('should dispatch link-click event on click', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview', {
        url: 'https://example.com'
      });

      const spy = vi.fn();
      el.addEventListener('@snice/link-click', spy);

      // Mock window.open to prevent actual navigation
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      el.click();

      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0].detail.url).toBe('https://example.com');

      openSpy.mockRestore();
    });

    it('should open url in new tab on click', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview', {
        url: 'https://example.com'
      });

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      el.click();

      expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');

      openSpy.mockRestore();
    });

    it('should not open window when url is empty', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview');

      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      el.click();

      expect(openSpy).not.toHaveBeenCalled();

      openSpy.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('should have role="article"', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview');

      const card = queryShadow(el as HTMLElement, '.link-preview');
      expect(card?.getAttribute('role')).toBe('article');
    });

    it('should have aria-label with title', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview', {
        title: 'My Article'
      });

      const card = queryShadow(el as HTMLElement, '.link-preview');
      expect(card?.getAttribute('aria-label')).toBe('My Article');
    });

    it('should have tabindex for keyboard navigation', async () => {
      el = await createComponent<SniceLinkPreviewElement>('snice-link-preview');

      const card = queryShadow(el as HTMLElement, '.link-preview');
      expect(card?.getAttribute('tabindex')).toBe('0');
    });
  });
});
