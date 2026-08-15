// snice-binpack matrix — the packing cross.
//
// Dimensions (docs/ai/components/binpack.md):
//   itemSet    UNIFORM | MIXED | WIDE          (3)
//   gap        0px | 10px                       (2)   "spacing between items"
//   grid       none | col | col+row             (3)   "grid snap width/height (0 = no grid)"
//   horizontal false | true                     (2)   "pack horizontally instead of vertically"
//
// 3 x 2 x 3 x 2 = 36 combos, each judged by the same three oracles:
// no overlap (it is a bin PACKING), inside the constrained axis, and on the
// declared grid. Plus an 18-combo origin slice that asserts the documented
// mirror relationships against the un-mirrored run of the very same combo.
import { describe, it, expect, afterEach } from 'vitest';
import {
  makeBinpack, placements, byName, expectNoOverlap, expectWithinBounds, expectOnGrid,
  ITEM_SETS, DEFAULT_CONTAINER_WIDTH, DEFAULT_CONTAINER_HEIGHT, wait,
  type ItemSpec,
} from './binpack-matrix-utils';

let host: HTMLElement | null = null;
afterEach(() => { host?.remove(); host = null; });

const SETS = ['UNIFORM', 'MIXED', 'WIDE'] as const;
const GAPS = [
  { id: 'gap0', attr: '0px', px: 0 },
  { id: 'gap10', attr: '10px', px: 10 },
] as const;
const GRIDS = [
  { id: 'none', columnWidth: 0, rowHeight: 0 },
  { id: 'col', columnWidth: 100, rowHeight: 0 },
  { id: 'colrow', columnWidth: 100, rowHeight: 50 },
] as const;
const AXES = [
  { id: 'vertical', horizontal: false },
  { id: 'horizontal', horizontal: true },
] as const;

describe('binpack matrix / packing cross', () => {
  for (const setName of SETS) {
    for (const gap of GAPS) {
      for (const grid of GRIDS) {
        for (const axis of AXES) {
          const id = `${setName}/${gap.id}/${grid.id}/${axis.id}`;
          it(id, async () => {
            const specs = ITEM_SETS[setName];
            const built = await makeBinpack({
              items: specs,
              attrs: {
                gap: gap.attr,
                'column-width': String(grid.columnWidth),
                'row-height': String(grid.rowHeight),
                ...(axis.horizontal ? { horizontal: '' } : {}),
              },
            });
            host = built.host;

            const placed = placements(built.host, specs);

            // Every item is placed: a packer that silently drops an item is the
            // failure mode absolute positioning makes invisible.
            expect(placed.map(p => p.name)).toEqual(specs.map(s => s.name));

            expectNoOverlap(placed);
            expectWithinBounds(placed, {
              horizontal: axis.horizontal,
              width: built.width,
              height: built.height,
            });
            expectOnGrid(placed, {
              columnWidth: grid.columnWidth,
              rowHeight: grid.rowHeight,
              gap: gap.px,
            });
          });
        }
      }
    }
  }
});

// ── Origin mirroring ────────────────────────────────────────────────────────
//
// "originLeft: false = right-to-left" / "originTop: false = bottom-to-top".
// The oracle is RELATIONAL: run the identical combo with default origins,
// then flip, and require the exact mirror the docs describe. That cannot be
// satisfied by an implementation that merely "moves things around", and it
// never re-derives the packer's own placement arithmetic.

const ORIGINS = [
  { id: 'right', originLeft: false, originTop: true },
  { id: 'bottom', originLeft: true, originTop: false },
  { id: 'right+bottom', originLeft: false, originTop: false },
] as const;

describe('binpack matrix / origin mirroring', () => {
  for (const setName of SETS) {
    for (const axis of AXES) {
      for (const origin of ORIGINS) {
        it(`${setName}/${axis.id}/${origin.id}`, async () => {
          const specs = ITEM_SETS[setName] as ItemSpec[];
          const common = {
            items: specs,
            attrs: {
              gap: '10px',
              ...(axis.horizontal ? { horizontal: '' } : {}),
            },
          };

          const base = await makeBinpack(common);
          const baseline = byName(placements(base.host, specs));
          base.host.remove();

          const flipped = await makeBinpack(common);
          host = flipped.host;
          flipped.host.originLeft = origin.originLeft;
          flipped.host.originTop = origin.originTop;
          flipped.host.layout();
          await wait(0);

          const actual = byName(placements(flipped.host, specs));
          const problems: string[] = [];

          for (const spec of specs) {
            const before = baseline[spec.name];
            const after = actual[spec.name];
            const expectedX = origin.originLeft
              ? before.x
              : DEFAULT_CONTAINER_WIDTH - before.x - spec.width;
            const expectedY = origin.originTop
              ? before.y
              : DEFAULT_CONTAINER_HEIGHT - before.y - spec.height;
            if (after.x !== expectedX || after.y !== expectedY) {
              problems.push(
                `${spec.name}: (${after.x},${after.y}) != mirrored (${expectedX},${expectedY})`,
              );
            }
          }

          expect(problems).toEqual([]);
        });
      }
    }
  }
});
