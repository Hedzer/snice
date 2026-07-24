import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import '../../packages/components/src/camera/snice-camera';

describe('snice-camera', () => {
  it('should be defined', () => {
    expect(customElements.get('snice-camera')).toBeDefined();
  });

  // Note: Camera component tests are limited because:
  // 1. Requires actual camera hardware
  // 2. Requires browser permissions
  // 3. Only works over HTTPS or localhost
  // 4. Test environment doesn't have getUserMedia support
  // Component functionality should be tested manually in demo.html

  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/camera/snice-camera.css');

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