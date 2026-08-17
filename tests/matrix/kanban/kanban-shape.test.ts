/**
 * MATRIX slice — snice-kanban board rendering.
 *
 * Dimensions: board family (7) x showCardCount (2) x allowDragDrop (2)
 *             x channel (2) = 56 combos.
 *
 * The families cross every documented KanbanColumn/KanbanCard field against
 * both style switches and both authoring channels; each combo is judged by the
 * full shape oracle (parts, per-column header/count/cards, per-card attributes
 * and content) plus the reflection oracle.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, afterEach } from 'vitest';
import { product, comboId, expectShape, removeComponent } from '../matrix-utils';
import {
  BOARD_FAMILIES, mountKanban, setBoard, board,
  expectedShape, readShape, expectedAxes, readAxes, type KanbanCombo,
} from './kanban-support';
import '../../../packages/components/src/kanban/snice-kanban';

const COMBOS: KanbanCombo[] = product({
  family: Object.keys(BOARD_FAMILIES),
  showCardCount: [true, false],
  allowDragDrop: [true, false],
  channel: ['attr', 'prop'] as const,
});

describe('kanban matrix: board shape', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const combo of COMBOS) {
    const id = comboId({ ...combo });

    it(`${id}: renders the documented board shape`, async () => {
      el = await mountKanban(combo);
      const data = board(combo.family);
      await setBoard(el, data);
      expectShape(readShape(el), expectedShape(combo, data), id);
    });

    it(`${id}: both switches reach the properties and their attributes`, async () => {
      el = await mountKanban(combo);
      await setBoard(el, board(combo.family));
      expectShape(readAxes(el), expectedAxes(combo), id);
    });
  }
});
