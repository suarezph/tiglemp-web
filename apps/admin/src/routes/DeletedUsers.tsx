import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { api, ApiError, generalApiErrorMessage } from '@/lib/api';
import type { AdminUser, Partner } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePageTitle } from '@/lib/use-page-title';

const DELETED_USERS_KEY = ['admin', 'deleted-users'] as const;
const ADMIN_USERS_KEY = ['admin', 'admin-users'] as const;
const PARTNERS_KEY = ['admin', 'partners'] as const;

export function DeletedUsers() {
  usePageTitle('Deleted users');
  const [restoreTarget, setRestoreTarget] = useState<AdminUser | null>(null);

  const query = useQuery({
    queryKey: DELETED_USERS_KEY,
    queryFn: () => api.get<AdminUser[]>('/admin/deleted-users'),
    retry: false,
  });

  const users = query.data?.data ?? [];

  // Lookup table for partnerProfileId → businessName. Reuses the same query
  // key as the Partners page, so this is a cache hit when the admin has
  // already opened that page. Only fetched when at least one deleted user
  // belongs to a partner company.
  const needsPartners = users.some((u) => u.partnerProfileId);
  const partnersQuery = useQuery({
    queryKey: PARTNERS_KEY,
    queryFn: () => api.get<Partner[]>('/admin/partners'),
    enabled: needsPartners,
  });
  const partnersById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of partnersQuery.data?.data ?? []) {
      map.set(p.id, p.businessName);
    }
    return map;
  }, [partnersQuery.data]);

  return (
    <>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Archive className="size-6 text-muted-foreground" />
          Deleted Users
        </h1>
        <p className="text-sm text-muted-foreground">
          Archived admin and partner accounts. Restoring re-enables sign-in
          and returns the user to their normal list.
        </p>
      </div>

      {query.isError ? (
        <ErrorState error={query.error} />
      ) : (
        <div className="bg-background rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Removed</TableHead>
                <TableHead className="w-[1%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-6"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!query.isPending && users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-6"
                  >
                    No deleted users.
                  </TableCell>
                </TableRow>
              )}
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.adminProfile?.fullName ?? (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {u.partnerProfileId ? (
                      partnersById.get(u.partnerProfileId) ?? (
                        <span className="text-muted-foreground italic">
                          {partnersQuery.isPending ? 'Loading…' : 'Unknown'}
                        </span>
                      )
                    ) : (
                      ''
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {u.deletedAt
                      ? new Date(u.deletedAt).toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRestoreTarget(u)}
                    >
                      <RotateCcw />
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RestoreUserDialog
        target={restoreTarget}
        onClose={() => setRestoreTarget(null)}
      />
    </>
  );
}

function ErrorState({ error }: { error: unknown }) {
  if (error instanceof ApiError && error.code === 'FORBIDDEN') {
    const formErrors = error.formErrors ?? [];
    const message =
      formErrors.length > 0 ? formErrors.join(' ') : error.message;
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="size-5" />
            Access denied
          </CardTitle>
          <CardDescription className="text-destructive/80">
            {message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <XCircle className="size-5" />
          Could not load deleted users
        </CardTitle>
        <CardDescription className="text-destructive/80">
          {error instanceof ApiError
            ? error.message
            : 'Something went wrong. Try refreshing the page.'}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function RestoreUserDialog({
  target,
  onClose,
}: {
  target: AdminUser | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.post(`/admin/users/${target!.id}/restore`),
    onSuccess: () => {
      // Both lists are affected: the deleted list loses this user, the
      // active admin list (or a partner list, if backend uses this for
      // partners too) gains them back.
      queryClient.invalidateQueries({ queryKey: DELETED_USERS_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
      onClose();
    },
  });

  const handleClose = () => {
    if (mutation.isPending) return;
    mutation.reset();
    onClose();
  };

  const errorMessage = generalApiErrorMessage(mutation.error);

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(next) => !next && handleClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore user</DialogTitle>
          <DialogDescription>
            <strong>{target?.email}</strong> will regain sign-in access and
            return to the active list.
          </DialogDescription>
        </DialogHeader>
        {errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            <RotateCcw />
            {mutation.isPending ? 'Restoring…' : 'Restore user'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
