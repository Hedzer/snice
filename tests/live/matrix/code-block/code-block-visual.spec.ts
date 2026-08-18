/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-code-block TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/code-block, `npm run test:matrix`) owns text
 * truth: which lines are printed, which gutter numbers they carry, which rows
 * are marked, and the whole format/highlight/grammar/copy pipeline. It cannot
 * own visual truth, because happy-dom performs no layout — every box reads 0,
 * nothing scrolls and nothing is painted.
 *
 * Six documented claims are reachable ONLY here:
 *
 *   · the HEADER sits above the code and never over it; the filename is on one
 *     side and the copy button on the other (`justify-content: space-between`);
 *   · `copyable=false` really takes the button off the screen, rather than
 *     leaving an invisible click target where it was;
 *   · `show-line-numbers` puts a fixed-width gutter LEFT of every line of code,
 *     and the code starts at the same x on every row — the whole point of a
 *     gutter is that it aligns;
 *   · `highlightLines` paints a background and a left rule on exactly the
 *     marked rows. In the DOM this is a class name; on screen it is a colour;
 *   · `.code-block__content` promises `overflow-x: auto`, so a line too long
 *     for the box must SCROLL rather than escape the block or wrap silently;
 *   · `theme="dark"` and `theme="light"` are forced palettes. That they are two
 *     different palettes, and that the code stays legible against each, is a
 *     contrast claim no DOM assertion can make.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/code-block/matrix.html';

const SNIPPETS = ['oneLine', 'threeLines', 'withBlank', 'json'] as const;
const THEMES = ['', 'dark', 'light'] as const;

interface Combo {
  id: string;
  snippet: typeof SNIPPETS[number];
  theme: typeof THEMES[number];
  showLineNumbers: boolean;
  startLine?: number;
  highlightLines?: number[];
  copyable: boolean;
  filename: string;
  narrow?: boolean;
}

/**
 * The cross: 4 snippets x 3 themes x all 4 vectors of {show-line-numbers,
 * copyable} = 48 combos, with the filename and the highlight set rotated
 * across the product so both are covered in every structural shape without
 * multiplying the count again.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  let n = 0;
  for (const snippet of SNIPPETS) {
    for (const theme of THEMES) {
      for (const showLineNumbers of [false, true]) {
        for (const copyable of [false, true]) {
          const startLine = n % 3 === 1 ? 10 : undefined;
          const highlightLines = n % 2 === 0 ? [(startLine ?? 1) + 1] : undefined;
          combos.push({
            id: `${snippet}/theme=${theme || 'auto'}`
              + `/${showLineNumbers ? 'gutter' : 'no-gutter'}`
              + `/${copyable ? 'copyable' : 'not-copyable'}`
              + (startLine ? `/start=${startLine}` : '')
              + (highlightLines ? `/highlight=[${highlightLines}]` : ''),
            snippet, theme, showLineNumbers, startLine, highlightLines, copyable,
            filename: n % 2 === 0 ? 'app.ts' : '',
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

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo, sourceLines: string[]): Promise<string[]> {
  return page.evaluate(({ combo, sourceLines }) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);
    const EPS = 1.0;

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partNamed = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;

    const container = partNamed('container');
    if (!container) { say('no part="container"'); return problems; }
    const containerBox = rect(container);
    if (containerBox.width <= 0 || containerBox.height <= 0) {
      say(`the container renders at ${containerBox.width}x${containerBox.height}`);
      return problems;
    }

    const header = partNamed('header');
    const content = partNamed('content');
    const pre = partNamed('pre');
    const code = partNamed('code');
    if (!content) { say('no part="content"'); return problems; }
    if (!pre) { say('no part="pre"'); return problems; }
    if (!code) { say('no part="code"'); return problems; }

    const contentBox = rect(content);
    const codeBox = rect(code);

    // ── The header sits above the code, never over it ───────────────────────
    const headerShown = !!header && getComputedStyle(header).display !== 'none';
    if (headerShown) {
      const headerBox = rect(header!);
      if (headerBox.height <= 0) say(`part="header" renders at ${headerBox.width}x${headerBox.height}`);
      if (headerBox.bottom > contentBox.top + EPS) {
        say(`the header (bottom ${headerBox.bottom.toFixed(1)}) overlaps the code`
          + ` (top ${contentBox.top.toFixed(1)})`);
      }
      if (headerBox.width < containerBox.width - EPS) {
        say(`the header is ${headerBox.width.toFixed(0)}px in a`
          + ` ${containerBox.width.toFixed(0)}px block — it does not span it`);
      }

      // filename left, copy button right — `justify-content: space-between`.
      const filename = partNamed('filename');
      const copyButton = partNamed('copy-button');
      if (combo.filename) {
        if (!filename) {
          say('a named block rendered no part="filename"');
        } else {
          const box = rect(filename);
          if (box.width <= 0 || box.height <= 0) {
            say(`part="filename" renders at ${box.width}x${box.height}`);
          }
        }
      }
      if (!copyButton) {
        say('no part="copy-button"');
      } else {
        const box = rect(copyButton);
        const buttonShown = getComputedStyle(copyButton).display !== 'none'
          && box.width > 0 && box.height > 0;
        if (combo.copyable && !buttonShown) {
          say(`a copyable block's button renders at ${box.width}x${box.height}`);
        }
        if (!combo.copyable && buttonShown) {
          say(`copyable=false still paints a ${box.width.toFixed(0)}x${box.height.toFixed(0)}`
            + ' copy button');
        }
        if (combo.copyable && buttonShown) {
          if (getComputedStyle(copyButton).cursor !== 'pointer') {
            say(`the copy button's cursor is "${getComputedStyle(copyButton).cursor}"`);
          }
          if (combo.filename && filename && rect(filename).right > box.left + EPS) {
            say('the filename and the copy button overlap in the header');
          }
          // The button is a real hit target, not a decoration behind glass.
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          const outer = document.elementFromPoint(x, y);
          if (outer !== host) {
            say(`the copy button's hit-test found`
              + ` <${outer?.tagName.toLowerCase() ?? 'nothing'}>, not the block`);
          }
        }
      }
    }

    // ── Every rendered line has a box, and they stack ───────────────────────
    const lines = [...code.querySelectorAll('.code-block__line')] as HTMLElement[];
    const structured = combo.showLineNumbers || !!combo.highlightLines;
    if (structured) {
      if (lines.length !== sourceLines.length) {
        say(`${lines.length} rendered line boxes for ${sourceLines.length} source lines`);
      }
      let previousBottom = -Infinity;
      for (const [i, line] of lines.entries()) {
        const box = rect(line);
        if (box.height <= 0) say(`line ${i} renders at ${box.width}x${box.height}`);
        if (box.top < previousBottom - EPS) say(`lines ${i - 1}/${i} overlap vertically`);
        previousBottom = box.bottom;
      }
    } else if (lines.length > 0) {
      say(`${lines.length} line boxes were rendered without line numbers or highlights`);
    }

    // ── The gutter: left of the code, and the same width on every row ──────
    const gutters = [...code.querySelectorAll('.code-block__line-number')] as HTMLElement[];
    if (combo.showLineNumbers) {
      if (gutters.length !== sourceLines.length) {
        say(`${gutters.length} gutter cells for ${sourceLines.length} lines`);
      }
      const widths = new Set(gutters.map(g => Math.round(rect(g).width)));
      if (widths.size > 1) {
        say(`the gutter is ${[...widths].join('/')}px wide on different rows — it does not align`);
      }
      for (const [i, gutter] of gutters.entries()) {
        const gutterBox = rect(gutter);
        if (gutterBox.width <= 0 || gutterBox.height <= 0) {
          say(`gutter ${i} renders at ${gutterBox.width}x${gutterBox.height}`);
          continue;
        }
        const line = lines[i];
        if (!line) continue;
        if (gutterBox.left < rect(line).left - EPS) {
          say(`gutter ${i} starts left of its own line box`);
        }
        // A gutter is not selectable — it is not part of the code.
        if (getComputedStyle(gutter).userSelect !== 'none') {
          say(`gutter ${i} is selectable — copying the code would take the numbers too`);
        }
      }
    } else if (gutters.length > 0) {
      say(`${gutters.length} gutter cells rendered without show-line-numbers`);
    }

    // ── Highlighted rows really paint ──────────────────────────────────────
    const marked = lines.filter(line =>
      (line.getAttribute('class') ?? '').split(/\s+/).includes('code-block__line--highlight'));
    if (combo.highlightLines?.length) {
      const start = combo.startLine ?? 1;
      const inRange = combo.highlightLines
        .filter(n => n - start >= 0 && n - start < sourceLines.length);
      if (marked.length !== inRange.length) {
        say(`${marked.length} rows carry the highlight, expected ${inRange.length}`);
      }
      for (const line of marked) {
        const cs = getComputedStyle(line);
        if (cs.backgroundColor === 'rgba(0, 0, 0, 0)') {
          say('a highlighted row painted no background');
        }
        if (parseFloat(cs.borderLeftWidth) <= 0) {
          say('a highlighted row painted no left rule');
        }
        const plain = lines.find(l => !marked.includes(l));
        if (plain && getComputedStyle(plain).backgroundColor === cs.backgroundColor) {
          say('a highlighted row and a plain row paint the same background');
        }
      }
    } else if (marked.length > 0) {
      say(`${marked.length} rows carry the highlight class without highlightLines`);
    }

    // ── The code stays inside the block ────────────────────────────────────
    if (codeBox.width <= 0 || codeBox.height <= 0) {
      say(`part="code" renders at ${codeBox.width}x${codeBox.height}`);
    }
    if (contentBox.right > containerBox.right + EPS
      || contentBox.left < containerBox.left - EPS) {
      say('the content area escapes the block horizontally');
    }
    if (contentBox.bottom > containerBox.bottom + EPS) {
      say('the content area escapes the block vertically');
    }

    // ── Long lines scroll, they do not escape ──────────────────────────────
    const scrollerX = getComputedStyle(content).overflowX;
    if (scrollerX !== 'auto' && scrollerX !== 'scroll') {
      say(`the content area's overflow-x is "${scrollerX}" — a long line could never be reached`);
    }
    if (content.scrollWidth > content.clientWidth + 1) {
      // Overflowing is fine; overflowing INVISIBLY is not.
      if (getComputedStyle(container).overflow === 'visible') {
        say('the block overflows with overflow:visible — code spills outside its own frame');
      }
    }

    // ── The code is legible ────────────────────────────────────────────────
    const codeCs = getComputedStyle(code);
    if (parseFloat(codeCs.fontSize) < 9) say(`code font-size ${codeCs.fontSize}`);
    if (codeCs.visibility !== 'visible') say(`code visibility "${codeCs.visibility}"`);
    if (!/mono|courier/i.test(codeCs.fontFamily)) {
      say(`code font-family "${codeCs.fontFamily}" is not monospaced`);
    }

    return problems;
  }, { combo, sourceLines });
}

const combos = generateCombos();

test.describe('code-block visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async ({ browserName }) => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.code, `combo ${combo.id} received no code`).toBeTruthy();
      const problems = await visualProblems(combo, mounted.sourceLines);
      // VISUAL-MATRIX-code-block-4 (webkit only — see the pinned test below):
      // WebKit drops the gutter's `user-select: none`, so exactly this one
      // problem string is forgiven there. Every other claim in the combo
      // stays live on every engine.
      const live = browserName === 'webkit'
        ? problems.filter(p => !/^gutter \d+ is selectable/.test(p))
        : problems;
      expect(live, `combo ${combo.id}`).toEqual([]);
    });
  }
});

// ── VISUAL-MATRIX-code-block-4 ───────────────────────────────────────────────
//
// The gutter claim: the line numbers are not part of the code, so a reader
// selecting the code must not drag them into the selection (and from there
// into the clipboard). The stylesheet makes that claim with
//
//     .code-block__line-number { …; user-select: none; }
//
// and Chromium and Firefox honour it — the computed style answers "none".
// WebKit does not: the declaration vanishes while the shadow stylesheet is
// parsed (`.code-block__line-number`'s cssText serializes without it),
// `getComputedStyle(gutter).webkitUserSelect` answers "text", and the
// standard `.userSelect` property is not reflected in WebKit's computed
// style at all. The numbers are therefore genuinely selectable in WebKit.
//
// Minimal repro (webkit): mount any show-line-numbers block and read the
// adopted stylesheet — the rule keeps its geometry declarations but loses
// `user-select: none`, and the gutter computes to `-webkit-user-select:
// text`.
//
// Reported, not fixed — the fix (`-webkit-user-select: none` alongside the
// standard property in snice-code-block.css) is a component-source change,
// out of scope here. Layer 1 above forgives exactly this one problem string
// on WebKit so the rest of every combo stays asserted on that engine.
test.describe('code-block visual matrix: pinned findings', () => {
  test('VISUAL-MATRIX-code-block-4: the gutter is not selectable', async ({ browserName }) => {
    test.fail(browserName === 'webkit',
      'WebKit drops the gutter\'s user-select:none — see VISUAL-MATRIX-code-block-4');
    await page.evaluate(() => (window as any).matrix.mount({
      snippet: 'threeLines', language: 'javascript', showLineNumbers: true,
    }));
    const selectable = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      return [...sr.querySelectorAll('.code-block__line-number')]
        .map(g => {
          const cs = getComputedStyle(g);
          return cs.userSelect ?? cs.webkitUserSelect;
        });
    });
    expect(selectable, 'every gutter cell computed user-select').toEqual(['none', 'none', 'none']);
  });

  test('VISUAL-MATRIX-code-block-4 reproduces: webkit keeps the gutter selectable', async ({ browserName }) => {
    test.skip(browserName !== 'webkit', 'webkit-only finding');
    const observed = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const sheet = [...sr.adoptedStyleSheets].find(s => [...s.cssRules]
        .some(r => r.selectorText === '.code-block__line-number'))!;
      const rule = [...sheet.cssRules]
        .find(r => r.selectorText === '.code-block__line-number')!.cssText;
      const gutter = sr.querySelector('.code-block__line-number')!;
      const cs = getComputedStyle(gutter);
      return {
        ruleKeepsDeclaration: /user-select/.test(rule),
        standardPropertyReflected: cs.userSelect !== undefined,
        computed: cs.webkitUserSelect,
      };
    });
    expect(observed.ruleKeepsDeclaration,
      'the shadow stylesheet kept the user-select declaration').toBe(false);
    expect(observed.standardPropertyReflected,
      'getComputedStyle reflects the standard user-select property').toBe(false);
    expect(observed.computed,
      'the gutter really is selectable in webkit').toBe('text');
  });
});

test.describe('code-block visual matrix: overflow', () => {
  test('a line too long for the block scrolls instead of escaping it', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      snippet: 'wide', language: 'javascript', narrow: true,
    }));
    // BOTH `.code-block__content` and `.code-block__pre` declare
    // `overflow-x: auto`, and which of the two ends up as the scrolling box is
    // a layout detail the docs do not fix. The claim under test is that the
    // long line is REACHABLE, so whichever box scrolls satisfies it.
    const measured = await page.evaluate(() => {
      const host = document.getElementById('subject')!;
      const sr = host.shadowRoot!;
      const container = sr.querySelector('[part~="container"]') as HTMLElement;
      const content = sr.querySelector('[part~="content"]') as HTMLElement;
      const pre = sr.querySelector('[part~="pre"]') as HTMLElement;
      const code = sr.querySelector('[part~="code"]') as HTMLElement;
      const overflowing = (el: HTMLElement) => el.scrollWidth - el.clientWidth;
      return {
        containerRight: container.getBoundingClientRect().right,
        codeRight: code.getBoundingClientRect().right,
        contentOverflow: overflowing(content),
        preOverflow: overflowing(pre),
        contentOverflowX: getComputedStyle(content).overflowX,
        preOverflowX: getComputedStyle(pre).overflowX,
      };
    });
    expect(Math.max(measured.contentOverflow, measured.preOverflow),
      'a 90-character line in a 240px block did not overflow — it was wrapped or clipped')
      .toBeGreaterThan(0);
    expect(
      measured.contentOverflow > 0 ? measured.contentOverflowX : measured.preOverflowX,
      'the box that overflows cannot be scrolled').toMatch(/auto|scroll/);
    expect(measured.codeRight,
      'the code paints past the right edge of its own block')
      .toBeLessThanOrEqual(measured.containerRight + 1);
  });

  test('scrolling the content really moves the code', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      snippet: 'wide', language: 'javascript', narrow: true,
    }));
    const moved = await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const content = sr.querySelector('[part~="content"]') as HTMLElement;
      const pre = sr.querySelector('[part~="pre"]') as HTMLElement;
      const code = sr.querySelector('[part~="code"]') as HTMLElement;
      const scroller = content.scrollWidth > content.clientWidth ? content : pre;
      const before = code.getBoundingClientRect().left;
      scroller.scrollLeft = 60;
      return before - code.getBoundingClientRect().left;
    });
    expect(moved, 'setting scrollLeft did not move the code').toBeGreaterThan(0);
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('code-block visual matrix: marquee pixels', () => {
  test('a highlighted row is visibly tinted next to a plain one', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      snippet: 'threeLines', language: 'javascript', highlightLines: [2],
    }));
    const [marked, plain] = await capture(
      page, '#subject', 'code-block-highlight',
      `(host) => {
        const lines = [...host.shadowRoot.querySelectorAll('.code-block__line')];
        const mid = (el) => {
          const b = el.getBoundingClientRect();
          return { x: b.right - 6, y: b.y + b.height / 2 };
        };
        return [mid(lines[1]), mid(lines[0])];
      }`,
    );
    expect(sameColor(marked, plain),
      `the highlighted row painted ${marked.join(',')}, identical to a plain row`)
      .toBe(false);
    expect(contrast(marked, plain),
      `highlight contrast against a plain row is ${contrast(marked, plain).toFixed(3)}:1`)
      .toBeGreaterThan(1.02);
  });

  test('the highlighted row draws a left rule the plain rows do not', async () => {
    await page.evaluate(() => (window as any).matrix.mount({
      snippet: 'threeLines', language: 'javascript', highlightLines: [2],
    }));
    const [rule, plainEdge] = await capture(
      page, '#subject', 'code-block-highlight-rule',
      `(host) => {
        const lines = [...host.shadowRoot.querySelectorAll('.code-block__line')];
        const edge = (el) => {
          const b = el.getBoundingClientRect();
          return { x: b.left + 1, y: b.y + b.height / 2 };
        };
        return [edge(lines[1]), edge(lines[0])];
      }`,
    );
    expect(sameColor(rule, plainEdge),
      `the highlighted row's left edge painted ${rule.join(',')}, the same as a plain row`)
      .toBe(false);
  });

  const readTheme = async (theme: string) => {
    await page.evaluate(t => (window as any).matrix.mount({
      snippet: 'threeLines', language: 'javascript', theme: t, filename: 'app.ts',
    }), theme);
    return capture(
      page, '#subject', `code-block-theme-${theme}`,
      `(host) => {
        const sr = host.shadowRoot;
        const container = sr.querySelector('[part~="container"]').getBoundingClientRect();
        const header = sr.querySelector('[part~="header"]').getBoundingClientRect();
        return [
          // A point in the code area that is deliberately past the text.
          { x: container.right - 12, y: container.bottom - 12 },
          { x: header.right - 70, y: header.y + header.height / 2 },
        ];
      }`,
    );
  };

  // ── VISUAL-MATRIX-code-block-3 (fixed) ─────────────────────────────────────
  //
  // `theme: '' | 'dark' | 'light'` is documented as "Force theme; empty =
  // auto-detect", and the Theming section says "Force with
  // theme="dark"|"light"". The stylesheet's forced blocks used to define every
  // structural colour as
  //
  //     --_cb-bg: var(--snice-color-surface-container, #282c34);   /* dark  */
  //     --_cb-bg: var(--snice-color-surface-container, #fafafa);   /* light */
  //
  // — the same token in both, with the palette living only in the FALLBACK.
  // On any page that loads the snice theme (which every page does), the token
  // resolved and both forced themes painted identically. Fixed: the forced
  // blocks pin their own palettes, so forcing a theme is deterministic.
  //
  // See the `:host([theme="dark"])` / `:host([theme="light"])` blocks in
  // snice-code-block.css.
  test('VISUAL-MATRIX-code-block-3 (fixed): theme="dark" and theme="light" paint different chrome', async () => {
    const [darkBody] = await readTheme('dark');
    const [lightBody] = await readTheme('light');
    expect(sameColor(darkBody, lightBody),
      `theme="dark" and theme="light" painted the same code background`
      + ` (${darkBody.join(',')})`).toBe(false);
  });

  test('VISUAL-MATRIX-code-block-3 (fixed): each forced theme resolves its own palette', async () => {
    const read = async (theme: string) => {
      await page.evaluate(t => (window as any).matrix.mount({
        snippet: 'threeLines', language: 'javascript', theme: t, filename: 'app.ts',
      }), theme);
      return page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const container = sr.querySelector('[part~="container"]') as HTMLElement;
        const header = sr.querySelector('[part~="header"]') as HTMLElement;
        return {
          body: getComputedStyle(container).backgroundColor,
          header: getComputedStyle(header).backgroundColor,
        };
      });
    };
    expect(await read('dark')).not.toEqual(await read('light'));
  });

  test('the code is readable against its own background in both themes', async () => {
    for (const theme of ['dark', 'light']) {
      await page.evaluate(t => (window as any).matrix.mount({
        snippet: 'threeLines', language: 'javascript', theme: t,
      }), theme);
      // Scan the first line's row: the darkest/lightest excursion from the
      // background is the ink, and that is what has to be readable.
      const scan = await capture(
        page, '#subject', `code-block-ink-${theme}`,
        `(host) => {
          const line = host.shadowRoot.querySelector('[part~="code"]').getBoundingClientRect();
          const points = [];
          for (let x = Math.round(line.left) + 1; x < Math.round(line.left) + 120; x++) {
            points.push({ x, y: line.top + 8 });
          }
          const container = host.shadowRoot.querySelector('[part~="container"]').getBoundingClientRect();
          points.push({ x: container.right - 6, y: container.bottom - 6 });
          return points;
        }`,
      );
      const background = scan[scan.length - 1];
      const best = scan.slice(0, -1)
        .map(px => contrast(px, background))
        .reduce((hi, value) => Math.max(hi, value), 1);
      expect(best,
        `in theme="${theme}" the code's best contrast against its background`
        + ` (${background.join(',')}) is ${best.toFixed(2)}:1`).toBeGreaterThan(4.5);
    }
  });

  test('copyable=false leaves no button pixels where the button would be', async () => {
    // The copy button's own background is transparent — a 1px border is the
    // only thing it paints — so the probe scans the row the button occupies
    // and counts pixels that differ from the header behind it.
    const probe = `(host) => {
      const sr = host.shadowRoot;
      const header = sr.querySelector('[part~="header"]').getBoundingClientRect();
      const y = header.y + header.height / 2;
      const points = [];
      for (let x = Math.round(header.right) - 60; x < Math.round(header.right) - 8; x++) {
        points.push({ x, y });
      }
      points.push({ x: header.left + header.width / 2, y });
      return points;
    }`;
    await page.evaluate(() => (window as any).matrix.mount({
      snippet: 'oneLine', language: 'javascript', filename: 'app.ts', copyable: true,
    }));
    const withButton = await capture(page, '#subject', 'code-block-copyable', probe);
    await page.evaluate(() => (window as any).matrix.mount({
      snippet: 'oneLine', language: 'javascript', filename: 'app.ts', copyable: false,
    }));
    const withoutButton = await capture(page, '#subject', 'code-block-not-copyable', probe);

    const inked = (scan: number[][]) => {
      const headerBg = scan[scan.length - 1];
      return scan.slice(0, -1).filter(px => !sameColor(px, headerBg)).length;
    };
    expect(inked(withButton),
      'a copyable block painted nothing where its copy button sits').toBeGreaterThan(0);
    expect(inked(withoutButton),
      `copyable=false still painted ${inked(withoutButton)} button pixels in the header`)
      .toBe(0);
  });
});
