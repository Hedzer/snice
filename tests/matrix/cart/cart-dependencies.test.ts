/**
 * Matrix slice CART / DOCUMENTED IMPORT — the cart as the docs tell a consumer
 * to load it, and nothing else.
 *
 * `docs/ai/components/cart.md` gives exactly one import line:
 *
 *     import 'snice/components/cart/snice-cart';
 *     cart.items = [ … ];
 *
 * Every interactive affordance the cart documents — the remove button, the
 * quantity controls, the coupon field, the checkout button — is rendered by the
 * cart as ANOTHER Snice component (`snice-button`, `snice-step-input`,
 * `snice-input`). If those are not registered by that one import, they never
 * upgrade, and a shopper's click lands on an inert unknown element: no
 * `item-remove`, no `quantity-change`, no `coupon-apply`, no `checkout`.
 *
 * This file therefore imports the cart module ALONE — no sibling components —
 * and asserts the documented interactions still work. `cart-behavior.test.ts`
 * imports the children explicitly and measures everything else; the two files
 * are separate because they are different claims.
 *
 * Dimensions: the four child components the cart renders x the interactions
 * they carry. 6 cases.
 *
 * FINDINGS
 *   MATRIX-cart-1  `snice-cart.ts` renders `<snice-button>`,
 *                  `<snice-step-input>`, `<snice-input>` and `<snice-divider>`
 *                  but imports none of them, so the documented single-import
 *                  usage leaves every control inert: the checkout, remove,
 *                  quantity and coupon paths emit nothing at all. (Its peers do
 *                  import what they render — `snice-table.ts` imports
 *                  `snice-button`, `snice-activity-feed.ts` imports
 *                  `snice-activity-item`.) Pinned below with `it.fails`; the
 *                  assertions are the documented ones and are NOT weakened.
 */
import { describe, it, afterEach } from 'vitest';
import { cleanup, part, parts, one, click, record, settle, Problems, expectClean } from './matrix-utils';
import { basket, mountCart } from './cart-support';

/** The child components the cart's own template renders. */
const CHILDREN = ['snice-button', 'snice-step-input', 'snice-input', 'snice-divider'] as const;

/** Click the inner control of a rendered child, the way a pointer does. */
function pressChild(host: Element | null | undefined, selector = 'button'): boolean {
  const inner = host?.shadowRoot?.querySelector(selector);
  if (!inner) return false;
  click(inner);
  return true;
}

describe('cart matrix: the documented import', () => {
  afterEach(() => cleanup());

  for (const tag of CHILDREN) {
    it.fails(`importing the cart alone registers <${tag}> [MATRIX-cart-1]`, async () => {
      const p = new Problems();
      p.ok(customElements.get(tag) !== undefined,
        `the cart renders <${tag}> but importing snice-cart does not define it`);
      expectClean(p, `child=${tag}`);
    });
  }

  it.fails('the checkout button reports checkout when clicked [MATRIX-cart-1]', async () => {
    const el = await mountCart({ items: basket(), taxRate: 8.5 });
    const p = new Problems();

    const seen = record(el, ['checkout']);
    p.ok(pressChild(one(el, '[part~="checkout"] snice-button')),
      'the checkout button never upgraded, so it has no control to press');
    await settle();
    seen.stop();

    p.eq('checkout events', seen.events.length, 1);
    expectClean(p, 'checkout-click');
  });

  it.fails('the remove button removes its line when clicked [MATRIX-cart-1]', async () => {
    const items = basket();
    const el = await mountCart({ items });
    const p = new Problems();

    const remove = parts(el, 'item')[0].querySelector(`[aria-label="Remove ${items[0].name}"]`);
    const seen = record(el, ['item-remove']);
    p.ok(pressChild(remove),
      'the remove button never upgraded, so it has no control to press');
    await settle();
    seen.stop();

    p.eq('item-remove events', seen.events.length, 1);
    p.eq('remaining lines', parts(el, 'item').length, items.length - 1);
    expectClean(p, 'remove-click');
  });

  // The structural half of the same import is fine, and stays a passing test so
  // a regression there cannot hide behind the pinned failures above.
  it('the cart itself renders its documented parts from that one import', async () => {
    const el = await mountCart({ items: basket(), taxRate: 8.5, discount: 10 });
    const p = new Problems();
    for (const name of ['base', 'header', 'items', 'item', 'coupon', 'summary', 'checkout']) {
      p.ok(part(el, name) !== null, `no part="${name}"`);
    }
    expectClean(p, 'structure');
  });
});
