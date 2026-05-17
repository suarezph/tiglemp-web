import { useEffect, useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  ClipboardList,
  Eye,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  UserCog,
  X,
  XCircle,
  XOctagon,
} from 'lucide-react';

import {
  api,
  ApiError,
  collectFieldErrors,
  generalApiErrorMessage,
} from '@/lib/api';
import { usePageTitle } from '@/lib/use-page-title';
import { cn } from '@/lib/utils';
import type {
  Address,
  Booking,
  BookingPartnerPackage,
  BookingSelectionMode,
  BookingStatus,
  BookingStatusMeta,
  Customer,
  Partner,
  ServiceType,
} from '@/types/api';
import { AddressFields, emptyAddress } from '@/components/AddressFields';
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

const BOOKINGS_KEY = ['admin', 'bookings'] as const;
const CUSTOMERS_KEY = ['admin', 'customers'] as const;
const PARTNERS_KEY = ['admin', 'partners'] as const;
const SERVICE_TYPES_KEY = ['meta', 'service-types'] as const;

const STATUS_OPTIONS: Array<{ value: BookingStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING_ASSIGNMENT', label: 'Pending assignment' },
  { value: 'AWAITING_PARTNER_APPROVAL', label: 'Awaiting approval' },
  { value: 'PARTNER_APPROVED', label: 'Approved' },
  { value: 'RELEASED', label: 'Released' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function Bookings() {
  usePageTitle('Bookings');
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [viewTarget, setViewTarget] = useState<Booking | null>(null);
  const [assignTarget, setAssignTarget] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const bookingsQuery = useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: () => api.get<Booking[]>('/admin/bookings'),
    retry: false,
  });

  const bookings = useMemo(
    () => bookingsQuery.data?.data ?? [],
    [bookingsQuery.data]
  );

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (!q) return true;
      const haystacks = [
        b.bookingCode,
        b.customer?.fullName,
        b.customer?.user?.email,
        b.guestName,
        b.guestEmail,
        b.partner?.businessName,
        b.serviceType?.name,
        b.packageName,
      ];
      return haystacks.some((s) => s?.toLowerCase().includes(q));
    });
  }, [bookings, statusFilter, search]);

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Create bookings, assign partners, and manage the booking lifecycle.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          New booking
        </Button>
      </div>

      {actionError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive mb-4 flex items-start gap-3"
        >
          <p className="flex-1">{actionError}</p>
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

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Search by code, customer, partner, service, or package"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as BookingStatus | 'ALL')}
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {bookingsQuery.isError ? (
        <ErrorState error={bookingsQuery.error} />
      ) : (
        <div className="bg-background rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[1%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookingsQuery.isPending && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-6"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!bookingsQuery.isPending && filteredBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10">
                    <EmptyState
                      hasAnyBookings={bookings.length > 0}
                      onCreate={() => setCreateOpen(true)}
                    />
                  </TableCell>
                </TableRow>
              )}
              {filteredBookings.map((b) => (
                <TableRow
                  key={b.id}
                  className="cursor-pointer"
                  onClick={() => setViewTarget(b)}
                >
                  <TableCell>
                    <div className="font-medium font-mono text-xs">
                      {b.bookingCode}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {b.selectionMode === 'CUSTOM_REQUEST'
                        ? 'Custom request'
                        : b.packageName ?? '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const c = resolveContact(b);
                      return (
                        <>
                          <div className="font-medium flex items-center gap-2">
                            <span>{c.name ?? '—'}</span>
                            {c.name && (
                              <Badge
                                variant="secondary"
                                className="font-normal text-[10px] py-0 px-1.5 h-4"
                              >
                                {c.isGuest ? 'Guest' : 'Registered'}
                              </Badge>
                            )}
                          </div>
                          {c.email && (
                            <div className="text-xs text-muted-foreground">
                              {c.email}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {b.partner ? (
                      <span className="font-medium">{b.partner.businessName}</span>
                    ) : (
                      <span className="italic text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {b.serviceType?.name ?? '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(b.scheduledAt)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(b.price, b.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} meta={b.statusMeta} />
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <BookingActions
                      booking={b}
                      onView={() => setViewTarget(b)}
                      onDelete={() => setDeleteTarget(b)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <BookingFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          handleMutationSuccess();
          setCreateOpen(false);
        }}
      />
      <BookingFormDialog
        mode="edit"
        target={editTarget}
        open={editTarget !== null}
        onOpenChange={(o) => !o && setEditTarget(null)}
        onSuccess={() => {
          handleMutationSuccess();
          setEditTarget(null);
        }}
      />
      <BookingDetailDialog
        booking={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={() => {
          if (viewTarget) {
            const t = viewTarget;
            setViewTarget(null);
            setEditTarget(t);
          }
        }}
        onAssign={() => {
          if (viewTarget) {
            const t = viewTarget;
            setViewTarget(null);
            setAssignTarget(t);
          }
        }}
        onCancel={() => {
          if (viewTarget) {
            const t = viewTarget;
            setViewTarget(null);
            setCancelTarget(t);
          }
        }}
      />
      <AssignPartnerDialog
        target={assignTarget}
        onClose={() => setAssignTarget(null)}
        onSuccess={() => {
          handleMutationSuccess();
          setAssignTarget(null);
        }}
        onError={(msg) => setActionError(msg)}
      />
      <CancelBookingDialog
        target={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onSuccess={() => {
          handleMutationSuccess();
          setCancelTarget(null);
        }}
      />
      <DeleteBookingDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          handleMutationSuccess();
          setDeleteTarget(null);
        }}
      />
    </>
  );
}

// ----- Row actions --------------------------------------------------------

function BookingActions({
  booking,
  onView,
  onDelete,
}: {
  booking: Booking;
  onView: () => void;
  onDelete: () => void;
}) {
  const canDelete = booking.status !== 'COMPLETED';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal />
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={onView}>
          <Eye className="size-4" /> View details
        </DropdownMenuItem>
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ----- Empty / Error states ----------------------------------------------

function EmptyState({
  hasAnyBookings,
  onCreate,
}: {
  hasAnyBookings: boolean;
  onCreate: () => void;
}) {
  if (hasAnyBookings) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        No bookings match the current filter.
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="size-12 rounded-full bg-primary/10 text-primary grid place-items-center">
        <ClipboardList className="size-5" />
      </div>
      <div>
        <p className="font-medium">No bookings yet</p>
        <p className="text-sm text-muted-foreground max-w-md mt-0.5">
          Create the first booking. Assigning a partner is optional — unassigned
          bookings will sit in PENDING_ASSIGNMENT until one is picked.
        </p>
      </div>
      <Button onClick={onCreate} size="sm">
        <Plus className="size-4" /> Create booking
      </Button>
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
          Could not load bookings
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

// ----- Status badge -------------------------------------------------------

function StatusBadge({
  status,
  meta,
}: {
  status: BookingStatus;
  meta?: BookingStatusMeta;
}) {
  const label = meta?.label ?? STATUS_LABEL[status];
  const className = STATUS_BADGE_CLASS[status];
  return <Badge className={cn('font-normal', className)}>{label}</Badge>;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING_ASSIGNMENT: 'Pending assignment',
  AWAITING_PARTNER_APPROVAL: 'Awaiting approval',
  PARTNER_APPROVED: 'Approved',
  RELEASED: 'Released',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_BADGE_CLASS: Record<BookingStatus, string> = {
  PENDING_ASSIGNMENT: 'bg-muted text-muted-foreground hover:bg-muted',
  AWAITING_PARTNER_APPROVAL: 'bg-amber-100 text-amber-900 hover:bg-amber-100',
  PARTNER_APPROVED: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-100',
  RELEASED: 'bg-rose-100 text-rose-900 hover:bg-rose-100',
  IN_PROGRESS: 'bg-sky-100 text-sky-900 hover:bg-sky-100',
  COMPLETED: 'bg-foreground text-background hover:bg-foreground/90',
  CANCELLED: 'bg-muted text-muted-foreground hover:bg-muted line-through',
};

// ----- Create/Edit dialog ------------------------------------------------

const addressZ: z.ZodType<Address> = z.object({
  label: z.string().min(2).max(80),
  line1: z.string().min(3).max(150),
  line2: z.string().max(150).nullable().optional(),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  postalCode: z.string().min(3).max(20),
  country: z.string().min(2).max(80),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

const bookingFormSchema = z
  .object({
    customerId: z.string().uuid('Pick a customer'),
    partnerId: z.string().uuid().nullable().optional(),
    serviceTypeId: z.string().uuid('Pick a service'),
    selectionMode: z.enum(['PACKAGE', 'CUSTOM_REQUEST']),
    partnerPackageId: z.string().uuid().nullable().optional(),
    customRequestText: z.string().nullable().optional(),
    customRequestBudget: z
      .union([z.number(), z.nan()])
      .nullable()
      .optional(),
    scheduledAt: z.string().min(1, 'Pick a date and time'),
    currency: z
      .string()
      .min(3, 'Currency code must be 3 letters')
      .max(3, 'Currency code must be 3 letters'),
    notes: z.string().max(500).optional().or(z.literal('')),
    includeAddress: z.boolean(),
    serviceAddress: addressZ.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.selectionMode === 'PACKAGE') {
      if (!data.partnerPackageId) {
        ctx.addIssue({
          code: 'custom',
          path: ['partnerPackageId'],
          message: 'Pick a package',
        });
      }
      if (!data.partnerId) {
        ctx.addIssue({
          code: 'custom',
          path: ['partnerId'],
          message: 'Pick a partner to use a package',
        });
      }
    }
    if (data.selectionMode === 'CUSTOM_REQUEST') {
      const text = data.customRequestText?.trim() ?? '';
      if (text.length < 3) {
        ctx.addIssue({
          code: 'custom',
          path: ['customRequestText'],
          message: 'Describe the request (min 3 characters)',
        });
      }
      if (text.length > 1000) {
        ctx.addIssue({
          code: 'custom',
          path: ['customRequestText'],
          message: 'Custom request must not exceed 1000 characters',
        });
      }
    }
    if (data.includeAddress) {
      const result = addressZ.safeParse(data.serviceAddress ?? {});
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({
            code: 'custom',
            path: ['serviceAddress', ...issue.path],
            message: issue.message,
          });
        }
      }
    }
  });

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const FORM_DEFAULTS: BookingFormValues = {
  customerId: '',
  partnerId: null,
  serviceTypeId: '',
  selectionMode: 'PACKAGE',
  partnerPackageId: null,
  customRequestText: '',
  customRequestBudget: null,
  scheduledAt: '',
  currency: 'PHP',
  notes: '',
  includeAddress: true,
  serviceAddress: { ...emptyAddress, country: 'Philippines' },
};

function valuesFromBooking(b: Booking): BookingFormValues {
  return {
    customerId: b.customerId ?? '',
    partnerId: b.partnerId,
    serviceTypeId: b.serviceTypeId,
    selectionMode: b.selectionMode ?? 'PACKAGE',
    partnerPackageId: b.partnerPackageId,
    customRequestText: b.customRequestText ?? '',
    customRequestBudget:
      b.customRequestBudget !== null && b.customRequestBudget !== undefined
        ? toNumber(b.customRequestBudget)
        : null,
    scheduledAt: toDatetimeLocal(b.scheduledAt),
    currency: b.currency || 'PHP',
    notes: b.notes ?? '',
    includeAddress: !!b.serviceAddress,
    serviceAddress: b.serviceAddress
      ? { ...emptyAddress, ...b.serviceAddress }
      : { ...emptyAddress, country: 'Philippines' },
  };
}

type BookingFormDialogProps = {
  mode: 'create' | 'edit';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  target?: Booking | null;
  onSuccess: () => void;
};

function BookingFormDialog({
  mode,
  open: openProp,
  onOpenChange,
  target,
  onSuccess,
}: BookingFormDialogProps) {
  const open = openProp ?? false;

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema) as Resolver<BookingFormValues>,
    defaultValues: FORM_DEFAULTS,
    mode: 'onBlur',
  });

  // Reset when (re)opening or switching targets.
  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && target) {
      form.reset(valuesFromBooking(target));
    } else {
      form.reset(FORM_DEFAULTS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target?.id, mode]);

  // Dropdown data: only fetch while the dialog is open.
  const customersQuery = useQuery({
    queryKey: CUSTOMERS_KEY,
    queryFn: () => api.get<Customer[]>('/admin/customers'),
    enabled: open,
  });
  const partnersQuery = useQuery({
    queryKey: PARTNERS_KEY,
    queryFn: () => api.get<Partner[]>('/admin/partners'),
    enabled: open,
  });
  const serviceTypesQuery = useQuery({
    queryKey: SERVICE_TYPES_KEY,
    queryFn: () => api.get<ServiceType[]>('/meta/service-types'),
    enabled: open,
    staleTime: 60_000,
  });

  const customers = customersQuery.data?.data ?? [];
  const approvedPartners = useMemo(
    () =>
      (partnersQuery.data?.data ?? []).filter(
        (p) => p.approvalStatus === 'APPROVED' && !p.isBanned
      ),
    [partnersQuery.data]
  );
  const serviceTypes = serviceTypesQuery.data?.data ?? [];

  const selectionMode = form.watch('selectionMode');
  const serviceTypeId = form.watch('serviceTypeId');
  const partnerId = form.watch('partnerId');

  // Fetch the selected partner's packages when needed. Endpoint may not exist
  // yet — in that case the picker shows "No active packages".
  const packagesQuery = useQuery({
    queryKey: ['admin', 'partner-packages', partnerId],
    queryFn: () =>
      api.get<BookingPartnerPackage[]>(`/admin/partners/${partnerId}/packages`),
    enabled: open && !!partnerId && selectionMode === 'PACKAGE',
    retry: false,
  });

  const packagesForService = useMemo(() => {
    const all = packagesQuery.data?.data ?? [];
    return all.filter(
      (p) =>
        p.serviceTypeId === serviceTypeId && (p.isActive ?? true)
    );
  }, [packagesQuery.data, serviceTypeId]);

  // Drop a stale partnerPackageId when service or partner changes.
  useEffect(() => {
    const current = form.getValues('partnerPackageId');
    if (current && !packagesForService.some((p) => p.id === current)) {
      form.setValue('partnerPackageId', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceTypeId, partnerId]);

  const createMutation = useMutation({
    mutationFn: (payload: AdminCreateBookingPayload) =>
      api.post<Booking>('/admin/bookings', payload),
    onSuccess,
    onError: (error) => applyServerErrors(error, form),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: AdminUpdateBookingPayload) =>
      api.put<Booking>(`/admin/bookings/${target!.id}`, payload),
    onSuccess,
    onError: (error) => applyServerErrors(error, form),
  });

  const mutation = mode === 'create' ? createMutation : updateMutation;

  const onSubmit = form.handleSubmit((values) => {
    if (mode === 'create') {
      createMutation.mutate(toCreatePayload(values));
    } else {
      updateMutation.mutate(toUpdatePayload(values));
    }
  });

  const closing = () => onOpenChange?.(false);

  return (
    <Dialog open={open} onOpenChange={(o) => onOpenChange?.(o)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'New booking' : 'Edit booking'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a booking on behalf of a customer. Assigning a partner is optional.'
              : `Update ${target?.bookingCode ?? 'this booking'}.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} noValidate className="grid gap-5">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={mode === 'edit'}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            customersQuery.isPending
                              ? 'Loading…'
                              : 'Pick a customer'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No customers.
                          </div>
                        ) : (
                          customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.fullName}
                              {c.user?.email ? ` — ${c.user.email}` : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {mode === 'edit' && (
                    <FormDescription>
                      Customer can't be changed after creation.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid sm:grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="serviceTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              serviceTypesQuery.isPending
                                ? 'Loading…'
                                : 'Pick a service'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypes.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              No services found.
                            </div>
                          ) : (
                            serviceTypes.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
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

              <FormField
                control={form.control}
                name="partnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? 'none'}
                        onValueChange={(v) =>
                          field.onChange(v === 'none' ? null : v)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              partnersQuery.isPending ? 'Loading…' : 'Unassigned'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {approvedPartners.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.businessName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Required if you pick a package. Otherwise the booking
                      starts in PENDING_ASSIGNMENT.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="selectionMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking type</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(v as BookingSelectionMode)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PACKAGE">Package</SelectItem>
                        <SelectItem value="CUSTOM_REQUEST">
                          Custom request
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectionMode === 'PACKAGE' && (
              <FormField
                control={form.control}
                name="partnerPackageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(v) => field.onChange(v || null)}
                        disabled={!partnerId || !serviceTypeId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              !partnerId
                                ? 'Pick a partner first'
                                : !serviceTypeId
                                ? 'Pick a service first'
                                : packagesQuery.isPending
                                ? 'Loading…'
                                : 'Pick a package'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {packagesForService.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              No active packages for this partner and service.
                            </div>
                          ) : (
                            packagesForService.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} — {formatPrice(p.price, p.currency)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Price comes from the package and overrides any manual
                      price.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectionMode === 'CUSTOM_REQUEST' && (
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="customRequestText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom request</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          maxLength={1000}
                          placeholder="Describe what the customer wants done."
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customRequestBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          value={
                            field.value === null ||
                            field.value === undefined ||
                            Number.isNaN(field.value)
                              ? ''
                              : field.value
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(v === '' ? null : Number(v));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled date &amp; time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={field.value}
                        onChange={field.onChange}
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
                    <FormDescription>3-letter code, e.g. PHP.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="includeAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service location</FormLabel>
                  <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    <span>This booking has a service address (on-site).</span>
                  </label>
                  <FormDescription>Uncheck for in-shop bookings.</FormDescription>
                </FormItem>
              )}
            />

            {form.watch('includeAddress') && (
              <FormField
                control={form.control}
                name="serviceAddress"
                render={({ field }) => {
                  const fieldErrors =
                    (form.formState.errors.serviceAddress as
                      | Record<string, { message?: string } | undefined>
                      | undefined) ?? {};
                  const errs: Record<string, string[]> = {};
                  for (const k of [
                    'label',
                    'line1',
                    'line2',
                    'city',
                    'state',
                    'postalCode',
                    'country',
                  ] as const) {
                    const msg = fieldErrors[k]?.message;
                    if (msg) errs[k] = [msg];
                  }
                  return (
                    <FormItem>
                      <AddressFields
                        idPrefix="booking-address"
                        value={field.value ?? emptyAddress}
                        onChange={(v) => field.onChange(v)}
                        errors={errs as Partial<Record<keyof Address, string[]>>}
                      />
                    </FormItem>
                  );
                }}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      maxLength={500}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {generalApiErrorMessage(mutation.error) && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {generalApiErrorMessage(mutation.error)}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closing}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? mode === 'create'
                    ? 'Creating…'
                    : 'Saving…'
                  : mode === 'create'
                  ? 'Create booking'
                  : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ----- Detail dialog ------------------------------------------------------

function BookingDetailDialog({
  booking,
  onClose,
  onEdit,
  onAssign,
  onCancel,
}: {
  booking: Booking | null;
  onClose: () => void;
  onEdit: () => void;
  onAssign: () => void;
  onCancel: () => void;
}) {
  const open = booking !== null;
  // Always pull fresh data when opened (covers status changes elsewhere).
  const detailQuery = useQuery({
    queryKey: ['admin', 'bookings', booking?.id],
    queryFn: () => api.get<Booking>(`/admin/bookings/${booking!.id}`),
    enabled: open,
  });

  const fresh = detailQuery.data?.data ?? booking;

  if (!fresh) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </DialogContent>
      </Dialog>
    );
  }

  const canEdit = fresh.status !== 'COMPLETED';
  const canCancel =
    fresh.status !== 'COMPLETED' && fresh.status !== 'CANCELLED';
  const contact = resolveContact(fresh);
  const detailBlobs = pickDetailBlobs(fresh);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-sm">{fresh.bookingCode}</span>
            <StatusBadge status={fresh.status} meta={fresh.statusMeta} />
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Calendar className="size-3.5" />
            {formatDateTime(fresh.scheduledAt)}
          </DialogDescription>
          {fresh.statusMeta?.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {fresh.statusMeta.description}
            </p>
          )}
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <DetailField label="Customer">
              <div className="font-medium flex items-center gap-2 flex-wrap">
                <span>{contact.name ?? '—'}</span>
                {contact.name && (
                  <Badge
                    variant="secondary"
                    className="font-normal text-[10px] py-0 px-1.5 h-4"
                  >
                    {contact.isGuest ? 'Guest' : 'Registered'}
                  </Badge>
                )}
              </div>
              {contact.email && (
                <div className="text-xs text-muted-foreground">
                  {contact.email}
                </div>
              )}
              {contact.phone && (
                <div className="text-xs text-muted-foreground">
                  {contact.phone}
                </div>
              )}
            </DetailField>
            <DetailField label="Partner">
              {fresh.partner ? (
                <>
                  <div className="font-medium">{fresh.partner.businessName}</div>
                  {(() => {
                    const root =
                      fresh.partner.users?.find((u) => u.isPartnerRoot) ??
                      fresh.partner.users?.[0];
                    return root?.email ? (
                      <div className="text-xs text-muted-foreground">
                        {root.email}
                      </div>
                    ) : null;
                  })()}
                  {fresh.partner.phone && (
                    <div className="text-xs text-muted-foreground">
                      {fresh.partner.phone}
                    </div>
                  )}
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAssign}
                >
                  <UserCog className="size-3.5" /> Assign partner
                </Button>
              )}
            </DetailField>
            <DetailField label="Service">
              <Badge variant="secondary" className="font-normal">
                {fresh.serviceType?.name ?? '—'}
              </Badge>
            </DetailField>
            <DetailField
              label={
                fresh.selectionMode === 'CUSTOM_REQUEST' ? 'Request' : 'Package'
              }
            >
              {fresh.selectionMode === 'CUSTOM_REQUEST' ? (
                <>
                  <p className="whitespace-pre-wrap">
                    {fresh.customRequestText ?? '—'}
                  </p>
                  {fresh.customRequestBudget != null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Budget:{' '}
                      {formatPrice(fresh.customRequestBudget, fresh.currency)}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="font-medium">{fresh.packageName ?? '—'}</div>
                  {fresh.packageEstimatedDurationMinutes != null && (
                    <div className="text-xs text-muted-foreground">
                      {formatDuration(fresh.packageEstimatedDurationMinutes)}
                    </div>
                  )}
                </>
              )}
            </DetailField>
            <DetailField label="Price">
              <div className="font-medium">
                {formatPrice(fresh.price, fresh.currency)}
              </div>
              {fresh.discountPrice != null && (
                <div className="text-xs text-muted-foreground">
                  Discount: {formatPrice(fresh.discountPrice, fresh.currency)}
                </div>
              )}
            </DetailField>
          </div>

          {fresh.serviceAddress && (
            <DetailField label="Service address">
              <AddressBlock address={fresh.serviceAddress} />
            </DetailField>
          )}

          {fresh.notes && (
            <DetailField label="Notes">
              <p className="whitespace-pre-wrap text-sm">{fresh.notes}</p>
            </DetailField>
          )}

          {fresh.releaseComment && (
            <div className="rounded-md border border-rose-300/40 bg-rose-50 p-3 text-sm text-rose-900">
              <p className="font-medium mb-0.5">Release reason</p>
              <p className="whitespace-pre-wrap">{fresh.releaseComment}</p>
            </div>
          )}

          {detailBlobs.length > 0 && (
            <DetailField label="Service-specific details">
              <div className="space-y-2">
                {detailBlobs.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      {label}
                    </p>
                    <pre className="text-xs bg-muted/40 rounded-md p-2 overflow-x-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </DetailField>
          )}

          {fresh.statusLogs && fresh.statusLogs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <History className="size-4" /> Status history
              </div>
              <ol className="space-y-2 text-sm">
                {fresh.statusLogs.map((log) => (
                  <li
                    key={log.id}
                    className="rounded-md border bg-muted/30 p-2 flex items-start gap-2"
                  >
                    <StatusBadge status={log.status} />
                    <div className="flex-1 min-w-0">
                      {(log.note || log.comment) && (
                        <p className="text-xs">{log.note ?? log.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {canEdit && (
            <Button type="button" variant="secondary" onClick={onEdit}>
              <Pencil className="size-4" /> Edit
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onAssign}>
            <UserCog className="size-4" />
            {fresh.partner ? 'Reassign partner' : 'Assign partner'}
          </Button>
          {canCancel && (
            <Button type="button" variant="destructive" onClick={onCancel}>
              <XOctagon className="size-4" /> Cancel booking
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function AddressBlock({ address }: { address: Address }) {
  return (
    <div className="text-sm leading-relaxed">
      <div className="font-medium">{address.label}</div>
      <div>{address.line1}</div>
      {address.line2 && <div>{address.line2}</div>}
      <div>
        {[address.city, address.state, address.postalCode]
          .filter(Boolean)
          .join(', ')}
      </div>
      <div>{address.country}</div>
    </div>
  );
}

// ----- Assign-partner dialog ---------------------------------------------

function AssignPartnerDialog({
  target,
  onClose,
  onSuccess,
  onError,
}: {
  target: Booking | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const open = target !== null;
  const [partnerId, setPartnerId] = useState('');

  useEffect(() => {
    if (open) setPartnerId(target?.partnerId ?? '');
  }, [open, target?.partnerId]);

  const partnersQuery = useQuery({
    queryKey: PARTNERS_KEY,
    queryFn: () => api.get<Partner[]>('/admin/partners'),
    enabled: open,
  });

  const approvedPartners = useMemo(
    () =>
      (partnersQuery.data?.data ?? []).filter(
        (p) => p.approvalStatus === 'APPROVED' && !p.isBanned
      ),
    [partnersQuery.data]
  );

  const mutation = useMutation({
    mutationFn: () =>
      api.patch<Booking>(`/admin/bookings/${target!.id}/assign-partner`, {
        partnerId,
      }),
    onSuccess,
    onError: (err) => {
      onError(generalApiErrorMessage(err) ?? 'Could not assign partner.');
      onClose();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          mutation.reset();
          setPartnerId('');
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="size-5" />
            {target?.partner ? 'Reassign partner' : 'Assign partner'}
          </DialogTitle>
          <DialogDescription>
            {target ? (
              <>
                Booking{' '}
                <span className="font-mono text-foreground">
                  {target.bookingCode}
                </span>{' '}
                · {formatDateTime(target.scheduledAt)}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Partner</label>
          <Select value={partnerId} onValueChange={setPartnerId}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  partnersQuery.isPending
                    ? 'Loading…'
                    : 'Select an approved partner'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {approvedPartners.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No approved partners.
                </div>
              ) : (
                approvedPartners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.businessName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Status will move to AWAITING_PARTNER_APPROVAL.
          </p>
        </div>
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
            onClick={() => mutation.mutate()}
            disabled={!partnerId || mutation.isPending}
          >
            {mutation.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- Cancel dialog -----------------------------------------------------

function CancelBookingDialog({
  target,
  onClose,
  onSuccess,
}: {
  target: Booking | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const open = target !== null;
  const mutation = useMutation({
    mutationFn: () =>
      api.patch<Booking>(`/admin/bookings/${target!.id}/cancel`),
    onSuccess,
  });

  // Backend returns the reason under fieldErrors.status for this endpoint.
  const errorMessage = (() => {
    const err = mutation.error;
    if (!(err instanceof ApiError)) {
      return err ? 'Could not cancel booking.' : null;
    }
    const statusErrors = err.fieldErrors?.status;
    if (Array.isArray(statusErrors) && statusErrors.length > 0) {
      return statusErrors[0];
    }
    return generalApiErrorMessage(err) ?? err.message;
  })();

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
            <XOctagon className="size-5 text-destructive" />
            Cancel booking
          </DialogTitle>
          <DialogDescription>
            Cancel{' '}
            <span className="font-mono text-foreground">
              {target?.bookingCode}
            </span>
            ? The booking record stays for audit, but status moves to CANCELLED
            and the customer will see it as cancelled.
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
            Keep booking
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Cancelling…' : 'Cancel booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- Delete dialog -----------------------------------------------------

function DeleteBookingDialog({
  target,
  onClose,
  onSuccess,
}: {
  target: Booking | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const open = target !== null;
  const mutation = useMutation({
    mutationFn: () => api.delete(`/admin/bookings/${target!.id}`),
    onSuccess,
  });

  const message = generalApiErrorMessage(mutation.error);

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
            Delete booking
          </DialogTitle>
          <DialogDescription>
            This removes{' '}
            <span className="font-mono text-foreground">
              {target?.bookingCode}
            </span>{' '}
            permanently. This can't be undone.
          </DialogDescription>
        </DialogHeader>
        {message && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {message}
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
            {mutation.isPending ? 'Deleting…' : 'Delete booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- Payload + server-error helpers ------------------------------------

type AdminCreateBookingPayload = {
  customerId: string;
  partnerId?: string | null;
  serviceTypeId: string;
  selectionMode: BookingSelectionMode;
  partnerPackageId?: string | null;
  customRequestText?: string | null;
  customRequestBudget?: number | null;
  scheduledAt: string;
  serviceAddress?: Address | null;
  currency?: string;
  notes?: string | null;
};

type AdminUpdateBookingPayload = AdminCreateBookingPayload;

function toCreatePayload(values: BookingFormValues): AdminCreateBookingPayload {
  const isPackage = values.selectionMode === 'PACKAGE';
  const payload: AdminCreateBookingPayload = {
    customerId: values.customerId,
    serviceTypeId: values.serviceTypeId,
    selectionMode: values.selectionMode,
    scheduledAt: new Date(values.scheduledAt).toISOString(),
    currency: values.currency.toUpperCase(),
    notes: values.notes?.trim() ? values.notes.trim() : null,
  };
  if (values.partnerId) payload.partnerId = values.partnerId;
  if (isPackage) {
    payload.partnerPackageId = values.partnerPackageId ?? null;
  } else {
    payload.customRequestText = values.customRequestText?.trim() || null;
    payload.customRequestBudget =
      values.customRequestBudget != null &&
      !Number.isNaN(values.customRequestBudget)
        ? values.customRequestBudget
        : null;
  }
  if (values.includeAddress && values.serviceAddress) {
    payload.serviceAddress = values.serviceAddress;
  }
  return payload;
}

function toUpdatePayload(values: BookingFormValues): AdminUpdateBookingPayload {
  const isPackage = values.selectionMode === 'PACKAGE';
  const payload: AdminUpdateBookingPayload = {
    customerId: values.customerId,
    serviceTypeId: values.serviceTypeId,
    selectionMode: values.selectionMode,
    scheduledAt: new Date(values.scheduledAt).toISOString(),
    currency: values.currency.toUpperCase(),
    notes: values.notes?.trim() ? values.notes.trim() : null,
    partnerId: values.partnerId ?? null,
  };
  if (isPackage) {
    payload.partnerPackageId = values.partnerPackageId ?? null;
    payload.customRequestText = null;
    payload.customRequestBudget = null;
  } else {
    payload.partnerPackageId = null;
    payload.customRequestText = values.customRequestText?.trim() || null;
    payload.customRequestBudget =
      values.customRequestBudget != null &&
      !Number.isNaN(values.customRequestBudget)
        ? values.customRequestBudget
        : null;
  }
  payload.serviceAddress =
    values.includeAddress && values.serviceAddress
      ? values.serviceAddress
      : null;
  return payload;
}

const FORM_FIELD_KEYS: ReadonlyArray<keyof BookingFormValues> = [
  'customerId',
  'partnerId',
  'serviceTypeId',
  'selectionMode',
  'partnerPackageId',
  'customRequestText',
  'customRequestBudget',
  'scheduledAt',
  'currency',
  'notes',
  'serviceAddress',
];

function applyServerErrors(
  error: unknown,
  form: ReturnType<typeof useForm<BookingFormValues>>
) {
  if (!(error instanceof ApiError)) return;
  const fieldErrors = error.fieldErrors;
  if (!fieldErrors) return;
  let firstField: keyof BookingFormValues | null = null;
  for (const name of FORM_FIELD_KEYS) {
    const msgs = collectFieldErrors(fieldErrors, name);
    if (msgs.length === 0) continue;
    form.setError(name, { type: 'server', message: msgs.join(' ') });
    if (!firstField) firstField = name;
  }
  if (firstField) form.setFocus(firstField);
}

// ----- Booking contact ---------------------------------------------------

type BookingContact = {
  name: string | null;
  email: string | null;
  phone: string | null;
  isGuest: boolean;
};

function resolveContact(b: Booking): BookingContact {
  if (b.customer) {
    return {
      name: b.customer.fullName,
      email: b.customer.user?.email ?? null,
      phone: b.customer.phone ?? null,
      isGuest: false,
    };
  }
  const hasGuest =
    !!b.isGuestBooking || !!b.guestName || !!b.guestEmail || !!b.guestPhone;
  if (hasGuest) {
    return {
      name: b.guestName ?? null,
      email: b.guestEmail ?? null,
      phone: b.guestPhone ?? null,
      isGuest: true,
    };
  }
  return { name: null, email: null, phone: null, isGuest: false };
}

// ----- Service-specific detail blobs -------------------------------------

const DETAIL_BLOB_KEYS = [
  ['carWashDetails', 'Car wash'],
  ['homeCleaningDetails', 'Home cleaning'],
  ['propertyCleaningDetails', 'Property cleaning'],
  ['laundryDetails', 'Laundry'],
  ['transitionServiceDetails', 'Transition service'],
  ['maintenanceCleaningDetails', 'Maintenance cleaning'],
  ['commercialCleaningServiceDetails', 'Commercial cleaning'],
] as const;

function pickDetailBlobs(b: Booking): Array<{ label: string; value: unknown }> {
  const out: Array<{ label: string; value: unknown }> = [];
  for (const [key, label] of DETAIL_BLOB_KEYS) {
    const v = b[key];
    if (v && typeof v === 'object' && Object.keys(v).length > 0) {
      out.push({ label, value: v });
    }
  }
  return out;
}

// ----- Formatting helpers ------------------------------------------------

function toNumber(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatPrice(
  price: number | string | null | undefined,
  currency: string | null | undefined
): string {
  if (price === null || price === undefined) return '—';
  const n = typeof price === 'number' ? price : Number(price);
  if (!Number.isFinite(n)) return '—';
  const symbol = currency === 'PHP' ? '₱' : '';
  const formatted = n.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return symbol ? `${symbol}${formatted}` : `${currency ?? ''} ${formatted}`.trim();
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h}h ${m}m`;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}
