import { PageMeta } from '@/components/PageMeta';
import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';
import { PartnerHero } from '@/components/partner/PartnerHero';
import { PartnerBenefits } from '@/components/partner/PartnerBenefits';
import { PartnerHowItWorks } from '@/components/partner/PartnerHowItWorks';
import { PartnerRegisterForm } from '@/components/partner/PartnerRegisterForm';
import { PartnerFaq } from '@/components/partner/PartnerFaq';

export function BePartnerPage() {
  return (
    <>
      <PageMeta
        title="Be a Tiglemp partner — grow your cleaning business online"
        description="Reach more local customers, take bookings 24/7, and grow your cleaning, carwash or laundry business with Tiglemp. Free to join — apply in 60 seconds."
        suffix={false}
      />

      <SiteNavbar />

      <main>
        <PartnerHero />
        <PartnerBenefits />
        <PartnerHowItWorks />

        <section
          id="apply"
          aria-labelledby="apply-heading"
          className="bg-foreground/[0.03] border-t border-border scroll-mt-20"
        >
          <div className="mx-auto max-w-[1440px] px-6 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16">
              <div className="lg:sticky lg:top-24 self-start">
                <p className="text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-primary">
                  Apply now
                </p>
                <h2
                  id="apply-heading"
                  className="mt-2 text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight"
                >
                  Ready to grow?
                </h2>
                <p className="mt-3 text-base text-muted-foreground max-w-md">
                  It takes about 60 seconds. We'll verify your business
                  within 1–2 business days and get you live on Tiglemp.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                  <Bullet>No setup fee — free to join</Bullet>
                  <Bullet>Pay only on completed bookings</Bullet>
                  <Bullet>Cancel anytime, no questions asked</Bullet>
                </ul>
              </div>

              <PartnerRegisterForm />
            </div>
          </div>
        </section>

        <PartnerFaq />
      </main>

      <SiteFooter />
    </>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        aria-hidden="true"
        className="mt-1 size-1.5 rounded-full bg-primary shrink-0"
      />
      <span>{children}</span>
    </li>
  );
}
