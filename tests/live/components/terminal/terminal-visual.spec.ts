import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/terminal/demo.html';

test.describe('Snice Terminal visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('output pane and input line stack inside the fixed-height shell without spilling', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const terms = [...document.querySelectorAll('snice-terminal')] as HTMLElement[];
      if (terms.length === 0) problems.push('no terminals rendered');

      terms.forEach(term => {
        const id = term.id || 'terminal';
        const root = term.shadowRoot!;
        const container = root.querySelector('.terminal-container') as HTMLElement | null;
        const output = root.querySelector('.terminal-output') as HTMLElement | null;
        if (!container || !output) { problems.push(`${id}: missing container or output`); return; }
        const hr = term.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        const or = output.getBoundingClientRect();

        // The shell is a fixed-height box; the container fills it and nothing
        // inside grows past it.
        if (cr.bottom > hr.bottom + 1 || cr.top < hr.top - 1) {
          problems.push(`${id}: container escapes the host vertically`);
        }
        if (or.bottom > cr.bottom + 1 || or.top < cr.top - 1) {
          problems.push(`${id}: output pane escapes the container`);
        }

        const inputLine = root.querySelector('.terminal-input-line') as HTMLElement | null;
        if (term.hasAttribute('readonly')) {
          if (inputLine && inputLine.getBoundingClientRect().height > 0) {
            problems.push(`${id}: readonly terminal still shows an input line`);
          }
        } else if (!inputLine) {
          problems.push(`${id}: no input line on a writable terminal`);
        } else {
          const ir = inputLine.getBoundingClientRect();
          // Input line sits below the output pane, inside the shell.
          if (ir.top < or.bottom - 1) problems.push(`${id}: input line overlaps the output pane`);
          if (ir.bottom > hr.bottom + 1) {
            problems.push(`${id}: input line pushed ${Math.round(ir.bottom - hr.bottom)}px below the shell`);
          }
          const prompt = inputLine.querySelector('.terminal-prompt') as HTMLElement | null;
          const input = inputLine.querySelector('.terminal-input') as HTMLElement | null;
          if (prompt && input) {
            const pr = prompt.getBoundingClientRect();
            const nr = input.getBoundingClientRect();
            if (nr.left < pr.right - 1) problems.push(`${id}: input overlaps the prompt`);
            if (nr.right > ir.right + 1) problems.push(`${id}: input overhangs the input line`);
            if (Math.abs((pr.top + pr.height / 2) - (nr.top + nr.height / 2)) > 3) {
              problems.push(`${id}: prompt and input are off a shared baseline`);
            }
          }
        }

        // Long histories scroll the output pane rather than stretching it.
        if (output.scrollHeight > Math.ceil(or.height) + 1
            && getComputedStyle(output).overflowY === 'visible') {
          problems.push(`${id}: ${output.scrollHeight}px of history in a ${Math.round(or.height)}px pane with overflow-y:visible`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('monospace lines share a left column and a fixed timestamp gutter', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];

      document.querySelectorAll('snice-terminal').forEach(term => {
        const id = (term as HTMLElement).id || 'terminal';
        const output = term.shadowRoot?.querySelector('.terminal-output') as HTMLElement | null;
        if (!output) return;
        const contents = [...output.querySelectorAll('.line-content')] as HTMLElement[];
        if (contents.length < 2) return;

        // Every line's text starts on the same column — the whole point of a
        // terminal. With timestamps on, the fixed stamp column must not make
        // rows ragged either.
        const lefts = contents.map(c => Math.round(c.getBoundingClientRect().left));
        if (Math.max(...lefts) - Math.min(...lefts) > 1) {
          problems.push(`${id}: ragged left column (${[...new Set(lefts)].join(',')})`);
        }

        const stamps = [...output.querySelectorAll('.line-timestamp')] as HTMLElement[];
        if (stamps.length > 1) {
          const sl = stamps.map(s => Math.round(s.getBoundingClientRect().left));
          const sw = stamps.map(s => Math.round(s.getBoundingClientRect().width));
          if (Math.max(...sl) - Math.min(...sl) > 1) problems.push(`${id}: timestamps not left-aligned`);
          if (Math.max(...sw) - Math.min(...sw) > 1) problems.push(`${id}: timestamp column width varies`);
        }

        // Lines tile downward with no overlap and stay inside the pane's width.
        const or = output.getBoundingClientRect();
        contents.forEach((c, i) => {
          const r = c.getBoundingClientRect();
          if (r.right > or.right + 1) problems.push(`${id} line[${i}]: overhangs the pane`);
          if (i > 0) {
            const prev = contents[i - 1].getBoundingClientRect();
            if (r.top < prev.bottom - 1) problems.push(`${id} line[${i}]: overlaps the line above`);
          }
        });
      });

      // The custom-styled terminal must honour --snice-terminal-height: 300px.
      const styled = document.getElementById('terminal-5');
      if (!styled) problems.push('#terminal-5 (custom styling) missing');
      else {
        const h = styled.getBoundingClientRect().height;
        if (Math.abs(h - 300) > 1) problems.push(`#terminal-5 is ${Math.round(h)}px tall, expected 300`);
      }

      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('streamed lines tile the pane and typing keeps the caret inside the input line', async ({ page }) => {
    const term = page.locator('#terminal-4');
    // The demo writes its own intro lines on DOMContentLoaded; wait for that to
    // settle before taking a baseline, or the count race gives a false failure.
    const count = () => term.evaluate((h: any) =>
      h.shadowRoot.querySelectorAll('.line-content').length);
    await expect.poll(count).toBeGreaterThan(0);
    let before = await count();
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(100);
      const now = await count();
      if (now === before) break;
      before = now;
    }

    await page.locator('#stream-lines').click();
    await expect.poll(count).toBe(before + 5);

    const streamed = await term.evaluate((h: any) => {
      const root = h.shadowRoot as ShadowRoot;
      const output = root.querySelector('.terminal-output') as HTMLElement;
      const lines = [...root.querySelectorAll('.line-content')] as HTMLElement[];
      const or = output.getBoundingClientRect();
      const problems: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const prev = lines[i - 1].getBoundingClientRect();
        const cur = lines[i].getBoundingClientRect();
        if (cur.top < prev.bottom - 1) problems.push(`streamed line[${i}] overlaps the one above`);
        if (cur.right > or.right + 1) problems.push(`streamed line[${i}] overhangs the pane`);
      }
      return {
        count: lines.length, problems,
        // A streaming terminal must stay pinned to the newest output.
        pinnedToBottom: output.scrollHeight - output.scrollTop - output.clientHeight <= 2,
      };
    });

    expect(streamed.problems).toEqual([]);
    expect(streamed.count).toBe(before + 5);
    expect(streamed.pinnedToBottom).toBe(true);

    await term.locator('.terminal-input').click();
    await page.keyboard.type('echo a-fairly-long-command --with-flags');
    await page.waitForTimeout(150);

    const failures = await term.evaluate((host: any) => {
      const problems: string[] = [];
      const root = host.shadowRoot as ShadowRoot;
      const line = root.querySelector('.terminal-input-line') as HTMLElement;
      const input = root.querySelector('.terminal-input') as HTMLInputElement;
      const lr = line.getBoundingClientRect();
      const ir = input.getBoundingClientRect();

      if (input.value.length === 0) problems.push('typing did not reach the input');
      if (ir.right > lr.right + 1 || ir.left < lr.left - 1) {
        problems.push('input box overflows its line after typing');
      }
      if (ir.bottom > host.getBoundingClientRect().bottom + 1) {
        problems.push('input pushed below the terminal shell after typing');
      }
      // The text field scrolls its own overflow rather than growing the line.
      if (input.scrollWidth > Math.ceil(ir.width) + 1
          && getComputedStyle(input).overflowX === 'visible') {
        problems.push('long command text is not clipped to the input box');
      }
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
