import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkles, Star, Wand2 } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  CoverageCity,
  CoverageRegion,
  ServiceType,
} from '@/types/api';
import {
  listStubPartnersFor,
  pickStubAutoAssignedPartner,
  type StubPartner,
} from '@/lib/booking-stubs';
import { useBookingDraft } from '@/stores/booking-draft';
import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { Button } from '@/components/ui/button';

export function SearchResultsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setSearch = useBookingDraft((s) => s.setSearch);
  const setPartner = useBookingDraft((s) => s.setPartner);

  const serviceTypeId = params.get('serviceTypeId');
  const regionId = params.get('regionId');
  const cityId = params.get('cityId');
  const scheduledAt = params.get('at');

  const serviceTypesQuery = useQuery({
    queryKey: ['meta', 'service-types'],
    queryFn: () => api.get<ServiceType[]>('/meta/service-types'),
    staleTime: 5 * 60 * 1000,
  });
  const regionsQuery = useQuery({
    queryKey: ['meta', 'coverage-regions'],
    queryFn: () => api.getRaw<CoverageRegion[]>('/json/regions.json'),
    staleTime: 60 * 60 * 1000,
  });
  const citiesQuery = useQuery({
    queryKey: ['meta', 'coverage-cities'],
    queryFn: () => api.getRaw<CoverageCity[]>('/json/cities.json'),
    staleTime: 60 * 60 * 1000,
  });

  const serviceType = serviceTypesQuery.data?.data.find(
    (s) => s.id === serviceTypeId
  );
  const region = regionsQuery.data?.find((r) => String(r.id) === regionId);
  const city = citiesQuery.data?.find((c) => String(c.id) === cityId);

  // Persist search context into the draft once metadata resolves.
  useEffect(() => {
    if (!serviceTypeId || !regionId || !cityId) return;
    if (!serviceType || !region || !city) return;
    setSearch({
      serviceTypeId,
      serviceTypeName: serviceType.name,
      serviceTypeCode: serviceType.code,
      regionId,
      regionName: region.name,
      cityId,
      cityName: city.name,
      scheduledAt: scheduledAt ?? null,
    });
  }, [
    serviceTypeId,
    regionId,
    cityId,
    scheduledAt,
    serviceType,
    region,
    city,
    setSearch,
  ]);

  const partners = useMemo(
    () => listStubPartnersFor(serviceType?.code ?? null, cityId),
    [serviceType?.code, cityId]
  );

  const handlePickPartner = (partner: StubPartner) => {
    setPartner({
      id: partner.id,
      businessName: partner.businessName,
      autoAssigned: false,
    });
    navigate(`/book/${partner.id}/packages`);
  };

  const handleAutoAssign = () => {
    const auto = pickStubAutoAssignedPartner(
      serviceType?.code ?? null,
      cityId
    );
    if (!auto) return;
    setPartner({
      id: auto.id,
      businessName: auto.businessName,
      autoAssigned: true,
    });
    navigate(`/book/${auto.id}/packages`);
  };

  const headerSubtitle = (() => {
    const parts: string[] = [];
    if (serviceType) parts.push(serviceType.name);
    if (city && region) parts.push(`${city.name}, ${region.name}`);
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
            onClick={handleAutoAssign}
            disabled={partners.length === 0}
            className="mt-6 w-full text-left rounded-2xl bg-foreground text-background p-5 md:p-6 hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-start gap-4">
              <div className="grid place-items-center size-12 rounded-xl bg-primary/20 text-primary shrink-0">
                <Wand2 className="size-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider font-bold text-primary/90">
                  No preference
                </p>
                <h2 className="mt-1 text-lg md:text-xl font-bold">
                  Let Tiglemp pick the best business for me
                </h2>
                <p className="mt-1.5 text-sm text-background/80 max-w-xl">
                  We'll auto-match you with a verified, top-rated partner in
                  your area. Faster than picking yourself — and you can still
                  see who got the booking before confirming.
                </p>
              </div>
              <ArrowRight className="size-5 text-background/80 transition-transform group-hover:translate-x-1 shrink-0 mt-1" />
            </div>
          </button>

          {/* Partner list */}
          <div className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Or browse {partners.length}{' '}
              business{partners.length === 1 ? '' : 'es'}
            </h2>

            {partners.length === 0 ? (
              <div className="mt-4 rounded-2xl bg-background ring-1 ring-border p-8 text-center">
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
  partner: StubPartner;
  onPick: () => void;
}) {
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
            <span className="inline-flex items-center gap-1 text-sm">
              <Star className="size-3.5 fill-primary text-primary" />
              <span className="font-semibold">{partner.ratingAverage}</span>
              <span className="text-muted-foreground">
                ({partner.ratingCount})
              </span>
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {partner.blurb}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>{partner.yearsOnPlatform}+ years on Tiglemp</span>
            {partner.baseFromPHP !== null && (
              <span className="font-semibold text-foreground">
                From ₱{partner.baseFromPHP.toLocaleString()}
              </span>
            )}
          </div>
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
