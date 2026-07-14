import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent } from './test-utils';
import '../../packages/components/src/drawer/snice-drawer';
import type { SniceDrawerElement } from '../../packages/components/src/drawer/snice-drawer.types';

/**
 * AUDIT FINDING (`.research/bug-audit-2026-04-29.md`):
 * Drawer locks `document.body.style.overflow = 'hidden'` per-instance with
 * no refcount. If A and B both open and then A closes, A unconditionally
 * resets overflow to '', leaving the page scrollable while B is still open.
 *
 * This test exists to PROVE the bug. It is expected to FAIL until the
 * scroll-lock is refcounted (or moved to a single shared utility).
 */
describe('snice-drawer — scroll-lock refcount (currently broken)', () => {
  let drawerA: SniceDrawerElement;
  let drawerB: SniceDrawerElement;

  afterEach(() => {
    if (drawerA) removeComponent(drawerA as HTMLElement);
    if (drawerB) removeComponent(drawerB as HTMLElement);
    document.body.style.overflow = '';
    const scrollLock = (globalThis as any)[Symbol.for('snice:body-scroll-lock')];
    if (scrollLock?.clear) scrollLock.clear();
  });

  it('keeps body scroll-locked while a second drawer is still open', async () => {
    drawerA = await createComponent<SniceDrawerElement>('snice-drawer');
    drawerB = await createComponent<SniceDrawerElement>('snice-drawer');

    drawerA.open = true;
    drawerB.open = true;
    await new Promise(r => setTimeout(r, 30));

    // happy-dom doesn't return body.style.overflow after assignment, so we
    // read the inline `style` attribute instead — it does reflect the change.
    expect(document.body.getAttribute('style') || '').toContain('overflow: hidden');

    // Close A. B is still open, so overflow MUST stay hidden.
    drawerA.open = false;
    await new Promise(r => setTimeout(r, 30));

    expect(document.body.getAttribute('style') || '').toContain('overflow: hidden');
  });
});
