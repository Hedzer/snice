import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Renders the generated documentation and guide and drives them the way a
 * developer would: read the sidebar, follow the deep links, land on the right
 * section, in both themes. Structural assertions live in
 * tests/docs-structure.test.ts and tests/guide-docs-alignment.test.ts; this
 * spec exists because those can pass while the page renders nothing.
 */

const root = process.cwd();
const docsUrl = 'http://localhost:5566/docs.html';
const guideUrl = 'http://localhost:5566/guide.html';

const guideManifest = JSON.parse(
  readFileSync(join(root, 'website/guide/manifest.json'), 'utf8')
);
const guideSections = guideManifest.groups.flatMap((g: any) =>
  g.sections.map((s: any) => ({ ...s, group: g.title }))
);

const builder = readFileSync(join(root, 'tooling/website/build-website.js'), 'utf8');
const docPages = Array.from(
  builder.matchAll(/\{\s*id:\s*'([\w-]+)',\s*file:\s*'([\w.-]+)',\s*title:\s*'([^']*)'\s*\}/g)
).map(m => ({ id: m[1], title: m[3] }));

test.describe.configure({ mode: 'serial', timeout: 60_000 });

test.describe('Documentation site', () => {
  test('every published doc page renders with content when opened', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    for (const doc of docPages) {
      await page.goto(`${docsUrl}#${doc.id}`, { waitUntil: 'domcontentloaded' });
      const section = page.locator(`#${doc.id}`);

      await expect(section, `docs.html is missing #${doc.id}`).toHaveCount(1);
      // `innerText` returns text for display:none nodes, so assert on
      // visibility rather than on string length.
      await expect(section, `#${doc.id} did not open`).toBeVisible();

      const text = (await section.innerText()).trim();
      expect(text.length, `#${doc.id} rendered empty`).toBeGreaterThan(200);
    }

    expect(errors, `page errors: ${errors.join('; ')}`).toEqual([]);
  });

  test('shows exactly one reference page at a time', async ({ page }) => {
    await page.goto(docsUrl, { waitUntil: 'domcontentloaded' });

    const visible = async () =>
      page.$$eval('.doc-file', els =>
        els.filter(e => getComputedStyle(e).display !== 'none').map(e => e.id));

    // With no hash, the first page opens rather than all of them.
    expect(await visible()).toEqual([docPages[0].id]);

    for (const id of ['properties', 'cli', 'routing']) {
      await page.goto(`${docsUrl}#${id}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(200);
      expect(await visible(), `#${id} should be the only page shown`).toEqual([id]);
    }
  });

  test('keeps the page and its sidebar to a usable size', async ({ page }) => {
    // Concatenating every doc produced a page ~165,000px tall and a sidebar of
    // 174 links. Both made the reference unusable.
    await page.goto(docsUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const { pageHeight, sidebarLinks } = await page.evaluate(() => ({
      pageHeight: document.body.scrollHeight,
      sidebarLinks: [...document.querySelectorAll('.docs-sidebar a')]
        .filter(a => (a as HTMLElement).offsetParent !== null).length,
    }));

    expect(pageHeight, `page is ${pageHeight}px tall`).toBeLessThan(40000);
    expect(sidebarLinks, `${sidebarLinks} sidebar links visible`).toBeLessThan(60);
  });

  test('expands sub-headings only for the open page', async ({ page }) => {
    await page.goto(`${docsUrl}#properties`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    const open = await page.$$eval('.doc-subnav', els =>
      els.filter(e => getComputedStyle(e).display !== 'none').map(e => (e as HTMLElement).dataset.doc));
    expect(open).toEqual(['properties']);
  });

  test('sidebar lists every group and links to every page', async ({ page }) => {
    await page.goto(docsUrl, { waitUntil: 'domcontentloaded' });

    for (const group of ['Core', 'Patterns', 'Styling', 'Tooling', 'Integration']) {
      await expect(
        page.locator('.docs-sidebar', { hasText: group }),
        `sidebar missing group ${group}`
      ).toHaveCount(1);
    }

    for (const doc of docPages) {
      await expect(
        page.locator(`.docs-sidebar a[href="#${doc.id}"]`),
        `sidebar has no link to ${doc.id}`
      ).toHaveCount(1);
    }
  });

  test('clicking a sidebar link scrolls that page into view', async ({ page }) => {
    await page.goto(docsUrl, { waitUntil: 'domcontentloaded' });

    for (const id of ['properties', 'lifecycle', 'queries', 'styling', 'theme', 'cli', 'testing']) {
      await page.locator(`.docs-sidebar a[href="#${id}"]`).click();
      await page.waitForTimeout(250);

      const box = await page.locator(`#${id}`).boundingBox();
      expect(box, `#${id} has no layout box`).not.toBeNull();
      // Landed near the top of the viewport rather than off-screen.
      expect(Math.abs(box!.y), `#${id} did not scroll into view (y=${box!.y})`).toBeLessThan(400);

      // …and clear of the sticky header, not clipped underneath it.
      const headerBottom = await page.evaluate(() => {
        const header = document.querySelector('header');
        return header ? header.getBoundingClientRect().bottom : 0;
      });
      expect(
        box!.y,
        `#${id} is clipped under the sticky header (top ${box!.y} < header bottom ${headerBottom})`
      ).toBeGreaterThanOrEqual(headerBottom - 1);
    }
  });

  test('renders in light mode as well as dark', async ({ page }) => {
    await page.goto(docsUrl, { waitUntil: 'domcontentloaded' });

    for (const theme of ['dark', 'light']) {
      await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      await page.waitForTimeout(200);

      const { color, background } = await page.evaluate(() => {
        const styles = getComputedStyle(document.body);
        return { color: styles.color, background: styles.backgroundColor };
      });
      expect(color, `${theme}: body has no colour`).toBeTruthy();
      expect(background, `${theme}: body has no background`).toBeTruthy();
      expect(color, `${theme}: text and background are identical`).not.toBe(background);
    }
  });
});

test.describe('Guide links into the documentation', () => {
  test('every guide section renders and links to a page that exists', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(guideUrl, { waitUntil: 'domcontentloaded' });

    for (const section of guideSections) {
      await expect(
        page.locator(`#${section.id}`),
        `guide is missing section #${section.id}`
      ).toHaveCount(1);

      if (!section.docs) continue;
      await expect(
        page.locator(`#${section.id} a[href="docs.html#${section.docs}"]`),
        `section ${section.id} has no link to docs.html#${section.docs}`
      ).toHaveCount(1);
    }

    expect(errors, `page errors: ${errors.join('; ')}`).toEqual([]);
  });

  test('following a guide deep link lands on the matching doc section', async ({ page }) => {
    const checks = ['properties', 'lifecycle', 'queries', 'styling', 'controllers', 'cli'];

    for (const target of checks) {
      const section = guideSections.find((s: any) => s.docs === target);
      if (!section) continue;

      await page.goto(guideUrl, { waitUntil: 'domcontentloaded' });
      await page.locator(`#${section.id} a[href="docs.html#${target}"]`).first().click();
      await page.waitForLoadState('domcontentloaded');

      expect(page.url(), `did not navigate to docs.html#${target}`).toContain(`docs.html#${target}`);

      const heading = page.locator(`#${target}`);
      await expect(heading, `docs.html#${target} does not exist`).toHaveCount(1);

      // The page grows as code blocks upgrade, so the landing position is only
      // meaningful once it has settled — poll rather than sampling the race.
      await expect
        .poll(
          async () => Math.abs((await heading.boundingBox())?.y ?? Infinity),
          { message: `#${target} never settled into view after following the deep link`, timeout: 5000 }
        )
        .toBeLessThan(400);
    }
  });

  test('the declarative/imperative switcher works in the rendered page', async ({ page }) => {
    await page.goto(guideUrl, { waitUntil: 'domcontentloaded' });

    const groups = page.locator('.code-tabgroup');
    const count = await groups.count();
    expect(count, 'no code tab groups rendered').toBeGreaterThan(0);

    const first = groups.first();
    await first.locator('.code-tab', { hasText: 'Imperative' }).click();
    await page.waitForTimeout(200);

    await expect(first.locator('.code-panel.active')).toHaveAttribute('data-panel', 'imperative');
    // Switching one group must not switch the others.
    await expect(groups.nth(1).locator('.code-panel.active')).toHaveAttribute('data-panel', 'declarative');
  });
});
