/**
 * MATRIX slice — snice-tag-input suggestions and keyboard navigation.
 *
 * Dimensions: navigation key (ArrowDown, Escape) x item (2)
 *           + selection mode (keyboard-highlight, keyboard-typed, pointer)
 *             x item (2) — 10 combos, plus the dropdown part contract.
 *
 * "Set the suggestions property to enable autocomplete";
 * "ArrowUp/ArrowDown: Navigate suggestions"; "Enter: Add current input as tag
 * (or select highlighted suggestion)"; "Escape: Close suggestions dropdown";
 * the dropdown's own part is `suggestions`. The docs do not commit to a
 * MATCHING rule beyond autocomplete itself, so every list here is opened by
 * typing a suggestion's own text — a query whose own suggestion must be in the
 * list for "autocomplete" to mean anything — and the assertions cover only the
 * documented navigation, selection, and close over what opens.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, unmountAll, settle } from '../matrix-utils';
import {
  mountTagInput, draftInput, suggestionItems,
  recordEvents, typeDraft, pressDraft, expectedAddSequence,
} from './tag-input-support';
import '../../../packages/components/src/tag-input/snice-tag-input';

afterEach(() => { unmountAll(); });

const SUGGESTIONS = ['Alpha', 'Beta'];

async function mountWithSuggestions(): Promise<HTMLElement> {
  const el = await mountTagInput({ value: [], channel: 'prop' });
  (el as any).suggestions = SUGGESTIONS;
  await settle(el, 5);
  return el;
}

/** Open the list by typing a suggestion's own text. */
async function openFor(el: HTMLElement, item: string): Promise<void> {
  typeDraft(el, item);
  await settle(el, 10);
}

/** A pointer press on a suggestion, the event the item actually handles. */
function pointerPick(item: HTMLElement): void {
  item.dispatchEvent(new MouseEvent('mousedown', {
    bubbles: true, composed: true, cancelable: true,
  }));
}

describe('tag-input matrix: suggestion navigation', () => {
  for (const { key, item } of product({
    key: ['down', 'escape'] as const,
    item: SUGGESTIONS,
  })) {
    it(`${key}/${item}: navigation does what the docs say`, async () => {
      const el = await mountWithSuggestions();
      await openFor(el, item);

      const highlighted = () =>
        suggestionItems(el).findIndex(node =>
          node.classList.contains('tag-suggestion-item--highlighted'));

      if (key === 'down') {
        pressDraft(el, 'ArrowDown');
        await settle(el, 5);
        expect(highlighted(), 'ArrowDown highlights an item').toBe(0);
      } else {
        pressDraft(el, 'Escape');
        await settle(el, 5);
        expect(suggestionItems(el), 'Escape closes the dropdown').toEqual([]);
      }
    });
  }
});

describe('tag-input matrix: selecting a suggestion is a tag edit', () => {
  for (const { mode, item } of product({
    mode: ['keyboard-highlight', 'keyboard-typed', 'pointer'] as const,
    item: SUGGESTIONS,
  })) {
    it(`${mode}/${item}: the suggestion becomes a tag with the documented events`, async () => {
      const el = await mountWithSuggestions();
      const events = recordEvents(el);
      await openFor(el, item);

      if (mode === 'keyboard-highlight') {
        pressDraft(el, 'ArrowDown');
        await settle(el, 5);
        pressDraft(el, 'Enter');
      } else if (mode === 'keyboard-typed') {
        pressDraft(el, 'Enter');
      } else {
        pointerPick(suggestionItems(el)[0]);
      }
      await settle(el, 10);

      expect((el as any).value).toEqual([item]);
      expect(events.seen).toEqual(expectedAddSequence(item, [item]));
      events.stop();
    });
  }
});

describe('tag-input matrix: the suggestions dropdown part', () => {
  it('a closed control renders no suggestions part', async () => {
    const el = await mountWithSuggestions();
    expect(el.shadowRoot!.querySelector('[part="suggestions"]')).toBeNull();
    expect(suggestionItems(el)).toEqual([]);
  });

  it('an open list renders the suggestions part with real items', async () => {
    const el = await mountWithSuggestions();
    await openFor(el, 'Alpha');
    expect(el.shadowRoot!.querySelector('[part="suggestions"]')).not.toBeNull();
    expect(suggestionItems(el).length).toBeGreaterThan(0);
  });

  it('focus returns to the draft input after a tag is added', async () => {
    // "Focus returns to the input after a tag is added or removed."
    const el = await mountWithSuggestions();
    await openFor(el, 'Alpha');
    pointerPick(suggestionItems(el)[0]);
    await settle(el, 10);
    // delegatesFocus retargets focus to the host; either spelling proves the
    // focus landed back inside the control.
    expect(
      document.activeElement === el
      || (draftInput(el) !== null && el.shadowRoot!.contains(document.activeElement)),
    ).toBe(true);
  });
});
