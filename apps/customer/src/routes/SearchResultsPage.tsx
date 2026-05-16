import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Loader2, Sparkles, Star, Wand2, XCircle } from 'lucide-react';
import { api, ApiError, generalApiErrorMessage } from '@/lib/api';
import type { SearchPartnerResult } from '@/types/api';
import { useBookingDraft } from '@/stores/booking-draft';
import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { PageMeta } from '@/components/PageMeta';
import { Button } from '@/components/ui/button';

function buildQuery(params: {
  serviceTypeId: string;
  regionId: string;
  cityId: string;
  at?: string | null;
}): string {
  const qs = new URLSearchParams();
  qs.set('serviceTypeId', params.serviceTypeId);
  qs.set('regionId', params.regionId);
  qs.set('cityId', params.cityId);
  if (params.at) qs.set('at', params.at);
  return qs.toString();
}

export function SearchResultsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setSearch = useBookingDraft((s) => s.setSearch);
  const setPartner = useBookingDraft((s) => s.setPartner);
  const setServiceMeta = useBookingDraft((s) => s.setServiceMeta);

  const serviceTypeId = params.get('serviceTypeId');
  const regionId = params.get('regionId');
  const cityId = params.get('cityId');
  const scheduledAt = params.get('at');

  const hasAllParams = !!serviceTypeId && !!regionId && !!cityId;

  const searchQuery = useQuery({
    queryKey: ['search', serviceTypeId, regionId, cityId, scheduledAt],
    queryFn: () =>
      api.get<SearchPartnerResult[]>(
        `/search?${buildQuery({
          serviceTypeId: serviceTypeId!,
          regionId: regionId!,
          cityId: cityId!,
          at: scheduledAt,
        })}`
      ),
    enabled: hasAllParams,
    staleTime: 30_000,
  });

  const partners = searchQuery.data?.data ?? [];

  // Once results land, persist the resolved service-type metadata + the
  // human-readable region/city into the draft so downstream steps don't
  // have to refetch.
  useEffect(() => {
    if (!hasAllParams || partners.length === 0) return;
    const first = partners[0];
    const st = first.serviceType;
    setSearch({
      serviceTypeId: serviceTypeId!,
      serviceTypeName: st.name,
      serviceTypeCode: st.code,
      serviceTypeFulfillmentMode: st.fulfillmentMode ?? null,
      serviceTypeRequiresAddress: st.requiresAddress ?? null,
      regionId: regionId!,
      regionName: first.matchContext?.region?.name ?? null,
      cityId: cityId!,
      cityName: first.matchContext?.city?.name ?? null,
      scheduledAt: scheduledAt ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partners.length, serviceTypeId, regionId, cityId, scheduledAt]);

  const autoMatch = useMutation({
    mutationFn: () =>
      api.get<SearchPartnerResult>(
        `/search/auto-match?${buildQuery({
          serviceTypeId: serviceTypeId!,
          regionId: regionId!,
          cityId: cityId!,
          at: scheduledAt,
        })}`
      ),
    onSuccess: (response) => {
      const p = response.data;
      setServiceMeta({
        serviceTypeFulfillmentMode: p.serviceType.fulfillmentMode ?? null,
        serviceTypeRequiresAddress: p.serviceType.requiresAddress ?? null,
      });
      setPartner({
        id: p.id,
        businessName: p.businessName,
        autoAssigned: true,
      });
      navigate(`/book/${p.id}/packages`);
    },
  });

  const handlePickPartner = (p: SearchPartnerResult) => {
    setServiceMeta({
      serviceTypeFulfillmentMode: p.serviceType.fulfillmentMode ?? null,
      serviceTypeRequiresAddress: p.serviceType.requiresAddress ?? null,
    });
    setPartner({
      id: p.id,
      businessName: p.businessName,
      autoAssigned: false,
    });
    navigate(`/book/${p.id}/packages`);
  };

  const headerSubtitle = (() => {
    const first = partners[0];
    const parts: string[] = [];
    if (first?.serviceType?.name) parts.push(first.serviceType.name);
    const city = first?.matchContext?.city?.name;
    const region = first?.matchContext?.region?.name;
    if (city && region) parts.push(`${city}, ${region}`);
    if (scheduledAt) {
      const d = new Date(scheduledAt);
      if (!Number.isNaN(d.getTime())) {
        parts.push(
          d.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        );
      }
    }
    return parts.join(' · ');
  })();

  return (
    <>
      <PageMeta
        title="Available businesses"
        description="Pick a verified local service business or let Tiglemp match you with the best fit."
        noIndex
      />
      <SiteNavbar />
      <main className="bg-foreground/[0.02] min-h-[calc(100vh-60px)]">
        <div className="mx-auto max-w-[1200px] px-6 py-8 md:py-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Available businesses
              </p>
              <h1 className="mt-1 text-2xl md:text-3xl font-bold">
                Pick a business or let us match you
              </h1>
              {headerSubtitle && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {headerSubtitle}
                </p>
              )}
            </div>
            <Link
              to="/#book"
              className="text-sm font-semibold text-primary underline underline-offset-2"
            >
              Edit search
            </Link>
          </div>

          {/* Auto-assign prominent CTA */}
          <button
            type="button"
            onClick={() => autoMatch.mutate()}
            disabled={
              partners.length === 0 ||
              searchQuery.isPending ||
              autoMatch.isPending
            }
            className="mt-6 w-full text-left rounded-2xl bg-foreground text-background p-5 md:p-6 hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-start gap-4">
              <div className="grid place-items-center size-12 rounded-xl bg-primary/20 text-primary shrink-0">
                {autoMatch.isPending ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <Wand2 className="size-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider font-bold text-primary/90">
                  No preference
                </p>
                <h2 className="mt-1 text-lg md:text-xl font-bold">
                  {autoMatch.isPending
                    ? 'Finding the best business…'
                    : 'Let Tiglemp pick the best business for me'}
                </h2>
                <p className="mt-1.5 text-sm text-background/80 max-w-xl">
                  We'll auto-match you with a verified partner in your area.
                  Faster than picking yourself — and you can still see who got
                  the booking before confirming.
                </p>
              </div>
              <ArrowRight className="size-5 text-background/80 transition-transform group-hover:translate-x-1 shrink-0 mt-1" />
            </div>
          </button>

          {autoMatch.isError && (
            <p className="mt-3 text-sm text-destructive">
              {generalApiErrorMessage(autoMatch.error) ??
                'Could not auto-match right now.'}
            </p>
          )}

          {/* Partner list */}
          <div className="mt-8">
            {!hasAllParams ? (
              <div className="rounded-2xl bg-background ring-1 ring-border p-8 text-center">
                <p className="font-semibold">Missing search parameters.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Go back to the homepage and choose a service, region, city,
                  and time.
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-flex text-sm font-semibold text-primary underline underline-offset-2"
                >
                  Edit search
                </Link>
              </div>
            ) : searchQuery.isPending ? (
              <div className="rounded-2xl bg-background ring-1 ring-border p-10 text-center">
                <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Looking for businesses near you…
                </p>
              </div>
            ) : searchQuery.isError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
                <p className="flex items-center gap-2 text-destructive font-semibold">
                  <XCircle className="size-4" />
                  Couldn't load results
                </p>
                <p className="mt-1 text-destructive/80">
                  {searchQuery.error instanceof ApiError
                    ? searchQuery.error.message
                    : 'Something went wrong. Try refreshing the page.'}
                </p>
              </div>
            ) : partners.length === 0 ? (
              <div className="rounded-2xl bg-background ring-1 ring-border p-8 text-center">
                <p className="font-semibold">No matches yet in this area.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different city or come back soon — we're onboarding
                  new partners every week.
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-flex text-sm font-semibold text-primary underline underline-offset-2"
                >
                  Edit search
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Or browse {partners.length}{' '}
                  business{partners.length === 1 ? '' : 'es'}
                </h2>
                <ul className="mt-4 grid gap-3">
                  {partners.map((p) => (
                    <li key={p.id}>
                      <PartnerCard
                        partner={p}
                        onPick={() => handlePickPartner(p)}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function PartnerCard({
  partner,
  onPick,
}: {
  partner: SearchPartnerResult;
  onPick: () => void;
}) {
  const rating = partner.reviewSummary?.averageRating;
  const reviews = partner.reviewSummary?.totalReviews;
  return (
    <button
      type="button"
      onClick={onPick}
      className="w-full text-left rounded-2xl bg-white ring-1 ring-border hover:ring-primary/60 hover:shadow-md transition-all p-5 group"
    >
      <div className="flex items-start gap-4">
        <div className="grid place-items-center size-12 rounded-xl bg-primary/10 text-primary shrink-0">
          <Sparkles className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-bold text-base md:text-lg truncate">
              {partner.businessName}
            </h3>
            {typeof rating === 'number' && (
              <span className="inline-flex items-center gap-1 text-sm">
                <Star className="size-3.5 fill-primary text-primary" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
                {typeof reviews === 'number' && (
                  <span className="text-muted-foreground">({reviews})</span>
                )}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {partner.serviceType.name}
            {partner.matchContext?.city?.name &&
              ` · serves ${partner.matchContext.city.name}`}
          </p>
        </div>
        <Button asChild variant="default" size="sm" className="shrink-0">
          <span className="pointer-events-none">
            Select
            <ArrowRight className="size-4" />
          </span>
        </Button>
      </div>
    </button>
  );
}
