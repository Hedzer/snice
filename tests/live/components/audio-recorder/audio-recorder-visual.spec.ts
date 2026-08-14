import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/audio-recorder/demo.html';

test.describe('Snice Audio Recorder visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('control buttons stay inside the recorder container at a tappable size', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const hosts = [...document.querySelectorAll('snice-audio-recorder')] as any[];
      if (!hosts.length) problems.push('no snice-audio-recorder on page');
      hosts.forEach((host, i) => {
        const container = host.shadowRoot?.querySelector('.recorder-container');
        if (!container) { problems.push(`recorder[${i}]: no .recorder-container`); return; }
        const cr = container.getBoundingClientRect();
        if (cr.width < 100 || cr.height < 20) {
          problems.push(`recorder[${i}]: container ${Math.round(cr.width)}x${Math.round(cr.height)}`);
        }
        const buttons = [...container.querySelectorAll('.recorder-btn')] as HTMLElement[];
        buttons.forEach((btn, b) => {
          const r = btn.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return; // hidden state button
          if (r.width < 24 || r.height < 24) {
            problems.push(`recorder[${i}] btn[${b}]: ${Math.round(r.width)}x${Math.round(r.height)} too small`);
          }
          if (r.left < cr.left - 1 || r.right > cr.right + 1
              || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) {
            problems.push(`recorder[${i}] btn[${b}]: escapes the container`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('visualizer bars tile inside the visualizer track and respect show-visualizer', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const hosts = [...document.querySelectorAll('snice-audio-recorder')] as any[];
      hosts.forEach((host, i) => {
        const root = host.shadowRoot;
        const viz = root?.querySelector('.recorder-visualizer') as HTMLElement | null;
        const off = host.getAttribute('show-visualizer') === 'false';
        if (off) {
          if (viz && viz.getBoundingClientRect().height > 0) {
            problems.push(`recorder[${i}]: show-visualizer=false still renders a visualizer`);
          }
          return;
        }
        if (!viz) return;
        const vr = viz.getBoundingClientRect();
        if (vr.height === 0) return;
        const bars = [...viz.querySelectorAll('.visualizer-bar')] as HTMLElement[];
        bars.forEach((bar, b) => {
          const r = bar.getBoundingClientRect();
          if (r.height > vr.height + 1 || r.top < vr.top - 1 || r.bottom > vr.bottom + 1) {
            problems.push(`recorder[${i}] bar[${b}]: taller than its track`);
          }
          if (r.left < vr.left - 1 || r.right > vr.right + 1) {
            problems.push(`recorder[${i}] bar[${b}]: overflows the track horizontally`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
