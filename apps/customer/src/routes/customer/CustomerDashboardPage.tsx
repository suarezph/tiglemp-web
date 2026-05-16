import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Star,
  UserCog,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import type {
  CustomerBookingListItem,
  CustomerBookingStatus,
} from '@/types/api';
import { useAuthStore } from '@/stores/auth';
import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { PageMeta } from '@/components/PageMeta';
import { Button } from '@/components/ui/button';
import { ProfileModal } from '@/routes/customer/ProfileModal';

type TabKey = 'upcoming' | 'past' | 'all';

const UPCOMING_STATUSES = new Set<string>([
  'PENDING_ASSIGNMENT',
  'AWAITING_PARTNER_APPROVAL',
  'APPROVED',
  'IN_PROGRESS',
]);

function isUpcomingStatus(status: CustomerBookingStatus): boolean {
  return UPCOMING_STATUSES.has(String(status));
}

const BOOKINGS_KEY = ['customer', 'bookings'] as const;

export function CustomerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('upcoming');
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  const query = useQuery({
    queryKey: BOOKINGS_KEY,
    queryFn: () => api.get<CustomerBookingListItem[]>('/customer/bookings'),
    retry: false,
  });

  const bookings = query.data?.data ?? [];

  const { upcoming, past, all } = useMemo(() => {
    const u: CustomerBookingListItem[] = [];
    const p: CustomerBookingListItem[] = [];
    for (const b of bookings) {
      (isUpcomingStatus(b.status) ? u : p).push(b);
    }
    u.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
    p.sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );
    return { upcoming: u, past: p, all: [...u, ...p] };
  }, [bookings]);

  const completedCount = past.filter((b) => b.status === 'COMPLETED').length;
  const greetingName = user?.email?.split('@')[0] ?? 'there';

  const visible = tab === 'upcoming' ? upcoming : tab === 'past' ? past : all;

  return (
    <>
      <PageMeta title="My bookings" noIndex />

      <SiteNavbar />
      <main className="bg-foreground/[0.02] min-h-[calc(100vh-60px)]">
        <div className="mx-auto max-w-[1100px] px-6 py-8 md:py-10 space-y-8">
          {/* Account strip */}
          <AccountStrip
            email={user?.email ?? null}
            onSignOut={handleSignOut}
            onOpenProfile={() => setProfileOpen(true)}
          />

          <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />

          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                My dashboard
              </p>
              <h1 className="mt-1 text-2xl md:text-3xl font-bold">
                Hi, {greetingName} 👋
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your bookings, track partner activity, and book new
                services in seconds.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="h-11">
                <Link to="/#book">
                  <Search className="size-4" />
                  Find a service
                </Link>
              </Button>
              <Button asChild className="h-11">
                <Link to="/#book">
                  <Plus className="size-4" />
                  New booking
                </Link>
              </Button>
            </div>
          </header>

          {/* Stat cards */}
          <section className="grid sm:grid-cols-3 gap-3">
            <StatCard
              icon={<CalendarClock className="size-5" />}
              label="Upcoming"
              value={upcoming.length}
              loading={query.isPending}
            />
            <StatCard
              icon={<CheckCircle2 className="size-5" />}
              label="Completed"
              value={completedCount}
              loading={query.isPending}
            />
            <StatCard
              icon={<Sparkles className="size-5" />}
              label="Total bookings"
              value={bookings.length}
              loading={query.isPending}
            />
          </section>

          {/* Tabs + bookings */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-bold">Your bookings</h2>
              <BookingTabs
                active={tab}
                onChange={setTab}
                counts={{
                  upcoming: upcoming.length,
                  past: past.length,
                  all: all.length,
                }}
              />
            </div>

            {query.isPending ? (
              <div className="rounded-2xl bg-white ring-1 ring-border p-10 text-center">
                <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Loading your bookings…
                </p>
              </div>
            ) : query.isError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
                <p className="flex items-center gap-2 text-destructive font-semibold">
                  <XCircle className="size-4" />
                  Couldn't load your bookings
                </p>
                <p className="mt-1 text-destructive/80">
                  {query.error instanceof ApiError
                    ? query.error.message
                    : 'Something went wrong. Try refreshing the page.'}
                </p>
              </div>
            ) : visible.length === 0 ? (
              <EmptyState
                title={
                  tab === 'upcoming'
                    ? 'No upcoming bookings'
                    : tab === 'past'
                    ? 'No past bookings yet'
                    : 'No bookings yet'
                }
                description={
                  tab === 'past'
                    ? 'Completed and cancelled bookings will appear here.'
                    : "When you book a service, it'll show up here."
                }
                action={
                  <Button asChild className="h-11">
                    <Link to="/#book">
                      <Plus className="size-4" />
                      Book a service
                    </Link>
                  </Button>
                }
              />
            ) : (
              <ul className="grid gap-3">
                {visible.map((b) => (
                  <li key={b.id}>
                    <BookingCard
                      booking={b}
                      muted={!isUpcomingStatus(b.status)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function AccountStrip({
  email,
  onSignOut,
  onOpenProfile,
}: {
  email: string | null;
  onSignOut: () => void;
  onOpenProfile: () => void;
}) {
  const initial = (email ?? '?')[0]?.toUpperCase() ?? '?';
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white ring-1 ring-border px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="grid place-items-center size-9 rounded-full bg-primary/10 text-primary font-bold shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Signed in as
          </p>
          <p className="text-sm font-semibold truncate">{email ?? 'Guest'}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onOpenProfile}
          className="inline-flex items-center gap-2 rounded-md px-3 h-9 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors"
        >
          <UserCog className="size-4" />
          <span className="hidden sm:inline">Profile</span>
        </button>
        <span
          className="hidden sm:block h-5 w-px bg-border"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-2 rounded-md px-3 h-9 text-sm font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </div>
  );
}

function BookingTabs({
  active,
  onChange,
  counts,
}: {
  active: TabKey;
  onChange: (next: TabKey) => void;
  counts: { upcoming: number; past: number; all: number };
}) {
  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { key: 'past', label: 'Past', count: counts.past },
    { key: 'all', label: 'All', count: counts.all },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] p-1">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 h-9 text-sm font-semibold transition-all',
              isActive
                ? 'bg-white shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
            <span
              className={cn(
                'grid place-items-center min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-foreground/10 text-muted-foreground'
              )}
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-border p-5">
      <div className="flex items-center gap-3">
        <div className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-bold mt-0.5">
            {loading ? (
              <span className="inline-block h-5 w-6 rounded bg-foreground/10 animate-pulse" />
            ) : (
              value
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  muted,
}: {
  booking: CustomerBookingListItem;
  muted?: boolean;
}) {
  const dt = new Date(booking.scheduledAt);
  const dateLabel = Number.isNaN(dt.getTime())
    ? booking.scheduledAt
    : dt.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

  const serviceName = booking.serviceType?.name ?? 'Service';
  const partnerName = booking.partner?.businessName ?? 'Partner';
  const partnerInitial = (partnerName[0] ?? '?').toUpperCase();
  const city = booking.serviceAddress?.city ?? null;
  const state = booking.serviceAddress?.state ?? null;
  const locationLabel = [city, state].filter(Boolean).join(', ');

  const isCustomRequest =
    booking.selectionMode === 'CUSTOM_REQUEST' ||
    (!booking.packageName && !!booking.customRequestText);

  return (
    <div
      className={cn(
        'rounded-2xl bg-white ring-1 ring-border p-5 transition-shadow hover:shadow-sm',
        muted && 'bg-foreground/[0.015]'
      )}
    >
      <div className="flex flex-wrap items-start gap-4">
        {/* Partner avatar */}
        <div className="size-12 shrink-0 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-lg">
          {partnerInitial}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-bold text-base">{serviceName}</h3>
            <StatusBadge status={booking.status} />
            {booking.hasReview && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
                <Star className="size-3" />
                Reviewed
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            with{' '}
            <span className="font-semibold text-foreground">{partnerName}</span>
          </p>
          {(booking.packageName || isCustomRequest) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {booking.packageName ?? 'Custom request'}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {dateLabel}
            </span>
            {locationLabel && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {locationLabel}
              </span>
            )}
            <span className="font-mono">{booking.bookingCode}</span>
          </div>

          {booking.notes && (
            <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
              {booking.notes}
            </p>
          )}
        </div>

        {/* Price + action */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
              {booking.price === null || booking.price === 0
                ? 'Quote'
                : 'Price'}
            </span>
            <span className="font-bold text-base">
              {formatPrice(booking.price, booking.currency)}
            </span>
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to={`/customer/bookings/${booking.bookingCode}`}>View</Link>
          </Button>
          {booking.canReview && !booking.hasReview && (
            <Button asChild size="sm" className="h-8 px-3 text-xs">
              <Link to={`/customer/bookings/${booking.bookingCode}/review`}>
                <Star className="size-3" />
                Leave a review
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CustomerBookingStatus }) {
  const norm = String(status).toUpperCase();
  const styles = (() => {
    switch (norm) {
      case 'COMPLETED':
        return 'bg-primary/10 text-primary';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-destructive/10 text-destructive';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800';
      case 'RELEASED':
        return 'bg-foreground/10 text-foreground';
      case 'PENDING_ASSIGNMENT':
      case 'AWAITING_PARTNER_APPROVAL':
      default:
        return 'bg-amber-100 text-amber-800';
    }
  })();

  const label = (() => {
    switch (norm) {
      case 'PENDING_ASSIGNMENT':
        return 'Pending assignment';
      case 'AWAITING_PARTNER_APPROVAL':
        return 'Awaiting partner';
      case 'APPROVED':
        return 'Approved';
      case 'IN_PROGRESS':
        return 'In progress';
      case 'COMPLETED':
        return 'Completed';
      case 'REJECTED':
        return 'Rejected';
      case 'CANCELLED':
        return 'Cancelled';
      case 'RELEASED':
        return 'Released';
      default:
        return norm
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/^./, (c) => c.toUpperCase());
    }
  })();

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

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-border p-10 text-center">
      <div className="size-12 mx-auto rounded-full bg-primary/10 text-primary grid place-items-center">
        <Sparkles className="size-6" />
      </div>
      <h3 className="mt-4 font-bold text-base">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

function formatPrice(
  price: number | null | undefined,
  currency: string | null | undefined
): string {
  if (price === null || price === undefined || Number.isNaN(price)) return 'TBD';
  if (price === 0) return 'TBD';
  const formatted = price.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (currency === 'PHP' || !currency) return `₱${formatted}`;
  return `${currency} ${formatted}`;
}
