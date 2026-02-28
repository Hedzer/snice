import { element, property, dispatch, watch, render, styles, ready, html, css } from 'snice';
import cssContent from './snice-permission-matrix.css?inline';
import type { PermissionRole, Permission, PermissionMatrix, SnicePermissionMatrixElement } from './snice-permission-matrix.types';

@element('snice-permission-matrix')
export class SnicePermissionMatrix extends HTMLElement implements SnicePermissionMatrixElement {
  @property({ type: Array, attribute: false })
  roles: PermissionRole[] = [];

  @property({ type: Array, attribute: false })
  permissions: Permission[] = [];

  @property({ type: Object, attribute: false })
  matrix: PermissionMatrix = {};

  @property({ type: Boolean })
  readonly = false;

  @render()
  renderContent() {
    const hasData = this.roles.length > 0 && this.permissions.length > 0;

    if (!hasData) {
      return html/*html*/`
        <div part="base" class="matrix">
          <div class="matrix-empty">No roles or permissions configured.</div>
        </div>
      `;
    }

    // Group permissions by their group property
    const groupedPermissions = this.getGroupedPermissions();
    const hasGroups = groupedPermissions.some(g => g.group !== null);

    return html/*html*/`
      <div part="base" class="matrix">
        <table class="matrix-table" role="grid" aria-label="Permission matrix">
          <thead>
            <tr>
              <th scope="col">Role</th>
              ${this.permissions.map(perm => html/*html*/`
                <th scope="col">
                  <div class="matrix-perm-header">
                    <span class="matrix-perm-name">${perm.name}</span>
                    <if ${perm.description}>
                      <span class="matrix-perm-desc" title="${perm.description}">${perm.description}</span>
                    </if>
                  </div>
                </th>
              `)}
            </tr>
          </thead>
          <tbody @change=${this.handleCheckboxChange}>
            ${this.roles.map(role => html/*html*/`
              <tr>
                <td class="matrix-role-cell">
                  <div class="matrix-role-name">${role.name}</div>
                  <if ${role.description}>
                    <div class="matrix-role-desc">${role.description}</div>
                  </if>
                </td>
                ${this.permissions.map(perm => {
                  const granted = this.hasPermission(role.id, perm.id);
                  return this.renderCell(role.id, perm.id, granted);
                })}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderCell(roleId: string, permId: string, granted: boolean) {
    if (this.readonly) {
      return html/*html*/`
        <td class="matrix-cell">
          <span class="matrix-readonly-indicator">
            <if ${granted}>
              <svg class="matrix-readonly-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </if>
            <if ${!granted}>
              <svg class="matrix-readonly-dash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </if>
          </span>
        </td>
      `;
    }

    return html/*html*/`
      <td class="matrix-cell">
        <input type="checkbox"
               class="matrix-checkbox"
               ?checked=${granted}
               data-role="${roleId}"
               data-perm="${permId}"
               aria-label="${this.getPermissionLabel(roleId, permId)}">
      </td>
    `;
  }

  @styles()
  componentStyles() {
    return css/*css*/`${cssContent}`;
  }

  private handleCheckboxChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target.matches('.matrix-checkbox')) return;

    const roleId = target.dataset.role!;
    const permId = target.dataset.perm!;
    const granted = target.checked;

    // Update the matrix
    const newMatrix = { ...this.matrix };
    if (!newMatrix[roleId]) {
      newMatrix[roleId] = [];
    }

    if (granted) {
      if (!newMatrix[roleId].includes(permId)) {
        newMatrix[roleId] = [...newMatrix[roleId], permId];
      }
    } else {
      newMatrix[roleId] = newMatrix[roleId].filter(id => id !== permId);
    }

    this.matrix = newMatrix;

    this.emitPermissionToggle(roleId, permId, granted);
    this.emitMatrixChange();
  }

  @dispatch('permission-toggle', { bubbles: true, composed: true })
  private emitPermissionToggle(roleId: string, permissionId: string, granted: boolean) {
    return { roleId, permissionId, granted };
  }

  @dispatch('matrix-change', { bubbles: true, composed: true })
  private emitMatrixChange() {
    return { matrix: this.getMatrix() };
  }

  // ===== Public API =====

  getMatrix(): PermissionMatrix {
    return JSON.parse(JSON.stringify(this.matrix));
  }

  setMatrix(matrix: PermissionMatrix): void {
    this.matrix = { ...matrix };
  }

  hasPermission(roleId: string, permId: string): boolean {
    const rolePerms = this.matrix[roleId];
    if (!rolePerms) return false;
    return rolePerms.includes(permId);
  }

  // ===== Private helpers =====

  private getGroupedPermissions(): { group: string | null; permissions: Permission[] }[] {
    const groups = new Map<string | null, Permission[]>();

    for (const perm of this.permissions) {
      const group = perm.group || null;
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(perm);
    }

    return Array.from(groups.entries()).map(([group, permissions]) => ({
      group,
      permissions
    }));
  }

  private getPermissionLabel(roleId: string, permId: string): string {
    const role = this.roles.find(r => r.id === roleId);
    const perm = this.permissions.find(p => p.id === permId);
    const granted = this.hasPermission(roleId, permId);
    return `${granted ? 'Revoke' : 'Grant'} ${perm?.name || permId} for ${role?.name || roleId}`;
  }
}
