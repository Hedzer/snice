import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, queryShadowAll } from './test-utils';
import '../../packages/components/src/skeleton/snice-skeleton';
import type { SniceSkeletonElement } from '../../packages/components/src/skeleton/snice-skeleton.types';

describe('snice-skeleton', () => {
  let skeleton: SniceSkeletonElement;

  afterEach(() => {
    if (skeleton) {
      removeComponent(skeleton as HTMLElement);
    }
  });

  it('should render skeleton element', async () => {
    skeleton = await createComponent<SniceSkeletonElement>('snice-skeleton');
    expect(skeleton).toBeTruthy();
  });

  it('should have default text variant', async () => {
    skeleton = await createComponent<SniceSkeletonElement>('snice-skeleton');
    const el = queryShadow(skeleton as HTMLElement, '.skeleton--text');
    expect(el).toBeTruthy();
  });

  it('should support different variants', async () => {
    skeleton = await createComponent<SniceSkeletonElement>('snice-skeleton', { variant: 'circular' });

    const el = queryShadow(skeleton as HTMLElement, '.skeleton--circular');
    expect(el).toBeTruthy();
  });

  it('should support count property', async () => {
    skeleton = await createComponent<SniceSkeletonElement>('snice-skeleton', { count: 3 });

    const items = queryShadowAll(skeleton as HTMLElement, '.skeleton');
    expect(items.length).toBe(3);
  });

  it('should support animation', async () => {
    skeleton = await createComponent<SniceSkeletonElement>('snice-skeleton', { animation: 'pulse' });

    const el = queryShadow(skeleton as HTMLElement, '.skeleton--pulse');
    expect(el).toBeTruthy();
  });

  it('should support custom width', async () => {
    skeleton = await createComponent<SniceSkeletonElement>('snice-skeleton', { width: '200px' });

    const el = queryShadow(skeleton as HTMLElement, '.skeleton') as HTMLElement;
    expect(el?.style.cssText).toContain('width: 200px');
  });

  it('should support custom height', async () => {
    skeleton = await createComponent<SniceSkeletonElement>('snice-skeleton', { height: '50px' });

    const el = queryShadow(skeleton as HTMLElement, '.skeleton') as HTMLElement;
    expect(el?.style.cssText).toContain('height: 50px');
  });

  it('should have default dimensions for circular variant', async () => {
    skeleton = await createComponent<SniceSkeletonElement>('snice-skeleton', { variant: 'circular' });

    const el = queryShadow(skeleton as HTMLElement, '.skeleton') as HTMLElement;
    expect(el?.style.cssText).toContain('width: 40px');
    expect(el?.style.cssText).toContain('height: 40px');
  });
  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/skeleton/snice-skeleton.css');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});
