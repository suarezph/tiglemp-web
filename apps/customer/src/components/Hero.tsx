import { ServiceTabs } from '@/components/ServiceTabs';
import { SearchForm } from '@/components/SearchForm';
import { getServiceIcon } from '@/lib/service-icons';
import type { ServiceType } from '@/types/api';

// Temporary background image — to be replaced with a curated asset later.
const HERO_BG_URL =
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=2000&auto=format&fit=crop&q=80';

type HeroProps = {
  services: ServiceType[];
  servicesLoading: boolean;
  activeServiceId: string | null;
  onActiveServiceIdChange: (id: string) => void;
};

export function Hero({
  services,
  servicesLoading,
  activeServiceId,
  onActiveServiceIdChange,
}: HeroProps) {
  return (
    <section className="relative isolate">
      {/* Background image */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_BG_URL})` }}
      />
      {/* Dark gradient overlay so light type stays readable */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/45 to-black/30"
      />

      <div className="mx-auto max-w-[1440px] px-6 pt-24 md:pt-36 pb-48 md:pb-64">
        <div className="text-center text-white">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight whitespace-nowrap">
            Book trusted local cleaning services
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/85">
            Less mess, more rest. Book a local pro in 60 seconds.
          </p>
        </div>

        <div id="book" className="mt-10 md:mt-14 max-w-6xl mx-auto scroll-mt-20">
          <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
            <ServiceTabs
              services={services.map((s) => ({
                id: s.id,
                label: s.name,
                icon: getServiceIcon(s.code),
              }))}
              activeId={activeServiceId}
              onChange={onActiveServiceIdChange}
              loading={servicesLoading}
            />
            <SearchForm serviceId={activeServiceId} />
          </div>
        </div>
      </div>
    </section>
  );
}
