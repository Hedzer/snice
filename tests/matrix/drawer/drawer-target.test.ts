/**
 * snice-drawer matrix — `<snice-drawer-target>` and `push-content`.
 *
 * Documented contract:
 *   `<snice-drawer-target for="<drawer id>">` wraps the content that should
 *   slide when the drawer opens, and carries `push: string` — "auto-set
 *   amount". The drawer opts in with `push-content`.
 *
 * The amount itself is a MEASUREMENT (the panel's width, or its height for a
 * top/bottom drawer), so its numeric value belongs to the visual tier where
 * layout exists. What the DOM tier owns is the state machine around it:
 *
 *   · a target with no `for`, or a `for` naming nothing, stays at rest;
 *   · a target bound to a drawer WITHOUT `push-content` stays at rest however
 *     the drawer is driven;
 *   · a bound target with `push-content` acquires a push when the drawer opens
 *     and releases it when it closes — the doc's "Content slides when drawer
 *     opens";
 *   · re-pointing `for` at a different drawer re-binds, which is the part a
 *     MutationObserver-based implementation gets wrong.
 *
 * The cross is `for`-binding (bound / unbound / dangling) x `push-content`
 * (on / off) x drawer state (open / closed), plus each documented `position`
 * so a top/bottom drawer is proven to push along its own axis.
 */
import { describe, it, afterEach } from 'vitest';
import { POSITIONS, SETTLE, expect, teardown, wait } from './drawer-support';
import '../../../packages/components/src/drawer/snice-drawer';
import '../../../packages/components/src/drawer/snice-drawer-target';

interface Pair { drawer: any; target: any }

/**
 * Author the doc's own Push Content example, children in place before either
 * element connects — the target resolves `for` during `@ready`, so a target
 * that connected first would bind to nothing.
 */
async function makePair(options: {
  pushContent?: boolean;
  position?: string;
  bind?: 'bound' | 'unbound' | 'dangling';
  open?: boolean;
} = {}): Promise<Pair> {
  const { pushContent = true, position = 'left', bind = 'bound', open = false } = options;
  const host = document.createElement('div');
  const forAttr = bind === 'bound' ? 'nav' : bind === 'dangling' ? 'missing' : '';
  host.innerHTML = `
    <snice-drawer id="nav" position="${position}" size="small" contained
      ${pushContent ? 'push-content' : ''} ${open ? 'open' : ''}>
      <span slot="title">Nav</span><a href="/">Home</a>
    </snice-drawer>
    <snice-drawer-target ${forAttr ? `for="${forAttr}"` : ''}>
      <main>Content</main>
    </snice-drawer-target>`;
  document.body.appendChild(host);

  const drawer = host.querySelector('snice-drawer') as any;
  const target = host.querySelector('snice-drawer-target') as any;
  await drawer.ready;
  await target.ready;
  await wait(SETTLE);
  return { drawer, target };
}

describe('snice-drawer matrix — push target', () => {
  afterEach(teardown);

  // ── binding x push-content x drawer state ────────────────────────────────
  for (const bind of ['bound', 'unbound', 'dangling'] as const) {
    for (const pushContent of [false, true]) {
      it(`push state: for=${bind} push-content=${pushContent}`, async () => {
        const { drawer, target } = await makePair({ bind, pushContent });
        expect(target.push, 'a closed drawer never pushes').toBe('');

        drawer.show();
        await wait(SETTLE);

        // Only a bound target on a push-content drawer is documented to move.
        const shouldPush = bind === 'bound' && pushContent;
        expect(target.push !== '', `push after open (for=${bind})`).toBe(shouldPush);

        drawer.hide();
        await wait(SETTLE);
        expect(target.push, 'closing releases the push').toBe('');
      });
    }
  }

  // ── each documented position pushes ──────────────────────────────────────
  for (const position of POSITIONS) {
    it(`a ${position} drawer pushes its target`, async () => {
      const { drawer, target } = await makePair({ position });
      drawer.show();
      await wait(SETTLE);
      expect(target.push, `push-content + ${position}`).not.toBe('');
      // The amount is a px length whatever the axis; the magnitude is a
      // measurement and belongs to the visual tier.
      expect(target.push, 'push is a px length').toMatch(/^-?\d+(\.\d+)?px$/);
    });
  }

  it('the push is applied as a transform on the target itself', async () => {
    const { drawer, target } = await makePair();
    drawer.show();
    await wait(SETTLE);
    expect(target.getAttribute('style') ?? '', 'transform written').toContain('translateX');

    drawer.hide();
    await wait(SETTLE);
    expect(target.getAttribute('style') ?? '', 'transform cleared').not.toContain('translateX(');
  });

  it('a drawer opened from markup pushes its target immediately', async () => {
    const { target } = await makePair({ open: true });
    expect(target.push, 'the initial state is synced at bind time').not.toBe('');
  });

  it('re-pointing for at another drawer re-binds the target', async () => {
    const host = document.createElement('div');
    host.innerHTML = `
      <snice-drawer id="a" position="left" size="small" contained push-content></snice-drawer>
      <snice-drawer id="b" position="right" size="small" contained push-content></snice-drawer>
      <snice-drawer-target for="a"><main>C</main></snice-drawer-target>`;
    document.body.appendChild(host);
    const a = host.querySelector('#a') as any;
    const b = host.querySelector('#b') as any;
    const target = host.querySelector('snice-drawer-target') as any;
    await a.ready; await b.ready; await target.ready;
    await wait(SETTLE);

    target.for = 'b';
    await wait(SETTLE);

    a.show();
    await wait(SETTLE);
    expect(target.push, 'the old drawer no longer drives the target').toBe('');

    b.show();
    await wait(SETTLE);
    expect(target.push, 'the new drawer does').not.toBe('');
  });

  it('the target renders a bare default slot and nothing else', async () => {
    const { target } = await makePair();
    const slots = target.shadowRoot.querySelectorAll('slot');
    expect(slots.length, 'exactly one slot').toBe(1);
    expect(slots[0].getAttribute('name'), 'and it is the default one').toBe(null);
    expect(target.querySelector('main')?.textContent, 'content is projected, not replaced')
      .toBe('Content');
  });

  it('for defaults to the empty string, as the type says', async () => {
    const target = document.createElement('snice-drawer-target') as any;
    document.body.appendChild(target);
    await target.ready;
    expect(target.for).toBe('');
    expect(target.push).toBe('');
  });
});
