import {
  CalendarClock,
  TrendingUp,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

type Benefit = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const BENEFITS: Benefit[] = [
  {
    icon: TrendingUp,
    title: 'More bookings, less hustle',
    description:
      'Customers find you through Tiglemp without you spending on ads. Show up where people are searching.',
  },
  {
    icon: CalendarClock,
    title: 'Bookings while you sleep',
    description:
      'Your shop is open 24/7 online. Customers pick a slot, you confirm — no late-night phone tag.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust that converts',
    description:
      'Verified-business badge plus real customer reviews build the credibility that wins the booking.',
  },
  {
    icon: Wallet,
    title: 'Clear, simple fees',
    description:
      'No setup cost. No monthly fee. We only earn when your business earns — so we both win.',
  },
];

export function PartnerBenefits() {
  return (
    <section
      aria-labelledby="partner-benefits-heading"
      className="bg-background"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-primary">
            Why Tiglemp
          </p>
          <h2
            id="partner-benefits-heading"
            className="mt-2 text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight"
          >
            Built to grow your cleaning business
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Whether you're a one-van carwash or a full-service cleaning
            company, Tiglemp gives you the tools and reach to scale —
            without the marketing overhead.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENEFITS.map((b) => (
            <article
              key={b.title}
              className="rounded-2xl bg-foreground/[0.03] p-6 sm:p-7 hover:bg-foreground/[0.05] transition-colors"
            >
              <div className="size-12 rounded-xl bg-primary/15 grid place-items-center text-primary">
                <b.icon className="size-6" strokeWidth={2} />
              </div>
              <h3 className="mt-5 text-base font-bold leading-snug">
                {b.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {b.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
