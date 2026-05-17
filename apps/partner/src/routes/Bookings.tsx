import { useEffect, useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  Eye,
  History,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  Plus,
  ShieldAlert,
  X,
  XCircle,
  Unlink,
} from 'lucide-react';

import {
  api,
  ApiError,
  collectFieldErrors,
  generalApiErrorMessage,
} from '@/lib/api';
import { useMe } from '@/lib/auth';
import { usePageTitle } from '@/lib/use-page-title';
import { cn } from '@/lib/utils';
import type {
  Address,
  Booking,
  BookingSelectionMode,
  BookingStatus,
  BookingStatusMeta,
  PartnerBookingCustomer,
  PartnerCreateBookingPayload,
  PartnerPackage,
  PartnerReleaseBookingPayload,
  PartnerUpdateBookingPayload,
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

const BOOKINGS_KEY = ['partner', 'bookings'] as const;
const CUSTOMERS_KEY = ['partner', 'customers'] as const;
const PACKAGES_KEY = ['partner', 'packages'] as const;

const STATUS_OPTIONS: Array<{ value: BookingStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING_ASSIGNMENT', label: 'New booking' },
  { value: 'AWAITING_PARTNER_APPROVAL', label: 'Pending approval' },
  { value: 'PARTNER_APPROVED', label: 'Approved' },
  { value: 'RELEASED', label: 'Released' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function Bookings() {
  usePageTitle('Bookings');
  const me = useMe();
  const queryClient = useQueryClient();
  const assignedServices = me?.partnerProfile?.serviceTypes ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [viewTarget, setViewTarget] = useState<Booking | null>(null);
  const [approveTarget, setApproveTarget] = useState<Booking | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<Booking | null>(null);
  const [startTarget, setStartTarget] = useState<Booking | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const bookingsQuery = useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: () => api.get<Booking[]>('/partner/bookings'),
    retry: false,
  });

  const customersQuery = useQuery({
    queryKey: CUSTOMERS_KEY,
    queryFn: () => api.get<PartnerBookingCustomer[]>('/partner/customers'),
    retry: false,
  });

  const packagesQuery = useQuery({
    queryKey: PACKAGES_KEY,
    queryFn: () => api.get<PartnerPackage[]>('/partner/packages'),
    retry: false,
  });

  const bookings = useMemo(
    () => bookingsQuery.data?.data ?? [],
    [bookingsQuery.data]
  );
  const customers = customersQuery.data?.data ?? [];
  const packages = packagesQuery.data?.data ?? [];

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
        b.serviceType?.name,
        b.packageName,
      ];
      return haystacks.some((s) => s?.toLowerCase().includes(q));
    });
  }, [bookings, statusFilter, search]);

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
  };

  const noAssignedServices = assignedServices.length === 0;
  const noCustomers = !customersQuery.isPending && customers.length === 0;
  const canCreate = !noAssignedServices && !noCustomers;

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Manage bookings assigned to your business — approve, release, or
            create new ones for existing customers.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={!canCreate}
          title={
            noAssignedServices
              ? 'You have no assigned services'
              : noCustomers
              ? 'No existing customers to book for yet'
              : undefined
          }
        >
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
            placeholder="Search by code, customer, service, or package"
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
                    colSpan={7}
                    className="text-center text-muted-foreground py-6"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!bookingsQuery.isPending && filteredBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10">
                    <EmptyState
                      hasAnyBookings={bookings.length > 0}
                      canCreate={canCreate}
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
                      onEdit={() => setEditTarget(b)}
                      onApprove={() => setApproveTarget(b)}
                      onRelease={() => setReleaseTarget(b)}
                      onStart={() => setStartTarget(b)}
                      onComplete={() => setCompleteTarget(b)}
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
        customers={customers}
        packages={packages}
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
        customers={customers}
        packages={packages}
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
            const target = viewTarget;
            setViewTarget(null);
            setEditTarget(target);
          }
        }}
        onApprove={() => {
          if (viewTarget) {
            const target = viewTarget;
            setViewTarget(null);
            setApproveTarget(target);
          }
        }}
        onRelease={() => {
          if (viewTarget) {
            const target = viewTarget;
            setViewTarget(null);
            setReleaseTarget(target);
          }
        }}
        onStart={() => {
          if (viewTarget) {
            const target = viewTarget;
            setViewTarget(null);
            setStartTarget(target);
          }
        }}
        onComplete={() => {
          if (viewTarget) {
            const target = viewTarget;
            setViewTarget(null);
            setCompleteTarget(target);
          }
        }}
      />
      <ApproveBookingDialog
        target={approveTarget}
        onClose={() => setApproveTarget(null)}
        onSuccess={() => {
          handleMutationSuccess();
          setApproveTarget(null);
        }}
        onError={(msg) => setActionError(msg)}
      />
      <ReleaseBookingDialog
        target={releaseTarget}
        onClose={() => setReleaseTarget(null)}
        onSuccess={() => {
          handleMutationSuccess();
          setReleaseTarget(null);
        }}
      />
      <StartBookingDialog
        target={startTarget}
        onClose={() => setStartTarget(null)}
        onSuccess={() => {
          handleMutationSuccess();
          setStartTarget(null);
        }}
        onError={(msg) => setActionError(msg)}
      />
      <CompleteBookingDialog
        target={completeTarget}
        onClose={() => setCompleteTarget(null)}
        onSuccess={() => {
          handleMutationSuccess();
          setCompleteTarget(null);
        }}
        onError={(msg) => setActionError(msg)}
      />
    </>
  );
}

// ----- Row actions --------------------------------------------------------

function BookingActions({
  booking,
  onView,
  onEdit,
  onApprove,
  onRelease,
  onStart,
  onComplete,
}: {
  booking: Booking;
  onView: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onRelease: () => void;
  onStart: () => void;
  onComplete: () => void;
}) {
  const perms = derivePartnerPerms(booking);

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
        {perms.canApprove && (
          <DropdownMenuItem onClick={onApprove}>
            <CheckCircle2 className="size-4" /> Approve
          </DropdownMenuItem>
        )}
        {perms.canRelease && (
          <DropdownMenuItem onClick={onRelease}>
            <Unlink className="size-4" /> Release
          </DropdownMenuItem>
        )}
        {perms.canStart && (
          <DropdownMenuItem onClick={onStart}>
            <PlayCircle className="size-4" /> Mark in progress
          </DropdownMenuItem>
        )}
        {perms.canComplete && (
          <DropdownMenuItem onClick={onComplete}>
            <CheckCheck className="size-4" /> Mark completed
          </DropdownMenuItem>
        )}
        {perms.canEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-4" /> Edit
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type PartnerBookingPerms = {
  canApprove: boolean;
  canRelease: boolean;
  canStart: boolean;
  canComplete: boolean;
  canEdit: boolean;
};

/**
 * Workflow rules for the partner UI.
 *
 * Status drives the UI flow:
 *   AWAITING_PARTNER_APPROVAL → Approve | Release
 *   PARTNER_APPROVED          → Mark in progress
 *   IN_PROGRESS               → Mark completed
 *   RELEASED/COMPLETED/CANCELLED/PENDING_ASSIGNMENT → no transitions
 *
 * The backend's statusMeta flags act as overrides: if a flag is explicitly
 * `false`, the affordance is hidden even when the status would normally allow
 * it (covers cases like "already approved in another tab"). A `true` flag
 * doesn't widen the UI rule — we still only show what the product flow allows.
 */
function derivePartnerPerms(booking: Booking): PartnerBookingPerms {
  const meta = booking.statusMeta;
  const status = booking.status;

  let canApprove = status === 'AWAITING_PARTNER_APPROVAL';
  let canRelease = status === 'AWAITING_PARTNER_APPROVAL';
  let canStart = status === 'PARTNER_APPROVED';
  let canComplete = status === 'IN_PROGRESS';

  if (meta?.partnerCanApprove === false) canApprove = false;
  if (meta?.partnerCanRelease === false) canRelease = false;
  if (meta?.partnerCanStart === false) canStart = false;
  if (meta?.partnerCanComplete === false) canComplete = false;

  return {
    canApprove,
    canRelease,
    canStart,
    canComplete,
    canEdit:
      status === 'AWAITING_PARTNER_APPROVAL' ||
      status === 'PARTNER_APPROVED' ||
      status === 'PENDING_ASSIGNMENT',
  };
}

// ----- Empty / Error states ----------------------------------------------

function EmptyState({
  hasAnyBookings,
  canCreate,
  onCreate,
}: {
  hasAnyBookings: boolean;
  canCreate: boolean;
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
          Bookings assigned to you (or created by customers) show up here. You
          can also create one directly for an existing customer.
        </p>
      </div>
      {canCreate && (
        <Button onClick={onCreate} size="sm">
          <Plus className="size-4" /> Create booking
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
  const label = meta?.label ?? PARTNER_STATUS_LABEL[status];
  const className = STATUS_BADGE_CLASS[status];
  return <Badge className={cn('font-normal', className)}>{label}</Badge>;
}

/**
 * Fallback partner-facing labels, used when statusMeta is missing (e.g. on a
 * BookingStatusLog row, which doesn't carry presentation metadata).
 */
const PARTNER_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING_ASSIGNMENT: 'New booking',
  AWAITING_PARTNER_APPROVAL: 'Pending approval',
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
  customers: PartnerBookingCustomer[];
  packages: PartnerPackage[];
  onSuccess: () => void;
};

function BookingFormDialog({
  mode,
  open: openProp,
  onOpenChange,
  target,
  customers,
  packages,
  onSuccess,
}: BookingFormDialogProps) {
  const me = useMe();
  const open = openProp ?? false;
  const assignedServices = me?.partnerProfile?.serviceTypes ?? [];

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema) as Resolver<BookingFormValues>,
    defaultValues: FORM_DEFAULTS,
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && target) {
      form.reset(valuesFromBooking(target));
    } else {
      form.reset(FORM_DEFAULTS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target?.id, mode]);

  const selectionMode = form.watch('selectionMode');
  const serviceTypeId = form.watch('serviceTypeId');

  const packagesForService = useMemo(
    () => packages.filter((p) => p.serviceTypeId === serviceTypeId && p.isActive),
    [packages, serviceTypeId]
  );

  // If the picked service changes, drop a package selection that no longer
  // matches so the server doesn't reject it.
  useEffect(() => {
    const current = form.getValues('partnerPackageId');
    if (
      current &&
      !packagesForService.some((p) => p.id === current)
    ) {
      form.setValue('partnerPackageId', null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceTypeId]);

  const createMutation = useMutation({
    mutationFn: (payload: PartnerCreateBookingPayload) =>
      api.post<Booking>('/partner/bookings', payload),
    onSuccess: onSuccess,
    onError: (error) => applyServerErrors(error, form),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: PartnerUpdateBookingPayload) =>
      api.put<Booking>(`/partner/bookings/${target!.id}`, payload),
    onSuccess: onSuccess,
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
              ? 'Create a booking for an existing customer.'
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
                        <SelectValue placeholder="Pick a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No customers found.
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
                      Customer can't be changed after the booking is created.
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
                          <SelectValue placeholder="Pick a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignedServices.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              No services assigned.
                            </div>
                          ) : (
                            assignedServices.map((s) => (
                              <SelectItem
                                key={s.serviceTypeId}
                                value={s.serviceTypeId}
                              >
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
            </div>

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
                        disabled={!serviceTypeId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              serviceTypeId
                                ? 'Pick a package'
                                : 'Pick a service first'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {packagesForService.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              No active packages for this service.
                            </div>
                          ) : (
                            packagesForService.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} —{' '}
                                {formatPrice(p.price, p.currency)}
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
                            field.value === null || field.value === undefined ||
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
                    <FormDescription>
                      3-letter code, e.g. PHP.
                    </FormDescription>
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
                  <FormDescription>
                    Uncheck for in-shop bookings.
                  </FormDescription>
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
  onApprove,
  onRelease,
  onStart,
  onComplete,
}: {
  booking: Booking | null;
  onClose: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onRelease: () => void;
  onStart: () => void;
  onComplete: () => void;
}) {
  const open = booking !== null;
  // Always pull fresh data when opened (covers status changes elsewhere).
  const detailQuery = useQuery({
    queryKey: ['partner', 'bookings', booking?.id],
    queryFn: () => api.get<Booking>(`/partner/bookings/${booking!.id}`),
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

  const perms = derivePartnerPerms(fresh);
  const hasFooterActions =
    perms.canApprove || perms.canRelease || perms.canStart || perms.canComplete;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-sm">{fresh.bookingCode}</span>
            <StatusBadge status={fresh.status} meta={fresh.statusMeta} />
            {perms.canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-1 size-7"
                onClick={onEdit}
                title="Edit booking"
              >
                <Pencil className="size-3.5" />
                <span className="sr-only">Edit booking</span>
              </Button>
            )}
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
              {(() => {
                const c = resolveContact(fresh);
                return (
                  <>
                    <div className="font-medium flex items-center gap-2 flex-wrap">
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
                    {c.phone && (
                      <div className="text-xs text-muted-foreground">
                        {c.phone}
                      </div>
                    )}
                  </>
                );
              })()}
            </DetailField>
            <DetailField label="Service">
              <Badge variant="secondary" className="font-normal">
                {fresh.serviceType?.name ?? '—'}
              </Badge>
            </DetailField>
            <DetailField label={fresh.selectionMode === 'CUSTOM_REQUEST' ? 'Request' : 'Package'}>
              {fresh.selectionMode === 'CUSTOM_REQUEST' ? (
                <>
                  <p className="whitespace-pre-wrap">
                    {fresh.customRequestText ?? '—'}
                  </p>
                  {fresh.customRequestBudget != null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Budget: {formatPrice(fresh.customRequestBudget, fresh.currency)}
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
                      {log.note && (
                        <p className="text-xs">{log.note}</p>
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

        {hasFooterActions && (
          <DialogFooter className="flex-wrap gap-2">
            {perms.canRelease && (
              <Button type="button" variant="outline" onClick={onRelease}>
                <Unlink className="size-4" /> Release
              </Button>
            )}
            {perms.canApprove && (
              <Button type="button" onClick={onApprove}>
                <CheckCircle2 className="size-4" /> Approve
              </Button>
            )}
            {perms.canStart && (
              <Button type="button" onClick={onStart}>
                <PlayCircle className="size-4" /> Mark in progress
              </Button>
            )}
            {perms.canComplete && (
              <Button type="button" onClick={onComplete}>
                <CheckCheck className="size-4" /> Mark completed
              </Button>
            )}
          </DialogFooter>
        )}
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

// ----- Approve dialog -----------------------------------------------------

function ApproveBookingDialog({
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
  const mutation = useMutation({
    mutationFn: () => api.patch<Booking>(`/partner/bookings/${target!.id}/approve`),
    onSuccess,
    onError: (err) => {
      onError(generalApiErrorMessage(err) ?? 'Could not approve booking.');
      onClose();
    },
  });

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
            <CheckCircle2 className="size-5 text-emerald-700" />
            Approve booking
          </DialogTitle>
          <DialogDescription>
            Approving{' '}
            <span className="font-mono text-foreground">
              {target?.bookingCode}
            </span>{' '}
            confirms you'll fulfill this job. The customer will be notified.
          </DialogDescription>
        </DialogHeader>
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
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Approving…' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- Start (in progress) dialog ----------------------------------------

function StartBookingDialog({
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
  const mutation = useMutation({
    mutationFn: () => api.patch<Booking>(`/partner/bookings/${target!.id}/start`),
    onSuccess,
    onError: (err) => {
      onError(generalApiErrorMessage(err) ?? 'Could not mark booking in progress.');
      onClose();
    },
  });

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
            <PlayCircle className="size-5 text-sky-700" />
            Mark in progress
          </DialogTitle>
          <DialogDescription>
            Start work on{' '}
            <span className="font-mono text-foreground">
              {target?.bookingCode}
            </span>
            ? The customer will see this booking move to In progress.
          </DialogDescription>
        </DialogHeader>
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
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Starting…' : 'Mark in progress'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- Complete dialog ---------------------------------------------------

function CompleteBookingDialog({
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
  const mutation = useMutation({
    mutationFn: () =>
      api.patch<Booking>(`/partner/bookings/${target!.id}/complete`),
    onSuccess,
    onError: (err) => {
      onError(generalApiErrorMessage(err) ?? 'Could not complete booking.');
      onClose();
    },
  });

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
            <CheckCheck className="size-5 text-emerald-700" />
            Mark completed
          </DialogTitle>
          <DialogDescription>
            Mark{' '}
            <span className="font-mono text-foreground">
              {target?.bookingCode}
            </span>{' '}
            as completed? The customer will be asked to leave a review.
          </DialogDescription>
        </DialogHeader>
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
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Completing…' : 'Mark completed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- Release dialog -----------------------------------------------------

const releaseSchema = z.object({
  releaseComment: z
    .string()
    .min(5, 'Release reason must be at least 5 characters')
    .max(300, 'Release reason must not exceed 300 characters'),
});

type ReleaseFormValues = z.infer<typeof releaseSchema>;

function ReleaseBookingDialog({
  target,
  onClose,
  onSuccess,
}: {
  target: Booking | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const open = target !== null;
  const form = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseSchema),
    defaultValues: { releaseComment: '' },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (open) form.reset({ releaseComment: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const mutation = useMutation({
    mutationFn: (payload: PartnerReleaseBookingPayload) =>
      api.patch<Booking>(
        `/partner/bookings/${target!.id}/release`,
        payload
      ),
    onSuccess,
    onError: (error) => {
      if (error instanceof ApiError) {
        const msgs = collectFieldErrors(error.fieldErrors, 'releaseComment');
        if (msgs.length > 0) {
          form.setError('releaseComment', {
            type: 'server',
            message: msgs.join(' '),
          });
        }
      }
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

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
            <Unlink className="size-5 text-rose-700" />
            Release booking
          </DialogTitle>
          <DialogDescription>
            Releasing{' '}
            <span className="font-mono text-foreground">
              {target?.bookingCode}
            </span>{' '}
            hands it back so it can be reassigned. Tell us why.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} noValidate className="grid gap-4">
            <FormField
              control={form.control}
              name="releaseComment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Release reason</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      minLength={5}
                      maxLength={300}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>5–300 characters.</FormDescription>
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
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Releasing…' : 'Release booking'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ----- Payload + server-error helpers ------------------------------------

function toCreatePayload(values: BookingFormValues): PartnerCreateBookingPayload {
  const isPackage = values.selectionMode === 'PACKAGE';
  const payload: PartnerCreateBookingPayload = {
    customerId: values.customerId,
    serviceTypeId: values.serviceTypeId,
    selectionMode: values.selectionMode,
    scheduledAt: new Date(values.scheduledAt).toISOString(),
    currency: values.currency.toUpperCase(),
    notes: values.notes?.trim() ? values.notes.trim() : null,
  };
  if (isPackage) {
    payload.partnerPackageId = values.partnerPackageId ?? null;
  } else {
    payload.customRequestText = values.customRequestText?.trim() || null;
    payload.customRequestBudget =
      values.customRequestBudget != null && !Number.isNaN(values.customRequestBudget)
        ? values.customRequestBudget
        : null;
  }
  if (values.includeAddress && values.serviceAddress) {
    payload.serviceAddress = values.serviceAddress;
  }
  return payload;
}

function toUpdatePayload(values: BookingFormValues): PartnerUpdateBookingPayload {
  const isPackage = values.selectionMode === 'PACKAGE';
  const payload: PartnerUpdateBookingPayload = {
    serviceTypeId: values.serviceTypeId,
    selectionMode: values.selectionMode,
    scheduledAt: new Date(values.scheduledAt).toISOString(),
    currency: values.currency.toUpperCase(),
    notes: values.notes?.trim() ? values.notes.trim() : null,
  };
  if (isPackage) {
    payload.partnerPackageId = values.partnerPackageId ?? null;
    payload.customRequestText = null;
    payload.customRequestBudget = null;
  } else {
    payload.partnerPackageId = null;
    payload.customRequestText = values.customRequestText?.trim() || null;
    payload.customRequestBudget =
      values.customRequestBudget != null && !Number.isNaN(values.customRequestBudget)
        ? values.customRequestBudget
        : null;
  }
  payload.serviceAddress =
    values.includeAddress && values.serviceAddress ? values.serviceAddress : null;
  return payload;
}

const FORM_FIELD_KEYS: ReadonlyArray<keyof BookingFormValues> = [
  'customerId',
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

/**
 * Resolve display name/email/phone for a booking. Registered customers come
 * through `booking.customer`; guest bookings have the contact in flat
 * `guestName` / `guestEmail` / `guestPhone` fields with `isGuestBooking: true`.
 */
function resolveContact(b: Booking): BookingContact {
  if (b.customer) {
    return {
      name: b.customer.fullName,
      email: b.customer.user?.email ?? null,
      phone: b.customer.phone ?? null,
      isGuest: false,
    };
  }
  const hasGuestData =
    !!b.isGuestBooking || !!b.guestName || !!b.guestEmail || !!b.guestPhone;
  if (hasGuestData) {
    return {
      name: b.guestName ?? null,
      email: b.guestEmail ?? null,
      phone: b.guestPhone ?? null,
      isGuest: true,
    };
  }
  return { name: null, email: null, phone: null, isGuest: false };
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

function formatPrice(price: number | string | null | undefined, currency: string): string {
  if (price === null || price === undefined) return '—';
  const n = typeof price === 'number' ? price : Number(price);
  if (!Number.isFinite(n)) return '—';
  const symbol = currency === 'PHP' ? '₱' : '';
  const formatted = n.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
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

/**
 * Convert an ISO timestamp to the `YYYY-MM-DDTHH:mm` shape that
 * `<input type="datetime-local">` expects, in the user's local timezone.
 */
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

