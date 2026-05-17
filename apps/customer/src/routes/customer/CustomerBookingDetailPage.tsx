import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Loader2,
  MapPin,
  MessageSquareText,
  Phone,
  Sparkles,
  Star,
  XCircle,
  XOctagon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import type {
  BookingStatusLog,
  BookingStatusMeta,
  CustomerBookingDetail,
  CustomerBookingStatus,
} from '@/types/api';
import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { PageMeta } from '@/components/PageMeta';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function CustomerBookingDetailPage() {
  const { bookingId = '' } = useParams();

  const query = useQuery({
    queryKey: ['customer', 'booking', bookingId],
    queryFn: () =>
      api.get<CustomerBookingDetail>(
        `/customer/bookings/${encodeURIComponent(bookingId)}`
      ),
    enabled: !!bookingId,
    retry: false,
  });

  const booking = query.data?.data;

  return (
    <>
      <PageMeta title="Booking details" noIndex />
      <SiteNavbar />
      <main className="bg-foreground/[0.02] min-h-[calc(100vh-60px)]">
        <div className="mx-auto max-w-3xl px-6 py-8 md:py-10 space-y-6">
          <div>
            <Link
              to="/customer/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to my bookings
            </Link>
          </div>

          {query.isPending ? (
            <div className="rounded-2xl bg-white ring-1 ring-border p-12 text-center">
              <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Loading booking details…
              </p>
            </div>
          ) : query.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
              <p className="flex items-center gap-2 text-destructive font-semibold">
                <XCircle className="size-4" />
                Couldn't load this booking
              </p>
              <p className="mt-1 text-destructive/80">
                {query.error instanceof ApiError
                  ? query.error.message
                  : 'Something went wrong. Try refreshing the page.'}
              </p>
            </div>
          ) : !booking ? null : (
            <BookingBody booking={booking} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function BookingBody({ booking }: { booking: CustomerBookingDetail }) {
  const dt = new Date(booking.scheduledAt);
  const dateLabel = Number.isNaN(dt.getTime())
    ? booking.scheduledAt
    : dt.toLocaleString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

  const partnerName = booking.partner?.businessName ?? 'Partner';
  const partnerInitial = (partnerName[0] ?? '?').toUpperCase();
  const serviceName = booking.serviceType?.name ?? 'Service';
  const isCustom =
    booking.selectionMode === 'CUSTOM_REQUEST' ||
    (!booking.packageName && !!booking.customRequestText);

  const addr = booking.serviceAddress;

  return (
    <>
      {/* Header card */}
      <header className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="size-12 shrink-0 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-lg">
            {partnerInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {serviceName}
            </p>
            <h1 className="mt-0.5 text-xl md:text-2xl font-bold">
              {partnerName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <StatusBadge status={booking.status} meta={booking.statusMeta} />
              {booking.isGuestBooking && (
                <span className="inline-flex items-center rounded-full bg-foreground/10 text-foreground px-2.5 py-0.5 text-[11px] font-semibold">
                  Guest booking
                </span>
              )}
              {booking.hasReview && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
                  <Star className="size-3" />
                  Reviewed
                </span>
              )}
            </div>
            {booking.statusMeta?.description && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {booking.statusMeta.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <DetailRow
            icon={<Clock className="size-4" />}
            label="Scheduled"
            value={dateLabel}
          />
          {booking.partner?.phone && (
            <DetailRow
              icon={<Phone className="size-4" />}
              label="Partner phone"
              value={booking.partner.phone}
            />
          )}
        </div>
      </header>

      {/* Selection: package or custom request */}
      <section className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {isCustom ? 'Custom request' : 'Package'}
        </h2>

        {!isCustom ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">
                  {booking.packageName ?? booking.partnerPackage?.name ?? '—'}
                </p>
                {booking.partnerPackage?.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {booking.partnerPackage.description}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Price
                </p>
                <p className="text-xl font-bold">
                  {formatPrice(booking.price, booking.currency)}
                </p>
                {booking.packageEstimatedDurationMinutes && (
                  <p className="text-[11px] text-muted-foreground">
                    ~{booking.packageEstimatedDurationMinutes} min
                  </p>
                )}
              </div>
            </div>

            {(booking.packageFeatures?.length ||
              booking.partnerPackage?.features?.length) && (
              <ul className="grid gap-1 sm:grid-cols-2">
                {(
                  booking.packageFeatures ??
                  booking.partnerPackage?.features ??
                  []
                ).map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="size-3.5 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="rounded-lg bg-foreground/[0.03] border border-border p-3">
              <p className="whitespace-pre-wrap text-sm">
                {booking.customRequestText ?? '—'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {booking.customRequestBudget !== null &&
                booking.customRequestBudget !== undefined && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Customer budget
                    </p>
                    <p className="font-bold">
                      {formatPrice(booking.customRequestBudget, booking.currency)}
                    </p>
                  </div>
                )}
              <div className="ml-auto text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Final price
                </p>
                <p className="font-bold">
                  {(() => {
                    const n = toNumberOrNull(booking.price);
                    return n !== null && n > 0
                      ? formatPrice(n, booking.currency)
                      : 'TBD';
                  })()}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Service address */}
      {addr && (
        <section className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            Service address
          </h2>
          <div className="mt-3 text-sm space-y-0.5">
            {addr.label && <p className="font-semibold">{addr.label}</p>}
            <p>
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ''}
            </p>
            <p>
              {addr.city}
              {addr.state ? `, ${addr.state}` : ''}{' '}
              {addr.postalCode ?? ''}
            </p>
            {addr.country && <p>{addr.country}</p>}
          </div>
        </section>
      )}

      {/* Notes */}
      {booking.notes && (
        <section className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MessageSquareText className="size-3.5" />
            Note for the business
          </h2>
          <p className="mt-3 text-sm whitespace-pre-wrap">{booking.notes}</p>
        </section>
      )}

      {/* Booking reference */}
      <section className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Booking reference
          </p>
          <p className="mt-0.5 font-mono text-sm text-foreground break-all">
            {booking.bookingCode}
          </p>
        </div>
        <CopyButton code={booking.bookingCode} />
      </section>

      {/* Status timeline */}
      {booking.statusLogs && booking.statusLogs.length > 0 && (
        <section className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Status history
          </h2>
          <ol className="mt-4 space-y-4">
            {[...booking.statusLogs]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((log) => (
                <TimelineRow key={log.id} log={log} />
              ))}
          </ol>
        </section>
      )}

      {/* Review CTA */}
      {booking.statusMeta?.customerCanReview && !booking.hasReview && (
        <section className="rounded-2xl bg-primary/[0.05] ring-1 ring-primary/30 p-5 md:p-6 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold flex items-center gap-2">
              <Star className="size-4 text-primary fill-primary" />
              How was your experience?
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Leave a review to help other customers find great businesses.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link to={`/customer/bookings/${booking.id}/review`}>
              <Star className="size-4" />
              Leave a review
            </Link>
          </Button>
        </section>
      )}

      {booking.statusMeta?.customerCanCancel && (
        <CancelBookingSection booking={booking} />
      )}

      <div>
        <Button asChild variant="outline">
          <Link to="/customer/dashboard">
            <ArrowLeft className="size-4" />
            Back to my bookings
          </Link>
        </Button>
      </div>
    </>
  );
}

function CancelBookingSection({
  booking,
}: {
  booking: CustomerBookingDetail;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      api.patch<CustomerBookingDetail>(
        `/customer/bookings/${encodeURIComponent(booking.id)}/cancel`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['customer', 'booking', booking.id],
      });
      queryClient.invalidateQueries({ queryKey: ['customer', 'bookings'] });
      setOpen(false);
    },
  });

  const errorMessage = (() => {
    const err = mutation.error;
    if (!(err instanceof ApiError)) return null;
    const statusErrors = err.fieldErrors?.status;
    if (Array.isArray(statusErrors) && statusErrors.length > 0) {
      return statusErrors[0];
    }
    return err.message;
  })();

  return (
    <>
      <section className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">Need to cancel?</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            You can cancel free of charge until a partner approves this booking.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="shrink-0 text-destructive hover:text-destructive"
        >
          <XOctagon className="size-4" />
          Cancel booking
        </Button>
      </section>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            mutation.reset();
            setOpen(false);
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
              This will cancel{' '}
              <span className="font-mono text-foreground">
                {booking.bookingCode}
              </span>
              . You'll need to make a new booking if you change your mind.
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
              onClick={() => setOpen(false)}
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
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid place-items-center size-8 rounded-lg bg-foreground/[0.04] text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 h-9 text-sm font-semibold transition-colors',
        copied
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
      )}
      title="Copy booking reference"
    >
      {copied ? (
        <>
          <Check className="size-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

function TimelineRow({ log }: { log: BookingStatusLog }) {
  const ts = new Date(log.createdAt);
  const tsLabel = Number.isNaN(ts.getTime())
    ? log.createdAt
    : ts.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
  return (
    <li className="border-l-2 border-border pl-3 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={log.status} />
        <span className="text-[11px] text-muted-foreground">{tsLabel}</span>
      </div>
      {log.note && <p className="text-sm text-foreground/90">{log.note}</p>}
    </li>
  );
}

function StatusBadge({
  status,
  meta,
}: {
  status: CustomerBookingStatus;
  meta?: BookingStatusMeta;
}) {
  const label = meta?.label ?? CUSTOMER_STATUS_LABEL[status];
  const styles = STATUS_BADGE_CLASS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        styles
      )}
    >
      {label}
    </span>
  );
}

const CUSTOMER_STATUS_LABEL: Record<CustomerBookingStatus, string> = {
  PENDING_ASSIGNMENT: 'Searching for partner',
  AWAITING_PARTNER_APPROVAL: 'Awaiting partner approval',
  PARTNER_APPROVED: 'Confirmed',
  RELEASED: 'Released',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_BADGE_CLASS: Record<CustomerBookingStatus, string> = {
  PENDING_ASSIGNMENT: 'bg-amber-100 text-amber-800',
  AWAITING_PARTNER_APPROVAL: 'bg-amber-100 text-amber-800',
  PARTNER_APPROVED: 'bg-emerald-100 text-emerald-800',
  RELEASED: 'bg-foreground/10 text-foreground',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-primary/10 text-primary',
  CANCELLED: 'bg-destructive/10 text-destructive',
};

// API may return numeric fields as strings ("0", "1700.00"). Normalise.
function toNumberOrNull(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatPrice(
  price: number | string | null | undefined,
  currency: string | null | undefined
): string {
  const n = toNumberOrNull(price);
  if (n === null) return 'TBD';
  const formatted = n.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (currency === 'PHP' || !currency) return `₱${formatted}`;
  return `${currency} ${formatted}`;
}

// Suppress unused-import warning for Sparkles if the page later needs it.
void Sparkles;
