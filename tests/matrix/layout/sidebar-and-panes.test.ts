/**
 * snice-layout matrix — sidebar behaviour and the master-detail panes.
 *
 * Documented ("Sidebar shells"):
 *   · "`collapsed` — boolean, reflected → `[collapsed]` is styleable";
 *   · "`collapse-mode` — `rail` (default, icon column) | `offcanvas` (hidden) |
 *     `none` (pinned, no toggle)";
 *   · "`Ctrl`/`Cmd`+`B` toggles";
 *   · "below 768px it overlays behind a scrim that closes on click/Escape";
 *   · "No slotted content → placard-driven nav."
 *
 * Documented (master-detail): "<641px single pane, back emits `detail-closed`".
 *
 * 22 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  checkShell, click, expectNoProblems, makeShell, one, press, record, shell, wait,
} from './layout-support';

const SIDEBAR = shell('snice-layout-sidebar');
const DASHBOARD = shell('snice-layout-dashboard');
const MASTER_DETAIL = shell('snice-layout-master-detail');

function toggleButton(el: HTMLElement): HTMLElement | null {
  return one<HTMLElement>(el, '.sidebar-toggle');
}

describe('layout matrix — collapsed is reflected', () => {
  afterEach(() => unmountAll());

  for (const spec of [SIDEBAR, DASHBOARD]) {
    for (const collapsed of [false, true]) {
      it(`${spec.tag} collapsed=${collapsed} is styleable as [collapsed]`, async () => {
        const el = await makeShell(spec, collapsed ? { collapsed: true } : {});
        expect((el as any).collapsed).toBe(collapsed);
        expect(el.hasAttribute('collapsed'), '[collapsed] attribute — the documented style hook')
          .toBe(collapsed);
        expectNoProblems(checkShell(el, spec), `${spec.tag} collapsed=${collapsed}`);
      });
    }

    it(`${spec.tag}: a later collapse reflects too`, async () => {
      const el = await makeShell(spec);
      (el as any).collapsed = true;
      await wait(30);
      expect(el.hasAttribute('collapsed')).toBe(true);
      (el as any).collapsed = false;
      await wait(30);
      expect(el.hasAttribute('collapsed')).toBe(false);
    });
  }
});

describe('layout matrix — collapse-mode', () => {
  afterEach(() => unmountAll());

  for (const mode of ['rail', 'offcanvas', 'none'] as const) {
    it(`collapse-mode="${mode}" ${mode === 'none' ? 'drops' : 'keeps'} the toggle`, async () => {
      const el = await makeShell(SIDEBAR, { 'collapse-mode': mode });
      expect((el as any).collapseMode).toBe(mode);
      expect(!!toggleButton(el), `toggle ${mode === 'none' ? 'rendered' : 'missing'} for "${mode}"`)
        .toBe(mode !== 'none');
      expectNoProblems(checkShell(el, SIDEBAR), `collapse-mode=${mode}`);
    });

    it(`collapse-mode="${mode}": the toggle ${mode === 'none' ? 'cannot' : 'can'} collapse`, async () => {
      const el = await makeShell(SIDEBAR, { 'collapse-mode': mode });
      (el as any).handleSidebarToggle();
      await wait(30);
      expect((el as any).collapsed, `"${mode}" collapsed=${(el as any).collapsed}`)
        .toBe(mode !== 'none');
    });

    it(`collapse-mode="${mode}": Ctrl+B ${mode === 'none' ? 'is inert' : 'toggles'}`, async () => {
      const el = await makeShell(SIDEBAR, { 'collapse-mode': mode });
      press(document, 'b', { ctrlKey: true });
      await wait(30);
      expect((el as any).collapsed).toBe(mode !== 'none');

      press(document, 'b', { ctrlKey: true });
      await wait(30);
      expect((el as any).collapsed).toBe(false);
    });
  }

  it('Cmd+B toggles as well as Ctrl+B', async () => {
    const el = await makeShell(SIDEBAR);
    press(document, 'B', { metaKey: true });
    await wait(30);
    expect((el as any).collapsed).toBe(true);
  });

  it('a plain "b" keypress does nothing', async () => {
    const el = await makeShell(SIDEBAR);
    press(document, 'b');
    await wait(30);
    expect((el as any).collapsed).toBe(false);
  });

  it('the shortcut is released when the shell leaves the document', async () => {
    const el = await makeShell(SIDEBAR);
    el.remove();
    await wait(30);
    press(document, 'b', { ctrlKey: true });
    await wait(30);
    expect((el as any).collapsed, 'a detached shell still answered the chord').toBe(false);
  });
});

describe('layout matrix — the mobile scrim', () => {
  afterEach(() => unmountAll());

  it('the scrim is rendered as a part on every sidebar shell', async () => {
    for (const spec of [SIDEBAR, DASHBOARD]) {
      const el = await makeShell(spec);
      expect(one(el, '[part~="scrim"]'), `${spec.tag} has no scrim`).toBeTruthy();
    }
  });

  it('a click on the scrim closes the mobile sidebar', async () => {
    const el = await makeShell(SIDEBAR);
    (el as any).mobileOpen = true;
    await wait(30);
    click(one(el, '[part~="scrim"]'));
    await wait(30);
    expect((el as any).mobileOpen).toBe(false);
  });

  it('Escape closes the mobile sidebar', async () => {
    const el = await makeShell(SIDEBAR);
    (el as any).mobileOpen = true;
    await wait(30);
    press(el, 'Escape');
    await wait(30);
    expect((el as any).mobileOpen).toBe(false);
  });

  it('Escape with nothing open changes nothing', async () => {
    const el = await makeShell(SIDEBAR);
    press(el, 'Escape');
    await wait(30);
    expect((el as any).mobileOpen).toBe(false);
    expect((el as any).collapsed).toBe(false);
  });
});

describe('layout matrix — sidebar navigation fallback', () => {
  afterEach(() => unmountAll());

  it('no slotted sidebar content falls back to placard-driven nav', async () => {
    const el = await makeShell(SIDEBAR, {}, '<div slot="page" id="region-page">page region</div>');
    await wait(30);
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="sidebar"]')!;
    expect(slot.assignedElements({ flatten: true }), 'sidebar had slotted content').toHaveLength(0);
    expect(slot.querySelector('snice-nav'), 'no placard-driven nav in the empty sidebar')
      .toBeTruthy();
  });

  it('slotted sidebar content wins over the nav fallback', async () => {
    const el = await makeShell(SIDEBAR);
    const slot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="sidebar"]')!;
    expect((slot.assignedElements({ flatten: true }) as HTMLElement[]).map(node => node.id))
      .toEqual(['region-sidebar']);
  });
});

describe('layout matrix — master-detail panes', () => {
  afterEach(() => unmountAll());

  for (const selected of [false, true]) {
    it(`selected=${selected} keeps both panes present`, async () => {
      const el = await makeShell(MASTER_DETAIL, selected ? { selected: true } : {});
      expect((el as any).selected).toBe(selected);
      expectNoProblems(checkShell(el, MASTER_DETAIL), `selected=${selected}`);
      expect(one(el, '[part~="list"]')).toBeTruthy();
      expect(one(el, '[part~="detail"]')).toBeTruthy();
    });
  }

  it('the back control reports detail-closed and clears the selection', async () => {
    const el = await makeShell(MASTER_DETAIL, { selected: true });
    const events = record(el, ['detail-closed']);
    // The back control only exists in the narrow single-pane view; the
    // documented outcome of taking it is what is asserted here.
    (el as any).handleBack();
    await wait(30);
    expect((el as any).selected).toBe(false);
    expect(events.map(event => event.type)).toEqual(['detail-closed']);
  });

  it('the empty region is the detail pane\'s fallback', async () => {
    const el = await makeShell(MASTER_DETAIL, {},
      '<div slot="empty" id="region-empty">nothing selected</div>');
    await wait(30);
    const detail = el.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="detail"]')!;
    expect(detail.assignedElements({ flatten: true }), 'detail had content').toHaveLength(0);
    expect(one(el, '[part~="empty"]'), 'no empty state to fall back on').toBeTruthy();
  });
});
