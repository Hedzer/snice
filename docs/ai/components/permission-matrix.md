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
- `empty` - Message shown when no roles or permissions are configured
- `table` - The permission grid
- `table-header` - Grid header section
- `table-body` - Grid body section
- `table-row` - Any header or role row
- `table-cell` - Any header or body cell
- `header-cell` - Added to `table-cell` on header cells
- `role-header-cell` - Added to `header-cell` on the leading Role column header
- `permission-header-cell` - Added to `header-cell` on a permission column header
- `permission-header` - Permission header content wrapper
- `permission-name` - Permission name text
- `permission-description` - Permission description text
- `role-cell` - Added to `table-cell` on the leading role cell of a row
- `role-name` - Role name text
- `role-description` - Role description text
- `permission-cell` - Added to `table-cell` on a role/permission intersection cell
- `indicator` - Read-only grant indicator
- `indicator-granted` - Added to `indicator` when the permission is granted
- `indicator-denied` - Added to `indicator` when the permission is not granted
- `icon` - Read-only indicator glyph
- `check-icon` - Added to `icon` on the granted check mark
- `dash-icon` - Added to `icon` on the not-granted dash
- `input` - Editable grant checkbox
- `checkbox` - Added to `input` on the grant checkbox
- `checkbox-checked` - Added to `checkbox` while the permission is granted

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
