/**
 * MATRIX slice — snice-tag-input tag entry.
 *
 * Dimensions:
 *   entry path (4: typed Enter, comma split, highlighted suggestion Enter,
 *               addTag method)
 *     x duplicate case (2: fresh, duplicate) x allowDuplicates (2) = 16
 *   blocked entries at capacity (3) — 19 combos.
 *
 * "Enter: Add current input as tag (or select highlighted suggestion)";
 * "Comma: Split input and add each part as a tag"; `addTag(tag)` adds
 * programmatically. "insertion methods still prevent violating additions":
 * a duplicate while `allowDuplicates === false` and any addition at a positive
 * `maxTags` already reached are refused — silently, because the events are
 * documented as tag EDITS and a refused edit is not one.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, expectShape, unmountAll, settle } from '../matrix-utils';
import {
  mountTagInput, expectedShape, readShape, expectedAddSequence,
  recordEvents, typeDraft, pressDraft, typeAndSettle, draftInput, suggestionItems,
} from './tag-input-support';
import '../../../packages/components/src/tag-input/snice-tag-input';

afterEach(() => { unmountAll(); });

const START = ['Existing'];

async function mountEntry(over: Record<string, unknown> = {}): Promise<HTMLElement> {
  return mountTagInput({
    value: [...START], channel: 'attr', ...over,
  } as never);
}

describe('tag-input matrix: entry paths x duplicates x allowDuplicates', () => {
  for (const { entry, dupCase, allowDuplicates } of product({
    entry: ['enter', 'comma', 'suggestion', 'method'] as const,
    dupCase: ['fresh', 'duplicate'] as const,
    allowDuplicates: [false, true] as const,
  })) {
    const id = `${entry}/${dupCase}/allowDuplicates=${allowDuplicates}`;
    const typed = dupCase === 'fresh' ? 'Fresh tag' : START[0];

    it(`${id}: the entry lands, or is refused, exactly as documented`, async () => {
      const el = await mountEntry({ allowDuplicates });
      const events = recordEvents(el);

      if (entry === 'enter') {
        typeDraft(el, typed);
        await settle(el, 5);
        pressDraft(el, 'Enter');
      } else if (entry === 'comma') {
        // "Split input and add each part as a tag": the comma path adds both
        // parts when both are fresh, and just the fresh one when the other is
        // a refused duplicate.
        typeDraft(el, `${typed},Extra`);
      } else if (entry === 'suggestion') {
        (el as any).suggestions = [typed, 'Other option'];
        await settle(el, 5);
        await typeAndSettle(el, typed);
        pressDraft(el, 'ArrowDown');
        await settle(el, 5);
        pressDraft(el, 'Enter');
      } else {
        (el as any).addTag(typed);
      }
      await settle(el, 10);

      const refused = dupCase === 'duplicate' && !allowDuplicates;
      if (entry === 'comma') {
        // "Split input and add each part as a tag", and "insertion methods
        // still prevent violating additions": the fresh part lands, the
        // duplicate part does not.
        if (refused) {
          expect((el as any).value, `${id} refused value`).toEqual([...START, 'Extra']);
          expect(events.seen).toEqual(expectedAddSequence('Extra', [...START, 'Extra']));
        } else {
          expect((el as any).value).toEqual([...START, typed, 'Extra']);
          expect(events.seen).toEqual([
            ...expectedAddSequence(typed, [...START, typed]),
            ...expectedAddSequence('Extra', [...START, typed, 'Extra']),
          ]);
        }
      } else if (refused) {
        expect((el as any).value, `${id} refused value`).toEqual(START);
        expect(events.seen, `${id} refused events`).toEqual([]);
      } else {
        expect((el as any).value).toEqual([...START, typed]);
        expect(events.seen).toEqual(expectedAddSequence(typed, [...START, typed]));
      }
      events.stop();
    });
  }
});

describe('tag-input matrix: addTag trims whitespace and refuses emptiness', () => {
  it('surrounding whitespace is not part of the tag', async () => {
    const el = await mountEntry();
    const events = recordEvents(el);
    (el as any).addTag('  Padded  ');
    await settle(el, 10);
    expect((el as any).value).toEqual([...START, 'Padded']);
    expect(events.seen).toEqual(expectedAddSequence('Padded', [...START, 'Padded']));
    events.stop();
  });

  it('an empty or whitespace-only tag is not a tag', async () => {
    const el = await mountEntry();
    const events = recordEvents(el);
    (el as any).addTag('');
    (el as any).addTag('   ');
    await settle(el, 10);
    expect((el as any).value).toEqual(START);
    expect(events.seen).toEqual([]);
    events.stop();
  });
});

describe('tag-input matrix: entries at capacity are refused', () => {
  it('enter/comma: at capacity the draft input is hidden, so nothing can be typed', async () => {
    // "At capacity … the draft input is hidden" — the entry paths that run
    // through the draft field cannot even begin.
    const el = await mountTagInput({
      value: ['One', 'Two'], maxTags: 2, channel: 'attr',
    });
    const events = recordEvents(el);
    expect(draftInput(el)).toBeNull();
    await settle(el, 10);
    expect((el as any).value).toEqual(['One', 'Two']);
    expect(events.seen).toEqual([]);
    events.stop();
  });

  it('suggestion: nothing can be selected without a draft to filter', async () => {
    const el = await mountTagInput({
      value: ['One', 'Two'], maxTags: 2, channel: 'attr',
    });
    (el as any).suggestions = ['Third'];
    await settle(el, 5);
    expect(suggestionItems(el)).toEqual([]);
    expect((el as any).value).toEqual(['One', 'Two']);
  });

  it('method: addTag at capacity is refused silently', async () => {
    const el = await mountTagInput({
      value: ['One', 'Two'], maxTags: 2, channel: 'attr',
    });
    const events = recordEvents(el);

    (el as any).addTag('Third');
    await settle(el, 10);

    expect((el as any).value).toEqual(['One', 'Two']);
    expect(events.seen).toEqual([]);
    events.stop();
  });

  it('at capacity the documented shape holds: chips visible, draft hidden', async () => {
    const combo = { value: ['One', 'Two'], maxTags: 2, channel: 'attr' as const };
    const el = await mountTagInput(combo);
    expectShape(readShape(el), expectedShape(combo as never), 'at capacity shape');
  });
});
