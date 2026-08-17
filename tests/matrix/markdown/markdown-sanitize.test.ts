/**
 * snice-markdown matrix — the SANITIZATION cross.
 *
 * The component's one-line description is "Lightweight GFM-compatible markdown
 * renderer with BUILT-IN SANITIZATION", and `sanitize: boolean = true` is the
 * switch. So the contract has two halves, and both are asserted here:
 *
 *   · with `sanitize` on (the default), a hostile payload does not survive
 *     into the rendered tree — and the legitimate markdown around it does;
 *   · sanitizing is a RENDER-time transform, not a content one: `content`
 *     still reports what the caller set, and `markdown-render` still fires.
 *
 * 8 payloads x 2 sanitize settings x 2 delivery channels = 32 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, removeComponent, wait } from '../matrix-common';
import {
  SANITIZE_CASES, body, checkFrame, mountMarkdown, recordEvents, renderedHtml,
  type MarkdownCombo,
} from './markdown-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('markdown matrix: sanitize x payload x delivery channel', () => {
  for (const payload of SANITIZE_CASES) {
    for (const sanitize of [true, false]) {
      for (const viaSlot of [false, true]) {
        const id = `${payload.name}/${sanitize ? 'sanitized' : 'raw'}`
          + `/${viaSlot ? 'slot' : 'setContent'}`;
        it(id, async () => {
          const combo: MarkdownCombo = { source: payload.source, sanitize, viaSlot };
          el = await mountMarkdown(combo);
          const problems = checkFrame(el, combo);
          const base = body(el);
          problems.check(!!base, 'no rendered body');

          if (base && sanitize) {
            for (const selector of payload.forbidden) {
              problems.equal(
                base.querySelectorAll(selector).length, 0,
                `sanitized output still contains "${selector}"`,
              );
            }
          }
          // Sanitizing is not deleting: whatever the payload sat next to must
          // still be there, with or without the switch.
          if (base) {
            for (const selector of payload.survives) {
              problems.check(
                base.querySelectorAll(selector).length > 0,
                `sanitizing removed the legitimate "${selector}" beside the payload`,
              );
            }
          }
          expectClean(problems, id);
        });
      }
    }
  }
});

describe('markdown matrix: sanitization is a render-time transform', () => {
  it('the content property still reports the caller\'s source', async () => {
    const source = 'Before\n\n<script>window.pwned = 1;</script>\n\n**after**';
    const combo: MarkdownCombo = { source };
    el = await mountMarkdown(combo);
    expectClean(checkFrame(el, combo), 'content-preserved');
    expect((el as any).content).toBe(source);
  });

  it('markdown-render carries the SANITIZED html, which is what was rendered', async () => {
    el = await mountMarkdown({ source: 'seed' });
    const events = recordEvents(el);

    (el as any).setContent('<script>window.pwned = 1;</script>\n\n**kept**');
    await wait(30);

    const rendered = events.of('markdown-render');
    expect(rendered.length, 'setContent emitted no markdown-render').toBeGreaterThan(0);
    const html = rendered[rendered.length - 1].html as string;
    expect(html, 'markdown-render announced html the component never rendered')
      .not.toContain('<script');
    expect(html).toContain('<strong>kept</strong>');
    expect(renderedHtml(el)).toBe(html.trim());
  });

  it('turning sanitize off re-renders the same content unsanitized', async () => {
    const source = '<img src="x.png" onerror="window.pwned = 1">';
    el = await mountMarkdown({ source, sanitize: true });
    expect(body(el)!.querySelectorAll('img[onerror]')).toHaveLength(0);

    (el as any).sanitize = false;
    await wait(30);
    expect(
      body(el)!.querySelectorAll('img[onerror]').length,
      'sanitize=false did not re-render — the switch is documented as a property',
    ).toBe(1);
  });

  it('turning sanitize back on re-sanitizes', async () => {
    const source = '<iframe src="https://evil.example"></iframe>\n\n**kept**';
    el = await mountMarkdown({ source, sanitize: false });
    expect(body(el)!.querySelectorAll('iframe').length).toBe(1);

    (el as any).sanitize = true;
    await wait(30);
    expect(body(el)!.querySelectorAll('iframe')).toHaveLength(0);
    expect(body(el)!.querySelectorAll('strong')).toHaveLength(1);
  });
});
