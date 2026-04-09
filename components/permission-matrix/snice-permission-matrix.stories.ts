import type { Meta, StoryObj } from '@storybook/web-components-vite';
import './snice-permission-matrix';

const ROLES3 = [
  { id: 'admin', name: 'Admin', description: 'Full system access' },
  { id: 'editor', name: 'Editor', description: 'Content management' },
  { id: 'viewer', name: 'Viewer' },
];
const PERMS4 = [
  { id: 'create', name: 'Create' },
  { id: 'read', name: 'Read' },
  { id: 'update', name: 'Update' },
  { id: 'delete', name: 'Delete' },
];
const MATRIX3 = {
  admin: ['create', 'read', 'update', 'delete'],
  editor: ['create', 'read', 'update'],
  viewer: ['read'],
};

type Args = {
  readonly?: boolean;
};

const meta: Meta<Args> = {
  title: 'Commerce/PermissionMatrix',
  component: 'snice-permission-matrix',
  tags: ['autodocs'],
  argTypes: {
    readonly: { control: 'boolean' },
  },
  render: (args) => {
    const el = document.createElement('snice-permission-matrix');
    if (args.readonly) el.toggleAttribute('readonly', true);
    (el as any).roles = ROLES3;
    (el as any).permissions = PERMS4;
    (el as any).matrix = MATRIX3;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { readonly: false },
};

// h2: Editable (default)
export const EditableDefault: Story = {
  render: () => {
    const el = document.createElement('snice-permission-matrix');
    (el as any).roles = ROLES3;
    (el as any).permissions = PERMS4;
    (el as any).matrix = MATRIX3;
    return el;
  },
};

// h2: Readonly
export const Readonly: Story = {
  render: () => {
    const el = document.createElement('snice-permission-matrix');
    el.toggleAttribute('readonly', true);
    (el as any).roles = ROLES3;
    (el as any).permissions = PERMS4;
    (el as any).matrix = MATRIX3;
    return el;
  },
};

// h2: Many roles, many permissions
export const ManyRolesManyPermissions: Story = {
  render: () => {
    const el = document.createElement('snice-permission-matrix');
    (el as any).roles = [
      { id: 'super', name: 'Super Admin' },
      { id: 'admin', name: 'Admin' },
      { id: 'manager', name: 'Manager' },
      { id: 'editor', name: 'Editor' },
      { id: 'author', name: 'Author' },
      { id: 'viewer', name: 'Viewer' },
      { id: 'guest', name: 'Guest' },
    ];
    (el as any).permissions = [
      { id: 'users.create', name: 'Create Users' },
      { id: 'users.read', name: 'View Users' },
      { id: 'users.update', name: 'Edit Users' },
      { id: 'users.delete', name: 'Delete Users' },
      { id: 'posts.create', name: 'Create Posts' },
      { id: 'posts.read', name: 'View Posts' },
      { id: 'posts.update', name: 'Edit Posts' },
      { id: 'posts.delete', name: 'Delete Posts' },
      { id: 'settings', name: 'Settings' },
      { id: 'billing', name: 'Billing' },
    ];
    (el as any).matrix = {
      super: ['users.create', 'users.read', 'users.update', 'users.delete', 'posts.create', 'posts.read', 'posts.update', 'posts.delete', 'settings', 'billing'],
      admin: ['users.create', 'users.read', 'users.update', 'posts.create', 'posts.read', 'posts.update', 'posts.delete', 'settings'],
      manager: ['users.read', 'posts.create', 'posts.read', 'posts.update', 'posts.delete'],
      editor: ['posts.create', 'posts.read', 'posts.update'],
      author: ['posts.create', 'posts.read'],
      viewer: ['posts.read'],
      guest: [],
    };
    return el;
  },
};

// h2: Single role, single permission
export const SingleRoleSinglePermission: Story = {
  render: () => {
    const el = document.createElement('snice-permission-matrix');
    (el as any).roles = [{ id: 'user', name: 'User' }];
    (el as any).permissions = [{ id: 'access', name: 'Access' }];
    (el as any).matrix = { user: ['access'] };
    return el;
  },
};

// h2: Roles with descriptions
export const RolesWithDescriptions: Story = {
  render: () => {
    const el = document.createElement('snice-permission-matrix');
    (el as any).roles = [
      { id: 'admin', name: 'Admin', description: 'Full system access, can manage all resources' },
      { id: 'mod', name: 'Moderator', description: 'Can moderate content and users' },
      { id: 'user', name: 'User', description: 'Standard user access' },
    ];
    (el as any).permissions = PERMS4;
    (el as any).matrix = {
      admin: ['create', 'read', 'update', 'delete'],
      mod: ['read', 'update', 'delete'],
      user: ['read'],
    };
    return el;
  },
};

// h2: Permissions with descriptions
export const PermissionsWithDescriptions: Story = {
  render: () => {
    const el = document.createElement('snice-permission-matrix');
    (el as any).roles = ROLES3;
    (el as any).permissions = [
      { id: 'create', name: 'Create', description: 'Create new records' },
      { id: 'read', name: 'Read', description: 'View existing records' },
      { id: 'update', name: 'Update', description: 'Modify existing records' },
      { id: 'delete', name: 'Delete', description: 'Permanently remove records' },
    ];
    (el as any).matrix = MATRIX3;
    return el;
  },
};

// h2: All permissions granted
export const AllPermissionsGranted: Story = {
  render: () => {
    const el = document.createElement('snice-permission-matrix');
    el.toggleAttribute('readonly', true);
    (el as any).roles = ROLES3;
    (el as any).permissions = PERMS4;
    (el as any).matrix = {
      admin: ['create', 'read', 'update', 'delete'],
      editor: ['create', 'read', 'update', 'delete'],
      viewer: ['create', 'read', 'update', 'delete'],
    };
    return el;
  },
};

// h2: No permissions granted
export const NoPermissionsGranted: Story = {
  render: () => {
    const el = document.createElement('snice-permission-matrix');
    el.toggleAttribute('readonly', true);
    (el as any).roles = ROLES3;
    (el as any).permissions = PERMS4;
    (el as any).matrix = { admin: [], editor: [], viewer: [] };
    return el;
  },
};

// h2: Empty (no data)
export const EmptyNoData: Story = {
  render: () => {
    const el = document.createElement('snice-permission-matrix');
    (el as any).roles = [];
    (el as any).permissions = [];
    (el as any).matrix = {};
    return el;
  },
};
