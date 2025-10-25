import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow } from './test-utils';
import '../../components/link/snice-link';
import type { SniceLinkElement } from '../../components/link/snice-link.types';

describe('snice-link', () => {
  let link: SniceLinkElement;

  afterEach(() => {
    if (link) {
      removeComponent(link as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render link element', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { href: 'https://example.com' });
      expect(link).toBeTruthy();
      expect(link.tagName.toLowerCase()).toBe('snice-link');
    });

    it('should have default properties', async () => {
      link = await createComponent<SniceLinkElement>('snice-link');
      expect(link.href).toBe('');
      expect(link.target).toBe('_self');
      expect(link.variant).toBe('default');
      expect(link.disabled).toBe(false);
      expect(link.external).toBe(false);
      expect(link.underline).toBe(false);
    });

    it('should render anchor element', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { href: 'https://example.com' });
      const anchor = queryShadow(link, 'a');
      expect(anchor).toBeTruthy();
    });
  });

  describe('href', () => {
    it('should set href attribute', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { href: 'https://example.com' });
      const anchor = queryShadow(link, 'a') as HTMLAnchorElement;
      expect(anchor.href).toContain('example.com');
    });

    it('should default to # when no href provided', async () => {
      link = await createComponent<SniceLinkElement>('snice-link');
      const anchor = queryShadow(link, 'a') as HTMLAnchorElement;
      expect(anchor.href).toContain('#');
    });
  });

  describe('target', () => {
    it('should set target _self by default', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { href: 'https://example.com' });
      const anchor = queryShadow(link, 'a') as HTMLAnchorElement;
      expect(anchor.target).toBe('_self');
    });

    it('should set target _blank', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', {
        href: 'https://example.com',
        target: '_blank'
      });
      const anchor = queryShadow(link, 'a') as HTMLAnchorElement;
      expect(anchor.target).toBe('_blank');
    });
  });

  describe('external', () => {
    it('should set target _blank for external links', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', {
        href: 'https://example.com',
        external: true
      });
      const anchor = queryShadow(link, 'a') as HTMLAnchorElement;
      expect(anchor.target).toBe('_blank');
    });

    it('should set rel noopener noreferrer for external links', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', {
        href: 'https://example.com',
        external: true
      });
      const anchor = queryShadow(link, 'a') as HTMLAnchorElement;
      expect(anchor.rel).toBe('noopener noreferrer');
    });

    it('should show external icon for external links', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', {
        href: 'https://example.com',
        external: true
      });
      const icon = queryShadow(link, '.link__external-icon');
      expect(icon).toBeTruthy();
    });
  });

  describe('variants', () => {
    it('should apply default variant class', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { variant: 'default' });
      const anchor = queryShadow(link, 'a');
      expect(anchor?.classList.contains('link--default')).toBe(true);
    });

    it('should apply primary variant class', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { variant: 'primary' });
      const anchor = queryShadow(link, 'a');
      expect(anchor?.classList.contains('link--primary')).toBe(true);
    });

    it('should apply secondary variant class', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { variant: 'secondary' });
      const anchor = queryShadow(link, 'a');
      expect(anchor?.classList.contains('link--secondary')).toBe(true);
    });

    it('should apply muted variant class', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { variant: 'muted' });
      const anchor = queryShadow(link, 'a');
      expect(anchor?.classList.contains('link--muted')).toBe(true);
    });
  });

  describe('underline', () => {
    it('should not have underline by default', async () => {
      link = await createComponent<SniceLinkElement>('snice-link');
      const anchor = queryShadow(link, 'a');
      expect(anchor?.classList.contains('link--underline')).toBe(false);
    });

    it('should apply underline class when enabled', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { underline: true });
      const anchor = queryShadow(link, 'a');
      expect(anchor?.classList.contains('link--underline')).toBe(true);
    });
  });

  describe('disabled', () => {
    it('should not be disabled by default', async () => {
      link = await createComponent<SniceLinkElement>('snice-link');
      expect(link.disabled).toBe(false);
    });

    it('should apply disabled class when disabled', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { disabled: true });
      const anchor = queryShadow(link, 'a');
      expect(anchor?.classList.contains('link--disabled')).toBe(true);
    });
  });

  describe('content', () => {
    it('should render slotted content', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', {
        href: 'https://example.com'
      });
      link.textContent = 'Click me';
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(link.textContent).toContain('Click me');
    });
  });
});
