import { describe, it, expect } from 'vitest';
import '../../components/paint/snice-paint';

describe('snice-paint', () => {
  it('should be defined', () => {
    expect(customElements.get('snice-paint')).toBeDefined();
  });

  it('should create element with default properties', () => {
    const el = document.createElement('snice-paint') as any;
    expect(el.color).toBe('#3b82f6');
    expect(el.strokeWidth).toBe(3);
    expect(el.minStrokeWidth).toBe(1);
    expect(el.maxStrokeWidth).toBe(20);
    expect(el.controls).toBe('colors,size,eraser,undo,redo,clear');
    expect(el.backgroundColor).toBe('#ffffff');
    expect(el.disabled).toBe(false);
  });

  it('should have default colors palette', () => {
    const el = document.createElement('snice-paint') as any;
    expect(el.colors).toHaveLength(8);
    expect(el.colors[0]).toBe('#3b82f6');
  });

  it('should accept custom colors as array', () => {
    const el = document.createElement('snice-paint') as any;
    el.colors = ['#ff0000', '#00ff00'];
    expect(el.colors).toEqual(['#ff0000', '#00ff00']);
  });

  it('should accept custom colors as JSON string', () => {
    const el = document.createElement('snice-paint') as any;
    el.colors = '["#ff0000","#00ff00"]';
    expect(el.colors).toEqual(['#ff0000', '#00ff00']);
  });

  it('should have public methods', () => {
    const el = document.createElement('snice-paint') as any;
    expect(typeof el.undo).toBe('function');
    expect(typeof el.redo).toBe('function');
    expect(typeof el.clear).toBe('function');
    expect(typeof el.toDataURL).toBe('function');
    expect(typeof el.toBlob).toBe('function');
    expect(typeof el.download).toBe('function');
    expect(typeof el.getStrokes).toBe('function');
    expect(typeof el.setStrokes).toBe('function');
  });

  it('should return empty strokes initially', () => {
    const el = document.createElement('snice-paint') as any;
    expect(el.getStrokes()).toEqual([]);
  });

  // Note: Canvas drawing tests are limited in JSDOM environment.
  // Manual testing recommended for drawing interactions.
});
