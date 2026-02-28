import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll } from './test-utils';
import '../../components/permission-matrix/snice-permission-matrix';
import type { SnicePermissionMatrixElement } from '../../components/permission-matrix/snice-permission-matrix.types';

describe('snice-permission-matrix', () => {
  let matrix: SnicePermissionMatrixElement;

  const sampleRoles = [
    { id: 'admin', name: 'Admin', description: 'Full access' },
    { id: 'editor', name: 'Editor' },
    { id: 'viewer', name: 'Viewer' }
  ];

  const samplePermissions = [
    { id: 'create', name: 'Create' },
    { id: 'read', name: 'Read' },
    { id: 'update', name: 'Update' },
    { id: 'delete', name: 'Delete' }
  ];

  const sampleMatrix = {
    admin: ['create', 'read', 'update', 'delete'],
    editor: ['create', 'read', 'update'],
    viewer: ['read']
  };

  async function createMatrix(props: Partial<SnicePermissionMatrixElement> = {}) {
    const el = document.createElement('snice-permission-matrix') as SnicePermissionMatrixElement;
    el.roles = props.roles || sampleRoles;
    el.permissions = props.permissions || samplePermissions;
    el.matrix = props.matrix || sampleMatrix;
    if (props.readonly) el.readonly = true;
    document.body.appendChild(el);
    await (el as any).ready;
    return el;
  }

  afterEach(() => {
    if (matrix) {
      removeComponent(matrix as HTMLElement);
    }
  });

  it('should render permission matrix element', async () => {
    matrix = await createMatrix();
    expect(matrix).toBeTruthy();
  });

  it('should show empty state when no data', async () => {
    matrix = await createMatrix({ roles: [], permissions: [] });
    const empty = queryShadow(matrix as HTMLElement, '.matrix-empty');
    expect(empty).toBeTruthy();
  });

  it('should render role rows', async () => {
    matrix = await createMatrix();
    const roleCells = queryShadowAll(matrix as HTMLElement, '.matrix-role-name');
    expect(roleCells.length).toBe(3);
    expect(roleCells[0].textContent).toContain('Admin');
    expect(roleCells[1].textContent).toContain('Editor');
    expect(roleCells[2].textContent).toContain('Viewer');
  });

  it('should render permission columns', async () => {
    matrix = await createMatrix();
    const headers = queryShadowAll(matrix as HTMLElement, '.matrix-perm-name');
    expect(headers.length).toBe(4);
    expect(headers[0].textContent).toContain('Create');
  });

  it('should render checkboxes for editable mode', async () => {
    matrix = await createMatrix();
    const checkboxes = queryShadowAll(matrix as HTMLElement, '.matrix-checkbox');
    // 3 roles x 4 permissions = 12 checkboxes
    expect(checkboxes.length).toBe(12);
  });

  it('should check correct checkboxes based on matrix', async () => {
    matrix = await createMatrix();
    const checkboxes = queryShadowAll(matrix as HTMLElement, '.matrix-checkbox') as NodeListOf<HTMLInputElement>;

    // Admin row: all 4 should be checked
    expect(checkboxes[0].checked).toBe(true); // admin/create
    expect(checkboxes[1].checked).toBe(true); // admin/read
    expect(checkboxes[2].checked).toBe(true); // admin/update
    expect(checkboxes[3].checked).toBe(true); // admin/delete

    // Editor row: first 3 checked, last unchecked
    expect(checkboxes[4].checked).toBe(true);  // editor/create
    expect(checkboxes[5].checked).toBe(true);  // editor/read
    expect(checkboxes[6].checked).toBe(true);  // editor/update
    expect(checkboxes[7].checked).toBe(false); // editor/delete

    // Viewer row: only read checked
    expect(checkboxes[8].checked).toBe(false);  // viewer/create
    expect(checkboxes[9].checked).toBe(true);   // viewer/read
    expect(checkboxes[10].checked).toBe(false); // viewer/update
    expect(checkboxes[11].checked).toBe(false); // viewer/delete
  });

  it('should render readonly indicators instead of checkboxes', async () => {
    matrix = await createMatrix({ readonly: true });
    const checkboxes = queryShadowAll(matrix as HTMLElement, '.matrix-checkbox');
    expect(checkboxes.length).toBe(0);

    const checks = queryShadowAll(matrix as HTMLElement, '.matrix-readonly-check');
    const dashes = queryShadowAll(matrix as HTMLElement, '.matrix-readonly-dash');
    expect(checks.length).toBeGreaterThan(0);
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('should dispatch permission-toggle event on checkbox change', async () => {
    matrix = await createMatrix();

    let eventDetail: any = null;
    matrix.addEventListener('permission-toggle', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    // Find editor/delete checkbox (should be unchecked)
    const checkboxes = queryShadowAll(matrix as HTMLElement, '.matrix-checkbox') as NodeListOf<HTMLInputElement>;
    const editorDeleteCheckbox = checkboxes[7]; // editor/delete
    expect(editorDeleteCheckbox.checked).toBe(false);

    // Simulate change
    editorDeleteCheckbox.checked = true;
    editorDeleteCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.roleId).toBe('editor');
    expect(eventDetail.permissionId).toBe('delete');
    expect(eventDetail.granted).toBe(true);
  });

  it('should dispatch matrix-change event on checkbox change', async () => {
    matrix = await createMatrix();

    let eventDetail: any = null;
    matrix.addEventListener('matrix-change', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    const checkboxes = queryShadowAll(matrix as HTMLElement, '.matrix-checkbox') as NodeListOf<HTMLInputElement>;
    checkboxes[7].checked = true;
    checkboxes[7].dispatchEvent(new Event('change', { bubbles: true }));

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.matrix).toBeTruthy();
    expect(eventDetail.matrix.editor).toContain('delete');
  });

  it('should return matrix via getMatrix()', async () => {
    matrix = await createMatrix();
    const m = matrix.getMatrix();
    expect(m.admin).toContain('create');
    expect(m.viewer).toContain('read');
    expect(m.viewer).not.toContain('delete');
  });

  it('getMatrix should return a copy (not a reference)', async () => {
    matrix = await createMatrix();
    const m1 = matrix.getMatrix();
    m1.admin.push('extra');
    const m2 = matrix.getMatrix();
    expect(m2.admin).not.toContain('extra');
  });

  it('should update via setMatrix()', async () => {
    matrix = await createMatrix();
    matrix.setMatrix({
      admin: ['read'],
      editor: [],
      viewer: ['read', 'create']
    });

    expect(matrix.hasPermission('admin', 'read')).toBe(true);
    expect(matrix.hasPermission('admin', 'delete')).toBe(false);
    expect(matrix.hasPermission('viewer', 'create')).toBe(true);
  });

  it('hasPermission should return correct values', async () => {
    matrix = await createMatrix();
    expect(matrix.hasPermission('admin', 'create')).toBe(true);
    expect(matrix.hasPermission('admin', 'delete')).toBe(true);
    expect(matrix.hasPermission('viewer', 'delete')).toBe(false);
    expect(matrix.hasPermission('nonexistent', 'read')).toBe(false);
  });

  it('should display role descriptions', async () => {
    matrix = await createMatrix();
    const descs = queryShadowAll(matrix as HTMLElement, '.matrix-role-desc');
    expect(descs.length).toBeGreaterThan(0);
    expect(descs[0].textContent).toContain('Full access');
  });

  it('should have aria-label on checkboxes', async () => {
    matrix = await createMatrix();
    const checkboxes = queryShadowAll(matrix as HTMLElement, '.matrix-checkbox');
    const firstCheckbox = checkboxes[0] as HTMLInputElement;
    expect(firstCheckbox.getAttribute('aria-label')).toBeTruthy();
  });

  it('should update matrix when checkbox is unchecked', async () => {
    matrix = await createMatrix();

    // Uncheck admin/delete
    const checkboxes = queryShadowAll(matrix as HTMLElement, '.matrix-checkbox') as NodeListOf<HTMLInputElement>;
    const adminDeleteCheckbox = checkboxes[3]; // admin/delete
    expect(adminDeleteCheckbox.checked).toBe(true);

    adminDeleteCheckbox.checked = false;
    adminDeleteCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

    expect(matrix.hasPermission('admin', 'delete')).toBe(false);
  });
});
