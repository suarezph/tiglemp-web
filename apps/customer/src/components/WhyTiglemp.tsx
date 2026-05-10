import {
  ShieldCheck,
  Sparkles,
  Zap,
  Store,
  type LucideIcon,
} from 'lucide-react';

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: ShieldCheck,
    title: 'Verified local pros',
    description:
      'Every business is reviewed and verified, book without the worry of fly-by-night services.',
  },
  {
    icon: Sparkles,
    title: 'All cleaning, one place',
    description:
      'Carwash, home, laundry, aircon and more, every cleaning service at your fingertips.',
  },
  {
    icon: Zap,
    title: 'Book in 60 seconds',
    description:
      'Pick a time, confirm online, done. No phone calls, no quotes, no waiting around.',
  },
  {
    icon: Store,
    title: 'Built for small businesses',
    description:
      'We help neighborhood cleaning shops grow online and reach customers across the region.',
  },
];

export function WhyTiglemp() {
  return (
    <section
      aria-labelledby="why-tiglemp-heading"
      className="bg-background"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:py-20">
        <h2
          id="why-tiglemp-heading"
          className="text-2xl md:text-3xl font-bold tracking-tight"
        >
          Why Tiglemp?
        </h2>

        <div className="mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description }: Feature) {
  return (
    <article className="rounded-2xl bg-foreground/[0.03] p-6 sm:p-7 transition-colors hover:bg-foreground/[0.05]">
      <div className="size-12 rounded-xl bg-primary/15 grid place-items-center text-primary">
        <Icon className="size-6" strokeWidth={2} />
      </div>
      <h3 className="mt-5 text-base font-bold leading-snug text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </article>
  );
}
