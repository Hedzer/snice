/**
 * snice-heatmap matrix — the CLICK and the TOOLTIP.
 *
 *   doc: `cell-click → { date: string; value: number }` — "fired when a cell is
 *        clicked";
 *   doc: `showTooltip: boolean = true` (attr `show-tooltip`);
 *   doc, parts: `tooltip` — "Hover tooltip element";
 *   doc, Accessibility: "Tooltip on hover with date and value".
 *
 * Both of those are contracts about a specific cell — the one the pointer is
 * on — so the slice crosses the interaction against the three data shapes and
 * both tooltip states and checks the identity of the cell each time.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  DEFAULTS, Problems, captureClicks, cells, clickCell, expectClean, expectedDates,
  expectedLabel, hoverCell, makeHeatmap, removeComponent, text, tooltip, unhoverCell,
  valueFor, type DataShape, type Heatmap, type HeatmapVector,
} from './heatmap-support';

let el: Heatmap | null = null;
afterEach(() => { if (el) { removeComponent(el as HTMLElement); el = null; } });

const SHAPES: DataShape[] = ['none', 'sparse', 'ramp'];

describe('snice-heatmap matrix: cell-click', () => {
  for (const data of SHAPES) {
    for (const showTooltip of [true, false]) {
      const vector: HeatmapVector = { ...DEFAULTS, weeks: 2, data, showTooltip };
      it(`${data}/${showTooltip ? 'tooltip' : 'no-tooltip'}`, async () => {
        el = await makeHeatmap(vector);
        const seen = captureClicks(el);
        const dates = expectedDates(cells(el).length);

        // Click the last three cells — the ones every data shape gives a value
        // to — so the detail is checked against three different values.
        const problems = new Problems();
        const targets = [cells(el).length - 1, cells(el).length - 3, 0];
        for (const index of targets) clickCell(el, index);

        problems.equal(seen.length, targets.length, 'cell-click announcements');
        seen.forEach((detail, order) => {
          const date = dates[targets[order]];
          problems.equal(detail.date, date, `click ${order} detail.date`);
          problems.equal(detail.value, valueFor(data, date), `click ${order} detail.value`);
        });
        expectClean(problems, `${data}/${showTooltip}`);
      });
    }
  }

  it('cell-click crosses the shadow boundary', async () => {
    // The event is documented on the component, so a page listening on the
    // element — not on the shadow node — must receive it.
    el = await makeHeatmap({ weeks: 2, data: 'sparse' });
    const seen: any[] = [];
    document.addEventListener('cell-click', (event: Event) => seen.push((event as CustomEvent).detail));
    clickCell(el, 0);
    document.removeEventListener('cell-click', () => {});
    expect(seen.length).toBeGreaterThan(0);
  });
});

describe('snice-heatmap matrix: tooltip', () => {
  it('a hover raises the documented tooltip part with the date and value', async () => {
    // doc, part `tooltip`: "Hover tooltip element"; Accessibility: "Tooltip on
    // hover with date and value".
    const vector: HeatmapVector = { ...DEFAULTS, weeks: 2, data: 'ramp' };
    el = await makeHeatmap(vector);
    expect(tooltip(el), 'a tooltip was showing before anything was hovered').toBeNull();

    const index = cells(el).length - 1;
    const date = expectedDates(cells(el).length)[index];
    await hoverCell(el, index);

    const raised = tooltip(el);
    expect(raised, 'hovering a cell raised no tooltip').not.toBeNull();
    expect(text(raised)).toBe(expectedLabel(date, valueFor('ramp', date)));
  });

  it('leaving the cell takes the tooltip away again', async () => {
    el = await makeHeatmap({ weeks: 2, data: 'ramp' });
    const index = cells(el).length - 1;
    await hoverCell(el, index);
    expect(tooltip(el)).not.toBeNull();
    await unhoverCell(el, index);
    expect(tooltip(el), 'the tooltip outlived the pointer').toBeNull();
  });

  it('the tooltip follows the pointer from cell to cell', async () => {
    // One tooltip, re-aimed — not one per cell.
    const vector: HeatmapVector = { ...DEFAULTS, weeks: 2, data: 'ramp' };
    el = await makeHeatmap(vector);
    const dates = expectedDates(cells(el).length);

    const problems = new Problems();
    for (const index of [cells(el).length - 1, cells(el).length - 3, cells(el).length - 5]) {
      await hoverCell(el, index);
      const date = dates[index];
      problems.equal(text(tooltip(el)), expectedLabel(date, valueFor('ramp', date)),
        `the tooltip over cell ${index}`);
      problems.equal(el.shadowRoot.querySelectorAll('[part~="tooltip"]').length, 1,
        'more than one tooltip is showing at once');
    }
    expectClean(problems, 'tooltip/follow');
  });

  it('show-tooltip="false" raises nothing at all', async () => {
    // `showTooltip: boolean = true` — the switch exists to turn the hover
    // surface off, and off must mean no element, not a hidden one.
    el = await makeHeatmap({ weeks: 2, data: 'ramp', showTooltip: false });
    await hoverCell(el, cells(el).length - 1);
    expect(tooltip(el), 'show-tooltip="false" still raised a tooltip').toBeNull();
  });

  it('a day with no data still gets a tooltip', async () => {
    // Every cell is a day, and the doc puts no condition on the hover surface;
    // an empty day reads "0 contributions on …" like any other.
    el = await makeHeatmap({ weeks: 2 });
    const dates = expectedDates(cells(el).length);
    await hoverCell(el, 2);
    expect(text(tooltip(el))).toBe(expectedLabel(dates[2], 0));
  });

  it('clicking while the tooltip is up still announces the cell', async () => {
    // The two interactions are independent; hovering must not swallow the click.
    el = await makeHeatmap({ weeks: 2, data: 'sparse' });
    const seen = captureClicks(el);
    const index = cells(el).length - 1;
    await hoverCell(el, index);
    clickCell(el, index);
    expect(seen).toEqual([{ date: expectedDates(cells(el).length)[index], value: 5 }]);
  });
});
