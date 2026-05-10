import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
  Autoplay,
  A11y,
  Keyboard,
  Navigation,
  Pagination,
} from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

type City = {
  id: string;
  name: string;
  region: string;
  serviceCount: number;
  imageUrl: string;
};

// Top Philippine metros for the launch. Image URLs are seeded picsum.photos
// placeholders — swap each for a curated city / landmark photo later.
const CITIES: City[] = [
  {
    id: 'manila',
    name: 'Manila',
    region: 'Metro Manila',
    serviceCount: 2500,
    imageUrl: 'https://picsum.photos/seed/tiglemp-manila/640/480',
  },
  {
    id: 'cebu-city',
    name: 'Cebu City',
    region: 'Cebu',
    serviceCount: 1200,
    imageUrl: 'https://picsum.photos/seed/tiglemp-cebu/640/480',
  },
  {
    id: 'davao-city',
    name: 'Davao City',
    region: 'Davao',
    serviceCount: 820,
    imageUrl: 'https://picsum.photos/seed/tiglemp-davao/640/480',
  },
  {
    id: 'iloilo-city',
    name: 'Iloilo City',
    region: 'Iloilo',
    serviceCount: 460,
    imageUrl: 'https://picsum.photos/seed/tiglemp-iloilo/640/480',
  },
  {
    id: 'baguio-city',
    name: 'Baguio',
    region: 'Benguet',
    serviceCount: 340,
    imageUrl: 'https://picsum.photos/seed/tiglemp-baguio/640/480',
  },
  {
    id: 'cagayan-de-oro',
    name: 'Cagayan de Oro',
    region: 'Misamis Oriental',
    serviceCount: 290,
    imageUrl: 'https://picsum.photos/seed/tiglemp-cdo/640/480',
  },
  {
    id: 'bacolod-city',
    name: 'Bacolod',
    region: 'Negros Occidental',
    serviceCount: 240,
    imageUrl: 'https://picsum.photos/seed/tiglemp-bacolod/640/480',
  },
];

export function LocationsCarousel() {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);

  return (
    <section
      aria-labelledby="cities-heading"
      className="bg-background border-y border-border"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <h2
            id="cities-heading"
            className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight"
          >
            Cities we serve
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Verified cleaning businesses, ready to book across the
            Philippines.
          </p>
        </div>

        <div className="mt-8 md:mt-10 relative">
          {/* Custom nav chevrons — desktop only, edge-anchored. */}
          <button
            ref={prevRef}
            type="button"
            aria-label="Previous cities"
            className="hidden md:grid place-items-center absolute -left-2 top-[130px] z-10 size-10 rounded-full bg-white shadow-lg ring-1 ring-border hover:ring-primary transition-colors disabled:opacity-0 disabled:cursor-default"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            ref={nextRef}
            type="button"
            aria-label="Next cities"
            className="hidden md:grid place-items-center absolute -right-2 top-[130px] z-10 size-10 rounded-full bg-white shadow-lg ring-1 ring-border hover:ring-primary transition-colors disabled:opacity-0 disabled:cursor-default"
          >
            <ChevronRight className="size-5" />
          </button>

          {/* Edge fade mask: cards at the very left/right fade to transparent
              so the row visually hints at "more on either side". */}
          <div className="-mx-6 px-6 [mask-image:linear-gradient(to_right,transparent,black_32px,black_calc(100%-32px),transparent)]">
            <Swiper
              modules={[Autoplay, Pagination, Navigation, Keyboard, A11y]}
              slidesPerView="auto"
              spaceBetween={16}
              loop
              grabCursor
              keyboard={{ enabled: true }}
              autoplay={{
                delay: 10000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              pagination={{
                clickable: true,
                el: paginationRef.current,
              }}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              onBeforeInit={(swiper: SwiperType) => {
                // Refs aren't populated on first render — wire them in just
                // before Swiper initializes so navigation + pagination
                // attach to our custom elements.
                if (typeof swiper.params.navigation === 'object') {
                  swiper.params.navigation.prevEl = prevRef.current;
                  swiper.params.navigation.nextEl = nextRef.current;
                }
                if (typeof swiper.params.pagination === 'object') {
                  swiper.params.pagination.el = paginationRef.current;
                }
              }}
              style={
                {
                  '--swiper-pagination-color': '#fe9a00',
                  '--swiper-pagination-bullet-inactive-color': '#1c1c1c',
                  '--swiper-pagination-bullet-inactive-opacity': '0.2',
                  '--swiper-pagination-bullet-size': '9px',
                  '--swiper-pagination-bullet-horizontal-gap': '4px',
                } as React.CSSProperties
              }
              className="!overflow-visible"
            >
              {CITIES.map((city) => (
                <SwiperSlide
                  key={city.id}
                  className="!w-[240px] sm:!w-[260px]"
                >
                  <a
                    href="#book"
                    className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-2xl"
                  >
                    <div className="aspect-square overflow-hidden bg-foreground/5 rounded-2xl">
                      <img
                        src={city.imageUrl}
                        alt=""
                        loading="lazy"
                        draggable={false}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="px-1 pt-3 pb-1">
                      <h3 className="text-base font-bold text-foreground">
                        {city.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {city.serviceCount.toLocaleString()}+ cleaning
                        services
                      </p>
                    </div>
                  </a>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* External pagination dots — sit cleanly under the row, in brand
              colours via the swiper-pagination-* CSS variables above. */}
          <div
            ref={paginationRef}
            className="mt-6 flex justify-center"
          />
        </div>
      </div>
    </section>
  );
}
