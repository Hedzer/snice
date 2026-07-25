import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/layout/snice-layout-master-detail';
import type { SniceLayoutMasterDetail } from '../../packages/components/src/layout/snice-layout-master-detail';

describe('snice-layout-master-detail', () => {
  let layout: SniceLayoutMasterDetail;

  afterEach(() => {
    if (layout) removeComponent(layout as HTMLElement);
  });

  describe('structure', () => {
    it('renders list and detail panes plus header slots', async () => {
      layout = await createComponent<SniceLayoutMasterDetail>('snice-layout-master-detail');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, 'section.list')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, 'section.detail')).toBeTruthy();
      for (const name of ['brand', 'header', 'list', 'detail', 'empty']) {
        expect(queryShadow(layout as HTMLElement, `slot[name="${name}"]`), name).toBeTruthy();
      }
    });

    it('names both panes for assistive technology', async () => {
      layout = await createComponent<SniceLayoutMasterDetail>('snice-layout-master-detail');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, 'section.list')!.getAttribute('aria-label')).toBeTruthy();
      expect(queryShadow(layout as HTMLElement, 'section.detail')!.getAttribute('aria-label')).toBeTruthy();
    });

    it('shows an empty-state fallback until a detail is slotted', async () => {
      layout = await createComponent<SniceLayoutMasterDetail>('snice-layout-master-detail');
      await wait(10);

      expect(queryShadow(layout as HTMLElement, '.detail-empty')).toBeTruthy();
    });

    it('assigns slotted list and detail content', async () => {
      const el = document.createElement('snice-layout-master-detail');
      el.innerHTML = '<div slot="list">Inbox</div><div slot="detail">Message body</div>';
      document.body.appendChild(el);
      await new Promise(r => setTimeout(r, 50));

      const list = el.shadowRoot!.querySelector('slot[name="list"]') as HTMLSlotElement;
      const detail = el.shadowRoot!.querySelector('slot[name="detail"]') as HTMLSlotElement;
      expect(list.assignedNodes().map(n => n.textContent).join('')).toContain('Inbox');
      expect(detail.assignedNodes().map(n => n.textContent).join('')).toContain('Message body');
      el.remove();
    });
  });

  describe('selection contract', () => {
    it('observes selected and contained', async () => {
      layout = await createComponent<SniceLayoutMasterDetail>('snice-layout-master-detail');

      const observed = (customElements.get('snice-layout-master-detail') as any).observedAttributes as string[];
      expect(observed).toContain('selected');
      expect(observed).toContain('contained');
    });

    it('keeps both panes on screen on wide viewports', async () => {
      layout = await createComponent<SniceLayoutMasterDetail>('snice-layout-master-detail');
      await wait(20);

      expect(queryShadow(layout as HTMLElement, 'section.list')!.classList.contains('pane--hidden')).toBe(false);
      expect(queryShadow(layout as HTMLElement, 'section.detail')!.classList.contains('pane--hidden')).toBe(false);
    });

    it('clearing selection emits detail-closed', async () => {
      layout = await createComponent<SniceLayoutMasterDetail>('snice-layout-master-detail', { selected: true });
      await wait(20);

      let received: any = null;
      (layout as unknown as HTMLElement).addEventListener('detail-closed', (e: Event) => {
        received = (e as CustomEvent).detail;
      });

      (layout as any).handleBack();
      await wait(20);

      expect(layout.selected).toBe(false);
      expect(received).toEqual({ selected: false });
    });
  });

  describe('router integration', () => {
    it('accepts placard updates without throwing', async () => {
      layout = await createComponent<SniceLayoutMasterDetail>('snice-layout-master-detail');
      await wait(10);

      expect(() => layout.update({} as any, [], '', {})).not.toThrow();
    });
  });

  describe('stylesheet contracts', () => {
    const css = readFileSync(resolve(process.cwd(), 'packages/components/src/layout/snice-layout-master-detail.css'), 'utf8');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('splits panes side by side above the documented 641px breakpoint', () => {
      expect(css).toMatch(/\.list\s*\{[^}]*width:\s*var\(--snice-layout-list-width,\s*20rem\)/);
      expect(css).toMatch(/@media \(max-width: 640px\)[\s\S]*\.list[\s\S]*width:\s*100%/);
    });

    it('pins itself to the viewport unless contained', () => {
      expect(css).toMatch(/:host\(:not\(\[contained\]\)\)\s*\{[^}]*position:\s*fixed/);
      expect(css).toMatch(/:host\(\[contained\]\)\s*\{[^}]*position:\s*relative/);
    });
  });
});
