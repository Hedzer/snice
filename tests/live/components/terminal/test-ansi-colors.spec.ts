import { test, expect } from '@playwright/test';

test('ANSI color parsing', async ({ page }) => {
  await page.goto('http://localhost:5566/tests/live/fixtures/terminal/visual.html');
  await page.waitForTimeout(1000);

  // Click the ANSI colors button
  await page.click('#ansi-colors');
  await page.waitForTimeout(500);

  // Coloured runs are .ansi-* classes — the colour is resolved by the
  // documented --snice-terminal-ansi-* custom properties, never an inline
  // literal (MATRIX-terminal-2).
  const facts = await page.evaluate(() => {
    const term = document.getElementById('terminal-4') as any;
    const output = term.shadowRoot.querySelector('.terminal-output');
    const spans = Array.from(output?.querySelectorAll('span[class*="ansi-"]') ?? []);
    const red = spans.find((s) => s.classList.contains('ansi-red'));
    return {
      count: spans.length,
      inlineStyles: spans.filter((s) => (s.getAttribute('style') ?? '').includes('color')).length,
      redFound: !!red,
      redColor: red ? getComputedStyle(red).color : null,
    };
  });

  expect(facts.count).toBeGreaterThan(0);
  expect(facts.inlineStyles).toBe(0);
  expect(facts.redFound).toBe(true);
  // The documented default for ANSI red, resolved through the custom property.
  expect(facts.redColor).toBe('rgb(205, 49, 49)');

  // The documented custom property really reaches the run: override it on the
  // host and the painted colour follows.
  await page.evaluate(() => {
    const term = document.getElementById('terminal-4') as any;
    term.style.setProperty('--snice-terminal-ansi-red', 'rgb(1, 2, 3)');
  });
  const overridden = await page.evaluate(() => {
    const term = document.getElementById('terminal-4') as any;
    const output = term.shadowRoot.querySelector('.terminal-output');
    const red = output?.querySelector('span.ansi-red');
    return red ? getComputedStyle(red).color : null;
  });
  expect(overridden).toBe('rgb(1, 2, 3)');
});
