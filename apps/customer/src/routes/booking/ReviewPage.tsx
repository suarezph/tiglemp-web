import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import {
  api,
  ApiError,
  generalApiErrorMessage,
} from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useBookingDraft } from '@/stores/booking-draft';
import type {
  BookingResponse,
  BookingServiceAddressPayload,
  CreateBookingBasePayload,
  CreateGuestBookingPayload,
} from '@/types/api';
import { Button } from '@/components/ui/button';

export function ReviewPage() {
  const { partnerId = '' } = useParams();
  const navigate = useNavigate();
  const draft = useBookingDraft();
  const authed = useAuthStore((s) => !!s.token && s.user?.role === 'CUSTOMER');

  const scheduleLabel = (() => {
    if (!draft.search.scheduledAt) return null;
    const d = new Date(draft.search.scheduledAt);
    if (Number.isNaN(d.getTime())) return draft.search.scheduledAt;
    return d.toLocaleString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  })();

  const mutation = useMutation({
    mutationFn: () => {
      const base = buildBasePayload(draft, partnerId);
      if (authed) {
        return api.post<BookingResponse>('/customer/bookings', base);
      }
      if (!draft.guestContact) {
        throw new Error('Missing guest contact details.');
      }
      const guestPayload: CreateGuestBookingPayload = {
        ...base,
        guestName: draft.guestContact.fullName.trim(),
        guestEmail: draft.guestContact.email.trim(),
        guestPhone: draft.guestContact.phone.trim(),
      };
      return api.post<BookingResponse>('/bookings/guest', guestPayload);
    },
    onSuccess: (response) => {
      const code = response.data.bookingCode;
      navigate(`/bookings/${encodeURIComponent(code)}/confirmed`, {
        replace: true,
      });
    },
  });

  const generalError = generalApiErrorMessage(mutation.error);
  const fieldErrors =
    mutation.error instanceof ApiError ? mutation.error.fieldErrors : null;
  const fieldErrorBanner = (() => {
    if (!fieldErrors) return null;
    const lines: string[] = [];
    for (const [key, msgs] of Object.entries(fieldErrors)) {
      if (!msgs?.length) continue;
      lines.push(`${humanizeFieldKey(key)}: ${msgs.join(' ')}`);
    }
    return lines.length > 0 ? lines : null;
  })();

  const canConfirm = isReadyToConfirm(draft, authed);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Almost there
        </p>
        <h1 className="mt-1 text-xl md:text-2xl font-bold">
          Review and confirm
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Double-check the details below. We'll send a confirmation as soon as
          the business accepts.
        </p>
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6 grid gap-5">
        <ReviewRow label="Service" value={draft.search.serviceTypeName} />
        <ReviewRow
          label="Where"
          value={
            draft.search.cityName && draft.search.regionName
              ? `${draft.search.cityName}, ${draft.search.regionName}`
              : null
          }
        />
        <ReviewRow label="When" value={scheduleLabel} />
        <ReviewRow
          label="Business"
          value={
            draft.partner
              ? `${draft.partner.businessName}${
                  draft.partner.autoAssigned ? ' · auto-assigned' : ''
                }`
              : null
          }
        />
        {draft.package ? (
          <ReviewRow
            label="Package"
            value={
              draft.package.priceFromPHP !== null
                ? `${draft.package.name} · from ₱${draft.package.priceFromPHP.toLocaleString()}`
                : draft.package.name
            }
          />
        ) : draft.customRequest ? (
          <ReviewRow
            label="Custom request"
            value={
              <div className="space-y-1">
                <p className="text-sm whitespace-pre-wrap">
                  {draft.customRequest.description || '—'}
                </p>
                {draft.customRequest.budgetPHP !== null && (
                  <p className="text-xs text-muted-foreground">
                    Budget: ~₱
                    {draft.customRequest.budgetPHP.toLocaleString()}
                  </p>
                )}
              </div>
            }
          />
        ) : (
          <ReviewRow label="Package" value={null} />
        )}
        {draft.address && (
          <ReviewRow
            label="Address"
            value={
              <div className="text-sm space-y-0.5">
                <p>
                  {draft.address.line1}
                  {draft.address.line2 ? `, ${draft.address.line2}` : ''}
                </p>
                <p>
                  {draft.address.city}, {draft.address.state}{' '}
                  {draft.address.postalCode}
                </p>
                <p>{draft.address.country}</p>
              </div>
            }
          />
        )}
        {draft.guestContact && (
          <ReviewRow
            label="Contact"
            value={
              <div className="text-sm space-y-0.5">
                <p>{draft.guestContact.fullName}</p>
                <p className="text-muted-foreground">
                  {draft.guestContact.email} · {draft.guestContact.phone}
                </p>
              </div>
            }
          />
        )}
      </div>

      {/* Notes for the business (optional). Sent as top-level `notes`. */}
      <div className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6">
        <label className="block">
          <span className="text-sm font-semibold">
            Notes for the business{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Anything they should know — gate codes, pets, parking, preferred
            contact time.
          </p>
          <textarea
            rows={3}
            value={draft.notes}
            onChange={(e) => draft.setNotes(e.target.value)}
            maxLength={500}
            placeholder="e.g. Please call when you're 10 minutes away. Gate code is 1234."
            className="mt-2 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="mt-1 text-[11px] text-muted-foreground text-right">
            {draft.notes.length}/500
          </p>
        </label>
      </div>

      <div className="rounded-xl bg-foreground/[0.03] ring-1 ring-border p-4 text-xs text-muted-foreground">
        By confirming, you agree to Tiglemp's booking terms. You won't be
        charged until the business accepts. Cash or e-wallet on the day of
        service.
      </div>

      {generalError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {generalError}
        </div>
      )}
      {fieldErrorBanner && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-1 list-disc pl-5 space-y-0.5">
            {fieldErrorBanner.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/book/${partnerId}/auth`)}
          disabled={mutation.isPending}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !canConfirm}
          className="h-11 px-6"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Confirming…
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" />
              Confirm booking
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | null;
}) {
  return (
    <div className="grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-6">
      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
        {label}
      </p>
      {value === null || value === undefined || value === '' ? (
        <p className="text-sm text-muted-foreground italic">Not set</p>
      ) : typeof value === 'string' ? (
        <p className="text-sm font-medium">{value}</p>
      ) : (
        <div>{value}</div>
      )}
    </div>
  );
}

function buildAddressPayload(
  address: ReturnType<typeof useBookingDraft.getState>['address']
): BookingServiceAddressPayload | undefined {
  if (!address) return undefined;
  return {
    label: 'Home',
    line1: address.line1,
    line2: address.line2.trim() ? address.line2.trim() : null,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    latitude: null,
    longitude: null,
  };
}

function buildBasePayload(
  draft: ReturnType<typeof useBookingDraft.getState>,
  partnerId: string
): CreateBookingBasePayload {
  const base: CreateBookingBasePayload = {
    partnerId,
    serviceTypeId: draft.search.serviceTypeId!,
    selectionMode: draft.package ? 'PACKAGE' : 'CUSTOM_REQUEST',
    scheduledAt: draft.search.scheduledAt!,
    serviceAddress: buildAddressPayload(draft.address),
    currency: 'PHP',
    notes: draft.notes.trim() ? draft.notes.trim() : undefined,
  };

  if (draft.package) {
    base.partnerPackageId = draft.package.id;
  } else if (draft.customRequest) {
    base.customRequestText = draft.customRequest.description.trim();
    if (draft.customRequest.budgetPHP !== null) {
      base.customRequestBudget = draft.customRequest.budgetPHP;
    }
  }

  return base;
}

function isReadyToConfirm(
  draft: ReturnType<typeof useBookingDraft.getState>,
  authed: boolean
): boolean {
  if (!draft.search.serviceTypeId) return false;
  if (!draft.search.scheduledAt) return false;
  if (!draft.partner) return false;
  if (!draft.package && !draft.customRequest?.description.trim()) return false;
  if (!authed && !draft.guestContact) return false;
  return true;
}

function humanizeFieldKey(key: string): string {
  return key
    .replace(/\./g, ' › ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
