/**
 * snice-timeline matrix — the LAYOUT cross.
 *
 * `orientation` x `position` x `reverse` x the four documented item shapes:
 * 2 x 3 x 2 x 4 = 48 combos. These are the four properties the component
 * exposes, so this is the full product of its host-level surface, and each
 * combo is judged by the shared oracle rather than by a bespoke assertion.
 *
 * Mounted through the ATTRIBUTE channel (`<snice-timeline position="alternate"
 * reverse>` is the documented form) with `items` on the property channel,
 * because `items` is declared `attribute: false`.
 */
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-kit';
import {
  ORIENTATIONS, POSITIONS, SHAPE_NAMES, checkTimeline, itemsOf, mountTimeline,
  type Orientation, type Position, type ShapeName,
} from './timeline-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

interface LayoutCombo {
  id: string;
  orientation: Orientation;
  position: Position;
  reverse: boolean;
  shape: ShapeName;
}

const COMBOS: LayoutCombo[] = (() => {
  const out: LayoutCombo[] = [];
  for (const orientation of ORIENTATIONS) {
    for (const position of POSITIONS) {
      for (const reverse of [false, true]) {
        for (const shape of SHAPE_NAMES) {
          out.push({
            id: `orientation=${orientation}/position=${position}`
              + `/${reverse ? 'reverse' : 'forward'}/shape=${shape}`,
            orientation, position, reverse, shape,
          });
        }
      }
    }
  }
  return out;
})();

describe('timeline matrix: orientation x position x reverse x item shape', () => {
  for (const combo of COMBOS) {
    it(combo.id, async () => {
      const options = {
        orientation: combo.orientation,
        position: combo.position,
        reverse: combo.reverse,
        items: itemsOf(combo.shape),
      };
      el = await mountTimeline(options);
      expectClean(checkTimeline(el, options), combo.id);
    });
  }
});
