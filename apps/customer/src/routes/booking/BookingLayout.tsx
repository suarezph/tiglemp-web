import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { Check, ChevronDown, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBookingDraft } from '@/stores/booking-draft';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';
import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';

const STEP_ORDER = ['packages', 'auth', 'address', 'review'] as const;
type StepKey = (typeof STEP_ORDER)[number];

const STEP_LABELS: Record<StepKey, string> = {
  packages: 'Package',
  auth: 'Account',
  address: 'Address',
  review: 'Review',
};

export function BookingLayout() {
  const { partnerId } = useParams();
  const location = useLocation();
  const currentStep = (location.pathname.split('/').pop() ?? 'packages') as StepKey;
  const draft = useBookingDraft();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(summaryRef, () => setSummaryOpen(false));

  // Close the floating summary on Escape.
  useEffect(() => {
    if (!summaryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSummaryOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [summaryOpen]);

  const filledCount = [
    !!draft.partner,
    !!draft.package || !!draft.customRequest,
    !!draft.address,
  ].filter(Boolean).length;

  return (
    <>
      <SiteNavbar />

      <main className="bg-foreground/[0.02] min-h-[calc(100vh-60px)]">
        <div className="mx-auto max-w-[1200px] px-6 py-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <Link
              to="/search"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to results
            </Link>

            {/* Mobile-only summary popover. The right-rail still owns desktop. */}
            <div ref={summaryRef} className="lg:hidden relative">
              <button
                type="button"
                onClick={() => setSummaryOpen((o) => !o)}
                aria-expanded={summaryOpen}
                aria-haspopup="dialog"
                className={cn(
                  'inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-border px-3 py-1.5 text-sm font-semibold transition-colors',
                  'hover:bg-foreground/[0.03]',
                  summaryOpen && 'ring-primary/40'
                )}
              >
                <ClipboardList className="size-4 text-muted-foreground" />
                Your selection
                {filledCount > 0 && (
                  <span className="grid place-items-center size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {filledCount}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    'size-4 text-muted-foreground transition-transform',
                    summaryOpen && 'rotate-180'
                  )}
                />
              </button>

              {summaryOpen && (
                <div
                  role="dialog"
                  aria-label="Your selection"
                  className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(20rem,calc(100vw-2rem))] origin-top-right"
                >
                  <SummaryRail />
                </div>
              )}
            </div>
          </div>

          <Stepper
            currentStep={currentStep}
            partnerId={partnerId ?? ''}
            authDone={!!draft.authChoice}
            packageDone={!!draft.package || !!draft.customRequest}
            addressDone={!!draft.address}
          />

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <div className="min-w-0">
              <Outlet />
            </div>
            <aside className="hidden lg:block lg:sticky lg:top-6 self-start">
              <SummaryRail />
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function Stepper({
  currentStep,
  partnerId,
  packageDone,
  authDone,
  addressDone,
}: {
  currentStep: StepKey;
  partnerId: string;
  packageDone: boolean;
  authDone: boolean;
  addressDone: boolean;
}) {
  const stepStates: Record<StepKey, boolean> = {
    packages: packageDone,
    auth: authDone,
    address: addressDone,
    review: false,
  };
  return (
    <ol className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
      {STEP_ORDER.map((step, idx) => {
        const isActive = step === currentStep;
        const isDone = stepStates[step] && !isActive;
        return (
          <li key={step} className="flex items-center gap-3 shrink-0">
            <NavLink
              to={`/book/${partnerId}/${step}`}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isDone
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span
                className={cn(
                  'grid place-items-center size-5 rounded-full text-xs',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : isDone
                    ? 'bg-foreground text-background'
                    : 'border border-border'
                )}
              >
                {isDone ? <Check className="size-3" /> : idx + 1}
              </span>
              {STEP_LABELS[step]}
            </NavLink>
            {idx < STEP_ORDER.length - 1 && (
              <span
                aria-hidden="true"
                className="h-px w-6 bg-border shrink-0"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function SummaryRail() {
  const draft = useBookingDraft();

  const scheduleLabel = (() => {
    if (!draft.search.scheduledAt) return null;
    const d = new Date(draft.search.scheduledAt);
    if (Number.isNaN(d.getTime())) return draft.search.scheduledAt;
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  })();

  return (
    <div className="rounded-2xl bg-white ring-1 ring-border shadow-sm p-5 space-y-5">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Your selection
        </h3>
      </div>

      <SummaryRow label="Service" value={draft.search.serviceTypeName} />
      <SummaryRow
        label="Where"
        value={
          draft.search.cityName && draft.search.regionName
            ? `${draft.search.cityName}, ${draft.search.regionName}`
            : draft.search.regionName ?? null
        }
      />
      <SummaryRow label="When" value={scheduleLabel} />

      <div className="border-t border-border pt-4 space-y-4">
        <SummaryRow
          label="Partner"
          value={
            draft.partner
              ? `${draft.partner.businessName}${
                  draft.partner.autoAssigned ? ' · auto-assigned' : ''
                }`
              : null
          }
        />
        <SummaryRow
          label="Package"
          value={
            draft.package?.name ??
            (draft.customRequest ? 'Custom request' : null)
          }
        />
        {draft.address && (
          <SummaryRow
            label="Address"
            value={`${draft.address.line1}, ${draft.address.city}`}
          />
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="grid gap-1">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'text-sm',
          value ? 'font-medium text-foreground' : 'text-muted-foreground italic'
        )}
      >
        {value ?? 'Not set yet'}
      </p>
    </div>
  );
}
