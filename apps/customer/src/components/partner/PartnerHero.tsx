import { ArrowRight } from 'lucide-react';

const PARTNER_HERO_BG_URL =
  'https://images.unsplash.com/photo-1649297711202-27e7535bd6fa?q=80&w=1546&auto=format&fit=crop';

export function PartnerHero() {
  return (
    <section
      aria-labelledby="partner-hero-heading"
      className="relative isolate text-white"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${PARTNER_HERO_BG_URL})` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-foreground/80 via-foreground/70 to-foreground/85"
      />

      <div className="mx-auto max-w-[1440px] px-6 py-20 md:py-28 lg:py-32">
        <div className="max-w-2xl">
          <p className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-primary">
            For cleaning businesses
          </p>
          <h1
            id="partner-hero-heading"
            className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
          >
            Grow your cleaning business online
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/85 max-w-xl">
            Reach more customers, take bookings 24/7, and skip the marketing
            headache. Tiglemp connects local cleaning shops with people
            ready to book today.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#apply"
              className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary text-primary-foreground font-bold text-base hover:opacity-95 transition-opacity shadow-lg shadow-primary/20"
            >
              Apply now
              <ArrowRight className="size-5" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center h-12 px-7 rounded-full ring-1 ring-white/30 text-white font-bold text-base hover:bg-white/10 transition-colors"
            >
              How it works
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-6 max-w-md text-sm">
            <Stat value="0%" label="Setup fee" />
            <Stat value="60s" label="To apply" />
            <Stat value="24/7" label="Bookings online" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-white/60">
        {label}
      </div>
    </div>
  );
}
