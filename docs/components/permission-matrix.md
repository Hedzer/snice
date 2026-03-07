<!-- AI: For a low-token version of this doc, use docs/ai/components/permission-matrix.md instead -->

# Permission Matrix Component

`<snice-permission-matrix>`

A grid that maps roles to permissions using checkbox toggles. Useful for managing access control, displaying role-based permissions, and configuring authorization settings.

## Basic Usage

```typescript
import 'snice/components/permission-matrix/snice-permission-matrix';
```

```html
<snice-permission-matrix id="pm"></snice-permission-matrix>

<script>
  const pm = document.getElementById('pm');
  pm.roles = [
    { id: 'admin', name: 'Admin' },
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
</script>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/permission-matrix/snice-permission-matrix';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-permission-matrix.min.js"></script>
```

## Examples

### Editable Matrix

By default, the matrix is editable. Users can toggle checkboxes to grant or revoke permissions.

```html
<snice-permission-matrix id="pm"></snice-permission-matrix>

<script>
  const pm = document.getElementById('pm');
  pm.roles = [
    { id: 'admin', name: 'Administrator', description: 'Full system access' },
    { id: 'editor', name: 'Editor', description: 'Content management' },
    { id: 'viewer', name: 'Viewer', description: 'Read-only access' }
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
</script>
```

### Read-Only Mode

Use the `readonly` attribute to display the matrix without editable checkboxes. Granted permissions show a checkmark, denied permissions show a dash.

```html
<snice-permission-matrix id="pm-readonly" readonly></snice-permission-matrix>
```

### With Permission Descriptions

Add `description` to permission objects to show additional context in the column headers.

```javascript
pm.permissions = [
  { id: 'create', name: 'Create', description: 'Add new items' },
  { id: 'read', name: 'Read', description: 'View existing items' },
  { id: 'update', name: 'Update', description: 'Modify existing items' },
  { id: 'delete', name: 'Delete', description: 'Remove items permanently' }
];
```

### Grouped Permissions

Set the `group` property on permissions to organize them by category. Group names appear as headers.

```javascript
pm.permissions = [
  { id: 'view-docs', name: 'View', group: 'Documents' },
  { id: 'edit-docs', name: 'Edit', group: 'Documents' },
  { id: 'delete-docs', name: 'Delete', group: 'Documents' },
  { id: 'view-reports', name: 'View', group: 'Reports' },
  { id: 'export-reports', name: 'Export', group: 'Reports' },
  { id: 'manage-team', name: 'Manage', group: 'Team' },
  { id: 'view-team', name: 'View', group: 'Team' }
];
```

### Listening for Changes

```javascript
pm.addEventListener('permission-toggle', (e) => {
  console.log(`${e.detail.roleId}: ${e.detail.permissionId} = ${e.detail.granted}`);
});

pm.addEventListener('matrix-change', (e) => {
  console.log('Full matrix:', e.detail.matrix);
  // Save to backend, etc.
});
```

### Programmatic Access

```javascript
// Check if a role has a specific permission
pm.hasPermission('admin', 'delete'); // true

// Get a deep copy of the matrix
const currentMatrix = pm.getMatrix();

// Replace the entire matrix
pm.setMatrix({
  admin: ['create', 'read', 'update', 'delete'],
  editor: ['read'],
  viewer: []
});
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `roles` | `PermissionRole[]` | `[]` | Array of role objects: `{ id, name, description? }`. Set via JS. |
| `permissions` | `Permission[]` | `[]` | Array of permission objects: `{ id, name, group?, description? }`. Set via JS. |
| `matrix` | `PermissionMatrix` | `{}` | Object mapping role IDs to arrays of permission IDs: `{ [roleId]: string[] }`. Set via JS. |
| `readonly` | `boolean` | `false` | When true, shows check/dash indicators instead of checkboxes |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `permission-toggle` | `{ roleId: string, permissionId: string, granted: boolean }` | Fired when a single permission is toggled |
| `matrix-change` | `{ matrix: PermissionMatrix }` | Fired after any permission change, with the full updated matrix |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `getMatrix()` | -- | Returns a deep copy of the current permission matrix |
| `setMatrix()` | `matrix: PermissionMatrix` | Replaces the entire permission matrix |
| `hasPermission()` | `roleId: string, permId: string` | Returns `true` if the role has the specified permission |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer container element |

## Type Definitions

```typescript
interface PermissionRole {
  id: string;
  name: string;
  description?: string;
}

interface Permission {
  id: string;
  name: string;
  group?: string;
  description?: string;
}

type PermissionMatrix = { [roleId: string]: string[] };
```

## Accessibility

- Table uses `role="grid"` with `aria-label`
- Each checkbox has a descriptive `aria-label` (e.g., "Grant Delete for Admin")
- Keyboard navigation works with standard tab/enter/space
- Focus indicators are visible on checkboxes
- Column headers use `scope="col"` for screen readers

## Best Practices

1. Keep role and permission IDs stable - they are the keys in the matrix
2. Use `getMatrix()` to get a safe copy before sending to a backend
3. Use `readonly` mode for display-only views (e.g., showing current user's permissions)
4. Add descriptions to roles and permissions for clarity
5. Group permissions by category when the list is long
6. Listen to `matrix-change` for bulk save operations, `permission-toggle` for granular tracking
