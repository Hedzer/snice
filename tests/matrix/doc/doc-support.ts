/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Shared oracle for the snice-doc feature-combination matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Same shape as the other per-component support modules: expectations are
 * DERIVED from the documented contract (docs/ai/components/doc.md plus
 * snice-doc.types.ts), a reader pulls the ACTUAL facts off the rendered
 * control, and a combo collects EVERY violation before asserting.
 *
 * The documented contract this file encodes, clause by clause:
 *
 *   · Properties: `placeholder: string = 'Start typing...'`,
 *     `readonly: boolean = false`, `icons: 'default'|'material'|'fontawesome'
 *     = 'default'`.
 *   · Methods: `getHTML()` / `setHTML(html)` — the document round-trips as
 *     HTML; `getText()` — plain text content; `getMarkdown()` — content as
 *     Markdown; `clear()` — "Clear all content".
 *   · CSS Parts: `base` (outer document wrapper), `editor` (editable content
 *     area), `toolbar` (formatting toolbar), `icon` (toolbar icon element).
 *   · "Simple WYSIWYG document editor with formatting toolbar and content
 *     insertion" — the toolbar's documented command set is the one the
 *     showcase (website/showcases/doc/full.html) and the unit suite
 *     (tests/components/doc.test.ts, which pins the button titles and the
 *     SVG-not-emoji icon contract) enumerate: Bold, Italic, Underline,
 *     Strikethrough, Heading 1-3, Paragraph, Bullet List, Numbered List,
 *     Insert Link, Insert Image, Insert Table, Insert Divider, Download —
 *     15 buttons in that order, grouped by dividers.
 *   · Icon sets: "default - Text labels and emoji" — the letter-glyph half
 *     is what the DOM can see (B/I/U/S/H1/H2/H3/P/•/1. are text); the
 *     pictographic half (Link/Image/Table/Divider/Download) carries the
 *     documented `icon` part, and the repo's established contract
 *     (tests/components/doc.test.ts "should render svg icons in the default
 *     set, not emoji") is registry SVGs. "material - Material Symbols
 *     Outlined (load font in document)"; "fontawesome - Font Awesome 6 solid
 *     (load font in document)" — under those two sets EVERY button carries
 *     an `icon` part element. The fonts themselves cascade from light DOM;
 *     whether a webfont glyph PAINTS is the visual tier's question.
 *   · Accessibility: "contentEditable for native text editing" — the editor
 *     is contentEditable exactly while not readonly. "Semantic HTML output".
 *   · Reflection (docs/ai/properties.md): authored attributes always exist;
 *     property assignments reflect unless equal to the documented default.
 *     `readonly` is the axis that matters most: the stylesheet hides the
 *     toolbar with `:host([readonly])`.
 *   · `clear()` re-seeds `'<p><br></p>'` — the established empty-document
 *     contract from tests/components/doc.test.ts. A FRESH editor mounts
 *     empty instead: the documented placeholder paints through
 *     `.doc-editor:empty::before` (VISUAL-MATRIX-doc-1), and a seeded
 *     `<p><br></p>` would defeat it.
 *
 * Deliberately NOT encoded: webfont glyph painting, toolbar/editor geometry,
 * placeholder pixels — those belong to tests/live/matrix/doc, where a real
 * engine runs them. `document.execCommand` formatting is likewise a real-
 * engine behaviour (the doc's Ctrl/Cmd+B/I/U clause), so the keyboard
 * formatting contract is asserted THERE, not here.
 */
import { mount, settle, type Shape } from '../matrix-utils';
import '../../../packages/components/src/doc/snice-doc';

export type Doc = any; // SniceDocElement fields are accessed through the light surface

/** A Snice render is a microtask plus a queued task. */
export const SETTLE = 30;

// ── Dimensions (docs "Properties" / "Icon Sets") ────────────────────────────

export const ICON_SETS = ['default', 'material', 'fontawesome'] as const;
export type IconSet = typeof ICON_SETS[number];

export const CHANNELS = ['attr', 'prop'] as const;
export type Channel = typeof CHANNELS[number];

/** Documented defaults, from docs/ai/components/doc.md "Properties". */
export const DEFAULTS = {
  placeholder: 'Start typing...',
  readonly: false,
  icons: 'default' as IconSet,
};

// ── The toolbar inventory ───────────────────────────────────────────────────

export interface ToolSpec {
  /** The button's documented title. */
  title: string;
  /** The default-set text glyph, when the tool is a letter-glyph button. */
  glyph?: string;
  /** Whether this tool's button carries the `icon` part in EVERY set. */
  alwaysIcon?: boolean;
}

/**
 * The 15 documented formatting/insertion commands in toolbar order. The doc
 * names the families ("formatting toolbar and content insertion", the
 * Ctrl/Cmd+B/I/U shortcuts); the exact inventory and order are pinned by the
 * showcase and the unit suite.
 */
export const TOOLS: readonly ToolSpec[] = [
  { title: 'Bold (Ctrl+B)', glyph: 'B' },
  { title: 'Italic (Ctrl+I)', glyph: 'I' },
  { title: 'Underline (Ctrl+U)', glyph: 'U' },
  { title: 'Strikethrough', glyph: 'S' },
  { title: 'Heading 1', glyph: 'H1' },
  { title: 'Heading 2', glyph: 'H2' },
  { title: 'Heading 3', glyph: 'H3' },
  { title: 'Paragraph', glyph: 'P' },
  { title: 'Bullet List', glyph: '•' },
  { title: 'Numbered List', glyph: '1.' },
  { title: 'Insert Link', alwaysIcon: true },
  { title: 'Insert Image', alwaysIcon: true },
  { title: 'Insert Table', alwaysIcon: true },
  { title: 'Insert Divider', alwaysIcon: true },
  { title: 'Download', alwaysIcon: true },
];

/** The icon-part count per set: 5 pictographic tools under `default`, every
 *  button under the webfont sets. */
export function expectedIconPartCount(icons: IconSet): number {
  return icons === 'default' ? 5 : TOOLS.length;
}

// ── Mounting ────────────────────────────────────────────────────────────────

export interface DocCombo {
  icons: IconSet;
  readonly: boolean;
  placeholder: string;
  channel: Channel;
}

const mounted: HTMLElement[] = [];

/**
 * Mount a combo through its own authoring channel. The property channel is
 * the interesting one for `readonly`: `:host([readonly]) .toolbar { display:
 * none }` cannot see a JS assignment that never reflects.
 */
export async function mountDoc(combo: DocCombo): Promise<Doc> {
  if (combo.channel === 'attr') {
    const attrs: Record<string, any> = { icons: combo.icons };
    if (combo.readonly) attrs.readonly = true;
    if (combo.placeholder !== DEFAULTS.placeholder) attrs.placeholder = combo.placeholder;
    const el = await mount<HTMLElement>('snice-doc', attrs);
    mounted.push(el);
    return el;
  }
  const el = await mount<HTMLElement>('snice-doc', {}, '', {
    icons: combo.icons,
    readonly: combo.readonly,
    placeholder: combo.placeholder,
  });
  mounted.push(el);
  return el;
}

/** Mount with content already applied via the documented `setHTML`. */
export async function mountDocWithContent(combo: DocCombo, html: string): Promise<Doc> {
  const el = await mountDoc(combo);
  el.setHTML(html);
  await settle(el, SETTLE);
  return el;
}

/** Tear down everything mounted here. Call from `afterEach`. */
export function cleanupDocs(): void {
  while (mounted.length) mounted.pop()!.remove();
  document.body.innerHTML = '';
}

// ── Reading the rendered editor ─────────────────────────────────────────────

export function shadowOf(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error('snice-doc has no shadow root');
  return root;
}

/** EXACT part lookup (`[part~=…]]` over-matches hyphen prefixes in happy-dom;
 *  see ../part-exact.ts). */
export function part<T extends Element = HTMLElement>(el: HTMLElement, name: string): T | null {
  return [...shadowOf(el).querySelectorAll('[part]')]
    .find(node => (node.getAttribute('part') ?? '').split(/\s+/).includes(name)) as T | null
    ?? null;
}

export function toolbarOf(el: HTMLElement): HTMLElement | null {
  return part<HTMLElement>(el, 'toolbar');
}

export function editorOf(el: HTMLElement): HTMLElement | null {
  return part<HTMLElement>(el, 'editor');
}

export interface ToolbarButton {
  title: string;
  text: string;
  iconParts: number;
  svg: boolean;
}

/** The rendered toolbar buttons, in toolbar order, with their icon facts. */
export function toolbarButtons(el: HTMLElement): ToolbarButton[] {
  return [...toolbarOf(el)?.querySelectorAll<HTMLButtonElement>('.toolbar-btn') ?? []]
    .map(button => ({
      title: button.title,
      text: (button.textContent ?? '').trim(),
      iconParts: button.querySelectorAll('[part~="icon"]').length,
      svg: !!button.querySelector('svg'),
    }));
}

/**
 * The DOCUMENTED shadow shape for a combo — the "expected" side of the oracle.
 */
export function expectedShape(combo: DocCombo): Shape {
  return {
    hasBase: true,
    hasToolbar: true,
    hasEditor: true,
    toolbarInBase: true,
    editorInBase: true,
    toolbarBeforeEditor: true,
    buttonCount: TOOLS.length,
    buttonTitles: TOOLS.map(tool => tool.title),
    dividerCount: 4,
    iconPartCount: expectedIconPartCount(combo.icons),
    // "contentEditable for native text editing" — editable exactly while the
    // editor is not readonly. Read as the IDL PROPERTY: happy-dom does not
    // reflect contentEditable to an attribute, and the property is the
    // cross-engine observable anyway.
    editorEditable: combo.readonly ? 'false' : 'true',
    // The placeholder rides the editor's data-placeholder attribute.
    placeholderAttr: combo.placeholder,
    // A fresh editor mounts EMPTY so the documented placeholder can paint
    // through `.doc-editor:empty::before` (VISUAL-MATRIX-doc-1); only
    // clear() re-seeds the paragraph.
    initialHTML: '',
  };
}

export function readShape(el: HTMLElement): Shape {
  const base = part(el, 'base');
  const toolbar = toolbarOf(el);
  const editor = editorOf(el);
  const buttons = toolbarButtons(el);
  const iconParts = [...shadowOf(el).querySelectorAll('[part~="icon"]')].length;

  return {
    hasBase: !!base,
    hasToolbar: !!toolbar,
    hasEditor: !!editor,
    toolbarInBase: !!base && !!toolbar && base.contains(toolbar),
    editorInBase: !!base && !!editor && base.contains(editor),
    toolbarBeforeEditor: !!toolbar && !!editor
      && !!(toolbar.compareDocumentPosition(editor) & Node.DOCUMENT_POSITION_FOLLOWING),
    buttonCount: buttons.length,
    buttonTitles: buttons.map(button => button.title),
    dividerCount: toolbar?.querySelectorAll('.toolbar-divider').length ?? 0,
    iconPartCount: iconParts,
    editorEditable: editor ? String((editor as any).contentEditable) : null,
    placeholderAttr: editor?.getAttribute('data-placeholder') ?? null,
    initialHTML: editor?.innerHTML ?? null,
  };
}

/**
 * The DOCUMENTED axis state: property truth plus the attribute the stylesheet
 * and the DOM channel key on. properties.md: authored attributes always
 * exist; property assignments reflect unless equal to the documented default;
 * defaults never reflect.
 */
export function expectedAxes(combo: DocCombo): Shape {
  const reflected = (value: unknown, fallback: unknown) =>
    combo.channel === 'attr' || value !== fallback;
  return {
    'prop.icons': combo.icons,
    'prop.readonly': combo.readonly,
    'prop.placeholder': combo.placeholder,
    'attr.icons': reflected(combo.icons, DEFAULTS.icons) ? combo.icons : undefined,
    'attr.readonly': reflected(combo.readonly, false) ? true : undefined,
    'attr.placeholder': reflected(combo.placeholder, DEFAULTS.placeholder)
      ? combo.placeholder
      : undefined,
  };
}

export function readAxes(el: HTMLElement, combo: DocCombo): Shape {
  const any = el as any;
  const reflected = (value: unknown, fallback: unknown) =>
    combo.channel === 'attr' || value !== fallback;
  return {
    'prop.icons': any.icons,
    'prop.readonly': any.readonly,
    'prop.placeholder': any.placeholder,
    'attr.icons': reflected(combo.icons, DEFAULTS.icons) ? el.getAttribute('icons') : undefined,
    'attr.readonly': reflected(combo.readonly, false) ? el.hasAttribute('readonly') : undefined,
    'attr.placeholder': reflected(combo.placeholder, DEFAULTS.placeholder)
      ? el.getAttribute('placeholder')
      : undefined,
  };
}

/**
 * The icon oracle per set. Under `default`, the letter-glyph tools are the
 * documented "Text labels" and carry no icon part; the five pictographic
 * tools carry the `icon` part with a registry SVG (the repo-established
 * contract). Under the webfont sets, every button carries exactly one `icon`
 * part element and no bare-text glyph.
 */
export function expectedToolbarIcons(combo: DocCombo): Shape {
  return {
    perButton: TOOLS.map(tool => ({
      title: tool.title,
      iconParts: combo.icons === 'default' ? (tool.alwaysIcon ? 1 : 0) : 1,
      svg: combo.icons === 'default' ? !!tool.alwaysIcon : false,
    })),
  };
}

export function readToolbarIcons(el: HTMLElement): Shape {
  return {
    perButton: toolbarButtons(el).map(button => ({
      title: button.title,
      iconParts: button.iconParts,
      svg: button.svg,
    })),
  };
}
