import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Loader2, Pencil, Star, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import type {
  PartnerPackage,
  PartnerPackagesResponse,
} from '@/types/api';
import { useBookingDraft } from '@/stores/booking-draft';
import { Button } from '@/components/ui/button';

export function PackagesPage() {
  const { partnerId = '' } = useParams();
  const navigate = useNavigate();
  const draft = useBookingDraft();
  const serviceTypeId = draft.search.serviceTypeId;

  const query = useQuery({
    queryKey: ['partner-packages', partnerId, serviceTypeId],
    queryFn: () =>
      api.get<PartnerPackagesResponse>(
        `/partners/${encodeURIComponent(partnerId)}/packages?serviceTypeId=${encodeURIComponent(
          serviceTypeId!
        )}`
      ),
    enabled: !!partnerId && !!serviceTypeId,
    staleTime: 60_000,
  });

  const data = query.data?.data;
  const packages: PartnerPackage[] = data?.packages ?? [];
  const customAllowed = data?.customRequestAllowed ?? false;
  const customOnly = packages.length === 0 && customAllowed;

  // Persist fulfillmentMode + requiresAddress from the package response so
  // downstream steps know whether to show the Address step.
  useEffect(() => {
    if (!data) return;
    draft.setServiceMeta({
      serviceTypeFulfillmentMode: data.serviceType.fulfillmentMode ?? null,
      serviceTypeRequiresAddress: data.serviceType.requiresAddress ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.serviceType.id]);

  const [view, setView] = useState<'packages' | 'custom'>(
    customOnly ? 'custom' : 'packages'
  );

  useEffect(() => {
    if (customOnly) setView('custom');
    else if (!customAllowed) setView('packages');
  }, [customOnly, customAllowed]);

  if (query.isPending) {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-border p-10 text-center">
        <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Loading packages…</p>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="flex items-center gap-2 text-destructive font-semibold">
          <XCircle className="size-4" />
          Couldn't load packages
        </p>
        <p className="mt-1 text-destructive/80">
          {query.error instanceof ApiError
            ? query.error.message
            : 'Something went wrong. Try refreshing the page.'}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-border p-8">
        <p className="font-semibold">Partner not found.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try going back to the search results.
        </p>
      </div>
    );
  }

  const noOptions = packages.length === 0 && !customAllowed;
  const selectedPackageId = draft.package?.id ?? null;

  const handlePickPackage = (pkgId: string) => {
    const pkg = packages.find((p) => p.id === pkgId);
    if (!pkg) return;
    draft.setPackage({
      id: pkg.id,
      name: pkg.name,
      priceFromPHP: pkg.price,
    });
  };

  const handleNext = () => {
    if (view === 'packages' && draft.package) {
      navigate(`/book/${partnerId}/auth`);
      return;
    }
    if (view === 'custom' && draft.customRequest?.description.trim()) {
      navigate(`/book/${partnerId}/auth`);
      return;
    }
  };

  const rating = data.partner.reviewSummary?.averageRating;
  const reviews = data.partner.reviewSummary?.totalReviews;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {draft.partner?.autoAssigned
            ? 'Auto-assigned business'
            : 'Selected business'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-xl md:text-2xl font-bold">
            {data.partner.businessName}
          </h1>
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
        <p className="mt-1 text-sm text-muted-foreground">
          {data.serviceType.name}
        </p>
      </header>

      {noOptions ? (
        <div className="rounded-2xl bg-white ring-1 ring-border p-8 text-center">
          <p className="font-semibold">No packages available yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This business hasn't published any packages for this service yet
            and doesn't accept custom requests.
          </p>
        </div>
      ) : (
        <>
          {!customOnly && customAllowed && (
            <div className="inline-flex rounded-full bg-foreground/5 p-1">
              <ViewToggle
                active={view === 'packages'}
                onClick={() => setView('packages')}
              >
                Packages
              </ViewToggle>
              <ViewToggle
                active={view === 'custom'}
                onClick={() => setView('custom')}
              >
                Custom request
              </ViewToggle>
            </div>
          )}

          {view === 'packages' ? (
            <ul className="grid gap-3">
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <li key={pkg.id}>
                    <button
                      type="button"
                      onClick={() => handlePickPackage(pkg.id)}
                      className={cn(
                        'w-full text-left rounded-2xl bg-white p-5 ring-1 transition-all',
                        isSelected
                          ? 'ring-2 ring-primary shadow-md'
                          : 'ring-border hover:ring-primary/50'
                      )}
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-base">{pkg.name}</h3>
                            {pkg.badgeLabel && (
                              <span className="inline-flex items-center rounded-full bg-primary/15 text-primary px-2 py-0.5 text-xs font-semibold">
                                {pkg.badgeLabel}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {pkg.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            From
                          </p>
                          <p className="font-bold text-lg">
                            {formatPrice(pkg.price, pkg.currency)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            ~{pkg.estimatedDurationMinutes} min
                          </p>
                        </div>
                      </div>
                      {pkg.features.length > 0 && (
                        <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                          {pkg.features.map((inc) => (
                            <li
                              key={inc}
                              className="flex items-center gap-2 text-xs text-muted-foreground"
                            >
                              <Check className="size-3.5 text-primary shrink-0" />
                              {inc}
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <CustomRequestCard customOnly={customOnly} />
          )}
        </>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          onClick={handleNext}
          disabled={
            noOptions ||
            (view === 'packages'
              ? !draft.package
              : !draft.customRequest?.description.trim())
          }
          className="h-11 px-6"
        >
          Continue
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-1.5 rounded-full text-sm font-semibold transition-colors',
        active
          ? 'bg-background shadow-sm text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function CustomRequestCard({ customOnly }: { customOnly: boolean }) {
  const draft = useBookingDraft();
  const description = draft.customRequest?.description ?? '';
  const budget = draft.customRequest?.budgetPHP ?? null;

  return (
    <div className="rounded-2xl bg-white ring-1 ring-border p-5 md:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="grid place-items-center size-10 rounded-xl bg-primary/10 text-primary shrink-0">
          <Pencil className="size-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base">
            {customOnly ? 'Tell us what you need' : "Don't see what you want?"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {customOnly
              ? 'This business handles every job by custom quote. Describe what you need and they will get back with pricing.'
              : 'Describe your job and the business will follow up with a custom quote. You can include rough budget and details.'}
          </p>
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-semibold">What do you need?</span>
        <textarea
          rows={5}
          value={description}
          onChange={(e) =>
            draft.setCustomRequest({
              description: e.target.value,
              budgetPHP: budget,
            })
          }
          placeholder="e.g. 3-BR house, kitchen + bathrooms only, prefer eco-friendly products."
          className="mt-1.5 block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold">Rough budget (optional)</span>
        <div className="mt-1.5 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            ₱
          </span>
          <input
            type="number"
            min={0}
            value={budget ?? ''}
            onChange={(e) => {
              const n = e.target.value.trim();
              draft.setCustomRequest({
                description,
                budgetPHP: n === '' ? null : Number(n),
              });
            }}
            className="block w-full rounded-xl border border-input bg-background pl-7 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="2000"
          />
        </div>
      </label>
    </div>
  );
}

function formatPrice(price: number, currency: string): string {
  const formatted = price.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (currency === 'PHP') return `₱${formatted}`;
  return `${currency} ${formatted}`;
}
