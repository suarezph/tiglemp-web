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
    blurb: 'Boutique cleaning crew with eco-friendly products and a signature deep clean.',
    ratingAverage: 4.4,
    ratingCount: 78,
    yearsOnPlatform: 1,
    baseFromPHP: 900,
    serviceTypeCodes: [
      'house_cleaning',
      'condo_cleaning',
      'airbnb_rental_turnover_cleaning',
      'post_construction_cleaning',
    ],
    coverageCityIds: ['18', '969', '1002'],
  },
];

const PACKAGES: StubPackage[] = [
  // --- Bright Shine Carwash ---
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
  {
    id: 'pk-fresh-dryclean',
    partnerId: 'p-fresh-laundry',
    serviceTypeCode: 'dry_cleaning',
    name: 'Dry-clean (per piece)',
    priceFromPHP: 220,
    durationMinutes: 2880,
    description: 'Professional dry-clean for suits, gowns, and delicates.',
    inclusions: ['Pickup option', 'Per-piece pricing', '48h turnaround', 'Eco solvents'],
  },

  // --- Clean Quarters PH (condo / apartment / Airbnb / house) ---
  {
    id: 'pk-clean-apartment',
    partnerId: 'p-clean-quarters',
    serviceTypeCode: 'apartment_cleaning',
    name: 'Apartment Refresh',
    priceFromPHP: 1500,
    durationMinutes: 240,
    description: 'General cleaning for apartments up to 60 sqm.',
    inclusions: ['Living + bedroom', 'Kitchen + bath', 'Floor mop', 'Window wipe'],
  },
  {
    id: 'pk-clean-airbnb-standard',
    partnerId: 'p-clean-quarters',
    serviceTypeCode: 'airbnb_rental_turnover_cleaning',
    name: 'Standard Turnover',
    priceFromPHP: 950,
    durationMinutes: 150,
    description: 'Fast reset for studios + 1-BR units between guest stays.',
    inclusions: [
      'Linen change',
      'Bath + kitchen reset',
      'Trash out',
      'Photo report',
    ],
  },
  {
    id: 'pk-clean-airbnb-deep',
    partnerId: 'p-clean-quarters',
    serviceTypeCode: 'airbnb_rental_turnover_cleaning',
    name: 'Deep Turnover',
    priceFromPHP: 1700,
    durationMinutes: 240,
    description:
      'For long stays, end-of-month resets, or before VIP guest arrivals.',
    inclusions: [
      'Linen change',
      'Deep bathroom clean',
      'Kitchen + appliances',
      'Restock essentials',
      'Photo report',
    ],
    popular: true,
  },
  {
    id: 'pk-clean-house',
    partnerId: 'p-clean-quarters',
    serviceTypeCode: 'house_cleaning',
    name: 'House Clean',
    priceFromPHP: 1800,
    durationMinutes: 270,
    description: 'Top-to-bottom clean for 2-3 BR homes.',
    inclusions: ['Up to 3 BR', '2 bathrooms', 'Kitchen surfaces', 'Floor mop'],
  },

  // --- Quirky Cleans Studio (house / condo / post-construction) ---
  {
    id: 'pk-quirky-house-light',
    partnerId: 'p-no-packages',
    serviceTypeCode: 'house_cleaning',
    name: 'Light Maintenance Clean',
    priceFromPHP: 900,
    durationMinutes: 120,
    description: 'A boutique tidy-up — perfect for in-between deep cleans.',
    inclusions: ['Dust + wipe', 'Bath + kitchen tidy', 'Floor mop', 'Eco products'],
  },
  {
    id: 'pk-quirky-house-deep',
    partnerId: 'p-no-packages',
    serviceTypeCode: 'house_cleaning',
    name: 'Signature Deep Clean',
    priceFromPHP: 2400,
    durationMinutes: 360,
    description:
      'Boutique deep clean with eco-friendly products, oven and fridge included.',
    inclusions: [
      'Oven + fridge',
      'Window tracks',
      'Cabinet wipe-down',
      'Eco products',
      'Aromatherapy finish',
    ],
    popular: true,
  },
  {
    id: 'pk-quirky-airbnb',
    partnerId: 'p-no-packages',
    serviceTypeCode: 'airbnb_rental_turnover_cleaning',
    name: 'Boutique Turnover',
    priceFromPHP: 1400,
    durationMinutes: 180,
    description:
      'Hand-styled turnover with linen change, restock, and a welcome note.',
    inclusions: [
      'Linen change',
      'Restock essentials',
      'Welcome note',
      'Photo report',
    ],
  },
  {
    id: 'pk-quirky-postcon',
    partnerId: 'p-no-packages',
    serviceTypeCode: 'post_construction_cleaning',
    name: 'Post-Reno Detail',
    priceFromPHP: 3800,
    durationMinutes: 480,
    description:
      'Dust-out and detail clean after renovations or build-outs.',
    inclusions: [
      'Dust extraction',
      'Surface polish',
      'Grout + tile',
      'Window tracks',
    ],
  },

  // --- CoolAir Pros (extra package) ---
  {
    id: 'pk-coolair-window',
    partnerId: 'p-coolair',
    serviceTypeCode: 'aircon_cleaning',
    name: 'Window-Type Clean (1 unit)',
    priceFromPHP: 450,
    durationMinutes: 45,
    description: 'Filter, fins, and drain clean for window-type aircons.',
    inclusions: ['Filter clean', 'Fin wash', 'Drain flush', 'Performance test'],
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
