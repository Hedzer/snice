/**
 * Matrix slice GANTT / ZOOM — the documented `zoom` property and the toggle
 * buttons that drive it.
 *
 * Dimensions:
 *   · authored zoom (3) x dataset (6)                        = 18 mount combos
 *   · from-zoom (3) x to-zoom (3) x dataset (2)              = 18 click combos
 *   · property reassignment, from-zoom (3) x to-zoom (3)     =  9 combos
 *   Total 45.
 *
 * Documented contract (docs/ai/components/gantt.md):
 *   · `zoom: GanttZoom = 'week'`, values 'day' | 'week' | 'month';
 *   · the attribute form `<snice-gantt zoom="week">` is the documented syntax;
 *   · "Zoom toggle buttons in header (Day/Week/Month)" — clicking one selects
 *     that level, and a toggle reflects which level is current;
 *   · zoom is a VIEW control: it changes the timeline scale, never the task
 *     data. The doc gives `tasks` no zoom-dependent field, so `tasks` must come
 *     back from any zoom change byte-for-byte identical.
 *
 * The doc fixes neither the pixels per day nor the header label formatting at
 * any level, so this slice asserts neither. What it can assert is that the
 * three levels really are three different renders — a `zoom` that quietly did
 * nothing would otherwise pass every other slice in this directory.
 *
 * it.fails policy: nothing pinned; all 45 combos pass.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  ZOOMS, combo, comboId, tasksOf, makeGantt,
  structureProblems, readFacts, ZOOM_BUTTON_LABEL, zoomButtonFor, clickNode,
  expectClean, removeComponent, wait, SETTLE,
} from './gantt-support';
import type { DatasetName } from './gantt-support';
import type { GanttZoom } from '../../../packages/components/src/gantt/snice-gantt.types';

const MOUNT_DATASETS: DatasetName[] = ['empty', 'single', 'basic', 'grouped', 'chained', 'spans'];
const CLICK_DATASETS: DatasetName[] = ['basic', 'grouped'];

/** A render signature that is stable under re-render but differs per scale. */
function timelineSignature(el: HTMLElement): { cells: number; header: string } {
  const cells = [...el.shadowRoot!.querySelectorAll('.gantt-timeline-cell')] as HTMLElement[];
  return {
    cells: cells.length,
    header: cells.map(cell => (cell.textContent ?? '').trim()).join('|'),
  };
}

describe('gantt matrix: zoom', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  describe('authored zoom', () => {
    for (const zoom of ZOOMS) {
      for (const dataset of MOUNT_DATASETS) {
        const c = combo({ dataset, zoom });

        it(`${comboId(c)}: the zoom attribute selects its own level`, async () => {
          const tasks = tasksOf(c);
          el = await makeGantt(c, tasks);

          expect(el.zoom).toBe(zoom);
          expect(readFacts(el).pressedZoom).toBe(ZOOM_BUTTON_LABEL[zoom]);
          expectClean(structureProblems(el, c, tasks), comboId(c));
        });
      }
    }
  });

  describe('toggle buttons', () => {
    for (const from of ZOOMS) {
      for (const to of ZOOMS) {
        for (const dataset of CLICK_DATASETS) {
          const c = combo({ dataset, zoom: from });

          it(`${comboId(c)} -> click ${ZOOM_BUTTON_LABEL[to]}: selects ${to}`, async () => {
            const tasks = tasksOf(c);
            el = await makeGantt(c, tasks);
            const before = JSON.stringify(el.tasks);

            expect(clickNode(zoomButtonFor(el, to))).toBe(true);
            await wait(SETTLE);

            expect(el.zoom).toBe(to);
            expect(readFacts(el).pressedZoom).toBe(ZOOM_BUTTON_LABEL[to]);
            // A view control never edits the data it is viewing.
            expect(JSON.stringify(el.tasks)).toBe(before);
            expectClean(structureProblems(el, combo({ dataset, zoom: to }), tasks), comboId(c));
          });
        }
      }
    }
  });

  describe('property reassignment', () => {
    for (const from of ZOOMS) {
      for (const to of ZOOMS) {
        const c = combo({ dataset: 'basic', zoom: from });

        it(`${comboId(c)} -> zoom = "${to}": re-scales the timeline`, async () => {
          const tasks = tasksOf(c);
          el = await makeGantt(c, tasks);
          const before = timelineSignature(el);

          el.zoom = to as GanttZoom;
          await wait(SETTLE);
          const after = timelineSignature(el);

          expect(el.zoom).toBe(to);
          if (from === to) {
            expect(after).toEqual(before);
          } else {
            // Three documented levels must be three distinguishable renders.
            expect(after).not.toEqual(before);
          }
          expectClean(structureProblems(el, combo({ dataset: 'basic', zoom: to }), tasks), comboId(c));
        });
      }
    }
  });
});
