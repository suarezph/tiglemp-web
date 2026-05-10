import { Tag } from 'lucide-react';

export function HeroPromoBar() {
  return (
    <section
      aria-label="First-time customer promo"
      className="bg-primary/10 border-b border-primary/15"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-3 sm:py-4">
        <div className="flex items-center justify-center gap-3 text-center text-sm sm:text-[15px]">
          <Tag className="size-4 sm:size-5 shrink-0 text-primary" />
          <p className="text-foreground">
            <span className="font-bold">First time on Tiglemp?</span>{' '}
            <span className="text-foreground/80">
              Get 10% off your first cleaning service.
            </span>{' '}
            <a
              href="/signup"
              className="font-bold text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Sign up now
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
