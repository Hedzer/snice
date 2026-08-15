/**
 * Matrix slice TOOLTIP / ATTRIBUTE API — the documented wrapper-free tooltips.
 *
 * Dimensions: trigger (3 documented: hover / click / focus) x lifecycle stage
 * (already in the DOM at start-up, added later, attribute changed, element
 * removed) = 12 combos, plus the CSS-variable configuration surface.
 *
 * Documented contract under test (docs/ai/components/tooltip.md
 * "Attribute-Based Tooltips"):
 *   · "Observer for `tooltip` attribute on any element. No wrapper element --
 *     safe inside strict-children components (tabs, accordion, etc.).
 *     Auto-activates when the tooltip component is loaded."
 *   · The CSS Variable API: `--tooltip-position` (top), `--tooltip-trigger`
 *     (hover), `--tooltip-delay`/`--tooltip-hide-delay` (0), `--tooltip-arrow`
 *     (`none` to hide), `--tooltip-max-width` (250), `--tooltip-z-index`
 *     (10000), `--tooltip-strict-positioning` (false).
 *
 * ── What this tier CAN judge ────────────────────────────────────────────────
 *
 * The configuration is read through `getComputedStyle().getPropertyValue()`.
 * happy-dom resolves custom properties from INLINE styles, which is the channel
 * the docs' own scoped example ultimately cascades into; a stylesheet-authored
 * `.toolbar [tooltip] { --tooltip-position: bottom }` needs a real cascade and
 * belongs to tests/live/matrix/tooltip. Everything else — attachment,
 * detachment, trigger routing, portal content — is the observer's own logic.
 *
 * it.fails policy: every assertion here is the documented expectation and no
 * finding is pinned in this file.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { readPortal, isShowing, wait } from './tooltip-support';
// Importing the component installs the observer as a documented side effect
// ("Auto-activates when the tooltip component is loaded").
import '../../../packages/components/src/tooltip/snice-tooltip';

const TIP = 'Save changes';

function makeTarget(attrs: Record<string, string> = {}): HTMLElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Save';
  button.setAttribute('tooltip', TIP);
  for (const [name, value] of Object.entries(attrs)) button.setAttribute(name, value);
  return button;
}

/** Give the MutationObserver a turn — it is the observer's only entry point. */
async function observed(): Promise<void> {
  await wait(40);
}

/**
 * Tear the fixture down one node at a time.
 *
 * `document.body.innerHTML = ''` cannot be used here: removing a `[tooltip]`
 * element runs the observer's detach, which removes that element's PORTAL from
 * the same body — mutating the child list the innerHTML setter is iterating.
 * A snapshot loop removes each node exactly once and tolerates the portals the
 * observer has already taken away.
 */
function cleanupDom(): void {
  for (const node of [...document.body.childNodes]) {
    try { node.parentNode?.removeChild(node); } catch { /* already detached */ }
  }
  for (const portal of [...document.body.querySelectorAll('.snice-tooltip')]) {
    try { portal.remove(); } catch { /* already detached */ }
  }
}

describe('tooltip matrix: attribute API attaches without a wrapper', () => {
  afterEach(cleanupDom);

  it('an element added later gets a tooltip', async () => {
    const target = makeTarget();
    document.body.appendChild(target);
    await observed();

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);

    const portal = readPortal();
    expect(portal.exists, 'no wrapper element was needed').toBe(true);
    expect(portal.text).toBe(TIP);
    expect(portal.role).toBe('tooltip');
  });

  it('a nested element inside an added subtree gets a tooltip', async () => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<span><button type="button" tooltip="Nested tip">Deep</button></span>';
    document.body.appendChild(wrapper);
    await observed();

    const target = wrapper.querySelector('button')!;
    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);

    expect(readPortal().text, 'the observer walks the added subtree').toBe('Nested tip');
  });

  it('the host element is never wrapped or moved', async () => {
    const target = makeTarget();
    document.body.appendChild(target);
    await observed();

    expect(target.parentElement, 'docs: "No wrapper element"').toBe(document.body);
    expect(target.children, 'and nothing is injected inside it').toHaveLength(0);
  });

  it('changing the tooltip attribute changes what is shown', async () => {
    const target = makeTarget();
    document.body.appendChild(target);
    await observed();

    target.setAttribute('tooltip', 'Rewritten');
    await observed();

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);
    expect(readPortal().text).toBe('Rewritten');
  });

  it('removing the tooltip attribute detaches the tooltip', async () => {
    const target = makeTarget();
    document.body.appendChild(target);
    await observed();

    target.removeAttribute('tooltip');
    await observed();

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);
    expect(isShowing(), 'an element with no tooltip attribute shows nothing').toBe(false);
  });

  it('removing the element takes its portal with it', async () => {
    const target = makeTarget();
    document.body.appendChild(target);
    await observed();

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);
    expect(readPortal().exists).toBe(true);

    target.remove();
    await observed();
    expect(document.body.querySelector('.snice-tooltip'),
      'teardown must not leave a floating popup behind').toBe(null);
  });

  it('an empty tooltip attribute shows nothing', async () => {
    const target = makeTarget();
    target.setAttribute('tooltip', '');
    document.body.appendChild(target);
    await observed();

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);
    expect(isShowing()).toBe(false);
  });
});

describe('tooltip matrix: attribute API trigger routing', () => {
  afterEach(cleanupDom);

  const OPENS = {
    hover: (el: HTMLElement) => el.dispatchEvent(new MouseEvent('mouseenter')),
    focus: (el: HTMLElement) => el.dispatchEvent(new FocusEvent('focusin', { bubbles: true })),
    click: (el: HTMLElement) => el.dispatchEvent(new MouseEvent('click', { bubbles: true })),
  } as const;

  for (const trigger of ['hover', 'focus', 'click'] as const) {
    it(`--tooltip-trigger: ${trigger} opens on its own interaction`, async () => {
      const target = makeTarget({ style: `--tooltip-trigger: ${trigger}` });
      document.body.appendChild(target);
      await observed();

      OPENS[trigger](target);
      await wait(30);
      expect(isShowing(), `docs: --tooltip-trigger (${trigger})`).toBe(true);
    });

    it(`--tooltip-trigger: ${trigger} ignores the interactions it does not own`, async () => {
      const target = makeTarget({ style: `--tooltip-trigger: ${trigger}` });
      document.body.appendChild(target);
      await observed();

      for (const [name, act] of Object.entries(OPENS)) {
        // The documented `hover` mode also answers focus, so that a keyboard
        // user reaches the same tooltip a pointer user does; `click` and
        // `focus` own exactly one interaction each.
        const owned = name === trigger || (trigger === 'hover' && name === 'focus');
        if (owned) continue;
        act(target);
        await wait(30);
        expect(isShowing(), `--tooltip-trigger: ${trigger} must ignore ${name}`).toBe(false);
      }
    });
  }

  it('the default trigger is hover', async () => {
    const target = makeTarget();
    document.body.appendChild(target);
    await observed();

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);
    expect(isShowing(), 'docs: --tooltip-trigger (`hover`) is the default').toBe(true);

    target.dispatchEvent(new MouseEvent('mouseleave'));
    await wait(30);
    expect(isShowing()).toBe(false);
  });

  it('a click-triggered tooltip closes on a click outside', async () => {
    const target = makeTarget({ style: '--tooltip-trigger: click' });
    document.body.appendChild(target);
    await observed();

    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wait(30);
    expect(isShowing()).toBe(true);

    const elsewhere = document.createElement('div');
    document.body.appendChild(elsewhere);
    elsewhere.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wait(30);
    expect(isShowing()).toBe(false);
  });
});

describe('tooltip matrix: attribute API CSS-variable configuration', () => {
  afterEach(cleanupDom);

  it('--tooltip-max-width and --tooltip-z-index reach the popup', async () => {
    const target = makeTarget({ style: '--tooltip-max-width: 180; --tooltip-z-index: 55' });
    document.body.appendChild(target);
    await observed();

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);

    const portal = readPortal();
    expect(portal.maxWidth).toBe('180px');
    expect(portal.zIndex).toBe('55');
  });

  it('--tooltip-arrow: none removes the arrow', async () => {
    const target = makeTarget({ style: '--tooltip-arrow: none' });
    document.body.appendChild(target);
    await observed();

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);

    expect(readPortal().hasArrow, 'docs: `none` to hide the arrow').toBe(false);
  });

  it('the arrow is drawn by default', async () => {
    const target = makeTarget();
    document.body.appendChild(target);
    await observed();

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);

    expect(readPortal().hasArrow).toBe(true);
  });

  it('--tooltip-delay postpones the show', async () => {
    const target = makeTarget({ style: '--tooltip-delay: 60' });
    document.body.appendChild(target);
    await observed();

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(20);
    expect(isShowing(), 'nothing before the delay').toBe(false);

    await wait(90);
    expect(isShowing(), 'and something after it').toBe(true);
  });

  it('--tooltip-hide-delay postpones the hide', async () => {
    const target = makeTarget({ style: '--tooltip-hide-delay: 60' });
    document.body.appendChild(target);
    await observed();

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);
    expect(isShowing()).toBe(true);

    target.dispatchEvent(new MouseEvent('mouseleave'));
    await wait(20);
    expect(isShowing(), 'the popup lingers').toBe(true);

    await wait(90);
    expect(isShowing()).toBe(false);
  });

  it('--tooltip-strict-positioning: true keeps the requested position', async () => {
    const target = makeTarget({
      style: '--tooltip-position: bottom-end; --tooltip-strict-positioning: true',
    });
    document.body.appendChild(target);
    await observed();

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(30);

    expect(readPortal().positionClass,
      'docs: `true` disables auto-flip').toBe('snice-tooltip--bottom-end');
  });
});
