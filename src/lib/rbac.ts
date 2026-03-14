/**
 * Role-Based Access Control (RBAC) permissions.
 *
 * ADMIN   — Everything + user management
 * MANAGER — Full operational access (CRUD, validate, manage warehouses)
 * STAFF   — Limited: can view most things, create drafts, but cannot validate/delete/manage config
 */

export type Role = 'ADMIN' | 'MANAGER' | 'STAFF';

export type Permission =
  | 'products:create'
  | 'products:edit'
  | 'products:delete'
  | 'receipts:create'
  | 'receipts:validate'
  | 'receipts:delete'
  | 'deliveries:create'
  | 'deliveries:validate'
  | 'deliveries:delete'
  | 'adjustments:create'
  | 'stock:edit'
  | 'warehouses:manage'
  | 'locations:manage'
  | 'settings:manage'
  | 'reports:view'
  | 'users:manage';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'products:create', 'products:edit', 'products:delete',
    'receipts:create', 'receipts:validate', 'receipts:delete',
    'deliveries:create', 'deliveries:validate', 'deliveries:delete',
    'adjustments:create', 'stock:edit',
    'warehouses:manage', 'locations:manage',
    'settings:manage', 'reports:view', 'users:manage',
  ],
  MANAGER: [
    'products:create', 'products:edit', 'products:delete',
    'receipts:create', 'receipts:validate', 'receipts:delete',
    'deliveries:create', 'deliveries:validate', 'deliveries:delete',
    'adjustments:create', 'stock:edit',
    'warehouses:manage', 'locations:manage',
    'settings:manage', 'reports:view',
  ],
  STAFF: [
    'receipts:create',
    'deliveries:create',
    'reports:view',
  ],
};

export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role as Role];
  if (!perms) return false;
  return perms.includes(permission);
}

export function canAccess(role: string | undefined | null, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
