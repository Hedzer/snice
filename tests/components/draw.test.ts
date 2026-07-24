import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import '../../packages/components/src/draw/snice-draw';

describe('snice-draw', () => {
  it('should be defined', () => {
    expect(customElements.get('snice-draw')).toBeDefined();
  });

  // Note: Draw component tests are limited because:
  // 1. Canvas API has limited support in test environment
  // 2. Drawing interactions require user input simulation
  // 3. Canvas rendering requires actual DOM rendering
  // Component functionality should be tested manually in demo.html

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