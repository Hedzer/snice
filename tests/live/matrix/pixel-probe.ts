/**
 * LAYER 2 plumbing: read the pixels a browser actually painted.
 *
 * The screenshot is decoded BY THE BROWSER UNDER TEST (createImageBitmap +
 * canvas), so the numbers come from the same engine that painted them and the
 * repo gains no image-decoding dependency. Probe points are resolved from the
 * live DOM in the SAME evaluate that reads the pixels — a screenshot scrolls
 * its element into view, and geometry captured before that scroll no longer
 * lines up with the image.
 *
 * This is a deliberate sibling of the helper inside
 * tests/live/components/table/table-stripes-and-loading.spec.ts rather than an
 * import of it: that file is a SPEC, and importing a spec from a spec makes
 * Playwright collect its tests twice. The matrix tier owns this copy, and adds
 * the one thing the original does not need — writing the PNG to disk so the
 * capture can be opened and looked at.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, type Page } from '@playwright/test';

/**
 * Where the captures land: `<repo>/test-results/matrix-visual`.
 *
 * Derived from the project's own `testDir` rather than `import.meta.url`,
 * because Playwright runs these specs from a transpiled copy in its transform
 * cache — `import.meta.url` points into that cache and the PNGs would be
 * written somewhere nobody will ever look. `testDir` is `<repo>/tests/live/matrix`.
 */
export function captureDir(): string {
  return join(test.info().project.testDir, '..', '..', '..', 'test-results', 'matrix-visual');
}

export type RGB = [number, number, number];

/** WCAG relative luminance. */
export function luminance([r, g, b]: RGB): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function sameColor(a: RGB, b: RGB): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Screenshot `selector`, save it under `test-results/matrix-visual/<name>.png`,
 * then read the painted pixels at the viewport points `probe` returns. `probe`
 * is source for a browser-side `(host) => Point[]`; it runs after the
 * screenshot, next to the element's own box, so both come from the same layout.
 */
export async function capture(
  page: Page,
  selector: string,
  name: string,
  probe: string,
): Promise<RGB[]> {
  const buffer = await page.locator(selector).screenshot({ animations: 'disabled' });
  const dir = captureDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${name}.png`), buffer);

  const png = buffer.toString('base64');
  return page.evaluate(async ({ png, selector, probe }) => {
    const host = document.querySelector(selector) as HTMLElement;
    const resolve = new Function(`return (${probe})`)() as (h: HTMLElement) => { x: number; y: number }[];
    const points = resolve(host);
    const box = host.getBoundingClientRect();

    const blob = await (await fetch(`data:image/png;base64,${png}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    const scale = bitmap.width / box.width;

    return points.map((p) => {
      const x = Math.min(bitmap.width - 1, Math.max(0, Math.round((p.x - box.x) * scale)));
      const y = Math.min(bitmap.height - 1, Math.max(0, Math.round((p.y - box.y) * scale)));
      const d = ctx.getImageData(x, y, 1, 1).data;
      return [d[0], d[1], d[2]] as RGB;
    });
  }, { png, selector, probe });
}
