/**
 * snice-link matrix oracle.
 *
 * Every expectation cites the line of `docs/ai/components/link.md` it encodes.
 * The link's contract is dominated by ONE rule — "URL Safety" — so the oracle's
 * centre is a TABLE of authored values with the verdict the docs give each
 * category, rather than a call into the same `isSafeUrl()` the component uses.
 * Deriving the expectation from the implementation's own helper would make the
 * matrix agree with the component by construction, which is exactly what
 * .ai/fuzzing.md forbids.
 */
import { part, shadow, type Shape } from '../matrix-utils';
import '../../../packages/components/src/link/snice-link';

export const VARIANTS = ['default', 'primary', 'secondary', 'muted'] as const;
export const TARGETS = ['_self', '_blank', '_parent', '_top'] as const;

export interface UrlCase {
  id: string;
  href: string;
  /** The docs' verdict for this CATEGORY, quoted in `why`. */
  accepted: boolean;
  why: string;
}

/**
 * DOCUMENTED ("URL Safety"):
 *   "Accepts relative/root/hash/query references, HTTP(S) network paths,
 *    `http:`, `https:`, `mailto:`, and `tel:`.
 *    Rejects script/data/file/FTP/custom schemes, malformed URLs, raw ASCII
 *    controls, whitespace-only values, and non-string runtime values.
 *    Trims accepted values. Exact `''` retains the legacy `#` fallback."
 */
export const URL_CASES: UrlCase[] = [
  { id: 'relative', href: 'about', accepted: true, why: 'relative reference' },
  { id: 'root', href: '/about', accepted: true, why: 'root reference' },
  { id: 'hash-ref', href: '#section', accepted: true, why: 'hash reference' },
  { id: 'query', href: '?page=2', accepted: true, why: 'query reference' },
  { id: 'network-path', href: '//example.com/docs', accepted: true, why: 'HTTP(S) network path' },
  { id: 'https', href: 'https://example.com/docs', accepted: true, why: 'https: scheme' },
  { id: 'http', href: 'http://example.com/docs', accepted: true, why: 'http: scheme' },
  { id: 'mailto', href: 'mailto:team@example.com', accepted: true, why: 'mailto: scheme' },
  { id: 'tel', href: 'tel:+15550100', accepted: true, why: 'tel: scheme' },
  { id: 'padded', href: '  /about  ', accepted: true, why: 'accepted values are trimmed' },
  { id: 'javascript', href: 'javascript:globalThis.__sniceLinkInjected++', accepted: false, why: 'script scheme' },
  { id: 'data', href: 'data:text/html,<b>x</b>', accepted: false, why: 'data: scheme' },
  { id: 'file', href: 'file:///etc/passwd', accepted: false, why: 'file: scheme' },
  { id: 'ftp', href: 'ftp://example.com/x', accepted: false, why: 'FTP scheme' },
  { id: 'custom', href: 'weirdapp://open', accepted: false, why: 'custom scheme' },
  { id: 'control', href: 'javascript:alert(1)', accepted: false, why: 'raw ASCII control' },
  { id: 'whitespace', href: '   ', accepted: false, why: 'whitespace-only value' },
];

/** The exact-empty case, documented separately: "Exact `''` retains the legacy `#` fallback." */
export const EMPTY_CASE: UrlCase = {
  id: 'empty', href: '', accepted: true, why: 'exact empty string keeps the legacy # fallback',
};

/**
 * DOCUMENTED href resolution:
 *   · exact `''` → `#`;
 *   · rejected → NO internal href at all ("Rejected values remove the internal
 *     anchor's `href`");
 *   · `hash` "validates first, then prefixes `#`" — and an already-hash value
 *     is not prefixed twice;
 *   · accepted values are trimmed.
 */
export function expectedHref(useCase: UrlCase, hash: boolean): string | null {
  if (useCase.href === '') return '#';
  if (!useCase.accepted) return null;
  const trimmed = useCase.href.trim();
  return hash && !trimmed.startsWith('#') ? `#${trimmed}` : trimmed;
}

export interface LinkCombo {
  variant?: typeof VARIANTS[number];
  target?: typeof TARGETS[number];
  external?: boolean;
  underline?: boolean;
  disabled?: boolean;
  hash?: boolean;
  /** A listener that calls `preventDefault()` on the cancelable navigate event. */
  cancelNavigate?: boolean;
}

/**
 * DOCUMENTED anchor contract:
 *   · "`link` - Anchor element" — the part is an `<a>`;
 *   · "`external` sets `target="_blank"` and `rel="noopener noreferrer"`" and
 *     adds the arrow icon ("`external-icon` - External arrow icon");
 *   · otherwise the authored `target` is used and there is no `rel`;
 *   · a rejected value has no href ("no link semantics or executable/copyable
 *     destination").
 */
export function expectedAnchor(useCase: UrlCase, combo: LinkCombo): Shape {
  const href = expectedHref(useCase, Boolean(combo.hash));
  return {
    tag: 'a',
    href,
    target: combo.external ? '_blank' : (combo.target ?? '_self'),
    rel: combo.external ? 'noopener noreferrer' : '',
    hasExternalIcon: Boolean(combo.external),
  };
}

export function readAnchor(el: HTMLElement): Shape {
  const anchor = part<HTMLAnchorElement>(el, 'link');
  return {
    tag: anchor?.tagName.toLowerCase() ?? 'none',
    href: anchor?.hasAttribute('href') ? anchor.getAttribute('href') : null,
    target: anchor?.getAttribute('target') ?? '',
    rel: anchor?.getAttribute('rel') ?? '',
    hasExternalIcon: !!part(el, 'external-icon'),
  };
}

/**
 * The style hooks. The docs name no class names — they name PARTS — so the DOM
 * tier asserts the two facts the stylesheet needs to be able to paint the
 * documented appearances: a variant hook and the two state hooks, each present
 * exactly when authored. The paint itself belongs to the visual tier.
 */
export function readHooks(el: HTMLElement): Shape {
  const anchor = part(el, 'link');
  const classes = (anchor?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
  return {
    variantHooks: classes.filter(c => VARIANTS.some(v => c === `link--${v}`)).sort(),
    underline: classes.includes('link--underline'),
    disabled: classes.includes('link--disabled'),
  };
}

export function expectedHooks(combo: LinkCombo): Shape {
  return {
    variantHooks: [`link--${combo.variant ?? 'default'}`],
    underline: Boolean(combo.underline),
    disabled: Boolean(combo.disabled),
  };
}

/** The anchor a click has to land on. */
export function anchor(el: HTMLElement): HTMLAnchorElement {
  return shadow(el).querySelector('a')!;
}

export interface ClickOutcome {
  defaultPrevented: boolean;
  navigate: Array<{ href: string }>;
}

/** Click the rendered anchor and report what the documented channels did. */
export function clickLink(el: HTMLElement, options: { cancelNavigate?: boolean } = {}): ClickOutcome {
  const navigate: Array<{ href: string }> = [];
  const listener = (event: any) => {
    navigate.push(event.detail);
    if (options.cancelNavigate) event.preventDefault();
  };
  el.addEventListener('navigate', listener);
  const event = new MouseEvent('click', { bubbles: true, composed: true, cancelable: true });
  anchor(el).dispatchEvent(event);
  el.removeEventListener('navigate', listener);
  return { defaultPrevented: event.defaultPrevented, navigate };
}

/**
 * DOCUMENTED click contract:
 *   · "`click` → native MouseEvent (default prevented when disabled or `href`
 *     is rejected)";
 *   · "`navigate` → `{ href }` (accepted hash links only, cancelable)";
 *   · a rejected value "prevent[s] click default, emit[s] no `navigate` event".
 */
export function expectedClick(useCase: UrlCase, combo: LinkCombo): Shape {
  const rejected = expectedHref(useCase, Boolean(combo.hash)) === null;
  const emitsNavigate = Boolean(combo.hash) && !rejected && !combo.disabled;
  return {
    defaultPrevented: rejected || Boolean(combo.disabled) || Boolean(combo.cancelNavigate),
    navigateCount: emitsNavigate ? 1 : 0,
    navigateHref: emitsNavigate ? useCase.href : null,
  };
}

export function readClick(outcome: ClickOutcome): Shape {
  return {
    defaultPrevented: outcome.defaultPrevented,
    navigateCount: outcome.navigate.length,
    navigateHref: outcome.navigate[0]?.href ?? null,
  };
}
