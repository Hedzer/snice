import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout-auth-split';
import type { SniceLayoutAuthSplit } from '../../packages/components/src/layout/snice-layout-auth-split';

describe('snice-layout-auth-split', () => {
  let layout: SniceLayoutAuthSplit;

  afterEach(() => {
    if (layout) removeComponent(layout as HTMLElement);
  });

  describe('structure', () => {
    it('renders a form side and a brand panel', async () => {
      layout = await createComponent<SniceLayoutAuthSplit>('snice-layout-auth-split');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, 'section.form-side')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, 'aside.panel')).toBeTruthy();
    });

    it('ships brand, page, footer, and panel slots', async () => {
      layout = await createComponent<SniceLayoutAuthSplit>('snice-layout-auth-split');
      await wait(10);

      for (const name of ['brand', 'page', 'footer', 'panel']) {
        expect(queryShadow(layout as HTMLElement, `slot[name="${name}"]`), name).toBeTruthy();
      }
    });

    it('marks the decorative panel hidden from assistive technology', async () => {
      layout = await createComponent<SniceLayoutAuthSplit>('snice-layout-auth-split');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, 'aside.panel')!.getAttribute('aria-hidden')).toBe('true');
    });

    it('assigns slotted form and panel content', async () => {
      const el = document.createElement('snice-layout-auth-split');
      el.innerHTML = '<div slot="page">Sign in form</div><img slot="panel" src="/hero.png" alt="">';
      document.body.appendChild(el);
      await new Promise(r => setTimeout(r, 50));

      const page = el.shadowRoot!.querySelector('slot[name="page"]') as HTMLSlotElement;
      const panel = el.shadowRoot!.querySelector('slot[name="panel"]') as HTMLSlotElement;
      expect(page.assignedNodes().map(n => n.textContent).join('')).toContain('Sign in form');
      expect(panel.assignedNodes().length).toBe(1);
      el.remove();
    });
  });

  describe('attribute contract', () => {
    it('observes panel-position and contained', async () => {
      layout = await createComponent<SniceLayoutAuthSplit>('snice-layout-auth-split');

      const observed = (customElements.get('snice-layout-auth-split') as any).observedAttributes as string[];
      expect(observed).toContain('panel-position');
      expect(observed).toContain('contained');
    });

    it('defaults the panel to the trailing side', async () => {
      layout = await createComponent<SniceLayoutAuthSplit>('snice-layout-auth-split');

      expect(layout.panelPosition).toBe('end');
    });

    it('accepts panel-position="start"', async () => {
      layout = await createComponent<SniceLayoutAuthSplit>('snice-layout-auth-split', { 'panel-position': 'start' });

      expect(layout.panelPosition).toBe('start');
    });
  });

  describe('stylesheet contracts', () => {
    const css = readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-auth-split.css'), 'utf8');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('splits the page in half on wide screens', () => {
      expect(css).toMatch(/\.layout\s*\{[^}]*grid-template-columns:\s*1fr 1fr/);
    });

    it('drops the decorative panel below 768px and keeps the form full width', () => {
      expect(css).toMatch(/@media \(max-width: 768px\)[\s\S]*\.panel[\s\S]*display:\s*none/);
      const mobile = css.slice(css.indexOf('@media (max-width: 768px)'));
      expect(mobile).not.toMatch(/\.form-side[^{]*\{[^}]*display:\s*none/);
    });

    it('keeps the auth form at the standard card measure', () => {
      expect(css).toMatch(/max-width:\s*var\(--snice-layout-auth-width,\s*24rem\)/);
    });
  });
});
