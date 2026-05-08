import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import type { MeResponse } from '@/types/api';

/**
 * Permission utilities for partner app.
 *
 * Pure helpers (`hasPermission`, `hasAnyPermission`, `hasAllPermissions`) are
 * cheap and component-friendly — pass in a permissions array.
 *
 * Hook variants (`useHasPermission`, ...) wrap `useCurrentUser()` so they can
 * answer "can the signed-in partner user do X" without each caller having
 * to fetch `/auth/me` themselves. Cached + deduped via TanStack Query.
 *
 * NOTE: these are intentionally NOT wired into UI gating yet; they're here
 * as the building blocks for future role-aware screens.
 */

export const ME_QUERY_KEY = ['auth', 'me'] as const;

export function useCurrentUser(): UseQueryResult<ApiResponse<MeResponse>> {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => api.get<MeResponse>('/auth/me'),
    enabled: !!token,
    staleTime: 60_000,
  });
}

// ---------- pure helpers ---------------------------------------------------

export function hasPermission(
  permissions: ReadonlyArray<string> | null | undefined,
  key: string
): boolean {
  if (!permissions) return false;
  return permissions.includes(key);
}

export function hasAnyPermission(
  permissions: ReadonlyArray<string> | null | undefined,
  ...keys: string[]
): boolean {
  if (!permissions || keys.length === 0) return false;
  return keys.some((k) => permissions.includes(k));
}

export function hasAllPermissions(
  permissions: ReadonlyArray<string> | null | undefined,
  ...keys: string[]
): boolean {
  if (!permissions) return false;
  return keys.every((k) => permissions.includes(k));
}

// ---------- hook variants --------------------------------------------------

/**
 * Returns true once `/auth/me` has resolved AND the current user has `key`.
 * Returns false while loading or when not signed in. Use the loading state
 * via `useCurrentUser()` directly if you need to disambiguate.
 */
export function useHasPermission(key: string): boolean {
  const me = useCurrentUser();
  return hasPermission(me.data?.data.permissions, key);
}

export function useHasAnyPermission(...keys: string[]): boolean {
  const me = useCurrentUser();
  return hasAnyPermission(me.data?.data.permissions, ...keys);
}

export function useHasAllPermissions(...keys: string[]): boolean {
  const me = useCurrentUser();
  return hasAllPermissions(me.data?.data.permissions, ...keys);
}

/**
 * Convenience — returns the current user payload (or null while loading /
 * signed out). Use this when you want to read flags like `isPartnerRoot`
 * or `partnerProfile.partnerUserLimit` without juggling the query state.
 */
export function useMe(): MeResponse | null {
  const me = useCurrentUser();
  return me.data?.data ?? null;
}
