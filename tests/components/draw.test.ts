import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/draw/snice-draw';
import { DrawPoint, DrawBrush } from '../../packages/components/src/draw/snice-draw';
import type { SniceDrawElement } from '../../packages/components/src/draw/snice-draw.types';

describe('snice-draw', () => {
  let draw: SniceDrawElement;

  afterEach(() => {
    if (draw) removeComponent(draw as unknown as HTMLElement);
  });

  it('should be defined', () => {
    expect(customElements.get('snice-draw')).toBeDefined();
  });

  describe('DrawPoint geometry', () => {
    it('measures distance between points', () => {
      const a = new DrawPoint(0, 0);
      expect(a.getDistanceTo({ x: 3, y: 4 })).toBe(5);
      expect(a.getDistanceTo({ x: 0, y: 0 })).toBe(0);
    });

    it('measures angle between points', () => {
      const a = new DrawPoint(0, 0);
      expect(a.getAngleTo({ x: -1, y: 0 })).toBeCloseTo(0);
      expect(a.getAngleTo({ x: 0, y: -1 })).toBeCloseTo(Math.PI / 2);
    });

    it('computes coordinate differences', () => {
      const a = new DrawPoint(10, 20);
      const diff = a.getDifferenceTo({ x: 4, y: 5 });
      expect(diff.x).toBe(6);
      expect(diff.y).toBe(15);
    });

    it('recognizes equal and unequal points', () => {
      const a = new DrawPoint(1, 2);
      expect(a.equalsTo({ x: 1, y: 2 })).toBe(true);
      expect(a.equalsTo({ x: 1, y: 3 })).toBe(false);
    });

    it('moveByAngle(0, d) advances along +x', () => {
      const a = new DrawPoint(0, 0);
      a.moveByAngle(0, 10);
      expect(a.x).toBeCloseTo(10);
      expect(a.y).toBeCloseTo(0);
    });

    it('update copies coordinates and toObject snapshots them', () => {
      const a = new DrawPoint(0, 0);
      a.update({ x: 7, y: 8 });
      expect(a.toObject()).toEqual({ x: 7, y: 8 });
    });
  });

  describe('DrawBrush lazy behavior', () => {
    it('keeps the brush still while the pointer stays inside the radius', () => {
      const brush = new DrawBrush({ radius: 50, enabled: true, initialPoint: { x: 100, y: 100 } });
      brush.update({ x: 120, y: 100 });

      expect(brush.brushHasMoved()).toBe(false);
      expect(brush.getBrushCoordinates()).toEqual({ x: 100, y: 100 });
      expect(brush.getPointerCoordinates()).toEqual({ x: 120, y: 100 });
    });

    it('drags the brush toward the pointer once it leaves the radius', () => {
      const brush = new DrawBrush({ radius: 50, enabled: true, initialPoint: { x: 100, y: 100 } });
      brush.update({ x: 200, y: 100 });

      expect(brush.brushHasMoved()).toBe(true);
      const b = brush.getBrushCoordinates();
      expect(b.x).toBeCloseTo(150, 0);
      expect(b.y).toBeCloseTo(100, 5);
    });

    it('ignores an update to the identical pointer position', () => {
      const brush = new DrawBrush({ radius: 50, initialPoint: { x: 5, y: 5 } });
      expect(brush.update({ x: 5, y: 5 })).toBe(false);
    });

    it('moves brush and pointer together when disabled', () => {
      const brush = new DrawBrush({ radius: 50, enabled: false, initialPoint: { x: 0, y: 0 } });
      brush.update({ x: 10, y: 10 });

      expect(brush.brushHasMoved()).toBe(true);
      expect(brush.getBrushCoordinates()).toEqual({ x: 10, y: 10 });
      expect(brush.getDistance()).toBe(0);
    });

    it('enable/disable and radius round-trip', () => {
      const brush = new DrawBrush({ radius: 30 });
      expect(brush.isEnabled()).toBe(true);
      brush.disable();
      expect(brush.isEnabled()).toBe(false);
      brush.enable();
      expect(brush.isEnabled()).toBe(true);
      brush.setRadius(75);
      expect(brush.getRadius()).toBe(75);
    });

    it('friction slows the brush without stopping it', () => {
      const free = new DrawBrush({ radius: 50, enabled: true, initialPoint: { x: 0, y: 0 } });
      free.update({ x: 200, y: 0 });
      const slowed = new DrawBrush({ radius: 50, enabled: true, initialPoint: { x: 0, y: 0 } });
      slowed.update({ x: 200, y: 0 }, { friction: 0.5 });

      expect(slowed.getBrushCoordinates().x).toBeGreaterThan(0);
      expect(slowed.getBrushCoordinates().x).toBeLessThan(free.getBrushCoordinates().x);
    });

    it('update with both moves brush directly onto the pointer', () => {
      const brush = new DrawBrush({ radius: 50, enabled: true, initialPoint: { x: 0, y: 0 } });
      brush.update({ x: 300, y: 300 }, { both: true });

      expect(brush.getBrushCoordinates()).toEqual({ x: 300, y: 300 });
    });
  });

  describe('element contract', () => {
    it('observes every documented attribute including kebab-case names', () => {
      const observed = (customElements.get('snice-draw') as any).observedAttributes as string[];
      for (const attr of ['stroke-width', 'background-color', 'lazy-radius', 'auto-polygon', 'polygon-curve-points', 'auto-circle', 'circle-points', 'tool', 'color', 'lazy', 'disabled', 'width', 'height', 'friction', 'smoothing']) {
        expect(observed, attr).toContain(attr);
      }
    });

    it('ships documented defaults', async () => {
      draw = await createComponent<SniceDrawElement>('snice-draw');
      await wait(20);

      expect(draw).toMatchObject({
        width: 800,
        height: 600,
        tool: 'pen',
        color: '#000000',
        strokeWidth: 2,
        backgroundColor: '#ffffff',
        lazy: false,
        lazyRadius: 60,
        disabled: false,
      });
    });

    it('clear, undo, and redo never throw regardless of canvas readiness', async () => {
      draw = await createComponent<SniceDrawElement>('snice-draw');
      await wait(20);

      expect(() => {
        draw.clear();
        draw.undo();
        draw.redo();
      }).not.toThrow();
    });

    it('undo and redo stay silent when there is no stroke history', async () => {
      draw = await createComponent<SniceDrawElement>('snice-draw');
      await wait(20);

      const undoSpy = vi.fn();
      const redoSpy = vi.fn();
      (draw as unknown as HTMLElement).addEventListener('draw-undo', undoSpy);
      (draw as unknown as HTMLElement).addEventListener('draw-redo', redoSpy);

      draw.undo();
      draw.redo();
      expect(undoSpy).not.toHaveBeenCalled();
      expect(redoSpy).not.toHaveBeenCalled();
    });

    it('toDataURL always returns a string, even without a usable canvas', async () => {
      draw = await createComponent<SniceDrawElement>('snice-draw');
      await wait(20);

      expect(typeof draw.toDataURL()).toBe('string');
    });
  });

  describe('stylesheet contracts', () => {
    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(resolve(process.cwd(), 'packages/components/src/draw/snice-draw.css'), 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(resolve(process.cwd(), 'packages/components/src/draw/snice-draw.css'), 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});
