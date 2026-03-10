<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/permission-matrix.md -->

# Permission Matrix
`<snice-permission-matrix>`

A role/permission grid with checkbox toggles for managing access control. Rows represent roles, columns represent permissions.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Data Types](#data-types)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `roles` | `PermissionRole[]` | `[]` | Array of roles to display as rows (set via JS) |
| `permissions` | `Permission[]` | `[]` | Array of permissions to display as columns (set via JS) |
| `matrix` | `PermissionMatrix` | `{}` | Permission assignments: `{ [roleId]: string[] }` (set via JS) |
| `readonly` | `boolean` | `false` | Display check/dash indicators instead of checkboxes |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `getMatrix()` | -- | Returns a deep copy of the current matrix |
| `setMatrix()` | `matrix: PermissionMatrix` | Replace the entire matrix |
| `hasPermission()` | `roleId: string, permId: string` | Check if a role has a specific permission |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `permission-toggle` | `{ roleId: string, permissionId: string, granted: boolean }` | Fired when a checkbox is toggled |
| `matrix-change` | `{ matrix: PermissionMatrix }` | Fired when the matrix is updated |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer container |

## Basic Usage

```typescript
import 'snice/components/permission-matrix/snice-permission-matrix';
```

```html
<snice-permission-matrix id="pm"></snice-permission-matrix>

<script type="module">
  const pm = document.getElementById('pm');
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
</script>
```

## Examples

### Readonly Mode

Use the `readonly` attribute to display a non-editable view with check and dash indicators.

```html
<snice-permission-matrix readonly></snice-permission-matrix>
```

### Event Handling

Listen for permission changes.

```typescript
pm.addEventListener('permission-toggle', (e) => {
  console.log(e.detail.roleId, e.detail.permissionId, e.detail.granted);
});

pm.addEventListener('matrix-change', (e) => {
  console.log('Updated matrix:', e.detail.matrix);
});
```

### Querying Permissions

Use methods to inspect the matrix programmatically.

```typescript
pm.hasPermission('admin', 'delete'); // true
pm.hasPermission('viewer', 'delete'); // false

const matrixCopy = pm.getMatrix(); // deep copy
```

### Grouped Permissions

Use the `group` property on permissions to organize columns.

```typescript
pm.permissions = [
  { id: 'create', name: 'Create', group: 'Content' },
  { id: 'read', name: 'Read', group: 'Content' },
  { id: 'manage-users', name: 'Manage Users', group: 'Admin' },
  { id: 'billing', name: 'Billing', group: 'Admin' }
];
```

## Accessibility

- The table uses `role="grid"` with `aria-label="Permission matrix"`
- Each checkbox has an accessible label (e.g., "Grant Create for Admin")
- Readonly mode displays check/dash SVG indicators instead of interactive checkboxes
- Role descriptions and permission descriptions are displayed when provided
- Column headers use `scope="col"` for screen readers

## Data Types

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
