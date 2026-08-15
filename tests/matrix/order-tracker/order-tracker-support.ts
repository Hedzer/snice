/**
 * snice-order-tracker matrix — oracle module.
 *
 * Every expectation is transcribed from `docs/ai/components/order-tracker.md`
 * and `snice-order-tracker.types.ts`:
 *
 *   · "Order status timeline with step indicators, tracking info, timestamps,
 *     and descriptions."
 *   · `steps: OrderStep[]` (JS only), `trackingNumber` (attr `tracking-number`),
 *     `carrier`, `variant: 'horizontal'|'vertical'`.
 *   · `OrderStep` — `label`, `status: 'pending'|'active'|'completed'`, optional
 *     `timestamp`, `description`, `icon`.
 *   · `step-click` → `{ step: OrderStep, index: number }`.
 *   · Parts `base`, `info`, `steps`, `step`, `step-indicator`, `step-content`.
 *   · a11y: `role="list"` / `role="listitem"`, keyboard-focusable with
 *     Enter/Space activation, "Completed steps show check icons".
 */
import type {
  OrderStep,
  OrderStepStatus,
  OrderTrackerVariant,
} from '../../../packages/components/src/order-tracker/snice-order-tracker.types';
import '../../../packages/components/src/order-tracker/snice-order-tracker';
import { mount, settle, shadow } from './matrix-utils';

export type { OrderStep };

// ── Exact part lookup ───────────────────────────────────────────────────────
//
// This component's part names nest by prefix — `step`, `step-indicator`,
// `step-content` — and happy-dom's attribute matcher answers `[part~="step"]`
// with `part="step-indicator"` as well (verified: `~=` there also accepts a
// hyphen-prefixed value, the behaviour CSS reserves for `|=`). A count taken
// through that selector would be measuring the test environment, so the oracle
// resolves parts by splitting the attribute itself.

/** Every element whose `part` list CONTAINS `name` as a whole token. */
export function stepParts(el: HTMLElement, name: string): HTMLElement[] {
  return [...shadow(el).querySelectorAll('[part]')].filter(node =>
    (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];
}

/** The first element exposing `name` as a whole part token. */
export function stepPart(el: HTMLElement, name: string): HTMLElement | null {
  return stepParts(el, name)[0] ?? null;
}

/** The same lookup, scoped to one already-resolved node. */
export function withinPart(node: Element, name: string): HTMLElement | null {
  return [...node.querySelectorAll('[part]')].find(child =>
    (child.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement ?? null;
}

/** The documented `OrderTrackerVariant` union. */
export const VARIANTS: readonly OrderTrackerVariant[] = ['horizontal', 'vertical'] as const;

/** The documented `OrderStepStatus` union, in declaration order. */
export const STATUSES: readonly OrderStepStatus[] = ['pending', 'active', 'completed'] as const;

/** The four states of the documented tracking-info section. */
export const INFO_SHAPES = ['none', 'carrier', 'tracking', 'both'] as const;
export type InfoShape = typeof INFO_SHAPES[number];

export const CARRIER = 'UPS';
export const TRACKING = '1Z999AA10123456784';

export function infoFor(shape: InfoShape): { carrier?: string; trackingNumber?: string } {
  return {
    ...(shape === 'carrier' || shape === 'both' ? { carrier: CARRIER } : {}),
    ...(shape === 'tracking' || shape === 'both' ? { trackingNumber: TRACKING } : {}),
  };
}

// ── Fixtures ────────────────────────────────────────────────────────────────

/** The docs' own three-step order, which covers all three statuses at once. */
export function journey(): OrderStep[] {
  return [
    { label: 'Ordered', status: 'completed', timestamp: 'Feb 20, 2026' },
    { label: 'Shipped', status: 'active', timestamp: 'Feb 22, 2026', description: 'Package left warehouse' },
    { label: 'Delivered', status: 'pending' },
  ];
}

export const COUNTS = [0, 1, 3] as const;
export type Count = typeof COUNTS[number];

export function journeyOf(count: Count): OrderStep[] {
  return journey().slice(0, count);
}

/** The documented optional-field shapes of one step. */
export const EXTRA_SHAPES = ['bare', 'timestamp', 'description', 'both'] as const;
export type ExtraShape = typeof EXTRA_SHAPES[number];

export function stepWith(
  status: OrderStepStatus,
  extras: ExtraShape,
  icon?: string,
): OrderStep {
  return {
    label: 'Shipped',
    status,
    ...(extras === 'timestamp' || extras === 'both' ? { timestamp: 'Feb 22, 2026' } : {}),
    ...(extras === 'description' || extras === 'both' ? { description: 'Package left warehouse' } : {}),
    ...(icon ? { icon } : {}),
  };
}

/**
 * What a step's indicator shows, per the docs: "Completed steps show check
 * icons", and every other step shows its 1-based position. An authored `icon`
 * is the more specific instruction and replaces both.
 */
export function indicatorFor(step: OrderStep, index: number): 'icon' | 'check' | string {
  if (step.icon) return 'icon';
  if (step.status === 'completed') return 'check';
  return String(index + 1);
}

// ── Mounting one combo ──────────────────────────────────────────────────────

export interface TrackerElement extends HTMLElement {
  steps: OrderStep[];
  trackingNumber: string;
  carrier: string;
  variant: OrderTrackerVariant;
}

export interface TrackerCombo {
  steps?: OrderStep[];
  variant?: OrderTrackerVariant;
  carrier?: string;
  trackingNumber?: string;
}

/**
 * Mount one combo. `variant`, `carrier` and `tracking-number` cross the
 * ATTRIBUTE channel — the documented markup form — and `steps` the property
 * channel, because the docs mark it "JS only".
 */
export async function mountTracker(combo: TrackerCombo = {}): Promise<TrackerElement> {
  const { steps = [], variant, carrier, trackingNumber } = combo;
  const attrs: Record<string, string> = {};
  if (variant) attrs.variant = variant;
  if (carrier) attrs.carrier = carrier;
  if (trackingNumber) attrs['tracking-number'] = trackingNumber;

  const el = await mount<TrackerElement>('snice-order-tracker', {
    attrs, props: { steps },
  });
  await settle();
  return el;
}
