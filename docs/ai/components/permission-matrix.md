# snice-permission-matrix

Role/permission grid with checkbox toggles for managing access control.

## Properties

```typescript
roles: PermissionRole[] = [];        // attr: none (JS only)
permissions: Permission[] = [];      // attr: none (JS only)
matrix: PermissionMatrix = {};       // attr: none (JS only), { [roleId]: string[] }
readonly: boolean = false;
```

## Methods

- `getMatrix()` - Returns deep copy of current matrix
- `setMatrix(matrix: PermissionMatrix)` - Replace entire matrix
- `hasPermission(roleId: string, permId: string)` - Check if role has permission

## Events

- `permission-toggle` → `{ roleId: string, permissionId: string, granted: boolean }` - Checkbox toggled
- `matrix-change` → `{ matrix: PermissionMatrix }` - Matrix updated

## CSS Parts

- `base` - Outer container

## Basic Usage

```html
<snice-permission-matrix id="pm"></snice-permission-matrix>
```

```typescript
import 'snice/components/permission-matrix/snice-permission-matrix';

pm.roles = [
  { id: 'admin', name: 'Admin', description: 'Full access' },
  { id: 'editor', name: 'Editor' },
  { id: 'viewer', name: 'Viewer' }
];
pm.permissions = [
  { id: 'create', name: 'Create' },
  { id: 'read', name: 'Read' },
  { id: 'update', name: 'Update' },
  { id: 'delete', name: 'Delete' }
];
pm.matrix = {
  admin: ['create', 'read', 'update', 'delete'],
  editor: ['create', 'read', 'update'],
  viewer: ['read']
};
```

## Accessibility

- Table uses `role="grid"` with `aria-label`
- Checkboxes have accessible labels (e.g., "Grant Create for Admin")
- Readonly mode shows check/dash indicators instead of checkboxes

## Types

```typescript
interface PermissionRole { id: string; name: string; description?: string; }
interface Permission { id: string; name: string; group?: string; description?: string; }
type PermissionMatrix = { [roleId: string]: string[] };
```
