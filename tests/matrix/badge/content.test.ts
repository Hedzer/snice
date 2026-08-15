/**
 * snice-badge matrix — content and visibility slice.
 *
 * SIZING. The badge is a presentational component with one real rule, so this
 * is a SMALL matrix by design (.ai/fuzzing.md: "a divider gets a handful of
 * combos"). The one genuine cross is the content SOURCE against the two
 * properties that change how a source is read — `showZero` and `max` — which is
 * where the documented rule can actually be got wrong: 6 x 2 x 2 = 24.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, unmountAll, product, comboId, expectShape } from '../matrix-utils';
import {
  SOURCES, CONTENT_TEXT, sourceProps, expectedShape, readShape, ariaLabel,
  type BadgeCombo,
} from './badge-support';

afterEach(unmountAll);

/** `max` axis: the documented default and a low cap the count clearly exceeds. */
const MAXES = [99, 5];

describe('badge matrix: source x showZero x max', () => {
  for (const combo of product({ source: SOURCES, showZero: [false, true], max: MAXES })) {
    const label = comboId(combo);
    it(label, async () => {
      const props = sourceProps(combo.source, combo.max);
      const badge = await mount('snice-badge', {
        ...props,
        max: combo.max,
        ...(combo.showZero ? { 'show-zero': true } : {}),
      }, '<button>Messages</button>');

      expectShape(readShape(badge), expectedShape(combo as BadgeCombo), label);
    });
  }
});

describe('badge matrix: the slotted content survives every state', () => {
  for (const source of SOURCES) {
    it(`${source}: the overlaid element stays slotted`, async () => {
      // DOCUMENTED (badge.md): "Slotted content remains available as the element
      // the badge would overlay" — including when the indicator is hidden.
      const badge = await mount('snice-badge', sourceProps(source, 99), '<button>Messages</button>');
      const slot = badge.shadowRoot!.querySelector('slot:not([name])') as HTMLSlotElement;
      expect([...slot.assignedElements()].map(el => el.tagName.toLowerCase())).toEqual(['button']);
    });
  }
});

describe('badge matrix: aria-label falls back to the visible content', () => {
  for (const combo of product({ source: ['content', 'count', 'dot'] as const, labelled: [false, true] })) {
    const label = comboId(combo);
    it(label, async () => {
      // DOCUMENTED (badge.md "Properties"): `label` is the "accessible
      // announcement; falls back to visible content", and "Accessibility" says
      // the indicator always carries a descriptive aria-label.
      const badge = await mount('snice-badge', {
        ...sourceProps(combo.source, 99),
        ...(combo.labelled ? { label: 'Unread messages' } : {}),
      });

      const announced = ariaLabel(badge);
      if (combo.labelled) {
        expect(announced, label).toBe('Unread messages');
      } else if (combo.source === 'dot') {
        // A dot has no visible content to fall back TO, so the only assertable
        // half of the contract is that the announcement is still descriptive.
        expect(announced.length, `${label}: a dot announced nothing`).toBeGreaterThan(0);
      } else {
        expect(announced, label).toBe(combo.source === 'content' ? CONTENT_TEXT : '3');
      }
    });
  }
});
