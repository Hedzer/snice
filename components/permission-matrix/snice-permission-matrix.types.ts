export interface PermissionRole {
  id: string;
  name: string;
  description?: string;
}

export interface Permission {
  id: string;
  name: string;
  group?: string;
  description?: string;
}

export type PermissionMatrix = { [roleId: string]: string[] };

export interface SnicePermissionMatrixElement extends HTMLElement {
  roles: PermissionRole[];
  permissions: Permission[];
  matrix: PermissionMatrix;
  readonly: boolean;
  getMatrix(): PermissionMatrix;
  setMatrix(matrix: PermissionMatrix): void;
  hasPermission(roleId: string, permId: string): boolean;
}

export interface SnicePermissionMatrixEventMap {
  'permission-toggle': CustomEvent<{
    roleId: string;
    permissionId: string;
    granted: boolean;
  }>;
  'matrix-change': CustomEvent<{
    matrix: PermissionMatrix;
  }>;
}
