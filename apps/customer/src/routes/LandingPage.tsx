import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ServiceType } from '@/types/api';
import { PageMeta } from '@/components/PageMeta';
import { SiteNavbar } from '@/components/SiteNavbar';
import { Hero } from '@/components/Hero';
import { HeroPromoBar } from '@/components/HeroPromoBar';
import { WhyTiglemp } from '@/components/WhyTiglemp';
import { ServicesGrid } from '@/components/ServicesGrid';
import { LocationsCarousel } from '@/components/LocationsCarousel';
import { PartnerCta } from '@/components/PartnerCta';
import { Faq } from '@/components/Faq';
import { SiteFooter } from '@/components/SiteFooter';

export function LandingPage() {
  const serviceTypesQuery = useQuery({
    queryKey: ['meta', 'service-types'],
    queryFn: () => api.get<ServiceType[]>('/meta/service-types'),
    staleTime: 5 * 60 * 1000,
  });
  const apiServices = serviceTypesQuery.data?.data ?? [];

  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);

  // Default the hero tab to the first service once the list arrives.
  useEffect(() => {
    if (activeServiceId === null && apiServices.length > 0) {
      setActiveServiceId(apiServices[0].id);
    }
  }, [activeServiceId, apiServices]);

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
      <PageMeta
        title="Book trusted local cleaning services in the Philippines"
        description="Carwash, home cleaning, laundry, condo cleaning and more from verified local businesses across the Philippines. Book in 60 seconds with Tiglemp."
        suffix={false}
      />
      {/* Organization JSON-LD for rich results */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Tiglemp',
            url: 'https://tiglemp.com',
            logo: 'https://tiglemp.com/logo-tiger.png',
            sameAs: [],
            description:
              'Tiglemp connects customers in the Philippines with verified local cleaning, carwash, laundry and home-service businesses.',
            areaServed: { '@type': 'Country', name: 'Philippines' },
          }),
        }}
      />

      <SiteNavbar />

      <main>
        <Hero
          services={apiServices}
          servicesLoading={serviceTypesQuery.isPending}
          activeServiceId={activeServiceId}
          onActiveServiceIdChange={setActiveServiceId}
        />
        <HeroPromoBar />
        <WhyTiglemp />
        <ServicesGrid
          services={apiServices}
          loading={serviceTypesQuery.isPending}
          onBookService={handleBookService}
        />
        <LocationsCarousel />
        <PartnerCta />
        <Faq />
      </main>

      <SiteFooter />
    </>
  );
}
