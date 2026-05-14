import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, LogIn, UserPlus, UserRound } from 'lucide-react';
import { useBookingDraft } from '@/stores/booking-draft';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';

const SERVICES_REQUIRING_ADDRESS = new Set<string>([
  'house_cleaning',
  'condo_cleaning',
  'apartment_cleaning',
  'aircon_cleaning',
  'sofa_cleaning',
  'mattress_cleaning',
  'carpet_cleaning',
  'pest_control',
  'disinfection',
  'pool_cleaning',
  'window_cleaning',
  'post_construction_cleaning',
  'post_renovation_cleaning',
  'airbnb_rental_turnover_cleaning',
  'move_in_out',
  'move_in_out_cleaning',
  'garden_cleaning',
  'rubbish_hauling',
  'storage_cleaning',
  'mobile_carwash',
  'solar_panel_cleaning',
]);

export function AuthGatePage() {
  const { partnerId = '' } = useParams();
  const navigate = useNavigate();
  const draft = useBookingDraft();
  const authed = useAuthStore((s) => !!s.token && s.user?.role === 'CUSTOMER');
  const [mode, setMode] = useState<'choose' | 'guest'>('choose');

  const nextStep = (() => {
    const code = draft.search.serviceTypeCode;
    if (code && SERVICES_REQUIRING_ADDRESS.has(code)) return 'address';
    return 'review';
  })();

  const goNext = () => navigate(`/book/${partnerId}/${nextStep}`);

  // Already signed in? Skip the gate entirely.
  useEffect(() => {
    if (authed && draft.authChoice !== 'authed') {
      draft.setAuthChoice('authed');
      goNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const redirectTarget = `/book/${partnerId}/${nextStep}`;
  const redirectQuery = `?redirect=${encodeURIComponent(redirectTarget)}`;

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.guestContact) return;
    if (
      !draft.guestContact.fullName.trim() ||
      !draft.guestContact.email.trim() ||
      !draft.guestContact.phone.trim()
    ) {
      return;
    }
    draft.setAuthChoice('guest');
    goNext();
  };

  if (mode === 'choose') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Continue your booking</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to track your bookings, or continue as a guest.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice
              icon={<LogIn className="size-5" />}
              title="Log in"
              subtitle="Use your existing Tiglemp account."
              onClick={() => navigate(`/login${redirectQuery}`)}
              highlight
            />
            <Choice
              icon={<UserPlus className="size-5" />}
              title="Create an account"
              subtitle="Save your details for faster bookings next time."
              onClick={() => navigate(`/signup${redirectQuery}`)}
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Choice
            icon={<UserRound className="size-5" />}
            title="Continue as guest"
            subtitle="No account needed. Heads up: you won't be able to track your booking history, and the only way you'll receive updates or notifications is by email."
            onClick={() => setMode('guest')}
          />
        </div>
      </div>
    );
  }

  const guest = draft.guestContact ?? { fullName: '', email: '', phone: '' };

  return (
    <form onSubmit={handleGuestSubmit} className="space-y-6" noValidate>
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Your contact details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll send your booking confirmation here. The business will use these
          to reach you.
        </p>
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6 grid gap-4">
        <Field
          label="Full name"
          value={guest.fullName}
          onChange={(v) =>
            draft.setGuestContact({ ...guest, fullName: v })
          }
          placeholder="Juan dela Cruz"
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Email"
            type="email"
            value={guest.email}
            onChange={(v) => draft.setGuestContact({ ...guest, email: v })}
            placeholder="you@example.com"
          />
          <Field
            label="Phone"
            type="tel"
            value={guest.phone}
            onChange={(v) => draft.setGuestContact({ ...guest, phone: v })}
            placeholder="+639171234567"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setMode('choose')}
        >
          Back
        </Button>
        <Button type="submit" className="h-11 px-6">
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}

function Choice({
  icon,
  title,
  subtitle,
  onClick,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        highlight
          ? 'w-full h-full text-left rounded-2xl bg-white ring-2 ring-primary hover:shadow-md transition-all p-5 group'
          : 'w-full h-full text-left rounded-2xl bg-white ring-1 ring-border hover:ring-primary/60 hover:shadow-md transition-all p-5 group'
      }
    >
      <div className="flex items-start gap-4">
        <div className="grid place-items-center size-12 rounded-xl bg-primary/10 text-primary shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 shrink-0 mt-1" />
      </div>
    </button>
  );
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}
