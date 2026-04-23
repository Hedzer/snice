import type { Meta, StoryObj } from '@storybook/html-vite';
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
  title: 'PermissionMatrix',
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

// CSS Parts: base
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-demo snice-permission-matrix { display: block; }
      .parts-demo .label { font: 700 11px/1 sans-serif; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }

      .parts-demo .styled::part(base) {
        background: #0f172a;
        border: 2px solid #38bdf8;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 0 32px rgba(56,189,248,0.2);
      }
    `;

    const ROLES = [
      { id: 'admin', name: 'Admin', description: 'Full access' },
      { id: 'manager', name: 'Manager', description: 'Manage team' },
      { id: 'editor', name: 'Editor', description: 'Content editing' },
      { id: 'viewer', name: 'Viewer', description: 'Read only' },
    ];
    const PERMISSIONS = [
      { id: 'users:read', name: 'View Users', group: 'Users' },
      { id: 'users:write', name: 'Edit Users', group: 'Users' },
      { id: 'users:delete', name: 'Delete Users', group: 'Users' },
      { id: 'content:read', name: 'View Content', group: 'Content' },
      { id: 'content:write', name: 'Edit Content', group: 'Content' },
      { id: 'billing:read', name: 'View Billing', group: 'Billing' },
      { id: 'billing:write', name: 'Manage Billing', group: 'Billing' },
      { id: 'reports:read', name: 'View Reports', group: 'Reports' },
    ];
    const MATRIX = {
      admin: ['users:read', 'users:write', 'users:delete', 'content:read', 'content:write', 'billing:read', 'billing:write', 'reports:read'],
      manager: ['users:read', 'users:write', 'content:read', 'content:write', 'billing:read', 'reports:read'],
      editor: ['content:read', 'content:write', 'reports:read'],
      viewer: ['content:read', 'reports:read'],
    };

    const makeMatrix = (cls: string) => {
      const el = document.createElement('snice-permission-matrix');
      if (cls) el.classList.add(cls);
      (el as any).roles = ROLES;
      (el as any).permissions = PERMISSIONS;
      (el as any).matrix = MATRIX;
      return el;
    };

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-demo');

    const col1 = document.createElement('div');
    const lbl1 = document.createElement('div'); lbl1.className = 'label'; lbl1.textContent = 'Default';
    col1.appendChild(lbl1); col1.appendChild(makeMatrix(''));

    const col2 = document.createElement('div');
    const lbl2 = document.createElement('div'); lbl2.className = 'label'; lbl2.textContent = 'Styled via ::part(base)';
    col2.appendChild(lbl2); col2.appendChild(makeMatrix('styled'));

    wrap.appendChild(col1);
    wrap.appendChild(col2);
    return wrap;
  },
};
