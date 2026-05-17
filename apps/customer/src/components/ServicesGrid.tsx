import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getServiceIcon } from '@/lib/service-icons';
import type { ServiceType } from '@/types/api';

type ServicesGridProps = {
  services: ServiceType[];
  loading?: boolean;
  onBookService: (serviceId: string) => void;
};

const COLLAPSED_COUNT = 6;
const SKELETON_COUNT = 6;

// Soft, neutral cleaning-themed background (Unsplash). Heavy white overlay
// turns this into texture, not focal art — keeps the cards as the hero.
const SECTION_BG_URL =
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=2000&auto=format&fit=crop&q=80';

export function ServicesGrid({
  services,
  loading,
  onBookService,
}: ServicesGridProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleServices = expanded
    ? services
    : services.slice(0, COLLAPSED_COUNT);
  const hasMore = services.length > COLLAPSED_COUNT;
  const hiddenCount = services.length - COLLAPSED_COUNT;

  return (
    <section
      aria-labelledby="services-heading"
      className="relative isolate"
    >
      {/* Background image */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${SECTION_BG_URL})` }}
      />
      {/* Wash overlay — keeps the photo as a soft texture instead of an
          attention thief, ensures the cards stay legible. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-white/92 backdrop-blur-sm"
      />

      <div className="mx-auto max-w-[1440px] px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-primary">
            Browse the marketplace
          </p>
          <h2
            id="services-heading"
            className="mt-2 text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight"
          >
            All cleaning services in one place
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            From a quick carwash to a full move-out deep clean, pick what
            you need and confirm in under a minute. Every business on
            Tiglemp is verified and reviewed.
          </p>
        </div>

        <div className="mt-10 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && services.length === 0
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="rounded-2xl bg-white p-5 ring-1 ring-border"
                  aria-hidden="true"
                >
                  <div className="flex items-start gap-4">
                    <div className="size-12 shrink-0 rounded-xl bg-foreground/5 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/2 rounded bg-foreground/10 animate-pulse" />
                      <div className="h-3 w-full rounded bg-foreground/5 animate-pulse" />
                      <div className="h-3 w-3/4 rounded bg-foreground/5 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))
            : visibleServices.map((service) => {
                const Icon = getServiceIcon(service.code);
                const unavailable = service.partnerCount === 0;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => onBookService(service.id)}
                    disabled={unavailable}
                    aria-disabled={unavailable || undefined}
                    title={unavailable ? 'No partners yet' : undefined}
                    className={cn(
                      'group text-left rounded-2xl bg-white p-5 ring-1 ring-border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                      unavailable
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:ring-primary/50 hover:shadow-lg hover:-translate-y-0.5'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'size-12 shrink-0 rounded-xl grid place-items-center transition-colors',
                          unavailable
                            ? 'bg-foreground/5 text-muted-foreground'
                            : 'bg-primary/12 text-primary group-hover:bg-primary group-hover:text-white'
                        )}
                      >
                        <Icon className="size-6" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-bold leading-snug text-foreground">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            {service.description}
                          </p>
                        )}
                        {unavailable ? (
                          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                            No partners yet
                          </span>
                        ) : (
                          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                            Book now
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
        </div>

        {!loading && services.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No services available yet. Check back soon.
          </p>
        )}

        {hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white ring-1 ring-border text-foreground font-bold text-sm hover:ring-primary hover:text-primary hover:shadow-md transition-all"
            >
              {expanded ? (
                <>
                  <ChevronUp className="size-4" />
                  Show less
                </>
              ) : (
                <>
                  Explore all {services.length} services
                  <ChevronDown className="size-4" />
                </>
              )}
            </button>
          </div>
        )}
        {!expanded && hasMore && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            +{hiddenCount} more services available
          </p>
        )}
      </div>
    </section>
  );
}
