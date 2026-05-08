import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type {
  Address,
  Booking,
  BookingServiceType,
  BookingStatus,
  Customer,
  MobileCarWashDetails,
  Partner,
} from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { AddressFields, emptyAddress } from '@/components/AddressFields';

const BOOKINGS_KEY = ['admin', 'bookings'] as const;
const PARTNERS_KEY = ['admin', 'partners'] as const;
const CUSTOMERS_KEY = ['admin', 'customers'] as const;

const statusVariant: Record<
  BookingStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  PENDING_ASSIGNMENT: 'secondary',
  AWAITING_PARTNER_APPROVAL: 'secondary',
  PARTNER_APPROVED: 'default',
  IN_PROGRESS: 'default',
  COMPLETED: 'outline',
  RELEASED: 'destructive',
  CANCELLED: 'destructive',
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const formatMoney = (amount: string | null, currency: string) =>
  amount === null
    ? '—'
    : new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
      }).format(Number(amount));

export function Bookings() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Booking | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);
  const [viewTarget, setViewTarget] = useState<Booking | null>(null);

  const bookingsQuery = useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: () => api.get<Booking[]>('/admin/bookings'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
      setDeleteTarget(null);
    },
  });

  const bookings = bookingsQuery.data?.data ?? [];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Manage all bookings and partner assignments.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          New Booking
        </Button>
      </div>

      <div className="bg-background rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {bookingsQuery.isError && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-destructive py-6">
                  Failed to load bookings: {bookingsQuery.error.message}
                </TableCell>
              </TableRow>
            )}
            {!bookingsQuery.isPending && bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                  No bookings yet. Click "New Booking" to create one.
                </TableCell>
              </TableRow>
            )}
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">
                  {booking.customer.fullName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {booking.partner?.businessName ?? (
                    <span className="italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>{booking.serviceType.replace('_', ' ')}</TableCell>
                <TableCell>{formatDateTime(booking.scheduledAt)}</TableCell>
                <TableCell>
                  {booking.discountPrice !== null && (
                    <span className="line-through text-muted-foreground mr-2">
                      {formatMoney(booking.price, booking.currency)}
                    </span>
                  )}
                  {formatMoney(
                    booking.discountPrice ?? booking.price,
                    booking.currency
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[booking.status]}>
                    {booking.status.replace(/_/g, ' ')}
                  </Badge>
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
                      <DropdownMenuItem onClick={() => setViewTarget(booking)}>
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAssignTarget(booking)}>
                        {booking.partner ? 'Reassign partner' : 'Assign partner'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(booking)}
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

      <CreateBookingDialog open={createOpen} onOpenChange={setCreateOpen} />
      <AssignPartnerDialog
        booking={assignTarget}
        onClose={() => setAssignTarget(null)}
      />
      <ViewBookingDialog
        booking={viewTarget}
        onClose={() => setViewTarget(null)}
      />
      <DeleteBookingDialog
        booking={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isPending={deleteMutation.isPending}
        error={
          deleteMutation.error instanceof ApiError
            ? deleteMutation.error.message
            : null
        }
      />
    </>
  );
}

const emptyMobileCarWash: MobileCarWashDetails = {
  vehicleType: '',
  vehicleBrand: '',
  vehicleModel: '',
  plateNumber: '',
  washPackage: '',
  addOns: [],
  interiorCleaning: false,
  engineDetailing: false,
  waterSourceAvailable: false,
  powerOutletAvailable: false,
  parkingNotes: '',
  dirtLevel: '',
  specialInstructions: '',
};

type CreateBookingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function CreateBookingDialog({ open, onOpenChange }: CreateBookingDialogProps) {
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [serviceType, setServiceType] =
    useState<BookingServiceType>('MOBILE_CARWASH');
  const [scheduledAt, setScheduledAt] = useState('');
  const [serviceAddress, setServiceAddress] = useState<Address>(emptyAddress);
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [carWash, setCarWash] = useState<MobileCarWashDetails>(emptyMobileCarWash);
  const [addOnsRaw, setAddOnsRaw] = useState('');

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

  const approvedPartners = useMemo(
    () =>
      (partnersQuery.data?.data ?? []).filter(
        (p) => p.approvalStatus === 'APPROVED'
      ),
    [partnersQuery.data]
  );

  const reset = () => {
    setCustomerId('');
    setPartnerId('');
    setServiceType('MOBILE_CARWASH');
    setScheduledAt('');
    setServiceAddress(emptyAddress);
    setPrice('');
    setDiscountPrice('');
    setCurrency('USD');
    setNotes('');
    setCarWash(emptyMobileCarWash);
    setAddOnsRaw('');
  };

  const mutation = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        customerId,
        serviceType,
        scheduledAt: new Date(scheduledAt).toISOString(),
        serviceAddress,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        currency: currency.toUpperCase(),
        notes: notes.trim() || null,
      };
      if (partnerId) body.partnerId = partnerId;
      if (serviceType === 'MOBILE_CARWASH') {
        body.mobileCarWashDetails = {
          ...carWash,
          addOns: addOnsRaw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          vehicleBrand: carWash.vehicleBrand?.trim() || null,
          vehicleModel: carWash.vehicleModel?.trim() || null,
          plateNumber: carWash.plateNumber?.trim() || null,
          parkingNotes: carWash.parkingNotes?.trim() || null,
          dirtLevel: carWash.dirtLevel?.trim() || null,
          specialInstructions: carWash.specialInstructions?.trim() || null,
        };
      }
      return api.post('/admin/bookings', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
      reset();
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      mutation.reset();
      reset();
    }
    onOpenChange(next);
  };

  const updateCarWash = <K extends keyof MobileCarWashDetails>(
    key: K,
    value: MobileCarWashDetails[K]
  ) => setCarWash((prev) => ({ ...prev, [key]: value }));

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Booking</DialogTitle>
          <DialogDescription>
            Create a booking. Assigning a partner is optional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5">
          {/* Customer + service type + partner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      customersQuery.isPending
                        ? 'Loading…'
                        : 'Select a customer'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(customersQuery.data?.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName} — {c.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Service type</Label>
              <Select
                value={serviceType}
                onValueChange={(v) => setServiceType(v as BookingServiceType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOBILE_CARWASH">Mobile Carwash</SelectItem>
                  <SelectItem value="FUTURE_SERVICE">Future Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Partner (optional)</Label>
              <Select
                value={partnerId || 'none'}
                onValueChange={(v) => setPartnerId(v === 'none' ? '' : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="scheduledAt">Scheduled at</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="discountPrice">Discount price</Label>
              <Input
                id="discountPrice"
                type="number"
                min="0"
                step="0.01"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                required
                minLength={3}
                maxLength={3}
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          {/* Service address */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Service address</p>
            <AddressFields
              value={serviceAddress}
              onChange={setServiceAddress}
              idPrefix="ba"
              required
            />
          </div>

          {/* Mobile carwash details */}
          {serviceType === 'MOBILE_CARWASH' && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-sm font-medium">Mobile car-wash details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="vehicleType">Vehicle type</Label>
                  <Input
                    id="vehicleType"
                    required
                    minLength={2}
                    maxLength={60}
                    placeholder="Sedan, SUV, Truck…"
                    value={carWash.vehicleType}
                    onChange={(e) => updateCarWash('vehicleType', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="washPackage">Wash package</Label>
                  <Input
                    id="washPackage"
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="Basic, Premium…"
                    value={carWash.washPackage}
                    onChange={(e) => updateCarWash('washPackage', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vehicleBrand">Brand</Label>
                  <Input
                    id="vehicleBrand"
                    maxLength={60}
                    value={carWash.vehicleBrand ?? ''}
                    onChange={(e) =>
                      updateCarWash('vehicleBrand', e.target.value)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vehicleModel">Model</Label>
                  <Input
                    id="vehicleModel"
                    maxLength={60}
                    value={carWash.vehicleModel ?? ''}
                    onChange={(e) =>
                      updateCarWash('vehicleModel', e.target.value)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plateNumber">Plate number</Label>
                  <Input
                    id="plateNumber"
                    maxLength={30}
                    value={carWash.plateNumber ?? ''}
                    onChange={(e) =>
                      updateCarWash('plateNumber', e.target.value)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dirtLevel">Dirt level</Label>
                  <Input
                    id="dirtLevel"
                    maxLength={40}
                    placeholder="Light / Medium / Heavy"
                    value={carWash.dirtLevel ?? ''}
                    onChange={(e) =>
                      updateCarWash('dirtLevel', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="addOns">Add-ons (comma separated)</Label>
                <Input
                  id="addOns"
                  placeholder="Wax, Tire shine, Window treatment"
                  value={addOnsRaw}
                  onChange={(e) => setAddOnsRaw(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={carWash.interiorCleaning ?? false}
                    onChange={(e) =>
                      updateCarWash('interiorCleaning', e.target.checked)
                    }
                  />
                  Interior cleaning
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={carWash.engineDetailing ?? false}
                    onChange={(e) =>
                      updateCarWash('engineDetailing', e.target.checked)
                    }
                  />
                  Engine detailing
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={carWash.waterSourceAvailable ?? false}
                    onChange={(e) =>
                      updateCarWash('waterSourceAvailable', e.target.checked)
                    }
                  />
                  Water source on-site
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={carWash.powerOutletAvailable ?? false}
                    onChange={(e) =>
                      updateCarWash('powerOutletAvailable', e.target.checked)
                    }
                  />
                  Power outlet on-site
                </label>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="parkingNotes">Parking notes</Label>
                <Textarea
                  id="parkingNotes"
                  maxLength={300}
                  value={carWash.parkingNotes ?? ''}
                  onChange={(e) =>
                    updateCarWash('parkingNotes', e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="specialInstructions">Special instructions</Label>
                <Textarea
                  id="specialInstructions"
                  maxLength={500}
                  value={carWash.specialInstructions ?? ''}
                  onChange={(e) =>
                    updateCarWash('specialInstructions', e.target.value)
                  }
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Booking notes</Label>
            <Textarea
              id="notes"
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !customerId || !scheduledAt}
            >
              {mutation.isPending ? 'Creating…' : 'Create booking'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type AssignPartnerDialogProps = {
  booking: Booking | null;
  onClose: () => void;
};

function AssignPartnerDialog({ booking, onClose }: AssignPartnerDialogProps) {
  const queryClient = useQueryClient();
  const [partnerId, setPartnerId] = useState('');

  const partnersQuery = useQuery({
    queryKey: PARTNERS_KEY,
    queryFn: () => api.get<Partner[]>('/admin/partners'),
    enabled: booking !== null,
  });

  const approvedPartners = useMemo(
    () =>
      (partnersQuery.data?.data ?? []).filter(
        (p) => p.approvalStatus === 'APPROVED'
      ),
    [partnersQuery.data]
  );

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/admin/bookings/${booking!.id}/assign-partner`, {
        partnerId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
      setPartnerId('');
      onClose();
    },
  });

  const handleClose = () => {
    setPartnerId('');
    mutation.reset();
    onClose();
  };

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <Dialog
      open={booking !== null}
      onOpenChange={(next) => !next && handleClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {booking?.partner ? 'Reassign partner' : 'Assign partner'}
          </DialogTitle>
          <DialogDescription>
            Booking for{' '}
            <strong>{booking?.customer.fullName}</strong> ·{' '}
            {booking ? formatDateTime(booking.scheduledAt) : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Partner</Label>
          <Select value={partnerId} onValueChange={setPartnerId}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  partnersQuery.isPending ? 'Loading…' : 'Select an approved partner'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {approvedPartners.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.businessName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            disabled={!partnerId || mutation.isPending}
          >
            {mutation.isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ViewBookingDialogProps = {
  booking: Booking | null;
  onClose: () => void;
};

function ViewBookingDialog({ booking, onClose }: ViewBookingDialogProps) {
  return (
    <Dialog
      open={booking !== null}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking details</DialogTitle>
          <DialogDescription>
            {booking ? formatDateTime(booking.scheduledAt) : ''}
          </DialogDescription>
        </DialogHeader>
        {booking && (
          <div className="grid gap-4 text-sm">
            <Section label="Status">
              <Badge variant={statusVariant[booking.status]}>
                {booking.status.replace(/_/g, ' ')}
              </Badge>
              {booking.releaseComment && (
                <p className="text-muted-foreground mt-1">
                  Release reason: {booking.releaseComment}
                </p>
              )}
            </Section>
            <Section label="Customer">
              <p>{booking.customer.fullName}</p>
              <p className="text-muted-foreground">
                {booking.customer.user.email} · {booking.customer.phone}
              </p>
            </Section>
            <Section label="Partner">
              {booking.partner ? (
                <>
                  <p>{booking.partner.businessName}</p>
                  <p className="text-muted-foreground">
                    {(() => {
                      const root =
                        booking.partner.users?.find((u) => u.isPartnerRoot) ??
                        booking.partner.users?.[0];
                      return root?.email ? `${root.email} · ` : '';
                    })()}
                    {booking.partner.phone}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground italic">Unassigned</p>
              )}
            </Section>
            <Section label="Pricing">
              <p>
                {formatMoney(
                  booking.discountPrice ?? booking.price,
                  booking.currency
                )}
                {booking.discountPrice && (
                  <span className="text-muted-foreground line-through ml-2">
                    {formatMoney(booking.price, booking.currency)}
                  </span>
                )}
              </p>
            </Section>
            <Section label="Service address">
              <p>{booking.serviceAddress.label}</p>
              <p className="text-muted-foreground">
                {booking.serviceAddress.line1}
                {booking.serviceAddress.line2 && `, ${booking.serviceAddress.line2}`}
                <br />
                {booking.serviceAddress.city}, {booking.serviceAddress.state}{' '}
                {booking.serviceAddress.postalCode}
                <br />
                {booking.serviceAddress.country}
              </p>
            </Section>
            {booking.mobileCarWashDetails && (
              <Section label="Mobile car wash">
                <pre className="text-xs bg-muted rounded-md p-2 overflow-x-auto">
                  {JSON.stringify(booking.mobileCarWashDetails, null, 2)}
                </pre>
              </Section>
            )}
            {booking.notes && (
              <Section label="Notes">
                <p className="text-muted-foreground">{booking.notes}</p>
              </Section>
            )}
            {booking.statusLogs.length > 0 && (
              <Section label="Status timeline">
                <ul className="space-y-1">
                  {booking.statusLogs.map((log) => (
                    <li key={log.id} className="text-muted-foreground">
                      {formatDateTime(log.createdAt)} · {log.status}
                      {log.comment ? ` — ${log.comment}` : ''}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

type DeleteBookingDialogProps = {
  booking: Booking | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  error: string | null;
};

function DeleteBookingDialog({
  booking,
  onClose,
  onConfirm,
  isPending,
  error,
}: DeleteBookingDialogProps) {
  return (
    <Dialog open={booking !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete booking</DialogTitle>
          <DialogDescription>
            This permanently removes the booking for{' '}
            <strong>{booking?.customer.fullName}</strong> on{' '}
            {booking ? formatDateTime(booking.scheduledAt) : ''}. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
