import { ArrowRight } from 'lucide-react';

// Temporary placeholder — to be replaced with curated brand photography.
const PARTNER_BG_URL =
  'https://images.unsplash.com/photo-1649297711202-27e7535bd6fa?q=80&w=1546&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

export function PartnerCta() {
  return (
    <section
      aria-labelledby="partner-cta-heading"
      className="bg-foreground text-white"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-primary">
              For cleaning businesses
            </p>
            <h2
              id="partner-cta-heading"
              className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
            >
              Run a cleaning business?
            </h2>
            <p className="mt-4 text-base md:text-lg text-white/80 max-w-xl">
              Reach more customers, get bookings online, and grow without
              the marketing headache.
            </p>
            <div className="mt-8">
              <a
                href="/be-a-partner"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary text-primary-foreground font-bold text-base hover:opacity-95 transition-opacity shadow-lg shadow-primary/20"
              >
                Become a partner
                <ArrowRight className="size-5" />
              </a>
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-white/10 order-first lg:order-last">
            <img
              src={PARTNER_BG_URL}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
            {/* Subtle gradient lift so the photo edges blend with the dark
                section background. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
