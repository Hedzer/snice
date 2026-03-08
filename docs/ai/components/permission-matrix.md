# snice-permission-matrix

Role/permission grid with checkbox toggles for managing access control.

## Properties

```typescript
roles: PermissionRole[] = [];        // { id, name, description? }
permissions: Permission[] = [];      // { id, name, group?, description? }
matrix: PermissionMatrix = {};       // { [roleId]: string[] } (permission IDs)
readonly: boolean = false;
```

## Events

- `permission-toggle` -> `{ roleId: string, permissionId: string, granted: boolean }`
- `matrix-change` -> `{ matrix: PermissionMatrix }`

## Methods

- `getMatrix()` - Returns deep copy of current matrix
- `setMatrix(matrix)` - Replace entire matrix
- `hasPermission(roleId, permId)` - Check if role has permission

## Usage

```html
<snice-permission-matrix id="pm"></snice-permission-matrix>
<snice-permission-matrix id="pm-ro" readonly></snice-permission-matrix>
```

```typescript
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

// Listen for changes
pm.addEventListener('permission-toggle', (e) => {
  console.log(e.detail.roleId, e.detail.permissionId, e.detail.granted);
});

// Query
pm.hasPermission('admin', 'delete'); // true
pm.getMatrix(); // returns deep copy
```

## CSS Parts

- `base` - Outer container

## Features

- Rows = roles, columns = permissions
- Checkbox toggles for editable mode
- Check/dash indicators for readonly mode
- Role descriptions shown inline
- Permission descriptions in headers
- Sticky first column and header row
- Accessible ARIA labels on checkboxes
- Deep-copy getMatrix() for safe reads
