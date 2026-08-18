/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-terminal TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/terminal, `npm run test:matrix`) owns the
 * transcript: which lines exist, what they say, what type they carry, how the
 * streaming API commits a live line, what `max-lines` trims, what the events
 * report, and that written content cannot inject markup. What it structurally
 * cannot own is everything this component's documentation spends most of its
 * space on — a scrollable output area, a monospace grid, and TWENTY-SEVEN CSS
 * custom properties whose entire purpose is to change a painted colour.
 *
 * ── Layer 1 (every combo): geometry + computed style ────────────────────────
 *   · the output area really scrolls, and really is pinned to the newest line
 *     after a write (the doc's "Output scrollable area" plus the component's
 *     scroll-to-bottom on every write);
 *   · the input line really sits below the output, with the prompt to the left
 *     of the input and neither overlapping the other;
 *   · a `readonly` terminal really has no input box taking up space;
 *   · `--snice-terminal-height` really sizes the terminal;
 *   · every line type really paints its own documented colour custom property;
 *   · nothing occludes the transcript or the input.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   `--snice-terminal-error-color: <x>` "reaches the computed style" and "is
 *   the colour on the screen" are different claims. The captures also pin the
 *   standing finding: an ANSI run's colour is a hardcoded inline literal, so
 *   the sixteen documented `--snice-terminal-ansi-*` properties change nothing
 *   a camera could see.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/terminal/matrix.html';

/** The documented line types, and the custom property each one is themed by. */
const LINE_TYPES = [
  { type: 'input', property: '--snice-terminal-input-color' },
  { type: 'output', property: '--snice-terminal-output-color' },
  { type: 'error', property: '--snice-terminal-error-color' },
  { type: 'info', property: '--snice-terminal-info-color' },
  { type: 'success', property: '--snice-terminal-success-color' },
  { type: 'warning', property: '--snice-terminal-warning-color' },
] as const;

/** A distinctive colour per type, so a mix-up between two of them is visible. */
const PROBE_COLOURS: Record<string, { css: string; rgb: string }> = {
  input: { css: 'rgb(10, 200, 90)', rgb: 'rgb(10, 200, 90)' },
  output: { css: 'rgb(200, 10, 90)', rgb: 'rgb(200, 10, 90)' },
  error: { css: 'rgb(240, 60, 60)', rgb: 'rgb(240, 60, 60)' },
  info: { css: 'rgb(60, 120, 240)', rgb: 'rgb(60, 120, 240)' },
  success: { css: 'rgb(20, 180, 20)', rgb: 'rgb(20, 180, 20)' },
  warning: { css: 'rgb(230, 190, 30)', rgb: 'rgb(230, 190, 30)' },
};

interface Combo {
  id: string;
  readonly: boolean;
  showTimestamps: boolean;
  prompt: string;
  height: number;
  lineCount: number;
  stageWidth: number;
  lines: Array<{ content: string; type: string }>;
  vars: Record<string, string>;
}

/**
 * The cross: `readonly` (2) x `show-timestamps` (2) x height (3) x transcript
 * length (3) = 36 combos, with the prompt and the stage width rotated across
 * them. The transcript lengths straddle the terminal's own height so the
 * scrollable case and the not-yet-scrollable case are both covered.
 */
function generateCombos(): Combo[] {
  const prompts = ['$ ', '> ', 'snice:~$ '];
  const widths = [420, 720, 1000];
  const combos: Combo[] = [];
  let n = 0;
  for (const readonly of [false, true]) {
    for (const showTimestamps of [false, true]) {
      for (const height of [180, 320, 500]) {
        for (const lineCount of [1, 8, 60]) {
          const lines = Array.from({ length: lineCount }, (_, i) => ({
            content: `line ${i} — the quick brown fox`,
            type: LINE_TYPES[i % LINE_TYPES.length].type,
          }));
          combos.push({
            id: `readonly=${readonly}/timestamps=${showTimestamps}/height=${height}`
              + `/lines=${lineCount}/[prompt="${prompts[n % 3]}",width=${widths[n % 3]}]`,
            readonly, showTimestamps, height, lineCount,
            prompt: prompts[n % 3], stageWidth: widths[n % 3], lines,
            vars: Object.fromEntries(LINE_TYPES.map(({ type, property }) =>
              [property, PROBE_COLOURS[type].css])),
          });
          n++;
        }
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate(({ combo, colours }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.5;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const tokens = (node: Element) => (node.getAttribute('part') ?? '').split(/\s+/);
    const pick = (name: string) =>
      [...sr.querySelectorAll('[part]')].find(n => tokens(n).includes(name)) as HTMLElement | undefined;

    const container = pick('container');
    const output = pick('output');
    if (!container || !output) { say('a documented container part is missing'); return problems; }

    const hostBox = host.getBoundingClientRect();
    const outputBox = output.getBoundingClientRect();

    if (getComputedStyle(host).visibility !== 'visible') say('host is not visible');
    if (hostBox.width < 1 || hostBox.height < 1) {
      say(`host box is ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    // ── `--snice-terminal-height` sizes the terminal ──────────────────────
    // The doc lists it with a default of 400px, which only means anything if
    // the property actually decides the height.
    if (Math.abs(hostBox.height - combo.height) > 2) {
      say(`--snice-terminal-height: ${combo.height}px produced a`
        + ` ${hostBox.height.toFixed(1)}px terminal`);
    }

    // ── The output area is the documented "Output scrollable area" ────────
    const overflow = getComputedStyle(output).overflowY;
    if (overflow !== 'auto' && overflow !== 'scroll') {
      say(`the output area computes overflow-y "${overflow}", so it cannot scroll`);
    }
    if (outputBox.height < 1) say('the output area has no height');
    if (output.scrollHeight > output.clientHeight + 1) {
      // Overflowing: the newest line must be the one on screen. The component
      // scrolls to the bottom after every write, and a terminal that showed the
      // top of a 60-line transcript would be showing the oldest output.
      const distanceFromBottom = output.scrollHeight - output.clientHeight - output.scrollTop;
      if (distanceFromBottom > 2) {
        say(`the transcript overflows by ${(output.scrollHeight - output.clientHeight).toFixed(0)}px`
          + ` but is scrolled ${distanceFromBottom.toFixed(0)}px short of the newest line`);
      }
    }

    // ── The input line ────────────────────────────────────────────────────
    const inputLine = pick('input-line');
    const prompt = pick('prompt');
    const input = pick('input');

    if (combo.readonly) {
      if (inputLine || input) say('a readonly terminal still lays out an input line');
    } else {
      if (!inputLine || !prompt || !input) {
        say('a documented input part is missing');
      } else {
        const lineBox = inputLine.getBoundingClientRect();
        const promptBox = prompt.getBoundingClientRect();
        const inputBox = input.getBoundingClientRect();

        // Below the transcript, inside the container, prompt to the left.
        if (lineBox.top < outputBox.bottom - EPS) {
          say(`the input line starts at ${lineBox.top.toFixed(1)}, above the end of the`
            + ` output area at ${outputBox.bottom.toFixed(1)}`);
        }
        if (lineBox.bottom > hostBox.bottom + 2) say('the input line falls outside the terminal');
        if (promptBox.width < 1) say('the prompt has no width');
        if (inputBox.width < 1) say('the input has no width');
        if (inputBox.left < promptBox.right - EPS) {
          say(`the input starts at ${inputBox.left.toFixed(1)}, overlapping the prompt`
            + ` that ends at ${promptBox.right.toFixed(1)}`);
        }
        // Both on the same baseline row.
        if (Math.abs(promptBox.top - inputBox.top) > lineBox.height) {
          say('the prompt and the input are not on the same line');
        }
        // The one thing a terminal must be.
        const family = getComputedStyle(input).fontFamily.toLowerCase();
        if (!family.includes('mono') && !family.includes('courier') && !family.includes('consolas')) {
          say(`the input font-family is "${family}", which is not monospaced`);
        }
      }
    }

    // ── Every documented line-type colour reaches the paint ───────────────
    for (const [type, want] of Object.entries(colours)) {
      const line = sr.querySelector(`.terminal-line.${type}`);
      if (!line) continue; // this combo's transcript is too short to hold one
      const content = (line.querySelector('.line-content') ?? line) as HTMLElement;
      const got = getComputedStyle(content).color;
      if (got !== want) {
        say(`a "${type}" line computes color ${got}; its documented custom property`
          + ` was set to ${want}`);
      }
    }

    // ── Timestamps take room of their own ────────────────────────────────
    const stamps = [...sr.querySelectorAll('.line-timestamp')] as HTMLElement[];
    if (combo.showTimestamps) {
      if (!stamps.length) say('show-timestamps rendered no timestamps');
      for (const stamp of stamps.slice(0, 5)) {
        const box = stamp.getBoundingClientRect();
        if (box.width < 1) say('a timestamp has no width');
        const lineEl = stamp.closest('.terminal-line') as HTMLElement;
        const contentEl = lineEl?.querySelector('.line-content') as HTMLElement;
        if (contentEl) {
          const contentBox = contentEl.getBoundingClientRect();
          if (contentBox.left < box.right - EPS) {
            say('the line content overlaps its own timestamp');
          }
        }
      }
    } else if (stamps.length) {
      say(`${stamps.length} timestamps rendered without show-timestamps`);
    }

    // ── Nothing occludes the terminal ────────────────────────────────────
    const probe = { x: outputBox.left + outputBox.width / 2, y: outputBox.top + 8 };
    if (probe.y >= 0 && probe.y <= window.innerHeight) {
      const hit = document.elementFromPoint(probe.x, probe.y);
      if (hit !== host && !host.contains(hit)) {
        say(`the output area hit-tests as <${hit?.tagName.toLowerCase() ?? 'nothing'}>`);
      }
    }

    return problems;
  }, {
    combo,
    colours: Object.fromEntries(LINE_TYPES.map(({ type }) => [type, PROBE_COLOURS[type].rgb])),
  });
}

const combos = generateCombos();

test.describe('terminal visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.readonly).toBe(combo.readonly);
      expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
    });
  }
});

test.describe('terminal visual matrix: the transcript stays pinned to the newest line', () => {
  test('a write while scrolled to the bottom keeps the newest line on screen', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      height: 200, stageWidth: 720, prompt: '$ ',
      lines: Array.from({ length: 40 }, (_, i) => ({ content: `line ${i}`, type: 'output' })),
    } as any);

    const before = await page.evaluate(() => (window as any).matrix.boxes());
    expect(before.scrollHeight, 'the transcript does not overflow, so nothing is being tested')
      .toBeGreaterThan(before.clientHeight);

    await page.evaluate(() => {
      (document.getElementById('subject') as any).writeln('the newest line', 'success');
    });
    await page.waitForTimeout(80);

    const after = await page.evaluate(() => (window as any).matrix.boxes());
    expect(after.scrollHeight - after.clientHeight - after.scrollTop,
      'a new line did not scroll into view').toBeLessThanOrEqual(2);
  });

  test('a streamed live line grows in place rather than pushing a new row', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      height: 300, stageWidth: 720, prompt: '$ ', chunks: [{ content: 'down', type: 'output' }],
    } as any);

    const first = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const line = sr.querySelector('.terminal-line')!.getBoundingClientRect();
      return { count: sr.querySelectorAll('.terminal-line').length, top: line.top, width: line.width };
    });

    await page.evaluate(() => {
      (document.getElementById('subject') as any).appendChunk('loading… 42%');
    });
    await page.waitForTimeout(80);

    const second = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const line = sr.querySelector('.terminal-line')!.getBoundingClientRect();
      return {
        count: sr.querySelectorAll('.terminal-line').length,
        top: line.top,
        text: sr.querySelector('.line-content')!.textContent,
      };
    });

    expect(second.count, 'the live line was replaced by a second row').toBe(first.count);
    expect(Math.abs(second.top - first.top), 'the live line moved').toBeLessThan(1.5);
    expect(second.text).toBe('downloading… 42%');
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('terminal visual matrix: marquee pixels', () => {
  /**
   * A text row is mostly background with ink on the glyphs. The INK is the
   * sampled pixel furthest from the row's most frequent (field) colour.
   *
   * Both marquee probes below compare inks, not single pixels at a fixed
   * offset: engines ship different default monospace fonts, and a probe at
   * "x + 3" that lands on an E's stroke in one engine lands between strokes
   * in another, where it reads only the terminal background — a fact about
   * the font, not about the component. A strip across the row crosses glyph
   * strokes in every engine, so the ink measurement is the discriminating
   * claim the docs make: this run is painted in a different colour.
   */
  const inkOf = (samples: RGB[]): { ink: RGB; strength: number } => {
    const counts = new Map<string, number>();
    for (const p of samples) counts.set(p.join(','), (counts.get(p.join(',')) ?? 0) + 1);
    const field = ([...counts.entries()].sort((a, b) => b[1] - a[1])[0][0])
      .split(',').map(Number) as RGB;
    const ink = samples.reduce((best, p) =>
      contrast(p, field) > contrast(best, field) ? p : best, samples[0]);
    return { ink, strength: contrast(ink, field) };
  };

  test('an error line is really painted in its themed colour', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c), {
      height: 260, stageWidth: 720, prompt: '$ ',
      vars: { '--snice-terminal-error-color': 'rgb(255, 0, 128)' },
      lines: [
        { content: 'ordinary output', type: 'output' },
        { content: 'EEEEEEEEEEEEEEEEEEEEEEEE', type: 'error' },
      ],
    } as any);

    const pixels = await capture(
      page, '#subject', 'terminal-error-colour',
      `(host) => {
        const sr = host.shadowRoot;
        const strip = (sel) => {
          const b = sr.querySelector(sel).getBoundingClientRect();
          return Array.from({ length: 24 }, (_, i) => ({
            x: b.x + 1 + (b.width - 2) * (i / 23), y: b.y + b.height / 2,
          }));
        };
        return [...strip('.terminal-line.error .line-content'),
                ...strip('.terminal-line.output .line-content')];
      }`,
    );
    const error = inkOf(pixels.slice(0, 24));
    const output = inkOf(pixels.slice(24));
    // Each row must really have ink — a strip that never crossed a glyph
    // would make the comparison below vacuous.
    expect(error.strength,
      `the error row's best sample is only ${error.strength.toFixed(2)}:1 from its`
      + ' own field — no glyphs were painted').toBeGreaterThan(1.5);
    expect(output.strength,
      `the output row's best sample is only ${output.strength.toFixed(2)}:1 from its`
      + ' own field — no glyphs were painted').toBeGreaterThan(1.5);
    expect(sameColor(error.ink, output.ink),
      `the error line's ink painted rgb(${error.ink.join(',')}), identical to`
      + ` ordinary output's rgb(${output.ink.join(',')})`).toBe(false);
  });

  /**
   * MATRIX-terminal-2 (fixed — the DOM tier's finding, measured where it is
   * visible)
   *
   * Combo:    `--snice-terminal-ansi-red: rgb(0, 255, 0)` on a terminal that
   *           writes `\x1b[31mfailed\x1b[0m`.
   * Expected: the run is painted the colour the documented custom property was
   *           set to. The doc lists sixteen `--snice-terminal-ansi-*` properties
   *           under "CSS Custom Properties", and the component's own stylesheet
   *           defines `.ansi-red { color: var(--snice-terminal-ansi-red, …) }`
   *           for each of them.
   * Fixed:    `parseAnsiColors()` emits the `.ansi-*` classes instead of a
   *           hardcoded inline literal, so the documented properties reach the
   *           painted run.
   */
  test('MATRIX-terminal-2 (fixed): --snice-terminal-ansi-red repaints an ANSI red run', async () => {
    const runColour = async (override?: string) => {
      await page.evaluate(c => (window as any).matrix.mount(c), {
        height: 220, stageWidth: 720, prompt: '$ ',
        vars: override ? { '--snice-terminal-ansi-red': override } : {},
        lines: [{ content: '[31mfailed[0m', type: 'output' }],
      } as any);
      return page.evaluate(() => (window as any).matrix.ansiColor());
    };

    const themed = await runColour('rgb(0, 255, 0)');
    const unthemed = await runColour();
    expect(themed, `themed run computed ${themed}, unthemed run computed ${unthemed}`)
      .not.toBe(unthemed);
  });

  test('an ANSI run is at least painted differently from the text around it', async () => {
    // The finding above is about THEMING. The colour itself does arrive, and
    // that much a screenshot can confirm — so the two claims stay separate.
    await page.evaluate(c => (window as any).matrix.mount(c), {
      height: 220, stageWidth: 720, prompt: '$ ',
      lines: [{ content: '[32mSSSSSSSSSSSSSSSS[0m plain', type: 'output' }],
    } as any);

    const pixels = await capture(
      page, '#subject', 'terminal-ansi-run',
      `(host) => {
        const sr = host.shadowRoot;
        const content = sr.querySelector('.line-content');
        const span = content.querySelector('span').getBoundingClientRect();
        const strip = (b) => Array.from({ length: 20 }, (_, i) => ({
          x: b.x + 1 + (b.width - 2) * (i / 19), y: b.y + b.height / 2,
        }));
        // The plain text after the run is a bare text node; a Range covers it.
        const textNode = [...content.childNodes].find(n =>
          n.nodeType === 3 && n.textContent.includes('plain'));
        const range = document.createRange();
        range.selectNodeContents(textNode);
        return [...strip(span), ...strip(range.getBoundingClientRect())];
      }`,
    );
    const run = inkOf(pixels.slice(0, 20));
    const plain = inkOf(pixels.slice(20));
    expect(run.strength,
      `the ANSI run's best sample is only ${run.strength.toFixed(2)}:1 from its`
      + ' own field — no glyphs were painted').toBeGreaterThan(1.5);
    expect(plain.strength,
      `the plain text's best sample is only ${plain.strength.toFixed(2)}:1 from its`
      + ' own field — no glyphs were painted').toBeGreaterThan(1.5);
    expect(sameColor(run.ink, plain.ink),
      `the ANSI run's ink painted rgb(${run.ink.join(',')}), identical to the plain`
      + ` text's rgb(${plain.ink.join(',')})`).toBe(false);
  });
});
