import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  Copy,
  MoreHorizontal,
  Package,
  Plus,
  ShieldAlert,
  Tag,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import {
  api,
  ApiError,
  collectFieldErrors,
  generalApiErrorMessage,
} from '@/lib/api';
import { useMe } from '@/lib/auth';
import type {
  PartnerPackage,
  PartnerPackagePayload,
  PartnerServiceType,
} from '@/types/api';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { usePageTitle } from '@/lib/use-page-title';

const PACKAGES_KEY = ['partner', 'packages'] as const;

export function Packages() {
  usePageTitle('Packages');
  const me = useMe();
  const queryClient = useQueryClient();
  const assignedServices = me?.partnerProfile?.serviceTypes ?? [];
  const packageLimit = me?.partnerProfile?.partnerPackageLimit ?? null;

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PartnerPackage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartnerPackage | null>(null);
  const [actionError, setActionError] = useState<{
    message: string;
    isLimit: boolean;
  } | null>(null);

  const query = useQuery({
    queryKey: PACKAGES_KEY,
    queryFn: () => api.get<PartnerPackage[]>('/partner/packages'),
    retry: false,
  });

  const packages = query.data?.data ?? [];
  const used = packages.length;
  const atLimit = packageLimit !== null && used >= packageLimit;

  const noAssignedServices = assignedServices.length === 0;

  const duplicateMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<PartnerPackage>(`/partner/packages/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PACKAGES_KEY });
      setActionError(null);
    },
    onError: (error) => {
      const limit = extractLimitError(error);
      if (limit) {
        setActionError({ message: limit, isLimit: true });
        return;
      }
      const general = generalApiErrorMessage(error);
      setActionError({
        message: general ?? 'Could not duplicate this package.',
        isLimit: false,
      });
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Packages</h1>
          <p className="text-sm text-muted-foreground">
            Publish fixed-price packages your customers can pick from before
            booking.
          </p>
          {packageLimit !== null && !query.isPending && (
            <p
              className={cn(
                'mt-2 text-sm',
                atLimit ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              <span className="font-medium">
                {used} of {packageLimit} packages used
              </span>
              {atLimit && (
                <span> — remove a package or contact admin to add more.</span>
              )}
            </p>
          )}
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={atLimit || noAssignedServices}
          title={
            atLimit
              ? 'Package limit reached'
              : noAssignedServices
              ? 'You have no assigned services to publish under'
              : undefined
          }
        >
          <Plus />
          Add package
        </Button>
      </div>

      {noAssignedServices && !query.isError && (
        <Card className="border-amber-300/40 bg-amber-50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="size-5" />
              No services assigned
            </CardTitle>
            <CardDescription className="text-amber-900/80">
              You can only publish packages under the services your business is
              approved for. Update your application or contact your admin to
              add services.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {actionError && (
        <div
          role="alert"
          className={cn(
            'rounded-md border p-3 text-sm mb-4 flex items-start gap-3',
            actionError.isLimit
              ? 'border-amber-300/60 bg-amber-50 text-amber-900'
              : 'border-destructive/30 bg-destructive/5 text-destructive'
          )}
        >
          <div className="flex-1">
            {actionError.isLimit ? (
              <>
                <p className="font-medium">Package limit reached</p>
                <p className="text-xs mt-0.5">
                  {actionError.message} Contact admin to increase your package
                  limit.
                </p>
              </>
            ) : (
              <p>{actionError.message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="Dismiss"
            className="shrink-0 rounded p-1 hover:bg-foreground/[0.06]"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {query.isError ? (
        <ErrorState error={query.error} />
      ) : (
        <div className="bg-background rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
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
              {!query.isPending && packages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10">
                    <EmptyState
                      onCreate={() => setCreateOpen(true)}
                      disabled={atLimit || noAssignedServices}
                    />
                  </TableCell>
                </TableRow>
              )}
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      {pkg.name}
                      {pkg.badgeLabel && (
                        <Badge variant="default" className="gap-1">
                          <Tag className="size-3" />
                          {pkg.badgeLabel}
                        </Badge>
                      )}
                    </div>
                    {pkg.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 max-w-md">
                        {pkg.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {pkg.serviceType?.name ?? '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(pkg.price, pkg.currency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDuration(pkg.estimatedDurationMinutes)}
                  </TableCell>
                  <TableCell>
                    {pkg.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
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
                        <DropdownMenuItem onClick={() => setEditTarget(pkg)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={
                            atLimit ||
                            (duplicateMutation.isPending &&
                              duplicateMutation.variables === pkg.id)
                          }
                          onClick={() => {
                            setActionError(null);
                            duplicateMutation.mutate(pkg.id);
                          }}
                        >
                          <Copy className="size-4" />
                          {duplicateMutation.isPending &&
                          duplicateMutation.variables === pkg.id
                            ? 'Duplicating…'
                            : 'Duplicate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(pkg)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreatePackageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        assignedServices={assignedServices}
      />
      <EditPackageDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
        assignedServices={assignedServices}
      />
      <DeletePackageDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

// ----- Empty / Error states ----------------------------------------------

function EmptyState({
  onCreate,
  disabled,
}: {
  onCreate: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="size-12 rounded-full bg-primary/10 text-primary grid place-items-center">
        <Package className="size-5" />
      </div>
      <div>
        <p className="font-medium">No packages yet</p>
        <p className="text-sm text-muted-foreground max-w-sm mt-0.5">
          Publish fixed-price packages so customers can book without waiting
          for a custom quote.
        </p>
      </div>
      {!disabled && (
        <Button onClick={onCreate} size="sm">
          <Plus className="size-4" />
          Create your first package
        </Button>
      )}
    </div>
  );
}

function ErrorState({ error }: { error: unknown }) {
  if (error instanceof ApiError && error.code === 'FORBIDDEN') {
    const message = error.formErrors?.[0] ?? error.message;
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
          Could not load packages
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

// ----- Form schema --------------------------------------------------------

const packageSchema = z.object({
  serviceTypeId: z.string().uuid('Pick a service'),
  name: z
    .string()
    .min(2, 'Package name must be at least 2 characters')
    .max(120, 'Package name is too long'),
  description: z
    .string()
    .min(3, 'Package description must be at least 3 characters')
    .max(500, 'Package description is too long'),
  price: z
    .number({ message: 'Enter a price' })
    .min(0, 'Price must be 0 or more'),
  currency: z
    .string()
    .length(3, 'Currency code must be 3 letters'),
  estimatedDurationMinutes: z
    .number({ message: 'Enter a duration' })
    .int('Duration must be a whole number of minutes')
    .min(1, 'Estimated duration must be greater than 0 minutes'),
  features: z
    .array(z.string().min(1).max(120))
    .min(1, 'At least one package feature is required')
    .max(20, 'Maximum of 20 features')
    .refine(
      (arr) => new Set(arr.map((s) => s.toLowerCase())).size === arr.length,
      'Features must be unique'
    ),
  badgeLabel: z
    .string()
    .max(40, 'Badge is too long')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean(),
  sortOrder: z
    .number({ message: 'Enter a sort order' })
    .int('Sort order must be a whole number')
    .min(0, 'Sort order must be 0 or more'),
});

type PackageFormValues = z.infer<typeof packageSchema>;

const DEFAULTS: PackageFormValues = {
  serviceTypeId: '',
  name: '',
  description: '',
  price: 0,
  currency: 'PHP',
  estimatedDurationMinutes: 60,
  features: [],
  badgeLabel: '',
  isActive: true,
  sortOrder: 0,
};

// API sometimes returns numeric fields as strings (e.g. price = "1700.00").
// Coerce here so the form's number inputs render the value instead of going
// blank because `Number.isFinite("1700")` is false.
// Render value for a <input type="number">. Accepts numbers OR numeric
// strings; returns '' for anything else so the field doesn't choke.
function toNumberInputValue(v: unknown): number | string {
  if (typeof v === 'number') return Number.isFinite(v) ? v : '';
  if (typeof v === 'string' && v !== '' && Number.isFinite(Number(v))) {
    return v;
  }
  return '';
}

function toNumber(v: unknown, fallback: number): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function valuesFromPackage(pkg: PartnerPackage): PackageFormValues {
  return {
    serviceTypeId: pkg.serviceTypeId,
    name: pkg.name,
    description: pkg.description,
    price: toNumber(pkg.price, 0),
    currency: pkg.currency,
    estimatedDurationMinutes: toNumber(pkg.estimatedDurationMinutes, 60),
    features: pkg.features,
    badgeLabel: pkg.badgeLabel ?? '',
    isActive: pkg.isActive,
    sortOrder: toNumber(pkg.sortOrder, 0),
  };
}

function toPayload(values: PackageFormValues): PartnerPackagePayload {
  const trimmedFeatures = values.features
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
  return {
    serviceTypeId: values.serviceTypeId,
    name: values.name.trim(),
    description: values.description.trim(),
    price: values.price,
    currency: values.currency.toUpperCase(),
    estimatedDurationMinutes: values.estimatedDurationMinutes,
    features: trimmedFeatures,
    badgeLabel: values.badgeLabel?.trim() ? values.badgeLabel.trim() : null,
    isActive: values.isActive,
    sortOrder: values.sortOrder,
  };
}

// ----- Create dialog ------------------------------------------------------

function CreatePackageDialog({
  open,
  onOpenChange,
  assignedServices,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignedServices: PartnerServiceType[];
}) {
  const queryClient = useQueryClient();

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: DEFAULTS,
    mode: 'onBlur',
  });

  // Reset on open so previous attempts don't leak in.
  useEffect(() => {
    if (open) {
      form.reset(DEFAULTS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const mutation = useMutation({
    mutationFn: (payload: PartnerPackagePayload) =>
      api.post<PartnerPackage>('/partner/packages', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PACKAGES_KEY });
      onOpenChange(false);
    },
    onError: (error) => applyServerErrors(error, form),
  });

  const onSubmit = form.handleSubmit((values) =>
    mutation.mutate(toPayload(values))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create package</DialogTitle>
          <DialogDescription>
            Customers will see this when they book one of your services.
          </DialogDescription>
        </DialogHeader>
        <PackageForm
          form={form}
          assignedServices={assignedServices}
          submitting={mutation.isPending}
          generalError={generalApiErrorMessage(mutation.error)}
          limitError={extractLimitError(mutation.error)}
          submitLabel={mutation.isPending ? 'Creating…' : 'Create package'}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// ----- Edit dialog --------------------------------------------------------

function EditPackageDialog({
  target,
  onClose,
  assignedServices,
}: {
  target: PartnerPackage | null;
  onClose: () => void;
  assignedServices: PartnerServiceType[];
}) {
  const queryClient = useQueryClient();
  const open = target !== null;

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: DEFAULTS,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (target) {
      form.reset(valuesFromPackage(target));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.id]);

  const mutation = useMutation({
    mutationFn: (payload: PartnerPackagePayload) =>
      api.put<PartnerPackage>(`/partner/packages/${target!.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PACKAGES_KEY });
      onClose();
    },
    onError: (error) => applyServerErrors(error, form),
  });

  const onSubmit = form.handleSubmit((values) =>
    mutation.mutate(toPayload(values))
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit package</DialogTitle>
          <DialogDescription>
            Changes are visible to customers immediately if the package is
            active.
          </DialogDescription>
        </DialogHeader>
        <PackageForm
          form={form}
          assignedServices={assignedServices}
          submitting={mutation.isPending}
          generalError={generalApiErrorMessage(mutation.error)}
          limitError={extractLimitError(mutation.error)}
          submitLabel={mutation.isPending ? 'Saving…' : 'Save changes'}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

// ----- Delete dialog ------------------------------------------------------

function DeletePackageDialog({
  target,
  onClose,
}: {
  target: PartnerPackage | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const open = target !== null;

  const mutation = useMutation({
    mutationFn: () => api.delete(`/partner/packages/${target!.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PACKAGES_KEY });
      onClose();
    },
  });

  const errorMessage = generalApiErrorMessage(mutation.error);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          mutation.reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            Delete package
          </DialogTitle>
          <DialogDescription>
            This will remove{' '}
            <span className="font-semibold text-foreground">
              {target?.name}
            </span>{' '}
            from customer-facing listings. This can't be undone.
          </DialogDescription>
        </DialogHeader>
        {errorMessage && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Deleting…' : 'Delete package'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- Shared form body ---------------------------------------------------

function PackageForm({
  form,
  assignedServices,
  submitting,
  generalError,
  limitError,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  form: ReturnType<typeof useForm<PackageFormValues>>;
  assignedServices: PartnerServiceType[];
  submitting: boolean;
  generalError: string | null;
  limitError: string | null;
  submitLabel: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-5">
        <FormField
          control={form.control}
          name="serviceTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pick the service this package is for" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedServices.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No services assigned to you.
                      </div>
                    ) : (
                      assignedServices.map((s) => (
                        <SelectItem key={s.serviceTypeId} value={s.serviceTypeId}>
                          {s.serviceType.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-4 items-start">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Package name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Deep Turnover" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="badgeLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Badge (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Popular" {...field} />
                </FormControl>
                <FormDescription>
                  Short tag shown next to the name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="What's included and who it's for."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid sm:grid-cols-3 gap-4 items-start">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={toNumberInputValue(field.value)}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === '' ? NaN : Number(v));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input maxLength={3} {...field} />
                </FormControl>
                <FormDescription>3-letter code (e.g. PHP).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estimatedDurationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={toNumberInputValue(field.value)}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === '' ? NaN : Math.floor(Number(v)));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features</FormLabel>
              <FormDescription>
                What's included? Press Enter to add each item.
              </FormDescription>
              <FormControl>
                <FeaturesInput
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-4 items-start">
          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sort order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={toNumberInputValue(field.value)}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === '' ? NaN : Math.floor(Number(v)));
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Lower numbers appear first.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibility</FormLabel>
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <span>Show this package to customers</span>
                </label>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {limitError && (
          <div
            role="alert"
            className="rounded-md border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900"
          >
            <p className="font-medium">Package limit reached</p>
            <p className="text-xs mt-0.5">
              {limitError} Contact admin to increase your package limit.
            </p>
          </div>
        )}
        {!limitError && generalError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {generalError}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// ----- Features chips input ----------------------------------------------

function FeaturesInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      setDraft('');
      return;
    }
    if (value.length >= 20) return;
    onChange([...value, trimmed]);
    setDraft('');
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-md border border-input bg-background p-2 space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((f, idx) => (
            <span
              key={`${f}-${idx}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium ring-1 ring-primary/20"
            >
              <Check className="size-3" />
              {f}
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label={`Remove ${f}`}
                className="grid place-items-center rounded-full hover:bg-primary/20 size-4 -mr-0.5"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={
            value.length === 0
              ? 'Type a feature, then press Enter'
              : 'Add another feature…'
          }
          disabled={value.length >= 20}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          disabled={!draft.trim() || value.length >= 20}
        >
          Add
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length}/20 features
      </p>
    </div>
  );
}

// ----- helpers ------------------------------------------------------------

const KNOWN_FIELDS: ReadonlyArray<keyof PackageFormValues> = [
  'serviceTypeId',
  'name',
  'description',
  'price',
  'currency',
  'estimatedDurationMinutes',
  'features',
  'badgeLabel',
  'isActive',
  'sortOrder',
];

function applyServerErrors(
  error: unknown,
  form: ReturnType<typeof useForm<PackageFormValues>>
) {
  if (!(error instanceof ApiError)) return;
  const fieldErrors = error.fieldErrors;
  if (!fieldErrors) return;
  let firstField: keyof PackageFormValues | null = null;
  for (const name of KNOWN_FIELDS) {
    const msgs = collectFieldErrors(fieldErrors, name);
    if (msgs.length === 0) continue;
    form.setError(name, { type: 'server', message: msgs.join(' ') });
    if (!firstField) firstField = name;
  }
  if (firstField) form.setFocus(firstField);
}

function extractLimitError(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const msgs = collectFieldErrors(error.fieldErrors, 'partnerPackageLimit');
  return msgs.length > 0 ? msgs.join(' ') : null;
}

function formatPrice(price: number, currency: string): string {
  const symbol = currency === 'PHP' ? '₱' : '';
  const formatted = price.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return symbol ? `${symbol}${formatted}` : `${currency} ${formatted}`;
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h}h ${m}m`;
}
