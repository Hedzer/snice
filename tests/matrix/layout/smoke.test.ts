/**
 * Smoke slice of the snice-layout matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/layout) is excluded from the default
 * Vitest include and runs via `npm run test:matrix`. This file samples one
 * combo per feature family:
 *   · regions   — the stacked shell projects brand/page/footer and exposes its
 *                 documented parts;
 *   · shells    — an app shell and a two-pane shell keep their region sets;
 *   · options   — `card` columns/gap and `split` direction/ratio round-trip;
 *   · sidebar   — `collapsed` reflects, `collapse-mode="none"` drops the toggle;
 *   · chord     — Ctrl+B toggles the sidebar;
 *   · router    — `update()` leaves the shell's regions intact.
 *
 * Every assertion routes through the matrix oracle (`checkShell`).
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  checkShell, expectNoProblems, makeShell, one, press, shell, wait,
} from './layout-support';

describe('layout matrix smoke', () => {
  afterEach(() => unmountAll());

  it('regions: the stacked shell projects every documented region', async () => {
    const spec = shell('snice-layout');
    const el = await makeShell(spec);
    expectNoProblems(checkShell(el, spec), 'snice-layout');
  });

  it('shells: the sidebar and split shells keep their region sets', async () => {
    for (const tag of ['snice-layout-sidebar', 'snice-layout-split']) {
      const spec = shell(tag);
      const el = await makeShell(spec);
      expectNoProblems(checkShell(el, spec), tag);
    }
  });

  it('options: card columns/gap and split direction/ratio round-trip', async () => {
    const card = await makeShell(shell('snice-layout-card'), { columns: '4', gap: 'lg' });
    expect([(card as any).columns, (card as any).gap]).toEqual(['4', 'lg']);

    const split = await makeShell(shell('snice-layout-split'), { direction: 'vertical', ratio: '70-30' });
    expect([(split as any).direction, (split as any).ratio]).toEqual(['vertical', '70-30']);
  });

  it('sidebar: collapsed reflects and collapse-mode="none" drops the toggle', async () => {
    const collapsed = await makeShell(shell('snice-layout-sidebar'), { collapsed: true });
    expect(collapsed.hasAttribute('collapsed')).toBe(true);

    const pinned = await makeShell(shell('snice-layout-sidebar'), { 'collapse-mode': 'none' });
    expect(one(pinned, '.sidebar-toggle')).toBeNull();
  });

  it('chord: Ctrl+B toggles the sidebar', async () => {
    const el = await makeShell(shell('snice-layout-sidebar'));
    press(document, 'b', { ctrlKey: true });
    await wait(30);
    expect((el as any).collapsed).toBe(true);
  });

  it('router: update() leaves the shell regions intact', async () => {
    const spec = shell('snice-layout-sidebar');
    const el = await makeShell(spec);
    (el as any).update({} as any, [{ name: 'Home', path: '/' }] as any, '/', {});
    await wait(30);
    expectNoProblems(checkShell(el, spec), 'after update()');
  });
});
