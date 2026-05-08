// Partner-side permission catalog for the team-member editor.
//
// `PERMISSION_GROUPS` is the static catalog currently rendered by the team
// editor. A dynamic catalog (e.g. `GET /partner/permissions`) does not exist
// yet — when it does, surface it here next to the static one. The
// per-user-permissions query already has a backend home and is exposed as
// `usePartnerStaffPermissions` below.

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';
import type { PartnerUserPermissionsResponse } from '@/types/api';

export type PermissionDef = {
  key: string;
  label: string;
};

export type PermissionGroup = {
  label: string;
  permissions: PermissionDef[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'Team',
    permissions: [
      { key: 'partner.users.read', label: 'Read team members' },
      { key: 'partner.users.create', label: 'Create team members' },
      { key: 'partner.users.update', label: 'Update team members' },
      { key: 'partner.users.delete', label: 'Delete team members' },
    ],
  },
  {
    label: 'Permissions',
    permissions: [
      { key: 'partner.permissions.read', label: 'Read permissions' },
      { key: 'partner.permissions.update', label: 'Update permissions' },
    ],
  },
  {
    label: 'Customers',
    permissions: [
      { key: 'partner.customers.read', label: 'Read customers' },
    ],
  },
  {
    label: 'Bookings',
    permissions: [
      { key: 'partner.bookings.read', label: 'Read bookings' },
      { key: 'partner.bookings.create', label: 'Create bookings' },
      { key: 'partner.bookings.update', label: 'Update bookings' },
      { key: 'partner.bookings.delete', label: 'Delete bookings' },
      { key: 'partner.bookings.approve', label: 'Approve bookings' },
      { key: 'partner.bookings.release', label: 'Release bookings' },
    ],
  },
];

export const ALL_PERMISSION_KEYS: string[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
);

// ---------- one staff user's permissions -----------------------------------

/**
 * Fetches one partner staff user's assigned + effective permission keys via
 * `GET /partner/users/:id/permissions`. Skips when `userId` is falsy. Same
 * data is already returned alongside the list endpoint, so use this only
 * when you need an independent fetch for a specific user.
 */
export function usePartnerStaffPermissions(
  userId: string | null | undefined
): UseQueryResult<ApiResponse<PartnerUserPermissionsResponse>> {
  return useQuery({
    queryKey: ['partner', 'users', userId, 'permissions'] as const,
    queryFn: () =>
      api.get<PartnerUserPermissionsResponse>(
        `/partner/users/${userId}/permissions`
      ),
    enabled: !!userId,
  });
}
