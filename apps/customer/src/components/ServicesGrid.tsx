import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { SERVICES } from '@/lib/services-catalog';

type ServicesGridProps = {
  onBookService: (serviceId: string) => void;
};

const COLLAPSED_COUNT = 6;

// Soft, neutral cleaning-themed background (Unsplash). Heavy white overlay
// turns this into texture, not focal art — keeps the cards as the hero.
const SECTION_BG_URL =
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=2000&auto=format&fit=crop&q=80';

export function ServicesGrid({ onBookService }: ServicesGridProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleServices = expanded
    ? SERVICES
    : SERVICES.slice(0, COLLAPSED_COUNT);
  const hasMore = SERVICES.length > COLLAPSED_COUNT;
  const hiddenCount = SERVICES.length - COLLAPSED_COUNT;

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
          {visibleServices.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onBookService(service.id)}
                className="group text-left rounded-2xl bg-white p-5 ring-1 ring-border hover:ring-primary/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <div className="flex items-start gap-4">
                  <div className="size-12 shrink-0 rounded-xl bg-primary/12 grid place-items-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="size-6" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold leading-snug text-foreground">
                      {service.label}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {service.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                      Book now
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

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
                  Explore all {SERVICES.length} services
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
