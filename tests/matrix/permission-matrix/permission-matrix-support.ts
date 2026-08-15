/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-permission-matrix — matrix oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Derived from `docs/ai/components/permission-matrix.md` and
 * `snice-permission-matrix.types.ts`:
 *
 *   · "Role/permission grid with checkbox toggles for managing access control."
 *   · `roles: PermissionRole[]`, `permissions: Permission[]`,
 *     `matrix: PermissionMatrix = { [roleId]: string[] }`, `readonly`.
 *   · `getMatrix()` — "Returns deep copy of current matrix"
 *   · `setMatrix(matrix)` — "Replace entire matrix"
 *   · `hasPermission(roleId, permId)`
 *   · `permission-toggle` → `{ roleId, permissionId, granted }`
 *   · `matrix-change` → `{ matrix }`
 *   · CSS part `base`
 *   · a11y: 'Table uses `role="grid"` with `aria-label`', 'Checkboxes have
 *     accessible labels (e.g., "Grant Create for Admin")', 'Readonly mode shows
 *     check/dash indicators instead of checkboxes'.
 */
import { mount, one, all, part, text, wait, expectNoProblems } from '../matrix-utils';
import type {
  Permission, PermissionMatrix, PermissionRole,
} from '../../../packages/components/src/permission-matrix/snice-permission-matrix.types';
import '../../../packages/components/src/permission-matrix/snice-permission-matrix';

export { wait, expectNoProblems };

// ── Fixtures ────────────────────────────────────────────────────────────────

export const ROLE_SETS: Record<string, PermissionRole[]> = {
  one: [{ id: 'admin', name: 'Admin' }],
  three: [
    { id: 'admin', name: 'Admin' },
    { id: 'editor', name: 'Editor' },
    { id: 'viewer', name: 'Viewer' },
  ],
};

export const PERM_SETS: Record<string, Permission[]> = {
  one: [{ id: 'read', name: 'Read' }],
  four: [
    { id: 'create', name: 'Create' },
    { id: 'read', name: 'Read' },
    { id: 'update', name: 'Update' },
    { id: 'delete', name: 'Delete' },
  ],
};

export type Fill = 'empty' | 'partial' | 'full';

/** The `{ [roleId]: string[] }` vector a fill describes. */
export function matrixFor(
  roles: PermissionRole[], permissions: Permission[], fill: Fill,
): PermissionMatrix {
  if (fill === 'empty') return {};
  const out: PermissionMatrix = {};
  roles.forEach((role, index) => {
    if (fill === 'full') {
      out[role.id] = permissions.map(perm => perm.id);
      return;
    }
    // partial: role i holds the first (i+1 mod n+1) permissions, so some roles
    // hold none, some hold a subset, and none of them hold everything.
    out[role.id] = permissions.slice(0, index % (permissions.length + 1));
  });
  return out;
}

export interface PermissionCombo {
  roles: PermissionRole[];
  permissions: Permission[];
  fill: Fill;
  readonly: boolean;
  descriptions: boolean;
}

export function combo(over: Partial<PermissionCombo> = {}): PermissionCombo {
  return {
    roles: ROLE_SETS.three,
    permissions: PERM_SETS.four,
    fill: 'partial',
    readonly: false,
    descriptions: false,
    ...over,
  };
}

export function comboName(c: PermissionCombo): string {
  return `${c.roles.length}roles/${c.permissions.length}perms/${c.fill}`
    + `/${c.readonly ? 'readonly' : 'editable'}${c.descriptions ? '/described' : ''}`;
}

/** The roles/permissions a combo actually mounts, descriptions applied. */
export function rolesOf(c: PermissionCombo): PermissionRole[] {
  return c.roles.map(role => c.descriptions ? { ...role, description: `${role.name} access` } : { ...role });
}

export function permsOf(c: PermissionCombo): Permission[] {
  return c.permissions.map(perm => c.descriptions ? { ...perm, description: `Can ${perm.name.toLowerCase()}` } : { ...perm });
}

export function matrixOf(c: PermissionCombo): PermissionMatrix {
  return matrixFor(c.roles, c.permissions, c.fill);
}

export async function makeMatrix(c: PermissionCombo): Promise<any> {
  const el = await mount<any>('snice-permission-matrix', c.readonly ? { readonly: true } : {});
  el.roles = rolesOf(c);
  el.permissions = permsOf(c);
  el.matrix = matrixOf(c);
  await wait(20);
  return el;
}

// ── Documented derivations ──────────────────────────────────────────────────

/** `hasPermission`: the role's list contains the permission id. */
export function granted(matrix: PermissionMatrix, roleId: string, permId: string): boolean {
  return (matrix[roleId] ?? []).includes(permId);
}

// ── Reading the rendered grid ───────────────────────────────────────────────

export function gridEl(el: HTMLElement): HTMLElement | null {
  return one<HTMLElement>(el, '[role="grid"]');
}

export function checkboxes(el: HTMLElement): HTMLInputElement[] {
  return all<HTMLInputElement>(el, 'input[type="checkbox"]');
}

export function checkbox(el: HTMLElement, roleId: string, permId: string): HTMLInputElement | null {
  return one<HTMLInputElement>(el, `input[data-role="${roleId}"][data-perm="${permId}"]`);
}

export function columnNames(el: HTMLElement): string[] {
  const head = one<HTMLElement>(el, 'thead tr');
  return head ? [...head.querySelectorAll('th')].map(node => text(node)) : [];
}

export function rowNames(el: HTMLElement): string[] {
  return all<HTMLElement>(el, 'tbody tr')
    .map(row => text(row.querySelector('.matrix-role-name')));
}

/** Readonly indicators, in row-major order, as `true` = granted. */
export function readonlyStates(el: HTMLElement): boolean[] {
  return all<HTMLElement>(el, '.matrix-readonly-indicator')
    .map(node => !!node.querySelector('.matrix-readonly-check'));
}

/**
 * The oracle every structural combo runs through: the rendered grid must match
 * the documented role x permission grid for its property vector.
 */
export function checkGrid(el: HTMLElement, c: PermissionCombo): string[] {
  const problems: string[] = [];
  const roles = rolesOf(c);
  const perms = permsOf(c);
  const matrix = matrixOf(c);

  if (!part(el, 'base')) problems.push('part="base" missing');

  const grid = gridEl(el);
  if (!grid) {
    problems.push('no role="grid" rendered');
    return problems;
  }
  if (!(grid.getAttribute('aria-label') ?? '').trim()) {
    problems.push('role="grid" carries no aria-label');
  }

  // Columns: a leading role column, then one per permission IN ORDER.
  // (A described permission renders its description under its name, so the
  // column's collapsed text reads "Read Can read" — the assertion is that each
  // column LEADS with the documented name, in the documented order.)
  const gotColumns = columnNames(el);
  const wantColumns = ['Role', ...perms.map(perm => perm.name)];
  if (gotColumns.length !== wantColumns.length) {
    problems.push(`columns: ${gotColumns.length} != ${wantColumns.length} ([${gotColumns.join(',')}])`);
  } else {
    gotColumns.forEach((name, index) => {
      if (!name.startsWith(wantColumns[index])) {
        problems.push(`column ${index}: "${name}" does not name "${wantColumns[index]}"`);
      }
    });
  }

  // Rows: one per role, in order, naming the role.
  const rows = rowNames(el);
  const wantRows = roles.map(role => role.name);
  if (rows.join('|') !== wantRows.join('|')) {
    problems.push(`rows: [${rows.join(',')}] != [${wantRows.join(',')}]`);
  }

  // Descriptions are part of the documented role/permission shape; when given,
  // they must be shown, because they are the only way a user can read them.
  if (c.descriptions) {
    for (const role of roles) {
      if (!text(grid).includes(role.description!)) {
        problems.push(`role description "${role.description}" not rendered`);
      }
    }
    for (const perm of perms) {
      if (!text(grid).includes(perm.description!)) {
        problems.push(`permission description "${perm.description}" not rendered`);
      }
    }
  }

  if (c.readonly) {
    // "Readonly mode shows check/dash indicators instead of checkboxes."
    if (checkboxes(el).length) {
      problems.push(`${checkboxes(el).length} checkboxes rendered in readonly mode`);
    }
    const states = readonlyStates(el);
    const want: boolean[] = [];
    for (const role of roles) for (const perm of perms) want.push(granted(matrix, role.id, perm.id));
    if (states.length !== want.length) {
      problems.push(`readonly indicators: ${states.length} != ${want.length}`);
    } else {
      states.forEach((state, index) => {
        if (state !== want[index]) {
          problems.push(`readonly indicator ${index}: ${state ? 'check' : 'dash'}, expected `
            + `${want[index] ? 'check' : 'dash'}`);
        }
      });
    }
    const labels = all<HTMLElement>(el, '.matrix-readonly-indicator')
      .map(node => node.getAttribute('aria-label') ?? '');
    if (labels.some(label => !label.trim())) {
      problems.push('a readonly indicator has no accessible label');
    }
    if (want.includes(true) && want.includes(false)) {
      const grantedLabels = new Set(labels.filter((_, i) => want[i]));
      const deniedLabels = new Set(labels.filter((_, i) => !want[i]));
      for (const label of grantedLabels) {
        if (deniedLabels.has(label)) {
          problems.push(`granted and not-granted indicators share the label "${label}"`);
        }
      }
    }
    return problems;
  }

  // Editable: one checkbox per role x permission, checked exactly when granted,
  // and each with an accessible label naming the permission and the role.
  for (const role of roles) {
    for (const perm of perms) {
      const box = checkbox(el, role.id, perm.id);
      if (!box) {
        problems.push(`no checkbox for ${role.id}/${perm.id}`);
        continue;
      }
      const want = granted(matrix, role.id, perm.id);
      if (box.checked !== want) {
        problems.push(`${role.id}/${perm.id} checked=${box.checked}, expected ${want}`);
      }
      const label = box.getAttribute('aria-label') ?? '';
      if (!label.includes(perm.name) || !label.includes(role.name)) {
        problems.push(`${role.id}/${perm.id} aria-label "${label}" does not name the permission and the role`);
      }
    }
  }
  const expectedBoxes = roles.length * perms.length;
  if (checkboxes(el).length !== expectedBoxes) {
    problems.push(`${checkboxes(el).length} checkboxes, expected ${expectedBoxes}`);
  }

  return problems;
}

// ── Interaction ─────────────────────────────────────────────────────────────

/** Tick or untick a checkbox the way a user does. */
export function toggle(el: HTMLElement, roleId: string, permId: string, checked: boolean): void {
  const box = checkbox(el, roleId, permId);
  if (!box) throw new Error(`no checkbox for ${roleId}/${permId}`);
  box.checked = checked;
  box.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
}

export interface Recorded { type: string; detail: any }

export function record(el: HTMLElement): Recorded[] {
  const seen: Recorded[] = [];
  for (const type of ['permission-toggle', 'matrix-change']) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}
