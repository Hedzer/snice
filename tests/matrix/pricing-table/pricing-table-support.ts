/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the <snice-pricing-table> feature matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation is read off `docs/ai/components/pricing-table.md` and
 * `snice-pricing-table.types.ts`, never off rendered output:
 *
 *   plans: PricingPlan[] = []      attr: none (JS only)
 *   variant: 'cards'|'table' = 'cards'
 *   annual: boolean = false        Show annual pricing
 *
 *   PricingPlan { name, price, annualPrice?, period?, currency?, description?,
 *                 features: PricingFeature[], cta, ctaVariant?, highlighted?,
 *                 badge? }
 *   PricingFeature { name, included: boolean | string }
 *
 *   Declarative children:
 *     <snice-plan  name price annual-price period currency description cta
 *                  cta-variant highlighted badge>
 *     <snice-feature excluded value>
 *
 *   Event: plan-select -> { plan, index, billing: 'monthly'|'annual' }
 *   Parts: base, cards, card, cta, toggle, table-wrapper, table
 *
 *   Accessibility: "Tab through plans and activate CTA buttons with
 *   Enter/Space", "Billing toggle is keyboard accessible with
 *   role='radiogroup'", "Highlighted plans are visually distinguished".
 *
 * ── What the oracle claims ──────────────────────────────────────────────────
 *
 * The two variants are two documented LAYOUTS of the same data, so the oracle
 * asks the same questions of both: every plan is represented once, in order;
 * the price shown is the annual one exactly when `annual` is on AND the plan
 * has an `annualPrice`; each plan offers exactly one CTA carrying its own
 * `cta` text; a highlighted plan is marked; and the billing toggle exists
 * exactly when at least one plan has annual pricing (the only condition the
 * docs give it — "monthly/annual toggle").
 */
import { Problems, mount, shadow, textOf, wait } from '../matrix-common';
import { exactPart, exactParts } from '../part-exact';
import '../../../packages/components/src/pricing-table/snice-pricing-table';

export const VARIANTS = ['cards', 'table'] as const;
export type PricingVariant = typeof VARIANTS[number];

export interface PricingFeature {
  name: string;
  included: boolean | string;
}

export interface PricingPlan {
  name: string;
  price: number;
  annualPrice?: number;
  period?: string;
  currency?: string;
  description?: string;
  features: PricingFeature[];
  cta: string;
  ctaVariant?: 'primary' | 'secondary' | 'outline';
  highlighted?: boolean;
  badge?: string;
}

/** The doc's own example, kept verbatim so both tiers measure one table. */
export const DOC_PLANS: PricingPlan[] = [
  {
    name: 'Free', price: 0, cta: 'Get Started',
    features: [
      { name: '5 projects', included: true },
      { name: 'API access', included: false },
    ],
  },
  {
    name: 'Pro', price: 29, annualPrice: 24, highlighted: true, badge: 'Popular',
    cta: 'Start Trial',
    features: [
      { name: 'Unlimited projects', included: true },
      { name: 'API access', included: true },
    ],
  },
];

export interface PricingCombo {
  plans: PricingPlan[];
  variant?: PricingVariant;
  annual?: boolean;
  /** Deliver the plans as `<snice-plan>` children instead of the property. */
  declarative?: boolean;
}

export function comboId(combo: PricingCombo): string {
  return [
    `variant=${combo.variant ?? 'cards'}`,
    combo.annual ? 'annual' : 'monthly',
    combo.declarative ? 'declarative' : 'property',
    `plans=${combo.plans.length}`,
  ].join('/');
}

export function resolved(combo: PricingCombo) {
  return {
    plans: combo.plans,
    variant: combo.variant ?? 'cards',
    annual: combo.annual ?? false,
  };
}

/** The price a plan shows for the current billing period, per the docs. */
export function priceOf(plan: PricingPlan, annual: boolean): number {
  return annual && plan.annualPrice !== undefined ? plan.annualPrice : plan.price;
}

export function formatPrice(price: number): string {
  return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** The documented toggle condition: at least one plan prices annually. */
export function hasAnnualPricing(plans: PricingPlan[]): boolean {
  return plans.some(plan => plan.annualPrice !== undefined);
}

// ── Declarative markup, exactly as the doc writes it ─────────────────────────

function attr(name: string, value: string | number | undefined): string {
  return value === undefined ? '' : ` ${name}="${value}"`;
}

export function declarativeMarkup(plans: PricingPlan[]): string {
  return plans.map(plan => {
    const features = plan.features.map((feature) => {
      if (feature.included === true) return `<snice-feature>${feature.name}</snice-feature>`;
      if (feature.included === false) return `<snice-feature excluded>${feature.name}</snice-feature>`;
      return `<snice-feature value="${feature.included}">${feature.name}</snice-feature>`;
    }).join('');
    return `<snice-plan${attr('name', plan.name)}${attr('price', plan.price)}`
      + `${attr('annual-price', plan.annualPrice)}${attr('period', plan.period)}`
      + `${attr('currency', plan.currency)}${attr('description', plan.description)}`
      + `${attr('cta', plan.cta)}${attr('cta-variant', plan.ctaVariant)}`
      + `${plan.highlighted ? ' highlighted' : ''}${attr('badge', plan.badge)}`
      + `>${features}</snice-plan>`;
  }).join('');
}

export async function mountPricing(combo: PricingCombo): Promise<HTMLElement> {
  const want = resolved(combo);
  if (combo.declarative) {
    const el = await mount<HTMLElement>(
      'snice-pricing-table',
      { variant: want.variant, annual: want.annual },
      { html: declarativeMarkup(want.plans) },
    );
    await wait(40);
    return el;
  }
  const el = await mount<HTMLElement>('snice-pricing-table', {
    variant: want.variant, annual: want.annual, plans: want.plans,
  });
  await wait(40);
  return el;
}

// ── Accessors ───────────────────────────────────────────────────────────────

export const base = (el: HTMLElement) => exactPart(el, 'base');
export const cardsContainer = (el: HTMLElement) => exactPart(el, 'cards');
export const cards = (el: HTMLElement) => exactParts(el, 'card');
export const toggle = (el: HTMLElement) => exactPart(el, 'toggle');
export const tableWrapper = (el: HTMLElement) => exactPart(el, 'table-wrapper');
export const tableElement = (el: HTMLElement) => exactPart<HTMLTableElement>(el, 'table');
export const ctaButtons = (el: HTMLElement) =>
  [...shadow(el).querySelectorAll('.pricing__cta')] as HTMLButtonElement[];
export const toggleButtons = (el: HTMLElement) =>
  [...shadow(el).querySelectorAll('.pricing__toggle-btn')] as HTMLButtonElement[];

export function classesOf(node: Element | null | undefined): string[] {
  return (node?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

// ── The oracle ──────────────────────────────────────────────────────────────

export function checkPricing(el: HTMLElement, combo: PricingCombo): Problems {
  const problems = new Problems();
  const want = resolved(combo);

  // ── the base is always there ────────────────────────────────────────────
  problems.check(!!base(el), 'no part="base"');

  // ── the billing toggle ──────────────────────────────────────────────────
  const wantsToggle = hasAnnualPricing(want.plans);
  const billing = toggle(el);
  problems.equal(!!billing, wantsToggle, 'the billing toggle is offered');
  if (wantsToggle && billing) {
    problems.equal(billing.getAttribute('role'), 'radiogroup', 'toggle role');
    problems.check(!!billing.getAttribute('aria-label'), 'the toggle has no aria-label');
    const buttons = toggleButtons(el);
    problems.equal(buttons.length, 2, 'toggle option count');
    for (const button of buttons) {
      problems.equal(button.getAttribute('role'), 'radio', 'toggle option role');
    }
    if (buttons.length === 2) {
      problems.equal(textOf(buttons[0]), 'Monthly', 'first toggle option');
      problems.equal(textOf(buttons[1]), 'Annual', 'second toggle option');
      problems.equal(
        buttons[0].getAttribute('aria-checked'), String(!want.annual),
        'monthly aria-checked',
      );
      problems.equal(
        buttons[1].getAttribute('aria-checked'), String(want.annual),
        'annual aria-checked',
      );
    }
  }

  // ── the layout the variant asks for, and only that one ──────────────────
  const isCards = want.variant === 'cards';
  problems.equal(!!cardsContainer(el), isCards, 'part="cards" present');
  problems.equal(!!tableWrapper(el), !isCards, 'part="table-wrapper" present');
  problems.equal(!!tableElement(el), !isCards, 'part="table" present');

  // ── every plan is represented exactly once, in order ────────────────────
  if (isCards) checkCards(el, want, problems);
  else checkTable(el, want, problems);

  return problems;
}

function checkCards(
  el: HTMLElement,
  want: { plans: PricingPlan[]; annual: boolean },
  problems: Problems,
): void {
  const nodes = cards(el);
  problems.equal(nodes.length, want.plans.length, 'rendered card count');
  // `matrix-common`'s `equal`/`check` return void, so the guard is written out
  // rather than folded into the call — a fold would make every assertion below
  // unreachable and the whole slice would pass vacuously.
  if (nodes.length !== want.plans.length) return;

  nodes.forEach((node, index) => {
    const plan = want.plans[index];
    const where = `card[${index}] "${plan.name}"`;

    problems.equal(textOf(node.querySelector('.pricing__plan-name')), plan.name,
      `${where}: plan name`);

    // "Highlighted plans are visually distinguished."
    problems.equal(
      classesOf(node).includes('pricing__card--highlighted'), !!plan.highlighted,
      `${where}: highlighted`,
    );

    const badge = node.querySelector('.pricing__badge');
    problems.equal(!!badge, !!plan.badge, `${where}: badge present`);
    if (plan.badge) problems.equal(textOf(badge), plan.badge, `${where}: badge text`);

    const description = node.querySelector('.pricing__plan-description');
    problems.equal(!!description, !!plan.description, `${where}: description present`);
    if (plan.description) {
      problems.equal(textOf(description), plan.description, `${where}: description text`);
    }

    // The price for the CURRENT billing period, with its documented defaults.
    problems.equal(
      textOf(node.querySelector('.pricing__amount')),
      formatPrice(priceOf(plan, want.annual)),
      `${where}: amount (annual=${want.annual})`,
    );
    problems.equal(
      textOf(node.querySelector('.pricing__currency')), plan.currency ?? '$',
      `${where}: currency`,
    );
    problems.equal(
      textOf(node.querySelector('.pricing__period')), plan.period ?? '/mo',
      `${where}: period`,
    );

    // Features: one row each, with the documented three shapes.
    const rows = [...node.querySelectorAll('.pricing__feature')];
    problems.equal(rows.length, plan.features.length, `${where}: feature count`);
    plan.features.forEach((feature, f) => {
      const row = rows[f];
      if (!row) return;
      problems.check(
        textOf(row).includes(feature.name),
        `${where}: feature ${f} does not show "${feature.name}" (shows "${textOf(row)}")`,
      );
      // `included: false` is the ONLY excluded shape; a string value is a
      // custom display, not an exclusion.
      problems.equal(
        classesOf(row).includes('pricing__feature--excluded'), feature.included === false,
        `${where}: feature ${f} excluded`,
      );
      if (typeof feature.included === 'string') {
        problems.check(
          textOf(row).includes(feature.included),
          `${where}: feature ${f} does not show its value "${feature.included}"`,
        );
      }
    });

    // Exactly one CTA, carrying the plan's own text.
    const cta = node.querySelector('.pricing__cta') as HTMLButtonElement | null;
    problems.check(!!cta, `${where}: no CTA button`);
    if (cta) {
      problems.equal(cta.tagName.toLowerCase(), 'button', `${where}: CTA element`);
      problems.equal(textOf(cta), plan.cta, `${where}: CTA text`);
      const variant = plan.ctaVariant ?? (plan.highlighted ? 'primary' : 'secondary');
      problems.check(
        classesOf(cta).includes(`pricing__cta--${variant}`),
        `${where}: ctaVariant "${variant}" did not reach the button`
        + ` (classes: ${classesOf(cta).join(' ')})`,
      );
      // The `part="cta"` claim is asserted separately by `checkCtaParts`.
    }
  });
}

function checkTable(
  el: HTMLElement,
  want: { plans: PricingPlan[]; annual: boolean },
  problems: Problems,
): void {
  const table = tableElement(el);
  if (!table) {
    problems.say('no part="table" — the table variant rendered no table');
    return;
  }

  // One header column per plan, plus the leading "Feature" column.
  const headers = [...table.querySelectorAll('thead th')];
  problems.equal(headers.length, want.plans.length + 1, 'header cell count');
  want.plans.forEach((plan, index) => {
    problems.equal(textOf(headers[index + 1]), plan.name, `header ${index}: plan name`);
    problems.equal(
      classesOf(headers[index + 1]).includes('pricing__table-highlight'), !!plan.highlighted,
      `header ${index}: highlighted`,
    );
  });

  // The price row, for the current billing period.
  const priceRow = [...table.querySelectorAll('tbody tr')][0];
  problems.check(!!priceRow, 'no price row');
  if (priceRow) {
    const cells = [...priceRow.querySelectorAll('td')];
    problems.equal(cells.length, want.plans.length + 1, 'price row cell count');
    want.plans.forEach((plan, index) => {
      const cell = cells[index + 1];
      if (!cell) return;
      const currency = plan.currency ?? '$';
      const period = plan.period ?? '/mo';
      problems.equal(
        textOf(cell), `${currency}${formatPrice(priceOf(plan, want.annual))}${period}`,
        `price cell ${index} (annual=${want.annual})`,
      );
    });
  }

  // One row per DISTINCT feature name across all plans, in first-seen order.
  const names: string[] = [];
  for (const plan of want.plans) {
    for (const feature of plan.features) if (!names.includes(feature.name)) names.push(feature.name);
  }
  const rows = [...table.querySelectorAll('tbody tr')];
  // rows = [price, ...features, cta]
  problems.equal(rows.length, names.length + 2, 'table row count (price + features + CTA)');
  names.forEach((name, index) => {
    const row = rows[index + 1];
    if (!row) return;
    const cells = [...row.querySelectorAll('td')];
    problems.equal(textOf(cells[0]), name, `feature row ${index}: name`);
    want.plans.forEach((plan, p) => {
      const cell = cells[p + 1];
      if (!cell) return;
      const feature = plan.features.find(f => f.name === name);
      if (feature && typeof feature.included === 'string') {
        problems.check(
          textOf(cell).includes(feature.included),
          `feature "${name}" x "${plan.name}": expected the value "${feature.included}",`
          + ` got "${textOf(cell)}"`,
        );
      } else {
        // A boolean (or missing) feature is shown as an icon, never as text.
        problems.check(
          !!cell.querySelector('svg'),
          `feature "${name}" x "${plan.name}": no icon for a boolean feature`,
        );
      }
    });
  });

  // The CTA row: one button per plan, carrying its own text.
  const ctaRow = rows[rows.length - 1];
  if (ctaRow) {
    const buttons = [...ctaRow.querySelectorAll('button')] as HTMLButtonElement[];
    problems.equal(buttons.length, want.plans.length, 'CTA button count');
    want.plans.forEach((plan, index) => {
      const button = buttons[index];
      if (!button) return;
      problems.equal(textOf(button), plan.cta, `CTA ${index}: text`);
      // The `part="cta"` claim is asserted separately by `checkCtaParts`, so
      // that the ONE divergence it finds (MATRIX-pricing-table-1) does not
      // blind the rest of this oracle for the whole table variant.
    });
  }
}

/**
 * The `cta` CSS PART claim, kept apart from the main oracle.
 *
 * `docs/ai/components/pricing-table.md` lists the parts without a variant
 * carve-out:
 *
 *     - `cta` - Call-to-action button
 *
 * so a consumer styling `::part(cta)` is entitled to reach every plan's
 * call-to-action in either layout. Asserting it here rather than inside
 * `checkPricing` keeps the divergence it finds from masking every other
 * assertion the table variant makes.
 */
export function checkCtaParts(el: HTMLElement, combo: PricingCombo): Problems {
  const problems = new Problems();
  const want = resolved(combo);
  const buttons = ctaButtons(el);

  problems.equal(buttons.length, want.plans.length, 'CTA button count');
  buttons.forEach((button, index) => {
    problems.check(
      (button.getAttribute('part') ?? '').split(/\s+/).includes('cta'),
      `CTA ${index} ("${textOf(button)}") does not expose part="cta"`,
    );
  });

  return problems;
}

// ── Events ──────────────────────────────────────────────────────────────────

export interface Recorded { type: string; detail: any }

export function recordEvents(el: HTMLElement): { seen: Recorded[]; of: (t: string) => any[] } {
  const seen: Recorded[] = [];
  el.addEventListener('plan-select', (event: Event) => {
    seen.push({ type: 'plan-select', detail: (event as CustomEvent).detail });
  });
  return { seen, of: (type: string) => seen.filter(e => e.type === type).map(e => e.detail) };
}

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

export { Problems, shadow, textOf, wait };
