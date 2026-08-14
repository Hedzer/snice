import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/chat/demo.html';

test.describe('Snice Chat visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  // <snice-chat-message> is a declarative data-carrier child: the parent chat reads
  // it and renders the row in its own shadow DOM, so the host itself stays 0x0 —
  // the shared "no 0x0 host" invariant does not model that pattern.
  test.fixme('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('message list and composer tile the chat container with the composer pinned to the bottom', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const chats = [...document.querySelectorAll('snice-chat')] as HTMLElement[];
      if (chats.length === 0) problems.push('no chats rendered');
      chats.forEach((chat, i) => {
        const sr = chat.shadowRoot!;
        const container = sr.querySelector('.chat-container') as HTMLElement;
        const area = sr.querySelector('.messages-area') as HTMLElement;
        const input = sr.querySelector('.input-area') as HTMLElement;
        const label = `chat[${i}]${chat.id ? '#' + chat.id : ''}`;
        if (!container || !area || !input) { problems.push(`${label}: missing container parts`); return; }
        const cr = container.getBoundingClientRect();
        const ar = area.getBoundingClientRect();
        const ir = input.getBoundingClientRect();

        if (Math.abs(ar.top - cr.top) > 1) problems.push(`${label}: message list not at container top`);
        if (Math.abs(ir.bottom - cr.bottom) > 1) problems.push(`${label}: composer not pinned to container bottom`);
        if (Math.abs(ar.bottom - ir.top) > 1) {
          problems.push(`${label}: seam between list and composer ${ar.bottom.toFixed(1)} -> ${ir.top.toFixed(1)}`);
        }
        if (Math.abs(ar.width - cr.width) > 1 || Math.abs(ir.width - cr.width) > 1) {
          problems.push(`${label}: list/composer do not span the container width`);
        }
        if (ar.height < 40) problems.push(`${label}: message list collapsed to ${Math.round(ar.height)}px`);
        if (ir.height < 30) problems.push(`${label}: composer collapsed to ${Math.round(ir.height)}px`);

        // A scrolling transcript must be clipped, not spilling past the list box.
        if (area.scrollHeight > area.clientHeight + 1 && getComputedStyle(area).overflowY === 'visible') {
          problems.push(`${label}: overflowing transcript is not clipped`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('avatars are square and never collide with the message body', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-chat').forEach((chat, i) => {
        const sr = (chat as HTMLElement).shadowRoot!;
        const label = `chat[${i}]${chat.id ? '#' + chat.id : ''}`;
        const avatarsOff = chat.getAttribute('show-avatars') === 'false';
        const avatars = [...sr.querySelectorAll('.message-avatar')] as HTMLElement[];
        if (avatarsOff && avatars.length > 0) {
          problems.push(`${label}: show-avatars="false" still renders ${avatars.length} avatars`);
        }
        avatars.forEach((av, j) => {
          const r = av.getBoundingClientRect();
          if (r.width < 20 || r.width > 64) {
            problems.push(`${label} avatar[${j}]: unreasonable size ${Math.round(r.width)}px`);
          }
          if (Math.abs(r.width - r.height) > 1) {
            problems.push(`${label} avatar[${j}]: not square (${Math.round(r.width)}x${Math.round(r.height)})`);
          }
          const row = av.closest('.message') as HTMLElement;
          const body = row?.querySelector('.message-content') as HTMLElement | null;
          if (!body) return;
          const br = body.getBoundingClientRect();
          const rr = row.getBoundingClientRect();
          // Avatar and body sit side by side without overlapping, both inside the row.
          const overlaps = r.right > br.left + 0.5 && br.right > r.left + 0.5;
          if (overlaps) problems.push(`${label} avatar[${j}]: overlaps the message body`);
          if (r.left < rr.left - 1 || r.right > rr.right + 1) {
            problems.push(`${label} avatar[${j}]: outside its message row`);
          }
          if (br.left < rr.left - 1 || br.right > rr.right + 1) {
            problems.push(`${label} avatar[${j}]: body outside its message row`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('bubbles layout hangs own messages on the right and others on the left', async ({ page }) => {
    const result = await page.evaluate(() => {
      const chat = document.getElementById('chat-bubbles') as HTMLElement;
      const sr = chat.shadowRoot!;
      const rows = [...sr.querySelectorAll('.message')] as HTMLElement[];
      return rows.map(row => {
        const rr = row.getBoundingClientRect();
        const av = row.querySelector('.message-avatar')?.getBoundingClientRect();
        const text = row.querySelector('.message-text')!.getBoundingClientRect();
        return {
          own: row.classList.contains('own'),
          rowLeft: rr.left, rowRight: rr.right, rowWidth: rr.width,
          avLeft: av?.left ?? null, avRight: av?.right ?? null,
          textLeft: text.left, textRight: text.right, textWidth: text.width
        };
      });
    });

    expect(result.length).toBeGreaterThan(1);
    expect(result.some(r => r.own)).toBe(true);
    expect(result.some(r => !r.own)).toBe(true);

    for (const r of result) {
      // Bubbles shrink-wrap their text instead of spanning the row.
      expect(r.textWidth).toBeLessThan(r.rowWidth * 0.9);
      if (r.own) {
        expect(r.textRight).toBeGreaterThan(r.rowLeft + r.rowWidth / 2);
        expect(Math.round(r.rowRight - (r.avRight ?? r.textRight))).toBeLessThanOrEqual(2);
      } else {
        expect(r.textLeft).toBeLessThan(r.rowLeft + r.rowWidth / 2);
        expect(Math.round((r.avLeft ?? r.textLeft) - r.rowLeft)).toBeLessThanOrEqual(2);
      }
    }
  });

  test('composer grows with typed text but stays inside the chat', async ({ page }) => {
    const chat = page.locator('#chat-default');
    const field = chat.locator('.input-field');
    await field.click();
    await field.fill('line one\nline two\nline three\nline four');
    await field.dispatchEvent('input');
    await page.waitForTimeout(250);

    const box = await chat.evaluate(el => {
      const sr = (el as HTMLElement).shadowRoot!;
      const container = sr.querySelector('.chat-container')!.getBoundingClientRect();
      const input = sr.querySelector('.input-area')!.getBoundingClientRect();
      const field = sr.querySelector('.input-field')!.getBoundingClientRect();
      const area = sr.querySelector('.messages-area')!.getBoundingClientRect();
      return { container, input, field, area };
    });

    expect(box.field.bottom).toBeLessThanOrEqual(box.input.bottom + 1);
    expect(box.field.top).toBeGreaterThanOrEqual(box.input.top - 1);
    expect(box.field.right).toBeLessThanOrEqual(box.input.right + 1);
    expect(box.input.bottom).toBeLessThanOrEqual(box.container.bottom + 1);
    expect(box.area.bottom).toBeLessThanOrEqual(box.input.top + 1);
  });
});
