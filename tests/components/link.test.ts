import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/link/snice-link';
import type { SniceLinkElement } from '../../packages/components/src/link/snice-link.types';
import { allowedNavigationUrls, unsafeNavigationUrls } from '../navigation-url-cases';

describe('snice-link', () => {
  let link: SniceLinkElement;

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as any).__sniceNavigationInjected;
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
      expect(link.hash).toBe(false);
    });

    it('should render anchor element', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { href: 'https://example.com' });
      const anchor = queryShadow(link, 'a');
      expect(anchor).toBeTruthy();
    });
  });

  describe('safe URL navigation', () => {
    it.each(unsafeNavigationUrls)(
      'removes the native href and prevents activation for %s (%s)',
      async (href) => {
        (globalThis as any).__sniceNavigationInjected = 0;
        link = await createComponent<SniceLinkElement>('snice-link', { href });
        const anchor = queryShadow(link, 'a') as HTMLAnchorElement;
        const navigate = vi.fn();
        link.addEventListener('navigate', navigate);
        const click = new MouseEvent('click', {
          bubbles: true,
          composed: true,
          cancelable: true
        });

        expect(anchor.hasAttribute('href')).toBe(false);
        expect(() => anchor.dispatchEvent(click)).not.toThrow();
        await wait(0);

        expect(click.defaultPrevented).toBe(true);
        expect(navigate).not.toHaveBeenCalled();
        expect((globalThis as any).__sniceNavigationInjected).toBe(0);
      }
    );

    it.each(allowedNavigationUrls)(
      'preserves the native href for %s (%s)',
      async (href) => {
        link = await createComponent<SniceLinkElement>('snice-link', {
          href: `  ${href}  `
        });
        link.textContent = 'Accessible destination';
        const anchor = queryShadow(link, 'a') as HTMLAnchorElement;

        expect(anchor.getAttribute('href')).toBe(href);
        expect(anchor.querySelector('slot')).toBeTruthy();
        expect(link.textContent).toBe('Accessible destination');
      }
    );

    it('removes a previously safe href and restores a later safe href', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { href: '/safe-before' });
      const anchor = queryShadow(link, 'a') as HTMLAnchorElement;
      expect(anchor.getAttribute('href')).toBe('/safe-before');

      link.href = 'javascript:globalThis.__sniceNavigationInjected++';
      await wait(10);
      expect(anchor.hasAttribute('href')).toBe(false);

      link.href = '/safe-after';
      await wait(10);
      expect(anchor.getAttribute('href')).toBe('/safe-after');
    });

    it('responds safely to reflected attribute changes and removal', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { href: '/safe-before' });
      const anchor = queryShadow(link, 'a') as HTMLAnchorElement;

      link.setAttribute('href', 'JaVaScRiPt:globalThis.__sniceNavigationInjected++');
      await wait(10);
      expect(link.href).toBe('JaVaScRiPt:globalThis.__sniceNavigationInjected++');
      expect(anchor.hasAttribute('href')).toBe(false);

      link.setAttribute('href', 'https://example.com/restored');
      await wait(10);
      expect(anchor.getAttribute('href')).toBe('https://example.com/restored');

      link.removeAttribute('href');
      await wait(10);
      expect(link.href).toBe('');
      expect(anchor.getAttribute('href')).toBe('#');
    });

    it.each([null, undefined, false, 0, Number.NaN])(
      'fails closed for a falsey non-string runtime href: %j',
      async (href) => {
        link = await createComponent<SniceLinkElement>('snice-link', { href: '/safe-before' });
        const anchor = queryShadow(link, 'a') as HTMLAnchorElement;

        expect(() => {
          (link as any).href = href;
        }).not.toThrow();
        await wait(10);

        expect(anchor.hasAttribute('href')).toBe(false);
        const click = new MouseEvent('click', { bubbles: true, cancelable: true });
        anchor.dispatchEvent(click);
        expect(click.defaultPrevented).toBe(true);
      }
    );

    it('fails closed for truthy and throwing non-string runtime values', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', { href: '/safe-before' });
      const anchor = queryShadow(link, 'a') as HTMLAnchorElement;
      const values = [
        { toString: () => 'https://example.com/coerced' },
        { toString: () => { throw new Error('must not convert'); } },
        [],
        1
      ];

      for (const value of values) {
        expect(() => {
          (link as any).href = value;
        }).not.toThrow();
        await wait(10);
        expect(anchor.hasAttribute('href')).toBe(false);
      }
    });

    it('keeps the existing empty-href fallback but rejects whitespace-only values', async () => {
      link = await createComponent<SniceLinkElement>('snice-link');
      const anchor = queryShadow(link, 'a') as HTMLAnchorElement;
      expect(anchor.getAttribute('href')).toBe('#');

      link.href = '   ';
      await wait(10);
      expect(anchor.hasAttribute('href')).toBe(false);

      link.href = '';
      await wait(10);
      expect(anchor.getAttribute('href')).toBe('#');
    });

    it('preserves target, rel, label, and native click behavior for an allowed external URL', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', {
        href: 'https://example.com/path',
        external: true
      });
      link.textContent = 'Example destination';
      const anchor = queryShadow(link, 'a') as HTMLAnchorElement;
      const click = new MouseEvent('click', {
        bubbles: true,
        composed: true,
        cancelable: true
      });

      expect(anchor.getAttribute('href')).toBe('https://example.com/path');
      expect(anchor.target).toBe('_blank');
      expect(anchor.rel).toBe('noopener noreferrer');
      expect(anchor.dispatchEvent(click)).toBe(true);
      expect(click.defaultPrevented).toBe(false);
      expect(link.textContent).toBe('Example destination');
    });

    it('preserves hash routing and its cancelable navigate event for a safe route', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', {
        href: 'profile',
        hash: true
      });
      const anchor = queryShadow(link, 'a') as HTMLAnchorElement;
      const details: unknown[] = [];
      link.addEventListener('navigate', (event) => {
        details.push((event as CustomEvent).detail);
        event.preventDefault();
      });
      const click = new MouseEvent('click', {
        bubbles: true,
        composed: true,
        cancelable: true
      });

      anchor.dispatchEvent(click);

      expect(anchor.getAttribute('href')).toBe('#profile');
      expect(details).toEqual([{ href: 'profile' }]);
      expect(click.defaultPrevented).toBe(true);
    });

    it('blocks an unsafe href before emitting a hash navigation event', async () => {
      link = await createComponent<SniceLinkElement>('snice-link', {
        href: 'java\nscript:globalThis.__sniceNavigationInjected++',
        hash: true
      });
      const anchor = queryShadow(link, 'a') as HTMLAnchorElement;
      const navigate = vi.fn();
      link.addEventListener('navigate', navigate);
      const click = new MouseEvent('click', { bubbles: true, cancelable: true });

      anchor.dispatchEvent(click);

      expect(anchor.hasAttribute('href')).toBe(false);
      expect(click.defaultPrevented).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
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

  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/link/snice-link.css');

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