import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useBookingDraft } from '@/stores/booking-draft';
import { Button } from '@/components/ui/button';

export function ReviewPage() {
  const { partnerId = '' } = useParams();
  const navigate = useNavigate();
  const draft = useBookingDraft();

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

  const handleConfirm = () => {
    // Stub: pretend the backend assigned an id and navigate to confirmation.
    const fakeId = `bk_${Date.now().toString(36)}`;
    navigate(`/bookings/${fakeId}/confirmed`);
  };

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
                {draft.address.notes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Notes: {draft.address.notes}
                  </p>
                )}
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

      <div className="rounded-xl bg-foreground/[0.03] ring-1 ring-border p-4 text-xs text-muted-foreground">
        By confirming, you agree to Tiglemp's booking terms. You won't be
        charged until the business accepts. Cash or e-wallet on the day of
        service.
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/book/${partnerId}/auth`)}
        >
          Back
        </Button>
        <Button type="button" onClick={handleConfirm} className="h-11 px-6">
          <CheckCircle2 className="size-4" />
          Confirm booking
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
