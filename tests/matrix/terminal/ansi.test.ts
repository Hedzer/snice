/**
 * snice-terminal matrix — ANSI colours and content safety.
 *
 * The component is documented as a "Shell terminal emulator with command
 * execution, history, and ANSI colors", and it publishes one CSS custom
 * property per ANSI colour:
 *
 *   --snice-terminal-ansi-black / -red / -green / -yellow / -blue / -magenta /
 *   -cyan / -white, and the eight `-bright-*` siblings.
 *
 * A documented CSS custom property is a THEMING HOOK: setting it is how a page
 * restyles that part of the component. So the cross below asserts, for every
 * one of the sixteen documented colours, that colouring text with its ANSI code
 * produces output the corresponding custom property can reach.
 */
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  Problems, ansiSpans, lineTexts, mountTerminal, text,
} from './terminal-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const settle = () => new Promise(resolve => setTimeout(resolve, 30));

/** The sixteen documented colours, with the SGR code each is selected by. */
const ANSI_COLOURS: Array<{ name: string; code: number }> = [
  { name: 'black', code: 30 },
  { name: 'red', code: 31 },
  { name: 'green', code: 32 },
  { name: 'yellow', code: 33 },
  { name: 'blue', code: 34 },
  { name: 'magenta', code: 35 },
  { name: 'cyan', code: 36 },
  { name: 'white', code: 37 },
  { name: 'bright-black', code: 90 },
  { name: 'bright-red', code: 91 },
  { name: 'bright-green', code: 92 },
  { name: 'bright-yellow', code: 93 },
  { name: 'bright-blue', code: 94 },
  { name: 'bright-magenta', code: 95 },
  { name: 'bright-cyan', code: 96 },
  { name: 'bright-white', code: 97 },
];

const esc = (code: number) => `\x1b[${code}m`;
const RESET = '\x1b[0m';

describe('terminal matrix: ANSI escapes are consumed, never shown', () => {
  for (const colour of ANSI_COLOURS) {
    it(`${colour.name} (SGR ${colour.code})`, async () => {
      el = await mountTerminal();
      const problems = new Problems();

      (el as any).writeln(`${esc(colour.code)}coloured${RESET} plain`);
      await settle();

      // Whatever the colour mechanism is, the escape sequence itself is
      // machinery and must not survive into the transcript a reader sees.
      problems.equal(lineTexts(el), ['coloured plain'], 'rendered text');
      problems.check(!lineTexts(el)[0]?.includes('\x1b'),
        'a raw escape sequence reached the transcript');

      // …and the coloured run is its own element, or nothing could colour it.
      const spans = ansiSpans(el);
      if (problems.equal(spans.length, 1, 'elements wrapping the coloured run')) {
        problems.equal(text(spans[0]), 'coloured', 'the wrapped run');
      }

      expectClean(problems, colour.name);
    });
  }

  it('text with no escapes produces no wrapper at all', async () => {
    el = await mountTerminal();
    const problems = new Problems();
    (el as any).writeln('nothing special here');
    await settle();
    problems.equal(ansiSpans(el).length, 0, 'wrappers around uncoloured text');
    problems.equal(lineTexts(el), ['nothing special here'], 'rendered text');
    expectClean(problems, 'no-ansi');
  });

  it('an unrecognised SGR code is swallowed rather than printed', async () => {
    el = await mountTerminal();
    const problems = new Problems();
    // 1 = bold, which this terminal does not document a colour for.
    (el as any).writeln(`\x1b[1mbold${RESET}`);
    await settle();
    problems.equal(lineTexts(el), ['bold'], 'rendered text for an unrecognised code');
    expectClean(problems, 'unknown-sgr');
  });
});

/**
 * MATRIX-terminal-2
 *
 * Combo:    any of the sixteen documented ANSI colours — e.g.
 *           `terminal.writeln('\x1b[31mfailed\x1b[0m')` on a page that sets
 *           `--snice-terminal-ansi-red: hotpink`.
 * Expected: the coloured run picks its colour up from the documented custom
 *           property. The doc lists `--snice-terminal-ansi-red` (and fifteen
 *           siblings) under "CSS Custom Properties", which is the component's
 *           statement that this is how the colour is themed; the component's own
 *           stylesheet agrees, defining `.ansi-red { color:
 *           var(--snice-terminal-ansi-red, #cd3131) }` and a class for each of
 *           the other fifteen.
 * Actual:   `parseAnsiColors()` never emits those classes. It writes a hardcoded
 *           literal inline instead — `<span style="color: #ff5555">` for red —
 *           so all sixteen documented custom properties are dead: setting them
 *           changes nothing, the sixteen `.ansi-*` rules in the component's own
 *           stylesheet match nothing, and because the colour arrives as an
 *           INLINE style it also outranks any `::part(line-content)` a page
 *           writes. The hardcoded value is not even the stylesheet's own
 *           default for the same colour (#ff5555 against #cd3131), so the two
 *           halves of the component disagree about what "ANSI red" is.
 */
describe('terminal matrix: the documented ANSI custom properties', () => {
  for (const colour of ANSI_COLOURS) {
    it.fails(`MATRIX-terminal-2: --snice-terminal-ansi-${colour.name} reaches the output`, async () => {
      el = await mountTerminal();
      const problems = new Problems();

      (el as any).writeln(`${esc(colour.code)}coloured${RESET}`);
      await settle();

      const span = ansiSpans(el)[0];
      if (problems.check(!!span, 'the coloured run was not wrapped at all')) {
        // The component's own stylesheet themes the run through a class; a run
        // that carries a hardcoded inline colour instead can never be themed.
        problems.check(span!.classList.contains(`ansi-${colour.name}`),
          `the coloured run carries no "ansi-${colour.name}" class`
          + ` (class="${span!.className}", style="${span!.getAttribute('style') ?? ''}")`);
        problems.equal(span!.style.color, '',
          'the coloured run carries a hardcoded inline colour,'
          + ' which no custom property or ::part() rule can override');
      }

      expectClean(problems, `ansi-${colour.name}`);
    });
  }
});

describe('terminal matrix: written content cannot inject markup', () => {
  // The terminal renders line content as HTML (that is how the ANSI wrapper
  // gets in), so everything else in a written line has to be escaped — a
  // terminal is precisely where untrusted process output ends up.
  const payloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    'a < b && c > d',
    '"quoted" and \'quoted\'',
    '</span><b>escaped?</b>',
  ];

  for (const writer of ['write', 'writeln', 'writeError'] as const) {
    for (const payload of payloads) {
      it(`${writer}: ${payload.slice(0, 24)}`, async () => {
        el = await mountTerminal();
        const problems = new Problems();

        (el as any)[writer](payload);
        await settle();

        problems.equal(lineTexts(el), [payload], 'the payload is shown verbatim');
        problems.equal(el.shadowRoot!.querySelectorAll('script, img, b').length, 0,
          'written content created real elements');

        expectClean(problems, `${writer}/${payload.slice(0, 16)}`);
      });
    }
  }

  it('writeLines escapes its entries the same way', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    (el as any).writeLines([{ content: '<img src=x onerror=alert(1)>', type: 'error' }]);
    await settle();

    problems.equal(lineTexts(el), ['<img src=x onerror=alert(1)>'], 'the payload is shown verbatim');
    problems.equal(el.shadowRoot!.querySelectorAll('img').length, 0,
      'writeLines created a real element');

    expectClean(problems, 'writeLines/escaping');
  });

  it('appendChunk escapes its chunks the same way', async () => {
    el = await mountTerminal();
    const problems = new Problems();

    (el as any).appendChunk('<b>bold?</b>\n');
    await settle();

    problems.equal(lineTexts(el), ['<b>bold?</b>'], 'the chunk is shown verbatim');
    problems.equal(el.shadowRoot!.querySelectorAll('b').length, 0,
      'appendChunk created a real element');

    expectClean(problems, 'appendChunk/escaping');
  });
});
