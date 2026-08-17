/**
 * MATRIX slice — snice-tag-input tag removal.
 *
 * Dimensions: removal path (3: removeTag method, Backspace on empty draft,
 *             remove button click) x position (3: first, middle, last)
 *             = 9 combos.
 *
 * "removeTag(index) — Remove tag at index"; "Backspace on empty input: Remove
 * last tag"; the per-chip remove button is the pointer affordance for the same
 * method. Every path is a tag EDIT, so each emits `tag-remove ->
 * { tag, index, value }` then `tag-change -> { value }`, with `value` already
 * the value AFTER the removal.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { click, unmountAll, settle } from '../matrix-utils';
import {
  mountTagInput, expectedRemoveSequence, recordEvents,
  removeButtons, draftInput,
} from './tag-input-support';
import '../../../packages/components/src/tag-input/snice-tag-input';

const THREE = ['First', 'Middle', 'Last'];

afterEach(() => { unmountAll(); });

describe('tag-input matrix: removal paths x positions', () => {
  // Backspace is documented as "remove LAST tag" only, so it is crossed with
  // its one reachable position; the two addressable paths cross all three.
  const PATHS: Array<{ path: 'method' | 'backspace' | 'button'; position: number }> = [
    ...([0, 1, 2] as const).map(position => ({ path: 'method' as const, position })),
    ...([0, 1, 2] as const).map(position => ({ path: 'button' as const, position })),
    { path: 'backspace' as const, position: 2 },
  ];

  for (const { path, position } of PATHS) {
    const id = `${path}/index-${position}`;

    it(`${id}: the tag leaves, and tag-remove + tag-change report it`, async () => {
      const el = await mountTagInput({ value: [...THREE], channel: 'attr' });
      const events = recordEvents(el);
      const removed = THREE[position];
      const after = THREE.filter((_, i) => i !== position);

      if (path === 'method') {
        (el as any).removeTag(position);
      } else if (path === 'backspace') {
        // "Backspace on empty input: Remove last tag."
        const input = draftInput(el)!;
        input.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Backspace', bubbles: true, composed: true,
        }));
      } else {
        click(removeButtons(el)[position]);
      }
      await settle(el, 10);

      expect((el as any).value).toEqual(after);
      expect(events.seen).toEqual(expectedRemoveSequence(removed, position, after));
      events.stop();
    });
  }
});

describe('tag-input matrix: backspace with a draft does not remove', () => {
  it('a non-empty draft means the keystroke belongs to the text', async () => {
    const el = await mountTagInput({ value: [...THREE], channel: 'attr' });
    const events = recordEvents(el);
    const input = draftInput(el)!;
    input.value = 'draf';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Backspace', bubbles: true, composed: true,
    }));
    await settle(el, 10);

    expect((el as any).value).toEqual(THREE);
    expect(events.seen).toEqual([]);
    events.stop();
  });
});

describe('tag-input matrix: emptying and refilling the control', () => {
  it('removeTag walks the value down one edit at a time', async () => {
    const el = await mountTagInput({ value: [...THREE], channel: 'attr' });
    const events = recordEvents(el);
    const k = el as any;

    k.removeTag(0);
    await settle(el, 5);
    k.removeTag(0);
    await settle(el, 5);
    k.removeTag(0);
    await settle(el, 5);

    expect(k.value).toEqual([]);
    expect(events.seen).toEqual([
      ...expectedRemoveSequence('First', 0, ['Middle', 'Last']),
      ...expectedRemoveSequence('Middle', 0, ['Last']),
      ...expectedRemoveSequence('Last', 0, []),
    ]);
    events.stop();
  });

  it('clear() empties the value silently', async () => {
    // "Assigning `value`, `clear()`, reset, and restoration are silent."
    const el = await mountTagInput({ value: [...THREE], channel: 'attr' });
    const events = recordEvents(el);
    (el as any).clear();
    await settle(el, 10);
    expect((el as any).value).toEqual([]);
    expect(events.seen).toEqual([]);
    events.stop();
  });
});
