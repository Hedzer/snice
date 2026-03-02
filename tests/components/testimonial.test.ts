import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/testimonial/snice-testimonial';
import type { SniceTestimonialElement } from '../../components/testimonial/snice-testimonial.types';

describe('snice-testimonial', () => {
  let testimonial: SniceTestimonialElement;

  afterEach(() => {
    if (testimonial) {
      removeComponent(testimonial as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render testimonial element', async () => {
      testimonial = await createComponent<SniceTestimonialElement>('snice-testimonial');

      expect(testimonial).toBeTruthy();
      expect(testimonial.tagName).toBe('SNICE-TESTIMONIAL');
    });

    it('should have default properties', async () => {
      testimonial = await createComponent<SniceTestimonialElement>('snice-testimonial');

      expect(testimonial.quote).toBe('');
      expect(testimonial.author).toBe('');
      expect(testimonial.avatar).toBe('');
      expect(testimonial.role).toBe('');
      expect(testimonial.company).toBe('');
      expect(testimonial.rating).toBe(0);
      expect(testimonial.variant).toBe('card');
    });

    it('should render testimonial structure', async () => {
      testimonial = await createComponent<SniceTestimonialElement>('snice-testimonial');
      await wait(10);

      const base = queryShadow(testimonial as HTMLElement, '.testimonial');
      expect(base).toBeTruthy();

      const quote = queryShadow(testimonial as HTMLElement, '.quote');
      expect(quote).toBeTruthy();

      const authorInfo = queryShadow(testimonial as HTMLElement, '.author-info');
      expect(authorInfo).toBeTruthy();
    });
  });

  describe('properties', () => {
    it('should accept quote attribute', async () => {
      testimonial = await createComponent<SniceTestimonialElement>('snice-testimonial', {
        quote: 'This is an amazing product!'
      });
      await wait(10);

      expect(testimonial.quote).toBe('This is an amazing product!');
      
      const quoteEl = queryShadow(testimonial as HTMLElement, '.quote');
      expect(quoteEl?.textContent).toContain('This is an amazing product!');
    });

    it('should accept author attribute', async () => {
      testimonial = await createComponent<SniceTestimonialElement>('snice-testimonial', {
        author: 'John Doe'
      });
      await wait(10);

      expect(testimonial.author).toBe('John Doe');

      const authorName = queryShadow(testimonial as HTMLElement, '.author-name');
      expect(authorName?.textContent).toContain('John Doe');
    });

    it('should accept avatar attribute', async () => {
      testimonial = await createComponent<SniceTestimonialElement>('snice-testimonial', {
        avatar: 'https://example.com/avatar.jpg',
        author: 'Test'
      });
      await wait(10);

      expect(testimonial.avatar).toBe('https://example.com/avatar.jpg');

      const avatarImg = queryShadow(testimonial as HTMLElement, '.avatar');
      expect(avatarImg).toBeTruthy();
      expect(avatarImg?.getAttribute('src')).toBe('https://example.com/avatar.jpg');
    });

    it('should accept role and company attributes', async () => {
      testimonial = await createComponent<SniceTestimonialElement>('snice-testimonial', {
        role: 'CEO',
        company: 'Acme Inc'
      });
      await wait(10);

      expect(testimonial.role).toBe('CEO');
      expect(testimonial.company).toBe('Acme Inc');

      const authorRole = queryShadow(testimonial as HTMLElement, '.author-role');
      expect(authorRole?.textContent).toContain('CEO');
      expect(authorRole?.textContent).toContain('Acme Inc');
    });

    it('should accept rating attribute', async () => {
      testimonial = await createComponent<SniceTestimonialElement>('snice-testimonial', {
        rating: 5
      });
      await wait(10);

      expect(testimonial.rating).toBe(5);

      const stars = queryShadow(testimonial as HTMLElement, '.stars');
      expect(stars).toBeTruthy();
    });

    it('should accept variant attribute', async () => {
      testimonial = await createComponent<SniceTestimonialElement>('snice-testimonial', {
        variant: 'minimal'
      });

      expect(testimonial.variant).toBe('minimal');
    });
  });

  describe('rendering', () => {
    it('should not show stars when rating is 0', async () => {
      testimonial = await createComponent<SniceTestimonialElement>('snice-testimonial', {
        rating: 0
      });
      await wait(10);

      const stars = queryShadow(testimonial as HTMLElement, '.stars');
      expect(stars).toBeFalsy();
    });

    it('should not show avatar when not provided', async () => {
      testimonial = await createComponent<SniceTestimonialElement>('snice-testimonial');
      await wait(10);

      const avatarImg = queryShadow(testimonial as HTMLElement, '.avatar');
      expect(avatarImg).toBeFalsy();
    });
  });
});
