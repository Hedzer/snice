/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-carousel feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The pattern is `tests/matrix/table/matrix-utils.ts`: one oracle per
 * combo, expectations derived from the DOCUMENTED contract
 * (`docs/ai/components/carousel.md` plus `snice-carousel.types.ts`), and every
 * violation of a combo reported together.
 *
 * What the docs promise, and therefore what this module encodes:
 *
 *   · each DIRECT CHILD is one slide (doc "Slots"), so the slide count is the
 *     light-DOM child count and nothing else;
 *   · `active-index` selects the visible slide, and the slides container is
 *     translated by `activeIndex * (100 / slidesPerView)` percent — the only
 *     rendered evidence of "which slide is showing" in a DOM-only environment;
 *   · `show-controls` / `show-indicators` each gate a whole documented subtree
 *     (`controls` + `button-prev`/`button-next`, `indicators` + `indicator`);
 *   · `loop` decides whether the boundaries wrap, and therefore whether the
 *     prev/next buttons are disabled at the ends;
 *   · one `part="indicator"` per reachable position, the active one marked;
 *   · `carousel-slide-change` carries `{ activeIndex, previousIndex, carousel }`
 *     and marks a CHANGE of slide.
 *
 * `.ai/fuzzing.md` is binding: a divergence is a FINDING — the assertion stays
 * and the test is declared `it.fails` with a `MATRIX-carousel-N` id.
 */
import { expect } from 'vitest';
import { wait } from '../../components/test-utils';
import '../../../packages/components/src/carousel/snice-carousel';
import type {
  SniceCarouselElement, CarouselSlideChangeDetail,
} from '../../../packages/components/src/carousel/snice-carousel.types';

export { wait };
export type { SniceCarouselElement, CarouselSlideChangeDetail };

/** Settle window: render invalidation plus the slotchange the count depends on. */
export const SETTLE = 40;

export interface CarouselSpec {
  slides?: number;
  activeIndex?: number;
  autoplay?: boolean;
  autoplayInterval?: number;
  autoplayDirection?: 'forward' | 'backward';
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  slidesPerView?: number;
  spaceBetween?: number;
}

/**
 * Mount a carousel for one combo.
 *
 * The light-DOM slides are in place BEFORE the element connects. That ordering
 * is load-bearing rather than tidy: the slide count comes from
 * `slot.assignedElements()`, read on `@ready` and refreshed by `slotchange`, and
 * happy-dom does not fire `slotchange` for a post-connect `innerHTML` write. An
 * author writes the markup that way too (doc "Basic Usage"), so this is the
 * documented shape as well as the only one this environment can measure.
 */
export async function makeCarousel(spec: CarouselSpec = {}): Promise<SniceCarouselElement> {
  const el = document.createElement('snice-carousel') as SniceCarouselElement;
  const count = spec.slides ?? 3;
  el.innerHTML = Array.from({ length: count },
    (_, i) => `<div class="slide" data-slide="${i}">Slide ${i}</div>`).join('');

  if (spec.activeIndex !== undefined) el.setAttribute('active-index', String(spec.activeIndex));
  if (spec.autoplay) el.setAttribute('autoplay', '');
  if (spec.autoplayInterval !== undefined) {
    el.setAttribute('autoplay-interval', String(spec.autoplayInterval));
  }
  if (spec.autoplayDirection) el.setAttribute('autoplay-direction', spec.autoplayDirection);
  if (spec.loop === false) el.setAttribute('loop', 'false');
  if (spec.showControls === false) el.setAttribute('show-controls', 'false');
  if (spec.showIndicators === false) el.setAttribute('show-indicators', 'false');
  if (spec.slidesPerView !== undefined) el.setAttribute('slides-per-view', String(spec.slidesPerView));
  if (spec.spaceBetween !== undefined) el.setAttribute('space-between', String(spec.spaceBetween));

  document.body.appendChild(el);
  await (el as any).ready;
  await wait(SETTLE);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function sr(el: SniceCarouselElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error('snice-carousel has no shadow root');
  return root;
}

/**
 * Nodes exposing EXACTLY the named CSS part. `[part~="indicator"]` is not used:
 * happy-dom's attribute-word matcher also returns `part="indicators"`, which
 * would add a phantom dot to every count in this directory.
 */
export function partsOf<T extends Element = HTMLElement>(
  el: SniceCarouselElement, name: string,
): T[] {
  return [...sr(el).querySelectorAll('[part]')].filter(node =>
    (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as unknown as T[];
}

export function part<T extends Element = HTMLElement>(
  el: SniceCarouselElement, name: string,
): T | null {
  return partsOf<T>(el, name)[0] ?? null;
}

export function indicators(el: SniceCarouselElement): HTMLButtonElement[] {
  return partsOf<HTMLButtonElement>(el, 'indicator');
}

export function prevButton(el: SniceCarouselElement): HTMLButtonElement | null {
  return part<HTMLButtonElement>(el, 'button-prev');
}

export function nextButton(el: SniceCarouselElement): HTMLButtonElement | null {
  return part<HTMLButtonElement>(el, 'button-next');
}

export function slidesContainer(el: SniceCarouselElement): HTMLElement | null {
  return part(el, 'slides-container');
}

/** The index the active-indicator class currently marks, or -1. */
export function activeIndicator(el: SniceCarouselElement): number {
  return indicators(el).findIndex(dot =>
    dot.classList.contains('carousel__indicator--active'));
}

/** The translate the slides container is currently carrying, in percent. */
export function transformPercent(el: SniceCarouselElement): number | null {
  const transform = slidesContainer(el)?.style.transform ?? '';
  const match = /translateX\((-?[\d.]+)%\)/.exec(transform);
  return match ? Number(match[1]) : null;
}

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

export async function press(el: SniceCarouselElement, key: string): Promise<void> {
  el.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
  await wait(SETTLE);
}

export function captureSlideChanges(el: SniceCarouselElement): CarouselSlideChangeDetail[] {
  const seen: CarouselSlideChangeDetail[] = [];
  el.addEventListener('carousel-slide-change', (event: Event) => {
    seen.push((event as CustomEvent<CarouselSlideChangeDetail>).detail);
  });
  return seen;
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * The documented number of reachable positions.
 *
 * With `slides-per-view = n`, the last position that still fills the viewport
 * starts at `slideCount - n`, so there are `slideCount - n + 1` positions — one
 * indicator each. A carousel showing more slides than it has gets a single
 * position, never a negative count.
 */
export function expectedPositions(slides: number, slidesPerView: number): number {
  return Math.max(0, slides - slidesPerView + 1);
}

/** The documented translate for a position: `-index * (100 / slidesPerView)` %. */
export function expectedTransform(activeIndex: number, slidesPerView: number): number {
  return -(activeIndex * (100 / slidesPerView));
}

/**
 * The CORE oracle: assert the whole rendered carousel for a combo, collecting
 * every violation so one run tells the whole story.
 */
export function expectCarouselMatches(
  el: SniceCarouselElement,
  spec: Required<Pick<CarouselSpec, 'slides' | 'activeIndex' | 'loop'
    | 'showControls' | 'showIndicators' | 'slidesPerView'>>,
): void {
  const problems: string[] = [];
  const positions = expectedPositions(spec.slides, spec.slidesPerView);

  // ── The documented shell ──────────────────────────────────────────────────
  const container = part(el, 'container');
  if (!container) problems.push('no part="container" rendered');
  else {
    // Doc "Accessibility: ARIA roles and labels". A carousel is a region that
    // announces itself as a carousel.
    if (container.getAttribute('role') !== 'region') {
      problems.push(`container role "${container.getAttribute('role')}", expected region`);
    }
    if (container.getAttribute('aria-roledescription') !== 'carousel') {
      problems.push(`container aria-roledescription "${container.getAttribute('aria-roledescription')}"`);
    }
  }
  if (!part(el, 'viewport')) problems.push('no part="viewport" rendered');
  if (!slidesContainer(el)) problems.push('no part="slides-container" rendered');

  // ── Doc "Slots": each direct child is one slide ───────────────────────────
  const slot = sr(el).querySelector('slot');
  const assigned = slot ? slot.assignedElements().length : -1;
  if (assigned !== spec.slides) {
    problems.push(`slot projects ${assigned} slides, expected ${spec.slides}`);
  }

  // ── The active position, as a translate ───────────────────────────────────
  const wantTransform = expectedTransform(spec.activeIndex, spec.slidesPerView);
  // An ABSENT transform is a translate of zero — the first slide is showing,
  // which is exactly what `translateX(0%)` would mean. The oracle reads it that
  // way rather than demanding the inline style, so it judges the picture the
  // documented state produces and not the mechanism the component happens to
  // use to produce it.
  const gotTransform = transformPercent(el) ?? 0;
  if (Math.abs(gotTransform - wantTransform) > 0.001) {
    problems.push(`translateX ${gotTransform}% != ${wantTransform}%`
      + ` (activeIndex=${spec.activeIndex}, slidesPerView=${spec.slidesPerView})`);
  }

  // ── Doc: `show-controls` gates the whole control subtree ──────────────────
  const controls = part(el, 'controls');
  if (spec.showControls) {
    if (!controls) problems.push('show-controls is on but no part="controls" rendered');
    const prev = prevButton(el);
    const next = nextButton(el);
    if (!prev) problems.push('no part="button-prev" rendered');
    if (!next) problems.push('no part="button-next" rendered');

    // Doc: `loop` decides whether the ends wrap; a non-looping carousel cannot
    // go back from the first position or forward from the last, and the button
    // must say so rather than silently doing nothing.
    const canPrev = spec.loop || spec.activeIndex > 0;
    const canNext = spec.loop || spec.activeIndex < spec.slides - spec.slidesPerView;
    if (prev && prev.disabled === canPrev) {
      problems.push(`prev button disabled=${prev.disabled}, expected ${!canPrev}`);
    }
    if (next && next.disabled === canNext) {
      problems.push(`next button disabled=${next.disabled}, expected ${!canNext}`);
    }
    if (prev && prev.getAttribute('aria-label') !== 'Previous slide') {
      problems.push(`prev aria-label "${prev.getAttribute('aria-label')}"`);
    }
    if (next && next.getAttribute('aria-label') !== 'Next slide') {
      problems.push(`next aria-label "${next.getAttribute('aria-label')}"`);
    }
  } else if (controls) {
    problems.push('show-controls is off but part="controls" rendered');
  }

  // ── Doc: `show-indicators` gates the dots, one per reachable position ─────
  const dotsHost = part(el, 'indicators');
  const dots = indicators(el);
  if (spec.showIndicators) {
    if (!dotsHost) problems.push('show-indicators is on but no part="indicators" rendered');
    if (dots.length !== positions) {
      problems.push(`${dots.length} indicators, expected ${positions}`);
    }
    dots.forEach((dot, i) => {
      if (dot.getAttribute('aria-label') !== `Go to slide ${i + 1}`) {
        problems.push(`indicator ${i} aria-label "${dot.getAttribute('aria-label')}"`);
      }
    });
    // Exactly one dot is marked active, and it is the active position — an
    // active index outside the dot range marks none, which is itself reportable.
    const active = activeIndicator(el);
    const wantActive = spec.activeIndex < dots.length ? spec.activeIndex : -1;
    if (active !== wantActive) {
      problems.push(`active indicator ${active}, expected ${wantActive}`);
    }
  } else {
    if (dotsHost) problems.push('show-indicators is off but part="indicators" rendered');
    if (dots.length) problems.push(`show-indicators is off but ${dots.length} dots rendered`);
  }

  expect(problems, `carousel combo slides=${spec.slides}/index=${spec.activeIndex}`
    + `/perView=${spec.slidesPerView}/loop=${spec.loop}`).toEqual([]);
}

/** Fill in the documented defaults so a combo only names what it varies. */
export function withDefaults(spec: CarouselSpec & { slides: number }) {
  return {
    slides: spec.slides,
    activeIndex: spec.activeIndex ?? 0,
    loop: spec.loop ?? true,
    showControls: spec.showControls ?? true,
    showIndicators: spec.showIndicators ?? true,
    slidesPerView: spec.slidesPerView ?? 1,
  };
}

/**
 * The title of a test pinned to a known divergence from the docs. The assertion
 * is NOT weakened and the component is NOT changed (`.ai/fuzzing.md`).
 */
export function finding(id: string, description: string): string {
  return `${id}: ${description}`;
}
