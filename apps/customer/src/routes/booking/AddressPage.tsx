import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { useBookingDraft } from '@/stores/booking-draft';
import { Button } from '@/components/ui/button';

const EMPTY = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Philippines',
  notes: '',
};

export function AddressPage() {
  const { partnerId = '' } = useParams();
  const navigate = useNavigate();
  const draft = useBookingDraft();

  // Pre-fill city/state from the search context if available.
  useEffect(() => {
    if (draft.address) return;
    draft.setAddress({
      ...EMPTY,
      city: draft.search.cityName ?? '',
      state: draft.search.regionName ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = draft.address ?? EMPTY;
  const set = <K extends keyof typeof EMPTY>(key: K, v: string) =>
    draft.setAddress({ ...value, [key]: v });

  const canContinue =
    value.line1.trim().length > 2 &&
    value.city.trim().length > 1 &&
    value.state.trim().length > 1 &&
    value.postalCode.trim().length > 2 &&
    value.country.trim().length > 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;
    navigate(`/book/${partnerId}/review`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Where should we service?
        </p>
        <h1 className="mt-1 text-xl md:text-2xl font-bold">Service address</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The business needs this to plan the visit. You can add notes for
          parking, gate codes, or pets.
        </p>
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6 grid gap-4">
        <div className="grid sm:grid-cols-[40px_1fr] items-start gap-3">
          <div className="hidden sm:grid place-items-center size-10 rounded-xl bg-primary/10 text-primary mt-1">
            <MapPin className="size-5" />
          </div>
          <div className="grid gap-4">
            <Field
              label="Address line 1"
              value={value.line1}
              onChange={(v) => set('line1', v)}
              placeholder="Unit, building, street"
            />
            <Field
              label="Address line 2 (optional)"
              value={value.line2}
              onChange={(v) => set('line2', v)}
              placeholder="Barangay, subdivision"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="City / Town"
                value={value.city}
                onChange={(v) => set('city', v)}
              />
              <Field
                label="State / Province"
                value={value.state}
                onChange={(v) => set('state', v)}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Postal code"
                value={value.postalCode}
                onChange={(v) => set('postalCode', v)}
              />
              <Field
                label="Country"
                value={value.country}
                onChange={(v) => set('country', v)}
              />
            </div>
            <label className="block">
              <span className="text-sm font-semibold">Notes (optional)</span>
              <textarea
                rows={3}
                value={value.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="e.g. Ring the gate intercom; please call when 10 minutes away."
                className="mt-1.5 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/book/${partnerId}/auth`)}
        >
          Back
        </Button>
        <Button type="submit" disabled={!canContinue} className="h-11 px-6">
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}
