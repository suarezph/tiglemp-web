import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  KeyRound,
  Lock,
  MoreHorizontal,
  Plus,
  ShieldAlert,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  api,
  ApiError,
  collectFieldErrors,
  generalApiErrorMessage,
} from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import {
  PERMISSION_GROUPS,
  type PermissionDef,
} from '@/lib/permissions';
import type { AdminUser } from '@/types/api';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const ADMIN_USERS_KEY = ['admin', 'admin-users'] as const;

export function AdminUsers() {
  const currentUser = useAuthStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const query = useQuery({
    queryKey: ADMIN_USERS_KEY,
    queryFn: () => api.get<AdminUser[]>('/admin/admin-users'),
    retry: false,
  });

  const adminUsers = query.data?.data ?? [];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage administrator accounts and their permissions. Only the root
            admin can access this page.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Add admin
        </Button>
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
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Super admin</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[1%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-6"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!query.isPending && adminUsers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-6"
                  >
                    No admin users yet. Click &quot;Add admin&quot; to create one.
                  </TableCell>
                </TableRow>
              )}
              {adminUsers.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.adminProfile?.fullName ? (
                        <>
                          {u.adminProfile.fullName}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">
                          —
                          {isSelf && (
                            <span className="ml-2 not-italic text-xs">
                              (you)
                            </span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      {u.adminProfile?.phone ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.isSuperAdmin ? (
                        <Badge variant="default" className="gap-1">
                          <Sparkles className="size-3" />
                          Super
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.isSuperAdmin ? (
                        <span className="text-sm">All</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {u.assignedPermissionKeys.length} assigned
                          {u.effectivePermissionKeys.length !==
                            u.assignedPermissionKeys.length && (
                            <span>
                              {' '}
                              · {u.effectivePermissionKeys.length} effective
                            </span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                            <span className="sr-only">Open actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setEditTarget(u)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={isSelf}
                            onClick={() => !isSelf && setDeleteTarget(u)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateAdminUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditAdminUserDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <DeleteAdminUserDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
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
          Could not load admin users
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

type AdminUserFormState = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  permissionKeys: string[];
};

const emptyForm: AdminUserFormState = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  isActive: true,
  isSuperAdmin: false,
  permissionKeys: [],
};

function CreateAdminUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdminUserFormState>(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm);
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      api.post<AdminUser>('/admin/admin-users', {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email,
        password: form.password,
        isActive: form.isActive,
        isSuperAdmin: form.isSuperAdmin,
        permissionKeys: form.isSuperAdmin ? [] : form.permissionKeys,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
      onOpenChange(false);
    },
  });

  const handleClose = (next: boolean) => {
    if (mutation.isPending) return;
    if (!next) mutation.reset();
    onOpenChange(next);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add admin user</DialogTitle>
          <DialogDescription>
            New admin accounts can sign in immediately. Permissions can be
            adjusted later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <AdminUserFormFields
            mode="create"
            form={form}
            onChange={setForm}
            error={mutation.error}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create admin'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditAdminUserDialog({
  target,
  onClose,
}: {
  target: AdminUser | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdminUserFormState>(emptyForm);

  useEffect(() => {
    if (!target) return;
    setForm({
      fullName: target.adminProfile?.fullName ?? '',
      phone: target.adminProfile?.phone ?? '',
      email: target.email,
      password: '',
      isActive: target.isActive,
      isSuperAdmin: target.isSuperAdmin,
      permissionKeys: target.assignedPermissionKeys,
    });
  }, [target]);

  const mutation = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email,
        isActive: form.isActive,
        isSuperAdmin: form.isSuperAdmin,
        permissionKeys: form.isSuperAdmin ? [] : form.permissionKeys,
      };
      // Only send password when admin actually typed a new one.
      if (form.password.trim()) body.password = form.password;
      return api.put<AdminUser>(`/admin/admin-users/${target!.id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
      onClose();
    },
  });

  const handleClose = () => {
    if (mutation.isPending) return;
    mutation.reset();
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(next) => !next && handleClose()}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit admin user</DialogTitle>
          <DialogDescription>
            Leave password blank to keep the current one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <AdminUserFormFields
            mode="edit"
            form={form}
            onChange={setForm}
            error={mutation.error}
          />

          {target && !target.isSuperAdmin && (
            <EffectivePermissionsHint target={target} />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EffectivePermissionsHint({ target }: { target: AdminUser }) {
  const assigned = new Set(target.assignedPermissionKeys);
  const onlyEffective = target.effectivePermissionKeys.filter(
    (k) => !assigned.has(k)
  );
  if (onlyEffective.length === 0) return null;
  return (
    <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
      <p className="font-medium text-foreground mb-1">Inherited permissions</p>
      <p>
        This admin also has {onlyEffective.length} permission(s) granted
        outside of this list:
      </p>
      <p className="mt-1 font-mono text-[11px]">{onlyEffective.join(', ')}</p>
    </div>
  );
}

function AdminUserFormFields({
  mode,
  form,
  onChange,
  error,
}: {
  mode: 'create' | 'edit';
  form: AdminUserFormState;
  onChange: (next: AdminUserFormState) => void;
  error: unknown;
}) {
  const apiErr = error instanceof ApiError ? error : null;
  const fieldErrors = apiErr?.fieldErrors ?? null;
  const generalError = generalApiErrorMessage(error);

  const set = <K extends keyof AdminUserFormState>(
    key: K,
    value: AdminUserFormState[K]
  ) => onChange({ ...form, [key]: value });

  const togglePermission = (key: string) => {
    onChange({
      ...form,
      permissionKeys: form.permissionKeys.includes(key)
        ? form.permissionKeys.filter((p) => p !== key)
        : [...form.permissionKeys, key],
    });
  };

  return (
    <>
      <Field
        id={`${mode}-fullName`}
        label="Name"
        errors={collectFieldErrors(fieldErrors, 'fullName')}
      >
        <Input
          id={`${mode}-fullName`}
          autoComplete="off"
          value={form.fullName}
          onChange={(e) => set('fullName', e.target.value)}
          placeholder="e.g. Jamie Cruz"
        />
      </Field>

      <Field
        id={`${mode}-phone`}
        label="Phone"
        errors={collectFieldErrors(fieldErrors, 'phone')}
      >
        <Input
          id={`${mode}-phone`}
          autoComplete="off"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+6591234567"
        />
      </Field>

      <Field
        id={`${mode}-email`}
        label="Email"
        errors={collectFieldErrors(fieldErrors, 'email')}
      >
        <Input
          id={`${mode}-email`}
          type="email"
          autoComplete="off"
          required
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
        />
      </Field>

      <Field
        id={`${mode}-password`}
        label={mode === 'create' ? 'Password' : 'New password (optional)'}
        errors={collectFieldErrors(fieldErrors, 'password')}
        hint={
          mode === 'create'
            ? 'Must include uppercase, lowercase, number, and a special character.'
            : 'Leave blank to keep the existing password.'
        }
      >
        <Input
          id={`${mode}-password`}
          type="password"
          autoComplete="new-password"
          required={mode === 'create'}
          minLength={mode === 'create' ? 8 : undefined}
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
        />
      </Field>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
          />
          Account active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isSuperAdmin}
            onChange={(e) => set('isSuperAdmin', e.target.checked)}
          />
          Super admin
        </label>
      </div>

      {form.isSuperAdmin ? (
        <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground flex items-start gap-2">
          <Lock className="size-4 mt-0.5" />
          <span>
            Super admins automatically have every permission. The picker is
            hidden because it has no effect for this account.
          </span>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <KeyRound className="size-4 text-muted-foreground" />
              Permissions
            </Label>
            <span className="text-xs text-muted-foreground">
              {form.permissionKeys.length} selected
            </span>
          </div>
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.label} className="rounded-md border p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.permissions.map((perm) => (
                  <PermissionPill
                    key={perm.key}
                    perm={perm}
                    selected={form.permissionKeys.includes(perm.key)}
                    onToggle={() => togglePermission(perm.key)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {generalError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {generalError}
        </p>
      )}
    </>
  );
}

function PermissionPill({
  perm,
  selected,
  onToggle,
}: {
  perm: PermissionDef;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      title={perm.key}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background hover:bg-accent border-input'
      )}
    >
      {selected && <Check className="size-3" />}
      {perm.label}
    </button>
  );
}

function Field({
  id,
  label,
  errors,
  hint,
  children,
}: {
  id: string;
  label: string;
  errors: string[];
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && errors.length === 0 && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {errors.map((msg, i) => (
        <p key={i} className="text-xs text-destructive">
          {msg}
        </p>
      ))}
    </div>
  );
}

function DeleteAdminUserDialog({
  target,
  onClose,
}: {
  target: AdminUser | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.delete(`/admin/admin-users/${target!.id}`),
    onSuccess: () => {
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
          <DialogTitle>Delete admin user</DialogTitle>
          <DialogDescription>
            This permanently removes <strong>{target?.email}</strong>. They
            will no longer be able to sign in.
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
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
