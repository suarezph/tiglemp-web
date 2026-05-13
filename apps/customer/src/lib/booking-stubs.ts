// Frontend-only stub data for the booking wizard. These mirror the shape we
// expect from the backend (see docs/booking-api.md) so swapping to real
// network calls later is a one-line change in each consumer.

export type StubPartner = {
  id: string;
  businessName: string;
  blurb: string;
  ratingAverage: number;
  ratingCount: number;
  yearsOnPlatform: number;
  baseFromPHP: number | null;
  /** Service-type codes this partner serves — used for filtering. */
  serviceTypeCodes: string[];
  /** Coverage city ids (strings to match the URL params). */
  coverageCityIds: string[];
};

export type StubPackage = {
  id: string;
  partnerId: string;
  serviceTypeCode: string;
  name: string;
  priceFromPHP: number;
  description: string;
  inclusions: string[];
  durationMinutes: number;
  popular?: boolean;
};

export const STUB_PARTNERS: StubPartner[] = [
  {
    id: 'p-bright-shine',
    businessName: 'Bright Shine Carwash',
    blurb: 'Mobile and on-site carwash crew with a 4.8★ track record.',
    ratingAverage: 4.8,
    ratingCount: 1242,
    yearsOnPlatform: 3,
    baseFromPHP: 350,
    serviceTypeCodes: ['carwash', 'mobile_carwash'],
    coverageCityIds: ['18', '969', '1002'],
  },
  {
    id: 'p-clean-quarters',
    businessName: 'Clean Quarters PH',
    blurb: 'Specialists in condo, apartment, and Airbnb turnover cleaning.',
    ratingAverage: 4.7,
    ratingCount: 894,
    yearsOnPlatform: 2,
    baseFromPHP: 1200,
    serviceTypeCodes: [
      'condo_cleaning',
      'apartment_cleaning',
      'airbnb_rental_turnover_cleaning',
      'house_cleaning',
    ],
    coverageCityIds: ['18', '969', '1002'],
  },
  {
    id: 'p-coolair',
    businessName: 'CoolAir Pros',
    blurb: 'Licensed technicians for aircon cleaning and tune-ups.',
    ratingAverage: 4.9,
    ratingCount: 502,
    yearsOnPlatform: 1,
    baseFromPHP: 650,
    serviceTypeCodes: ['aircon_cleaning'],
    coverageCityIds: ['969', '1002'],
  },
  {
    id: 'p-aqua-pool',
    businessName: 'Aqua Pool Care',
    blurb: 'Weekly pool maintenance and one-off resets.',
    ratingAverage: 4.6,
    ratingCount: 211,
    yearsOnPlatform: 2,
    baseFromPHP: 2500,
    serviceTypeCodes: ['pool_cleaning'],
    coverageCityIds: ['969'],
  },
  {
    id: 'p-fresh-laundry',
    businessName: 'Fresh & Fold Laundry',
    blurb: 'Pickup-and-deliver laundry, ready in 24 hours.',
    ratingAverage: 4.5,
    ratingCount: 1801,
    yearsOnPlatform: 4,
    baseFromPHP: 180,
    serviceTypeCodes: ['laundry', 'dry_cleaning'],
    coverageCityIds: ['18', '969', '1002'],
  },
  {
    id: 'p-no-packages',
    businessName: 'Quirky Cleans Studio',
    blurb: 'Boutique cleaning — everything is a custom quote.',
    ratingAverage: 4.4,
    ratingCount: 78,
    yearsOnPlatform: 1,
    baseFromPHP: null,
    serviceTypeCodes: [
      'house_cleaning',
      'condo_cleaning',
      'post_construction_cleaning',
    ],
    coverageCityIds: ['18', '969', '1002'],
  },
];

const PACKAGES: StubPackage[] = [
  {
    id: 'pk-bright-standard',
    partnerId: 'p-bright-shine',
    serviceTypeCode: 'carwash',
    name: 'Standard Wash',
    priceFromPHP: 350,
    durationMinutes: 45,
    description:
      'Exterior soap, rinse, and hand-dry. Tyre dressing and interior vacuum.',
    inclusions: ['Exterior wash', 'Hand dry', 'Tyre dressing', 'Vacuum interior'],
  },
  {
    id: 'pk-bright-premium',
    partnerId: 'p-bright-shine',
    serviceTypeCode: 'carwash',
    name: 'Premium Detail',
    priceFromPHP: 1100,
    durationMinutes: 120,
    description:
      'Full exterior detail plus interior shampoo and dashboard polish.',
    inclusions: [
      'Clay bar exterior',
      'Tyre dressing',
      'Interior shampoo',
      'Dashboard polish',
      'Glass clean inside + out',
    ],
    popular: true,
  },
  {
    id: 'pk-clean-condo',
    partnerId: 'p-clean-quarters',
    serviceTypeCode: 'condo_cleaning',
    name: 'Studio / 1-BR Refresh',
    priceFromPHP: 1200,
    durationMinutes: 180,
    description: 'Top-to-bottom condo cleaning for studios and 1-bedroom units.',
    inclusions: ['Living + bedroom', 'Bathroom deep clean', 'Kitchen surfaces', 'Floor mop'],
  },
  {
    id: 'pk-clean-2br',
    partnerId: 'p-clean-quarters',
    serviceTypeCode: 'condo_cleaning',
    name: '2-BR Deep Clean',
    priceFromPHP: 2200,
    durationMinutes: 300,
    description: 'Full deep clean for 2-bedroom condos and apartments.',
    inclusions: [
      '2 bedrooms',
      '2 bathrooms deep clean',
      'Kitchen + appliances',
      'Window tracks',
    ],
    popular: true,
  },
  {
    id: 'pk-coolair-split',
    partnerId: 'p-coolair',
    serviceTypeCode: 'aircon_cleaning',
    name: 'Split-Type Clean (1 unit)',
    priceFromPHP: 650,
    durationMinutes: 60,
    description: 'Filter, blower, and drain pan deep-clean with chemical wash.',
    inclusions: ['Chemical wash', 'Filter clean', 'Drain pan flush', 'Performance test'],
  },
  {
    id: 'pk-aqua-monthly',
    partnerId: 'p-aqua-pool',
    serviceTypeCode: 'pool_cleaning',
    name: 'Monthly Maintenance',
    priceFromPHP: 4500,
    durationMinutes: 240,
    description: 'Weekly visits across the month — skimming, vacuum, chemistry.',
    inclusions: ['4 visits / month', 'Chemical balance', 'Skim + vacuum', 'Filter check'],
    popular: true,
  },
  {
    id: 'pk-fresh-perkg',
    partnerId: 'p-fresh-laundry',
    serviceTypeCode: 'laundry',
    name: 'Wash, Dry & Fold (per kg)',
    priceFromPHP: 180,
    durationMinutes: 1440,
    description: 'Drop-off or pickup. 24-hour turnaround in metro cities.',
    inclusions: ['Pickup option', 'Wash + dry', 'Fold + bag', '24h turnaround'],
  },
];

export function getStubPackagesForPartner(
  partnerId: string,
  serviceTypeCode?: string | null
): StubPackage[] {
  return PACKAGES.filter(
    (pk) =>
      pk.partnerId === partnerId &&
      (serviceTypeCode ? pk.serviceTypeCode === serviceTypeCode : true)
  );
}

export function findStubPartner(partnerId: string): StubPartner | undefined {
  return STUB_PARTNERS.find((p) => p.id === partnerId);
}

export function listStubPartnersFor(
  serviceTypeCode: string | null,
  // City is intentionally ignored in the stub: real coverage filtering lives
  // on the backend, and we want every search in the demo to surface results.
  _coverageCityId: string | null
): StubPartner[] {
  const matching = STUB_PARTNERS.filter(
    (p) =>
      !serviceTypeCode || p.serviceTypeCodes.includes(serviceTypeCode)
  );
  // Fallback to the full list if a service code has no matches, so the UI
  // is never empty while we're still wiring real data.
  return matching.length > 0 ? matching : STUB_PARTNERS;
}

export function pickStubAutoAssignedPartner(
  serviceTypeCode: string | null,
  coverageCityId: string | null
): StubPartner | undefined {
  const candidates = listStubPartnersFor(serviceTypeCode, coverageCityId);
  if (candidates.length === 0) return undefined;
  // For UI work we just take the first. The backend will pick by rotation,
  // capacity, rating, etc.
  return candidates[0];
}
