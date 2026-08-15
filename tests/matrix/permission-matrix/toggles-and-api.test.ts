/**
 * snice-permission-matrix matrix — toggling, events and the public API.
 *
 * Documented surface exercised here:
 *   · `permission-toggle` → `{ roleId, permissionId, granted }` on a toggle;
 *   · `matrix-change` → `{ matrix }` when the matrix is updated;
 *   · `getMatrix()` returning a DEEP COPY, `setMatrix()` REPLACING the matrix,
 *     `hasPermission(roleId, permId)`;
 *   · `readonly` withdrawing the checkbox affordance entirely.
 *
 * 26 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  PERM_SETS, ROLE_SETS,
  checkGrid, checkboxes, combo, comboName, expectNoProblems, granted,
  makeMatrix, matrixOf, record, toggle, wait,
  type Fill,
} from './permission-matrix-support';

describe('permission-matrix matrix — toggling', () => {
  afterEach(() => unmountAll());

  for (const permKey of ['one', 'four'] as const) {
    for (const fill of ['empty', 'partial', 'full'] as Fill[]) {
      for (const grant of [true, false]) {
        const c = combo({ roles: ROLE_SETS.three, permissions: PERM_SETS[permKey], fill });
        const role = 'editor';
        const perm = PERM_SETS[permKey].at(-1)!.id;

        it(`${comboName(c)} — ${grant ? 'grant' : 'revoke'} ${role}/${perm}`, async () => {
          const el = await makeMatrix(c);
          const events = record(el);
          const before = granted(matrixOf(c), role, perm);

          toggle(el, role, perm, grant);
          await wait(20);

          if (before === grant) {
            // Re-asserting the state it already had is still a toggle event:
            // the documented detail reports the state the checkbox now carries.
            expect((el as any).hasPermission(role, perm)).toBe(grant);
          }

          const toggles = events.filter(event => event.type === 'permission-toggle');
          expect(toggles, 'no permission-toggle emitted').toHaveLength(1);
          expect(toggles[0].detail).toEqual({ roleId: role, permissionId: perm, granted: grant });

          const changes = events.filter(event => event.type === 'matrix-change');
          expect(changes, 'no matrix-change emitted').toHaveLength(1);
          expect(changes[0].detail.matrix).toEqual((el as any).getMatrix());

          // The documented model, updated: only this pair moved.
          expect((el as any).hasPermission(role, perm)).toBe(grant);
          for (const otherRole of ROLE_SETS.three) {
            for (const otherPerm of PERM_SETS[permKey]) {
              if (otherRole.id === role && otherPerm.id === perm) continue;
              expect(
                (el as any).hasPermission(otherRole.id, otherPerm.id),
                `${otherRole.id}/${otherPerm.id} changed as a side effect`,
              ).toBe(granted(matrixOf(c), otherRole.id, otherPerm.id));
            }
          }

          // …and the grid repainted to match the new model.
          const after = combo({
            roles: ROLE_SETS.three, permissions: PERM_SETS[permKey], fill,
          });
          const expectedMatrix = (el as any).getMatrix();
          expectNoProblems(
            checkGrid(el, { ...after, fill }).filter(problem => !problem.includes('checked=')),
            `${comboName(c)} structure after toggle`,
          );
          for (const otherRole of ROLE_SETS.three) {
            for (const otherPerm of PERM_SETS[permKey]) {
              const box = el.shadowRoot!.querySelector<HTMLInputElement>(
                `input[data-role="${otherRole.id}"][data-perm="${otherPerm.id}"]`,
              )!;
              expect(
                box.checked,
                `${otherRole.id}/${otherPerm.id} checkbox out of step with the matrix`,
              ).toBe((expectedMatrix[otherRole.id] ?? []).includes(otherPerm.id));
            }
          }
        });
      }
    }
  }

  it('grants for a role absent from the matrix create that role', async () => {
    const c = combo({ fill: 'empty' });
    const el = await makeMatrix(c);
    toggle(el, 'viewer', 'read', true);
    await wait(20);
    expect((el as any).getMatrix().viewer).toEqual(['read']);
  });

  it('revoking the last permission leaves the role with none', async () => {
    const c = combo({ fill: 'full' });
    const el = await makeMatrix(c);
    for (const perm of PERM_SETS.four) toggle(el, 'admin', perm.id, false);
    await wait(20);
    expect((el as any).getMatrix().admin ?? []).toEqual([]);
    expect((el as any).hasPermission('admin', 'read')).toBe(false);
  });

  it('readonly offers no checkbox to toggle at all', async () => {
    const el = await makeMatrix(combo({ fill: 'partial', readonly: true }));
    expect(checkboxes(el)).toHaveLength(0);
  });
});

describe('permission-matrix matrix — public API', () => {
  afterEach(() => unmountAll());

  it('getMatrix() returns a deep copy', async () => {
    const c = combo({ fill: 'full' });
    const el = await makeMatrix(c);
    const taken = (el as any).getMatrix();
    taken.admin.push('sudo');
    taken.editor = ['nothing'];
    expect((el as any).hasPermission('admin', 'sudo')).toBe(false);
    expect((el as any).getMatrix()).toEqual(matrixOf(c));
  });

  it('setMatrix() replaces the entire matrix', async () => {
    const el = await makeMatrix(combo({ fill: 'full' }));
    (el as any).setMatrix({ viewer: ['read'] });
    await wait(20);
    expect((el as any).getMatrix()).toEqual({ viewer: ['read'] });
    expect((el as any).hasPermission('admin', 'read')).toBe(false);
    expect((el as any).hasPermission('viewer', 'read')).toBe(true);
  });

  it('setMatrix() repaints every checkbox', async () => {
    const el = await makeMatrix(combo({ fill: 'empty' }));
    (el as any).setMatrix({ admin: ['create', 'read'] });
    await wait(20);
    const c = combo({ fill: 'empty' });
    expectNoProblems(
      checkGrid(el, c).filter(problem => !problem.includes('checked=') && !problem.includes('aria-label')),
      'structure after setMatrix',
    );
    for (const perm of PERM_SETS.four) {
      const box = el.shadowRoot!.querySelector<HTMLInputElement>(
        `input[data-role="admin"][data-perm="${perm.id}"]`,
      )!;
      expect(box.checked, `admin/${perm.id}`).toBe(['create', 'read'].includes(perm.id));
    }
  });

  it('hasPermission() answers false for unknown roles and permissions', async () => {
    const el = await makeMatrix(combo({ fill: 'full' }));
    expect((el as any).hasPermission('nobody', 'read')).toBe(false);
    expect((el as any).hasPermission('admin', 'nothing')).toBe(false);
  });

  it('setMatrix() accepts entries for roles that are not displayed', async () => {
    const el = await makeMatrix(combo({ fill: 'empty' }));
    (el as any).setMatrix({ ghost: ['read'], admin: ['read'] });
    await wait(20);
    expect((el as any).getMatrix()).toEqual({ ghost: ['read'], admin: ['read'] });
    expect((el as any).hasPermission('ghost', 'read')).toBe(true);
  });

  it('a matrix set through the property channel renders the same as setMatrix()', async () => {
    const viaProperty = await makeMatrix(combo({ fill: 'empty' }));
    (viaProperty as any).matrix = { admin: ['read', 'update'] };
    await wait(20);
    const viaMethod = await makeMatrix(combo({ fill: 'empty' }));
    (viaMethod as any).setMatrix({ admin: ['read', 'update'] });
    await wait(20);
    const checkedOf = (el: HTMLElement) =>
      [...el.shadowRoot!.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')]
        .map(box => `${box.dataset.role}/${box.dataset.perm}=${box.checked}`);
    expect(checkedOf(viaProperty)).toEqual(checkedOf(viaMethod));
  });
});
