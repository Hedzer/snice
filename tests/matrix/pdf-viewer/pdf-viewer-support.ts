/**
 * Per-component oracle for the snice-pdf-viewer matrix.
 *
 * snice-pdf-viewer is a document viewer: a static chrome (toolbar + viewport)
 * whose every state derives from `src`, `page`, `zoom`, `fit`, and whatever
 * document (if any) `src` produced. Everything encoded here comes from
 * docs/ai/components/pdf-viewer.md, docs/components/pdf-viewer.md, and
 * snice-pdf-viewer.types.ts — never from observed output:
 *
 *   · Properties: `src: string = ''`, `page: number = 1`, `zoom: number = 1`
 *     ("Zoom level (range: 0.25 to 5)"), `fit: 'width'|'height'|'page' =
 *     'width'`, `readonly totalPages: number = 0`.
 *   · CSS Parts: `base` ("Outer viewer container"), `toolbar` ("Navigation and
 *     zoom toolbar"), `viewport` ("PDF page display area") — unconditional.
 *   · Accessibility, quoted: "The viewer container is keyboard-focusable with
 *     `tabindex="0"`", "All toolbar buttons have descriptive `title`
 *     attributes", "The page input field allows direct page number entry",
 *     "Navigation buttons are disabled at page boundaries".
 *   · Toolbar state: `zoomInfo` reads the zoom as a percentage, the page input
 *     mirrors `page`, and the boundary rule is "disabled at page boundaries" —
 *     prev at the first page, next at the last, and the documented zoom range
 *     caps the zoom buttons at 0.25 and 5. Download and print act on `src`,
 *     so both are barred with no document.
 *   · Events: `page-change -> { page, totalPages }` (page navigation),
 *     `pdf-loaded -> { totalPages }` (document loaded), `pdf-error ->
 *     { error }` (loading or rendering error).
 *   · Reflection follows docs/ai/properties.md: authored attributes are always
 *     present; property assignments reflect only non-default values; defaults
 *     never reflect. `totalPages` is readonly data, not an axis.
 *
 * The DOM tier owns VALUE/STRUCTURE truth only. Fit is a GEOMETRY contract
 * ("how the page fills the viewport"), so what the fit axis owns here is the
 * toolbar's fit select, the reflection channel, and event flow — the rendered
 * canvas geometry belongs to the visual tier.
 */
import { mount, shadow, settle, type Shape } from '../matrix-utils';
import { exactPart } from '../part-exact';

export const FITS = ['width', 'height', 'page'] as const;
export type Fit = typeof FITS[number];

export const CHANNELS = ['attr', 'prop'] as const;
export type Channel = typeof CHANNELS[number];

/** Documented defaults, from docs/ai/components/pdf-viewer.md. */
export const DEFAULTS = {
  src: '',
  page: 1,
  zoom: 1,
  fit: 'width' as Fit,
  totalPages: 0,
};

export interface ViewerCombo {
  src?: string;
  page: number;
  zoom: number;
  fit: Fit;
  channel: Channel;
}

// ── Mounting ────────────────────────────────────────────────────────────────

/**
 * Mount a combo through its own authoring channel.
 *
 * The ATTR channel authors `page`/`zoom`/`fit`/`src` as markup — the docs'
 * own usage is `<snice-pdf-viewer src="…" fit="width">`. The PROP channel
 * assigns typed values once the element is ready, which is the channel the
 * reflection oracle cares about (docs/ai/properties.md).
 */
export async function mountViewer(combo: ViewerCombo): Promise<HTMLElement> {
  const attrs: Record<string, any> = {};
  if (combo.channel === 'attr') {
    if (combo.src !== undefined) attrs.src = combo.src;
    attrs.page = combo.page;
    attrs.zoom = combo.zoom;
    attrs.fit = combo.fit;
  }
  const el = await mount<HTMLElement>('snice-pdf-viewer', attrs);
  if (combo.channel === 'prop') {
    const target = el as any;
    if (combo.src !== undefined) target.src = combo.src;
    target.page = combo.page;
    target.zoom = combo.zoom;
    target.fit = combo.fit;
    await settle(el, 5);
  }
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function toolbarButton(el: HTMLElement, kind: string): HTMLButtonElement | null {
  return shadow(el).querySelector<HTMLButtonElement>(`.pdf-btn-${kind}`);
}

export function pageInput(el: HTMLElement): HTMLInputElement | null {
  return shadow(el).querySelector<HTMLInputElement>('.pdf-page-input');
}

export function fitSelect(el: HTMLElement): HTMLSelectElement | null {
  return shadow(el).querySelector<HTMLSelectElement>('.pdf-fit-select');
}

export function stateVisible(el: HTMLElement, kind: 'loading' | 'error' | 'empty' | 'canvas'): boolean {
  const node = shadow(el).querySelector(`.pdf-${kind === 'canvas' ? 'canvas-wrapper' : kind}`);
  return !!node && node.classList.contains('is-visible');
}

// ── The shape oracle ────────────────────────────────────────────────────────

/**
 * The DOCUMENTED chrome shape — the unconditional shell, independent of any
 * document: the three parts, the focusable container, the titled toolbar
 * buttons, and exactly one visible viewport state (with no `src`, that state
 * is the empty one).
 */
export function expectedShell(): Shape {
  return {
    hasBasePart: true,
    hasToolbarPart: true,
    hasViewportPart: true,
    baseTabindex: '0',
    toolbarButtons: ['prev', 'next', 'zoom-out', 'zoom-in', 'download', 'print'],
    everyButtonTitled: true,
    pageInputType: 'number',
    pageInputAllowsDirectEntry: true,
    fitOptions: ['width', 'height', 'page'],
    stateVisible: 'empty',
  };
}

export function readShell(el: HTMLElement): Shape {
  const sr = shadow(el);
  const kinds = ['prev', 'next', 'zoom-out', 'zoom-in', 'download', 'print'];
  const buttons = kinds.map(kind => toolbarButton(el, kind));
  return {
    hasBasePart: !!exactPart(el, 'base'),
    hasToolbarPart: !!exactPart(el, 'toolbar'),
    hasViewportPart: !!exactPart(el, 'viewport'),
    baseTabindex: sr.querySelector('.pdf-container')?.getAttribute('tabindex') ?? null,
    toolbarButtons: kinds.filter((_, i) => !!buttons[i]),
    everyButtonTitled: buttons.every(b => !!b?.getAttribute('title')),
    pageInputType: pageInput(el)?.getAttribute('type') ?? null,
    pageInputAllowsDirectEntry: !!pageInput(el) && pageInput(el)!.getAttribute('aria-label') !== null,
    fitOptions: fitSelect(el)
      ? [...fitSelect(el)!.options].map(o => o.value)
      : null,
    stateVisible: (['loading', 'error', 'empty', 'canvas'] as const)
      .find(kind => stateVisible(el, kind)) ?? null,
  };
}

/**
 * The DOCUMENTED toolbar state for a combo. "Navigation buttons are disabled
 * at page boundaries": prev at the first page, next at the last. The zoom
 * buttons are capped by the documented range (0.25–5). Download and print act
 * on `src`, so with no document both are disabled.
 */
export function expectedToolbar(combo: ViewerCombo, totalPages = 0): Shape {
  return {
    'prev.disabled': combo.page <= 1,
    'next.disabled': combo.page >= totalPages,
    'zoom-out.disabled': combo.zoom <= 0.25,
    'zoom-in.disabled': combo.zoom >= 5,
    'download.disabled': !combo.src,
    'print.disabled': !combo.src,
    'page-input.value': String(combo.page),
    'page-input.max': String(totalPages),
    'page-total.text': `/ ${totalPages || '-'}`,
    'zoom-info.text': `${Math.round(combo.zoom * 100)}%`,
    'fit-select.value': combo.fit,
  };
}

export function readToolbar(el: HTMLElement): Shape {
  const sr = shadow(el);
  return {
    'prev.disabled': toolbarButton(el, 'prev')?.disabled ?? null,
    'next.disabled': toolbarButton(el, 'next')?.disabled ?? null,
    'zoom-out.disabled': toolbarButton(el, 'zoom-out')?.disabled ?? null,
    'zoom-in.disabled': toolbarButton(el, 'zoom-in')?.disabled ?? null,
    'download.disabled': toolbarButton(el, 'download')?.disabled ?? null,
    'print.disabled': toolbarButton(el, 'print')?.disabled ?? null,
    'page-input.value': pageInput(el)?.value ?? null,
    'page-input.max': pageInput(el)?.max ?? null,
    'page-total.text': (sr.querySelector('.pdf-page-total')?.textContent ?? '').trim(),
    'zoom-info.text': (sr.querySelector('.pdf-zoom-info')?.textContent ?? '').trim(),
    'fit-select.value': fitSelect(el)?.value ?? null,
  };
}

/**
 * The DOCUMENTED axis state: property truth for all four axes, plus the
 * attribute each is documented under (authored attributes always present;
 * property assignments reflect only non-default values — docs/ai/properties.md).
 */
export function expectedAxes(combo: ViewerCombo): Shape {
  const reflected = (name: 'src' | 'page' | 'zoom' | 'fit') =>
    combo.channel === 'attr' || combo[name] !== DEFAULTS[name];
  return {
    'prop.src': combo.src ?? DEFAULTS.src,
    'prop.page': combo.page,
    'prop.zoom': combo.zoom,
    'prop.fit': combo.fit,
    'attr.src': reflected('src') && combo.src !== undefined ? combo.src : undefined,
    'attr.page': reflected('page') ? String(combo.page) : undefined,
    'attr.zoom': reflected('zoom') ? String(combo.zoom) : undefined,
    'attr.fit': reflected('fit') ? combo.fit : undefined,
  };
}

export function readAxes(el: HTMLElement, combo: ViewerCombo): Shape {
  const reflected = (name: 'src' | 'page' | 'zoom' | 'fit') =>
    combo.channel === 'attr' || combo[name] !== DEFAULTS[name];
  return {
    'prop.src': (el as any).src,
    'prop.page': (el as any).page,
    'prop.zoom': (el as any).zoom,
    'prop.fit': (el as any).fit,
    'attr.src': reflected('src') && combo.src !== undefined ? el.getAttribute('src') : undefined,
    'attr.page': reflected('page') ? el.getAttribute('page') : undefined,
    'attr.zoom': reflected('zoom') ? el.getAttribute('zoom') : undefined,
    'attr.fit': reflected('fit') ? el.getAttribute('fit') : undefined,
  };
}

/**
 * A keydown on the viewer's focusable container, as a real key event.
 * "ArrowRight / PageDown — Next page; ArrowLeft / PageUp — Previous page;
 * Ctrl/Cmd + — Zoom in; Ctrl/Cmd - — Zoom out" (Keyboard Navigation).
 */
export function pressKey(el: HTMLElement, key: string, init: KeyboardEventInit = {}): void {
  shadow(el).querySelector('.pdf-container')
    ?.dispatchEvent(new KeyboardEvent('keydown', {
      key, bubbles: true, composed: true, cancelable: true, ...init,
    }));
}

/** The zoom step the toolbar buttons and keyboard share: 0.25 within [0.25, 5]. */
export function expectedZoomAfter(zoom: number, direction: 'in' | 'out'): number {
  const stepped = Math.round((zoom + (direction === 'in' ? 0.25 : -0.25)) * 100) / 100;
  return Math.min(5, Math.max(0.25, stepped));
}
