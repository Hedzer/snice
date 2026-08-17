/**
 * Smoke slice of the snice-tag-input matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (vitest.config.ts);
 * the ~110-combo matrix runs only via `npm run test:matrix`. This file is the
 * standing cost the everyday loop DOES pay, so it lives at `smoke.test.ts`
 * where the config keeps it collected.
 *
 * One combo per feature family of docs/ai/components/tag-input.md: the
 * authored shape, the entry contract with its events, the removal contract,
 * the JSON default/reset/silence split, the capacity rule with `tooLong`, and
 * the suggestions keyboard flow. Structural assertions route through the
 * matrix's own oracle (`expectedShape`/`readShape`).
 *
 * BUDGET: well under 1s. New feature combinations belong in the matrix.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { expectShape, click, unmountAll, settle } from '../matrix-utils';
import { installInternalsMock, restoreInternalsMock, internalsFor, activeFlags } from '../internals-mock';
import {
  mountTagInput, expectedShape, readShape, expectedAddSequence, expectedRemoveSequence,
  recordEvents, typeDraft, pressDraft, suggestionItems, removeButtons, TRICKY_TAGS,
} from './tag-input-support';
import type { SniceTagInputElement } from '../../../packages/components/src/tag-input/snice-tag-input.types';
import '../../../packages/components/src/tag-input/snice-tag-input';

beforeEach(() => { installInternalsMock(); });
afterEach(() => { unmountAll(); restoreInternalsMock(); });

const asControl = (el: HTMLElement) => el as unknown as SniceTagInputElement;

describe('tag-input matrix smoke', () => {
  it('a labelled control with authored tags renders the documented shape', async () => {
    const combo = { value: [...TRICKY_TAGS], label: 'Skills', channel: 'attr' as const };
    const el = await mountTagInput(combo);
    expectShape(readShape(el), expectedShape(combo as never), 'smoke/shape');
    expect(asControl(el).value).toEqual(TRICKY_TAGS);
  });

  it('typing then Enter adds the tag with tag-add then tag-change', async () => {
    const el = await mountTagInput({ value: [], channel: 'attr' });
    const events = recordEvents(el);

    typeDraft(el, 'typed');
    await settle(el, 5);
    pressDraft(el, 'Enter');
    await settle(el, 10);

    expect(asControl(el).value).toEqual(['typed']);
    expect(events.seen).toEqual(expectedAddSequence('typed', ['typed']));
    events.stop();
  });

  it('the remove button reports tag-remove then tag-change', async () => {
    const el = await mountTagInput({ value: ['A', 'B'], channel: 'attr' });
    const events = recordEvents(el);

    click(removeButtons(el)[0]);
    await settle(el, 10);

    expect(asControl(el).value).toEqual(['B']);
    expect(events.seen).toEqual(expectedRemoveSequence('A', 0, ['B']));
    events.stop();
  });

  it('the JSON default backs reset; live assignment stays silent', async () => {
    const el = await mountTagInput({ value: ['A', 'B'], name: 'tags', channel: 'attr' });
    const control = asControl(el);
    expect(internalsFor(el).formValue).toBe(JSON.stringify(['A', 'B']));

    control.addTag('C');
    await settle(el, 5);
    const events = recordEvents(el);

    (el as any).formResetCallback();
    await settle(el, 10);
    expect(control.value).toEqual(['A', 'B']);
    expect(events.seen).toEqual([]);
    events.stop();

    control.value = ['Z'];
    await settle(el, 10);
    expect(control.value).toEqual(['Z']);
    expect(control.defaultValue).toEqual(['A', 'B']);
  });

  it('at capacity the draft input is hidden and the value reports tooLong', async () => {
    const el = await mountTagInput({ value: ['1', '2'], maxTags: 2, name: 'tags', channel: 'attr' });
    const combo = { value: ['1', '2'], maxTags: 2, channel: 'attr' as const };
    expectShape(readShape(el), expectedShape(combo as never), 'smoke/capacity');
    expect(activeFlags(el)).toEqual([]);
    expect(asControl(el).checkValidity()).toBe(true);

    // "More than a positive maxTags reports tooLong" — and programmatic
    // arrays remain visible and invalid.
    (el as any).value = ['1', '2', '3'];
    await settle(el, 10);
    expect(activeFlags(el)).toEqual(['tooLong']);
    expect(asControl(el).value).toEqual(['1', '2', '3']);
  });

  it('suggestions navigate by keyboard and Enter selects the highlight', async () => {
    const el = await mountTagInput({ value: [], channel: 'prop' });
    (el as any).suggestions = ['Alpha', 'Beta'];
    await settle(el, 5);
    const events = recordEvents(el);

    typeDraft(el, 'Alpha');
    await settle(el, 10);
    expect(suggestionItems(el).length).toBeGreaterThan(0);

    pressDraft(el, 'ArrowDown');
    await settle(el, 5);
    pressDraft(el, 'Enter');
    await settle(el, 10);

    expect(asControl(el).value).toEqual(['Alpha']);
    expect(events.seen).toEqual(expectedAddSequence('Alpha', ['Alpha']));
    events.stop();
  });
});
