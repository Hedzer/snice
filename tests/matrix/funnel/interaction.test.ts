/**
 * snice-funnel matrix — the interaction cross.
 *
 * Documented surface: `funnel-click` and `funnel-hover`, both carrying
 * `{ stage, index }`, plus "Enter/Space activates the focused stage".
 *
 * The cross is {vertical, horizontal} x {every stage index} x {the g element,
 * the painted path inside it} for clicks, because the component resolves the
 * index by walking up from `event.target` — a listener that only reads
 * `target.dataset.index` works when the user happens to hit the group and
 * silently does nothing when they hit the shape that fills it, which is where
 * a real cursor lands ~100% of the time.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makeFunnel, stageEls, shapeOf, partEl, wait, SETTLE, CANONICAL,
  type FunnelStage, type SniceFunnelElement,
} from './matrix-utils';

const ORIENTATIONS = ['vertical', 'horizontal'] as const;

function capture(el: SniceFunnelElement, type: string) {
  const seen: Array<{ stage: FunnelStage; index: number }> = [];
  el.addEventListener(type, (e: any) => seen.push(e.detail));
  return seen;
}

const mouse = (type: string) => new MouseEvent(type, { bubbles: true, composed: true });

describe('snice-funnel matrix: interaction', () => {
  let el: SniceFunnelElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  // ── Clicks: every stage, both hit targets, both orientations ─────────────

  for (const orientation of ORIENTATIONS) {
    for (const target of ['group', 'shape'] as const) {
      it(`emits funnel-click for every stage: ${orientation}/${target}`, async () => {
        el = await makeFunnel({ data: CANONICAL, orientation });
        const seen = capture(el, 'funnel-click');

        stageEls(el).forEach((stage) => {
          const node = target === 'group' ? stage : shapeOf(stage)!;
          node.dispatchEvent(mouse('click'));
        });

        expect(seen.map(d => d.index)).toEqual(CANONICAL.map((_, i) => i));
        expect(seen.map(d => d.stage.label)).toEqual(CANONICAL.map(s => s.label));
      });
    }
  }

  it('emits no funnel-click for a click outside any stage', async () => {
    el = await makeFunnel({ data: CANONICAL });
    const seen = capture(el, 'funnel-click');
    partEl(el, 'base')!.dispatchEvent(mouse('click'));
    expect(seen).toEqual([]);
  });

  // ── Keyboard: the documented Enter/Space activation ──────────────────────

  for (const orientation of ORIENTATIONS) {
    for (const key of ['Enter', ' '] as const) {
      it(`activates the focused stage on "${key === ' ' ? 'Space' : key}": ${orientation}`, async () => {
        el = await makeFunnel({ data: CANONICAL, orientation });
        const seen = capture(el, 'funnel-click');

        const stage = stageEls(el)[2];
        const event = new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true });
        stage.dispatchEvent(event);

        expect(seen).toHaveLength(1);
        expect(seen[0].index).toBe(2);
        expect(seen[0].stage.label).toBe(CANONICAL[2].label);
        // Space must not also scroll the page.
        expect(event.defaultPrevented).toBe(true);
      });
    }
  }

  it('ignores keys other than Enter/Space', async () => {
    el = await makeFunnel({ data: CANONICAL });
    const seen = capture(el, 'funnel-click');
    for (const key of ['a', 'Escape', 'ArrowDown', 'Tab']) {
      stageEls(el)[0].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
    }
    expect(seen).toEqual([]);
  });

  // ── Hover: event payload plus the documented tooltip part ────────────────

  for (const orientation of ORIENTATIONS) {
    it(`emits funnel-hover and fills the tooltip: ${orientation}`, async () => {
      el = await makeFunnel({ data: CANONICAL, orientation });
      const seen = capture(el, 'funnel-hover');
      const tooltip = partEl(el, 'tooltip')!;

      stageEls(el)[1].dispatchEvent(mouse('mousemove'));

      expect(seen).toHaveLength(1);
      expect(seen[0].index).toBe(1);
      expect(seen[0].stage.label).toBe(CANONICAL[1].label);

      expect(tooltip.querySelector('.funnel__tooltip-label')!.textContent).toBe(CANONICAL[1].label);
      // The tooltip's value line quotes this stage's share of the first stage.
      expect(tooltip.querySelector('.funnel__tooltip-value')!.textContent).toContain('50%');
      expect(tooltip.style.display).not.toBe('none');
    });
  }

  it('hides the tooltip once the pointer leaves the chart', async () => {
    el = await makeFunnel({ data: CANONICAL });
    const tooltip = partEl(el, 'tooltip')!;
    stageEls(el)[1].dispatchEvent(mouse('mousemove'));
    expect(tooltip.style.display).not.toBe('none');

    partEl(el, 'base')!.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
    expect(tooltip.style.display).toBe('none');
  });

  it('hides the tooltip when the pointer moves off a stage but stays in the chart', async () => {
    el = await makeFunnel({ data: CANONICAL });
    const tooltip = partEl(el, 'tooltip')!;
    stageEls(el)[1].dispatchEvent(mouse('mousemove'));
    expect(tooltip.style.display).not.toBe('none');

    partEl(el, 'chart')!.dispatchEvent(mouse('mousemove'));
    expect(tooltip.style.display).toBe('none');
  });

  it('addresses the NEW stage list after the data is replaced', async () => {
    el = await makeFunnel({ data: CANONICAL });
    const replacement: FunnelStage[] = [
      { label: 'One', value: 10 },
      { label: 'Two', value: 5 },
    ];
    el.data = replacement;
    await wait(SETTLE);

    const seen = capture(el, 'funnel-click');
    stageEls(el).forEach(stage => stage.dispatchEvent(mouse('click')));
    expect(seen.map(d => d.stage.label)).toEqual(['One', 'Two']);
  });
});
