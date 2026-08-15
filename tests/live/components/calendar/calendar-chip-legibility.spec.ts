import { test, expect } from '@playwright/test';

// Legibility of the two things a month view says in passing: the event chip
// and the hover tooltip. Both defects only exist once something is painted —
// chip width comes from real column layout, and the tooltip's contrast comes
// from resolved theme custom properties — so they live here, not in happy-dom.
//
// Covers, against the calendar showcase:
//  - the showcase's own avatar sources resolve (they were page-relative, so
//    /components/calendar/demo.html asked for a path that 404s);
//  - a one-cell chip spends its width on the title instead of an avatar;
//  - a segment wide enough for both still shows the avatar, image and all;
//  - tooltip text clears WCAG AA on its own surface, in both themes.

const demoPath = '/components/calendar/demo.html';

/** Contrast helpers run in the page: relative luminance per WCAG 2.1. */
const contrastProbe = `
  const parse = (c) => (c.match(/[\\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (fg, bg) => {
    const [a, b] = [lum(parse(fg)), lum(parse(bg))].sort((x, y) => y - x);
    return (a + 0.05) / (b + 0.05);
  };
`;

async function firstCalendarBars(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const cal = document.getElementById('cal-default') as HTMLElement;
    const root = cal.shadowRoot!;
    return [...root.querySelectorAll('.calendar__event-bar')].map((bar) => {
      const title = bar.querySelector('.calendar__event-title') as HTMLElement;
      const avatar = bar.querySelector('snice-avatar') as HTMLElement | null;
      return {
        id: bar.getAttribute('data-event-id'),
        cols: (bar as HTMLElement).style.gridColumn,
        barWidth: +bar.getBoundingClientRect().width.toFixed(1),
        text: title?.textContent ?? '',
        visibleFraction: title ? title.clientWidth / Math.max(1, title.scrollWidth) : 0,
        titleWidth: title?.clientWidth ?? 0,
        hasAvatar: !!avatar,
        avatarLoaded: avatar
          ? !!(avatar.shadowRoot?.querySelector('img') as HTMLImageElement | null)?.naturalWidth
          : null,
      };
    });
  });
}

test.describe('Snice Calendar chip and tooltip legibility', () => {
  test('showcase avatar sources resolve from the component demo URL', async ({ page }) => {
    const broken: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 400 && /\/assets\//.test(r.url())) broken.push(`${r.status()} ${r.url()}`);
    });

    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-calendar'));
    await page.waitForTimeout(400);

    expect(broken).toEqual([]);

    // And the avatars that do render actually painted an image, not initials.
    const bars = await firstCalendarBars(page);
    const withAvatar = bars.filter(b => b.hasAvatar);
    expect(withAvatar.length).toBeGreaterThan(0);
    expect(withAvatar.filter(b => !b.avatarLoaded)).toEqual([]);
  });

  test('a one-cell chip spends its width on the title, not on an avatar', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-calendar'));
    await page.waitForTimeout(400);

    const bars = await firstCalendarBars(page);
    // 4.5rem is the component's avatar threshold; the showcase's 400px
    // calendar makes every one-day chip narrower than it.
    const single = bars.filter(b => b.barWidth < 4.5 * 16);
    expect(single.length).toBeGreaterThan(0);

    for (const bar of single) {
      expect(bar.hasAvatar, `${bar.text}: avatar on a ${bar.barWidth}px chip`).toBe(false);
      // Most of the title is actually readable (it was ~57% — "Des…").
      expect(bar.visibleFraction, `${bar.text} visible fraction`).toBeGreaterThan(0.8);
      // A title long enough to clip gets every pixel inside the chip's
      // (halved) padding — nothing else is competing for the room.
      if (bar.visibleFraction < 1) {
        expect(bar.titleWidth, `${bar.text} title width`).toBeGreaterThan(bar.barWidth - 8);
      }
    }
  });

  test('a segment wide enough for both still carries its avatar', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-calendar'));
    await page.waitForTimeout(400);

    const bars = await firstCalendarBars(page);
    const wide = bars.filter(b => b.barWidth >= 4.5 * 16 && b.id === 'd4');
    expect(wide.length).toBeGreaterThan(0);
    expect(wide.every(b => b.hasAvatar)).toBe(true);
  });

  for (const theme of ['dark', 'light'] as const) {
    test(`hover tooltip text clears AA contrast on its own surface (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('snice-theme', t), theme);
      await page.goto(demoPath);
      await page.waitForFunction(() => !!customElements.get('snice-calendar'));
      await page.waitForTimeout(400);

      // Hover the first chip; the showcase resolves a rich tooltip (title line
      // plus a dimmer date line) after a short delay.
      await page.evaluate(() => {
        const cal = document.getElementById('cal-default') as HTMLElement;
        const bar = cal.shadowRoot!.querySelector('.calendar__event-bar') as HTMLElement;
        bar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
      });
      await page.waitForFunction(() => {
        const cal = document.getElementById('cal-default') as HTMLElement;
        const tip = cal.shadowRoot!.querySelector('.calendar__tooltip') as HTMLElement;
        return tip && !tip.hidden && tip.textContent!.trim().length > 0;
      });

      const report = await page.evaluate(`(() => {
        ${contrastProbe}
        const cal = document.getElementById('cal-default');
        const tip = cal.shadowRoot.querySelector('.calendar__tooltip');
        const bg = getComputedStyle(tip).backgroundColor;
        const nodes = [tip, ...tip.querySelectorAll('*')].filter(
          (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
        return { bg, lines: nodes.map((el) => ({
          text: el.textContent.trim().slice(0, 24),
          color: getComputedStyle(el).color,
          ratio: +ratio(getComputedStyle(el).color, bg).toFixed(2),
        })) };
      })()`) as { bg: string; lines: Array<{ text: string; color: string; ratio: number }> };

      expect(report.lines.length).toBeGreaterThan(0);
      expect(report.lines.filter(l => l.ratio < 4.5)).toEqual([]);
    });
  }
});
