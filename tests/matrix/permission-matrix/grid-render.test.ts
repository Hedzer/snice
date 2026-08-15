/**
 * snice-permission-matrix matrix — grid rendering.
 *
 * Crosses the documented property vector: role count x permission count x how
 * full the `matrix` is x `readonly` x whether the roles/permissions carry the
 * optional `description`. The oracle (`checkGrid`) asserts the documented grid:
 * part `base`, `role="grid"` with an `aria-label`, a Role column followed by the
 * permissions in order, one row per role, and — per mode — a checkbox per pair
 * reflecting `hasPermission`, or the readonly check/dash indicators.
 *
 * 48 combos + 6 empty-data combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  PERM_SETS, ROLE_SETS,
  checkGrid, checkboxes, combo, comboName, expectNoProblems, gridEl, makeMatrix,
  type Fill,
} from './permission-matrix-support';

describe('permission-matrix matrix — grid render', () => {
  afterEach(() => unmountAll());

  for (const roleKey of ['one', 'three'] as const) {
    for (const permKey of ['one', 'four'] as const) {
      for (const fill of ['empty', 'partial', 'full'] as Fill[]) {
        for (const readonly of [false, true]) {
          for (const descriptions of [false, true]) {
            const c = combo({
              roles: ROLE_SETS[roleKey],
              permissions: PERM_SETS[permKey],
              fill, readonly, descriptions,
            });
            it(comboName(c), async () => {
              const el = await makeMatrix(c);
              expectNoProblems(checkGrid(el, c), comboName(c));
            });
          }
        }
      }
    }
  }
});

describe('permission-matrix matrix — nothing to grant', () => {
  afterEach(() => unmountAll());

  const EMPTY = [
    { name: 'no roles, no permissions', roles: [], permissions: [] },
    { name: 'no roles', roles: [], permissions: PERM_SETS.four },
    { name: 'no permissions', roles: ROLE_SETS.three, permissions: [] },
  ];

  for (const shape of EMPTY) {
    for (const readonly of [false, true]) {
      it(`${shape.name}/${readonly ? 'readonly' : 'editable'}`, async () => {
        const c = combo({ roles: shape.roles, permissions: shape.permissions, fill: 'empty', readonly });
        const el = await makeMatrix(c);
        // A grid of role x permission pairs with no pairs has nothing to toggle.
        expect(checkboxes(el), 'checkboxes rendered with no role/permission pairs').toHaveLength(0);
        // Whatever the component chooses to show instead, `base` is documented
        // as the outer container and must always be there to style.
        expect(el.shadowRoot!.querySelector('[part~="base"]'), 'part="base" missing').not.toBeNull();
        if (gridEl(el)) {
          expect(
            gridEl(el)!.querySelectorAll('.matrix-readonly-indicator'),
            'readonly indicators rendered with no role/permission pairs',
          ).toHaveLength(0);
        }
      });
    }
  }
});
