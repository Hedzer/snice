/**
 * Smoke slice of the snice-permission-matrix matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/permission-matrix) is excluded from
 * the default Vitest include and runs via `npm run test:matrix`. This file
 * samples one combo per feature family:
 *   · grid      — roles x permissions render as the documented grid;
 *   · state     — every checkbox tracks `hasPermission`;
 *   · toggle    — a tick reports `permission-toggle` + `matrix-change`;
 *   · readonly  — check/dash indicators instead of checkboxes;
 *   · api       — `getMatrix()` deep copy and `setMatrix()` replacement.
 *
 * Every assertion routes through the matrix oracle (`checkGrid`).
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  PERM_SETS,
  checkGrid, checkboxes, combo, expectNoProblems, makeMatrix, matrixOf,
  record, toggle, wait,
} from './permission-matrix-support';

describe('permission-matrix matrix smoke', () => {
  afterEach(() => unmountAll());

  it('grid: three roles by four permissions render as documented', async () => {
    const c = combo({ fill: 'partial', descriptions: true });
    const el = await makeMatrix(c);
    expectNoProblems(checkGrid(el, c), '3x4/partial/described');
  });

  it('state: every checkbox tracks hasPermission', async () => {
    const c = combo({ fill: 'full' });
    const el = await makeMatrix(c);
    expectNoProblems(checkGrid(el, c), '3x4/full');
    expect(checkboxes(el).every(box => box.checked)).toBe(true);
  });

  it('toggle: a tick reports permission-toggle and matrix-change', async () => {
    const c = combo({ fill: 'empty' });
    const el = await makeMatrix(c);
    const events = record(el);
    toggle(el, 'viewer', 'read', true);
    await wait(20);
    expect(events.map(event => event.type).sort())
      .toEqual(['matrix-change', 'permission-toggle']);
    expect(events.find(event => event.type === 'permission-toggle')!.detail)
      .toEqual({ roleId: 'viewer', permissionId: 'read', granted: true });
    expect((el as any).hasPermission('viewer', 'read')).toBe(true);
  });

  it('readonly: check/dash indicators instead of checkboxes', async () => {
    const c = combo({ fill: 'partial', readonly: true });
    const el = await makeMatrix(c);
    expectNoProblems(checkGrid(el, c), '3x4/partial/readonly');
    expect(checkboxes(el)).toHaveLength(0);
  });

  it('api: getMatrix() is a deep copy and setMatrix() replaces', async () => {
    const c = combo({ fill: 'full' });
    const el = await makeMatrix(c);
    (el as any).getMatrix().admin.push('sudo');
    expect((el as any).getMatrix()).toEqual(matrixOf(c));
    (el as any).setMatrix({ viewer: ['read'] });
    await wait(20);
    expect((el as any).getMatrix()).toEqual({ viewer: ['read'] });
    expect(PERM_SETS.four.every(perm =>
      perm.id === 'read' || !(el as any).hasPermission('viewer', perm.id))).toBe(true);
  });
});
