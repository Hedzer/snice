/**
 * <snice-nav> structure matrix: variant x orientation x activeStyle x dataset.
 *
 * 3 x 2 x 2 x 4 = 48 combos. Every one is judged by the single oracle in
 * `nav-utils.ts`, which derives the link sequence — order, href, aria-label,
 * title, icon element, aria-current — from `docs/ai/components/nav.md` and the
 * Placard contract rather than from what the component happens to emit.
 *
 * `orientation` and `activeStyle` produce no DOM difference in the nav tree
 * (they paint through `:host([…])` rules), so what they buy at this tier is the
 * REFLECTION assertion: a property-mounted nav whose attribute never lands
 * renders the wrong highlight while every structural assertion still passes.
 * They also cross the component's structural-rebuild path — `orientation`
 * changing is one of the two triggers for a full teardown in `render()` — which
 * is exactly where a diffing renderer loses nodes.
 */
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  ACTIVE_STYLES, DATASETS, ORIENTATIONS, VARIANTS,
  checkNav, mountNav, navComboId,
  type DatasetName, type NavCombo, type NavElement,
} from './nav-utils';

let nav: NavElement | null = null;
afterEach(() => { if (nav) { removeComponent(nav); nav = null; } });

// The four populated shapes; `empty` gets its own describe below.
const DATASET_NAMES = (Object.keys(DATASETS) as DatasetName[]).filter(name => name !== 'empty');

const COMBOS: NavCombo[] = VARIANTS.flatMap(variant =>
  ORIENTATIONS.flatMap(orientation =>
    ACTIVE_STYLES.flatMap(activeStyle =>
      DATASET_NAMES.map(dataset => ({ variant, orientation, activeStyle, dataset })),
    ),
  ),
);

describe('nav matrix: structure vectors', () => {
  for (const combo of COMBOS) {
    it(`renders ${navComboId(combo)}`, async () => {
      nav = await mountNav(combo);
      expectClean(checkNav(nav, combo), navComboId(combo));
    });
  }
});

describe('nav matrix: empty and slotted', () => {
  // A nav with nothing to show renders no <nav> at all — there is no
  // navigation landmark to announce.
  for (const variant of VARIANTS) {
    it(`${variant} with no placards renders no navigation landmark`, async () => {
      const combo: NavCombo = {
        variant, orientation: 'horizontal', activeStyle: 'fill', dataset: 'empty',
      };
      nav = await mountNav(combo);
      expectClean(checkNav(nav, combo), `${variant}/empty`);
    });
  }

  // "Slots — (default): Additional content after navigation."
  for (const variant of VARIANTS) {
    it(`${variant} keeps slotted content after the navigation`, async () => {
      const combo: NavCombo = {
        variant, orientation: 'vertical', activeStyle: 'text', dataset: 'flat',
      };
      nav = await mountNav(combo, { html: '<button id="extra">Sign out</button>' });
      expectClean(checkNav(nav, combo), `${variant}/slotted`);
    });
  }
});
