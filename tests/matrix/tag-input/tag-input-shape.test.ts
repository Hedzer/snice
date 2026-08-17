/**
 * MATRIX slice — snice-tag-input shape.
 *
 * Dimensions: value state (4: empty, single, many, tricky-preserved)
 *             x label (2) x maxTags (3: unlimited, tight, loose) x channel (2)
 *             = 48 combos.
 *
 * The value states cross the docs' JSON-preservation guarantee ("preserving
 * commas and Unicode within tags") with the capacity rule ("At capacity … the
 * draft input is hidden") and the label part's existence.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, comboId, expectShape, unmountAll } from '../matrix-utils';
import {
  mountTagInput, expectedShape, readShape, TRICKY_TAGS, type TagInputCombo,
} from './tag-input-support';
import '../../../packages/components/src/tag-input/snice-tag-input';

const VALUE_STATES: Array<[string, string[]]> = [
  ['empty', []],
  ['one', ['JavaScript']],
  ['many', ['JavaScript', 'TypeScript', 'CSS']],
  ['tricky', TRICKY_TAGS],
];

const COMBOS: TagInputCombo[] = product({
  value: VALUE_STATES,
  label: ['', 'Skills'],
  maxTags: [0, 3, 8],
  channel: ['attr', 'prop'] as const,
}).map(({ value: state, label, maxTags, channel }) => ({
  value: state[1], label, maxTags, channel,
}));

describe('tag-input matrix: shape', () => {
  afterEach(() => { unmountAll(); });

  for (const combo of COMBOS) {
    const id = comboId({
      value: `${combo.value.length}tags${combo.value === TRICKY_TAGS ? '+tricky' : ''}`,
      label: combo.label || 'nolabel',
      maxTags: combo.maxTags === 0 ? 'unlimited' : `max${combo.maxTags}`,
      channel: combo.channel,
    });

    it(`${id}: parts, chips, and the draft field match the documented shape`, async () => {
      const el = await mountTagInput(combo);
      expectShape(readShape(el), expectedShape(combo), id);
      // The live value is the authored one, whatever channel authored it.
      expect((el as any).value).toEqual(combo.value);
    });
  }
});
