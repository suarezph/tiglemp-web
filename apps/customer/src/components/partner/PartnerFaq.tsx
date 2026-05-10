import { ChevronDown } from 'lucide-react';

type FaqEntry = {
  question: string;
  answer: string;
};

const FAQS: FaqEntry[] = [
  {
    question: 'How much does it cost to join Tiglemp?',
    answer:
      'Joining is free. There is no setup fee and no monthly subscription. We earn a small percentage only when a customer books and pays for one of your services — so we only succeed when you do.',
  },
  {
    question: 'How long does the application review take?',
    answer:
      'We typically verify and approve applications within 1–2 business days. You will receive an email once your business is live on Tiglemp.',
  },
  {
    question: 'Do I need a registered business to apply?',
    answer:
      'Yes — we require a valid business permit or DTI registration during the verification step. This is what helps us keep customer trust high across the marketplace.',
  },
  {
    question: 'Can I list multiple service types?',
    answer:
      'Absolutely. Many of our most successful partners offer carwash plus home cleaning plus laundry from the same shop. You can pick all that apply during signup.',
  },
  {
    question: 'How do I get paid?',
    answer:
      'Payouts are sent weekly to your bank account or e-wallet (GCash, Maya). You can track every booking and payout from your partner dashboard.',
  },
  {
    question: 'What if a customer cancels?',
    answer:
      'Our cancellation policy protects partners against late cancellations. If a customer cancels within the protected window, you are still compensated.',
  },
];

export function PartnerFaq() {
  return (
    <section
      aria-labelledby="partner-faq-heading"
      className="bg-background"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <h2
              id="partner-faq-heading"
              className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight"
            >
              Partner questions, answered
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-md">
              Everything cleaning business owners commonly ask before
              applying to Tiglemp.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Need a real conversation?{' '}
              <a
                href="/partner/help"
                className="font-bold text-primary underline underline-offset-2 hover:opacity-80"
              >
                Talk to our partner team
              </a>
            </p>
          </div>

          <div className="lg:pt-1">
            {FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group border-b border-border first:border-t"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer py-5 text-left transition-colors hover:text-primary">
                  <span className="text-base md:text-lg font-bold leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 group-open:text-primary" />
                </summary>
                <div className="pb-5 -mt-1 text-sm md:text-base leading-relaxed text-muted-foreground max-w-prose">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
