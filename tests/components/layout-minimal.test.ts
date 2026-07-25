import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout-minimal';
import type { SniceLayoutMinimal } from '../../packages/components/src/layout/snice-layout-minimal';

describe('snice-layout-minimal', () => {
  let layout: SniceLayoutMinimal;

  afterEach(() => {
    if (layout) removeComponent(layout as HTMLElement);
  });

  it('renders a bare main region with a page slot', async () => {
    layout = await createComponent<SniceLayoutMinimal>('snice-layout-minimal');
    await wait(10);

    expect(queryShadow(layout as HTMLElement, 'main.main')).toBeTruthy();
    expect(queryShadow(layout as HTMLElement, 'slot[name="page"]')).toBeTruthy();
  });

  it('assigns page content', async () => {
    const el = document.createElement('snice-layout-minimal');
    el.innerHTML = '<div slot="page">Content</div>';
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 50));

    const slot = el.shadowRoot!.querySelector('slot[name="page"]') as HTMLSlotElement;
    expect(slot.assignedNodes().map(n => n.textContent).join('')).toContain('Content');
    el.remove();
  });

  describe('stylesheet contracts', () => {
    const css = readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-minimal.css'), 'utf8');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });

  describe('frame behaviour', () => {
    const readFrameCss = () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { readFileSync } = require('node:fs');
      const { resolve } = require('node:path');
      return readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-minimal.css'), 'utf8');
    };

    it('fills the small viewport with a dvh height and a vh fallback', () => {
      const css = readFrameCss();
      expect(css).toMatch(/min-height:\s*100vh/);
      expect(css).toMatch(/min-height:\s*100dvh/);
    });

    it('contained drops the viewport height so it can be embedded', () => {
      const css = readFrameCss();
      expect(css).toMatch(/:host\(\[contained\]\)/);
    });
  });
});
