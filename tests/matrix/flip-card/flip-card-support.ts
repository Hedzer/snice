/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-flip-card feature matrix — shared harness and oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation is quoted from docs/ai/components/flip-card.md and
 * packages/components/src/flip-card/snice-flip-card.types.ts, never from
 * observed output:
 *
 *   · PARTS — "base: The outer flip card container", "front"/"back: The
 *     front/back face container", each hosting the documented `front` / `back`
 *     slot.
 *   · STATE — `flipped: boolean = false` ("Whether back face is showing"). The
 *     entire flip is a CSS transform selected by `:host([flipped])` and
 *     `:host([direction="vertical"])`, so both must reach the host as
 *     attributes or the card cannot turn at all.
 *   · CONTROL — `flip()` toggles, `flipTo(side)` goes to a named side, and
 *     `clickToFlip: boolean = true` gates the pointer and the Enter/Space
 *     paths.
 *   · EVENT — `flip-change` → `{ flipped: boolean, side: 'front'|'back' }`.
 *   · DURATION — "`--flip-duration` — Animation duration (set automatically
 *     from `duration` property)".
 *   · ACCESSIBILITY — "role=`button` with `aria-label` on the card",
 *     "`tabindex="0"` when click-to-flip is enabled".
 *
 * The oracle reports EVERY divergence of a combo at once.
 */
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import '../../../packages/components/src/flip-card/snice-flip-card';
import type {
  FlipDirection, FlipSide,
} from '../../../packages/components/src/flip-card/snice-flip-card.types';

export { wait };

export interface FlipCombo {
  id: string;
  flipped: boolean;
  clickToFlip: boolean;
  direction: FlipDirection;
  duration: number;
  /** Which documented slots the author filled. */
  slots: { front: boolean; back: boolean };
}

/** The documented defaults, straight out of the Properties block. */
export const DEFAULTS: Omit<FlipCombo, 'id'> = {
  flipped: false,
  clickToFlip: true,
  direction: 'horizontal',
  duration: 600,
  slots: { front: true, back: true },
};

export const DIRECTIONS: FlipDirection[] = ['horizontal', 'vertical'];
export const DURATIONS = [600, 250, 1200];

export function combo(id: string, over: Partial<FlipCombo> = {}): FlipCombo {
  return { ...DEFAULTS, id, ...over };
}

/**
 * The cross: direction x flipped x clickToFlip x duration — 24 combos, every
 * dimension that changes the rendered attributes, the tab order or the
 * animation — with the two slot-fill states rotated across them. A flip card
 * has one render function with no branches, so this is the "handful to tens"
 * end of the scale `.ai/fuzzing.md` describes, not the table's budget.
 */
export function generateCombos(): FlipCombo[] {
  const SLOTS = [
    { front: true, back: true },
    { front: true, back: false },
    { front: false, back: true },
  ];
  const combos: FlipCombo[] = [];
  let n = 0;
  for (const direction of DIRECTIONS) {
    for (const flipped of [false, true]) {
      for (const clickToFlip of [true, false]) {
        for (const duration of DURATIONS) {
          const slots = SLOTS[n % SLOTS.length];
          combos.push({
            id: `${direction}/${flipped ? 'back' : 'front'}`
              + `/${clickToFlip ? 'clickable' : 'static'}/duration:${duration}`
              + `/[slots:${slots.front ? 'front' : ''}${slots.front && slots.back ? '+' : ''}`
              + `${slots.back ? 'back' : ''}]`,
            flipped, clickToFlip, direction, duration, slots,
          });
          n++;
        }
      }
    }
  }
  return combos;
}

const ATTRIBUTE_OF: Record<string, string> = {
  flipped: 'flipped',
  clickToFlip: 'click-to-flip',
  direction: 'direction',
  duration: 'duration',
};

/**
 * Mount with the documented slot children in place BEFORE connection — the
 * card renders named slots and an author writes them in markup — then assign
 * only NON-DEFAULT properties, the channel that can detect broken reflection.
 */
export async function mountCard(c: Partial<FlipCombo>): Promise<any> {
  const el = document.createElement('snice-flip-card') as any;
  const slots = c.slots ?? DEFAULTS.slots;
  let html = '';
  if (slots.front) html += '<div slot="front" data-face="front">Front content</div>';
  if (slots.back) html += '<div slot="back" data-face="back">Back content</div>';
  if (html) el.innerHTML = html;
  document.body.appendChild(el);
  await el.ready;
  for (const [key, value] of Object.entries(c)) {
    if (key === 'id' || key === 'slots') continue;
    if ((DEFAULTS as any)[key] === value) continue;
    el[key] = value;
  }
  await wait(20);
  return el;
}

const partsNamed = (sr: ShadowRoot, name: string): HTMLElement[] =>
  [...sr.querySelectorAll('[part]')].filter(node =>
    (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as HTMLElement[];

export const cardBase = (el: any): HTMLElement | null =>
  partsNamed(el.shadowRoot, 'base')[0] ?? null;

export interface OracleOptions { fresh?: boolean }

/** Documented: `flipTo`'s side names map one-to-one onto `flipped`. */
export function expectedSide(flipped: boolean): FlipSide {
  return flipped ? 'back' : 'front';
}

/** Every documented consequence of `c`, read back off the rendered tree. */
export function flipProblems(
  el: any,
  c: FlipCombo,
  { fresh = true }: OracleOptions = {},
): string[] {
  const problems: string[] = [];
  const say = (m: string) => problems.push(m);
  const sr = el.shadowRoot as ShadowRoot | null;
  if (!sr) { say('flip card rendered no shadow root'); return problems; }

  // ── The three documented parts ────────────────────────────────────────────
  for (const name of ['base', 'front', 'back']) {
    const found = partsNamed(sr, name);
    if (found.length !== 1) {
      say(`${found.length} elements carry part="${name}", expected exactly 1`);
    }
  }
  const base = partsNamed(sr, 'base')[0];
  if (!base) return problems;
  const front = partsNamed(sr, 'front')[0];
  const back = partsNamed(sr, 'back')[0];
  for (const [name, face] of [['front', front], ['back', back]] as const) {
    if (face && !base.contains(face)) say(`part="${name}" is not inside part="base"`);
  }

  // ── Accessibility ─────────────────────────────────────────────────────────
  if (base.getAttribute('role') !== 'button') {
    say(`part="base" role is "${base.getAttribute('role')}", expected "button"`);
  }
  if (!base.getAttribute('aria-label')) say('the card has no aria-label');
  // "tabindex=0 when click-to-flip is enabled" — and out of the tab order when
  // it is not, because a card that cannot be activated must not be a stop.
  const wantTabindex = c.clickToFlip ? '0' : '-1';
  if (base.getAttribute('tabindex') !== wantTabindex) {
    say(`clickToFlip=${c.clickToFlip} left tabindex="${base.getAttribute('tabindex')}",`
      + ` expected "${wantTabindex}"`);
  }

  // ── The documented slots ──────────────────────────────────────────────────
  for (const name of ['front', 'back'] as const) {
    const slot = sr.querySelector(`slot[name="${name}"]`) as HTMLSlotElement | null;
    if (!slot) { say(`the documented "${name}" slot is missing`); continue; }
    const host = name === 'front' ? front : back;
    if (host && !host.contains(slot)) {
      say(`the "${name}" slot is not inside part="${name}"`);
    }
    const assigned = slot.assignedElements ? slot.assignedElements() : [];
    const want = c.slots[name] ? 1 : 0;
    if (assigned.length !== want) {
      say(`slot "${name}" projects ${assigned.length} element(s), expected ${want}`);
    }
  }

  // ── The state the stylesheet turns the card with ──────────────────────────
  if (el.flipped !== c.flipped) say(`flipped is ${el.flipped}, expected ${c.flipped}`);
  if (c.flipped && !el.hasAttribute('flipped')) {
    say('flipped=true but [flipped] never reached the host — the transform cannot select it');
  }
  if (!c.flipped && el.hasAttribute('flipped') && el.getAttribute('flipped') !== 'false') {
    say('flipped=false but [flipped] is still on the host — the card stays turned');
  }

  // ── `--flip-duration`, "set automatically from duration" ──────────────────
  const custom = el.style.getPropertyValue('--flip-duration').trim();
  if (custom && custom !== `${c.duration}ms`) {
    say(`duration=${c.duration} but --flip-duration is "${custom}"`);
  }
  if (!custom && c.duration !== DEFAULTS.duration) {
    say(`duration=${c.duration} was assigned but --flip-duration was never set,`
      + ' so the animation still runs at the stylesheet default');
  }

  // ── Reflection of the remaining documented properties ─────────────────────
  for (const [key, attribute] of Object.entries(ATTRIBUTE_OF)) {
    if (key === 'flipped') continue; // asserted above, in both directions
    const v = (c as any)[key];
    const isDefault = (DEFAULTS as any)[key] === v;
    const present = el.hasAttribute(attribute);
    if (isDefault) {
      if (present && fresh) {
        say(`${key} left at its default but [${attribute}]="${el.getAttribute(attribute)}"`
          + ' was written anyway');
      }
      continue;
    }
    if (typeof v === 'boolean') {
      if (v && !present) say(`${key}=true assigned but [${attribute}] never reflected`);
      // A false boolean is either the absent attribute or the documented
      // `attr="false"` form (docs/ai/properties.md: `<element enabled="false">`
      // -> false) — an author's own markup is not un-written by reflection.
      if (!v && present && el.getAttribute(attribute) !== 'false') {
        say(`${key}=false assigned but [${attribute}] is still present`);
      }
      continue;
    }
    if (!present) {
      say(`${key}=${JSON.stringify(v)} assigned as a property but [${attribute}] never reflected`);
      continue;
    }
    if (el.getAttribute(attribute) !== String(v)) {
      say(`[${attribute}] reflected "${el.getAttribute(attribute)}", expected "${String(v)}"`);
    }
  }

  return problems;
}

/** A real pointer click on the card's base. */
export function clickCard(el: any): void {
  cardBase(el)?.dispatchEvent(new MouseEvent('click', {
    bubbles: true, composed: true, cancelable: true,
  }));
}

/** A keydown on the card's base, as a real key event. */
export function pressCard(el: any, key: string): void {
  cardBase(el)?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

/** Record every `flip-change` detail, in dispatch order. */
export function captureFlips(el: HTMLElement): Array<{ flipped: boolean; side: FlipSide }> {
  const seen: Array<{ flipped: boolean; side: FlipSide }> = [];
  el.addEventListener('flip-change', (event: Event) => {
    seen.push((event as CustomEvent).detail);
  });
  return seen;
}

/** Assert one combo against the oracle. */
export function expectCard(el: any, c: FlipCombo, options?: OracleOptions): void {
  expect(flipProblems(el, c, options), `combo ${c.id}`).toEqual([]);
}
