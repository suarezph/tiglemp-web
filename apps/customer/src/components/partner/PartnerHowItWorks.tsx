import { ClipboardCheck, BadgeCheck, BellRing, BarChart3 } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardCheck,
    title: 'Apply online',
    description:
      'Tell us about your business and the services you offer. Takes about 60 seconds.',
  },
  {
    icon: BadgeCheck,
    title: 'Get verified',
    description:
      'Our team reviews your application and verifies your business documents within 1–2 business days.',
  },
  {
    icon: BellRing,
    title: 'Receive bookings',
    description:
      'Your services go live on Tiglemp. Customers book — you confirm in the partner dashboard.',
  },
  {
    icon: BarChart3,
    title: 'Grow your shop',
    description:
      'Track earnings, manage your team, and unlock featured placement as you collect reviews.',
  },
];

export function PartnerHowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="partner-how-heading"
      className="bg-foreground/[0.03] border-y border-border scroll-mt-20"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-primary">
            How it works
          </p>
          <h2
            id="partner-how-heading"
            className="mt-2 text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight"
          >
            From application to first booking — in days
          </h2>
        </div>

        <ol className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, idx) => (
            <li
              key={step.title}
              className="relative rounded-2xl bg-background ring-1 ring-border p-6"
            >
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-bold shrink-0">
                  {idx + 1}
                </div>
                <step.icon className="size-5 text-primary mt-1" strokeWidth={2} />
              </div>
              <h3 className="mt-4 text-base font-bold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
