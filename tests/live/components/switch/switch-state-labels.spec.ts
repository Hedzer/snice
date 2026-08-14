import { test, expect, type Page } from '@playwright/test';

// SNICE-168: label-on/label-off were clipped by the thumb because the track
// had a hardcoded per-size width and the checked thumb offset was a fixed
// translate. The track must size to its widest state label, and thumb travel
// must follow the actual track width (including ::part(track) overrides).

interface Box { x: number; y: number; width: number; height: number; }

async function shadowBox(page: Page, hostId: string, selector: string): Promise<Box> {
  const box = await page.locator(`#${hostId}`).locator(selector).boundingBox();
  expect(box, `#${hostId} ${selector} should render`).not.toBeNull();
  return box!;
}

function right(box: Box): number {
  return box.x + box.width;
}

test.describe('Snice Switch state label layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/live/fixtures/switch/state-labels.html');
    await page.waitForFunction(() => {
      const switches = Array.from(document.querySelectorAll('snice-switch'));
      return switches.length === 8
        && switches.every(host => host.shadowRoot?.querySelector('.switch-track'));
    });
  });

  for (const id of ['medium-off', 'medium-long', 'large-long']) {
    test(`off label stays visible beside the thumb (#${id})`, async ({ page }) => {
      const track = await shadowBox(page, id, '.switch-track');
      const thumb = await shadowBox(page, id, '.switch-thumb');
      const offLabel = await shadowBox(page, id, '.switch-state-label--off');

      // Label fully inside the track…
      expect(offLabel.x).toBeGreaterThanOrEqual(track.x - 0.5);
      expect(right(offLabel)).toBeLessThanOrEqual(right(track) + 0.5);
      // …and clear of the thumb, which paints above it.
      expect(right(thumb)).toBeLessThanOrEqual(offLabel.x + 0.5);
    });
  }

  for (const id of ['medium-long-checked', 'large-long-checked']) {
    test(`on label stays visible beside the checked thumb (#${id})`, async ({ page }) => {
      const track = await shadowBox(page, id, '.switch-track');
      const thumb = await shadowBox(page, id, '.switch-thumb');
      const onLabel = await shadowBox(page, id, '.switch-state-label--on');

      expect(onLabel.x).toBeGreaterThanOrEqual(track.x - 0.5);
      expect(right(onLabel)).toBeLessThanOrEqual(right(track) + 0.5);
      expect(right(onLabel)).toBeLessThanOrEqual(thumb.x + 0.5);
    });
  }

  test('small size keeps its compact track (labels are hidden there)', async ({ page }) => {
    const labeled = await shadowBox(page, 'small-labeled', '.switch-track');
    const plain = await shadowBox(page, 'small-plain', '.switch-track');

    const hidden = await page.evaluate(() => {
      const host = document.querySelector('#small-labeled')!;
      const label = host.shadowRoot!.querySelector('.switch-state-label--off')!;
      return getComputedStyle(label).display === 'none';
    });
    expect(hidden).toBe(true);
    expect(Math.abs(labeled.width - plain.width)).toBeLessThanOrEqual(0.5);
  });

  test('checked thumb travel follows a ::part(track) width override', async ({ page }) => {
    const track = await shadowBox(page, 'widened', '.switch-track');
    const thumb = await shadowBox(page, 'widened', '.switch-thumb');

    // 8rem track: the thumb must rest at the far end (2px inset), not at the
    // fixed travel distance sized for the default track.
    const gap = right(track) - right(thumb);
    expect(gap).toBeGreaterThanOrEqual(0);
    expect(gap).toBeLessThanOrEqual(6);
  });
});
