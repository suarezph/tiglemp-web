import { ChevronDown } from 'lucide-react';

type FaqEntry = {
  question: string;
  answer: string;
};

const FAQS: FaqEntry[] = [
  {
    question: 'How does Tiglemp work?',
    answer:
      'Pick the cleaning service you need, choose your region and city, and set a date and time. We match you with a verified local cleaning business and confirm right away — no phone tag, no quotes, no waiting.',
  },
  {
    question: 'Are the cleaning businesses on Tiglemp verified?',
    answer:
      'Yes. Every business is reviewed and verified before going live, and you can read real customer ratings on each booking. We monitor reviews on an ongoing basis and remove providers that fall short of our standards.',
  },
  {
    question: 'How much does a service cost?',
    answer:
      'Prices are set by each cleaning business and shown upfront before you confirm. No hidden fees, no surprise charges — what you see is what you pay.',
  },
  {
    question: 'What if I need to cancel or reschedule?',
    answer:
      'You can reschedule or cancel from your My Bookings page up to 24 hours before the appointment. Last-minute changes may carry a small fee depending on the provider, and the policy is shown before you confirm.',
  },
  {
    question: 'Which areas does Tiglemp cover?',
    answer:
      'We are launching across Metro Manila, Cebu, Davao, and other major cities in the Philippines, with new locations added regularly. Pick your region in the search to see what is available near you today.',
  },
  {
    question: 'How do I pay for my booking?',
    answer:
      'Pay online with major credit and debit cards, GCash, or Maya. Some providers also accept cash on completion — you will see the available payment options before you confirm your booking.',
  },
  {
    question: 'What if I am not happy with the service?',
    answer:
      'Reach out to support within 24 hours of completion and we will work directly with the provider to make it right. Repeated issues with a provider trigger a review on our end.',
  },
  {
    question: 'Do I need an account to book?',
    answer:
      'You can browse without one, but you will need a free account to confirm a booking. Signup takes about 30 seconds and lets you track your bookings, reorder favourites, and unlock first-time discounts.',
  },
];

export function Faq() {
  return (
    <section
      aria-labelledby="faq-heading"
      className="bg-background border-t border-border"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <h2
              id="faq-heading"
              className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight"
            >
              Your questions, answered
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-md">
              Everything you need to know before you book your first
              cleaning service on Tiglemp.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Still have questions?{' '}
              <a
                href="/help"
                className="font-bold text-primary underline underline-offset-2 hover:opacity-80"
              >
                Visit our help center
              </a>
            </p>
          </div>

          <div className="lg:pt-1">
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} {...faq} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: FaqEntry) {
  return (
    <details className="group border-b border-border first:border-t">
      <summary className="flex items-center justify-between gap-4 cursor-pointer py-5 text-left transition-colors hover:text-primary">
        <span className="text-base md:text-lg font-bold leading-snug">
          {question}
        </span>
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180 group-open:text-primary" />
      </summary>
      <div className="pb-5 -mt-1 text-sm md:text-base leading-relaxed text-muted-foreground max-w-prose">
        {answer}
      </div>
    </details>
  );
}
