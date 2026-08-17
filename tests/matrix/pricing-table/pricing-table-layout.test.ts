/**
 * snice-pricing-table matrix — the LAYOUT cross.
 *
 * The three documented properties, crossed against the two documented delivery
 * channels:
 *
 *   · `variant` (2) — 'cards' and 'table' are two layouts of the same data,
 *     and the oracle asks both the same questions;
 *   · `annual` (2) — which price every plan shows;
 *   · plan set (6 shapes) — one plan, the doc's own two, three with a
 *     highlight, plans without annual pricing (so the toggle must be absent),
 *     plans whose features do not line up (the table's union-of-names case),
 *     and the empty list;
 *   · delivery (2) — the `plans` PROPERTY and the documented `<snice-plan>` /
 *     `<snice-feature>` children.
 *
 * 2 x 2 x 6 x 2 = 48 combos.
 */
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-common';
import {
  DOC_PLANS, VARIANTS, checkPricing, checkCtaParts, comboId, mountPricing,
  type PricingCombo, type PricingPlan, type PricingVariant,
} from './pricing-table-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const SINGLE: PricingPlan[] = [
  { name: 'Solo', price: 9, cta: 'Choose', features: [{ name: 'One seat', included: true }] },
];

const THREE: PricingPlan[] = [
  {
    name: 'Free', price: 0, cta: 'Get Started',
    features: [{ name: 'Projects', included: '5' }, { name: 'API access', included: false }],
  },
  {
    name: 'Pro', price: 29, annualPrice: 24, highlighted: true, badge: 'Popular',
    cta: 'Start Trial', ctaVariant: 'primary', description: 'For growing teams',
    features: [{ name: 'Projects', included: 'Unlimited' }, { name: 'API access', included: true }],
  },
  {
    name: 'Enterprise', price: 99, annualPrice: 79, cta: 'Contact us',
    ctaVariant: 'outline', currency: '€', period: '/month',
    features: [{ name: 'Projects', included: 'Unlimited' }, { name: 'SSO', included: true }],
  },
];

const NO_ANNUAL: PricingPlan[] = [
  { name: 'Basic', price: 5, cta: 'Pick', features: [{ name: 'Support', included: true }] },
  { name: 'Plus', price: 15, cta: 'Pick', features: [{ name: 'Support', included: true }] },
];

/** Feature names that do NOT line up — the table's union-of-names case. */
const RAGGED: PricingPlan[] = [
  {
    name: 'A', price: 1, annualPrice: 1, cta: 'A',
    features: [{ name: 'Alpha', included: true }, { name: 'Beta', included: false }],
  },
  {
    name: 'B', price: 2, cta: 'B',
    features: [{ name: 'Beta', included: true }, { name: 'Gamma', included: '2 GB' }],
  },
];

const PLAN_SETS: Array<{ name: string; plans: PricingPlan[] }> = [
  { name: 'empty', plans: [] },
  { name: 'single', plans: SINGLE },
  { name: 'doc-example', plans: DOC_PLANS },
  { name: 'three', plans: THREE },
  { name: 'no-annual', plans: NO_ANNUAL },
  { name: 'ragged', plans: RAGGED },
];

describe('pricing-table matrix: variant x annual x plan set x delivery', () => {
  for (const variant of VARIANTS as readonly PricingVariant[]) {
    for (const annual of [false, true]) {
      for (const set of PLAN_SETS) {
        for (const declarative of [false, true]) {
          // The declarative channel needs children to read; an empty list has
          // none, so that pairing is the property channel's case alone.
          if (declarative && set.plans.length === 0) continue;
          const combo: PricingCombo = {
            plans: set.plans, variant, annual, declarative,
          };
          const id = `${comboId(combo)}/set=${set.name}`;
          it(id, async () => {
            el = await mountPricing(combo);
            expectClean(checkPricing(el, combo), id);
          });
        }
      }
    }
  }
});

/**
 * MATRIX-pricing-table-1 — the table variant's CTA buttons carry no
 * part="cta". The doc lists the part without a variant carve-out
 * (docs/ai/components/pricing-table.md: "`cta` - Call-to-action button"), and
 * the cards template honours it; the table template's buttons do not, so a
 * consumer styling `::part(cta)` loses every call-to-action the moment the
 * layout flips. `checkCtaParts` (see pricing-table-support.ts) is the
 * documented oracle, kept apart from `checkPricing` so this one divergence
 * does not blind the rest of the layout cross above.
 */
describe('pricing-table matrix: the cta CSS part', () => {
  it.fails('MATRIX-pricing-table-1: every CTA button exposes part="cta", in either variant', async () => {
    for (const variant of VARIANTS as readonly PricingVariant[]) {
      const combo: PricingCombo = { plans: DOC_PLANS, variant, annual: false, declarative: false };
      el = await mountPricing(combo);
      expectClean(checkCtaParts(el, combo), `variant=${variant}`);
    }
  });
});
