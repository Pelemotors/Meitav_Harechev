import { User } from '../types';

// Define permission types
export type Permission = 
  | 'cars:read'
  | 'cars:write'
  | 'cars:delete'
  | 'leads:read'
  | 'leads:write'
  | 'leads:delete'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'whatsapp:read'
  | 'whatsapp:write'
  | 'sitemap:read'
  | 'sitemap:write'
  | 'admin:access'
  | 'reports:read'
  | 'settings:read'
  | 'settings:write';

// Define role permissions mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    'cars:read',
    'cars:write',
    'cars:delete',
    'leads:read',
    'leads:write',
    'leads:delete',
    'users:read',
    'users:write',
    'users:delete',
    'whatsapp:read',
    'whatsapp:write',
    'sitemap:read',
    'sitemap:write',
    'admin:access',
    'reports:read',
    'settings:read',
    'settings:write'
  ],
  manager: [
    'cars:read',
    'cars:write',
    'leads:read',
    'leads:write',
    'whatsapp:read',
    'whatsapp:write',
    'sitemap:read',
    'reports:read',
    'settings:read'
  ],
  content_manager: [
    'cars:read',
    'cars:write',
    'leads:read',
    'whatsapp:read',
    'sitemap:read',
    'sitemap:write'
  ],
  sales_rep: [
    'cars:read',
    'leads:read',
    'leads:write',
    'whatsapp:read'
  ]
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.some(permission => userPermissions.includes(permission));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.every(permission => userPermissions.includes(permission));
};

/**
 * Check if user has admin access
 */
export const isAdmin = (user: User | null): boolean => {
  return hasPermission(user, 'admin:access');
};

/**
 * Check if user can manage cars
 */
export const canManageCars = (user: User | null): boolean => {
  return hasAnyPermission(user, ['cars:write', 'cars:delete']);
};

/**
 * Check if user can manage leads
 */
export const canManageLeads = (user: User | null): boolean => {
  return hasAnyPermission(user, ['leads:write', 'leads:delete']);
};

/**
 * Check if user can manage users
 */
export const canManageUsers = (user: User | null): boolean => {
  return hasAnyPermission(user, ['users:write', 'users:delete']);
};

/**
 * Check if user can access admin panel
 */
export const canAccessAdmin = (user: User | null): boolean => {
  return hasPermission(user, 'admin:access');
};

/**
 * Get user's role display name
 */
export const getRoleDisplayName = (role: string): string => {
  const roleNames: Record<string, string> = {
    admin: 'מנהל מערכת',
    manager: 'מנהל',
    content_manager: 'מנהל תוכן',
    sales_rep: 'נציג מכירות'
  };
  
  return roleNames[role] || role;
};

/**
 * Get user's role color for UI
 */
export const getRoleColor = (role: string): string => {
  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    content_manager: 'bg-green-100 text-green-800',
    sales_rep: 'bg-yellow-100 text-yellow-800'
  };
  
  return roleColors[role] || 'bg-gray-100 text-gray-800';
};