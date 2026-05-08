import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  KeyRound,
  MoreHorizontal,
  Plus,
  ShieldAlert,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { api, ApiError, collectFieldErrors } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import {
  PERMISSION_GROUPS,
  type PermissionDef,
} from '@/lib/permissions';
import type { PartnerStaffUser } from '@/types/api';
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

const TEAM_KEY = ['partner', 'users'] as const;

// Field names that have a dedicated input in the dialog. Errors on any other
// key (e.g. `partnerUserLimit`, `permissionKeys`) bubble up to the banner.
const KNOWN_FORM_FIELDS = ['email', 'password'] as const;

export function Team() {
  const currentUser = useAuthStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PartnerStaffUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartnerStaffUser | null>(
    null
  );

  const query = useQuery({
    queryKey: TEAM_KEY,
    queryFn: () => api.get<PartnerStaffUser[]>('/partner/users'),
    retry: false,
  });

  const users = query.data?.data ?? [];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team members and what they can do. Only the root
            partner account can manage this list.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Add team member
        </Button>
      </div>

      {query.isError ? (
        <ErrorState error={query.error} />
      ) : (
        <div className="bg-background rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
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
                    No team members yet.
                  </TableCell>
                </TableRow>
              )}
              {users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.email}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (you)
                        </span>
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
                      {u.isPartnerRoot ? (
                        <Badge variant="default" className="gap-1">
                          <Sparkles className="size-3" />
                          Root
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Staff
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {u.assignedPermissionKeys.length} assigned
                      {u.effectivePermissionKeys.length !==
                        u.assignedPermissionKeys.length && (
                        <span>
                          {' '}
                          · {u.effectivePermissionKeys.length} effective
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.isPartnerRoot ? (
                        <span
                          className="text-xs text-muted-foreground"
                          title="Root partner is managed by the platform."
                        >
                          —
                        </span>
                      ) : (
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
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <EditUserDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <DeleteUserDialog
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
          Could not load team members
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

type FormState = {
  email: string;
  password: string;
  isActive: boolean;
  permissionKeys: string[];
};

const emptyForm: FormState = {
  email: '',
  password: '',
  isActive: true,
  permissionKeys: [],
};

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm);
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      api.post<PartnerStaffUser>('/partner/users', {
        email: form.email,
        password: form.password,
        isActive: form.isActive,
        permissionKeys: form.permissionKeys,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEY });
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
          <DialogTitle>Add team member</DialogTitle>
          <DialogDescription>
            They&apos;ll get partner access immediately. Permissions can be
            adjusted later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <UserFormFields
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
              {mutation.isPending ? 'Creating…' : 'Create team member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  target,
  onClose,
}: {
  target: PartnerStaffUser | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!target) return;
    setForm({
      email: target.email,
      password: '',
      isActive: target.isActive,
      permissionKeys: target.assignedPermissionKeys,
    });
  }, [target]);

  // Two endpoints: basic info, then permissions. Sequenced so a failure in
  // either is surfaced cleanly. List invalidates on success.
  const mutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        email: form.email,
        isActive: form.isActive,
      };
      if (form.password.trim()) body.password = form.password;
      await api.put<PartnerStaffUser>(`/partner/users/${target!.id}`, body);
      await api.put(`/partner/users/${target!.id}/permissions`, {
        permissionKeys: form.permissionKeys,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEY });
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
          <DialogTitle>Edit team member</DialogTitle>
          <DialogDescription>
            Leave password blank to keep the current one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <UserFormFields
            mode="edit"
            form={form}
            onChange={setForm}
            error={mutation.error}
          />

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

function UserFormFields({
  mode,
  form,
  onChange,
  error,
}: {
  mode: 'create' | 'edit';
  form: FormState;
  onChange: (next: FormState) => void;
  error: unknown;
}) {
  const apiErr = error instanceof ApiError ? error : null;
  const fieldErrors = apiErr?.fieldErrors ?? null;
  const bannerMessage = bannerFromError(error, KNOWN_FORM_FIELDS);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    onChange({ ...form, [key]: value });

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

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set('isActive', e.target.checked)}
        />
        Account active
      </label>

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

      {bannerMessage && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {bannerMessage}
        </p>
      )}
    </>
  );
}

/**
 * Combine `formErrors` and any field errors that don't bind to a known FE
 * field (e.g. `partnerUserLimit`, `permissionKeys`) into one banner string.
 */
function bannerFromError(
  error: unknown,
  knownFields: ReadonlyArray<string>
): string | null {
  if (!error) return null;
  if (!(error instanceof ApiError))
    return 'Unexpected error. Please try again.';

  const fieldErrors = error.fieldErrors;
  const formErrors = error.formErrors;
  const messages: string[] = [];

  if (formErrors?.length) messages.push(...formErrors);
  if (fieldErrors) {
    for (const [key, msgs] of Object.entries(fieldErrors)) {
      if (!msgs?.length) continue;
      const isKnown = knownFields.some(
        (f) => key === f || key.startsWith(`${f}.`)
      );
      if (!isKnown) messages.push(...msgs);
    }
  }

  if (messages.length > 0) return messages.join(' ');

  const hasInline =
    fieldErrors &&
    Object.keys(fieldErrors).some((k) =>
      knownFields.some((f) => k === f || k.startsWith(`${f}.`))
    );
  if (hasInline) return null;
  return error.message;
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

function DeleteUserDialog({
  target,
  onClose,
}: {
  target: PartnerStaffUser | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.delete(`/partner/users/${target!.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAM_KEY });
      onClose();
    },
  });

  const handleClose = () => {
    if (mutation.isPending) return;
    mutation.reset();
    onClose();
  };

  const errorMessage = bannerFromError(mutation.error, []);

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(next) => !next && handleClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove team member</DialogTitle>
          <DialogDescription>
            {target
              ? `${target.email} will lose access immediately.`
              : ''}
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
            {mutation.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
