import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/user-card/visual.html';

test.describe('Snice User Card visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('avatars are squares at their variant size with the status dot pinned to the corner', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const cards = [...document.querySelectorAll('snice-user-card')] as HTMLElement[];
      if (cards.length === 0) problems.push('no user cards rendered');

      cards.forEach(card => {
        const variant = card.getAttribute('variant') ?? 'card';
        const tag = `${variant} "${card.getAttribute('name') || '(unnamed)'}"`;
        const root = card.shadowRoot!;
        const wrapper = root.querySelector('.user-card-avatar-wrapper') as HTMLElement | null;
        const avatar = root.querySelector('.user-card-avatar, .user-card-avatar-fallback') as HTMLElement | null;
        if (!wrapper || !avatar) { problems.push(`${tag}: no avatar`); return; }

        const ar = avatar.getBoundingClientRect();
        // 5rem for card/horizontal, 2.5rem for compact.
        const expected = variant === 'compact' ? 40 : 80;
        if (Math.abs(ar.width - expected) > 1 || Math.abs(ar.height - expected) > 1) {
          problems.push(`${tag} avatar: ${Math.round(ar.width)}x${Math.round(ar.height)}, expected ${expected}px square`);
        }
        // Even a broken avatar URL must not collapse or stretch the box.
        if (Math.abs(ar.width - ar.height) > 1) {
          problems.push(`${tag} avatar: not square`);
        }

        const shell = root.querySelector('.user-card') as HTMLElement | null;
        if (shell) {
          const sr = shell.getBoundingClientRect();
          if (ar.left < sr.left - 1 || ar.right > sr.right + 1
            || ar.top < sr.top - 1 || ar.bottom > sr.bottom + 1) {
            problems.push(`${tag} avatar: escapes the card`);
          }
        }

        const dot = root.querySelector('.user-card-status') as HTMLElement | null;
        if (!card.hasAttribute('status')) return;
        if (!dot) { problems.push(`${tag}: status set but no dot`); return; }
        const dr = dot.getBoundingClientRect();
        if (dr.width < 8 || dr.width > 20 || Math.abs(dr.width - dr.height) > 1) {
          problems.push(`${tag} status dot: ${Math.round(dr.width)}x${Math.round(dr.height)}`);
        }
        // Anchored to the avatar's bottom-right, overlapping it, not floating away.
        const wr = wrapper.getBoundingClientRect();
        if (dr.right > wr.right + 1 || dr.bottom > wr.bottom + 1) {
          problems.push(`${tag} status dot: escapes the avatar wrapper`);
        }
        if (dr.left < wr.left + wr.width / 2 || dr.top < wr.top + wr.height / 2) {
          problems.push(`${tag} status dot: not in the bottom-right quadrant of the avatar`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('social links tile as equal squares inside the card', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      let seen = 0;
      ['uc-social-all', 'uc-social-dev', 'uc-full'].forEach(id => {
        const card = document.getElementById(id);
        if (!card) { problems.push(`#${id} missing`); return; }
        const root = (card as HTMLElement).shadowRoot!;
        const shell = root.querySelector('.user-card') as HTMLElement;
        const links = [...root.querySelectorAll('.user-card-social-link')] as HTMLElement[];
        if (links.length === 0) { problems.push(`#${id}: no social links rendered`); return; }
        seen += links.length;
        const sr = shell.getBoundingClientRect();

        const sizes = links.map(l => Math.round(l.getBoundingClientRect().width));
        if (Math.max(...sizes) - Math.min(...sizes) > 1) {
          problems.push(`#${id}: social links differ in size (${sizes.join(',')})`);
        }

        links.forEach((link, i) => {
          const r = link.getBoundingClientRect();
          if (r.width < 20 || Math.abs(r.width - r.height) > 1) {
            problems.push(`#${id} social[${i}]: ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
          if (r.left < sr.left - 1 || r.right > sr.right + 1
            || r.bottom > sr.bottom + 1 || r.top < sr.top - 1) {
            problems.push(`#${id} social[${i}]: escapes the card`);
          }
          // Icons within the link must be centred and smaller than it.
          const icon = link.querySelector('svg, .user-card-social-icon') as HTMLElement | null;
          if (icon) {
            const ir = icon.getBoundingClientRect();
            if (ir.width > r.width || ir.height > r.height) {
              problems.push(`#${id} social[${i}]: icon larger than its button`);
            }
            const dx = (ir.left + ir.width / 2) - (r.left + r.width / 2);
            const dy = (ir.top + ir.height / 2) - (r.top + r.height / 2);
            if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
              problems.push(`#${id} social[${i}]: icon off-center by (${Math.round(dx)},${Math.round(dy)})`);
            }
          }
          // Links on the same row must not overlap each other.
          if (i > 0) {
            const prev = links[i - 1].getBoundingClientRect();
            const sameRow = Math.abs(prev.top - r.top) < 2;
            if (sameRow && r.left < prev.right - 1) {
              problems.push(`#${id} social[${i}]: overlaps the link before it`);
            }
          }
        });
      });
      if (seen === 0) problems.push('no social links found across the showcase');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('name, role and contact rows wrap inside the card instead of overflowing it', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-user-card').forEach(card => {
        const tag = `"${(card as HTMLElement).getAttribute('name') || '(unnamed)'}"`;
        const root = (card as HTMLElement).shadowRoot!;
        const shell = root.querySelector('.user-card') as HTMLElement | null;
        if (!shell) return;
        const sr = shell.getBoundingClientRect();

        ['.user-card-name', '.user-card-role'].forEach(sel => {
          const el = root.querySelector(sel) as HTMLElement | null;
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.width === 0) return;
          if (r.right > sr.right + 1 || r.left < sr.left - 1) {
            problems.push(`${tag} ${sel}: ${Math.round(r.left)}-${Math.round(r.right)} outside card ${Math.round(sr.left)}-${Math.round(sr.right)}`);
          }
          // Long text must wrap, not run off on one line.
          if (el.scrollWidth > Math.ceil(r.width) + 1) {
            problems.push(`${tag} ${sel}: text ${el.scrollWidth}px wide in a ${Math.round(r.width)}px box`);
          }
        });

        root.querySelectorAll('.user-card-contact-item').forEach((item, i) => {
          const r = item.getBoundingClientRect();
          if (r.right > sr.right + 1) problems.push(`${tag} contact[${i}]: overhangs the card`);
          const icon = item.querySelector('.user-card-contact-icon') as HTMLElement | null;
          const text = item.querySelector('.user-card-contact-text, .user-card-contact-link') as HTMLElement | null;
          if (!icon || !text) return;
          const ir = icon.getBoundingClientRect();
          const trr = text.getBoundingClientRect();
          if (trr.left < ir.right - 1) problems.push(`${tag} contact[${i}]: text overlaps its icon`);
          if (ir.width > 32 || ir.height > 32) {
            problems.push(`${tag} contact[${i}]: icon oversized ${Math.round(ir.width)}x${Math.round(ir.height)}`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
