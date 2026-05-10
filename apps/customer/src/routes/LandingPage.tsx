import { useState } from 'react';
import { SiteNavbar } from '@/components/SiteNavbar';
import { Hero } from '@/components/Hero';
import { HeroPromoBar } from '@/components/HeroPromoBar';
import { WhyTiglemp } from '@/components/WhyTiglemp';
import { ServicesGrid } from '@/components/ServicesGrid';
import { LocationsCarousel } from '@/components/LocationsCarousel';
import { PartnerCta } from '@/components/PartnerCta';
import { Faq } from '@/components/Faq';
import { SiteFooter } from '@/components/SiteFooter';
import { SERVICES } from '@/lib/services-catalog';

export function LandingPage() {
  const [activeServiceId, setActiveServiceId] = useState<string>(
    SERVICES[0].id
  );

  // Clicking "Book now" on a service card selects that service in the hero
  // search tabs and smooth-scrolls back up to the booking area.
  const handleBookService = (serviceId: string) => {
    setActiveServiceId(serviceId);
    requestAnimationFrame(() => {
      document
        .getElementById('book')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <>
      <title>Tiglemp — Book trusted local cleaning services</title>
      <meta
        name="description"
        content="Book carwash, home cleaning, laundry, condo cleaning and more from trusted local cleaning businesses. Tiglemp helps small cleaning shops grow online."
      />

      <SiteNavbar />

      <main>
        <Hero
          activeServiceId={activeServiceId}
          onActiveServiceIdChange={setActiveServiceId}
        />
        <HeroPromoBar />
        <WhyTiglemp />
        <ServicesGrid onBookService={handleBookService} />
        <LocationsCarousel />
        <PartnerCta />
        <Faq />
      </main>

      <SiteFooter />
    </>
  );
}
