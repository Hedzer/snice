/**
 * snice-code-block matrix — the PIPELINE cross: format, highlight, grammar
 * delivery, copy, and the seven documented events.
 *
 * The docs describe a pipeline with a fixed order and a fixed precedence:
 *
 *   · `setFormatter(fn)` OVERRIDES grammar formatters; a formatter runs only
 *     when `format` is a truthy string;
 *   · formatting emits `code-before-format` then `code-after-format`;
 *   · highlighting emits `code-before-highlight` then `code-after-highlight`,
 *     and `setHighlighter(fn)` replaces the built-in grammar path;
 *   · a grammar URL is resolved through one of three documented `fetchMode`s —
 *     `native` (fetch), `virtual` (@request/@respond) and `event`
 *     (`grammar-request`, answered with `setGrammar()`), and every successful
 *     resolution emits `grammar-loaded`;
 *   · `copy()` writes the code to the clipboard and emits `code-copy`.
 *
 * The cross here is over the DELIVERY of a grammar (3 fetch modes x grammar
 * present/absent x 2 languages = 12) and over the PIPELINE shape (highlighter
 * present/absent x formatter source x format set/unset), because those are the
 * dimensions whose interaction the docs actually constrain.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { removeComponent, textOf, wait } from '../matrix-common';
import { exactPart } from '../part-exact';
import {
  FETCH_MODES, LOAD_GRAMMAR_CHANNEL, SNIPPETS, TEST_GRAMMAR,
  mountCodeBlock, recordEvents, renderedLines, respondToGrammar,
  type FetchMode,
} from './code-block-support';

let el: HTMLElement | null = null;
let stop: (() => void) | null = null;
afterEach(() => {
  stop?.(); stop = null;
  if (el) { removeComponent(el); el = null; }
  vi.restoreAllMocks();
});

// ── The event pipeline ──────────────────────────────────────────────────────

describe('code-block matrix: the highlight pipeline and its events', () => {
  it('a plain highlight emits before then after, carrying { code, language, codeBlock }', async () => {
    el = await mountCodeBlock({ snippet: 'threeLines', language: 'javascript' });
    const events = recordEvents(el);

    await (el as any).highlight();
    await wait(30);

    expect(events.seen.map(e => e.type))
      .toEqual(['code-before-highlight', 'code-after-highlight']);
    for (const detail of events.of('code-before-highlight')) {
      expect(detail.code).toBe(SNIPPETS.threeLines);
      expect(detail.language).toBe('javascript');
      expect(detail.codeBlock).toBe(el);
    }
  });

  it('setHighlighter replaces the built-in path and its output reaches the reader', async () => {
    el = await mountCodeBlock({ snippet: 'threeLines', language: 'javascript' });
    const seen: Array<[string, string]> = [];
    (el as any).setHighlighter((code: string, language: string) => {
      seen.push([code, language]);
      return `<span class="tok">${code}</span>`;
    });
    const events = recordEvents(el);

    await (el as any).highlight();
    await wait(30);

    // Documented as `(code, language) => string`; the language it is handed is
    // the block's own.
    expect(seen.every(([, language]) => language === 'javascript')).toBe(true);
    expect(events.seen.map(e => e.type))
      .toEqual(['code-before-highlight', 'code-after-highlight']);
    // The reader still sees the same code — a highlighter marks it up, it does
    // not change it.
    expect(renderedLines(el)).toEqual(SNIPPETS.threeLines.split('\n'));
    expect(exactPart(el, 'code')!.querySelectorAll('.tok').length).toBeGreaterThan(0);
  });

  it('a highlighter that throws leaves the previous render standing', async () => {
    el = await mountCodeBlock({ snippet: 'threeLines', language: 'javascript' });
    const before = renderedLines(el);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    (el as any).setHighlighter(() => { throw new Error('boom'); });

    await (el as any).highlight();
    await wait(30);

    expect(renderedLines(el), 'a failed highlighter blanked the code').toEqual(before);
  });
});

// ── Formatting ──────────────────────────────────────────────────────────────

describe('code-block matrix: formatting', () => {
  it('setFormatter runs only when format is a truthy string', async () => {
    el = await mountCodeBlock({ snippet: 'oneLine', language: 'javascript' });
    const calls: string[] = [];
    (el as any).setFormatter((code: string) => { calls.push(code); return code.toUpperCase(); });
    const events = recordEvents(el);

    // `format` still '' — the documented gate is closed.
    await (el as any).highlight();
    await wait(30);
    expect(calls, 'the formatter ran with format=""').toEqual([]);
    expect(events.of('code-before-format')).toEqual([]);

    (el as any).format = 'pretty';
    await wait(40);
    expect(calls, 'the formatter did not run once format was set').toHaveLength(1);
    expect(events.seen.map(e => e.type)).toContain('code-before-format');
    expect(events.seen.map(e => e.type)).toContain('code-after-format');
  });

  it('format emits before-format, after-format, then the highlight pair, in that order', async () => {
    el = await mountCodeBlock({ snippet: 'oneLine', language: 'javascript' });
    (el as any).setFormatter((code: string) => code.toUpperCase());
    const events = recordEvents(el);

    (el as any).format = 'pretty';
    await wait(40);

    const order = events.seen.map(e => e.type).filter(type => type.startsWith('code-'));
    expect(order).toEqual([
      'code-before-format', 'code-after-format',
      'code-before-highlight', 'code-after-highlight',
    ]);
  });

  it('the formatted code becomes the code the reader sees and the block reports', async () => {
    el = await mountCodeBlock({ snippet: 'oneLine', language: 'javascript' });
    (el as any).setFormatter((code: string) => code.replace('const', 'let'));

    (el as any).format = 'pretty';
    await wait(40);

    expect((el as any).code).toBe('let x = 1;');
    expect(renderedLines(el)).toEqual(['let x = 1;']);
  });

  it('setFormatter overrides the grammar formatter of the same name', async () => {
    el = await mountCodeBlock({ snippet: 'json', language: 'json' });
    (el as any).setGrammar(TEST_GRAMMAR);
    await wait(30);
    (el as any).setFormatter(() => 'IMPERATIVE');

    (el as any).format = 'pretty';
    await wait(40);

    expect((el as any).code, 'the grammar formatter won over setFormatter()')
      .toBe('IMPERATIVE');
  });

  it('a formatter that throws leaves the code unchanged', async () => {
    el = await mountCodeBlock({ snippet: 'oneLine', language: 'javascript' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    (el as any).setFormatter(() => { throw new Error('boom'); });

    (el as any).format = 'pretty';
    await wait(40);

    expect((el as any).code).toBe(SNIPPETS.oneLine);
  });
});

// ── Grammar delivery: the three documented fetch modes ──────────────────────

interface GrammarCombo {
  id: string;
  fetchMode: FetchMode;
  grammar: string;
  language: 'javascript' | 'json';
}

const GRAMMAR_COMBOS: GrammarCombo[] = (() => {
  const out: GrammarCombo[] = [];
  for (const fetchMode of FETCH_MODES) {
    for (const hasGrammar of [false, true]) {
      for (const language of ['javascript', 'json'] as const) {
        // A DISTINCT url per combo. `native` mode shares one module-level
        // promise cache across every code block on the page (that is the point
        // of it — two blocks in the same language must not fetch twice), so a
        // shared url would leave the second combo asserting against a cache
        // hit rather than against the documented fetch.
        const grammar = hasGrammar
          ? `grammars/matrix-${fetchMode}-${language}.json`
          : '';
        out.push({
          id: `fetch-mode=${fetchMode}/grammar=${hasGrammar ? 'url' : 'none'}/language=${language}`,
          fetchMode, grammar, language,
        });
      }
    }
  }
  return out;
})();

describe('code-block matrix: grammar delivery x fetch mode', () => {
  for (const combo of GRAMMAR_COMBOS) {
    it(combo.id, async () => {
      el = await mountCodeBlock({ snippet: 'threeLines', language: combo.language });
      const events = recordEvents(el);

      // Each mode gets the answering machine its documentation describes.
      const fetchMock = vi.fn(async () => ({ ok: true, json: async () => TEST_GRAMMAR }));
      vi.stubGlobal('fetch', fetchMock);
      const virtual = respondToGrammar(document, () => TEST_GRAMMAR);
      stop = virtual.stop;

      (el as any).fetchMode = combo.fetchMode;
      (el as any).grammar = combo.grammar;
      await wait(60);

      if (!combo.grammar) {
        // No URL: nothing is fetched, requested or asked for.
        expect(fetchMock, 'a grammar-less block still fetched').not.toHaveBeenCalled();
        expect(virtual.payloads, 'a grammar-less block still sent a request').toEqual([]);
        expect(events.of('grammar-request'), 'a grammar-less block still asked')
          .toEqual([]);
        return;
      }

      if (combo.fetchMode === 'native') {
        expect(fetchMock, 'fetch-mode="native" did not fetch the URL').toHaveBeenCalled();
        expect(events.of('grammar-loaded')[0]?.url).toBe(combo.grammar);
      }
      if (combo.fetchMode === 'virtual') {
        expect(virtual.payloads, 'fetch-mode="virtual" sent no request')
          .toEqual([{ url: combo.grammar }]);
        expect(events.of('grammar-loaded')[0]?.url).toBe(combo.grammar);
      }
      if (combo.fetchMode === 'event') {
        const asked = events.of('grammar-request');
        expect(asked, 'fetch-mode="event" dispatched no grammar-request').toHaveLength(1);
        expect(asked[0]).toMatchObject({ url: combo.grammar, language: combo.language });
        expect(asked[0].codeBlock).toBe(el);
        // The documented completion: the listener calls setGrammar().
        (el as any).setGrammar(TEST_GRAMMAR);
        await wait(40);
        expect(events.of('grammar-loaded')[0]?.grammar).toBe(TEST_GRAMMAR);
      }

      // Whatever the mode, `grammar-loaded` announces the language it was
      // loaded for and the block that loaded it.
      for (const detail of events.of('grammar-loaded')) {
        expect(detail.language).toBe(combo.language);
        expect(detail.codeBlock).toBe(el);
      }
    });
  }

  it('setGrammar announces a grammar with an empty url and re-highlights', async () => {
    el = await mountCodeBlock({ snippet: 'threeLines', language: 'javascript' });
    const events = recordEvents(el);

    (el as any).setGrammar(TEST_GRAMMAR);
    await wait(40);

    expect(events.of('grammar-loaded')).toHaveLength(1);
    expect(events.of('grammar-loaded')[0]).toMatchObject({ grammar: TEST_GRAMMAR, url: '' });
    expect(events.seen.map(e => e.type)).toContain('code-after-highlight');
    expect(renderedLines(el)).toEqual(SNIPPETS.threeLines.split('\n'));
  });

  it('a failing native fetch leaves the code readable', async () => {
    el = await mountCodeBlock({ snippet: 'threeLines', language: 'javascript' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));

    (el as any).grammar = 'grammars/typescript.json';
    await wait(60);

    expect(renderedLines(el)).toEqual(SNIPPETS.threeLines.split('\n'));
  });

  it('the load-grammar request channel is the documented one', () => {
    expect(LOAD_GRAMMAR_CHANNEL).toBe('snice/code-block/load-grammar');
  });
});

// ── copy() ──────────────────────────────────────────────────────────────────

describe('code-block matrix: copy', () => {
  it('copy() writes the code and emits code-copy with { code, codeBlock }', async () => {
    el = await mountCodeBlock({ snippet: 'threeLines', language: 'javascript' });
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
    const events = recordEvents(el);

    await (el as any).copy();
    await wait(20);

    expect(writeText).toHaveBeenCalledWith(SNIPPETS.threeLines);
    expect(events.of('code-copy')).toHaveLength(1);
    expect(events.of('code-copy')[0]).toMatchObject({ code: SNIPPETS.threeLines });
    expect(events.of('code-copy')[0].codeBlock).toBe(el);
  });

  it('the copy button acknowledges, then returns to its label', async () => {
    el = await mountCodeBlock({ snippet: 'oneLine' });
    vi.stubGlobal('navigator', {
      ...globalThis.navigator, clipboard: { writeText: vi.fn(async () => {}) },
    });

    await (el as any).copy();
    await wait(20);
    expect(textOf(exactPart(el, 'copy-button'))).toBe('Copied!');
  });

  it('clicking the copy button is the same path as calling copy()', async () => {
    el = await mountCodeBlock({ snippet: 'oneLine' });
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
    const events = recordEvents(el);

    exactPart<HTMLButtonElement>(el, 'copy-button')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(30);

    expect(writeText).toHaveBeenCalledWith(SNIPPETS.oneLine);
    expect(events.of('code-copy')).toHaveLength(1);
  });

  it('a clipboard that rejects emits no code-copy', async () => {
    el = await mountCodeBlock({ snippet: 'oneLine' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('navigator', {
      ...globalThis.navigator,
      clipboard: { writeText: vi.fn(async () => { throw new Error('denied'); }) },
    });
    const events = recordEvents(el);

    await (el as any).copy();
    await wait(20);

    expect(events.of('code-copy'), 'a failed clipboard write still announced a copy')
      .toEqual([]);
  });
});
