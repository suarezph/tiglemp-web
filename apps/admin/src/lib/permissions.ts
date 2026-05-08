// Permission catalog for the admin user editor.
//
// `PERMISSION_GROUPS` is the static catalog currently rendered by the admin
// users form. Dynamic equivalents (fetched from `GET /admin/permissions`)
// live below as TanStack Query hooks. Both forms are kept side-by-side so
// the static UI stays working while callers can opt in to the dynamic
// catalog whenever they're ready.

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';
import type {
  Permission,
  UserPermissionsResponse,
  UserRole,
} from '@/types/api';

export type PermissionDef = {
  key: string;
  label: string;
  description?: string;
};

export type PermissionGroup = {
  label: string;
  permissions: PermissionDef[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'Partners',
    permissions: [
      { key: 'partners.read', label: 'Read partners' },
      { key: 'partners.create', label: 'Create partners' },
      { key: 'partners.update', label: 'Update partners' },
      { key: 'partners.delete', label: 'Delete partners' },
      {
        key: 'partners.approval.review',
        label: 'Review partner applications',
      },
      { key: 'partners.ban.manage', label: 'Ban / unban partners' },
    ],
  },
  {
    label: 'Customers',
    permissions: [
      { key: 'customers.read', label: 'Read customers' },
      { key: 'customers.create', label: 'Create customers' },
      { key: 'customers.update', label: 'Update customers' },
      { key: 'customers.delete', label: 'Delete customers' },
    ],
  },
  {
    label: 'Bookings',
    permissions: [
      { key: 'bookings.read', label: 'Read bookings' },
      { key: 'bookings.create', label: 'Create bookings' },
      { key: 'bookings.update', label: 'Update bookings' },
      { key: 'bookings.delete', label: 'Delete bookings' },
      {
        key: 'bookings.assign_partner',
        label: 'Assign partners to bookings',
      },
    ],
  },
  {
    label: 'Permissions',
    permissions: [
      { key: 'permissions.read', label: 'Read permissions' },
      { key: 'permissions.update', label: 'Update permissions' },
    ],
  },
];

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
);

// ---------- dynamic catalog (GET /admin/permissions) -----------------------

export const PERMISSION_CATALOG_QUERY_KEY = ['admin', 'permissions'] as const;

/**
 * Fetches the full permission catalog (admin + partner keys). Cached for
 * 5 minutes since the catalog rarely changes.
 */
export function usePermissionCatalog(): UseQueryResult<
  ApiResponse<Permission[]>
> {
  return useQuery({
    queryKey: PERMISSION_CATALOG_QUERY_KEY,
    queryFn: () => api.get<Permission[]>('/admin/permissions'),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Same data as `usePermissionCatalog`, but already filtered to the
 * permissions assignable to the given role (uses the `roles` field on each
 * `Permission`). Useful for populating an admin-user form with admin keys
 * only, or a partner-user form with partner keys only.
 */
export function usePermissionCatalogForRole(role: UserRole): {
  query: UseQueryResult<ApiResponse<Permission[]>>;
  permissions: Permission[];
} {
  const query = usePermissionCatalog();
  const permissions = (query.data?.data ?? []).filter((p) =>
    p.roles.includes(role)
  );
  return { query, permissions };
}

/**
 * Convert a flat `Permission[]` list into resource-grouped `PermissionGroup[]`
 * format (matching the static `PERMISSION_GROUPS` shape). Resource is taken
 * from the first dotted segment of the key — e.g. `partners.read` →
 * `partners`. Group label is title-cased.
 *
 * Lets you swap the static catalog for the dynamic one with no UI changes.
 */
export function groupCatalogByResource(
  permissions: Permission[]
): PermissionGroup[] {
  const buckets = new Map<string, PermissionDef[]>();
  for (const p of permissions) {
    const resource = p.key.split('.')[0] ?? 'other';
    if (!buckets.has(resource)) buckets.set(resource, []);
    buckets.get(resource)!.push({
      key: p.key,
      label: p.name,
      description: p.description ?? undefined,
    });
  }
  return Array.from(buckets.entries()).map(([resource, defs]) => ({
    label: titleCase(resource),
    permissions: defs,
  }));
}

function titleCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------- one user's permissions -----------------------------------------

/**
 * Fetches one user's assigned + effective permission keys via the unified
 * `GET /admin/users/:id/permissions` endpoint. Works for both admin and
 * partner users. Skips when `userId` is falsy.
 */
export function useUserPermissions(
  userId: string | null | undefined
): UseQueryResult<ApiResponse<UserPermissionsResponse>> {
  return useQuery({
    queryKey: ['admin', 'users', userId, 'permissions'] as const,
    queryFn: () =>
      api.get<UserPermissionsResponse>(`/admin/users/${userId}/permissions`),
    enabled: !!userId,
  });
}
